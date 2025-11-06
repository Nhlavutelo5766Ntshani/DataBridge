import { NextResponse } from "next/server";
import { resumeQueue } from "@/lib/queue/etl-queue";
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

    logger.info(`Resuming ETL queue`, { executionId });

    await resumeQueue();

    return NextResponse.json({
      success: true,
      executionId,
      message: "ETL queue resumed successfully",
    });
  } catch (error) {
    logger.error(`Failed to resume ETL queue`, error);

    return NextResponse.json(
      {
        error: "Failed to resume ETL queue",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

