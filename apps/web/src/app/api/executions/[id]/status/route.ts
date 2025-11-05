import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getJobStatus } from "@/lib/queue/etl-queue";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/executions/[id]/status
 * Get execution status for all stages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id;

    logger.info(`Fetching execution status`, { executionId });

    // Get status for all stages
    const stages = [
      "extract",
      "transform",
      "load-dimensions",
      "load-facts",
      "validate",
      "report",
    ];

    const stageStatuses = await Promise.all(
      stages.map(async (stage) => {
        const jobId = `${executionId}-${stage}`;
        const status = await getJobStatus(jobId);
        return { stage, ...status };
      })
    );

    // Calculate overall execution status
    const hasRunning = stageStatuses.some((s) => s.state === "active");
    const hasFailed = stageStatuses.some((s) => s.state === "failed");
    const allCompleted = stageStatuses.every((s) => s.state === "completed");

    const overallStatus = hasFailed
      ? "failed"
      : hasRunning
        ? "running"
        : allCompleted
          ? "completed"
          : "pending";

    // Calculate progress
    const completedCount = stageStatuses.filter(
      (s) => s.state === "completed"
    ).length;
    const progress = Math.round((completedCount / stages.length) * 100);

    return NextResponse.json({
      executionId,
      status: overallStatus,
      progress,
      stages: stageStatuses,
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

