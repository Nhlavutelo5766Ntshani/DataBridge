"use client";

import { MappingDetailsDrawer } from "@/components/mapping/mapping-details-drawer";
import { MappingProvider } from "@/context/mapping-context";
import type { TableSchema } from "@/lib/types/schema";
import type { TransformationConfig } from "@/lib/types/transformation";
import {
  Activity,
  Columns,
  Database,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableSelection } from "./step1-table-selection";
import { ColumnMapping } from "./step2-column-mapping";
import { PreviewValidate } from "./step5-preview-validate";
import { ExecutionMonitor } from "./step6-execution-monitor";
import { WizardLayout } from "./wizard-layout";
import { PATHS } from "@/lib/constants/paths";

type Project = {
  id: string;
  name: string;
  sourceConnectionId: string | null;
  targetConnectionId: string | null;
};

type TableMappingData = {
  sourceTable: string;
  targetTable: string;
  columnMappings: Array<{
    sourceColumn: string;
    targetColumn: string;
    sourceDataType: string;
    targetDataType: string;
    transformation: TransformationConfig | null;
    confidence?: number;
  }>;
};

type MappingWizardProps = {
  project: Project;
  sourceSchema: TableSchema[];
  targetSchema: TableSchema[];
};

export const MappingWizard = ({
  project,
  sourceSchema,
  targetSchema,
}: MappingWizardProps) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [tableMappings, setTableMappings] = useState<
    Array<{ sourceTable: string; targetTable: string; confidence?: number }>
  >([]);
  const [columnMappings, setColumnMappings] = useState<TableMappingData[]>([]);

  const steps = [
    {
      id: "tables",
      title: "Select Tables",
      description: "Choose source and target tables to migrate",
      icon: <Database className="w-5 h-5" />,
      status: (currentStep > 0
        ? "completed"
        : currentStep === 0
        ? "current"
        : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "columns",
      title: "Map Columns",
      description: "Define column mappings and transformations",
      icon: <Columns className="w-5 h-5" />,
      status: (currentStep > 1
        ? "completed"
        : currentStep === 1
        ? "current"
        : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "preview",
      title: "Preview & Validate",
      description: "Review data and pipeline structure",
      icon: <Eye className="w-5 h-5" />,
      status: (currentStep > 2
        ? "completed"
        : currentStep === 2
        ? "current"
        : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "execute",
      title: "Execute & Monitor",
      description: "Run and monitor migration progress",
      icon: <Activity className="w-5 h-5" />,
      status: (currentStep === 3 ? "current" : "pending") as
        | "completed"
        | "current"
        | "pending",
    },
  ];

  const handleTableMappingsChange = (
    newMappings: Array<{
      sourceTable: string;
      targetTable: string;
      confidence?: number;
    }>
  ) => {
    setTableMappings(newMappings);
  };

  const handleColumnMappingsChange = (newMappings: TableMappingData[]) => {
    setColumnMappings(newMappings);
  };

  const handleLoadPreview = async () => {
    return [];
  };

  const handleStartExecution = async () => {
    try {
      const projectWithConfig = project as Project & {
        etlConfig?: {
          errorHandling?: "fail-fast" | "continue-on-error" | "skip-and-log";
          validateData?: boolean;
          stagingSchemaName?: string;
          stagingTablePrefix?: string;
          autoCreateStaging?: boolean;
        };
      };

      const etlConfig = projectWithConfig.etlConfig || {
        errorHandling: "fail-fast" as const,
        validateData: true,
        stagingSchemaName: "staging",
        stagingTablePrefix: "stg_",
        autoCreateStaging: true,
      };

      const executionId = `exec-${project.id}-${Date.now()}`;

      const response = await fetch("/api/executions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          executionId,
          config: {
            projectId: project.id,
            executionId,
            batchSize: 1000,
            parallelism: 4,
            errorHandling: etlConfig.errorHandling || "fail-fast",
            validateData: etlConfig.validateData !== false,
            staging: {
              databaseUrl: process.env.NEXT_PUBLIC_STAGING_DATABASE_URL || "",
              schemaName: etlConfig.stagingSchemaName || "staging",
              tablePrefix: etlConfig.stagingTablePrefix || "stg_",
              cleanupAfterMigration: false,
              autoCreate: etlConfig.autoCreateStaging !== false,
            },
            loadStrategy: "truncate-load",
            retryAttempts: 3,
            retryDelayMs: 5 * 60 * 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start execution");
      }

      const data = await response.json();
      return { executionId: data.executionId };
    } catch (error) {
      console.error("Failed to start execution:", error);
      throw error;
    }
  };

  const handleCheckStatus = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/status`);

      if (!response.ok) {
        throw new Error("Failed to check execution status");
      }

      const data = await response.json();

      return {
        executionId: data.executionId,
        status: data.status,
        totalRecords: data.totalRecordsProcessed,
        processedRecords: data.totalRecordsProcessed,
        failedRecords: data.totalRecordsFailed,
        progress: data.progress,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        stages: data.stages || [],
      };
    } catch (error) {
      console.error("Failed to check execution status:", error);
      throw error;
    }
  };

  const handlePauseExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to pause execution");
      }
    } catch (error) {
      console.error("Failed to pause execution:", error);
      throw error;
    }
  };

  const handleResumeExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to resume execution");
      }
    } catch (error) {
      console.error("Failed to resume execution:", error);
      throw error;
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel execution");
      }
    } catch (error) {
      console.error("Failed to cancel execution:", error);
      throw error;
    }
  };

  const handleContinue = () => {
    console.log("Continue clicked. Current step:", currentStep, "Steps length:", steps.length);
    if (currentStep < steps.length - 1) {
      console.log("Moving to step:", currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log("At last step, navigating to dashboard");
      router.push(PATHS.DASHBOARD.HOME);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <MappingProvider>
      <WizardLayout
        projectId={project.id}
        projectName={project.name}
        currentStep={currentStep + 1}
        totalSteps={steps.length}
        steps={steps}
        onContinue={handleContinue}
        onBack={handleBack}
        canContinue={currentStep === 0 ? tableMappings.length > 0 : true}
      >
        {currentStep === 0 && (
          <TableSelection
            sourceTables={sourceSchema}
            targetTables={targetSchema}
            selectedMappings={tableMappings}
            onMappingsChange={handleTableMappingsChange}
          />
        )}

        {currentStep === 1 && (
          <ColumnMapping
            sourceSchema={sourceSchema}
            targetSchema={targetSchema}
            tableMappings={tableMappings}
            mappings={columnMappings}
            onMappingsChange={handleColumnMappingsChange}
          />
        )}

        {currentStep === 2 && (
          <PreviewValidate
            projectName={project.name}
            onLoadPreview={handleLoadPreview}
          />
        )}

        {currentStep === 3 && (
          <ExecutionMonitor
            onStartExecution={handleStartExecution}
            onCheckStatus={handleCheckStatus}
            onPauseExecution={handlePauseExecution}
            onResumeExecution={handleResumeExecution}
            onRetryExecution={handleCancelExecution}
          />
        )}
      </WizardLayout>

      {/* Mapping Details Drawer */}
      <MappingDetailsDrawer
        isOpen={false}
        onClose={() => {}}
        mapping={null}
        sourceSchema={null}
        targetSchemas={[]}
      />
    </MappingProvider>
  );
};
