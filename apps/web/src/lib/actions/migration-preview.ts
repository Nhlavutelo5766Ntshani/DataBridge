"use server";

import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { generateMigrationPreview, type MigrationPreview } from "@/lib/services/migration-preview";
import { fetchConnection } from "@/lib/actions/connections";
import { fetchProject } from "@/lib/actions/projects";
import { fetchProjectMappings } from "@/lib/actions/mappings";

/**
 * Generate migration preview for a specific table mapping
 * @param projectId - Project ID
 * @param tableMappingId - Table mapping ID
 * @param sampleSize - Number of rows to preview (default 10)
 * @returns Migration preview or error
 */
export async function generateTableMigrationPreview(
  projectId: string,
  tableMappingId: string,
  sampleSize = 10
): Promise<QueryResponse<MigrationPreview>> {
  try {
    const projectResult = await fetchProject(projectId);
    
    if (!projectResult.success || !projectResult.data) {
      return {
        success: false,
        data: null,
        error: "Project not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const project = projectResult.data;
    
    if (!project.sourceConnectionId || !project.targetConnectionId) {
      return {
        success: false,
        data: null,
        error: "Project is missing source or target connection",
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }
    
    const [sourceConnResult, targetConnResult, mappingsResult] = await Promise.all([
      fetchConnection(project.sourceConnectionId),
      fetchConnection(project.targetConnectionId),
      fetchProjectMappings(projectId),
    ]);
    
    if (!sourceConnResult.success || !sourceConnResult.data) {
      return {
        success: false,
        data: null,
        error: "Source connection not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }
    
    if (!targetConnResult.success || !targetConnResult.data) {
      return {
        success: false,
        data: null,
        error: "Target connection not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }
    
    if (!mappingsResult.success || !mappingsResult.data) {
      return {
        success: false,
        data: null,
        error: "Mappings not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const sourceConn = sourceConnResult.data;
    const { tableMappings, columnMappings } = mappingsResult.data;
    
    const tableMapping = tableMappings.find(tm => tm.id === tableMappingId);
    
    if (!tableMapping) {
      return {
        success: false,
        data: null,
        error: "Table mapping not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }
    
    const tableColumnMappings = columnMappings[tableMappingId] || [];
    
    const preview = await generateMigrationPreview(
      {
        dbType: sourceConn.dbType,
        host: sourceConn.host,
        port: sourceConn.port,
        database: sourceConn.database,
        username: sourceConn.username,
        password: sourceConn.encryptedPassword,
      },
      tableMapping,
      tableColumnMappings,
      sampleSize
    );

    return createSuccessResponse(preview);
  } catch (error) {
    logger.error("Error generating migration preview", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: `Preview generation failed: ${error.message}`,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("generateTableMigrationPreview", error);
  }
}

/**
 * Generate preview for all table mappings in a project
 * @param projectId - Project ID
 * @param sampleSize - Number of rows per table (default 5)
 * @returns Array of migration previews or error
 */
export async function generateProjectMigrationPreviews(
  projectId: string,
  sampleSize = 5
): Promise<QueryResponse<MigrationPreview[]>> {
  try {
    const mappingsResult = await fetchProjectMappings(projectId);
    
    if (!mappingsResult.success || !mappingsResult.data) {
      return {
        success: false,
        data: null,
        error: "Mappings not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const { tableMappings } = mappingsResult.data;
    
    if (tableMappings.length === 0) {
      return createSuccessResponse([]);
    }
    
    const previews: MigrationPreview[] = [];
    
    for (const tableMapping of tableMappings) {
      const previewResult = await generateTableMigrationPreview(
        projectId,
        tableMapping.id,
        sampleSize
      );
      
      if (previewResult.success && previewResult.data) {
        previews.push(previewResult.data);
      }
    }

    return createSuccessResponse(previews);
  } catch (error) {
    logger.error("Error generating project migration previews", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: `Preview generation failed: ${error.message}`,
        code: ERROR_CODES.DB_ERROR,
      };
    }
    
    return createErrorResponse("generateProjectMigrationPreviews", error);
  }
}

