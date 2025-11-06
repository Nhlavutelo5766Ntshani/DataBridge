import { db } from "@/db";
import {
  dataValidations,
  type dataValidations as DataValidationsTable,
} from "@databridge/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Type exports
 */
export type DataValidation = typeof DataValidationsTable.$inferSelect;
export type NewDataValidation = typeof DataValidationsTable.$inferInsert;

/**
 * Zod Schemas
 */
export const insertDataValidationSchema = createInsertSchema(dataValidations);
export const selectDataValidationSchema = createSelectSchema(dataValidations);
export const updateDataValidationSchema = insertDataValidationSchema.partial().required({ id: true });

/**
 * Get all validations for an execution
 * @param executionId - Execution ID
 * @returns Array of data validations
 */
export async function getExecutionValidations(executionId: string) {
  return await db
    .select()
    .from(dataValidations)
    .where(eq(dataValidations.executionId, executionId))
    .orderBy(dataValidations.createdAt);
}

/**
 * Get validations by status
 * @param executionId - Execution ID
 * @param status - Validation status
 * @returns Array of data validations
 */
export async function getValidationsByStatus(executionId: string, status: string) {
  return await db
    .select()
    .from(dataValidations)
    .where(
      and(
        eq(dataValidations.executionId, executionId),
        eq(dataValidations.status, status)
      )
    )
    .orderBy(dataValidations.createdAt);
}

/**
 * Get validations for a specific table
 * @param executionId - Execution ID
 * @param tableName - Table name
 * @returns Array of data validations
 */
export async function getTableValidations(executionId: string, tableName: string) {
  return await db
    .select()
    .from(dataValidations)
    .where(
      and(
        eq(dataValidations.executionId, executionId),
        eq(dataValidations.tableName, tableName)
      )
    )
    .orderBy(dataValidations.createdAt);
}

/**
 * Get validations by type
 * @param executionId - Execution ID
 * @param validationType - Validation type
 * @returns Array of data validations
 */
export async function getValidationsByType(executionId: string, validationType: string) {
  return await db
    .select()
    .from(dataValidations)
    .where(
      and(
        eq(dataValidations.executionId, executionId),
        eq(dataValidations.validationType, validationType)
      )
    )
    .orderBy(dataValidations.createdAt);
}

/**
 * Get all validations for a project
 * @param projectId - Project ID
 * @returns Array of data validations
 */
export async function getProjectValidations(projectId: string) {
  return await db
    .select()
    .from(dataValidations)
    .where(eq(dataValidations.projectId, projectId))
    .orderBy(desc(dataValidations.createdAt));
}

/**
 * Create a new data validation record
 * @param data - Data validation data
 * @returns Created data validation
 */
export async function createDataValidation(data: NewDataValidation) {
  const results = await db
    .insert(dataValidations)
    .values(data)
    .returning();

  return results[0];
}

/**
 * Create multiple data validation records
 * @param validations - Array of data validation data
 * @returns Created data validations
 */
export async function createDataValidations(validations: NewDataValidation[]) {
  return await db
    .insert(dataValidations)
    .values(validations)
    .returning();
}

/**
 * Update a data validation
 * @param id - Data validation ID
 * @param data - Updated data
 * @returns Updated data validation
 */
export async function updateDataValidation(
  id: string,
  data: Partial<NewDataValidation>
) {
  const results = await db
    .update(dataValidations)
    .set(data)
    .where(eq(dataValidations.id, id))
    .returning();

  return results[0];
}

/**
 * Delete a data validation
 * @param id - Data validation ID
 * @returns Deleted data validation
 */
export async function deleteDataValidation(id: string) {
  const results = await db
    .delete(dataValidations)
    .where(eq(dataValidations.id, id))
    .returning();

  return results[0];
}

/**
 * Delete all validations for an execution
 * @param executionId - Execution ID
 * @returns Deleted data validations
 */
export async function deleteExecutionValidations(executionId: string) {
  return await db
    .delete(dataValidations)
    .where(eq(dataValidations.executionId, executionId))
    .returning();
}

/**
 * Get validation statistics for an execution
 * @param executionId - Execution ID
 * @returns Statistics object
 */
export async function getValidationStats(executionId: string) {
  const validations = await getExecutionValidations(executionId);

  return {
    total: validations.length,
    passed: validations.filter((v) => v.status === "passed").length,
    failed: validations.filter((v) => v.status === "failed").length,
    warning: validations.filter((v) => v.status === "warning").length,
    byType: {
      row_count: validations.filter((v) => v.validationType === "row_count").length,
      data_type: validations.filter((v) => v.validationType === "data_type").length,
      null_constraint: validations.filter((v) => v.validationType === "null_constraint").length,
      foreign_key: validations.filter((v) => v.validationType === "foreign_key").length,
      custom: validations.filter((v) => v.validationType === "custom").length,
    },
  };
}

