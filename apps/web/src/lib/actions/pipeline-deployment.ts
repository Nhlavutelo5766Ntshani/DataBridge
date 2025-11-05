"use server";

import { revalidatePath } from "next/cache";
import type { QueryResponse } from "@/db/types/queries";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/errors";
import { generateAirflowDAG } from "@/lib/services/airflow-dag-generator";
import { commitDAGToGitHub, waitForWorkflowCompletion, triggerAirflowDAGRun } from "@/lib/services/github-integration";
import { getProjectPipelines } from "@/db/queries/pipelines";
import { PATHS } from "@/lib/constants/paths";

type DeploymentResult = {
  dagId: string;
  githubCommitUrl: string;
  cicdWorkflowUrl: string;
  airflowDagUrl: string;
  deploymentStatus: "success" | "failed";
};

/**
 * Deploy a project's pipeline to Airflow
 * @param projectId - The project ID
 * @returns Deployment result with URLs and status
 */
export async function deployProjectToAirflow(
  projectId: string
): Promise<QueryResponse<DeploymentResult>> {
  try {
    // Get project pipelines
    const pipelines = await getProjectPipelines(projectId);

    if (!pipelines || pipelines.length === 0) {
      return createErrorResponse("deployProjectToAirflow", "No pipelines found for project");
    }

    // TODO: Get project and schedule from database
    // For now, create a mock project object
    const project = {
      id: projectId,
      name: pipelines[0].name || "DataBridge Project",
      description: "Automated ETL Pipeline",
      userId: "",
      sourceConnectionId: null,
      targetConnectionId: null,
      strategy: null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate DAG
    const dagContent = generateAirflowDAG({
      project,
      pipelines,
      schedule: null,
    });

    // Commit to GitHub
    const commitResult = await commitDAGToGitHub(
      projectId,
      dagContent,
      `Deploy ${pipelines[0].name || "pipeline"} to Airflow`
    );

    if (!commitResult.success) {
      return createErrorResponse("deployProjectToAirflow", commitResult.error || "Failed to commit DAG");
    }

    // Wait for CI/CD workflow to complete
    const workflowResult = await waitForWorkflowCompletion("airflow-dag-ci.yml", "main");

    if (workflowResult.status !== "completed" || workflowResult.conclusion !== "success") {
      return createErrorResponse("deployProjectToAirflow", "CI/CD workflow failed");
    }

    // Trigger Airflow DAG run
    const dagId = `project_${projectId}_dag`;
    const airflowResult = await triggerAirflowDAGRun(dagId);

    // Build URLs
    const githubRepo = `${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`;
    const cicdUrl = `https://github.com/${githubRepo}/actions`;
    const airflowUrl = process.env.NEXT_PUBLIC_AIRFLOW_URL || "http://localhost:8080";

    revalidatePath(PATHS.DASHBOARD.PROJECTS);

    return createSuccessResponse({
      dagId,
      githubCommitUrl: commitResult.commitUrl || "",
      cicdWorkflowUrl: cicdUrl,
      airflowDagUrl: `${airflowUrl}/dags/${dagId}`,
      deploymentStatus: airflowResult.success ? "success" : "failed",
    });
  } catch (error) {
    return createErrorResponse("deployProjectToAirflow", error);
  }
}

/**
 * Get deployment status for a project
 * @param projectId - The project ID
 * @returns Deployment status information
 */
export async function getDeploymentStatus(
  projectId: string
): Promise<QueryResponse<{ status: string; lastDeployedAt?: Date }>> {
  try {
    // TODO: Query deployment tracking table using projectId
    // This would query your deployment tracking table
    // For now, return mock data
    console.log("Getting deployment status for project:", projectId);
    
    return createSuccessResponse({
      status: "deployed",
      lastDeployedAt: new Date(),
    });
  } catch (error) {
    return createErrorResponse("getDeploymentStatus", error);
  }
}

/**
 * Pause a pipeline execution in Airflow
 * @param dagId - The DAG ID
 * @param dagRunId - The DAG run ID
 * @returns Success response
 */
export async function pausePipelineExecution(
  dagId: string,
  dagRunId: string
): Promise<QueryResponse<{ success: boolean }>> {
  try {
    // Call Airflow API to pause DAG run
    const airflowUrl = process.env.AIRFLOW_API_URL || "http://localhost:8080/api/v1";
    const response = await fetch(`${airflowUrl}/dags/${dagId}/dagRuns/${dagRunId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRFLOW_API_KEY}`,
      },
      body: JSON.stringify({ state: "paused" }),
    });

    if (!response.ok) {
      return createErrorResponse("pausePipelineExecution", "Failed to pause execution");
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse("pausePipelineExecution", error);
  }
}

/**
 * Resume a paused pipeline execution
 * @param dagId - The DAG ID
 * @param dagRunId - The DAG run ID
 * @returns Success response
 */
export async function resumePipelineExecution(
  dagId: string,
  dagRunId: string
): Promise<QueryResponse<{ success: boolean }>> {
  try {
    // Call Airflow API to resume DAG run
    const airflowUrl = process.env.AIRFLOW_API_URL || "http://localhost:8080/api/v1";
    const response = await fetch(`${airflowUrl}/dags/${dagId}/dagRuns/${dagRunId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRFLOW_API_KEY}`,
      },
      body: JSON.stringify({ state: "running" }),
    });

    if (!response.ok) {
      return createErrorResponse("resumePipelineExecution", "Failed to resume execution");
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse("resumePipelineExecution", error);
  }
}

/**
 * Retry a failed pipeline execution
 * @param dagId - The DAG ID
 * @param dagRunId - The DAG run ID
 * @returns Success response
 */
export async function retryPipelineExecution(
  dagId: string,
  dagRunId: string
): Promise<QueryResponse<{ success: boolean; newDagRunId: string }>> {
  try {
    // Trigger a new DAG run
    const airflowResult = await triggerAirflowDAGRun(dagId, {
      conf: { retry_of: dagRunId },
    });

    if (!airflowResult.success) {
      return createErrorResponse("retryPipelineExecution", "Failed to trigger retry");
    }

    return createSuccessResponse({
      success: true,
      newDagRunId: airflowResult.dagRunId || "",
    });
  } catch (error) {
    return createErrorResponse("retryPipelineExecution", error);
  }
}

/**
 * Get Airflow task status for a DAG run
 * @param dagId - The DAG ID
 * @param dagRunId - The DAG run ID
 * @returns Task status information
 */
export async function getAirflowTaskStatus(
  dagId: string,
  dagRunId: string
): Promise<
  QueryResponse<
    Array<{
      taskId: string;
      taskName: string;
      status: "queued" | "running" | "success" | "failed" | "skipped";
      startTime?: Date;
      endTime?: Date;
      duration?: number;
    }>
  >
> {
  try {
    const airflowUrl = process.env.AIRFLOW_API_URL || "http://localhost:8080/api/v1";
    const response = await fetch(`${airflowUrl}/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`, {
      headers: {
        Authorization: `Bearer ${process.env.AIRFLOW_API_KEY}`,
      },
    });

    if (!response.ok) {
      return createErrorResponse("getAirflowTaskStatus", "Failed to fetch task status");
    }

    const data = await response.json();
    const tasks = data.task_instances.map((task: {
      task_id: string;
      state: string;
      start_date: string;
      end_date: string;
      duration: number;
    }) => ({
      taskId: task.task_id,
      taskName: task.task_id.replace(/_/g, " "),
      status: task.state.toLowerCase(),
      startTime: task.start_date ? new Date(task.start_date) : undefined,
      endTime: task.end_date ? new Date(task.end_date) : undefined,
      duration: task.duration,
    }));

    return createSuccessResponse(tasks);
  } catch (error) {
    return createErrorResponse("getAirflowTaskStatus", error);
  }
}

export type { DeploymentResult };

