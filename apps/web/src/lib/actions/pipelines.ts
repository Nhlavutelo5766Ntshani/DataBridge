"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import {
  getPipelineById,
  getProjectPipelines,
  getProjectPipelinesWithDetails,
  createPipeline,
  createPipelines,
  updatePipeline,
  deletePipeline,
  deleteProjectPipelines,
  getProjectExecutionById,
  getLatestProjectExecution,
  getProjectExecutions,
  getProjectExecutionWithPipelines,
  createProjectExecution,
  updateProjectExecution,
  createPipelineExecution,
  updatePipelineExecution,
  getProjectSchedule,
  getEnabledSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  pipelineCreateSchema,
  pipelineUpdateSchema,
  scheduleCreateSchema,
  scheduleUpdateSchema,
  type NewPipeline,
  type NewProjectExecution,
  type NewPipelineExecution,
  type NewSchedule,
} from "@/db/queries/pipelines";
import { createErrorResponse } from "@/lib/utils/errors";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import type { QueryResponse } from "@/db/types/queries";

/**
 * Fetch pipeline by ID
 * @param id - Pipeline ID
 * @returns Query response with pipeline data
 */
export async function fetchPipeline(id: string): Promise<QueryResponse<typeof getPipelineById>> {
  try {
    const pipeline = await getPipelineById(id);
    
    if (!pipeline) {
      return createErrorResponse("Pipeline not found", ERROR_CODES.NOT_FOUND);
    }
    
    return {
      success: true,
      data: pipeline,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch pipeline",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch all pipelines for a project
 * @param projectId - Project ID
 * @returns Query response with pipelines array
 */
export async function fetchProjectPipelines(
  projectId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getProjectPipelines>>>> {
  try {
    const pipelines = await getProjectPipelines(projectId);
    
    return {
      success: true,
      data: pipelines,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch pipelines",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch pipelines with full details (connections, mappings, dependencies)
 * @param projectId - Project ID
 * @returns Query response with detailed pipelines
 */
export async function fetchProjectPipelinesWithDetails(
  projectId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getProjectPipelinesWithDetails>>>> {
  try {
    const pipelines = await getProjectPipelinesWithDetails(projectId);
    
    return {
      success: true,
      data: pipelines,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch pipeline details",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Add new pipeline to a project
 * @param data - Pipeline data
 * @returns Query response with created pipeline
 */
export async function addPipeline(
  data: unknown
): Promise<QueryResponse<Awaited<ReturnType<typeof createPipeline>>>> {
  try {
    const validatedData = pipelineCreateSchema.parse(data) as NewPipeline;
    
    const pipeline = await createPipeline(validatedData);
    
    revalidatePath(`/projects/${pipeline.projectId}`);
    
    return {
      success: true,
      data: pipeline,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to create pipeline",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Add multiple pipelines at once
 * @param data - Array of pipeline data
 * @returns Query response with created pipelines
 */
export async function addPipelines(
  data: unknown[]
): Promise<QueryResponse<Awaited<ReturnType<typeof createPipelines>>>> {
  try {
    const validatedData = data.map(item => 
      pipelineCreateSchema.parse(item)
    ) as NewPipeline[];
    
    const pipelines = await createPipelines(validatedData);
    
    if (pipelines.length > 0) {
      revalidatePath(`/projects/${pipelines[0].projectId}`);
    }
    
    return {
      success: true,
      data: pipelines,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to create pipelines",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Update existing pipeline
 * @param data - Pipeline data with ID
 * @returns Query response with updated pipeline
 */
export async function updatePipelineAction(
  data: unknown
): Promise<QueryResponse<Awaited<ReturnType<typeof updatePipeline>>>> {
  try {
    const validatedData = pipelineUpdateSchema.parse(data);
    const { id, ...updateData } = validatedData;
    
    const pipeline = await updatePipeline(id, updateData);
    
    revalidatePath(`/projects/${pipeline.projectId}`);
    
    return {
      success: true,
      data: pipeline,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to update pipeline",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Delete pipeline
 * @param id - Pipeline ID
 * @returns Query response with deleted pipeline
 */
export async function deletePipelineAction(
  id: string
): Promise<QueryResponse<Awaited<ReturnType<typeof deletePipeline>>>> {
  try {
    const pipeline = await deletePipeline(id);
    
    revalidatePath(`/projects/${pipeline.projectId}`);
    
    return {
      success: true,
      data: pipeline,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to delete pipeline",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Delete all pipelines for a project
 * @param projectId - Project ID
 * @returns Query response with count of deleted pipelines
 */
export async function deleteProjectPipelinesAction(
  projectId: string
): Promise<QueryResponse<number>> {
  try {
    const count = await deleteProjectPipelines(projectId);
    
    revalidatePath(`/projects/${projectId}`);
    
    return {
      success: true,
      data: count,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to delete pipelines",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch project execution by ID with all pipeline executions
 * @param id - Execution ID
 * @returns Query response with execution details
 */
export async function fetchProjectExecution(
  id: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getProjectExecutionWithPipelines>>>> {
  try {
    const execution = await getProjectExecutionWithPipelines(id);
    
    if (!execution) {
      return createErrorResponse("Execution not found", ERROR_CODES.NOT_FOUND);
    }
    
    return {
      success: true,
      data: execution,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch execution",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch latest execution for a project
 * @param projectId - Project ID
 * @returns Query response with latest execution
 */
export async function fetchLatestProjectExecution(
  projectId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getLatestProjectExecution>>>> {
  try {
    const execution = await getLatestProjectExecution(projectId);
    
    return {
      success: true,
      data: execution,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch latest execution",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch execution history for a project
 * @param projectId - Project ID
 * @param limit - Max number of results
 * @returns Query response with execution history
 */
export async function fetchProjectExecutionHistory(
  projectId: string,
  limit: number = 10
): Promise<QueryResponse<Awaited<ReturnType<typeof getProjectExecutions>>>> {
  try {
    const executions = await getProjectExecutions(projectId, limit);
    
    return {
      success: true,
      data: executions,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch execution history",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Start new project execution
 * @param projectId - Project ID
 * @param triggeredBy - How execution was triggered
 * @returns Query response with created execution
 */
export async function startProjectExecution(
  projectId: string,
  triggeredBy: "manual" | "scheduled" | "api" | "airflow" = "manual"
): Promise<QueryResponse<Awaited<ReturnType<typeof createProjectExecution>>>> {
  try {
    const executionData: NewProjectExecution = {
      projectId,
      triggeredBy,
      status: "pending",
      startedAt: new Date(),
    };
    
    const execution = await createProjectExecution(executionData);
    
    const pipelines = await getProjectPipelines(projectId);
    
    const pipelineExecutionPromises = pipelines.map((pipeline) => {
      const pipelineExecData: NewPipelineExecution = {
        pipelineId: pipeline.id,
        projectExecutionId: execution.id,
        status: "pending",
      };
      return createPipelineExecution(pipelineExecData);
    });
    
    await Promise.all(pipelineExecutionPromises);
    
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/migrations/${execution.id}`);
    
    return {
      success: true,
      data: execution,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to start execution",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Update project execution status
 * @param id - Execution ID
 * @param status - New status
 * @param errorMessage - Optional error message
 * @returns Query response with updated execution
 */
export async function updateProjectExecutionStatus(
  id: string,
  status: "pending" | "running" | "completed" | "failed" | "cancelled",
  errorMessage?: string
): Promise<QueryResponse<Awaited<ReturnType<typeof updateProjectExecution>>>> {
  try {
    const updateData: Partial<NewProjectExecution> = {
      status,
      errorMessage,
    };
    
    if (status === "completed" || status === "failed" || status === "cancelled") {
      updateData.completedAt = new Date();
    }
    
    const execution = await updateProjectExecution(id, updateData);
    
    revalidatePath(`/migrations/${id}`);
    
    return {
      success: true,
      data: execution,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to update execution status",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Update pipeline execution status and progress
 * @param id - Pipeline execution ID
 * @param status - New status
 * @param recordsProcessed - Number of records processed
 * @param recordsFailed - Number of records failed
 * @param errorMessage - Optional error message
 * @returns Query response with updated pipeline execution
 */
export async function updatePipelineExecutionStatus(
  id: string,
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "cancelled",
  recordsProcessed?: number,
  recordsFailed?: number,
  errorMessage?: string
): Promise<QueryResponse<Awaited<ReturnType<typeof updatePipelineExecution>>>> {
  try {
    const updateData: Partial<NewPipelineExecution> = {
      status,
      errorMessage,
    };
    
    if (status === "running" && !recordsProcessed) {
      updateData.startedAt = new Date();
    }
    
    if (recordsProcessed !== undefined) {
      updateData.recordsProcessed = recordsProcessed;
    }
    
    if (recordsFailed !== undefined) {
      updateData.recordsFailed = recordsFailed;
    }
    
    if (status === "completed" || status === "failed" || status === "cancelled") {
      updateData.completedAt = new Date();
    }
    
    const execution = await updatePipelineExecution(id, updateData);
    
    const projectExecution = await getProjectExecutionById(execution.projectExecutionId);
    if (projectExecution) {
      revalidatePath(`/migrations/${projectExecution.id}`);
    }
    
    return {
      success: true,
      data: execution,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to update pipeline execution",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch schedule for a project
 * @param projectId - Project ID
 * @returns Query response with schedule
 */
export async function fetchProjectSchedule(
  projectId: string
): Promise<QueryResponse<Awaited<ReturnType<typeof getProjectSchedule>>>> {
  try {
    const schedule = await getProjectSchedule(projectId);
    
    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch schedule",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Fetch all enabled schedules
 * @returns Query response with enabled schedules
 */
export async function fetchEnabledSchedules(): Promise<QueryResponse<Awaited<ReturnType<typeof getEnabledSchedules>>>> {
  try {
    const schedules = await getEnabledSchedules();
    
    return {
      success: true,
      data: schedules,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch schedules",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Add schedule to a project
 * @param data - Schedule data
 * @returns Query response with created schedule
 */
export async function addSchedule(
  data: unknown
): Promise<QueryResponse<Awaited<ReturnType<typeof createSchedule>>>> {
  try {
    const validatedData = scheduleCreateSchema.parse(data) as NewSchedule;
    
    const schedule = await createSchedule(validatedData);
    
    revalidatePath(`/projects/${schedule.projectId}`);
    
    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to create schedule",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Update existing schedule
 * @param data - Schedule data with ID
 * @returns Query response with updated schedule
 */
export async function updateScheduleAction(
  data: unknown
): Promise<QueryResponse<Awaited<ReturnType<typeof updateSchedule>>>> {
  try {
    const validatedData = scheduleUpdateSchema.parse(data);
    const { id, ...updateData } = validatedData;
    
    const schedule = await updateSchedule(id, updateData);
    
    revalidatePath(`/projects/${schedule.projectId}`);
    
    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to update schedule",
      ERROR_CODES.DB_ERROR
    );
  }
}

/**
 * Delete schedule
 * @param id - Schedule ID
 * @returns Query response with deleted schedule
 */
export async function deleteScheduleAction(
  id: string
): Promise<QueryResponse<Awaited<ReturnType<typeof deleteSchedule>>>> {
  try {
    const schedule = await deleteSchedule(id);
    
    revalidatePath(`/projects/${schedule.projectId}`);
    
    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to delete schedule",
      ERROR_CODES.DB_ERROR
    );
  }
}

