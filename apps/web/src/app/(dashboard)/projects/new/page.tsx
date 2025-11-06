"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WizardLayout } from "@/components/wizard/wizard-layout";
import { ArrowRightLeft, CheckCircle2, Database, Settings } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

type ProjectFormData = {
  name: string;
  description: string;
  sourceConnection: string;
  targetConnection: string;
  mappingStrategy: string;
  etlConfig: {
    batchSize: number;
    parallelism: number;
    errorHandling: "fail-fast" | "continue-on-error" | "skip-and-log";
    validateData: boolean;
    stagingDatabaseUrl: string;
    stagingSchemaName: string;
    stagingTablePrefix: string;
  };
  scheduleConfig: {
    enabled: boolean;
    intervalMinutes: number;
    cronExpression: string;
  };
};

const NewProjectPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    sourceConnection: "",
    targetConnection: "",
    mappingStrategy: "manual",
    etlConfig: {
      batchSize: 1000,
      parallelism: 4,
      errorHandling: "fail-fast",
      validateData: true,
      stagingDatabaseUrl: process.env.NEXT_PUBLIC_STAGING_DATABASE_URL || "",
      stagingSchemaName: "staging",
      stagingTablePrefix: "stg_",
    },
    scheduleConfig: {
      enabled: false,
      intervalMinutes: 60,
      cronExpression: "0 * * * *",
    },
  });

  const steps = [
    {
      id: "project-details",
      title: "Project Details",
      description: "Basic information about your migration project",
      icon: <Database className="w-4 h-4" />,
      status:
        currentStep > 0
          ? ("completed" as const)
          : currentStep === 0
          ? ("current" as const)
          : ("pending" as const),
    },
    {
      id: "connections",
      title: "Select Connections",
      description: "Choose source and target databases",
      icon: <ArrowRightLeft className="w-4 h-4" />,
      status:
        currentStep > 1
          ? ("completed" as const)
          : currentStep === 1
          ? ("current" as const)
          : ("pending" as const),
    },
    {
      id: "configuration",
      title: "Configuration",
      description: "Set up migration preferences",
      icon: <Settings className="w-4 h-4" />,
      status:
        currentStep > 2
          ? ("completed" as const)
          : currentStep === 2
          ? ("current" as const)
          : ("pending" as const),
    },
    {
      id: "review",
      title: "Review & Create",
      description: "Review your settings and create project",
      icon: <CheckCircle2 className="w-4 h-4" />,
      status:
        currentStep > 3
          ? ("completed" as const)
          : currentStep === 3
          ? ("current" as const)
          : ("pending" as const),
    },
  ];

  const handleNext = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (): void => {
    // Form data will be handled by server action
  };

  const updateFormData = (
    field: keyof ProjectFormData,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateETLConfig = <K extends keyof ProjectFormData["etlConfig"]>(
    field: K,
    value: ProjectFormData["etlConfig"][K]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      etlConfig: { ...prev.etlConfig, [field]: value },
    }));
  };

  const updateScheduleConfig = <K extends keyof ProjectFormData["scheduleConfig"]>(
    field: K,
    value: ProjectFormData["scheduleConfig"][K]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      scheduleConfig: { ...prev.scheduleConfig, [field]: value },
    }));
  };

  return (
    <WizardLayout
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onComplete={handleComplete}
      title="Create New Project"
      subtitle="Set up a new data migration project"
      allowNavigation={true}
    >
      {currentStep === 0 && (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Project Information</CardTitle>
              <CardDescription>
                Provide a name and description for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Customer Data Migration"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe the purpose of this migration..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 1 && (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Database Connections</CardTitle>
              <CardDescription>
                Select the source and target databases for this migration
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-connection">Source Connection</Label>
                <Select
                  value={formData.sourceConnection}
                  onValueChange={(value) =>
                    updateFormData("sourceConnection", value)
                  }
                >
                  <SelectTrigger id="source-connection">
                    <SelectValue placeholder="Select source database" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legacy-db">Legacy PostgreSQL</SelectItem>
                    <SelectItem value="old-mysql">Old MySQL Server</SelectItem>
                    <SelectItem value="oracle-prod">
                      Oracle Production
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-connection">Target Connection</Label>
                <Select
                  value={formData.targetConnection}
                  onValueChange={(value) =>
                    updateFormData("targetConnection", value)
                  }
                >
                  <SelectTrigger id="target-connection">
                    <SelectValue placeholder="Select target database" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-postgres">
                      New PostgreSQL 15
                    </SelectItem>
                    <SelectItem value="cloud-mysql">
                      Cloud MySQL Instance
                    </SelectItem>
                    <SelectItem value="azure-sql">
                      Azure SQL Database
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Migration Settings</CardTitle>
              <CardDescription>
                Configure how the migration should be performed
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mapping-strategy">Mapping Strategy</Label>
                <Select
                  value={formData.mappingStrategy}
                  onValueChange={(value) =>
                    updateFormData("mappingStrategy", value)
                  }
                >
                  <SelectTrigger id="mapping-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Mapping</SelectItem>
                    <SelectItem value="auto">
                      Auto-detect (AI Assisted)
                    </SelectItem>
                    <SelectItem value="template">Use Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">ETL Configuration</CardTitle>
              <CardDescription>
                Configure performance and error handling settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="100"
                    max="10000"
                    value={formData.etlConfig.batchSize}
                    onChange={(e) =>
                      updateETLConfig("batchSize", parseInt(e.target.value))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Number of records per batch (100-10000)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parallelism">Parallelism</Label>
                  <Input
                    id="parallelism"
                    type="number"
                    min="1"
                    max="16"
                    value={formData.etlConfig.parallelism}
                    onChange={(e) =>
                      updateETLConfig("parallelism", parseInt(e.target.value))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Concurrent workers (1-16)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="error-handling">Error Handling</Label>
                <Select
                  value={formData.etlConfig.errorHandling}
                  onValueChange={(value: "fail-fast" | "continue-on-error" | "skip-and-log") =>
                    updateETLConfig("errorHandling", value)
                  }
                >
                  <SelectTrigger id="error-handling">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fail-fast">
                      Fail Fast - Stop on first error
                    </SelectItem>
                    <SelectItem value="continue-on-error">
                      Continue on Error - Log and continue
                    </SelectItem>
                    <SelectItem value="skip-and-log">
                      Skip and Log - Skip failed records
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="validate-data">Data Validation</Label>
                  <p className="text-xs text-gray-500">
                    Validate data after migration
                  </p>
                </div>
                <Switch
                  id="validate-data"
                  checked={formData.etlConfig.validateData}
                  onCheckedChange={(checked) =>
                    updateETLConfig("validateData", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staging-schema">Staging Schema Name</Label>
                <Input
                  id="staging-schema"
                  value={formData.etlConfig.stagingSchemaName}
                  onChange={(e) =>
                    updateETLConfig("stagingSchemaName", e.target.value)
                  }
                  placeholder="staging"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staging-prefix">Staging Table Prefix</Label>
                <Input
                  id="staging-prefix"
                  value={formData.etlConfig.stagingTablePrefix}
                  onChange={(e) =>
                    updateETLConfig("stagingTablePrefix", e.target.value)
                  }
                  placeholder="stg_"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Schedule Configuration</CardTitle>
              <CardDescription>
                Automate migrations with scheduled execution
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="schedule-enabled">Enable Scheduling</Label>
                  <p className="text-xs text-gray-500">
                    Run migrations automatically on a schedule
                  </p>
                </div>
                <Switch
                  id="schedule-enabled"
                  checked={formData.scheduleConfig.enabled}
                  onCheckedChange={(checked) =>
                    updateScheduleConfig("enabled", checked)
                  }
                />
              </div>

              {formData.scheduleConfig.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-interval">
                      Interval (minutes)
                    </Label>
                    <Input
                      id="schedule-interval"
                      type="number"
                      min="5"
                      max="1440"
                      value={formData.scheduleConfig.intervalMinutes}
                      onChange={(e) =>
                        updateScheduleConfig(
                          "intervalMinutes",
                          parseInt(e.target.value)
                        )
                      }
                    />
                    <p className="text-xs text-gray-500">
                      How often to run (5-1440 minutes)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cron-expression">Cron Expression</Label>
                    <Input
                      id="cron-expression"
                      value={formData.scheduleConfig.cronExpression}
                      onChange={(e) =>
                        updateScheduleConfig("cronExpression", e.target.value)
                      }
                      placeholder="0 * * * *"
                    />
                    <p className="text-xs text-gray-500">
                      Advanced scheduling (Unix cron format)
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Project Name
                </div>
                <div className="text-sm text-gray-900">
                  {formData.name || "Not set"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Description
                </div>
                <div className="text-sm text-gray-900">
                  {formData.description || "Not set"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Connections</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Source Connection
                </div>
                <div className="text-sm text-gray-900">
                  {formData.sourceConnection || "Not selected"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Target Connection
                </div>
                <div className="text-sm text-gray-900">
                  {formData.targetConnection || "Not selected"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Mapping Strategy
                </div>
                <div className="text-sm text-gray-900">
                  {formData.mappingStrategy}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">ETL Configuration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Batch Size
                  </div>
                  <div className="text-sm text-gray-900">
                    {formData.etlConfig.batchSize}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Parallelism
                  </div>
                  <div className="text-sm text-gray-900">
                    {formData.etlConfig.parallelism}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Error Handling
                </div>
                <div className="text-sm text-gray-900">
                  {formData.etlConfig.errorHandling}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Data Validation
                </div>
                <div className="text-sm text-gray-900">
                  {formData.etlConfig.validateData ? "Enabled" : "Disabled"}
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.scheduleConfig.enabled && (
            <Card>
              <CardHeader variant="gray">
                <CardTitle variant="small">Schedule Configuration</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Schedule Enabled
                  </div>
                  <div className="text-sm text-gray-900">Yes</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Interval
                  </div>
                  <div className="text-sm text-gray-900">
                    Every {formData.scheduleConfig.intervalMinutes} minutes
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Cron Expression
                  </div>
                  <div className="text-sm text-gray-900 font-mono">
                    {formData.scheduleConfig.cronExpression}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </WizardLayout>
  );
};

export default NewProjectPage;
