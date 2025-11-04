import { NextRequest, NextResponse } from "next/server";
import { executePipeline } from "@/lib/services/pipeline-executor";
import { getPipelineById } from "@/db/queries/pipelines";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * API endpoint for executing a specific pipeline
 * Called by Airflow DAG tasks
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: pipelineId } = await context.params;
    
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (!apiKey || apiKey !== process.env.DATABRIDGE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pipeline = await getPipelineById(pipelineId);
    
    if (!pipeline) {
      return NextResponse.json(
        { success: false, error: "Pipeline not found" },
        { status: 404 }
      );
    }

    if (pipeline.status !== "active") {
      return NextResponse.json(
        { success: false, error: `Pipeline status is ${pipeline.status}. Only active pipelines can be executed.` },
        { status: 400 }
      );
    }

    const result = await executePipeline(pipeline);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pipelineId: pipeline.id,
        projectId: pipeline.projectId,
        executionId: result.data?.id,
        recordsProcessed: result.data?.recordsProcessed || 0,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Pipeline execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check pipeline status
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: pipelineId } = await context.params;
    
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (!apiKey || apiKey !== process.env.DATABRIDGE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pipeline = await getPipelineById(pipelineId);
    
    if (!pipeline) {
      return NextResponse.json(
        { success: false, error: "Pipeline not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pipeline.id,
        name: pipeline.name,
        status: pipeline.status,
        projectId: pipeline.projectId,
        pipelineOrder: pipeline.pipelineOrder,
      },
    });
  } catch (error) {
    console.error("Pipeline status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

