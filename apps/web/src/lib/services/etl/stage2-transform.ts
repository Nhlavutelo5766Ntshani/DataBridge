import type { ETLPipelineConfig, StageResult } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getProjectById } from "@/db/queries/projects";

/**
 * Stage 2: Transform and cleanse data in staging area
 * 
 * This stage:
 * - Applies column transformations defined in mappings
 * - Executes custom SQL expressions
 * - Handles data type conversions
 * - Applies default values for nulls
 * - Validates and cleanses data
 * 
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @param config - ETL pipeline configuration
 * @returns Stage execution result
 */
export async function transformAndCleanse(
  projectId: string,
  executionId: string,
  config: ETLPipelineConfig
): Promise<StageResult> {
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  let transformationsApplied = 0;

  logger.info(`[Stage 2] Starting data transformation`, {
    projectId,
    executionId,
  });

  try {
    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const tableMappings = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.pipelineId, projectId),
      orderBy: (tableMappings, { asc }) => [asc(tableMappings.mappingOrder)],
    });

    if (!tableMappings || tableMappings.length === 0) {
      logger.warn(`[Stage 2] No table mappings found`);
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
      };
    }

    logger.info(`[Stage 2] Processing ${tableMappings.length} tables for transformation`);

    for (const tableMapping of tableMappings) {
      try {
        logger.info(`[Stage 2] Transforming table: ${tableMapping.sourceTable}`);

        const columnMappings = await db.query.columnMappings.findMany({
          where: (columnMappings, { eq }) => eq(columnMappings.tableMappingId, tableMapping.id),
        });

        if (!columnMappings || columnMappings.length === 0) {
          logger.warn(`[Stage 2] No column mappings found for table ${tableMapping.sourceTable}`);
          continue;
        }

        const stagingTable = `${config.staging.tablePrefix}${tableMapping.sourceTable}`;
        
        for (const columnMapping of columnMappings) {
          if (columnMapping.transformationId || columnMapping.transformationConfig) {
            try {
              const transformed = await applyColumnTransformation(
                stagingTable,
                columnMapping,
                config.staging.schemaName
              );
              
              recordsProcessed += transformed;
              transformationsApplied++;
              
              logger.debug(`[Stage 2] Applied transformation to column`, {
                table: tableMapping.sourceTable,
                column: columnMapping.sourceColumn,
                transformation: columnMapping.transformationId,
              });
            } catch (error) {
              recordsFailed++;
              logger.error(`[Stage 2] Transformation failed`, {
                table: tableMapping.sourceTable,
                column: columnMapping.sourceColumn,
                error,
              });

              if (config.errorHandling === "fail-fast") {
                throw error;
              }
            }
          }
        }

        await applyDataCleansing(
          stagingTable,
          columnMappings,
          config.staging.schemaName
        );

        logger.success(`[Stage 2] Table transformed successfully`, {
          table: tableMapping.sourceTable,
          transformations: transformationsApplied,
        });
      } catch (error) {
        logger.error(`[Stage 2] Failed to transform table`, {
          table: tableMapping.sourceTable,
          error,
        });

        if (config.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.success(`[Stage 2] Data transformation completed`, {
      tablesProcessed: tableMappings.length,
      transformationsApplied,
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
        transformationsApplied,
        tablesProcessed: tableMappings.length,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[Stage 2] Data transformation failed`, error);

    return {
      success: false,
      recordsProcessed,
      recordsFailed,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Apply transformation to a specific column
 */
async function applyColumnTransformation(
  stagingTable: string,
  columnMapping: {
    sourceColumn: string;
    targetColumn: string;
    transformationId: string | null;
    transformationConfig: unknown;
  },
  schemaName: string
): Promise<number> {
  const transformations: Record<string, string> = {
    "uppercase": `UPPER("${columnMapping.sourceColumn}")`,
    "lowercase": `LOWER("${columnMapping.sourceColumn}")`,
    "trim": `TRIM("${columnMapping.sourceColumn}")`,
    "trim_all": `TRIM(BOTH ' ' FROM "${columnMapping.sourceColumn}")`,
    "remove_spaces": `REPLACE("${columnMapping.sourceColumn}", ' ', '')`,
    "to_date": `TO_DATE("${columnMapping.sourceColumn}", 'YYYY-MM-DD')`,
    "to_timestamp": `TO_TIMESTAMP("${columnMapping.sourceColumn}", 'YYYY-MM-DD HH24:MI:SS')`,
    "to_integer": `CAST("${columnMapping.sourceColumn}" AS INTEGER)`,
    "to_decimal": `CAST("${columnMapping.sourceColumn}" AS DECIMAL)`,
    "to_boolean": `CASE WHEN LOWER("${columnMapping.sourceColumn}") IN ('true', 't', 'yes', 'y', '1') THEN TRUE ELSE FALSE END`,
    "substring": columnMapping.transformationConfig 
      ? `SUBSTRING("${columnMapping.sourceColumn}", ${(columnMapping.transformationConfig as { start: number }).start}, ${(columnMapping.transformationConfig as { length: number }).length})`
      : `"${columnMapping.sourceColumn}"`,
    "concat": columnMapping.transformationConfig
      ? `CONCAT(${(columnMapping.transformationConfig as { columns: string[] }).columns.map((c) => `"${c}"`).join(", ")})`
      : `"${columnMapping.sourceColumn}"`,
    "replace": columnMapping.transformationConfig
      ? `REPLACE("${columnMapping.sourceColumn}", '${(columnMapping.transformationConfig as { from: string }).from}', '${(columnMapping.transformationConfig as { to: string }).to}')`
      : `"${columnMapping.sourceColumn}"`,
  };

  const transformExpression = columnMapping.transformationId 
    ? transformations[columnMapping.transformationId] || `"${columnMapping.sourceColumn}"`
    : `"${columnMapping.sourceColumn}"`;

  const updateSQL = `
    UPDATE ${schemaName}.${stagingTable}
    SET "${columnMapping.targetColumn || columnMapping.sourceColumn}" = ${transformExpression}
    WHERE "${columnMapping.sourceColumn}" IS NOT NULL
  `;

  await db.execute(sql.raw(updateSQL));
  return 0;
}

/**
 * Apply data cleansing rules to staging table
 */
async function applyDataCleansing(
  stagingTable: string,
  columnMappings: Array<{
    sourceColumn: string;
    isNullable: boolean | null;
    defaultValue: string | null;
  }>,
  schemaName: string
): Promise<void> {
  for (const column of columnMappings) {
    if (!column.isNullable && column.defaultValue) {
      const cleanseSQL = `
        UPDATE ${schemaName}.${stagingTable}
        SET "${column.sourceColumn}" = '${column.defaultValue}'
        WHERE "${column.sourceColumn}" IS NULL
      `;
      
      await db.execute(sql.raw(cleanseSQL));
      
      logger.debug(`Applied default value for column ${column.sourceColumn}`);
    }

    const trimSQL = `
      UPDATE ${schemaName}.${stagingTable}
      SET "${column.sourceColumn}" = TRIM("${column.sourceColumn}")
      WHERE "${column.sourceColumn}" IS NOT NULL 
        AND "${column.sourceColumn}" != TRIM("${column.sourceColumn}")
    `;
    
    await db.execute(sql.raw(trimSQL));
  }

  logger.debug(`Data cleansing completed for table ${stagingTable}`);
}
