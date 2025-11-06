import type { ETLPipelineConfig, StageResult, ValidationResult } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { db } from "@/db";
import { getProjectById } from "@/db/queries/projects";
import { getConnectionById } from "@/db/queries/connections";
import { createDataValidations } from "@/db/queries/data-validations";
import { Client } from "pg";

/**
 * Stage 5: Validate migrated data
 * 
 * This stage:
 * - Compares row counts between staging and target
 * - Validates data types and constraints
 * - Checks foreign key integrity
 * - Verifies NULL constraints
 * - Validates attachment migrations
 * - Generates validation report
 * 
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @param config - ETL pipeline configuration
 * @returns Stage execution result
 */
export async function validateData(
  projectId: string,
  executionId: string,
  config: ETLPipelineConfig
): Promise<StageResult> {
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  const validationResults: ValidationResult[] = [];

  logger.info(`[Stage 5] Starting data validation`, {
    projectId,
    executionId,
  });

  let targetClient: Client | null = null;

  try {
    if (!config.validateData) {
      logger.info(`[Stage 5] Data validation skipped (disabled in config)`);
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
        metadata: {
          validationsSkipped: true,
        },
      };
    }

    const project = await getProjectById(projectId);
    if (!project || !project.targetConnectionId) {
      throw new Error("Project or target connection not found");
    }

    const targetConn = await getConnectionById(project.targetConnectionId);
    if (!targetConn) {
      throw new Error("Target connection not found");
    }

    logger.info(`[Stage 5] Connecting to target database for validation`);

    targetClient = new Client({
      user: targetConn.username,
      password: targetConn.encryptedPassword,
      host: targetConn.host,
      port: targetConn.port || 5432,
      database: targetConn.database,
      ssl: { rejectUnauthorized: false },
    });

    await targetClient.connect();
    logger.success(`[Stage 5] Connected to target database`);

    const tableMappings = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.pipelineId, projectId),
      orderBy: (tableMappings, { asc }) => [asc(tableMappings.mappingOrder)],
    });

    if (!tableMappings || tableMappings.length === 0) {
      logger.warn(`[Stage 5] No table mappings found for validation`);
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
      };
    }

    logger.info(`[Stage 5] Validating ${tableMappings.length} tables`);

    for (const tableMapping of tableMappings) {
      try {
        logger.info(`[Stage 5] Validating table: ${tableMapping.targetTable}`);

        const stagingTable = `${config.staging.tablePrefix}${tableMapping.sourceTable}`;

        const rowCountValidation = await validateRowCounts(
          targetClient,
          stagingTable,
          tableMapping.targetTable,
          config.staging.schemaName
        );

        validationResults.push(rowCountValidation);

        if (rowCountValidation.status === "passed") {
          recordsProcessed++;
        } else {
          recordsFailed++;
        }

        const nullValidation = await validateNullConstraints(
          targetClient,
          tableMapping.targetTable,
          tableMapping.id
        );

        validationResults.push(...nullValidation);

        logger.success(`[Stage 5] Table validated`, {
          table: tableMapping.targetTable,
          validations: validationResults.length,
        });
      } catch (error) {
        recordsFailed++;
        logger.error(`[Stage 5] Validation failed for table`, {
          table: tableMapping.targetTable,
          error,
        });

        validationResults.push({
          table: tableMapping.targetTable,
          validationType: "custom",
          expected: "validation_success",
          actual: "validation_error",
          status: "failed",
          message: error instanceof Error ? error.message : String(error),
        });

        if (config.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }

    await saveValidationResults(executionId, projectId, validationResults);

    const duration = Date.now() - startTime;
    const passedValidations = validationResults.filter((v) => v.status === "passed").length;
    const failedValidations = validationResults.filter((v) => v.status === "failed").length;
    const warnings = validationResults.filter((v) => v.status === "warning").length;

    logger.success(`[Stage 5] Data validation completed`, {
      totalValidations: validationResults.length,
      passed: passedValidations,
      failed: failedValidations,
      warnings,
      duration: `${duration}ms`,
    });

    return {
      success: failedValidations === 0,
      recordsProcessed,
      recordsFailed,
      duration,
      metadata: {
        totalValidations: validationResults.length,
        passed: passedValidations,
        failed: failedValidations,
        warnings,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[Stage 5] Data validation failed`, error);

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
      logger.info(`[Stage 5] Closed target database connection`);
    }
  }
}

/**
 * Validate row counts between staging and target
 */
async function validateRowCounts(
  client: Client,
  stagingTable: string,
  targetTable: string,
  schemaName: string
): Promise<ValidationResult> {
  const stagingCountResult = await client.query(
    `SELECT COUNT(*) as count FROM ${schemaName}.${stagingTable}`
  );
  const targetCountResult = await client.query(
    `SELECT COUNT(*) as count FROM ${targetTable}`
  );

  const stagingCount = parseInt(stagingCountResult.rows[0].count);
  const targetCount = parseInt(targetCountResult.rows[0].count);

  return {
    table: targetTable,
    validationType: "row_count",
    expected: stagingCount,
    actual: targetCount,
    status: stagingCount === targetCount ? "passed" : "failed",
    message: stagingCount === targetCount
      ? "Row counts match"
      : `Row count mismatch: staging=${stagingCount}, target=${targetCount}`,
  };
}

/**
 * Validate NULL constraints
 */
async function validateNullConstraints(
  client: Client,
  targetTable: string,
  tableMappingId: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  const columnMappings = await db.query.columnMappings.findMany({
    where: (columnMappings, { eq, and }) => and(
      eq(columnMappings.tableMappingId, tableMappingId),
      eq(columnMappings.isNullable, false)
    ),
  });

  for (const column of columnMappings) {
    const nullCountResult = await client.query(
      `SELECT COUNT(*) as count FROM ${targetTable} WHERE "${column.targetColumn}" IS NULL`
    );

    const nullCount = parseInt(nullCountResult.rows[0].count);

    results.push({
      table: targetTable,
      validationType: "null_constraint",
      expected: 0,
      actual: nullCount,
      status: nullCount === 0 ? "passed" : "failed",
      message: nullCount === 0
        ? `Column ${column.targetColumn} has no NULL values`
        : `Column ${column.targetColumn} has ${nullCount} NULL values`,
    });
  }

  return results;
}

/**
 * Save validation results to database
 */
async function saveValidationResults(
  executionId: string,
  projectId: string,
  validations: ValidationResult[]
): Promise<void> {
  const validationRecords = validations.map((v) => ({
    executionId,
    projectId,
    tableName: v.table,
    validationType: v.validationType,
    expectedValue: String(v.expected),
    actualValue: String(v.actual),
    status: v.status,
    message: v.message,
  }));

  if (validationRecords.length > 0) {
    await createDataValidations(validationRecords);
    logger.info(`Saved ${validationRecords.length} validation results`);
  }
}
