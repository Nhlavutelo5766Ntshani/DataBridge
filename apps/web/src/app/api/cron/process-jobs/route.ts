import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import { logger } from "@/lib/utils/logger";
import { processETLJob } from "@/lib/queue/etl-worker";

function getETLQueue() {
  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  return new Queue("etl-pipeline", {
    connection: {
      url: REDIS_URL,
      maxRetriesPerRequest: null,
    },
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("🔄 [CRON] Starting job processing...");

    const etlQueue = getETLQueue();
    const waitingJobs = await etlQueue.getWaiting();
    const activeJobs = await etlQueue.getActive();

    logger.info(`📊 [CRON] Found ${waitingJobs.length} waiting jobs, ${activeJobs.length} active jobs`);

    if (waitingJobs.length === 0) {
      logger.info("✅ [CRON] No jobs to process");
      return NextResponse.json({
        success: true,
        message: "No jobs to process",
        processed: 0,
      });
    }

    const jobsToProcess = waitingJobs.slice(0, 5);
    let processed = 0;
    let failed = 0;

    for (const job of jobsToProcess) {
      try {
        logger.info(`🔨 [CRON] Processing job ${job.id}...`);
        
        await processETLJob(job);
        
        await job.moveToCompleted("done", job.token || "0", true);
        processed++;
        
        logger.success(`✅ [CRON] Job ${job.id} completed`);
      } catch (error) {
        failed++;
        logger.error(`❌ [CRON] Job ${job.id} failed:`, error);
        
        await job.moveToFailed(
          error instanceof Error ? error : new Error(String(error)),
          job.token || "0",
          true
        );
      }
    }

    logger.success(`🎉 [CRON] Processed ${processed} jobs, ${failed} failed`);

    return NextResponse.json({
      success: true,
      processed,
      failed,
      remaining: waitingJobs.length - jobsToProcess.length,
    });
  } catch (error) {
    logger.error("❌ [CRON] Error processing jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

