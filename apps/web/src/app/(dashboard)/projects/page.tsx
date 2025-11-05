import { CheckCircle2, Clock, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchUserProjects } from "@/lib/actions/projects";
import { PATHS } from "@/lib/constants/paths";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";

const ProjectsPage = async () => {
  const result = await fetchUserProjects(TEMP_USER_ID);
  const projects = result.success && result.data ? result.data : [];

  const inProgressCount = projects.filter(
    (p) => p.status === "in_progress"
  ).length;
  const completedCount = projects.filter(
    (p) => p.status === "completed"
  ).length;
  const draftCount = projects.filter((p) => p.status === "draft").length;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Migration Projects
          </h1>
          <p className="text-gray-600 mt-3">
            Manage your data migration projects and mappings
          </p>
        </div>
        <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {projects.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {projects.length === 0 ? "No projects yet" : "Total projects"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              In Progress
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {inProgressCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active migrations</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {completedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Draft
            </CardTitle>
            <FolderKanban className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{draftCount}</div>
            <p className="text-xs text-gray-500 mt-1">In planning</p>
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
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first migration project to start mapping and
                migrating data between databases.
              </p>
              <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const projectUrl =
                  project.strategy === "multi-pipeline"
                    ? `/projects/${project.id}/pipelines`
                    : `/projects/${project.id}/mapping`;

                return (
                  <Link key={project.id} href={projectUrl}>
                    <div className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FolderKanban className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 text-base">
                              {project.name}
                            </h3>
                            {project.strategy === "multi-pipeline" && (
                              <Badge variant="secondary" className="text-xs">
                                Multi-Pipeline
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsPage;
