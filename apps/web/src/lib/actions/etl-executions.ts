"use server";

import {
  getExecutionStages,
  getExecutionStage,
  createExecutionStages,
  updateExecutionStageByIds,
  type NewETLExecutionStage,
} from "@/db/queries/etl-executions";
import {
  getExecutionAttachments,
  getAttachmentStats,
  createAttachmentMigrations,
  updateAttachmentByIds,
  type NewAttachmentMigration,
} from "@/db/queries/attachment-migrations";
import {
  getExecutionValidations,
  getValidationStats,
  createDataValidations,
  type NewDataValidation,
} from "@/db/queries/data-validations";
import {
  getReportByExecutionId,
  createMigrationReport,
  type NewMigrationReport,
} from "@/db/queries/migration-reports";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import type { QueryResponse } from "@/db/types/queries";

/**
 * Fetch all stages for an execution
 * @param executionId - Execution ID
 * @returns QueryResponse with stages array
 */
export async function fetchExecutionStages(
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getExecutionStages>>>> {
  try {
    const stages = await getExecutionStages(executionId);
    return createSuccessResponse(stages, "fetchExecutionStages");
  } catch (error) {
    return createErrorResponse("fetchExecutionStages", error);
  }
}

/**
 * Fetch a specific stage
 * @param executionId - Execution ID
 * @param stageId - Stage ID
 * @returns QueryResponse with stage data
 */
export async function fetchExecutionStage(
  executionId: string,
  stageId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getExecutionStage>>>> {
  try {
    const stage = await getExecutionStage(executionId, stageId);
    return createSuccessResponse(stage, "fetchExecutionStage");
  } catch (error) {
    return createErrorResponse("fetchExecutionStage", error);
  }
}

/**
 * Initialize ETL execution stages
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @returns QueryResponse with created stages
 */
export async function initializeExecutionStages(
  projectId: string,
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof createExecutionStages>>>> {
  try {
    const stages: NewETLExecutionStage[] = [
      {
        executionId,
        projectId,
        stageId: "extract",
        stageName: "Extract to Staging",
        status: "pending",
      },
      {
        executionId,
        projectId,
        stageId: "transform",
        stageName: "Transform & Cleanse",
        status: "pending",
      },
      {
        executionId,
        projectId,
        stageId: "load-dimensions",
        stageName: "Load Dimensions",
        status: "pending",
      },
      {
        executionId,
        projectId,
        stageId: "load-facts",
        stageName: "Load Facts",
        status: "pending",
      },
      {
        executionId,
        projectId,
        stageId: "validate",
        stageName: "Validate Data",
        status: "pending",
      },
      {
        executionId,
        projectId,
        stageId: "report",
        stageName: "Generate Report",
        status: "pending",
      },
    ];

    const createdStages = await createExecutionStages(stages);
    return createSuccessResponse(createdStages, "initializeExecutionStages");
  } catch (error) {
    return createErrorResponse("initializeExecutionStages", error);
  }
}

/**
 * Update execution stage status
 * @param executionId - Execution ID
 * @param stageId - Stage ID
 * @param data - Stage update data
 * @returns QueryResponse with updated stage
 */
export async function updateStageStatus(
  executionId: string,
  stageId: string,
  data: Partial<NewETLExecutionStage>
): Promise<QueryResponse<Awaited<ReturnType<typeof updateExecutionStageByIds>>>> {
  try {
    const updatedStage = await updateExecutionStageByIds(
      executionId,
      stageId,
      data
    );
    return createSuccessResponse(updatedStage, "updateStageStatus");
  } catch (error) {
    return createErrorResponse("updateStageStatus", error);
  }
}

/**
 * Fetch attachment migrations for an execution
 * @param executionId - Execution ID
 * @returns QueryResponse with attachments array
 */
export async function fetchExecutionAttachments(
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getExecutionAttachments>>>> {
  try {
    const attachments = await getExecutionAttachments(executionId);
    return createSuccessResponse(attachments, "fetchExecutionAttachments");
  } catch (error) {
    return createErrorResponse("fetchExecutionAttachments", error);
  }
}

/**
 * Fetch attachment statistics for an execution
 * @param executionId - Execution ID
 * @returns QueryResponse with attachment stats
 */
export async function fetchAttachmentStats(
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getAttachmentStats>>>> {
  try {
    const stats = await getAttachmentStats(executionId);
    return createSuccessResponse(stats, "fetchAttachmentStats");
  } catch (error) {
    return createErrorResponse("fetchAttachmentStats", error);
  }
}

/**
 * Record attachment migrations
 * @param attachments - Array of attachment migration data
 * @returns QueryResponse with created attachments
 */
export async function recordAttachmentMigrations(
  attachments: NewAttachmentMigration[]
): Promise<QueryResponse<Awaited<ReturnType<typeof createAttachmentMigrations>>>> {
  try {
    const created = await createAttachmentMigrations(attachments);
    return createSuccessResponse(created, "recordAttachmentMigrations");
  } catch (error) {
    return createErrorResponse("recordAttachmentMigrations", error);
  }
}

/**
 * Update attachment migration status
 * @param executionId - Execution ID
 * @param documentId - Document ID
 * @param attachmentName - Attachment name
 * @param data - Update data
 * @returns QueryResponse with updated attachment
 */
export async function updateAttachmentStatus(
  executionId: string,
  documentId: string,
  attachmentName: string,
  data: Partial<NewAttachmentMigration>
): Promise<QueryResponse<Awaited<ReturnType<typeof updateAttachmentByIds>>>> {
  try {
    const updated = await updateAttachmentByIds(
      executionId,
      documentId,
      attachmentName,
      data
    );
    return createSuccessResponse(updated, "updateAttachmentStatus");
  } catch (error) {
    return createErrorResponse("updateAttachmentStatus", error);
  }
}

/**
 * Fetch validation results for an execution
 * @param executionId - Execution ID
 * @returns QueryResponse with validations array
 */
export async function fetchExecutionValidations(
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getExecutionValidations>>>> {
  try {
    const validations = await getExecutionValidations(executionId);
    return createSuccessResponse(validations, "fetchExecutionValidations");
  } catch (error) {
    return createErrorResponse("fetchExecutionValidations", error);
  }
}

/**
 * Fetch validation statistics for an execution
 * @param executionId - Execution ID
 * @returns QueryResponse with validation stats
 */
export async function fetchValidationStats(
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getValidationStats>>>> {
  try {
    const stats = await getValidationStats(executionId);
    return createSuccessResponse(stats, "fetchValidationStats");
  } catch (error) {
    return createErrorResponse("fetchValidationStats", error);
  }
}

/**
 * Record validation results
 * @param validations - Array of validation data
 * @returns QueryResponse with created validations
 */
export async function recordValidationResults(
  validations: NewDataValidation[]
): Promise<QueryResponse<Awaited<ReturnType<typeof createDataValidations>>>> {
  try {
    const created = await createDataValidations(validations);
    return createSuccessResponse(created, "recordValidationResults");
  } catch (error) {
    return createErrorResponse("recordValidationResults", error);
  }
}

/**
 * Fetch migration report for an execution
 * @param executionId - Execution ID
 * @returns QueryResponse with report data
 */
export async function fetchMigrationReport(
  executionId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getReportByExecutionId>>>> {
  try {
    const report = await getReportByExecutionId(executionId);
    return createSuccessResponse(report, "fetchMigrationReport");
  } catch (error) {
    return createErrorResponse("fetchMigrationReport", error);
  }
}

/**
 * Create migration report
 * @param reportData - Report data
 * @returns QueryResponse with created report
 */
export async function saveMigrationReport(
  reportData: NewMigrationReport
): Promise<QueryResponse<Awaited<ReturnType<typeof createMigrationReport>>>> {
  try {
    const report = await createMigrationReport(reportData);
    return createSuccessResponse(report, "saveMigrationReport");
  } catch (error) {
    return createErrorResponse("saveMigrationReport", error);
  }
}

