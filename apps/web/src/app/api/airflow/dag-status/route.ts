import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/airflow/dag-status
 * Get the status of an Airflow DAG run
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
    const response = await fetch(`${airflowUrl}/dags/${dagId}/dagRuns/${dagRunId}`, {
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

    return NextResponse.json({
      success: true,
      data: {
        dagId: data.dag_id,
        dagRunId: data.dag_run_id,
        state: data.state,
        executionDate: data.execution_date,
        startDate: data.start_date,
        endDate: data.end_date,
        externalTrigger: data.external_trigger,
        conf: data.conf,
      },
    });
  } catch (error) {
    console.error("Error fetching DAG status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch DAG status" },
      { status: 500 }
    );
  }
}

