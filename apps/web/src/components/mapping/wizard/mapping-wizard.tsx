"use client";

import { useState } from "react";
import { Database, Columns, Eye, Play } from "lucide-react";
import { WizardLayout } from "./wizard-layout";
import { TableSelection } from "./step1-table-selection";
import { ColumnMapping } from "./step2-column-mapping";
import { MigrationPreview } from "./step3-preview";
import { MigrationExecution } from "./step4-execution";
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
  const [canContinue, setCanContinue] = useState(false);

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
      id: "preview",
      title: "Preview Data",
      description: "Review sample data and validation warnings",
      icon: <Eye className="w-5 h-5" />,
      status: (currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "pending") as "completed" | "current" | "pending",
    },
    {
      id: "execute",
      title: "Execute Migration",
      description: "Run the migration and monitor progress",
      icon: <Play className="w-5 h-5" />,
      status: (currentStep === 3 ? "current" : "pending") as "completed" | "current" | "pending",
    },
  ];

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    window.location.href = `/projects/${project.id}`;
  };

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleTableMappingsChange = (
    newMappings: Array<{ sourceTable: string; targetTable: string; confidence?: number }>
  ) => {
    setTableMappings(newMappings);
    setCanContinue(newMappings.length > 0);
  };

  const handleColumnMappingsChange = (newMappings: TableMappingData[]) => {
    setColumnMappings(newMappings);
    setCanContinue(newMappings.some((m) => m.columnMappings.length > 0));
  };

  const handleLoadPreview = async () => {
    return [];
  };

  const handleValidationComplete = (isValid: boolean) => {
    setCanContinue(isValid);
  };

  const handleStartExecution = async () => {
    return { executionId: "test-execution-id" };
  };

  const handleCheckStatus = async (executionId: string) => {
    return {
      executionId,
      status: "completed" as const,
      totalRecords: 1000,
      processedRecords: 1000,
      failedRecords: 0,
      progress: 100,
      startTime: new Date(),
      endTime: new Date(),
    };
  };

  return (
    <WizardLayout
      projectId={project.id}
      projectName={project.name}
      currentStep={currentStep + 1}
      totalSteps={steps.length}
      steps={steps}
      onBack={currentStep > 0 ? handleBack : undefined}
      onCancel={handleCancel}
      onContinue={currentStep < 3 ? handleContinue : undefined}
      canContinue={canContinue}
      isLastStep={currentStep === 3}
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
        <MigrationPreview
          onLoadPreview={handleLoadPreview}
          onValidationComplete={handleValidationComplete}
        />
      )}

      {currentStep === 3 && (
        <MigrationExecution
          onStartExecution={handleStartExecution}
          onCheckStatus={handleCheckStatus}
        />
      )}
    </WizardLayout>
  );
};

