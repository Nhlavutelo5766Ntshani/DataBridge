import { NextResponse } from "next/server";
import { cancelJob } from "@/lib/queue/etl-queue";
import { updateExecutionStageByIds } from "@/db/queries/etl-executions";
import { getExecutionStages } from "@/db/queries/etl-executions";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/executions/[id]/cancel
 * Cancel an ETL execution and all its queued jobs
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: executionId } = await params;

    if (!executionId) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    logger.info(`Cancelling execution`, { executionId });

    const stages = await getExecutionStages(executionId);

    if (!stages || stages.length === 0) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    let cancelledCount = 0;

    for (const stage of stages) {
      if (stage.status === "pending" || stage.status === "running") {
        const jobId = `${executionId}-${stage.stageId}`;
        
        try {
          await cancelJob(jobId);
          
          await updateExecutionStageByIds(executionId, stage.stageId, {
            status: "failed",
            errorMessage: "Cancelled by user",
            endTime: new Date(),
          });

          cancelledCount++;
        } catch (error) {
          logger.error(`Failed to cancel job`, {
            jobId,
            error,
          });
        }
      }
    }

    logger.success(`Execution cancelled`, {
      executionId,
      stagesCancelled: cancelledCount,
    });

    return NextResponse.json({
      success: true,
      executionId,
      stagesCancelled: cancelledCount,
      message: `Cancelled ${cancelledCount} stage(s)`,
    });
  } catch (error) {
    logger.error(`Failed to cancel execution`, error);

    return NextResponse.json(
      {
        error: "Failed to cancel execution",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
