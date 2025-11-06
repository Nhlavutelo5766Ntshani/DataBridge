"use client";

import { MappingDetailsDrawer } from "@/components/mapping/mapping-details-drawer";
import { MappingProvider } from "@/context/mapping-context";
import type { TableSchema } from "@/lib/types/schema";
import type { TransformationConfig } from "@/lib/types/transformation";
import {
  Activity,
  Clock,
  Columns,
  Database,
  Eye,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { TableSelection } from "./step1-table-selection";
import { ColumnMapping } from "./step2-column-mapping";
import { PipelineConfig } from "./step3-pipeline-config";
import { ScheduleDependencies } from "./step4-schedule-dependencies";
import { PreviewValidate } from "./step5-preview-validate";
import { ExecutionMonitor } from "./step6-execution-monitor";
import { WizardLayout } from "./wizard-layout";

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
  const [currentStep] = useState(0);
  const [tableMappings, setTableMappings] = useState<
    Array<{ sourceTable: string; targetTable: string; confidence?: number }>
  >([]);
  const [columnMappings, setColumnMappings] = useState<TableMappingData[]>([]);

  const [pipelineConfig, setPipelineConfig] = useState({
    batchSize: 1000,
    errorHandling: "fail-fast" as
      | "fail-fast"
      | "continue-on-error"
      | "skip-and-log",
    parallelism: 4,
    validateData: true,
    enableRowValidation: true,
    enableTypeValidation: true,
    logLevel: "info" as "debug" | "info" | "warning" | "error",
    preMigrationHook: "",
    postMigrationHook: "",
  });

  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: false,
    cronExpression: "0 0 * * *",
    timezone: "UTC",
    slaMinutes: 60,
    maxRetries: 3,
    retryDelayMinutes: 5,
    enableBackfill: false,
    dependsOnPipelineId: null as string | null,
  });

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
      id: "pipeline",
      title: "Configure Pipeline",
      description: "Set up performance and error handling",
      icon: <Settings className="w-5 h-5" />,
      status: (currentStep > 2
        ? "completed"
        : currentStep === 2
        ? "current"
        : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "schedule",
      title: "Schedule & Dependencies",
      description: "Configure when and how your pipeline runs",
      icon: <Clock className="w-5 h-5" />,
      status: (currentStep > 3
        ? "completed"
        : currentStep === 3
        ? "current"
        : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "preview",
      title: "Preview & Validate",
      description: "Review data and pipeline structure",
      icon: <Eye className="w-5 h-5" />,
      status: (currentStep > 4
        ? "completed"
        : currentStep === 4
        ? "current"
        : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "execute",
      title: "Execute & Monitor",
      description: "Run and monitor migration progress",
      icon: <Activity className="w-5 h-5" />,
      status: (currentStep === 5 ? "current" : "pending") as
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
      const response = await fetch("/api/executions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          executionId: `exec-${project.id}-${Date.now()}`,
          config: {
            projectId: project.id,
            executionId: `exec-${project.id}-${Date.now()}`,
            batchSize: pipelineConfig.batchSize,
            parallelism: pipelineConfig.parallelism,
            errorHandling: pipelineConfig.errorHandling,
            validateData: pipelineConfig.validateData,
            staging: {
              databaseUrl: process.env.NEXT_PUBLIC_STAGING_DATABASE_URL || "",
              schemaName: "staging",
              tablePrefix: "stg_",
              cleanupAfterMigration: false,
            },
            retryAttempts: scheduleConfig.maxRetries,
            retryDelayMs: scheduleConfig.retryDelayMinutes * 60 * 1000,
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

  return (
    <MappingProvider>
      <WizardLayout
        projectId={project.id}
        projectName={project.name}
        currentStep={currentStep + 1}
        totalSteps={steps.length}
        steps={steps}
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
          <PipelineConfig
            config={pipelineConfig}
            onConfigChange={setPipelineConfig}
          />
        )}

        {currentStep === 3 && (
          <ScheduleDependencies
            config={scheduleConfig}
            availablePipelines={[]}
            onConfigChange={setScheduleConfig}
          />
        )}

        {currentStep === 4 && (
          <PreviewValidate
            projectName={project.name}
            onLoadPreview={handleLoadPreview}
          />
        )}

        {currentStep === 5 && (
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
