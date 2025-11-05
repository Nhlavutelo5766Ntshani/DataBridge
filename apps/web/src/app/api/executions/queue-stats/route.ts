import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/queue/etl-queue";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/executions/queue-stats
 * Get ETL queue statistics
 */
export async function GET() {
  try {
    logger.info(`Fetching queue statistics`);

    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error(`Failed to fetch queue statistics`, error);

    return NextResponse.json(
      {
        error: "Failed to fetch queue statistics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

