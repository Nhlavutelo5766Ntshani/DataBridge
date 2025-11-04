"use server";

import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { createMigrationQueue, type MigrationJobData } from "@/lib/queue/config";
import { db } from "@/db";
import { migrationExecutions } from "@databridge/schema";
import { eq } from "drizzle-orm";

type MigrationExecution = typeof migrationExecutions.$inferSelect;

/**
 * Start migration execution for a project
 * @param projectId - Project ID
 * @param userId - User ID
 * @returns Execution ID or error
 */
export async function startMigrationExecution(
  projectId: string,
  userId: string
): Promise<QueryResponse<{ executionId: string; jobIds: string[] }>> {
  try {
    const project = await db.query.mappingProjects.findFirst({
      where: (projects, { eq }) => eq(projects.id, projectId),
    });

    if (!project) {
      return {
        success: false,
        data: null,
        error: "Project not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const tableMappings = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.projectId, projectId),
    });

    if (tableMappings.length === 0) {
      return {
        success: false,
        data: null,
        error: "No table mappings found for this project",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const executionResult = await db
      .insert(migrationExecutions)
      .values({
        projectId,
        executedBy: userId,
        status: "pending",
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
      })
      .returning();

    const execution = executionResult[0];
    const queue = createMigrationQueue();
    const jobIds: string[] = [];

    for (const tableMapping of tableMappings) {
      const jobData: MigrationJobData = {
        projectId,
        tableMappingId: tableMapping.id,
        userId,
        batchSize: 1000,
      };

      const job = await queue.add(
        `migration-${tableMapping.sourceTable}-${tableMapping.targetTable}`,
        jobData,
        {
          priority: 1,
        }
      );

      jobIds.push(job.id!);
    }

    await queue.close();

    logger.info(`Started migration execution ${execution.id}`, {
      projectId,
      tableMappings: tableMappings.length,
      jobIds,
    });

    return createSuccessResponse({
      executionId: execution.id,
      jobIds,
    });
  } catch (error) {
    logger.error("Error starting migration execution", error);

    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }

    return createErrorResponse("startMigrationExecution", error);
  }
}

/**
 * Get migration execution status
 * @param executionId - Execution ID
 * @returns Execution status or error
 */
export async function getMigrationExecutionStatus(
  executionId: string
): Promise<QueryResponse<MigrationExecution>> {
  try {
    const execution = await db.query.migrationExecutions.findFirst({
      where: (migrationExecutions, { eq }) => eq(migrationExecutions.id, executionId),
    });

    if (!execution) {
      return {
        success: false,
        data: null,
        error: "Execution not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    return createSuccessResponse(execution);
  } catch (error) {
    logger.error("Error getting migration execution status", error);
    return createErrorResponse("getMigrationExecutionStatus", error);
  }
}

/**
 * Get all migration executions for a project
 * @param projectId - Project ID
 * @returns Array of executions or error
 */
export async function getProjectMigrationExecutions(
  projectId: string
): Promise<QueryResponse<MigrationExecution[]>> {
  try {
    const executions = await db.query.migrationExecutions.findMany({
      where: (migrationExecutions, { eq }) => eq(migrationExecutions.projectId, projectId),
      orderBy: (migrationExecutions, { desc }) => [desc(migrationExecutions.createdAt)],
    });

    return createSuccessResponse(executions);
  } catch (error) {
    logger.error("Error getting project migration executions", error);
    return createErrorResponse("getProjectMigrationExecutions", error);
  }
}

/**
 * Cancel migration execution
 * @param executionId - Execution ID
 * @returns Success or error
 */
export async function cancelMigrationExecution(
  executionId: string
): Promise<QueryResponse<{ success: boolean }>> {
  try {
    await db
      .update(migrationExecutions)
      .set({
        status: "cancelled",
        completedAt: new Date(),
      })
      .where(eq(migrationExecutions.id, executionId));

    logger.info(`Cancelled migration execution ${executionId}`);

    return createSuccessResponse({ success: true });
  } catch (error) {
    logger.error("Error cancelling migration execution", error);

    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }

    return createErrorResponse("cancelMigrationExecution", error);
  }
}

