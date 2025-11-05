"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";

type ETLStageStatus = {
  stageId: string;
  stageName: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  duration?: number;
};

type ExecutionData = {
  executionId: string;
  status: ExecutionStatus;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  progress: number;
  startTime: Date;
  endTime?: Date;
  errors?: string[];
  stages?: ETLStageStatus[];
};

type ExecutionMonitorProps = {
  onStartExecution: () => Promise<{ executionId: string }>;
  onCheckStatus: (executionId: string) => Promise<ExecutionData>;
  onPauseExecution?: (executionId: string) => Promise<void>;
  onResumeExecution?: (executionId: string) => Promise<void>;
  onRetryExecution?: (executionId: string) => Promise<void>;
};

export const ExecutionMonitor = ({
  onStartExecution,
  onCheckStatus,
  onPauseExecution,
  onResumeExecution,
  onRetryExecution,
}: ExecutionMonitorProps) => {
  const [execution, setExecution] = useState<ExecutionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    startMigration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMigration = async () => {
    try {
      const { executionId } = await onStartExecution();
      pollStatus(executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start migration");
    }
  };

  const pollStatus = async (executionId: string) => {
    const poll = async () => {
      try {
        const data = await onCheckStatus(executionId);
        setExecution(data);

        if (data.status === "running" || data.status === "pending") {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check migration status");
      }
    };

    await poll();
  };

  const handlePause = async () => {
    if (!execution || !onPauseExecution) return;
    try {
      await onPauseExecution(execution.executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause execution");
    }
  };

  const handleResume = async () => {
    if (!execution || !onResumeExecution) return;
    try {
      await onResumeExecution(execution.executionId);
      pollStatus(execution.executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume execution");
    }
  };

  const handleRetry = async () => {
    if (!execution || !onRetryExecution) return;
    try {
      setIsRetrying(true);
      await onRetryExecution(execution.executionId);
      pollStatus(execution.executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry execution");
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    return (
      <>
        <div className="flex-shrink-0 border-b bg-white px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900">Migration Failed</h2>
          <p className="text-gray-600 mt-1">An error occurred during migration execution.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex-shrink-0 border-t bg-white px-8 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline">Go to Dashboard</Button>
            <Button onClick={() => window.location.reload()} className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!execution) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#06B6D4] mx-auto mb-4" />
          <p className="text-gray-600">Initializing migration...</p>
        </div>
      </div>
    );
  }

  const isRunning = execution.status === "running" || execution.status === "pending";
  const isCompleted = execution.status === "completed";
  const isFailed = execution.status === "failed";
  const isPaused = execution.status === "paused";
  const successRate =
    execution.totalRecords > 0
      ? ((execution.processedRecords / execution.totalRecords) * 100).toFixed(1)
      : "0";

  return (
    <>
      {/* Content Header */}
      <div className="flex-shrink-0 border-b bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isRunning && "Migration in Progress"}
              {isCompleted && "Migration Completed"}
              {isFailed && "Migration Failed"}
              {isPaused && "Migration Paused"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isRunning && "Please wait while data is being migrated..."}
              {isCompleted && "All data has been successfully migrated."}
              {isFailed && "The migration encountered errors."}
              {isPaused && "Migration execution is paused."}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-4xl">
          {/* Progress Bar */}
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-semibold text-gray-900">{execution.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    isCompleted && "bg-green-500",
                    isFailed && "bg-red-500",
                    isPaused && "bg-orange-500",
                    isRunning && "bg-[#06B6D4]"
                  )}
                  style={{ width: `${execution.progress}%` }}
                >
                  {isRunning && (
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {execution.totalRecords.toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Processed</p>
                <p className="text-2xl font-bold text-green-700">
                  {execution.processedRecords.toLocaleString()}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-700">
                  {execution.failedRecords.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* ETL Stage Status */}
          {execution.stages && execution.stages.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#06B6D4]" />
                ETL Pipeline Stages
              </h3>

              <div className="space-y-2">
                {execution.stages.map((stage) => (
                  <div key={stage.stageId} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {stage.status === "running" && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                      {stage.status === "completed" && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {stage.status === "failed" && <XCircle className="w-4 h-4 text-red-600" />}
                      {stage.status === "pending" && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                      )}
                      {stage.status === "skipped" && (
                        <div className="w-4 h-4 rounded-full bg-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{stage.stageName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {stage.duration && (
                        <span className="text-xs text-gray-500">{stage.duration}s</span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          stage.status === "completed" && "bg-green-50 text-green-700 border-green-200",
                          stage.status === "running" && "bg-blue-50 text-blue-700 border-blue-200",
                          stage.status === "failed" && "bg-red-50 text-red-700 border-red-200",
                          stage.status === "pending" && "bg-gray-50 text-gray-700 border-gray-200"
                        )}
                      >
                        {stage.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Execution Details */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Execution Details</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Status</span>
                <Badge
                  className={cn(
                    isRunning && "bg-blue-100 text-blue-800 border-blue-200",
                    isCompleted && "bg-green-100 text-green-800 border-green-200",
                    isFailed && "bg-red-100 text-red-800 border-red-200",
                    isPaused && "bg-orange-100 text-orange-800 border-orange-200"
                  )}
                >
                  {isRunning && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {isCompleted && <CheckCircle className="w-3 h-3 mr-1" />}
                  {isFailed && <XCircle className="w-3 h-3 mr-1" />}
                  {isPaused && <Pause className="w-3 h-3 mr-1" />}
                  {execution.status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-semibold text-gray-900">{successRate}%</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Started At</span>
                <span className="font-mono text-sm text-gray-900">
                  {execution.startTime.toLocaleString()}
                </span>
              </div>

              {execution.endTime && (
                <>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Completed At</span>
                    <span className="font-mono text-sm text-gray-900">
                      {execution.endTime.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)} seconds
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Errors */}
          {execution.errors && execution.errors.length > 0 && (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Errors Encountered</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {execution.errors.map((err, index) => (
                      <p key={index} className="text-sm text-red-800 font-mono">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Success Message */}
          {isCompleted && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Migration Completed Successfully!</h3>
                  <p className="text-sm text-green-800 mt-1">
                    {execution.processedRecords.toLocaleString()} records have been migrated.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="flex-shrink-0 border-t bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <Button variant="outline">Go to Dashboard</Button>

          <div className="flex gap-3">
            {isRunning && onPauseExecution && (
              <Button onClick={handlePause} variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            {isPaused && onResumeExecution && (
              <Button onClick={handleResume} className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}

            {isFailed && onRetryExecution && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-[#06B6D4] hover:bg-[#0891b2] text-white"
              >
                {isRetrying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Retry Migration
              </Button>
            )}

            {isCompleted && (
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                View Migrated Data
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

