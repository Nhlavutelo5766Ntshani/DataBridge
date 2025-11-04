import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/airflow/task-instances
 * Get task instances for a DAG run
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dagId = searchParams.get("dagId");
    const dagRunId = searchParams.get("dagRunId");

    if (!dagId || !dagRunId) {
      return NextResponse.json(
        { success: false, error: "Missing dagId or dagRunId" },
        { status: 400 }
      );
    }

    // Call Airflow API
    const airflowUrl = process.env.AIRFLOW_API_URL || "http://localhost:8080/api/v1";
    const response = await fetch(`${airflowUrl}/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`, {
      headers: {
        Authorization: `Bearer ${process.env.AIRFLOW_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Airflow API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const tasks = data.task_instances.map(
      (task: {
        task_id: string;
        state: string;
        start_date: string | null;
        end_date: string | null;
        duration: number | null;
        try_number: number;
        max_tries: number;
      }) => ({
        taskId: task.task_id,
        taskName: task.task_id.replace(/_/g, " "),
        status: task.state.toLowerCase(),
        startTime: task.start_date,
        endTime: task.end_date,
        duration: task.duration,
        tryNumber: task.try_number,
        maxTries: task.max_tries,
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        totalTasks: tasks.length,
      },
    });
  } catch (error) {
    console.error("Error fetching task instances:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task instances" },
      { status: 500 }
    );
  }
}

