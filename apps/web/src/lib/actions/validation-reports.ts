"use server";

import { db } from "@/db";
import { dataValidations, etlExecutionStages } from "@databridge/schema";
import { desc, eq, and } from "drizzle-orm";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/errors";
import type { QueryResponse } from "@/db/types/queries";

/**
 * Fetch all validation reports (aggregated from data_validations)
 */
export async function fetchAllValidationReports(): Promise<
  QueryResponse<
    Array<{
      id: string;
      executionId: string;
      reportType: string;
      validationType: string;
      status: string;
      details: Record<string, unknown> | null;
      createdAt: Date | null;
    }>
  >
> {
  try {
    const validationStages = await db.query.etlExecutionStages.findMany({
      where: and(
        eq(etlExecutionStages.stageId, "validate"),
        eq(etlExecutionStages.status, "completed")
      ),
      orderBy: [desc(etlExecutionStages.createdAt)],
    });

    const reports = await Promise.all(
      validationStages.map(async (stage) => {
        const validations = await db.query.dataValidations.findMany({
          where: eq(dataValidations.executionId, stage.executionId),
        });

        const passed = validations.filter((v) => v.status === "passed").length;
        const failed = validations.filter((v) => v.status === "failed").length;
        const warnings = validations.filter((v) => v.status === "warning").length;

        const overallStatus = failed > 0 ? "failed" : warnings > 0 ? "warning" : "passed";

        return {
          id: stage.id,
          executionId: stage.executionId,
          reportType: "data-validation",
          validationType: "comprehensive",
          status: overallStatus,
          details: {
            totalValidations: validations.length,
            passed,
            failed,
            warnings,
            validations: validations.map((v) => ({
              table: v.tableName,
              validationType: v.validationType,
              expected: v.expectedValue,
              actual: v.actualValue,
              status: v.status,
              message: v.message,
            })),
          },
          createdAt: stage.createdAt,
        };
      })
    );

    return createSuccessResponse(reports, "fetchAllValidationReports");
  } catch (error) {
    return createErrorResponse("fetchAllValidationReports", error);
  }
}


