import { notFound } from "next/navigation";
import { fetchProject } from "@/lib/actions/projects";
import { fetchProjectPipelines, fetchProjectSchedule } from "@/lib/actions/pipelines";
import { fetchUserConnections } from "@/lib/actions/connections";
import { PipelineList } from "@/components/pipelines/pipeline-list";
import { AddPipelineButton } from "@/components/pipelines/add-pipeline-button";
import { ScheduleCardWrapper } from "@/components/pipelines/schedule-card-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";

type PipelinePageProps = {
  params: Promise<{ id: string }>;
};

const PipelinePage = async ({ params }: PipelinePageProps) => {
  const { id } = await params;
  const projectResult = await fetchProject(id);
  
  if (!projectResult.success || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;
  
  const [pipelinesResult, connectionsResult, scheduleResult] = await Promise.all([
    fetchProjectPipelines(id),
    fetchUserConnections(TEMP_USER_ID),
    fetchProjectSchedule(id),
  ]);

  const pipelines = pipelinesResult.success && pipelinesResult.data ? pipelinesResult.data : [];
  const connections = connectionsResult.success && connectionsResult.data ? connectionsResult.data : [];
  const schedule = scheduleResult.success && scheduleResult.data ? scheduleResult.data : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">
                Manage pipelines for this project
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.strategy === "multi-pipeline" ? "default" : "secondary"}>
            {project.strategy === "multi-pipeline" ? "Multi-Pipeline" : "Single Pipeline"}
          </Badge>
          <AddPipelineButton projectId={project.id} connections={connections} />
        </div>
      </div>

      {project.strategy === "single" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">Single Pipeline Project</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              This project uses a single pipeline configuration. To use multiple pipelines, 
              consider creating a new project with the &quot;Multi-Pipeline&quot; strategy.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {project.strategy === "multi-pipeline" && (
        <ScheduleCardWrapper 
          schedule={schedule} 
          projectId={project.id}
        />
      )}

      {project.strategy === "multi-pipeline" && pipelines.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Pipelines Yet</CardTitle>
            <CardDescription>
              Get started by adding your first pipeline. You can create multiple sequential 
              pipelines (e.g., Source → Staging → Production) with dependencies between them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPipelineButton projectId={project.id} connections={connections} />
          </CardContent>
        </Card>
      )}

      {pipelines.length > 0 && (
        <PipelineList 
          pipelines={pipelines} 
          connections={connections}
          projectId={project.id}
        />
      )}
    </div>
  );
};

export default PipelinePage;

