import { Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

/**
 * Create Redis connection
 * @returns Redis connection
 */
export function createRedisConnection(): Redis {
  return new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  });
}

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  MIGRATION: "migration",
  VALIDATION: "validation",
} as const;

/**
 * Job types for migration queue
 */
export type MigrationJobData = {
  projectId: string;
  tableMappingId: string;
  userId: string;
  batchSize?: number;
};

/**
 * Job result
 */
export type MigrationJobResult = {
  success: boolean;
  rowsProcessed: number;
  rowsFailed: number;
  executionId: string;
  errors?: string[];
};

/**
 * Create migration queue
 * @returns Queue instance
 */
export function createMigrationQueue(): Queue<MigrationJobData, MigrationJobResult> {
  return new Queue<MigrationJobData, MigrationJobResult>(
    QUEUE_NAMES.MIGRATION,
    {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 86400,
        },
        removeOnFail: {
          count: 1000,
        },
      },
    }
  );
}

/**
 * Create queue events listener
 * @param queueName - Queue name
 * @returns QueueEvents instance
 */
export function createQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, {
    connection: createRedisConnection(),
  });
}

