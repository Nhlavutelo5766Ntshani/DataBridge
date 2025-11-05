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

type ProjectFormData = {
  name: string;
  description: string;
  sourceConnection: string;
  targetConnection: string;
  mappingStrategy: string;
};

const NewProjectPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    sourceConnection: "",
    targetConnection: "",
    mappingStrategy: "manual",
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
    console.log("Creating project with data:", formData);
  };

  const updateFormData = (
    field: keyof ProjectFormData,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        </div>
      )}

      {currentStep === 3 && (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Review Your Project</CardTitle>
              <CardDescription>
                Verify all settings before creating the project
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </WizardLayout>
  );
};

export default NewProjectPage;
