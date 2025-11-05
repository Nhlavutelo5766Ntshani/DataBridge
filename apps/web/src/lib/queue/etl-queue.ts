import { Queue } from "bullmq";
import type { ETLJobData } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";

/**
 * Redis connection configuration for BullMQ
 */
function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required for BullMQ");
  }

  // Parse Redis URL
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
  };
}

/**
 * ETL Job Queue using BullMQ
 * Handles queueing and processing of ETL pipeline stages
 */
export const etlQueue = new Queue<ETLJobData>("etl-jobs", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 604800, // 7 days
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
});

/**
 * Add ETL pipeline execution to queue
 * @param jobData - ETL job data
 * @returns Job ID
 */
export async function queueETLExecution(jobData: ETLJobData): Promise<string> {
  logger.info(`Queueing ETL execution`, {
    projectId: jobData.projectId,
    executionId: jobData.executionId,
    stage: jobData.stage,
  });

  const job = await etlQueue.add(
    `etl-${jobData.executionId}-${jobData.stage}`,
    jobData,
    {
      jobId: `${jobData.executionId}-${jobData.stage}`,
      priority: getPriority(jobData.stage),
    }
  );

  logger.success(`ETL job queued`, {
    jobId: job.id,
    projectId: jobData.projectId,
    stage: jobData.stage,
  });

  return job.id || "";
}

/**
 * Queue complete ETL pipeline (all 6 stages)
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @param config - ETL pipeline configuration
 */
export async function queueCompletePipeline(
  projectId: string,
  executionId: string,
  config: ETLJobData["config"]
): Promise<string[]> {
  logger.info(`Queueing complete ETL pipeline`, {
    projectId,
    executionId,
  });

  const stages: ETLJobData["stage"][] = [
    "extract",
    "transform",
    "load-dimensions",
    "load-facts",
    "validate",
    "report",
  ];

  const jobIds: string[] = [];

  for (const stage of stages) {
    const jobId = await queueETLExecution({
      projectId,
      executionId,
      stage,
      config,
    });
    jobIds.push(jobId);
  }

  logger.success(`Complete ETL pipeline queued`, {
    projectId,
    executionId,
    stagesQueued: stages.length,
  });

  return jobIds;
}

/**
 * Get priority for ETL stage
 * Lower number = higher priority
 * @param stage - ETL stage name
 * @returns Priority value
 */
function getPriority(stage: ETLJobData["stage"]): number {
  const priorities: Record<ETLJobData["stage"], number> = {
    extract: 1,
    transform: 2,
    "load-dimensions": 3,
    "load-facts": 4,
    validate: 5,
    report: 6,
  };

  return priorities[stage] || 10;
}

/**
 * Get job status
 * @param jobId - Job ID
 * @returns Job status and progress
 */
export async function getJobStatus(jobId: string) {
  const job = await etlQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: await job.progress(),
    state: await job.getState(),
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  };
}

/**
 * Cancel a job
 * @param jobId - Job ID
 */
export async function cancelJob(jobId: string): Promise<void> {
  const job = await etlQueue.getJob(jobId);

  if (job) {
    await job.remove();
    logger.info(`Job cancelled`, { jobId });
  }
}

/**
 * Pause the queue
 */
export async function pauseQueue(): Promise<void> {
  await etlQueue.pause();
  logger.warn(`ETL queue paused`);
}

/**
 * Resume the queue
 */
export async function resumeQueue(): Promise<void> {
  await etlQueue.resume();
  logger.info(`ETL queue resumed`);
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    etlQueue.getWaitingCount(),
    etlQueue.getActiveCount(),
    etlQueue.getCompletedCount(),
    etlQueue.getFailedCount(),
    etlQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

