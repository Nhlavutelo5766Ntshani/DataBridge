import { fetchProject } from "@/lib/actions/projects";
import { fetchSourceSchema, fetchTargetSchema } from "@/lib/actions/schema-discovery";
import { MappingWizard } from "@/components/mapping/wizard/mapping-wizard";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

const MappingWizardPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const projectResult = await fetchProject(id);

  if (!projectResult.success || !projectResult.data) {
    redirect("/projects");
  }

  const project = projectResult.data;

  if (!project.sourceConnectionId || !project.targetConnectionId) {
    redirect("/projects");
  }

  const [sourceSchemaResult, targetSchemaResult] = await Promise.all([
    fetchSourceSchema(project.id),
    fetchTargetSchema(project.id),
  ]);

  if (!sourceSchemaResult.success || !targetSchemaResult.success) {
    const sourceError = !sourceSchemaResult.success ? sourceSchemaResult.error : null;
    const targetError = !targetSchemaResult.success ? targetSchemaResult.error : null;
    
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
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
                <a
                  href="/connections"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Check Connections
                </a>
                <a
                  href="/projects"
                  className="inline-flex items-center px-4 py-2 bg-white text-red-700 text-sm font-medium rounded-md border border-red-300 hover:bg-red-50 transition-colors"
                >
                  Back to Projects
                </a>
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
    <MappingWizard
      project={project}
      sourceSchema={sourceTables}
      targetSchema={targetTables}
    />
  );
};

export default MappingWizardPage;

