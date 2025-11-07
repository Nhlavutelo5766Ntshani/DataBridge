"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  Eye,
  Edit,
  Trash2,
  Play,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUserProjects } from "@/lib/actions/projects";
import { PATHS } from "@/lib/constants/paths";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";
import { useProject } from "@/context/project-context";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  strategy: string | null;
  sourceConnectionId: string | null;
  targetConnectionId: string | null;
  createdAt: Date | null;
  lastExecutionTime: Date | null;
};

export const ProjectsList = (): JSX.Element => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openDetailsDrawer, openEditDrawer } = useProject();

  useEffect(() => {
    const loadProjects = async (): Promise<void> => {
      try {
        const result = await fetchUserProjects(TEMP_USER_ID);
        if (result.success && result.data) {
          setProjects(result.data);
        } else {
          toast.error("Failed to load projects");
        }
      } catch (error) {
        toast.error("An error occurred while loading projects");
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const draftProjects = projects.filter((p) => p.status === "draft").length;

  const handleDelete = (_projectId: string): void => {
    toast.error("Delete functionality coming soon");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Migration Projects
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your data migration projects and mappings
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Migration Projects
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your data migration projects and mappings
          </p>
        </div>
        <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
          <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-white gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#06B6D4]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-5 w-5 text-[#06B6D4]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalProjects}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total projects</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {inProgressProjects}
            </div>
            <p className="text-xs text-gray-600 mt-1">Active migrations</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {completedProjects}
            </div>
            <p className="text-xs text-gray-600 mt-1">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Draft
              </CardTitle>
              <FolderKanban className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {draftProjects}
            </div>
            <p className="text-xs text-gray-600 mt-1">In planning</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader variant="gray">
          <CardTitle variant="small">All Projects</CardTitle>
          <CardDescription>
            View and manage your migration projects
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Create your first migration project to get started with data
                migration.
              </p>
              <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
                <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const lastRun = project.lastExecutionTime
                  ? new Date(project.lastExecutionTime).toLocaleDateString()
                  : "Never";
                const createdDate = project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "N/A";

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FolderKanban className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-base">
                            {project.name}
                          </h3>
                          {project.strategy === "multi-pipeline" && (
                            <Badge variant="secondary" className="text-xs">
                              Multi-Pipeline
                            </Badge>
                          )}
                          <Badge
                            variant={
                              project.status === "completed"
                                ? "default"
                                : project.status === "in_progress"
                                ? "secondary"
                                : "outline"
                            }
                            className={
                              project.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : project.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : ""
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-500 mb-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {createdDate}</span>
                          <span>•</span>
                          <span>Last Run: {lastRun}</span>
                          {project.sourceConnectionId &&
                            project.targetConnectionId && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">
                                  Connections configured
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/migrations/new?projectId=${project.id}`}>
                        <Button
                          size="sm"
                          className="bg-[#06B6D4] hover:bg-[#0891b2] text-white"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Migration
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => openDetailsDrawer(project)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDrawer(project)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

