import { db } from "@/db";
import {
  attachmentMigrations,
  type attachmentMigrations as AttachmentMigrationsTable,
} from "@databridge/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Type exports
 */
export type AttachmentMigration = typeof AttachmentMigrationsTable.$inferSelect;
export type NewAttachmentMigration = typeof AttachmentMigrationsTable.$inferInsert;

/**
 * Zod Schemas
 */
export const insertAttachmentMigrationSchema = createInsertSchema(attachmentMigrations);
export const selectAttachmentMigrationSchema = createSelectSchema(attachmentMigrations);
export const updateAttachmentMigrationSchema = insertAttachmentMigrationSchema.partial().required({ id: true });

/**
 * Get all attachments for an execution
 * @param executionId - Execution ID
 * @returns Array of attachment migrations
 */
export async function getExecutionAttachments(executionId: string) {
  return await db
    .select()
    .from(attachmentMigrations)
    .where(eq(attachmentMigrations.executionId, executionId))
    .orderBy(attachmentMigrations.createdAt);
}

/**
 * Get attachments by status
 * @param executionId - Execution ID
 * @param status - Migration status
 * @returns Array of attachment migrations
 */
export async function getAttachmentsByStatus(executionId: string, status: string) {
  return await db
    .select()
    .from(attachmentMigrations)
    .where(
      and(
        eq(attachmentMigrations.executionId, executionId),
        eq(attachmentMigrations.status, status)
      )
    )
    .orderBy(attachmentMigrations.createdAt);
}

/**
 * Get a specific attachment migration
 * @param executionId - Execution ID
 * @param documentId - Document ID
 * @param attachmentName - Attachment name
 * @returns Attachment migration or undefined
 */
export async function getAttachmentMigration(
  executionId: string,
  documentId: string,
  attachmentName: string
) {
  const results = await db
    .select()
    .from(attachmentMigrations)
    .where(
      and(
        eq(attachmentMigrations.executionId, executionId),
        eq(attachmentMigrations.documentId, documentId),
        eq(attachmentMigrations.attachmentName, attachmentName)
      )
    )
    .limit(1);

  return results[0];
}

/**
 * Get all attachments for a project
 * @param projectId - Project ID
 * @returns Array of attachment migrations
 */
export async function getProjectAttachments(projectId: string) {
  return await db
    .select()
    .from(attachmentMigrations)
    .where(eq(attachmentMigrations.projectId, projectId))
    .orderBy(desc(attachmentMigrations.createdAt));
}

/**
 * Create a new attachment migration record
 * @param data - Attachment migration data
 * @returns Created attachment migration
 */
export async function createAttachmentMigration(data: NewAttachmentMigration) {
  const results = await db
    .insert(attachmentMigrations)
    .values(data)
    .returning();

  return results[0];
}

/**
 * Create multiple attachment migration records
 * @param attachments - Array of attachment migration data
 * @returns Created attachment migrations
 */
export async function createAttachmentMigrations(attachments: NewAttachmentMigration[]) {
  return await db
    .insert(attachmentMigrations)
    .values(attachments)
    .returning();
}

/**
 * Update an attachment migration
 * @param id - Attachment migration ID
 * @param data - Updated data
 * @returns Updated attachment migration
 */
export async function updateAttachmentMigration(
  id: string,
  data: Partial<NewAttachmentMigration>
) {
  const results = await db
    .update(attachmentMigrations)
    .set(data)
    .where(eq(attachmentMigrations.id, id))
    .returning();

  return results[0];
}

/**
 * Update attachment by unique constraint
 * @param executionId - Execution ID
 * @param documentId - Document ID
 * @param attachmentName - Attachment name
 * @param data - Updated data
 * @returns Updated attachment migration
 */
export async function updateAttachmentByIds(
  executionId: string,
  documentId: string,
  attachmentName: string,
  data: Partial<NewAttachmentMigration>
) {
  const results = await db
    .update(attachmentMigrations)
    .set(data)
    .where(
      and(
        eq(attachmentMigrations.executionId, executionId),
        eq(attachmentMigrations.documentId, documentId),
        eq(attachmentMigrations.attachmentName, attachmentName)
      )
    )
    .returning();

  return results[0];
}

/**
 * Delete an attachment migration
 * @param id - Attachment migration ID
 * @returns Deleted attachment migration
 */
export async function deleteAttachmentMigration(id: string) {
  const results = await db
    .delete(attachmentMigrations)
    .where(eq(attachmentMigrations.id, id))
    .returning();

  return results[0];
}

/**
 * Delete all attachments for an execution
 * @param executionId - Execution ID
 * @returns Deleted attachment migrations
 */
export async function deleteExecutionAttachments(executionId: string) {
  return await db
    .delete(attachmentMigrations)
    .where(eq(attachmentMigrations.executionId, executionId))
    .returning();
}

/**
 * Get attachment migration statistics for an execution
 * @param executionId - Execution ID
 * @returns Statistics object
 */
export async function getAttachmentStats(executionId: string) {
  const attachments = await getExecutionAttachments(executionId);

  return {
    total: attachments.length,
    pending: attachments.filter((a) => a.status === "pending").length,
    success: attachments.filter((a) => a.status === "success").length,
    failed: attachments.filter((a) => a.status === "failed").length,
    totalSize: attachments.reduce((sum, a) => sum + (Number(a.sizeBytes) || 0), 0),
  };
}

