import { fetchProject } from "@/lib/actions/projects";
import { fetchSourceSchema, fetchTargetSchema } from "@/lib/actions/schema-discovery";
import { MappingWizard } from "@/components/mapping/wizard/mapping-wizard";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

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
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Failed to load database schemas. Please check your connections.
          </p>
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

