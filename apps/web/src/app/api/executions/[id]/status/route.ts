import { NextResponse } from "next/server";
import { getExecutionStages } from "@/db/queries/etl-executions";
import { getJobStatus } from "@/lib/queue/etl-queue";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/executions/[id]/status
 * Get execution status with all stages and BullMQ job details
 */
export async function GET(
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

    logger.info(`Fetching execution status`, { executionId });

    const stages = await getExecutionStages(executionId);

    if (!stages || stages.length === 0) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    const stagesWithJobStatus = await Promise.all(
      stages.map(async (stage) => {
        const jobId = `${executionId}-${stage.stageId}`;
        const jobStatus = await getJobStatus(jobId);

        return {
          stageId: stage.stageId,
          stageName: stage.stageName,
          status: stage.status,
          startTime: stage.startTime,
          endTime: stage.endTime,
          duration: stage.duration,
          recordsProcessed: stage.recordsProcessed,
          recordsFailed: stage.recordsFailed,
          errorMessage: stage.errorMessage,
          metadata: stage.metadata,
          job: jobStatus
            ? {
                id: jobStatus.id,
                state: jobStatus.state,
                progress: jobStatus.progress,
                attemptsMade: jobStatus.attemptsMade,
                failedReason: jobStatus.failedReason,
                processedOn: jobStatus.processedOn,
                finishedOn: jobStatus.finishedOn,
              }
            : null,
        };
      })
    );

    const completedStages = stages.filter((s) => s.status === "completed").length;
    const failedStages = stages.filter((s) => s.status === "failed").length;
    const totalStages = stages.length;
    const progress = Math.round((completedStages / totalStages) * 100);

    const overallStatus =
      failedStages > 0
        ? "failed"
        : completedStages === totalStages
        ? "completed"
        : "running";

    const totalRecordsProcessed = stages.reduce(
      (sum, stage) => sum + (stage.recordsProcessed || 0),
      0
    );
    const totalRecordsFailed = stages.reduce(
      (sum, stage) => sum + (stage.recordsFailed || 0),
      0
    );

    return NextResponse.json({
      executionId,
      status: overallStatus,
      progress,
      totalStages,
      completedStages,
      failedStages,
      totalRecordsProcessed,
      totalRecordsFailed,
      stages: stagesWithJobStatus,
      startTime: stages[0]?.createdAt,
      endTime: stages[stages.length - 1]?.endTime,
    });
  } catch (error) {
    logger.error(`Failed to fetch execution status`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch execution status",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
