import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { queueCompletePipeline } from "@/lib/queue/etl-queue";
import type { ETLPipelineConfig } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/executions/start
 * Start a new ETL pipeline execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, executionId, config } = body as {
      projectId: string;
      executionId: string;
      config: ETLPipelineConfig;
    };

    if (!projectId || !executionId || !config) {
      return NextResponse.json(
        { error: "projectId, executionId, and config are required" },
        { status: 400 }
      );
    }

    logger.info(`Starting ETL execution via API`, { projectId, executionId });

    const jobIds = await queueCompletePipeline(projectId, executionId, config);

    return NextResponse.json({
      success: true,
      executionId,
      jobIds,
      message: "ETL pipeline started successfully",
    });
  } catch (error) {
    logger.error(`Failed to start ETL execution`, error);

    return NextResponse.json(
      {
        error: "Failed to start ETL execution",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

