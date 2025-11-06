import { db } from "@/db";
import { mappingProjects } from "@databridge/schema";
import { desc, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export type MappingProject = typeof mappingProjects.$inferSelect;
export type NewMappingProject = typeof mappingProjects.$inferInsert;

export const projectCreateSchema = createInsertSchema(mappingProjects);

/**
 * Get project by ID
 * @param projectId - Project ID
 * @returns The project data or null if not found
 */
export async function getProjectById(
  projectId: string
): Promise<MappingProject | null> {
  const project = await db.query.mappingProjects.findFirst({
    where: eq(mappingProjects.id, projectId),
  });

  return project || null;
}

/**
 * Get all projects for a user
 * @param userId - User ID
 * @returns Array of projects
 */
export async function getUserProjects(
  userId: string
): Promise<MappingProject[]> {
  const userProjects = await db.query.mappingProjects.findMany({
    where: eq(mappingProjects.userId, userId),
    orderBy: [desc(mappingProjects.createdAt)],
  });

  return userProjects;
}

/**
 * Create a new project
 * @param projectData - The project data
 * @returns The created project
 */
export async function createProject(
  projectData: NewMappingProject
): Promise<MappingProject> {
  const rest = { ...projectData };
  delete rest.id;
  const [newProject] = await db.insert(mappingProjects).values(rest).returning();

  if (!newProject) {
    throw new Error("Failed to create project");
  }

  return newProject;
}

/**
 * Update a project
 * @param projectId - Project ID
 * @param projectData - Project data to update
 * @returns The updated project
 */
export async function updateProject(
  projectId: string,
  projectData: Partial<NewMappingProject>
): Promise<MappingProject> {
  const rest = { ...projectData };
  delete rest.id;
  const [updatedProject] = await db
    .update(mappingProjects)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(mappingProjects.id, projectId))
    .returning();

  if (!updatedProject) {
    throw new Error("Project not found or could not be updated");
  }

  return updatedProject;
}

/**
 * Delete a project
 * @param projectId - Project ID
 * @returns The deleted project
 */
export async function deleteProject(
  projectId: string
): Promise<MappingProject> {
  const [deletedProject] = await db
    .delete(mappingProjects)
    .where(eq(mappingProjects.id, projectId))
    .returning();

  if (!deletedProject) {
    throw new Error("Project not found or could not be deleted");
  }

  return deletedProject;
}

/**
 * Update project ETL configuration
 * @param projectId - Project ID
 * @param etlConfig - ETL configuration object
 * @returns The updated project
 */
export async function updateProjectETLConfig(
  projectId: string,
  etlConfig: Record<string, unknown>
): Promise<MappingProject> {
  const [updatedProject] = await db
    .update(mappingProjects)
    .set({ etlConfig, updatedAt: new Date() })
    .where(eq(mappingProjects.id, projectId))
    .returning();

  if (!updatedProject) {
    throw new Error("Project not found or could not be updated");
  }

  return updatedProject;
}

/**
 * Update project scheduling configuration
 * @param projectId - Project ID
 * @param scheduleConfig - Schedule configuration
 * @returns The updated project
 */
export async function updateProjectSchedule(
  projectId: string,
  scheduleConfig: {
    scheduleEnabled?: boolean;
    scheduleCron?: string | null;
    scheduleInterval?: number | null;
  }
): Promise<MappingProject> {
  const [updatedProject] = await db
    .update(mappingProjects)
    .set({ ...scheduleConfig, updatedAt: new Date() })
    .where(eq(mappingProjects.id, projectId))
    .returning();

  if (!updatedProject) {
    throw new Error("Project not found or could not be updated");
  }

  return updatedProject;
}

/**
 * Update project last execution time
 * @param projectId - Project ID
 * @param executionTime - Execution timestamp
 * @returns The updated project
 */
export async function updateProjectLastExecution(
  projectId: string,
  executionTime: Date
): Promise<MappingProject> {
  const [updatedProject] = await db
    .update(mappingProjects)
    .set({ lastExecutionTime: executionTime, updatedAt: new Date() })
    .where(eq(mappingProjects.id, projectId))
    .returning();

  if (!updatedProject) {
    throw new Error("Project not found or could not be updated");
  }

  return updatedProject;
}

/**
 * Get projects with scheduling enabled
 * @returns Array of scheduled projects
 */
export async function getScheduledProjects(): Promise<MappingProject[]> {
  const scheduledProjects = await db.query.mappingProjects.findMany({
    where: eq(mappingProjects.scheduleEnabled, true),
    orderBy: [desc(mappingProjects.lastExecutionTime)],
  });

  return scheduledProjects;
}

/**
 * Get projects due for execution based on schedule
 * @returns Array of projects that need to be executed
 */
export async function getDueProjects(): Promise<MappingProject[]> {
  const now = new Date();
  const scheduledProjects = await getScheduledProjects();

  return scheduledProjects.filter((project) => {
    if (!project.scheduleInterval) return false;
    
    if (!project.lastExecutionTime) return true; // Never executed

    const nextRunTime = new Date(
      project.lastExecutionTime.getTime() + project.scheduleInterval * 1000
    );

    return nextRunTime <= now;
  });
}

