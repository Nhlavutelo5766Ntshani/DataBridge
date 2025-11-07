import { fetchProject } from "@/lib/actions/projects";
import { fetchSourceSchema, fetchTargetSchema } from "@/lib/actions/schema-discovery";
import { MappingWizard } from "@/components/mapping/wizard/mapping-wizard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export const dynamic = "force-dynamic";

const NewMigrationPage = async ({ searchParams }: PageProps) => {
  const { projectId } = await searchParams;

  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No Project Selected</h2>
          <p className="text-sm text-gray-600">
            Please select a project to start a new migration.
          </p>
          <Link href="/projects">
            <Button className="w-full">
              Go to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const projectResult = await fetchProject(projectId);

  if (!projectResult.success || !projectResult.data) {
    redirect("/projects");
  }

  const project = projectResult.data;

  if (!project.sourceConnectionId || !project.targetConnectionId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Project Configuration Incomplete</h2>
          <p className="text-sm text-gray-600">
            This project is missing source or target connections. Please configure the project before starting a migration.
          </p>
          <Link href={`/projects`}>
            <Button className="w-full">
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const [sourceSchemaResult, targetSchemaResult] = await Promise.all([
    fetchSourceSchema(project.id),
    fetchTargetSchema(project.id),
  ]);

  if (!sourceSchemaResult.success || !targetSchemaResult.success) {
    const sourceError = !sourceSchemaResult.success ? sourceSchemaResult.error : null;
    const targetError = !targetSchemaResult.success ? targetSchemaResult.error : null;
    
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl w-full space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Failed to Load Database Schemas
              </h3>
              <p className="text-sm text-red-800 mb-4">
                Unable to connect to your database(s) to fetch table schemas. This could be due to:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-4">
                <li>Connection timeout (database is slow or unreachable)</li>
                <li>Incorrect database credentials</li>
                <li>Network/firewall issues</li>
                <li>Database server is down</li>
              </ul>
              
              {sourceError && (
                <div className="bg-white rounded p-3 mb-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Source Database Error:</p>
                  <p className="text-xs text-gray-600 font-mono">{sourceError}</p>
                </div>
              )}
              
              {targetError && (
                <div className="bg-white rounded p-3 mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Target Database Error:</p>
                  <p className="text-xs text-gray-600 font-mono">{targetError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Link
                  href="/connections"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Check Connections
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center px-4 py-2 bg-white text-red-700 text-sm font-medium rounded-md border border-red-300 hover:bg-red-50 transition-colors"
                >
                  Back to Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sourceTables = sourceSchemaResult.data?.tables || [];
  const targetTables = targetSchemaResult.data?.tables || [];

  return (
    <div className="h-full">
      <MappingWizard
        project={project}
        sourceSchema={sourceTables}
        targetSchema={targetTables}
      />
    </div>
  );
};

export default NewMigrationPage;

