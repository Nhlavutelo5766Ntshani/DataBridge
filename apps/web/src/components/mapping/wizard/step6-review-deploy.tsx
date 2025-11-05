"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  GitBranch,
  Rocket,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type DeploymentStatus = "pending" | "validating" | "deploying" | "success" | "error";

type Step6Props = {
  projectName: string;
  tableMappingsCount: number;
  columnMappingsCount: number;
  transformationsCount: number;
  scheduleEnabled: boolean;
  cronExpression?: string;
  onDeploy: () => Promise<void>;
  onSkipDeploy: () => void;
};

export const ReviewDeploy = ({
  projectName,
  tableMappingsCount,
  columnMappingsCount,
  transformationsCount,
  scheduleEnabled,
  cronExpression,
  onDeploy,
  onSkipDeploy,
}: Step6Props) => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>("pending");
  const [dagUrl, setDagUrl] = useState<string | null>(null);
  const [cicdUrl, setCicdUrl] = useState<string | null>(null);

  const handleDeploy = async () => {
    try {
      setDeploymentStatus("validating");
      
      // Simulate validation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setDeploymentStatus("deploying");
      
      // Call deployment action
      await onDeploy();
      
      // Simulate getting URLs
      setDagUrl(`${process.env.NEXT_PUBLIC_AIRFLOW_URL || "http://localhost:8080"}/dags/${projectName.toLowerCase().replace(/\s+/g, "_")}`);
      setCicdUrl("https://github.com/your-org/your-repo/actions");
      
      setDeploymentStatus("success");
    } catch {
      setDeploymentStatus("error");
    }
  };

  const getStatusInfo = () => {
    switch (deploymentStatus) {
      case "validating":
        return {
          icon: Loader2,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          label: "Validating DAG configuration...",
        };
      case "deploying":
        return {
          icon: Loader2,
          color: "text-[#06B6D4]",
          bgColor: "bg-[#06B6D4]/10",
          label: "Deploying to Airflow...",
        };
      case "success":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
          label: "Successfully deployed!",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          label: "Deployment failed",
        };
      default:
        return {
          icon: Rocket,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          label: "Ready to deploy",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <>
      {/* Content Header */}
      <div className="flex-shrink-0 border-b bg-white px-8 py-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review & Deploy</h2>
          <p className="text-gray-600 mt-1">
            Review your configuration and deploy the pipeline to Airflow
          </p>
        </div>

        {/* Deployment Status Banner */}
        <div className={cn("rounded-lg p-4 border", statusInfo.bgColor)}>
          <div className="flex items-center gap-3">
            <StatusIcon
              className={cn(
                "w-6 h-6",
                statusInfo.color,
                (deploymentStatus === "validating" || deploymentStatus === "deploying") &&
                  "animate-spin"
              )}
            />
            <div className="flex-1">
              <p className={cn("font-semibold", statusInfo.color)}>{statusInfo.label}</p>
              {deploymentStatus === "deploying" && (
                <p className="text-sm text-gray-600 mt-1">
                  This may take a few minutes. Creating DAG, committing to GitHub, and triggering CI/CD...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-3xl">
          {/* Configuration Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Project Name</span>
                </div>
                <Badge variant="outline" className="font-mono">
                  {projectName}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Table Mappings</span>
                </div>
                <Badge className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20">
                  {tableMappingsCount} {tableMappingsCount === 1 ? "table" : "tables"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Column Mappings</span>
                </div>
                <Badge className="bg-[#32DBBC]/10 text-[#32DBBC] border-[#32DBBC]/20">
                  {columnMappingsCount} {columnMappingsCount === 1 ? "column" : "columns"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Transformations</span>
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {transformationsCount} {transformationsCount === 1 ? "transformation" : "transformations"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  {scheduleEnabled ? (
                    <>
                      <Badge variant="outline" className="font-mono text-xs">
                        {cronExpression}
                      </Badge>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">Manual Only</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Deployment Steps */}
          {deploymentStatus !== "pending" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Progress</h3>
              
              <div className="space-y-3">
                <DeploymentStep
                  label="Generate Airflow DAG"
                  status={
                    deploymentStatus === "validating"
                      ? "in-progress"
                      : ["deploying", "success"].includes(deploymentStatus)
                        ? "completed"
                        : "pending"
                  }
                />
                <DeploymentStep
                  label="Validate DAG syntax"
                  status={
                    deploymentStatus === "validating"
                      ? "in-progress"
                      : ["deploying", "success"].includes(deploymentStatus)
                        ? "completed"
                        : "pending"
                  }
                />
                <DeploymentStep
                  label="Commit to GitHub repository"
                  status={
                    deploymentStatus === "deploying"
                      ? "in-progress"
                      : deploymentStatus === "success"
                        ? "completed"
                        : "pending"
                  }
                />
                <DeploymentStep
                  label="Trigger CI/CD workflow"
                  status={
                    deploymentStatus === "deploying"
                      ? "in-progress"
                      : deploymentStatus === "success"
                        ? "completed"
                        : "pending"
                  }
                />
                <DeploymentStep
                  label="Deploy to Airflow"
                  status={deploymentStatus === "success" ? "completed" : "pending"}
                />
              </div>
            </Card>
          )}

          {/* Success Links */}
          {deploymentStatus === "success" && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Pipeline Deployed Successfully!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your pipeline is now available in Airflow and ready to run.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dagUrl && (
                  <a
                    href={dagUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#06B6D4] hover:text-[#0891b2] font-medium"
                  >
                    <GitBranch className="w-4 h-4" />
                    View DAG in Airflow
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {cicdUrl && (
                  <a
                    href={cicdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#06B6D4] hover:text-[#0891b2] font-medium"
                  >
                    <GitBranch className="w-4 h-4" />
                    View CI/CD Workflow
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Error Message */}
          {deploymentStatus === "error" && (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Deployment Failed</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error deploying your pipeline. Please check the configuration and try again.
                  </p>
                  <Button
                    onClick={handleDeploy}
                    variant="outline"
                    size="sm"
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Retry Deployment
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="flex-shrink-0 border-t bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={deploymentStatus === "deploying" || deploymentStatus === "validating"}>
            Back
          </Button>

          <div className="flex gap-3">
            {deploymentStatus === "pending" && (
              <>
                <Button variant="outline" onClick={onSkipDeploy}>
                  Skip Deployment
                </Button>
                <Button
                  onClick={handleDeploy}
                  className="bg-[#06B6D4] hover:bg-[#0891b2] text-white"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy to Airflow
                </Button>
              </>
            )}

            {deploymentStatus === "success" && (
              <Button
                onClick={onSkipDeploy}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            )}

            {(deploymentStatus === "validating" || deploymentStatus === "deploying") && (
              <Button disabled className="bg-[#06B6D4]/50 text-white">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deploying...
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

type DeploymentStepProps = {
  label: string;
  status: "pending" | "in-progress" | "completed";
};

const DeploymentStep = ({ label, status }: DeploymentStepProps) => {
  return (
    <div className="flex items-center gap-3 py-2">
      {status === "completed" && (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      )}
      {status === "in-progress" && (
        <Loader2 className="w-5 h-5 text-[#06B6D4] flex-shrink-0 animate-spin" />
      )}
      {status === "pending" && (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
      )}
      <span
        className={cn(
          "text-sm",
          status === "completed" && "text-gray-700 font-medium",
          status === "in-progress" && "text-[#06B6D4] font-medium",
          status === "pending" && "text-gray-400"
        )}
      >
        {label}
      </span>
    </div>
  );
};

