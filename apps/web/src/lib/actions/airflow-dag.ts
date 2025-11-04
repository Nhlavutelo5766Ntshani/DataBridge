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
import {
  commitDAGToGitHub,
  waitForWorkflowCompletion,
  triggerAirflowDAGRun,
} from "@/lib/services/github-integration";
import { logger } from "@/lib/utils/logger";

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

type DeploymentResult = {
  commitSha: string;
  commitUrl: string;
  workflowStatus: string;
  workflowUrl?: string;
  dagRunId?: string;
  airflowUrl?: string;
  dagId: string;
};

/**
 * Generates DAG and automatically deploys it to Airflow
 * This is the main function that orchestrates the entire deployment flow:
 * 1. Generate DAG
 * 2. Commit to GitHub
 * 3. Wait for CI/CD
 * 4. Trigger DAG run
 * 5. Return monitoring URLs
 */
export async function generateAndDeployDAG(
  projectId: string,
  branch = "main"
): Promise<QueryResponse<DeploymentResult>> {
  try {
    logger.info("Starting DAG generation and deployment", {
      projectId,
      branch,
    });

    // Step 1: Generate DAG
    const dagResult = await generateProjectDAG(projectId);
    
    if (!dagResult.success || !dagResult.data) {
      const errorMessage = Array.isArray(dagResult.error) 
        ? dagResult.error.join(", ") 
        : dagResult.error || "Failed to generate DAG";
      throw new Error(errorMessage);
    }

    const { dagFile } = dagResult.data;
    const dagId = dagFile.name.replace(".py", "");

    logger.info("DAG generated successfully", {
      projectId,
      dagFileName: dagFile.name,
    });

    // Step 2: Commit DAG to GitHub
    const commitResult = await commitDAGToGitHub(
      dagFile.content,
      dagFile.name,
      projectId,
      branch
    );

    if (!commitResult.success || !commitResult.commitSha) {
      throw new Error(commitResult.error || "Failed to commit DAG to GitHub");
    }

    logger.info("DAG committed to GitHub", {
      projectId,
      commitSha: commitResult.commitSha,
      commitUrl: commitResult.commitUrl,
    });

    // Step 3: Wait for CI/CD workflow to complete
    logger.info("Waiting for CI/CD workflow", {
      projectId,
      workflow: "airflow-dag-ci.yml",
    });

    const workflowStatus = await waitForWorkflowCompletion(
      "airflow-dag-ci.yml",
      branch,
      300000, // 5 minutes timeout
      5000 // Poll every 5 seconds
    );

    if (workflowStatus.conclusion !== "success") {
      throw new Error(
        `Workflow failed with conclusion: ${workflowStatus.conclusion}`
      );
    }

    logger.info("Workflow completed successfully", {
      projectId,
      status: workflowStatus.status,
      conclusion: workflowStatus.conclusion,
    });

    // Step 4: Trigger DAG run in Airflow
    logger.info("Triggering DAG run", {
      projectId,
      dagId,
    });

    const triggerResult = await triggerAirflowDAGRun(dagId, {
      project_id: projectId,
      triggered_by: "databridge_ui",
      deployment_sha: commitResult.commitSha,
    });

    if (!triggerResult.success) {
      logger.warn("DAG deployed but could not trigger run automatically", {
        projectId,
        error: triggerResult.error,
      });
    }

    // Step 5: Build Airflow monitoring URL
    const airflowBaseUrl = process.env.AIRFLOW_API_URL?.replace("/api/v1", "") || "";
    const airflowUrl = triggerResult.dagRunId
      ? `${airflowBaseUrl}/dags/${dagId}/grid?dag_run_id=${triggerResult.dagRunId}`
      : `${airflowBaseUrl}/dags/${dagId}/grid`;

    logger.info("DAG deployment completed successfully", {
      projectId,
      dagId,
      dagRunId: triggerResult.dagRunId,
    });

    return createSuccessResponse({
      commitSha: commitResult.commitSha,
      commitUrl: commitResult.commitUrl || "",
      workflowStatus: workflowStatus.conclusion || "success",
      workflowUrl: workflowStatus.runUrl,
      dagRunId: triggerResult.dagRunId,
      airflowUrl,
      dagId,
    });
  } catch (error) {
    logger.error("Failed to generate and deploy DAG", error);

    return createErrorResponse("generateAndDeployDAG", error);
  }
}

