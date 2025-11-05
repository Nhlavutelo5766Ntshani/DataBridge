import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/queue/etl-queue";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/executions/queue-stats
 * Get BullMQ queue statistics
 */
export async function GET() {
  try {
    logger.info(`Fetching queue statistics`);

    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats: {
        waiting: stats.waiting,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed,
        delayed: stats.delayed,
        total: stats.total,
      },
      timestamp: new Date().toISOString(),
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
