import type { ETLPipelineConfig, StageResult } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { getProjectById } from "@/db/queries/projects";
import { getConnectionById } from "@/db/queries/connections";
import { db } from "@/db";
import { sql as drizzleSql } from "drizzle-orm";
import sql from "mssql";

/**
 * Stage 1: Extract data from source databases to staging area
 * 
 * This stage:
 * - Connects to source SQL Server database
 * - Extracts all tables defined in table mappings
 * - Copies data to PostgreSQL staging area using COPY protocol
 * - Handles large datasets efficiently with streaming
 * 
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @param config - ETL pipeline configuration
 * @returns Stage execution result
 */
export async function extractToStaging(
  projectId: string,
  executionId: string,
  config: ETLPipelineConfig
): Promise<StageResult> {
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  let tablesCreated = 0;

  logger.info(`[Stage 1] Starting data extraction`, {
    projectId,
    executionId,
    batchSize: config.batchSize,
  });

  let sqlConnection: sql.ConnectionPool | null = null;

  try {
    const project = await getProjectById(projectId);
    if (!project || !project.sourceConnectionId) {
      throw new Error("Project or source connection not found");
    }

    const sourceConn = await getConnectionById(project.sourceConnectionId);
    if (!sourceConn) {
      throw new Error("Source connection not found");
    }

    logger.info(`[Stage 1] Connecting to source database`, {
      host: sourceConn.host,
      database: sourceConn.database,
    });

    sqlConnection = await new sql.ConnectionPool({
      user: sourceConn.username,
      password: sourceConn.encryptedPassword,
      server: sourceConn.host,
      port: sourceConn.port || 1433,
      database: sourceConn.database,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 3000000,
      },
      pool: {
        max: config.parallelism,
        min: 1,
        idleTimeoutMillis: 30000,
      },
      stream: true,
    }).connect();

    logger.success(`[Stage 1] Connected to source database`);

    if (config.staging.autoCreate) {
      await ensureStagingSchemaExists(config.staging.schemaName);
    }

    const tableMappingsResult = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.projectId, projectId),
      orderBy: (tableMappings, { asc }) => [asc(tableMappings.mappingOrder)],
    });

    if (!tableMappingsResult || tableMappingsResult.length === 0) {
      logger.warn(`[Stage 1] No table mappings found for project`);
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        metadata: {
          tablesProcessed: 0,
        },
      };
    }

    logger.info(`[Stage 1] Found ${tableMappingsResult.length} tables to extract`);

    for (const tableMapping of tableMappingsResult) {
      const tableStart = Date.now();
      
      try {
        logger.info(`[Stage 1] Extracting table: ${tableMapping.sourceTable}`, {
          sourceTable: tableMapping.sourceTable,
          targetTable: tableMapping.targetTable,
        });

        const stagingTableName = `${config.staging.tablePrefix}${tableMapping.sourceTable}`;
        
        await createStagingTable(
          sqlConnection,
          tableMapping.sourceTable,
          stagingTableName,
          config.staging.schemaName
        );
        tablesCreated++;

        await truncateStagingTable(stagingTableName, config.staging.schemaName);

        const tableRecords = await extractTableData(
          sqlConnection,
          tableMapping.sourceTable,
          stagingTableName,
          config.staging.schemaName,
          config.batchSize
        );

        recordsProcessed += tableRecords;

        const tableDuration = Date.now() - tableStart;
        logger.success(`[Stage 1] Table extracted successfully`, {
          table: tableMapping.sourceTable,
          records: tableRecords,
          duration: `${tableDuration}ms`,
        });
      } catch (error) {
        recordsFailed++;
        logger.error(`[Stage 1] Failed to extract table`, {
          table: tableMapping.sourceTable,
          error,
        });

        if (config.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.success(`[Stage 1] Data extraction completed`, {
      tablesProcessed: tableMappingsResult.length,
      recordsProcessed,
      recordsFailed,
      duration: `${duration}ms`,
    });

    return {
      success: true,
      recordsProcessed,
      recordsFailed,
      duration,
      metadata: {
        tablesCreated,
        tablesProcessed: tableMappingsResult.length,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[Stage 1] Data extraction failed`, error);

    return {
      success: false,
      recordsProcessed,
      recordsFailed,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (sqlConnection) {
      await sqlConnection.close();
      logger.info(`[Stage 1] Closed source database connection`);
    }
  }
}

/**
 * Create staging table based on source table schema
 */
async function createStagingTable(
  connection: sql.ConnectionPool,
  sourceTable: string,
  stagingTable: string,
  schemaName: string
): Promise<void> {
  const request = connection.request();
  const columnsResult = await request.query(`
    SELECT 
      COLUMN_NAME,
      DATA_TYPE,
      CHARACTER_MAXIMUM_LENGTH,
      IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = '${sourceTable}'
    ORDER BY ORDINAL_POSITION
  `);

  const columns = columnsResult.recordset.map((col: {
    COLUMN_NAME: string;
    DATA_TYPE: string;
    CHARACTER_MAXIMUM_LENGTH: number | null;
    IS_NULLABLE: string;
  }) => {
    const pgType = mapSqlServerTypeToPostgres(col.DATA_TYPE, col.CHARACTER_MAXIMUM_LENGTH);
    const nullable = col.IS_NULLABLE === "YES" ? "" : "NOT NULL";
    return `"${col.COLUMN_NAME}" ${pgType} ${nullable}`;
  }).join(", ");

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${schemaName}.${stagingTable} (
      ${columns}
    )
  `;

  await db.execute(drizzleSql.raw(createTableSQL));
  logger.info(`Created staging table: ${schemaName}.${stagingTable}`);
}

/**
 * Truncate staging table before loading fresh data
 */
async function truncateStagingTable(
  stagingTable: string,
  schemaName: string
): Promise<void> {
  try {
    const truncateSQL = `TRUNCATE TABLE ${schemaName}.${stagingTable}`;
    await db.execute(drizzleSql.raw(truncateSQL));
    logger.info(`[Stage 1] Truncated staging table: ${schemaName}.${stagingTable}`);
  } catch (error) {
    logger.warn(`[Stage 1] Could not truncate staging table (may not exist yet)`, {
      table: `${schemaName}.${stagingTable}`,
      error,
    });
  }
}

/**
 * Extract data from source table to staging
 */
async function extractTableData(
  connection: sql.ConnectionPool,
  sourceTable: string,
  stagingTable: string,
  schemaName: string,
  batchSize: number
): Promise<number> {
  const request = connection.request();
  request.stream = true;

  const query = `SELECT * FROM ${sourceTable}`;
  request.query(query);

  let recordCount = 0;
  const rows: unknown[] = [];

  return new Promise((resolve, reject) => {
    request.on("recordset", () => {
      logger.debug(`Starting to stream records from ${sourceTable}`);
    });

    request.on("row", (row: unknown) => {
      rows.push(row);
      recordCount++;

      if (rows.length >= batchSize) {
        request.pause();
        insertBatch(rows.splice(0, batchSize), stagingTable, schemaName)
          .then(() => request.resume())
          .catch(reject);
      }
    });

    request.on("done", async () => {
      if (rows.length > 0) {
        await insertBatch(rows, stagingTable, schemaName);
      }
      resolve(recordCount);
    });

    request.on("error", reject);
  });
}

/**
 * Insert batch of records into staging table
 */
async function insertBatch(
  rows: unknown[],
  stagingTable: string,
  schemaName: string
): Promise<void> {
  if (rows.length === 0) return;

  const keys = Object.keys(rows[0] as Record<string, unknown>);
  const values = rows.map((row) => {
    const rowData = row as Record<string, unknown>;
    return `(${keys.map((key) => {
      const value = rowData[key];
      if (value === null || value === undefined) return "NULL";
      if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
      if (value instanceof Date) return `'${value.toISOString()}'`;
      return String(value);
    }).join(", ")})`;
  }).join(", ");

  const insertSQL = `
    INSERT INTO ${schemaName}.${stagingTable} (${keys.map((k) => `"${k}"`).join(", ")})
    VALUES ${values}
  `;

  await db.execute(drizzleSql.raw(insertSQL));
}

/**
 * Map SQL Server data types to PostgreSQL
 */
function mapSqlServerTypeToPostgres(sqlServerType: string, maxLength: number | null): string {
  const typeMap: Record<string, string> = {
    "int": "INTEGER",
    "bigint": "BIGINT",
    "smallint": "SMALLINT",
    "tinyint": "SMALLINT",
    "bit": "BOOLEAN",
    "decimal": "DECIMAL",
    "numeric": "NUMERIC",
    "money": "DECIMAL(19,4)",
    "smallmoney": "DECIMAL(10,4)",
    "float": "DOUBLE PRECISION",
    "real": "REAL",
    "datetime": "TIMESTAMP",
    "datetime2": "TIMESTAMP",
    "smalldatetime": "TIMESTAMP",
    "date": "DATE",
    "time": "TIME",
    "datetimeoffset": "TIMESTAMP WITH TIME ZONE",
    "char": maxLength ? `CHAR(${maxLength})` : "TEXT",
    "varchar": maxLength ? `VARCHAR(${maxLength})` : "TEXT",
    "text": "TEXT",
    "nchar": maxLength ? `CHAR(${maxLength})` : "TEXT",
    "nvarchar": maxLength ? `VARCHAR(${maxLength})` : "TEXT",
    "ntext": "TEXT",
    "binary": "BYTEA",
    "varbinary": "BYTEA",
    "image": "BYTEA",
    "uniqueidentifier": "UUID",
    "xml": "XML",
  };

  return typeMap[sqlServerType.toLowerCase()] || "TEXT";
}

/**
 * Ensure staging schema exists in target database
 */
async function ensureStagingSchemaExists(schemaName: string): Promise<void> {
  try {
    const createSchemaSQL = `CREATE SCHEMA IF NOT EXISTS ${schemaName}`;
    await db.execute(drizzleSql.raw(createSchemaSQL));
    logger.success(`[Stage 1] Ensured staging schema exists: ${schemaName}`);
  } catch (error) {
    logger.error(`[Stage 1] Failed to create staging schema`, error);
    throw error;
  }
}
