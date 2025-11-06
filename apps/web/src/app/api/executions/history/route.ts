import { NextResponse } from "next/server";
import { db } from "@/db";
import { etlExecutionStages, mappingProjects } from "@databridge/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const stages = await db
      .select({
        executionId: etlExecutionStages.executionId,
        projectId: etlExecutionStages.projectId,
        projectName: mappingProjects.name,
        stageName: etlExecutionStages.stageName,
        status: etlExecutionStages.status,
        startTime: etlExecutionStages.startTime,
        endTime: etlExecutionStages.endTime,
        duration: etlExecutionStages.duration,
        recordsProcessed: etlExecutionStages.recordsProcessed,
        recordsFailed: etlExecutionStages.recordsFailed,
      })
      .from(etlExecutionStages)
      .leftJoin(mappingProjects, eq(etlExecutionStages.projectId, mappingProjects.id))
      .orderBy(desc(etlExecutionStages.createdAt))
      .limit(100);

    const executionMap = new Map();

    stages.forEach((stage) => {
      const execId = stage.executionId;

      if (!executionMap.has(execId)) {
        executionMap.set(execId, {
          id: execId,
          projectId: stage.projectId,
          projectName: stage.projectName || "Unknown Project",
          status: "pending" as const,
          startTime: stage.startTime,
          endTime: stage.endTime,
          duration: 0,
          recordsProcessed: 0,
          recordsFailed: 0,
          progress: 0,
          stagesCompleted: 0,
          totalStages: 0,
        });
      }

      const execution = executionMap.get(execId);
      execution.totalStages++;

      if (stage.status === "completed") {
        execution.stagesCompleted++;
      }

      if (stage.status === "failed") {
        execution.status = "failed";
      } else if (stage.status === "running" && execution.status !== "failed") {
        execution.status = "running";
      } else if (stage.status === "completed" && execution.status === "pending") {
        execution.status = execution.stagesCompleted === execution.totalStages ? "completed" : "running";
      }

      execution.recordsProcessed += stage.recordsProcessed || 0;
      execution.recordsFailed += stage.recordsFailed || 0;
      execution.duration += stage.duration || 0;

      if (execution.totalStages > 0) {
        execution.progress = Math.round((execution.stagesCompleted / execution.totalStages) * 100);
      }
    });

    const executions = Array.from(executionMap.values());

    return NextResponse.json({
      success: true,
      executions,
    });
  } catch (error) {
    logger.error("Failed to fetch execution history", error);

    return NextResponse.json(
      {
        error: "Failed to fetch execution history",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

