import { db } from "@/db";
import {
  recordIdMappings,
  type recordIdMappings as RecordIdMappingsTable,
} from "@databridge/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Type exports
 */
export type RecordIdMapping = typeof RecordIdMappingsTable.$inferSelect;
export type NewRecordIdMapping = typeof RecordIdMappingsTable.$inferInsert;

/**
 * Zod Schemas
 */
export const insertRecordIdMappingSchema = createInsertSchema(recordIdMappings);
export const selectRecordIdMappingSchema = createSelectSchema(recordIdMappings);
export const updateRecordIdMappingSchema = insertRecordIdMappingSchema.partial().required({ id: true });

/**
 * Get all ID mappings for an execution
 */
export async function getExecutionIdMappings(executionId: string) {
  return await db
    .select()
    .from(recordIdMappings)
    .where(eq(recordIdMappings.executionId, executionId))
    .orderBy(recordIdMappings.createdAt);
}

/**
 * Get ID mappings for a specific table in an execution
 */
export async function getTableIdMappings(executionId: string, tableName: string) {
  return await db
    .select()
    .from(recordIdMappings)
    .where(
      and(
        eq(recordIdMappings.executionId, executionId),
        eq(recordIdMappings.tableName, tableName)
      )
    )
    .orderBy(recordIdMappings.createdAt);
}

/**
 * Get a specific ID mapping by source ID
 */
export async function getIdMappingBySourceId(
  executionId: string,
  tableName: string,
  sourceId: string
) {
  const results = await db
    .select()
    .from(recordIdMappings)
    .where(
      and(
        eq(recordIdMappings.executionId, executionId),
        eq(recordIdMappings.tableName, tableName),
        eq(recordIdMappings.sourceId, sourceId)
      )
    )
    .limit(1);

  return results[0];
}

/**
 * Get ID mapping by target ID
 */
export async function getIdMappingByTargetId(
  executionId: string,
  targetId: string
) {
  const results = await db
    .select()
    .from(recordIdMappings)
    .where(
      and(
        eq(recordIdMappings.executionId, executionId),
        eq(recordIdMappings.targetId, targetId)
      )
    )
    .limit(1);

  return results[0];
}

/**
 * Get ID mapping by CouchDB document ID
 */
export async function getIdMappingByCouchDbId(
  executionId: string,
  couchdbDocumentId: string
) {
  const results = await db
    .select()
    .from(recordIdMappings)
    .where(
      and(
        eq(recordIdMappings.executionId, executionId),
        eq(recordIdMappings.couchdbDocumentId, couchdbDocumentId)
      )
    )
    .limit(1);

  return results[0];
}

/**
 * Get all ID mappings for a project
 */
export async function getProjectIdMappings(projectId: string) {
  return await db
    .select()
    .from(recordIdMappings)
    .where(eq(recordIdMappings.projectId, projectId))
    .orderBy(desc(recordIdMappings.createdAt));
}

/**
 * Create a new ID mapping record
 */
export async function createIdMapping(data: NewRecordIdMapping) {
  const results = await db
    .insert(recordIdMappings)
    .values(data)
    .returning();

  return results[0];
}

/**
 * Create multiple ID mapping records in batch
 */
export async function createIdMappingsBatch(mappings: NewRecordIdMapping[]) {
  if (mappings.length === 0) return [];
  
  return await db
    .insert(recordIdMappings)
    .values(mappings)
    .returning();
}

/**
 * Update an ID mapping
 */
export async function updateIdMapping(
  id: string,
  data: Partial<NewRecordIdMapping>
) {
  const results = await db
    .update(recordIdMappings)
    .set(data)
    .where(eq(recordIdMappings.id, id))
    .returning();

  return results[0];
}

/**
 * Delete an ID mapping
 */
export async function deleteIdMapping(id: string) {
  const results = await db
    .delete(recordIdMappings)
    .where(eq(recordIdMappings.id, id))
    .returning();

  return results[0];
}

/**
 * Delete all ID mappings for an execution
 */
export async function deleteExecutionIdMappings(executionId: string) {
  return await db
    .delete(recordIdMappings)
    .where(eq(recordIdMappings.executionId, executionId))
    .returning();
}

/**
 * Get ID mapping statistics for an execution
 */
export async function getIdMappingStats(executionId: string) {
  const mappings = await getExecutionIdMappings(executionId);

  const tableStats = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.tableName]) {
      acc[mapping.tableName] = 0;
    }
    acc[mapping.tableName]++;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: mappings.length,
    byTable: tableStats,
    withCouchDb: mappings.filter((m) => m.couchdbDocumentId).length,
  };
}



