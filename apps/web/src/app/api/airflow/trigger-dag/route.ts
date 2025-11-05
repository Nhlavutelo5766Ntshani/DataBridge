import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/airflow/trigger-dag
 * Trigger an Airflow DAG run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dagId, conf } = body;

    if (!dagId) {
      return NextResponse.json({ success: false, error: "Missing dagId" }, { status: 400 });
    }

    // Call Airflow API to trigger DAG
    const airflowUrl = process.env.AIRFLOW_API_URL || "http://localhost:8080/api/v1";
    const response = await fetch(`${airflowUrl}/dags/${dagId}/dagRuns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        conf: conf || {},
        logical_date: new Date().toISOString(),
      }),
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
        executionDate: data.execution_date,
        startDate: data.start_date,
        state: data.state,
      },
    });
  } catch (error) {
    console.error("Error triggering DAG:", error);
    return NextResponse.json({ success: false, error: "Failed to trigger DAG" }, { status: 500 });
  }
}

