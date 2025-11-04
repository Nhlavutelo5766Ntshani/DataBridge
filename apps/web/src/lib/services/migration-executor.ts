import postgres from "postgres";
import mssql from "mssql";
import mysql from "mysql2/promise";
import type { SchemaDiscoveryConnection } from "@/lib/types/schema";
import type { TableMapping, ColumnMapping } from "@/db/queries/mappings";
import { applyTransformation } from "@/lib/services/transformation-engine";
import type { TransformationConfig } from "@/lib/types/transformation";
import type { MigrationJobResult } from "@/lib/queue/config";
import { db } from "@/db";
import { migrationExecutions } from "@databridge/schema";
import { eq } from "drizzle-orm";

/**
 * Migration progress callback
 */
type ProgressCallback = (progress: number) => Promise<void>;

/**
 * Execute migration for a table mapping
 * @param projectId - Project ID
 * @param tableMappingId - Table mapping ID
 * @param batchSize - Number of rows per batch
 * @param onProgress - Progress callback
 * @returns Migration result
 */
export async function executeMigration(
  projectId: string,
  tableMappingId: string,
  batchSize: number,
  onProgress: ProgressCallback
): Promise<MigrationJobResult> {
  const project = await db.query.mappingProjects.findFirst({
    where: (projects, { eq }) => eq(projects.id, projectId),
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (!project.sourceConnectionId || !project.targetConnectionId) {
    throw new Error("Project is missing source or target connection");
  }

  const sourceConn = await db.query.connections.findFirst({
    where: (connections, { eq }) => eq(connections.id, project.sourceConnectionId!),
  });

  const targetConn = await db.query.connections.findFirst({
    where: (connections, { eq }) => eq(connections.id, project.targetConnectionId!),
  });

  if (!sourceConn || !targetConn) {
    throw new Error("Connection not found");
  }

  const tableMapping = await db.query.tableMappings.findFirst({
    where: (tableMappings, { eq }) => eq(tableMappings.id, tableMappingId),
  });

  if (!tableMapping) {
    throw new Error("Table mapping not found");
  }

  const columnMappings = await db.query.columnMappings.findMany({
    where: (columnMappings, { eq }) => eq(columnMappings.tableMappingId, tableMappingId),
  });

  const executionResult = await db
    .insert(migrationExecutions)
    .values({
      projectId,
      executedBy: project.userId,
      status: "running",
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
    })
    .returning();

  const execution = executionResult[0];

  try {
    const result = await migrateTable(
      {
        dbType: sourceConn.dbType,
        host: sourceConn.host,
        port: sourceConn.port,
        database: sourceConn.database,
        username: sourceConn.username,
        password: sourceConn.encryptedPassword,
      },
      {
        dbType: targetConn.dbType,
        host: targetConn.host,
        port: targetConn.port,
        database: targetConn.database,
        username: targetConn.username,
        password: targetConn.encryptedPassword,
      },
      tableMapping,
      columnMappings,
      batchSize,
      onProgress
    );

    await db
      .update(migrationExecutions)
      .set({
        status: result.success ? "completed" : "failed",
        processedRecords: result.rowsProcessed,
        failedRecords: result.rowsFailed,
        totalRecords: result.rowsProcessed + result.rowsFailed,
        completedAt: new Date(),
      })
      .where(eq(migrationExecutions.id, execution.id));

    return {
      ...result,
      executionId: execution.id,
    };
  } catch (error) {
    await db
      .update(migrationExecutions)
      .set({
        status: "failed",
        completedAt: new Date(),
      })
      .where(eq(migrationExecutions.id, execution.id));

    throw error;
  }
}

/**
 * Migrate table data
 * @param sourceConnection - Source connection
 * @param targetConnection - Target connection
 * @param tableMapping - Table mapping
 * @param columnMappings - Column mappings
 * @param batchSize - Batch size
 * @param onProgress - Progress callback
 * @returns Migration result
 */
async function migrateTable(
  sourceConnection: SchemaDiscoveryConnection,
  targetConnection: SchemaDiscoveryConnection,
  tableMapping: TableMapping,
  columnMappings: ColumnMapping[],
  batchSize: number,
  onProgress: ProgressCallback
): Promise<Omit<MigrationJobResult, "executionId">> {
  const sourceDbType = sourceConnection.dbType.toLowerCase();
  const targetDbType = targetConnection.dbType.toLowerCase();

  if (sourceDbType !== "postgresql" && sourceDbType !== "sqlserver" && sourceDbType !== "mysql") {
    throw new Error(`Unsupported source database type: ${sourceConnection.dbType}`);
  }

  if (targetDbType !== "postgresql" && targetDbType !== "sqlserver" && targetDbType !== "mysql") {
    throw new Error(`Unsupported target database type: ${targetConnection.dbType}`);
  }

  let rowsProcessed = 0;
  let rowsFailed = 0;
  const errors: string[] = [];

  const totalRows = await getTableRowCount(sourceConnection, tableMapping.sourceTable);
  let offset = 0;

  while (offset < totalRows) {
    try {
      const sourceRows = await fetchBatchData(
        sourceConnection,
        tableMapping.sourceTable,
        batchSize,
        offset
      );

      if (sourceRows.length === 0) break;

      const transformedRows: Record<string, unknown>[] = [];

      for (const sourceRow of sourceRows) {
        const targetRow: Record<string, unknown> = {};

        for (const columnMapping of columnMappings) {
          const config = columnMapping.transformationConfig as TransformationConfig | null;

          if (config?.type === "EXCLUDE_COLUMN") continue;

          const sourceValue = sourceRow[columnMapping.sourceColumn];
          let transformedValue = sourceValue;

          if (config) {
            transformedValue = applyTransformation(sourceValue, config);
          }

          targetRow[columnMapping.targetColumn] = transformedValue;
        }

        transformedRows.push(targetRow);
      }

      await insertBatchData(
        targetConnection,
        tableMapping.targetTable,
        transformedRows
      );

      rowsProcessed += sourceRows.length;
      offset += batchSize;

      const progress = Math.round((rowsProcessed / totalRows) * 100);
      await onProgress(progress);
    } catch (error) {
      rowsFailed += batchSize;
      errors.push(error instanceof Error ? error.message : String(error));
      offset += batchSize;
    }
  }

  return {
    success: rowsFailed === 0,
    rowsProcessed,
    rowsFailed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Fetch batch of data
 * @param connection - Database connection
 * @param tableName - Table name
 * @param limit - Batch size
 * @param offset - Offset
 * @returns Array of rows
 */
async function fetchBatchData(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  const dbType = connection.dbType.toLowerCase();

  switch (dbType) {
    case "postgresql":
      return await fetchPostgreSQLBatch(connection, tableName, limit, offset);
    case "sqlserver":
      return await fetchSQLServerBatch(connection, tableName, limit, offset);
    case "mysql":
      return await fetchMySQLBatch(connection, tableName, limit, offset);
    default:
      return [];
  }
}

/**
 * Fetch PostgreSQL batch
 * @param connection - PostgreSQL connection
 * @param tableName - Table name
 * @param limit - Batch size
 * @param offset - Offset
 * @returns Array of rows
 */
async function fetchPostgreSQLBatch(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  const connectionString = `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const sql = postgres(connectionString, { max: 1, connect_timeout: 10 });

  try {
    const rows = await sql`SELECT * FROM ${sql(tableName)} LIMIT ${limit} OFFSET ${offset}`;
    await sql.end();
    return rows as Record<string, unknown>[];
  } catch (error) {
    await sql.end();
    throw error;
  }
}

/**
 * Fetch SQL Server batch
 * @param connection - SQL Server connection
 * @param tableName - Table name
 * @param limit - Batch size
 * @param offset - Offset
 * @returns Array of rows
 */
async function fetchSQLServerBatch(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  const config: mssql.config = {
    server: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 10000,
    },
  };

  const pool = await mssql.connect(config);

  try {
    const result = await pool
      .request()
      .query(
        `SELECT * FROM ${tableName} ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
      );

    await pool.close();
    return result.recordset as Record<string, unknown>[];
  } catch (error) {
    await pool.close();
    throw error;
  }
}

/**
 * Fetch MySQL batch
 * @param connection - MySQL connection
 * @param tableName - Table name
 * @param limit - Batch size
 * @param offset - Offset
 * @returns Array of rows
 */
async function fetchMySQLBatch(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  const mysqlConnection = await mysql.createConnection({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    connectTimeout: 10000,
  });

  try {
    const [rows] = await mysqlConnection.query(
      `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    await mysqlConnection.end();
    return rows as Record<string, unknown>[];
  } catch (error) {
    await mysqlConnection.end();
    throw error;
  }
}

/**
 * Insert batch of data
 * @param connection - Database connection
 * @param tableName - Table name
 * @param rows - Rows to insert
 */
async function insertBatchData(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;

  const dbType = connection.dbType.toLowerCase();

  switch (dbType) {
    case "postgresql":
      await insertPostgreSQLBatch(connection, tableName, rows);
      break;
    case "sqlserver":
      await insertSQLServerBatch(connection, tableName, rows);
      break;
    case "mysql":
      await insertMySQLBatch(connection, tableName, rows);
      break;
  }
}

/**
 * Insert PostgreSQL batch
 * @param connection - PostgreSQL connection
 * @param tableName - Table name
 * @param rows - Rows to insert
 */
async function insertPostgreSQLBatch(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const connectionString = `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const sql = postgres(connectionString, { max: 1, connect_timeout: 10 });

  try {
    await sql`INSERT INTO ${sql(tableName)} ${sql(rows)}`;
    await sql.end();
  } catch (error) {
    await sql.end();
    throw error;
  }
}

/**
 * Insert SQL Server batch
 * @param connection - SQL Server connection
 * @param tableName - Table name
 * @param rows - Rows to insert
 */
async function insertSQLServerBatch(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const config: mssql.config = {
    server: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 10000,
    },
  };

  const pool = await mssql.connect(config);

  try {
    const columns = Object.keys(rows[0]);
    const table = new mssql.Table(tableName);
    
    for (const col of columns) {
      table.columns.add(col, mssql.NVarChar);
    }
    
    for (const row of rows) {
      table.rows.add(...columns.map(col => row[col] as string | number | boolean | Date | Buffer | null));
    }

    await pool.request().bulk(table);
    await pool.close();
  } catch (error) {
    await pool.close();
    throw error;
  }
}

/**
 * Insert MySQL batch
 * @param connection - MySQL connection
 * @param tableName - Table name
 * @param rows - Rows to insert
 */
async function insertMySQLBatch(
  connection: SchemaDiscoveryConnection,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const mysqlConnection = await mysql.createConnection({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    connectTimeout: 10000,
  });

  try {
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;

    for (const row of rows) {
      const values = columns.map(col => row[col]);
      await mysqlConnection.query(sql, values);
    }

    await mysqlConnection.end();
  } catch (error) {
    await mysqlConnection.end();
    throw error;
  }
}

/**
 * Get table row count
 * @param connection - Database connection
 * @param tableName - Table name
 * @returns Row count
 */
async function getTableRowCount(
  connection: SchemaDiscoveryConnection,
  tableName: string
): Promise<number> {
  const dbType = connection.dbType.toLowerCase();

  switch (dbType) {
    case "postgresql": {
      const connectionString = `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
      const sql = postgres(connectionString, { max: 1, connect_timeout: 10 });
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        await sql.end();
        return Number(result[0].count);
      } catch {
        await sql.end();
        return 0;
      }
    }
    case "sqlserver": {
      const config: mssql.config = {
        server: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          connectTimeout: 10000,
        },
      };
      const pool = await mssql.connect(config);
      try {
        const result = await pool.request().query(`SELECT COUNT(*) as count FROM ${tableName}`);
        await pool.close();
        return result.recordset[0].count;
      } catch {
        await pool.close();
        return 0;
      }
    }
    case "mysql": {
      const mysqlConnection = await mysql.createConnection({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        connectTimeout: 10000,
      });
      try {
        const [rows] = await mysqlConnection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        await mysqlConnection.end();
        const result = rows as { count: number }[];
        return result[0].count;
      } catch {
        await mysqlConnection.end();
        return 0;
      }
    }
    default:
      return 0;
  }
}

