import { Worker, Job } from "bullmq";
import type { ETLJobData } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { extractToStaging } from "@/lib/services/etl/stage1-extract";
import { transformAndCleanse } from "@/lib/services/etl/stage2-transform";
import { loadDimensions } from "@/lib/services/etl/stage3-load-dimensions";
import { loadFacts } from "@/lib/services/etl/stage4-load-facts";
import { validateData } from "@/lib/services/etl/stage5-validate";
import { generateMigrationReport } from "@/lib/services/etl/stage6-generate-report";
import { updateExecutionStageByIds } from "@/db/queries/etl-executions";
import { updateProject } from "@/db/queries/projects";

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
export async function processETLJob(job: Job<ETLJobData>) {
  const { projectId, executionId, stage, config } = job.data;

  logger.info(`🚀 [WORKER] Starting ETL job`, {
    jobId: job.id,
    projectId,
    executionId,
    stage,
    timestamp: new Date().toISOString(),
  });

  await job.updateProgress(10);

  logger.info(`📝 [WORKER] Updating stage status to "running"`, {
    executionId,
    stage,
  });

  await updateExecutionStageByIds(executionId, stage, {
    status: "running",
    startTime: new Date(),
  });

  logger.info(`✅ [WORKER] Stage marked as running, executing stage function...`, {
    stage,
  });

  try {
    let result;

    logger.info(`🔄 [WORKER] Executing stage: ${stage}`, {
      projectId,
      executionId,
    });

    switch (stage) {
      case "extract":
        logger.info(`📥 [WORKER] Stage 1: Extracting data to staging...`);
        result = await extractToStaging(projectId, executionId, config);
        break;

      case "transform":
        logger.info(`🔧 [WORKER] Stage 2: Transforming and cleansing data...`);
        result = await transformAndCleanse(projectId, executionId, config);
        break;

      case "load-dimensions":
        logger.info(`📊 [WORKER] Stage 3: Loading dimension tables...`);
        result = await loadDimensions(projectId, executionId, config);
        break;

      case "load-facts":
        logger.info(`📈 [WORKER] Stage 4: Loading fact tables...`);
        result = await loadFacts(projectId, executionId, config);
        break;

      case "validate":
        logger.info(`✔️ [WORKER] Stage 5: Validating data...`);
        result = await validateData(projectId, executionId, config);
        break;

      case "report":
        logger.info(`📄 [WORKER] Stage 6: Generating migration report...`);
        result = await generateMigrationReport(projectId, executionId);
        break;

      default:
        throw new Error(`Unknown ETL stage: ${stage}`);
    }

    logger.info(`🎯 [WORKER] Stage function completed`, {
      stage,
      success: result.success,
      recordsProcessed: result.recordsProcessed,
      recordsFailed: result.recordsFailed,
      duration: result.duration,
    });

    await job.updateProgress(100);

    if (!result.success) {
      logger.error(`❌ [WORKER] Stage failed (result.success = false)`, {
        stage,
        error: result.error,
        recordsProcessed: result.recordsProcessed,
        recordsFailed: result.recordsFailed,
      });

      await updateExecutionStageByIds(executionId, stage, {
        status: "failed",
        endTime: new Date(),
        duration: result.duration,
        recordsProcessed: result.recordsProcessed,
        recordsFailed: result.recordsFailed,
        errorMessage: result.error,
      });

      throw new Error(result.error || `Stage ${stage} failed`);
    }

    logger.info(`💾 [WORKER] Updating stage status to "completed"`, {
      executionId,
      stage,
    });

    await updateExecutionStageByIds(executionId, stage, {
      status: "completed",
      endTime: new Date(),
      duration: result.duration,
      recordsProcessed: result.recordsProcessed,
      recordsFailed: result.recordsFailed,
      metadata: result.metadata,
    });

    if (stage === "report") {
      logger.info(`🏁 [WORKER] All stages completed, updating project status`);

      await updateProject(projectId, {
        status: "completed",
        lastExecutionTime: new Date(),
      });

      logger.success(`🎊 [WORKER] Migration completed and project status updated!`, {
        projectId,
        executionId,
      });
    }

    logger.success(`✨ [WORKER] ETL job completed successfully!`, {
      jobId: job.id,
      stage,
      duration: result.duration,
      recordsProcessed: result.recordsProcessed,
    });

    return result;
  } catch (error) {
    logger.error(`💥 [WORKER] Exception caught during job processing`, {
      jobId: job.id,
      stage,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    await updateExecutionStageByIds(executionId, stage, {
      status: "failed",
      endTime: new Date(),
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    await updateProject(projectId, {
      status: "failed",
      lastExecutionTime: new Date(),
    });

    logger.error(`🔴 [WORKER] ETL job failed`, {
      jobId: job.id,
      stage,
      error,
    });

    throw error;
  }
}

/**
 * ETL Worker Instance (lazy initialization)
 */
let etlWorker: Worker<ETLJobData> | null = null;

function getWorker(): Worker<ETLJobData> {
  if (!etlWorker) {
    etlWorker = new Worker<ETLJobData>(
      "etl-jobs",
      processETLJob,
      {
        connection: getRedisConnection(),
        concurrency: parseInt(process.env.ETL_WORKER_CONCURRENCY || "2"),
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    etlWorker.on("completed", (job) => {
      logger.success(`🎉 [WORKER EVENT] Job completed`, {
        jobId: job.id,
        name: job.name,
        timestamp: new Date().toISOString(),
      });
    });

    etlWorker.on("failed", (job, error) => {
      logger.error(`❌ [WORKER EVENT] Job failed`, {
        jobId: job?.id,
        name: job?.name,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    etlWorker.on("error", (error) => {
      logger.error(`🚨 [WORKER EVENT] Worker error`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    });

    etlWorker.on("active", (job) => {
      logger.info(`▶️ [WORKER EVENT] Job started`, {
        jobId: job.id,
        name: job.name,
        timestamp: new Date().toISOString(),
      });
    });

    etlWorker.on("progress", (job, progress) => {
      logger.info(`📊 [WORKER EVENT] Job progress`, {
        jobId: job.id,
        name: job.name,
        progress: `${progress}%`,
      });
    });
  }

  return etlWorker;
}

/**
 * Graceful shutdown handler
 */
export async function shutdownWorker(): Promise<void> {
  if (etlWorker) {
    logger.info(`🛑 [WORKER] Shutting down ETL worker...`);
    await etlWorker.close();
    logger.info(`✅ [WORKER] ETL worker shut down successfully`);
  }
}

/**
 * Initialize worker (for standalone worker process)
 */
export function initializeWorker(): void {
  const worker = getWorker();
  
  logger.success(`🚀 [WORKER] ETL Worker initialized and ready!`, {
    concurrency: worker.opts.concurrency,
    limiter: worker.opts.limiter,
    redisHost: getRedisConnection().host,
    redisPort: getRedisConnection().port,
    timestamp: new Date().toISOString(),
  });

  logger.info(`👂 [WORKER] Listening for jobs on queue: etl-jobs`);

  process.on("SIGTERM", async () => {
    logger.info(`📡 [WORKER] Received SIGTERM signal`);
    await shutdownWorker();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.info(`📡 [WORKER] Received SIGINT signal`);
    await shutdownWorker();
    process.exit(0);
  });
}

