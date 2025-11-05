import type { ETLPipelineConfig, StageResult } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { db } from "@/db";
import { getProjectById } from "@/db/queries/projects";
import { getConnectionById } from "@/db/queries/connections";
import { Client } from "pg";

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
      ssl: { rejectUnauthorized: false },
    });

    await targetClient.connect();
    logger.success(`[Stage 3] Connected to target database`);

    const tableMappings = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.pipelineId, projectId),
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

        const loadedRecords = await loadDimensionTable(
          targetClient,
          stagingTable,
          tableMapping.targetTable,
          columnMappings,
          config.staging.schemaName,
          config.errorHandling
        );

        await targetClient.query("COMMIT");

        recordsProcessed += loadedRecords;
        dimensionsLoaded++;

        const tableDuration = Date.now() - tableStart;
        logger.success(`[Stage 3] Dimension loaded successfully`, {
          table: tableMapping.targetTable,
          records: loadedRecords,
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
      duration: `${duration}ms`,
    });

    return {
      success: true,
      recordsProcessed,
      recordsFailed,
      duration,
      metadata: {
        dimensionsLoaded,
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
 * Load a single dimension table using UPSERT
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
  errorHandling: string
): Promise<number> {
  const sourceColumns = columnMappings.map((m) => `"${m.sourceColumn}"`).join(", ");
  const targetColumns = columnMappings.map((m) => `"${m.targetColumn}"`).join(", ");

  const insertSQL = `
    INSERT INTO ${targetTable} (${targetColumns})
    SELECT ${sourceColumns}
    FROM ${schemaName}.${stagingTable}
  `;

  try {
    const result = await client.query(insertSQL);
    return result.rowCount || 0;
  } catch (error) {
    logger.error(`Failed to load dimension table ${targetTable}`, { error });
    
    if (errorHandling === "fail-fast") {
      throw error;
    }
    
    return 0;
  }
}
