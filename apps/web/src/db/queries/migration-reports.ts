import { db } from "@/db";
import {
  migrationReports,
  type migrationReports as MigrationReportsTable,
} from "@databridge/schema";
import { eq, desc } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Type exports
 */
export type MigrationReport = typeof MigrationReportsTable.$inferSelect;
export type NewMigrationReport = typeof MigrationReportsTable.$inferInsert;

/**
 * Zod Schemas
 */
export const insertMigrationReportSchema = createInsertSchema(migrationReports);
export const selectMigrationReportSchema = createSelectSchema(migrationReports);
export const updateMigrationReportSchema = insertMigrationReportSchema.partial().required({ id: true });

/**
 * Get report by execution ID
 * @param executionId - Execution ID
 * @returns Migration report or undefined
 */
export async function getReportByExecutionId(executionId: string) {
  const results = await db
    .select()
    .from(migrationReports)
    .where(eq(migrationReports.executionId, executionId))
    .limit(1);

  return results[0];
}

/**
 * Get all reports for a project
 * @param projectId - Project ID
 * @returns Array of migration reports
 */
export async function getProjectReports(projectId: string) {
  return await db
    .select()
    .from(migrationReports)
    .where(eq(migrationReports.projectId, projectId))
    .orderBy(desc(migrationReports.createdAt));
}

/**
 * Get recent reports (limit)
 * @param limit - Number of reports to retrieve
 * @returns Array of migration reports
 */
export async function getRecentReports(limit = 10) {
  return await db
    .select()
    .from(migrationReports)
    .orderBy(desc(migrationReports.createdAt))
    .limit(limit);
}

/**
 * Get a specific migration report by ID
 * @param id - Report ID
 * @returns Migration report or undefined
 */
export async function getMigrationReport(id: string) {
  const results = await db
    .select()
    .from(migrationReports)
    .where(eq(migrationReports.id, id))
    .limit(1);

  return results[0];
}

/**
 * Create a new migration report
 * @param data - Migration report data
 * @returns Created migration report
 */
export async function createMigrationReport(data: NewMigrationReport) {
  const results = await db
    .insert(migrationReports)
    .values(data)
    .returning();

  return results[0];
}

/**
 * Update a migration report
 * @param id - Report ID
 * @param data - Updated data
 * @returns Updated migration report
 */
export async function updateMigrationReport(
  id: string,
  data: Partial<NewMigrationReport>
) {
  const results = await db
    .update(migrationReports)
    .set(data)
    .where(eq(migrationReports.id, id))
    .returning();

  return results[0];
}

/**
 * Update report by execution ID
 * @param executionId - Execution ID
 * @param data - Updated data
 * @returns Updated migration report
 */
export async function updateReportByExecutionId(
  executionId: string,
  data: Partial<NewMigrationReport>
) {
  const results = await db
    .update(migrationReports)
    .set(data)
    .where(eq(migrationReports.executionId, executionId))
    .returning();

  return results[0];
}

/**
 * Delete a migration report
 * @param id - Report ID
 * @returns Deleted migration report
 */
export async function deleteMigrationReport(id: string) {
  const results = await db
    .delete(migrationReports)
    .where(eq(migrationReports.id, id))
    .returning();

  return results[0];
}

/**
 * Delete report by execution ID
 * @param executionId - Execution ID
 * @returns Deleted migration report
 */
export async function deleteReportByExecutionId(executionId: string) {
  const results = await db
    .delete(migrationReports)
    .where(eq(migrationReports.executionId, executionId))
    .returning();

  return results[0];
}

/**
 * Get report summary statistics
 * @param projectId - Optional project ID to filter
 * @returns Summary statistics
 */
export async function getReportSummary(projectId?: string) {
  const reports = projectId
    ? await getProjectReports(projectId)
    : await db.select().from(migrationReports);

  const totalExecutions = reports.length;
  const successfulExecutions = reports.filter((r) => {
    const summary = r.summary as { failedRecords?: number };
    return summary.failedRecords === 0;
  }).length;

  const totalRecords = reports.reduce((sum, r) => {
    const summary = r.summary as { totalRecords?: number };
    return sum + (summary.totalRecords || 0);
  }, 0);

  const totalDuration = reports.reduce((sum, r) => sum + r.durationMs, 0);

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions: totalExecutions - successfulExecutions,
    totalRecords,
    averageDuration: totalExecutions > 0 ? totalDuration / totalExecutions : 0,
  };
}

