import { eq, and, desc } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

import { db } from "@/db";
import {
  pipelines,
  projectExecutions,
  pipelineExecutions,
  schedules,
  airflowDagRuns,
} from "@databridge/schema";

// Type exports
export type Pipeline = typeof pipelines.$inferSelect;
export type NewPipeline = typeof pipelines.$inferInsert;
export type ProjectExecution = typeof projectExecutions.$inferSelect;
export type NewProjectExecution = typeof projectExecutions.$inferInsert;
export type PipelineExecution = typeof pipelineExecutions.$inferSelect;
export type NewPipelineExecution = typeof pipelineExecutions.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type AirflowDagRun = typeof airflowDagRuns.$inferSelect;
export type NewAirflowDagRun = typeof airflowDagRuns.$inferInsert;

// Zod schemas
export const pipelineCreateSchema = createInsertSchema(pipelines);
export const pipelineUpdateSchema = pipelineCreateSchema
  .partial()
  .required({ id: true });

export const scheduleCreateSchema = createInsertSchema(schedules);
export const scheduleUpdateSchema = scheduleCreateSchema
  .partial()
  .required({ id: true });

/**
 * Get pipeline by ID
 * @param id - Pipeline ID
 * @returns Pipeline or undefined
 */
export async function getPipelineById(
  id: string
): Promise<Pipeline | undefined> {
  const result = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.id, id))
    .limit(1);

  return result[0];
}

/**
 * Get all pipelines for a project
 * @param projectId - Project ID
 * @returns Array of pipelines ordered by pipeline_order
 */
export async function getProjectPipelines(
  projectId: string
): Promise<Pipeline[]> {
  return await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.projectId, projectId))
    .orderBy(pipelines.pipelineOrder);
}

/**
 * Get pipelines with their table mappings count
 * @param projectId - Project ID
 * @returns Pipelines with metadata
 */
export async function getProjectPipelinesWithDetails(projectId: string) {
  return await db.query.pipelines.findMany({
    where: eq(pipelines.projectId, projectId),
    with: {
      sourceConnection: true,
      targetConnection: true,
      tableMappings: true,
      dependsOnPipeline: true,
    },
    orderBy: [pipelines.pipelineOrder],
  });
}

/**
 * Create new pipeline
 * @param data - Pipeline data
 * @returns Created pipeline
 */
export async function createPipeline(data: NewPipeline): Promise<Pipeline> {
  const result = await db.insert(pipelines).values(data).returning();

  return result[0];
}

/**
 * Create multiple pipelines at once
 * @param data - Array of pipeline data
 * @returns Array of created pipelines
 */
export async function createPipelines(
  data: NewPipeline[]
): Promise<Pipeline[]> {
  if (data.length === 0) return [];

  return await db.insert(pipelines).values(data).returning();
}

/**
 * Update pipeline
 * @param id - Pipeline ID
 * @param data - Updated data
 * @returns Updated pipeline
 */
export async function updatePipeline(
  id: string,
  data: Partial<NewPipeline>
): Promise<Pipeline> {
  const { id: _, ...rest } = data as any;

  const result = await db
    .update(pipelines)
    .set(rest)
    .where(eq(pipelines.id, id))
    .returning();

  return result[0];
}

/**
 * Delete pipeline (cascades to table mappings)
 * @param id - Pipeline ID
 * @returns Deleted pipeline
 */
export async function deletePipeline(id: string): Promise<Pipeline> {
  const result = await db
    .delete(pipelines)
    .where(eq(pipelines.id, id))
    .returning();

  return result[0];
}

/**
 * Delete all pipelines for a project
 * @param projectId - Project ID
 * @returns Number of deleted pipelines
 */
export async function deleteProjectPipelines(
  projectId: string
): Promise<number> {
  const deleted = await db
    .delete(pipelines)
    .where(eq(pipelines.projectId, projectId))
    .returning();

  return deleted.length;
}

// ============================================================================
// PROJECT EXECUTIONS
// ============================================================================

/**
 * Get project execution by ID
 * @param id - Execution ID
 * @returns Project execution or undefined
 */
export async function getProjectExecutionById(
  id: string
): Promise<ProjectExecution | undefined> {
  const result = await db
    .select()
    .from(projectExecutions)
    .where(eq(projectExecutions.id, id))
    .limit(1);

  return result[0];
}

/**
 * Get latest execution for a project
 * @param projectId - Project ID
 * @returns Latest project execution or undefined
 */
export async function getLatestProjectExecution(
  projectId: string
): Promise<ProjectExecution | undefined> {
  const result = await db
    .select()
    .from(projectExecutions)
    .where(eq(projectExecutions.projectId, projectId))
    .orderBy(desc(projectExecutions.startedAt))
    .limit(1);

  return result[0];
}

/**
 * Get all executions for a project
 * @param projectId - Project ID
 * @param limit - Max number of results
 * @returns Array of project executions
 */
export async function getProjectExecutions(
  projectId: string,
  limit: number = 10
): Promise<ProjectExecution[]> {
  return await db
    .select()
    .from(projectExecutions)
    .where(eq(projectExecutions.projectId, projectId))
    .orderBy(desc(projectExecutions.startedAt))
    .limit(limit);
}

/**
 * Get project execution with all pipeline executions
 * @param executionId - Project execution ID
 * @returns Execution with pipeline details
 */
export async function getProjectExecutionWithPipelines(executionId: string) {
  return await db.query.projectExecutions.findFirst({
    where: eq(projectExecutions.id, executionId),
    with: {
      pipelineExecutions: {
        with: {
          pipeline: true,
        },
        orderBy: [pipelineExecutions.startedAt],
      },
    },
  });
}

/**
 * Create project execution
 * @param data - Project execution data
 * @returns Created project execution
 */
export async function createProjectExecution(
  data: NewProjectExecution
): Promise<ProjectExecution> {
  const result = await db
    .insert(projectExecutions)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Update project execution
 * @param id - Execution ID
 * @param data - Updated data
 * @returns Updated project execution
 */
export async function updateProjectExecution(
  id: string,
  data: Partial<NewProjectExecution>
): Promise<ProjectExecution> {
  const { id: _, ...rest } = data as any;

  const result = await db
    .update(projectExecutions)
    .set(rest)
    .where(eq(projectExecutions.id, id))
    .returning();

  return result[0];
}

// ============================================================================
// PIPELINE EXECUTIONS
// ============================================================================

/**
 * Get pipeline execution by ID
 * @param id - Pipeline execution ID
 * @returns Pipeline execution or undefined
 */
export async function getPipelineExecutionById(
  id: string
): Promise<PipelineExecution | undefined> {
  const result = await db
    .select()
    .from(pipelineExecutions)
    .where(eq(pipelineExecutions.id, id))
    .limit(1);

  return result[0];
}

/**
 * Get all pipeline executions for a project execution
 * @param projectExecutionId - Project execution ID
 * @returns Array of pipeline executions
 */
export async function getPipelineExecutionsByProjectExecution(
  projectExecutionId: string
): Promise<PipelineExecution[]> {
  return await db
    .select()
    .from(pipelineExecutions)
    .where(eq(pipelineExecutions.projectExecutionId, projectExecutionId))
    .orderBy(pipelineExecutions.startedAt);
}

/**
 * Get pipeline executions for a specific pipeline
 * @param pipelineId - Pipeline ID
 * @param limit - Max number of results
 * @returns Array of pipeline executions
 */
export async function getPipelineExecutions(
  pipelineId: string,
  limit: number = 10
): Promise<PipelineExecution[]> {
  return await db
    .select()
    .from(pipelineExecutions)
    .where(eq(pipelineExecutions.pipelineId, pipelineId))
    .orderBy(desc(pipelineExecutions.startedAt))
    .limit(limit);
}

/**
 * Create pipeline execution
 * @param data - Pipeline execution data
 * @returns Created pipeline execution
 */
export async function createPipelineExecution(
  data: NewPipelineExecution
): Promise<PipelineExecution> {
  const result = await db
    .insert(pipelineExecutions)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Update pipeline execution
 * @param id - Execution ID
 * @param data - Updated data
 * @returns Updated pipeline execution
 */
export async function updatePipelineExecution(
  id: string,
  data: Partial<NewPipelineExecution>
): Promise<PipelineExecution> {
  const { id: _, ...rest } = data as any;

  const result = await db
    .update(pipelineExecutions)
    .set(rest)
    .where(eq(pipelineExecutions.id, id))
    .returning();

  return result[0];
}

// ============================================================================
// SCHEDULES
// ============================================================================

/**
 * Get schedule by ID
 * @param id - Schedule ID
 * @returns Schedule or undefined
 */
export async function getScheduleById(
  id: string
): Promise<Schedule | undefined> {
  const result = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id))
    .limit(1);

  return result[0];
}

/**
 * Get schedule for a project
 * @param projectId - Project ID
 * @returns Schedule or undefined
 */
export async function getProjectSchedule(
  projectId: string
): Promise<Schedule | undefined> {
  const result = await db
    .select()
    .from(schedules)
    .where(eq(schedules.projectId, projectId))
    .limit(1);

  return result[0];
}

/**
 * Get all enabled schedules
 * @returns Array of enabled schedules
 */
export async function getEnabledSchedules(): Promise<Schedule[]> {
  return await db
    .select()
    .from(schedules)
    .where(eq(schedules.enabled, true))
    .orderBy(schedules.nextRun);
}

/**
 * Create schedule
 * @param data - Schedule data
 * @returns Created schedule
 */
export async function createSchedule(data: NewSchedule): Promise<Schedule> {
  const result = await db.insert(schedules).values(data).returning();

  return result[0];
}

/**
 * Update schedule
 * @param id - Schedule ID
 * @param data - Updated data
 * @returns Updated schedule
 */
export async function updateSchedule(
  id: string,
  data: Partial<NewSchedule>
): Promise<Schedule> {
  const { id: _, ...rest } = data as any;

  const result = await db
    .update(schedules)
    .set(rest)
    .where(eq(schedules.id, id))
    .returning();

  return result[0];
}

/**
 * Delete schedule
 * @param id - Schedule ID
 * @returns Deleted schedule
 */
export async function deleteSchedule(id: string): Promise<Schedule> {
  const result = await db
    .delete(schedules)
    .where(eq(schedules.id, id))
    .returning();

  return result[0];
}

// ============================================================================
// AIRFLOW DAG RUNS
// ============================================================================

/**
 * Get Airflow DAG run by DAG ID and run ID
 * @param dagId - DAG ID
 * @param dagRunId - DAG run ID
 * @returns Airflow DAG run or undefined
 */
export async function getAirflowDagRun(
  dagId: string,
  dagRunId: string
): Promise<AirflowDagRun | undefined> {
  const result = await db
    .select()
    .from(airflowDagRuns)
    .where(
      and(
        eq(airflowDagRuns.dagId, dagId),
        eq(airflowDagRuns.dagRunId, dagRunId)
      )
    )
    .limit(1);

  return result[0];
}

/**
 * Get all Airflow DAG runs for a project execution
 * @param projectExecutionId - Project execution ID
 * @returns Array of Airflow DAG runs
 */
export async function getProjectExecutionDagRuns(
  projectExecutionId: string
): Promise<AirflowDagRun[]> {
  return await db
    .select()
    .from(airflowDagRuns)
    .where(eq(airflowDagRuns.projectExecutionId, projectExecutionId))
    .orderBy(desc(airflowDagRuns.airflowExecutionDate));
}

/**
 * Create Airflow DAG run
 * @param data - DAG run data
 * @returns Created DAG run
 */
export async function createAirflowDagRun(
  data: NewAirflowDagRun
): Promise<AirflowDagRun> {
  const result = await db.insert(airflowDagRuns).values(data).returning();

  return result[0];
}

/**
 * Update Airflow DAG run
 * @param dagId - DAG ID
 * @param dagRunId - DAG run ID
 * @param data - Updated data
 * @returns Updated DAG run
 */
export async function updateAirflowDagRun(
  dagId: string,
  dagRunId: string,
  data: Partial<NewAirflowDagRun>
): Promise<AirflowDagRun> {
  const { dagId: _, dagRunId: __, ...rest } = data as any;

  const result = await db
    .update(airflowDagRuns)
    .set(rest)
    .where(
      and(
        eq(airflowDagRuns.dagId, dagId),
        eq(airflowDagRuns.dagRunId, dagRunId)
      )
    )
    .returning();

  return result[0];
}


