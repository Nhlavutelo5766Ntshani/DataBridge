import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
import { getMigrationExecutionStatus } from "@/lib/actions/migration-execution";
import { fetchProject } from "@/lib/actions/projects";

type MigrationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const MigrationDetailPage = async (props: MigrationDetailPageProps) => {
  const params = await props.params;
  const executionId = params.id as string;

  const executionResult = await getMigrationExecutionStatus(executionId);
  const execution = executionResult.success && executionResult.data ? executionResult.data : null;

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Execution Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The migration execution you're looking for doesn't exist.
          </p>
          <Link href={PATHS.DASHBOARD.MIGRATIONS}>
            <Button>Back to Migrations</Button>
          </Link>
        </div>
      </div>
    );
  }

  const projectResult = await fetchProject(execution.projectId);
  const project = projectResult.success && projectResult.data ? projectResult.data : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "running":
        return "secondary";
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const progressPercent = execution.totalRecords && execution.totalRecords > 0
    ? Math.round(((execution.processedRecords || 0) / execution.totalRecords) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={PATHS.DASHBOARD.MIGRATIONS}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Migration Execution</h1>
            <p className="text-muted-foreground">
              {project ? project.name : `Project ${execution.projectId}`}
            </p>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(execution.status)}>
          {execution.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(execution.totalRecords || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(execution.processedRecords || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(execution.failedRecords || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Execution Details</CardTitle>
              <CardDescription>Migration execution information</CardDescription>
            </div>
            {getStatusIcon(execution.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {execution.status === "running" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Execution ID</span>
              <p className="font-mono text-xs mt-1">{execution.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Started At</span>
              <p className="mt-1">{execution.createdAt ? new Date(execution.createdAt).toLocaleString() : "N/A"}</p>
            </div>
            {execution.completedAt && (
              <div>
                <span className="text-muted-foreground">Completed At</span>
                <p className="mt-1">{new Date(execution.completedAt).toLocaleString()}</p>
              </div>
            )}
            {execution.completedAt && execution.createdAt && (
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="mt-1">
                  {Math.round(
                    (new Date(execution.completedAt).getTime() -
                      new Date(execution.createdAt).getTime()) /
                      1000
                  )}{" "}
                  seconds
                </p>
              </div>
            )}
          </div>

          {execution.status === "failed" && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                Migration failed. Check logs for details.
              </p>
            </div>
          )}

          {execution.status === "completed" && (
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Migration completed successfully!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationDetailPage;

