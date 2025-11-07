"use server";

import { getProjectById } from "@/db/queries/projects";
import { getConnectionById } from "@/db/queries/connections";
import { getProjectMappings } from "@/db/queries/mappings";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/errors";
import type { QueryResponse } from "@/db/types/queries";

type ProjectDetails = {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    strategy: string | null;
    createdAt: Date | null;
    lastExecutionTime: Date | null;
    etlConfig: Record<string, unknown> | null;
  };
  sourceConnection: {
    id: string;
    name: string;
    type: string;
    dbType: string;
    host: string;
    port: number;
    database: string;
  } | null;
  targetConnection: {
    id: string;
    name: string;
    type: string;
    dbType: string;
    host: string;
    port: number;
    database: string;
  } | null;
  tableMappings: Array<{
    id: string;
    sourceTable: string;
    targetTable: string;
    mappingOrder: number | null;
    columnMappings: Array<{
      id: string;
      sourceColumn: string;
      targetColumn: string;
      transformationType: string | null;
      transformationConfig: Record<string, unknown> | null;
    }>;
  }>;
  schedules: Array<{
    id: string;
    cronExpression: string;
    isActive: boolean | null;
    lastRun: Date | null;
    nextRun: Date | null;
  }>;
};

export async function fetchProjectDetails(
  projectId: string
): Promise<QueryResponse<ProjectDetails>> {
  try {
    const project = await getProjectById(projectId);

    if (!project) {
      return createErrorResponse("fetchProjectDetails", new Error("Project not found"));
    }

    let sourceConnection = null;
    if (project.sourceConnectionId) {
      sourceConnection = await getConnectionById(project.sourceConnectionId);
    }

    let targetConnection = null;
    if (project.targetConnectionId) {
      targetConnection = await getConnectionById(project.targetConnectionId);
    }

    const mappingsData = await getProjectMappings(projectId);

    const tableMappingsWithColumns = mappingsData.tableMappings.map((tableMapping) => ({
      id: tableMapping.id,
      sourceTable: tableMapping.sourceTable,
      targetTable: tableMapping.targetTable,
      mappingOrder: tableMapping.mappingOrder,
      columnMappings: (mappingsData.columnMappings[tableMapping.id] || []).map((cm) => ({
        id: cm.id,
        sourceColumn: cm.sourceColumn,
        targetColumn: cm.targetColumn,
        transformationType: cm.transformationId,
        transformationConfig: cm.transformationConfig as Record<string, unknown> | null,
      })),
    }));

    const schedulesResult: Array<{
      id: string;
      cronExpression: string;
      isActive: boolean | null;
      lastRun: Date | null;
      nextRun: Date | null;
    }> = [];

    const details: ProjectDetails = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        strategy: project.strategy,
        createdAt: project.createdAt,
        lastExecutionTime: project.lastExecutionTime,
        etlConfig: project.etlConfig as Record<string, unknown> | null,
      },
      sourceConnection,
      targetConnection,
      tableMappings: tableMappingsWithColumns,
      schedules: schedulesResult,
    };

    return createSuccessResponse(details, "fetchProjectDetails");
  } catch (error) {
    return createErrorResponse("fetchProjectDetails", error);
  }
}

