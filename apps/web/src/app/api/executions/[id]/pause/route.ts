import { NextResponse } from "next/server";
import { pauseQueue } from "@/lib/queue/etl-queue";
import { logger } from "@/lib/utils/logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: executionId } = await params;

    if (!executionId) {
      return NextResponse.json({ error: "Execution ID is required" }, { status: 400 });
    }

    logger.info(`Pausing ETL queue`, { executionId });

    await pauseQueue();

    return NextResponse.json({
      success: true,
      executionId,
      message: "ETL queue paused successfully",
    });
  } catch (error) {
    logger.error(`Failed to pause ETL queue`, error);

    return NextResponse.json(
      {
        error: "Failed to pause ETL queue",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

