import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cancelJob } from "@/lib/queue/etl-queue";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/executions/[id]/cancel
 * Cancel an ETL execution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id;

    logger.info(`Cancelling execution`, { executionId });

    // Cancel all stage jobs for this execution
    const stages = [
      "extract",
      "transform",
      "load-dimensions",
      "load-facts",
      "validate",
      "report",
    ];

    await Promise.all(
      stages.map(async (stage) => {
        const jobId = `${executionId}-${stage}`;
        await cancelJob(jobId);
      })
    );

    logger.success(`Execution cancelled`, { executionId });

    return NextResponse.json({
      success: true,
      executionId,
      message: "Execution cancelled successfully",
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

