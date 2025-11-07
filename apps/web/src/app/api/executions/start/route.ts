import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { queueCompletePipeline } from "@/lib/queue/etl-queue";
import { createExecutionStages } from "@/db/queries/etl-executions";
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

    const stages = [
      { projectId, executionId, stageId: "extract", stageName: "Extract Data", stageOrder: 1, status: "pending" },
      { projectId, executionId, stageId: "transform", stageName: "Transform & Cleanse", stageOrder: 2, status: "pending" },
      { projectId, executionId, stageId: "load-dimensions", stageName: "Load Dimensions", stageOrder: 3, status: "pending" },
      { projectId, executionId, stageId: "load-facts", stageName: "Load Facts", stageOrder: 4, status: "pending" },
      { projectId, executionId, stageId: "validate", stageName: "Validate Data", stageOrder: 5, status: "pending" },
      { projectId, executionId, stageId: "report", stageName: "Generate Report", stageOrder: 6, status: "pending" },
    ];

    try {
      await createExecutionStages(stages);
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        logger.warn(`Execution stages already exist for ${executionId}, skipping creation`);
      } else {
        throw error;
      }
    }

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

