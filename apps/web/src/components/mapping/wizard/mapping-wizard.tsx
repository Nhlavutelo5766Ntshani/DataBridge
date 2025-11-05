"use client";

import { useState } from "react";
import { Database, Columns, Settings, Clock, Eye, Rocket, Activity } from "lucide-react";
import { WizardLayout } from "./wizard-layout";
import { TableSelection } from "./step1-table-selection";
import { ColumnMapping } from "./step2-column-mapping";
import { PipelineConfig } from "./step3-pipeline-config";
import { ScheduleDependencies } from "./step4-schedule-dependencies";
import { PreviewValidate } from "./step5-preview-validate";
import { ReviewDeploy } from "./step6-review-deploy";
import { ExecutionMonitor } from "./step7-execution-monitor";
import type { TableSchema } from "@/lib/types/schema";
import type { TransformationConfig } from "@/lib/types/transformation";

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

export const MappingWizard = ({ project, sourceSchema, targetSchema }: MappingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tableMappings, setTableMappings] = useState<
    Array<{ sourceTable: string; targetTable: string; confidence?: number }>
  >([]);
  const [columnMappings, setColumnMappings] = useState<TableMappingData[]>([]);

  // Pipeline configuration state
  const [pipelineConfig, setPipelineConfig] = useState({
    batchSize: 1000,
    errorHandling: "fail-fast" as "fail-fast" | "continue-on-error" | "skip-and-log",
    parallelism: 4,
    validateData: true,
    enableRowValidation: true,
    enableTypeValidation: true,
    logLevel: "info" as "debug" | "info" | "warning" | "error",
    preMigrationHook: "",
    postMigrationHook: "",
  });

  // Schedule configuration state
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
      status: (currentStep > 0 ? "completed" : currentStep === 0 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "columns",
      title: "Map Columns",
      description: "Define column mappings and transformations",
      icon: <Columns className="w-5 h-5" />,
      status: (currentStep > 1 ? "completed" : currentStep === 1 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "pipeline",
      title: "Configure Pipeline",
      description: "Set up performance and error handling",
      icon: <Settings className="w-5 h-5" />,
      status: (currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "schedule",
      title: "Schedule & Dependencies",
      description: "Configure when and how your pipeline runs",
      icon: <Clock className="w-5 h-5" />,
      status: (currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "preview",
      title: "Preview & Validate",
      description: "Review data and DAG structure",
      icon: <Eye className="w-5 h-5" />,
      status: (currentStep > 4 ? "completed" : currentStep === 4 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "deploy",
      title: "Review & Deploy",
      description: "Deploy pipeline to Airflow",
      icon: <Rocket className="w-5 h-5" />,
      status: (currentStep > 5 ? "completed" : currentStep === 5 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "execute",
      title: "Execute & Monitor",
      description: "Run and monitor migration progress",
      icon: <Activity className="w-5 h-5" />,
      status: (currentStep === 6 ? "current" : "pending") as "completed" | "current" | "pending",
    },
  ];

  const handleTableMappingsChange = (
    newMappings: Array<{ sourceTable: string; targetTable: string; confidence?: number }>
  ) => {
    setTableMappings(newMappings);
  };

  const handleColumnMappingsChange = (newMappings: TableMappingData[]) => {
    setColumnMappings(newMappings);
  };

  const handleLoadPreview = async () => {
    // Mock preview data - replace with actual API call
    return [];
  };

  const handleDeploy = async () => {
    // Call deployment API
    console.log("Deploying to Airflow...");
  };

  const handleSkipDeploy = () => {
    setCurrentStep(6);
  };

  const handleStartExecution = async () => {
    // Call execution API
    return { executionId: "test-execution-id", dagRunId: "test-dag-run" };
  };

  const handleCheckStatus = async (executionId: string) => {
    // Poll execution status
    return {
      executionId,
      status: "completed" as const,
      totalRecords: 1000,
      processedRecords: 1000,
      failedRecords: 0,
      progress: 100,
      startTime: new Date(),
      endTime: new Date(),
      airflowDagRunId: "test-dag-run",
      airflowTasks: [],
    };
  };

  // Calculate total transformations
  const totalTransformations = columnMappings.reduce(
    (sum, mapping) => sum + mapping.columnMappings.filter((cm) => cm.transformation).length,
    0
  );

  return (
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
        <PipelineConfig config={pipelineConfig} onConfigChange={setPipelineConfig} />
      )}

      {currentStep === 3 && (
        <ScheduleDependencies
          config={scheduleConfig}
          availablePipelines={[]}
          onConfigChange={setScheduleConfig}
        />
      )}

      {currentStep === 4 && (
        <PreviewValidate projectName={project.name} onLoadPreview={handleLoadPreview} />
      )}

      {currentStep === 5 && (
        <ReviewDeploy
          projectName={project.name}
          tableMappingsCount={tableMappings.length}
          columnMappingsCount={columnMappings.reduce((sum, m) => sum + m.columnMappings.length, 0)}
          transformationsCount={totalTransformations}
          scheduleEnabled={scheduleConfig.enabled}
          cronExpression={scheduleConfig.cronExpression}
          onDeploy={handleDeploy}
          onSkipDeploy={handleSkipDeploy}
        />
      )}

      {currentStep === 6 && (
        <ExecutionMonitor
          onStartExecution={handleStartExecution}
          onCheckStatus={handleCheckStatus}
        />
      )}
    </WizardLayout>
  );
};

