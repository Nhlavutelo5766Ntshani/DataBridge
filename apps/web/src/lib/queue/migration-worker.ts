import { Worker, Job } from "bullmq";
import { createRedisConnection, QUEUE_NAMES, type MigrationJobData, type MigrationJobResult } from "./config";
import { logger } from "@/lib/utils/logger";
import { executeMigration } from "@/lib/services/migration-executor";

/**
 * Create migration worker
 * @returns Worker instance
 */
export function createMigrationWorker(): Worker<MigrationJobData, MigrationJobResult> {
  const worker = new Worker<MigrationJobData, MigrationJobResult>(
    QUEUE_NAMES.MIGRATION,
    async (job: Job<MigrationJobData>) => {
      logger.info(`Processing migration job ${job.id}`, {
        projectId: job.data.projectId,
        tableMappingId: job.data.tableMappingId,
      });

      try {
        await job.updateProgress(0);
        
        const result = await executeMigration(
          job.data.projectId,
          job.data.tableMappingId,
          job.data.batchSize || 1000,
          async (progress: number) => {
            await job.updateProgress(progress);
          }
        );

        logger.info(`Migration job ${job.id} completed successfully`, {
          rowsProcessed: result.rowsProcessed,
        });

        return result;
      } catch (error) {
        logger.error(`Migration job ${job.id} failed`, error);
        throw error;
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60000,
      },
    }
  );

  worker.on("completed", (job: Job<MigrationJobData, MigrationJobResult>, result: MigrationJobResult) => {
    logger.info(`Job ${job.id} completed`, { result });
  });

  worker.on("failed", (job: Job<MigrationJobData, MigrationJobResult> | undefined, error: Error) => {
    logger.error(`Job ${job?.id} failed`, error);
  });

  worker.on("progress", (job, progress) => {
    logger.info(`Job ${job.id} progress: ${progress}`);
  });

  return worker;
}

/**
 * Start migration worker
 * @returns Worker instance
 */
export function startMigrationWorker(): Worker<MigrationJobData, MigrationJobResult> {
  const worker = createMigrationWorker();
  
  logger.info("Migration worker started");
  
  return worker;
}

