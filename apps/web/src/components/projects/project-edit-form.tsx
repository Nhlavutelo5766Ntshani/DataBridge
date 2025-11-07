"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Database, Settings, Table2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/context/project-context";
import { updateProjectAction } from "@/lib/actions/projects";
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

export const ProjectEditForm = (): JSX.Element => {
  const { selectedProject, closeDrawer } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: selectedProject?.name || "",
    description: selectedProject?.description || "",
  });

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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateProjectAction(selectedProject.id, {
        name: formData.name,
        description: formData.description,
      });

      if (result.success) {
        toast.success("Project updated successfully");
        closeDrawer();
        window.location.reload();
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : Array.isArray(result.error) 
          ? result.error[0] 
          : "Failed to update project";
        toast.error(errorMessage);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">Edit Project</h2>
            <p className="text-sm text-gray-600">Update project details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter project description"
                rows={4}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To modify connections, ETL configuration, or
              table mappings, please create a new migration from this project.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4 pt-4 border-t">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : details ? (
            <>
              {details.sourceConnection && details.targetConnection && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4" />
                    Connections (Read-only)
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="text-xs text-gray-500 mb-1">Source</div>
                      <div className="font-medium">{details.sourceConnection.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {details.sourceConnection.dbType.toUpperCase()} • {details.sourceConnection.host}:{details.sourceConnection.port}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="text-xs text-gray-500 mb-1">Target</div>
                      <div className="font-medium">{details.targetConnection.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {details.targetConnection.dbType.toUpperCase()} • {details.targetConnection.host}:{details.targetConnection.port}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {details.tableMappings && details.tableMappings.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Table2 className="h-4 w-4" />
                    Table Mappings ({details.tableMappings.length}) (Read-only)
                  </h3>
                  <div className="text-xs text-gray-600 mb-2">
                    {details.tableMappings.reduce((sum, m) => sum + m.columnMappings.length, 0)} total column mappings
                  </div>
                </div>
              )}

              {details.project.etlConfig && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />
                    ETL Configuration (Read-only)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Error Handling</div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {(details.project.etlConfig.errorHandling as string)?.replace("-", " ") || "N/A"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Validation</div>
                      <Badge variant="outline" className="mt-1">
                        {details.project.etlConfig.validateData ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="border-t border-gray-200 bg-gray-50/80 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#06B6D4] hover:bg-[#0891b2] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

