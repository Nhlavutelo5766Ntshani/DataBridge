import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

import { db } from "@/db";
import { tableMappings, columnMappings } from "@databridge/schema";

export type TableMapping = typeof tableMappings.$inferSelect;
export type NewTableMapping = typeof tableMappings.$inferInsert;
export type ColumnMapping = typeof columnMappings.$inferSelect;
export type NewColumnMapping = typeof columnMappings.$inferInsert;

export const tableMappingCreateSchema = createInsertSchema(tableMappings);
export const columnMappingCreateSchema = createInsertSchema(columnMappings);

export const tableMappingUpdateSchema = tableMappingCreateSchema.partial().required({ id: true });
export const columnMappingUpdateSchema = columnMappingCreateSchema.partial().required({ id: true });

/**
 * Fetch table mapping by ID
 * @param id - Table mapping ID
 * @returns Table mapping or undefined
 */
export async function getTableMappingById(id: string): Promise<TableMapping | undefined> {
  const result = await db
    .select()
    .from(tableMappings)
    .where(eq(tableMappings.id, id))
    .limit(1);
  
  return result[0];
}

/**
 * Fetch all table mappings for a project
 * @param projectId - Project ID
 * @returns Array of table mappings
 */
export async function getProjectTableMappings(projectId: string): Promise<TableMapping[]> {
  return await db
    .select()
    .from(tableMappings)
    .where(eq(tableMappings.projectId, projectId));
}

/**
 * Fetch all table mappings for a pipeline with column mappings
 * @param pipelineId - Pipeline ID
 * @returns Array of table mappings with column mappings
 */
export async function getTableMappingsByPipeline(pipelineId: string) {
  const tables = await db.query.tableMappings.findMany({
    where: eq(tableMappings.pipelineId, pipelineId),
    with: {
      columnMappings: true,
    },
  });
  
  return tables;
}

/**
 * Fetch column mappings for a table mapping
 * @param tableMappingId - Table mapping ID
 * @returns Array of column mappings
 */
export async function getTableColumnMappings(tableMappingId: string): Promise<ColumnMapping[]> {
  return await db
    .select()
    .from(columnMappings)
    .where(eq(columnMappings.tableMappingId, tableMappingId));
}

/**
 * Fetch all mappings (tables + columns) for a project
 * @param projectId - Project ID
 * @returns Object with table and column mappings
 */
export async function getProjectMappings(projectId: string): Promise<{
  tableMappings: TableMapping[];
  columnMappings: Record<string, ColumnMapping[]>;
}> {
  const tableMappings = await getProjectTableMappings(projectId);
  const columnMappings: Record<string, ColumnMapping[]> = {};

  for (const tableMapping of tableMappings) {
    const columns = await getTableColumnMappings(tableMapping.id);
    columnMappings[tableMapping.id] = columns;
  }

  return { tableMappings, columnMappings };
}

/**
 * Create new table mapping
 * @param data - Table mapping data
 * @returns Created table mapping
 */
export async function createTableMapping(data: NewTableMapping): Promise<TableMapping> {
  const result = await db
    .insert(tableMappings)
    .values(data)
    .returning();
  
  return result[0];
}

/**
 * Create new column mapping
 * @param data - Column mapping data
 * @returns Created column mapping
 */
export async function createColumnMapping(data: NewColumnMapping): Promise<ColumnMapping> {
  const result = await db
    .insert(columnMappings)
    .values(data)
    .returning();
  
  return result[0];
}

/**
 * Create multiple column mappings at once
 * @param data - Array of column mapping data
 * @returns Array of created column mappings
 */
export async function createColumnMappings(data: NewColumnMapping[]): Promise<ColumnMapping[]> {
  if (data.length === 0) return [];
  
  return await db
    .insert(columnMappings)
    .values(data)
    .returning();
}

/**
 * Update table mapping
 * @param id - Table mapping ID
 * @param data - Updated data
 * @returns Updated table mapping
 */
export async function updateTableMapping(
  id: string,
  data: Partial<NewTableMapping>
): Promise<TableMapping> {
  const { id: _, ...rest } = data as any;
  
  const result = await db
    .update(tableMappings)
    .set(rest)
    .where(eq(tableMappings.id, id))
    .returning();
  
  return result[0];
}

/**
 * Update column mapping
 * @param id - Column mapping ID
 * @param data - Updated data
 * @returns Updated column mapping
 */
export async function updateColumnMapping(
  id: string,
  data: Partial<NewColumnMapping>
): Promise<ColumnMapping> {
  const { id: _, ...rest } = data as any;
  
  const result = await db
    .update(columnMappings)
    .set(rest)
    .where(eq(columnMappings.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete table mapping (cascades to column mappings)
 * @param id - Table mapping ID
 * @returns Deleted table mapping
 */
export async function deleteTableMapping(id: string): Promise<TableMapping> {
  await db
    .delete(columnMappings)
    .where(eq(columnMappings.tableMappingId, id));

  const result = await db
    .delete(tableMappings)
    .where(eq(tableMappings.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete column mapping
 * @param id - Column mapping ID
 * @returns Deleted column mapping
 */
export async function deleteColumnMapping(id: string): Promise<ColumnMapping> {
  const result = await db
    .delete(columnMappings)
    .where(eq(columnMappings.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete all table mappings for a project
 * @param projectId - Project ID
 * @returns Number of deleted mappings
 */
export async function deleteProjectMappings(projectId: string): Promise<number> {
  const tableMappings = await getProjectTableMappings(projectId);
  
  for (const mapping of tableMappings) {
    await deleteTableMapping(mapping.id);
  }
  
  return tableMappings.length;
}

