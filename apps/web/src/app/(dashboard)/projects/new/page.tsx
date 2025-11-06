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
import { Badge } from "@/components/ui/badge";
import { WizardLayout } from "@/components/wizard/wizard-layout";
import { ArrowRightLeft, CheckCircle2, Database, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { fetchUserConnections } from "@/lib/actions/connections";
import type { Connection } from "@/db/queries/connections";
import { useRouter } from "next/navigation";
import { addProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";

type ProjectFormData = {
  name: string;
  description: string;
  sourceConnection: string;
  targetConnection: string;
  mappingStrategy: string;
  etlConfig: {
    errorHandling: "fail-fast" | "continue-on-error" | "skip-and-log";
    validateData: boolean;
    stagingSchemaName: string;
    stagingTablePrefix: string;
    autoCreateStaging: boolean;
  };
  scheduleConfig: {
    enabled: boolean;
    intervalMinutes: number;
    cronExpression: string;
  };
};

const NewProjectPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    sourceConnection: "",
    targetConnection: "",
    mappingStrategy: "manual",
    etlConfig: {
      errorHandling: "fail-fast",
      validateData: true,
      stagingSchemaName: "staging",
      stagingTablePrefix: "stg_",
      autoCreateStaging: true,
    },
    scheduleConfig: {
      enabled: false,
      intervalMinutes: 60,
      cronExpression: "0 * * * *",
    },
  });

  useEffect(() => {
    const loadConnections = async () => {
      const result = await fetchUserConnections(TEMP_USER_ID);
      if (result.success && result.data) {
        setConnections(result.data);
      }
    };
    loadConnections();
  }, []);

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

  const handleComplete = async (): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const result = await addProject({
        userId: TEMP_USER_ID,
        name: formData.name,
        description: formData.description,
        sourceConnectionId: formData.sourceConnection || null,
        targetConnectionId: formData.targetConnection || null,
        status: "draft",
        etlConfig: formData.etlConfig,
        scheduleEnabled: formData.scheduleConfig.enabled,
        scheduleCron: formData.scheduleConfig.enabled ? formData.scheduleConfig.cronExpression : null,
        scheduleInterval: formData.scheduleConfig.enabled ? formData.scheduleConfig.intervalMinutes : null,
      });

      if (result.success && result.data) {
        toast.success("Project created successfully! Setting up mapping wizard...");
        router.push(`/projects/${result.data.id}/mapping`);
      } else {
        const errorMsg = Array.isArray(result.error) ? result.error.join(", ") : result.error || "Failed to create project";
        toast.error(errorMsg);
        setIsSubmitting(false);
      }
    } catch {
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
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
      allowNavigation={!isSubmitting}
      isLoading={isSubmitting}
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
                    {connections
                      .filter((conn) => conn.type === "source")
                      .map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name}
                        </SelectItem>
                      ))}
                    {connections.filter((conn) => conn.type === "source").length === 0 && (
                      <div className="p-2 text-sm text-gray-500">No source connections available</div>
                    )}
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
                    {connections
                      .filter((conn) => conn.type === "target")
                      .map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name}
                        </SelectItem>
                      ))}
                    {connections.filter((conn) => conn.type === "target").length === 0 && (
                      <div className="p-2 text-sm text-gray-500">No target connections available</div>
                    )}
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
              <CardTitle variant="small">Migration Configuration</CardTitle>
              <CardDescription>
                Configure how data is migrated and handled
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
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
                <p className="text-xs text-gray-500">
                  Choose how to handle errors during migration
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-0.5">
                  <Label htmlFor="validate-data">Data Validation</Label>
                  <p className="text-xs text-gray-500">
                    Validate data after migration completes
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

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Staging Configuration
                  </h4>
                  <p className="text-xs text-gray-500">
                    Source data is copied to a staging area before transformation
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-create-staging">Auto-Create Staging</Label>
                    <p className="text-xs text-gray-500">
                      Automatically create staging schema and tables if they don&apos;t exist
                    </p>
                  </div>
                  <Switch
                    id="auto-create-staging"
                    checked={formData.etlConfig.autoCreateStaging}
                    onCheckedChange={(checked) =>
                      updateETLConfig("autoCreateStaging", checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staging-schema">Schema Name</Label>
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
                    <Label htmlFor="staging-prefix">Table Prefix</Label>
                    <Input
                      id="staging-prefix"
                      value={formData.etlConfig.stagingTablePrefix}
                      onChange={(e) =>
                        updateETLConfig("stagingTablePrefix", e.target.value)
                      }
                      placeholder="stg_"
                    />
                  </div>
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="schedule-frequency">Run Frequency</Label>
                  <Select
                    value={formData.scheduleConfig.intervalMinutes.toString()}
                    onValueChange={(value) => {
                      const minutes = parseInt(value);
                      updateScheduleConfig("intervalMinutes", minutes);
                      const cronExpressions: Record<number, string> = {
                        30: "*/30 * * * *",
                        60: "0 * * * *",
                        360: "0 */6 * * *",
                        720: "0 */12 * * *",
                        1440: "0 0 * * *",
                        10080: "0 0 * * 0",
                      };
                      updateScheduleConfig("cronExpression", cronExpressions[minutes] || "0 * * * *");
                    }}
                  >
                    <SelectTrigger id="schedule-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every 1 hour</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="720">Every 12 hours</SelectItem>
                      <SelectItem value="1440">Daily (Every 24 hours)</SelectItem>
                      <SelectItem value="10080">Weekly (Every 7 days)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose how often the migration should run automatically
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-gray-900">
                  What is your project name?
                </h3>
                <p className="text-sm text-gray-600">{formData.name}</p>
              </div>
              <Badge variant="success" className="ml-4">Answered</Badge>
            </div>

            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Describe the purpose of this migration
                </h3>
                <p className="text-sm text-gray-600">{formData.description || "No description provided"}</p>
              </div>
              <Badge variant="success" className="ml-4">Answered</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Database className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Connections</h3>
            </div>
            
            <div className="space-y-6 pl-6">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Which database will you migrate from?
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {connections.find((c) => c.id === formData.sourceConnection)?.name || "Not selected"}
                    </Badge>
                  </div>
                </div>
                <Badge variant="success" className="ml-4">Answered</Badge>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Which database will you migrate to?
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {connections.find((c) => c.id === formData.targetConnection)?.name || "Not selected"}
                    </Badge>
                  </div>
                </div>
                <Badge variant="success" className="ml-4">Answered</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Settings className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Migration Settings</h3>
            </div>
            
            <div className="space-y-6 pl-6">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    How should errors be handled during migration?
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {formData.etlConfig.errorHandling.replace(/-/g, " ")}
                  </p>
                </div>
                <Badge variant="success" className="ml-4">Answered</Badge>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Should data be validated after migration?
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formData.etlConfig.validateData ? "Yes, validate all data" : "No validation"}
                  </p>
                </div>
                <Badge variant="success" className="ml-4">Answered</Badge>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Should staging tables be created automatically?
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formData.etlConfig.autoCreateStaging ? "Yes, create automatically" : "No, use existing"}
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <div>Schema: <span className="font-mono">{formData.etlConfig.stagingSchemaName}</span></div>
                    <div>Prefix: <span className="font-mono">{formData.etlConfig.stagingTablePrefix}</span></div>
                  </div>
                </div>
                <Badge variant="success" className="ml-4">Answered</Badge>
              </div>

              {formData.scheduleConfig.enabled && (
                <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      How often should this migration run?
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formData.scheduleConfig.intervalMinutes === 30 && "Every 30 minutes"}
                      {formData.scheduleConfig.intervalMinutes === 60 && "Every 1 hour"}
                      {formData.scheduleConfig.intervalMinutes === 360 && "Every 6 hours"}
                      {formData.scheduleConfig.intervalMinutes === 720 && "Every 12 hours"}
                      {formData.scheduleConfig.intervalMinutes === 1440 && "Daily (Every 24 hours)"}
                      {formData.scheduleConfig.intervalMinutes === 10080 && "Weekly (Every 7 days)"}
                    </p>
                  </div>
                  <Badge variant="success" className="ml-4">Answered</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </WizardLayout>
  );
};

export default NewProjectPage;
