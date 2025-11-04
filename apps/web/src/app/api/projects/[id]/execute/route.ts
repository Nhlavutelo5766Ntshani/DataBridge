import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/db/queries/projects";
import { getProjectPipelines } from "@/db/queries/pipelines";
import { executePipeline } from "@/lib/services/pipeline-executor";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * API endpoint for executing all pipelines in a project
 * Called by Airflow DAG when running the entire project
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId } = await context.params;
    
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (!apiKey || apiKey !== process.env.DATABRIDGE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.strategy !== "multi-pipeline") {
      return NextResponse.json(
        { success: false, error: "Only multi-pipeline projects can be executed via this endpoint" },
        { status: 400 }
      );
    }

    const pipelines = await getProjectPipelines(projectId);
    const sortedPipelines = [...pipelines].sort((a, b) => a.pipelineOrder - b.pipelineOrder);

    const results = [];
    
    for (const pipeline of sortedPipelines) {
      if (pipeline.status === "active") {
        const result = await executePipeline(pipeline);
        results.push({
          pipelineId: pipeline.id,
          name: pipeline.name,
          success: result.success,
          error: result.error,
        });

        if (!result.success) {
          break;
        }
      }
    }

    const allSuccessful = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      data: {
        projectId,
        pipelinesExecuted: results.length,
        results,
      },
    });
  } catch (error) {
    console.error("Project execution error:", error);
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
 * GET endpoint to check project status and pipeline count
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId } = await context.params;
    
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (!apiKey || apiKey !== process.env.DATABRIDGE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const pipelines = await getProjectPipelines(projectId);

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        strategy: project.strategy,
        status: project.status,
        pipelineCount: pipelines.length,
        activePipelines: pipelines.filter((p) => p.status === "active").length,
      },
    });
  } catch (error) {
    console.error("Project status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

