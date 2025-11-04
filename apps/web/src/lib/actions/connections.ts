"use server";

import {
  type Connection,
  type NewConnection,
  connectionCreateSchema,
  createConnection,
  deleteConnection,
  getConnectionById,
  getUserConnections,
  updateConnection,
} from "@/db/queries/connections";
import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { parseFormData } from "@/lib/utils/validators";
import { z } from "zod";

/**
 * Fetch a connection by ID
 * @param connectionId - The ID of the connection to fetch
 * @returns The connection data or an error
 */
export async function fetchConnection(
  connectionId: string
): Promise<QueryResponse<Connection | null>> {
  try {
    if (!connectionId) throw new Error("Connection ID is required");
    const connection = await getConnectionById(connectionId);
    return createSuccessResponse(connection);
  } catch (error) {
    logger.error("Error fetching connection", error);
    return createErrorResponse("fetchConnection", error);
  }
}

/**
 * Fetch all connections for a user
 * @param userId - User ID
 * @returns Array of connections or an error
 */
export async function fetchUserConnections(
  userId: string
): Promise<QueryResponse<Connection[]>> {
  try {
    if (!userId) throw new Error("User ID is required");
    const connections = await getUserConnections(userId);
    return createSuccessResponse(connections);
  } catch (error) {
    logger.error("Error fetching user connections", error);
    return createErrorResponse("fetchUserConnections", error);
  }
}

/**
 * Create a new connection with validation
 * @param data - The connection data
 * @returns The created connection or an error
 */
export async function addConnection(
  data: z.infer<typeof connectionCreateSchema>
): Promise<QueryResponse<Connection>> {
  try {
    if (!data) throw new Error("Connection data is required");
    if (!data.userId) throw new Error("User ID is required");

    const validated = connectionCreateSchema.parse(data) as NewConnection;
    const connection = await createConnection(validated);

    return createSuccessResponse(connection);
  } catch (error) {
    logger.error("Error creating connection", error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return {
        success: false,
        data: null,
        error: errorMessages,
        code: ERROR_CODES.INVALID_FORMAT,
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
    
    return createErrorResponse("addConnection", error);
  }
}

/**
 * Create a new connection from form data
 * @param formData - Form data from connection creation form
 * @returns The created connection or an error
 */
export async function addConnectionFromForm(
  formData: FormData
): Promise<QueryResponse<Connection>> {
  try {
    const result = parseFormData(formData, connectionCreateSchema);

    if (!result.success) {
      return {
        success: false,
        data: null,
        error: result.errors.issues.map((issue) => issue.message),
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }

    const connection = await createConnection(result.data as NewConnection);
    return createSuccessResponse(connection);
  } catch (error) {
    logger.error("Error creating connection from form", error);
    return createErrorResponse("addConnectionFromForm", error);
  }
}

/**
 * Update a connection
 * @param connectionId - Connection ID
 * @param data - Connection data to update
 * @returns The updated connection or an error
 */
export async function updateConnectionAction(
  connectionId: string,
  data: Partial<NewConnection>
): Promise<QueryResponse<Connection>> {
  try {
    if (!connectionId) throw new Error("Connection ID is required");
    if (!data) throw new Error("Update data is required");

    const connection = await updateConnection(connectionId, data);
    return createSuccessResponse(connection);
  } catch (error) {
    logger.error("Error updating connection", error);
    return createErrorResponse("updateConnectionAction", error);
  }
}

/**
 * Delete a connection
 * @param connectionId - Connection ID
 * @returns The deleted connection or an error
 */
export async function deleteConnectionAction(
  connectionId: string
): Promise<QueryResponse<Connection>> {
  try {
    if (!connectionId) throw new Error("Connection ID is required");
    const connection = await deleteConnection(connectionId);
    return createSuccessResponse(connection);
  } catch (error) {
    logger.error("Error deleting connection", error);
    return createErrorResponse("deleteConnectionAction", error);
  }
}

export type { Connection, NewConnection };

