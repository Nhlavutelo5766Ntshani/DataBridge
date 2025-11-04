"use server";

import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import {
  getTableMappingById,
  getProjectTableMappings,
  getTableColumnMappings,
  getProjectMappings,
  createTableMapping,
  createColumnMapping,
  createColumnMappings,
  updateTableMapping,
  updateColumnMapping,
  deleteTableMapping,
  deleteColumnMapping,
  deleteProjectMappings,
  tableMappingCreateSchema,
  columnMappingCreateSchema,
  type TableMapping,
  type NewTableMapping,
  type ColumnMapping,
  type NewColumnMapping,
} from "@/db/queries/mappings";

/**
 * Fetch table mapping by ID
 * @param id - Table mapping ID
 * @returns Table mapping or error
 */
export async function fetchTableMapping(id: string): Promise<QueryResponse<TableMapping>> {
  try {
    const mapping = await getTableMappingById(id);
    
    if (!mapping) {
      return {
        success: false,
        data: null,
        error: "Table mapping not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }
    
    return createSuccessResponse(mapping);
  } catch (error) {
    logger.error("Error fetching table mapping", error);
    return createErrorResponse("fetchTableMapping", error);
  }
}

/**
 * Fetch all table mappings for a project
 * @param projectId - Project ID
 * @returns Array of table mappings or error
 */
export async function fetchProjectTableMappings(
  projectId: string
): Promise<QueryResponse<TableMapping[]>> {
  try {
    const mappings = await getProjectTableMappings(projectId);
    return createSuccessResponse(mappings);
  } catch (error) {
    logger.error("Error fetching project table mappings", error);
    return createErrorResponse("fetchProjectTableMappings", error);
  }
}

/**
 * Fetch column mappings for a table mapping
 * @param tableMappingId - Table mapping ID
 * @returns Array of column mappings or error
 */
export async function fetchTableColumnMappings(
  tableMappingId: string
): Promise<QueryResponse<ColumnMapping[]>> {
  try {
    const mappings = await getTableColumnMappings(tableMappingId);
    return createSuccessResponse(mappings);
  } catch (error) {
    logger.error("Error fetching table column mappings", error);
    return createErrorResponse("fetchTableColumnMappings", error);
  }
}

/**
 * Fetch all mappings (tables + columns) for a project
 * @param projectId - Project ID
 * @returns Object with table and column mappings or error
 */
export async function fetchProjectMappings(projectId: string): Promise<
  QueryResponse<{
    tableMappings: TableMapping[];
    columnMappings: Record<string, ColumnMapping[]>;
  }>
> {
  try {
    const mappings = await getProjectMappings(projectId);
    return createSuccessResponse(mappings);
  } catch (error) {
    logger.error("Error fetching project mappings", error);
    return createErrorResponse("fetchProjectMappings", error);
  }
}

/**
 * Create new table mapping
 * @param data - Table mapping data
 * @returns Created table mapping or error
 */
export async function addTableMapping(
  data: NewTableMapping
): Promise<QueryResponse<TableMapping>> {
  try {
    const validated = tableMappingCreateSchema.parse(data);
    const mapping = await createTableMapping(validated as NewTableMapping);
    return createSuccessResponse(mapping);
  } catch (error) {
    logger.error("Error creating table mapping", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("addTableMapping", error);
  }
}

/**
 * Create new column mapping
 * @param data - Column mapping data
 * @returns Created column mapping or error
 */
export async function addColumnMapping(
  data: NewColumnMapping
): Promise<QueryResponse<ColumnMapping>> {
  try {
    const validated = columnMappingCreateSchema.parse(data);
    const mapping = await createColumnMapping(validated as NewColumnMapping);
    return createSuccessResponse(mapping);
  } catch (error) {
    logger.error("Error creating column mapping", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("addColumnMapping", error);
  }
}

/**
 * Create multiple column mappings at once
 * @param data - Array of column mapping data
 * @returns Array of created column mappings or error
 */
export async function addColumnMappings(
  data: NewColumnMapping[]
): Promise<QueryResponse<ColumnMapping[]>> {
  try {
    const validated = data.map(item => columnMappingCreateSchema.parse(item));
    const mappings = await createColumnMappings(validated as NewColumnMapping[]);
    return createSuccessResponse(mappings);
  } catch (error) {
    logger.error("Error creating column mappings", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("addColumnMappings", error);
  }
}

/**
 * Update table mapping
 * @param id - Table mapping ID
 * @param data - Updated data
 * @returns Updated table mapping or error
 */
export async function updateTableMappingAction(
  id: string,
  data: Partial<NewTableMapping>
): Promise<QueryResponse<TableMapping>> {
  try {
    const mapping = await updateTableMapping(id, data);
    return createSuccessResponse(mapping);
  } catch (error) {
    logger.error("Error updating table mapping", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("updateTableMapping", error);
  }
}

/**
 * Update column mapping
 * @param id - Column mapping ID
 * @param data - Updated data
 * @returns Updated column mapping or error
 */
export async function updateColumnMappingAction(
  id: string,
  data: Partial<NewColumnMapping>
): Promise<QueryResponse<ColumnMapping>> {
  try {
    const mapping = await updateColumnMapping(id, data);
    return createSuccessResponse(mapping);
  } catch (error) {
    logger.error("Error updating column mapping", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("updateColumnMapping", error);
  }
}

/**
 * Delete table mapping (cascades to column mappings)
 * @param id - Table mapping ID
 * @returns Success or error
 */
export async function deleteTableMappingAction(
  id: string
): Promise<QueryResponse<{ success: boolean }>> {
  try {
    await deleteTableMapping(id);
    return createSuccessResponse({ success: true });
  } catch (error) {
    logger.error("Error deleting table mapping", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("deleteTableMapping", error);
  }
}

/**
 * Delete column mapping
 * @param id - Column mapping ID
 * @returns Success or error
 */
export async function deleteColumnMappingAction(
  id: string
): Promise<QueryResponse<{ success: boolean }>> {
  try {
    await deleteColumnMapping(id);
    return createSuccessResponse({ success: true });
  } catch (error) {
    logger.error("Error deleting column mapping", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("deleteColumnMapping", error);
  }
}

/**
 * Delete all table mappings for a project
 * @param projectId - Project ID
 * @returns Success or error
 */
export async function deleteProjectMappingsAction(
  projectId: string
): Promise<QueryResponse<{ success: boolean; deletedCount: number }>> {
  try {
    const deletedCount = await deleteProjectMappings(projectId);
    return createSuccessResponse({ success: true, deletedCount });
  } catch (error) {
    logger.error("Error deleting project mappings", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("deleteProjectMappings", error);
  }
}





