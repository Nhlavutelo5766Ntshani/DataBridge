import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getScheduledProjects } from "@/db/queries/projects";
import { updateProjectLastExecution } from "@/db/queries/projects";
import { initializeExecutionStages } from "@/lib/actions/etl-executions";
import { queueCompletePipeline } from "@/lib/queue/etl-queue";
import type { ETLPipelineConfig } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/cron/run-scheduled-migrations
 * Vercel Cron job to run scheduled migrations
 * 
 * Requires CRON_SECRET environment variable for authentication
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error("CRON_SECRET environment variable not set");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron job attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    logger.info("Running scheduled migrations check");

    const scheduledProjects = await getScheduledProjects();

    if (!scheduledProjects || scheduledProjects.length === 0) {
      logger.info("No scheduled projects found");
      return NextResponse.json({
        success: true,
        message: "No scheduled projects to run",
        projectsTriggered: 0,
      });
    }

    logger.info(`Found ${scheduledProjects.length} scheduled projects`);

    const now = Date.now();
    const triggeredProjects: string[] = [];

    for (const project of scheduledProjects) {
      try {
        const shouldRun = shouldRunMigration(
          project.lastExecutionTime,
          project.scheduleInterval
        );

        if (!shouldRun) {
          logger.debug(`Skipping project (not due yet)`, {
            projectId: project.id,
            projectName: project.name,
          });
          continue;
        }

        logger.info(`Triggering scheduled migration`, {
          projectId: project.id,
          projectName: project.name,
        });

        const executionId = `exec-${project.id}-${now}`;

        const etlConfig = (project.etlConfig as unknown as ETLPipelineConfig) || {
          projectId: project.id,
          executionId,
          batchSize: 1000,
          parallelism: 2,
          errorHandling: "continue-on-error",
          validateData: true,
          staging: {
            databaseUrl: process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || "",
            schemaName: "staging",
            tablePrefix: "stg_",
            cleanupAfterMigration: false,
            autoCreate: true,
          },
          loadStrategy: "truncate-load",
          retryAttempts: 3,
          retryDelayMs: 5000,
        };

        await initializeExecutionStages(project.id, executionId);

        await queueCompletePipeline(project.id, executionId, etlConfig);

        await updateProjectLastExecution(project.id, new Date());

        triggeredProjects.push(project.id);

        logger.success(`Scheduled migration triggered`, {
          projectId: project.id,
          executionId,
        });
      } catch (error) {
        logger.error(`Failed to trigger scheduled migration`, {
          projectId: project.id,
          error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Triggered ${triggeredProjects.length} scheduled migration(s)`,
      projectsTriggered: triggeredProjects.length,
      projectIds: triggeredProjects,
    });
  } catch (error) {
    logger.error("Cron job failed", error);

    return NextResponse.json(
      {
        error: "Cron job failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Determine if a migration should run based on last execution and interval
 * @param lastExecutionTime - Last execution timestamp
 * @param scheduleInterval - Interval in minutes
 * @returns Whether migration should run
 */
function shouldRunMigration(
  lastExecutionTime: Date | null,
  scheduleInterval: number | null
): boolean {
  if (!scheduleInterval) {
    return false;
  }

  if (!lastExecutionTime) {
    return true;
  }

  const now = Date.now();
  const lastRun = new Date(lastExecutionTime).getTime();
  const intervalMs = scheduleInterval * 60 * 1000;

  return now - lastRun >= intervalMs;
}
