"use server";

import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { discoverDatabaseSchema } from "@/lib/services/schema-discovery";
import { fetchProject } from "@/lib/actions/projects";
import { fetchConnection } from "@/lib/actions/connections";
import type { DatabaseSchema } from "@/lib/types/schema";

/**
 * Fetch and discover source database schema for a project
 * @param projectId - Project ID
 * @returns Database schema or error
 */
export async function fetchSourceSchema(
  projectId: string
): Promise<QueryResponse<DatabaseSchema>> {
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
    
    if (!project.sourceConnectionId) {
      return {
        success: false,
        data: null,
        error: "Project is missing source connection",
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }
    
    const connectionResult = await fetchConnection(project.sourceConnectionId);
    
    if (!connectionResult.success || !connectionResult.data) {
      return {
        success: false,
        data: null,
        error: "Source connection not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const connection = connectionResult.data;
    
    const schema = await discoverDatabaseSchema({
      dbType: connection.dbType,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.encryptedPassword,
    });

    return createSuccessResponse(schema);
  } catch (error) {
    logger.error("Error fetching source schema", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: `Schema discovery failed: ${error.message}`,
        code: ERROR_CODES.CONNECTION_FAILED,
      };
    }
    
    return createErrorResponse("fetchSourceSchema", error);
  }
}

/**
 * Fetch and discover target database schema for a project
 * @param projectId - Project ID
 * @returns Database schema or error
 */
export async function fetchTargetSchema(
  projectId: string
): Promise<QueryResponse<DatabaseSchema>> {
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
    
    if (!project.targetConnectionId) {
      return {
        success: false,
        data: null,
        error: "Project is missing target connection",
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }
    
    const connectionResult = await fetchConnection(project.targetConnectionId);
    
    if (!connectionResult.success || !connectionResult.data) {
      return {
        success: false,
        data: null,
        error: "Target connection not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    const connection = connectionResult.data;
    
    const schema = await discoverDatabaseSchema({
      dbType: connection.dbType,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.encryptedPassword,
    });

    return createSuccessResponse(schema);
  } catch (error) {
    logger.error("Error fetching target schema", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: `Schema discovery failed: ${error.message}`,
        code: ERROR_CODES.CONNECTION_FAILED,
      };
    }
    
    return createErrorResponse("fetchTargetSchema", error);
  }
}

