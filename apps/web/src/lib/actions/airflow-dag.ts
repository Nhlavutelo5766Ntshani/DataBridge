"use server";

import {
  generateAirflowDAG,
  generateDAGReadme,
  generateAirflowRequirements,
  generateAirflowDockerCompose,
} from "@/lib/services/airflow-dag-generator";
import { getProjectById } from "@/db/queries/projects";
import { getProjectPipelines, getProjectSchedule } from "@/db/queries/pipelines";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import type { QueryResponse } from "@/db/types/queries";

type DAGFiles = {
  dagFile: { name: string; content: string };
  readmeFile: { name: string; content: string };
  requirementsFile: { name: string; content: string };
  dockerComposeFile: { name: string; content: string };
};

/**
 * Generates Airflow DAG files for a project
 */
export async function generateProjectDAG(
  projectId: string
): Promise<QueryResponse<DAGFiles>> {
  try {
    const project = await getProjectById(projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.strategy !== "multi-pipeline") {
      throw new Error("DAG generation is only available for multi-pipeline projects");
    }

    const pipelines = await getProjectPipelines(projectId);
    
    if (pipelines.length === 0) {
      throw new Error("Project must have at least one pipeline to generate a DAG");
    }

    const schedule = await getProjectSchedule(projectId);

    const dagContent = generateAirflowDAG({
      project,
      pipelines,
      schedule,
    });

    const readmeContent = generateDAGReadme({
      project,
      pipelines,
      schedule,
    });

    const requirementsContent = generateAirflowRequirements();
    const dockerComposeContent = generateAirflowDockerCompose();

    const dagFileName = `databridge_${projectId.replace(/-/g, "_")}.py`;
    const readmeFileName = `README_${projectId.replace(/-/g, "_")}.md`;
    const requirementsFileName = `requirements.txt`;
    const dockerComposeFileName = `docker-compose.yml`;

    return createSuccessResponse({
      dagFile: { name: dagFileName, content: dagContent },
      readmeFile: { name: readmeFileName, content: readmeContent },
      requirementsFile: { name: requirementsFileName, content: requirementsContent },
      dockerComposeFile: { name: dockerComposeFileName, content: dockerComposeContent },
    });
  } catch (error) {
    return createErrorResponse("generateProjectDAG", error);
  }
}

/**
 * Generates a preview of the Airflow DAG
 */
export async function previewProjectDAG(
  projectId: string
): Promise<QueryResponse<string>> {
  try {
    const result = await generateProjectDAG(projectId);
    
    if (!result.success || !result.data) {
      const errorMessage = Array.isArray(result.error) 
        ? result.error.join(", ") 
        : result.error || "Failed to generate DAG";
      throw new Error(errorMessage);
    }

    return createSuccessResponse(result.data.dagFile.content);
  } catch (error) {
    return createErrorResponse("previewProjectDAG", error);
  }
}

