import { db } from "@/db";
import {
  etlExecutionStages,
  type etlExecutionStages as ETLExecutionStagesTable,
} from "@databridge/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Type exports
 */
export type ETLExecutionStage = typeof ETLExecutionStagesTable.$inferSelect;
export type NewETLExecutionStage = typeof ETLExecutionStagesTable.$inferInsert;

/**
 * Zod Schemas
 */
export const insertETLExecutionStageSchema = createInsertSchema(etlExecutionStages);
export const selectETLExecutionStageSchema = createSelectSchema(etlExecutionStages);
export const updateETLExecutionStageSchema = insertETLExecutionStageSchema.partial().required({ id: true });

/**
 * Get all stages for an execution
 * @param executionId - Execution ID
 * @returns Array of ETL execution stages
 */
export async function getExecutionStages(executionId: string) {
  return await db
    .select()
    .from(etlExecutionStages)
    .where(eq(etlExecutionStages.executionId, executionId))
    .orderBy(etlExecutionStages.createdAt);
}

/**
 * Get a specific stage by execution ID and stage ID
 * @param executionId - Execution ID
 * @param stageId - Stage ID
 * @returns ETL execution stage or undefined
 */
export async function getExecutionStage(executionId: string, stageId: string) {
  const results = await db
    .select()
    .from(etlExecutionStages)
    .where(
      and(
        eq(etlExecutionStages.executionId, executionId),
        eq(etlExecutionStages.stageId, stageId)
      )
    )
    .limit(1);

  return results[0];
}

/**
 * Get all stages for a project
 * @param projectId - Project ID
 * @returns Array of ETL execution stages
 */
export async function getProjectExecutionStages(projectId: string) {
  return await db
    .select()
    .from(etlExecutionStages)
    .where(eq(etlExecutionStages.projectId, projectId))
    .orderBy(desc(etlExecutionStages.createdAt));
}

/**
 * Create a new ETL execution stage
 * @param data - Stage data
 * @returns Created stage
 */
export async function createExecutionStage(data: NewETLExecutionStage) {
  const results = await db
    .insert(etlExecutionStages)
    .values(data)
    .returning();

  return results[0];
}

/**
 * Create multiple ETL execution stages
 * @param stages - Array of stage data
 * @returns Created stages
 */
export async function createExecutionStages(stages: NewETLExecutionStage[]) {
  return await db
    .insert(etlExecutionStages)
    .values(stages)
    .returning();
}

/**
 * Update an ETL execution stage
 * @param id - Stage ID
 * @param data - Updated stage data
 * @returns Updated stage
 */
export async function updateExecutionStage(
  id: string,
  data: Partial<NewETLExecutionStage>
) {
  const results = await db
    .update(etlExecutionStages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(etlExecutionStages.id, id))
    .returning();

  return results[0];
}

/**
 * Update stage by execution ID and stage ID
 * @param executionId - Execution ID
 * @param stageId - Stage ID
 * @param data - Updated stage data
 * @returns Updated stage
 */
export async function updateExecutionStageByIds(
  executionId: string,
  stageId: string,
  data: Partial<NewETLExecutionStage>
) {
  const results = await db
    .update(etlExecutionStages)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(etlExecutionStages.executionId, executionId),
        eq(etlExecutionStages.stageId, stageId)
      )
    )
    .returning();

  return results[0];
}

/**
 * Delete an ETL execution stage
 * @param id - Stage ID
 * @returns Deleted stage
 */
export async function deleteExecutionStage(id: string) {
  const results = await db
    .delete(etlExecutionStages)
    .where(eq(etlExecutionStages.id, id))
    .returning();

  return results[0];
}

/**
 * Delete all stages for an execution
 * @param executionId - Execution ID
 * @returns Deleted stages
 */
export async function deleteExecutionStages(executionId: string) {
  return await db
    .delete(etlExecutionStages)
    .where(eq(etlExecutionStages.executionId, executionId))
    .returning();
}

/**
 * Get stages by status
 * @param status - Stage status
 * @returns Array of ETL execution stages
 */
export async function getStagesByStatus(status: string) {
  return await db
    .select()
    .from(etlExecutionStages)
    .where(eq(etlExecutionStages.status, status))
    .orderBy(desc(etlExecutionStages.createdAt));
}

