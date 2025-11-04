import { Octokit } from "@octokit/rest";
import { logger } from "../utils/logger";

/**
 * GitHub repository configuration
 */
type GitHubConfig = {
  owner: string;
  repo: string;
  token: string;
};

/**
 * Commit DAG result
 */
type CommitResult = {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
};

/**
 * GitHub Actions workflow status
 */
type WorkflowStatus = {
  status: "queued" | "in_progress" | "completed";
  conclusion?: "success" | "failure" | "cancelled" | "skipped";
  runUrl?: string;
};

/**
 * Get GitHub configuration from environment variables
 */
function getGitHubConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "";

  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!repo) {
    throw new Error("GITHUB_REPO environment variable is required (format: owner/repo)");
  }

  const [owner, repoName] = repo.split("/");

  if (!owner || !repoName) {
    throw new Error(
      "GITHUB_REPO must be in format 'owner/repo' (e.g., 'username/DataBridge')"
    );
  }

  return {
    owner,
    repo: repoName,
    token,
  };
}

/**
 * Commit a DAG file to GitHub repository
 */
export async function commitDAGToGitHub(
  dagContent: string,
  dagFileName: string,
  projectId: string,
  branch = "main"
): Promise<CommitResult> {
  try {
    const config = getGitHubConfig();
    const octokit = new Octokit({ auth: config.token });

    const path = `airflow/dags/${dagFileName}`;
    const message = `feat: add ${dagFileName} for project ${projectId}`;

    logger.info("Committing DAG to GitHub", {
      projectId,
      path,
      branch,
    });

    // Check if file already exists
    let fileSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path,
        ref: branch,
      });

      if ("sha" in existingFile) {
        fileSha = existingFile.sha;
        logger.info("File exists, will update", { path, sha: fileSha });
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        logger.info("File does not exist, will create new", { path });
      } else {
        throw error;
      }
    }

    // Create or update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path,
      message,
      content: Buffer.from(dagContent).toString("base64"),
      branch,
      ...(fileSha && { sha: fileSha }),
    });

    logger.info("DAG committed successfully", {
      commitSha: data.commit.sha,
      commitUrl: data.commit.html_url,
    });

    return {
      success: true,
      commitSha: data.commit.sha,
      commitUrl: data.commit.html_url,
    };
  } catch (error) {
    logger.error("Failed to commit DAG to GitHub", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get the status of a GitHub Actions workflow run
 */
export async function getWorkflowRunStatus(
  workflowFileName: string,
  branch: string
): Promise<WorkflowStatus | null> {
  try {
    const config = getGitHubConfig();
    const octokit = new Octokit({ auth: config.token });

    // Get the latest workflow run for this branch
    const { data } = await octokit.actions.listWorkflowRuns({
      owner: config.owner,
      repo: config.repo,
      workflow_id: workflowFileName,
      branch,
      per_page: 1,
    });

    if (data.workflow_runs.length === 0) {
      return null;
    }

    const run = data.workflow_runs[0];

    return {
      status: run.status as WorkflowStatus["status"],
      conclusion: run.conclusion as WorkflowStatus["conclusion"],
      runUrl: run.html_url,
    };
  } catch (error) {
    logger.error("Failed to get workflow status", error);
    return null;
  }
}

/**
 * Wait for workflow to complete with polling
 */
export async function waitForWorkflowCompletion(
  workflowFileName: string,
  branch: string,
  timeoutMs = 300000, // 5 minutes
  pollIntervalMs = 5000 // 5 seconds
): Promise<WorkflowStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getWorkflowRunStatus(workflowFileName, branch);

    if (!status) {
      logger.info("Workflow not started yet, waiting...");
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      continue;
    }

    if (status.status === "completed") {
      logger.info("Workflow completed", {
        conclusion: status.conclusion,
        runUrl: status.runUrl,
      });
      return status;
    }

    logger.info("Workflow in progress", {
      status: status.status,
      runUrl: status.runUrl,
    });

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Workflow did not complete within ${timeoutMs}ms`);
}

/**
 * Trigger a DAG run in Airflow
 */
export async function triggerAirflowDAGRun(
  dagId: string,
  conf: Record<string, unknown> = {}
): Promise<{ success: boolean; dagRunId?: string; error?: string }> {
  try {
    const airflowUrl = process.env.AIRFLOW_API_URL;
    const airflowApiKey = process.env.AIRFLOW_API_KEY;

    if (!airflowUrl || !airflowApiKey) {
      throw new Error("AIRFLOW_API_URL and AIRFLOW_API_KEY are required");
    }

    const response = await fetch(`${airflowUrl}/api/v1/dags/${dagId}/dagRuns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${airflowApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conf }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airflow API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    logger.info("DAG run triggered successfully", {
      dagId,
      dagRunId: data.dag_run_id,
    });

    return {
      success: true,
      dagRunId: data.dag_run_id,
    };
  } catch (error) {
    logger.error("Failed to trigger Airflow DAG run", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

