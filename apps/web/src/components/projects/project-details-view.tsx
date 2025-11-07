"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Edit,
  Calendar,
  Clock,
  Database,
  ArrowRight,
  Table2,
  Settings,
  CalendarClock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/project-context";
import { fetchProjectDetails } from "@/lib/actions/project-details";
import { Skeleton } from "@/components/ui/skeleton";

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

export const ProjectDetailsView = (): JSX.Element => {
  const { selectedProject, closeDrawer, openEditDrawer } = useProject();
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async (): Promise<void> => {
      if (!selectedProject) return;

      setIsLoading(true);
      const result = await fetchProjectDetails(selectedProject.id);
      if (result.success && result.data) {
        setDetails(result.data);
      }
      setIsLoading(false);
    };

    loadDetails();
  }, [selectedProject]);

  if (!selectedProject) {
    return <div>No project selected</div>;
  }

  const createdDate = selectedProject.createdAt
    ? new Date(selectedProject.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const lastRun = selectedProject.lastExecutionTime
    ? new Date(selectedProject.lastExecutionTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">
              {selectedProject.name}
            </h2>
            <p className="text-sm text-gray-600">Project Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDrawer(selectedProject)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              selectedProject.status === "completed"
                ? "default"
                : selectedProject.status === "in_progress"
                ? "secondary"
                : "outline"
            }
            className={
              selectedProject.status === "completed"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : selectedProject.status === "in_progress"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : ""
            }
          >
            {selectedProject.status}
          </Badge>
          {selectedProject.strategy === "multi-pipeline" && (
            <Badge variant="secondary" className="text-xs">
              Multi-Pipeline
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {selectedProject.description && (
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Description
                </div>
                <div className="text-sm text-gray-900 mt-1">
                  {selectedProject.description}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </div>
                <div className="text-sm text-gray-900 mt-1">{createdDate}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Execution
                </div>
                <div className="text-sm text-gray-900 mt-1">{lastRun}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Database className="h-4 w-4" />
                Connections
              </h3>
              {details?.sourceConnection && details?.targetConnection ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Source</div>
                      <div className="font-medium text-sm">{details.sourceConnection.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {details.sourceConnection.dbType.toUpperCase()} • {details.sourceConnection.host}:{details.sourceConnection.port}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Target</div>
                      <div className="font-medium text-sm">{details.targetConnection.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {details.targetConnection.dbType.toUpperCase()} • {details.targetConnection.host}:{details.targetConnection.port}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  Not Configured
                </Badge>
              )}
            </div>

            {details?.tableMappings && details.tableMappings.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Table2 className="h-4 w-4" />
                  Table Mappings ({details.tableMappings.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {details.tableMappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {mapping.sourceTable}
                        </span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {mapping.targetTable}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {mapping.columnMappings.length} column{mapping.columnMappings.length !== 1 ? "s" : ""} mapped
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details?.project.etlConfig && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4" />
                  ETL Configuration
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Error Handling</div>
                    <div className="font-medium capitalize mt-1">
                      {(details.project.etlConfig.errorHandling as string)?.replace("-", " ") || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Validation</div>
                    <div className="font-medium mt-1">
                      {details.project.etlConfig.validateData ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Staging Schema</div>
                    <div className="font-medium mt-1">
                      {(details.project.etlConfig.stagingSchemaName as string) || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Auto Create</div>
                    <div className="font-medium mt-1">
                      {details.project.etlConfig.autoCreateStaging ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {details?.schedules && details.schedules.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <CalendarClock className="h-4 w-4" />
                  Schedules
                </h3>
                <div className="space-y-2">
                  {details.schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">{schedule.cronExpression}</div>
                        <Badge
                          variant={schedule.isActive ? "default" : "outline"}
                          className={schedule.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                        >
                          {schedule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {schedule.nextRun && (
                        <div className="text-xs text-gray-500 mt-1">
                          Next run: {new Date(schedule.nextRun).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50/80 px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={closeDrawer}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

