import { Worker, Job } from "bullmq";
import type { ETLJobData } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { extractToStaging } from "@/lib/services/etl/stage1-extract";
import { transformAndCleanse } from "@/lib/services/etl/stage2-transform";
import { loadDimensions } from "@/lib/services/etl/stage3-load-dimensions";
import { loadFacts } from "@/lib/services/etl/stage4-load-facts";
import { validateData } from "@/lib/services/etl/stage5-validate";
import { generateMigrationReport } from "@/lib/services/etl/stage6-generate-report";

/**
 * Redis connection configuration
 */
function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
  };
}

/**
 * Process ETL job based on stage
 * @param job - BullMQ job
 * @returns Stage result
 */
async function processETLJob(job: Job<ETLJobData>) {
  const { projectId, executionId, stage, config } = job.data;

  logger.info(`Processing ETL job`, {
    jobId: job.id,
    projectId,
    executionId,
    stage,
  });

  // Update job progress
  await job.updateProgress(10);

  try {
    let result;

    switch (stage) {
      case "extract":
        result = await extractToStaging(projectId, executionId, config);
        break;

      case "transform":
        result = await transformAndCleanse(projectId, executionId, config);
        break;

      case "load-dimensions":
        result = await loadDimensions(projectId, executionId, config);
        break;

      case "load-facts":
        result = await loadFacts(projectId, executionId, config);
        break;

      case "validate":
        result = await validateData(projectId, executionId, config);
        break;

      case "report":
        result = await generateMigrationReport(projectId, executionId);
        break;

      default:
        throw new Error(`Unknown ETL stage: ${stage}`);
    }

    await job.updateProgress(100);

    if (!result.success) {
      throw new Error(result.error || `Stage ${stage} failed`);
    }

    logger.success(`ETL job completed`, {
      jobId: job.id,
      stage,
      duration: result.duration,
      recordsProcessed: result.recordsProcessed,
    });

    return result;
  } catch (error) {
    logger.error(`ETL job failed`, {
      jobId: job.id,
      stage,
      error,
    });

    throw error;
  }
}

/**
 * ETL Worker Instance
 * Processes ETL jobs from the queue
 */
export const etlWorker = new Worker<ETLJobData>(
  "etl-jobs",
  processETLJob,
  {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.ETL_WORKER_CONCURRENCY || "2"),
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per 1 second
    },
  }
);

/**
 * Worker event handlers
 */
etlWorker.on("completed", (job) => {
  logger.success(`Worker completed job`, {
    jobId: job.id,
    name: job.name,
  });
});

etlWorker.on("failed", (job, error) => {
  logger.error(`Worker job failed`, {
    jobId: job?.id,
    name: job?.name,
    error: error.message,
  });
});

etlWorker.on("error", (error) => {
  logger.error(`Worker error`, error);
});

etlWorker.on("active", (job) => {
  logger.info(`Worker started job`, {
    jobId: job.id,
    name: job.name,
  });
});

/**
 * Graceful shutdown handler
 */
export async function shutdownWorker(): Promise<void> {
  logger.info(`Shutting down ETL worker...`);
  await etlWorker.close();
  logger.info(`ETL worker shut down successfully`);
}

/**
 * Initialize worker (for standalone worker process)
 */
export function initializeWorker(): void {
  logger.info(`ETL Worker initialized`, {
    concurrency: etlWorker.opts.concurrency,
    limiter: etlWorker.opts.limiter,
  });

  // Handle process termination
  process.on("SIGTERM", async () => {
    await shutdownWorker();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await shutdownWorker();
    process.exit(0);
  });
}

