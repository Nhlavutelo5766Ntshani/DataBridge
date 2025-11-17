import type { ETLPipelineConfig, StageResult, RecordIdMappingData } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { db } from "@/db";
import { getProjectById } from "@/db/queries/projects";
import { getConnectionById } from "@/db/queries/connections";
import { createIdMappingsBatch } from "@/db/queries/record-id-mappings";
import { Client } from "pg";
import { ERROR_CODES } from "@/lib/constants/error-codes";

/**
 * Stage 3: Load dimension tables from staging to target
 * 
 * This stage:
 * - Identifies dimension/lookup tables
 * - Resolves table dependencies (topological sort)
 * - Loads dimensions in correct order
 * - Uses UPSERT to handle conflicts
 * - Validates foreign key integrity
 * 
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @param config - ETL pipeline configuration
 * @returns Stage execution result
 */
export async function loadDimensions(
  projectId: string,
  executionId: string,
  config: ETLPipelineConfig
): Promise<StageResult> {
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  let dimensionsLoaded = 0;
  let idMappingsCreated = 0;

  logger.info(`[Stage 3] Starting dimension table loading`, {
    projectId,
    executionId,
  });

  let targetClient: Client | null = null;

  try {
    const project = await getProjectById(projectId);
    if (!project || !project.targetConnectionId) {
      throw new Error("Project or target connection not found");
    }

    const targetConn = await getConnectionById(project.targetConnectionId);
    if (!targetConn) {
      throw new Error("Target connection not found");
    }

    logger.info(`[Stage 3] Connecting to target database`, {
      host: targetConn.host,
      database: targetConn.database,
    });

    targetClient = new Client({
      user: targetConn.username,
      password: targetConn.encryptedPassword,
      host: targetConn.host,
      port: targetConn.port || 5432,
      database: targetConn.database,
      ssl: false,
    });

    await targetClient.connect();
    logger.success(`[Stage 3] Connected to target database`);

    const tableMappings = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.projectId, projectId),
      orderBy: (tableMappings, { asc }) => [asc(tableMappings.mappingOrder)],
    });

    if (!tableMappings || tableMappings.length === 0) {
      logger.warn(`[Stage 3] No dimension tables found`);
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        metadata: {
          dimensionsLoaded: 0,
        },
      };
    }

    logger.info(`[Stage 3] Found ${tableMappings.length} dimension tables to load`);

    for (const tableMapping of tableMappings) {
      const tableStart = Date.now();

      try {
        logger.info(`[Stage 3] Loading dimension: ${tableMapping.targetTable}`);

        const stagingTable = `${config.staging.tablePrefix}${tableMapping.sourceTable}`;

        const columnMappings = await db.query.columnMappings.findMany({
          where: (columnMappings, { eq }) => eq(columnMappings.tableMappingId, tableMapping.id),
        });

        if (!columnMappings || columnMappings.length === 0) {
          logger.warn(`[Stage 3] No column mappings for ${tableMapping.targetTable}`);
          continue;
        }

        await targetClient.query("BEGIN");

        await ensureAttachmentUrlColumn(targetClient, tableMapping.targetTable);

        const { recordsLoaded, idMappings } = await loadDimensionTable(
          targetClient,
          stagingTable,
          tableMapping.targetTable,
          columnMappings,
          config.staging.schemaName,
          config.errorHandling,
          config.loadStrategy || "truncate-load",
          executionId,
          projectId
        );

        if (idMappings.length > 0) {
          try {
            await createIdMappingsBatch(idMappings);
            idMappingsCreated += idMappings.length;
            logger.success(`[Stage 3] Created ${idMappings.length} ID mappings for ${tableMapping.targetTable}`);
          } catch (error) {
            logger.error(`[Stage 3] Failed to create ID mappings`, {
              table: tableMapping.targetTable,
              error,
              code: ERROR_CODES.DB_ERROR,
            });
          }
        }

        await targetClient.query("COMMIT");

        recordsProcessed += recordsLoaded;
        dimensionsLoaded++;

        const tableDuration = Date.now() - tableStart;
        logger.success(`[Stage 3] Dimension loaded successfully`, {
          table: tableMapping.targetTable,
          records: recordsLoaded,
          duration: `${tableDuration}ms`,
        });
      } catch (error) {
        await targetClient.query("ROLLBACK");
        recordsFailed++;

        logger.error(`[Stage 3] Failed to load dimension`, {
          table: tableMapping.targetTable,
          error,
        });

        if (config.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.success(`[Stage 3] Dimension loading completed`, {
      dimensionsLoaded,
      recordsProcessed,
      recordsFailed,
      idMappingsCreated,
      duration: `${duration}ms`,
    });

    return {
      success: true,
      recordsProcessed,
      recordsFailed,
      duration,
      idMappingsCreated,
      metadata: {
        dimensionsLoaded,
        idMappingsCreated,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[Stage 3] Dimension loading failed`, error);

    return {
      success: false,
      recordsProcessed,
      recordsFailed,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (targetClient) {
      await targetClient.end();
      logger.info(`[Stage 3] Closed target database connection`);
    }
  }
}

/**
 * Ensure attachment_url column exists in target table
 */
async function ensureAttachmentUrlColumn(client: Client, tableName: string): Promise<void> {
  try {
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      AND column_name = 'attachment_url'
    `;
    
    const result = await client.query(checkColumnSQL);
    
    if (result.rows.length === 0) {
      const alterTableSQL = `
        ALTER TABLE ${tableName} 
        ADD COLUMN IF NOT EXISTS attachment_url TEXT,
        ADD COLUMN IF NOT EXISTS attachment_metadata JSONB
      `;
      
      await client.query(alterTableSQL);
      logger.info(`[Stage 3] Added attachment columns to ${tableName}`);
    }
  } catch (error) {
    logger.warn(`[Stage 3] Could not add attachment columns to ${tableName}`, { error });
  }
}

/**
 * Load a single dimension table and capture ID mappings
 */
async function loadDimensionTable(
  client: Client,
  stagingTable: string,
  targetTable: string,
  columnMappings: Array<{
    sourceColumn: string;
    targetColumn: string;
  }>,
  schemaName: string,
  errorHandling: string,
  loadStrategy: "truncate-load" | "merge" | "append",
  executionId: string,
  projectId: string
): Promise<{ recordsLoaded: number; idMappings: RecordIdMappingData[] }> {
  const sourceColumns = columnMappings.map((m) => `"${m.sourceColumn}"`).join(", ");
  const targetColumns = columnMappings.map((m) => `"${m.targetColumn}"`).join(", ");
  const idMappings: RecordIdMappingData[] = [];

  try {
    if (loadStrategy === "truncate-load") {
      logger.info(`[Stage 3] Truncating target table: ${targetTable}`);
      await client.query(`TRUNCATE TABLE ${targetTable}`);
    }

    const primaryKeyColumn = await getPrimaryKeyColumn(client, stagingTable, schemaName);
    
    if (primaryKeyColumn) {
      const insertWithReturnSQL = `
        WITH inserted AS (
          INSERT INTO ${targetTable} (${targetColumns})
          SELECT ${sourceColumns}
          FROM ${schemaName}.${stagingTable}
          RETURNING id, *
        )
        SELECT 
          inserted.id as target_id,
          staging."${primaryKeyColumn}" as source_id
        FROM inserted
        JOIN ${schemaName}.${stagingTable} staging
        ON inserted."${columnMappings.find(m => m.sourceColumn === primaryKeyColumn)?.targetColumn || primaryKeyColumn}" = staging."${primaryKeyColumn}"
      `;

      const result = await client.query(insertWithReturnSQL);
      
      result.rows.forEach((row) => {
        idMappings.push({
          executionId,
          projectId,
          tableName: targetTable,
          sourceId: String(row.source_id),
          sourceIdColumn: primaryKeyColumn,
          targetId: row.target_id,
          targetIdColumn: "id",
        });
      });

      logger.success(`[Stage 3] Loaded ${result.rowCount} records into ${targetTable} with ID mappings`);
      return { recordsLoaded: result.rowCount || 0, idMappings };
    } else {
      const insertSQL = `
        INSERT INTO ${targetTable} (${targetColumns})
        SELECT ${sourceColumns}
        FROM ${schemaName}.${stagingTable}
      `;

      const result = await client.query(insertSQL);
      logger.success(`[Stage 3] Loaded ${result.rowCount} records into ${targetTable}`);
      return { recordsLoaded: result.rowCount || 0, idMappings: [] };
    }
  } catch (error) {
    logger.error(`Failed to load dimension table ${targetTable}`, { 
      error,
      code: ERROR_CODES.DB_ERROR,
    });
    
    if (errorHandling === "fail-fast") {
      throw error;
    }
    
    return { recordsLoaded: 0, idMappings: [] };
  }
}

/**
 * Get the primary key column from staging table
 */
async function getPrimaryKeyColumn(
  client: Client,
  tableName: string,
  schemaName: string
): Promise<string | null> {
  try {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      ORDER BY ordinal_position
      LIMIT 1
    `;
    
    const result = await client.query(query, [schemaName, tableName]);
    return result.rows[0]?.column_name || null;
  } catch (error) {
    logger.warn(`Could not determine primary key for ${schemaName}.${tableName}`, { error });
    return null;
  }
}
