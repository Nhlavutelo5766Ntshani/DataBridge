"use server";

import {
  type MappingProject,
  type NewMappingProject,
  projectCreateSchema,
  createProject,
  deleteProject,
  getProjectById,
  getUserProjects,
  updateProject,
} from "@/db/queries/projects";
import { QueryResponse } from "@/db/types/queries";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";

/**
 * Fetch a project by ID
 * @param projectId - The ID of the project to fetch
 * @returns The project data or an error
 */
export async function fetchProject(
  projectId: string
): Promise<QueryResponse<MappingProject | null>> {
  try {
    if (!projectId) throw new Error("Project ID is required");
    const project = await getProjectById(projectId);
    return createSuccessResponse(project);
  } catch (error) {
    logger.error("Error fetching project", error);
    return createErrorResponse("fetchProject", error);
  }
}

/**
 * Fetch all projects for a user
 * @param userId - User ID
 * @returns Array of projects or an error
 */
export async function fetchUserProjects(
  userId: string
): Promise<QueryResponse<MappingProject[]>> {
  try {
    if (!userId) throw new Error("User ID is required");
    const projects = await getUserProjects(userId);
    return createSuccessResponse(projects);
  } catch (error) {
    logger.error("Error fetching user projects", error);
    return createErrorResponse("fetchUserProjects", error);
  }
}

/**
 * Create a new project with validation
 * @param data - The project data
 * @returns The created project or an error
 */
export async function addProject(
  data: z.infer<typeof projectCreateSchema>
): Promise<QueryResponse<MappingProject>> {
  try {
    if (!data) throw new Error("Project data is required");
    if (!data.userId) throw new Error("User ID is required");

    const validated = projectCreateSchema.parse(data) as NewMappingProject;
    const project = await createProject(validated);

    return createSuccessResponse(project);
  } catch (error) {
    logger.error("Error creating project", error);
    
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
    
    return createErrorResponse("addProject", error);
  }
}

/**
 * Update a project
 * @param projectId - Project ID
 * @param data - Project data to update
 * @returns The updated project or an error
 */
export async function updateProjectAction(
  projectId: string,
  data: Partial<NewMappingProject>
): Promise<QueryResponse<MappingProject>> {
  try {
    if (!projectId) throw new Error("Project ID is required");
    if (!data) throw new Error("Update data is required");

    const project = await updateProject(projectId, data);
    return createSuccessResponse(project);
  } catch (error) {
    logger.error("Error updating project", error);
    return createErrorResponse("updateProjectAction", error);
  }
}

/**
 * Delete a project
 * @param projectId - Project ID
 * @returns The deleted project or an error
 */
export async function deleteProjectAction(
  projectId: string
): Promise<QueryResponse<MappingProject>> {
  try {
    if (!projectId) throw new Error("Project ID is required");
    const project = await deleteProject(projectId);
    return createSuccessResponse(project);
  } catch (error) {
    logger.error("Error deleting project", error);
    return createErrorResponse("deleteProjectAction", error);
  }
}

export type { MappingProject, NewMappingProject };





