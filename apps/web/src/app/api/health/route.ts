import { NextResponse } from "next/server";

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "DataBridge API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}

