import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PATHS } from "@/lib/constants/paths";
import { fetchUserProjects } from "@/lib/actions/projects";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";

const ProjectsPage = async () => {
  const result = await fetchUserProjects(TEMP_USER_ID);
  const projects = result.success && result.data ? result.data : [];
  
  const inProgressCount = projects.filter(p => p.status === "in_progress").length;
  const completedCount = projects.filter(p => p.status === "completed").length;
  const draftCount = projects.filter(p => p.status === "draft").length;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Migration Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your data migration projects and mappings
          </p>
        </div>
        <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {projects.length === 0 ? "No projects yet" : "Total projects"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active migrations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In planning
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            View and manage your migration projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first migration project to start mapping and migrating
                data between databases.
              </p>
              <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const projectUrl = project.strategy === "multi-pipeline" 
                  ? `/projects/${project.id}/pipelines`
                  : `/projects/${project.id}/mapping`;
                
                return (
                  <Link key={project.id} href={projectUrl}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <FolderKanban className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{project.name}</h3>
                            {project.strategy === "multi-pipeline" && (
                              <Badge variant="secondary" className="text-xs">
                                Multi-Pipeline
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
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
                              ? "bg-green-100 text-green-700 border-green-200"
                              : project.status === "in_progress"
                              ? "bg-cyan-100 text-cyan-700 border-cyan-200"
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

