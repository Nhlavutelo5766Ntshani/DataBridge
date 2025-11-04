"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

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
};

type MigrationExecutionProps = {
  onStartExecution: () => Promise<{ executionId: string }>;
  onCheckStatus: (executionId: string) => Promise<ExecutionData>;
};

export const MigrationExecution = ({
  onStartExecution,
  onCheckStatus,
}: MigrationExecutionProps) => {
  const [execution, setExecution] = useState<ExecutionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startMigration();
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Migration Failed</h2>
          <p className="text-gray-600 mt-1">An error occurred during migration execution.</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
        <span className="ml-3 text-gray-600">Initializing migration...</span>
      </div>
    );
  }

  const isRunning = execution.status === "running" || execution.status === "pending";
  const isCompleted = execution.status === "completed";
  const isFailed = execution.status === "failed";
  const successRate =
    execution.totalRecords > 0
      ? ((execution.processedRecords / execution.totalRecords) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isRunning && "Migration in Progress"}
          {isCompleted && "Migration Completed"}
          {isFailed && "Migration Failed"}
        </h2>
        <p className="text-gray-600 mt-1">
          {isRunning && "Please wait while data is being migrated..."}
          {isCompleted && "All data has been successfully migrated to the target database."}
          {isFailed && "The migration encountered errors and could not complete."}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-gray-900">{execution.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                isCompleted && "bg-green-500",
                isFailed && "bg-red-500",
                isRunning && "bg-[#06B6D4] animate-pulse"
              )}
              style={{ width: `${execution.progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">
              {execution.totalRecords.toLocaleString()}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Processed</p>
            <p className="text-2xl font-bold text-green-700">
              {execution.processedRecords.toLocaleString()}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-700">
              {execution.failedRecords.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Execution Details</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-600">Status</span>
            <Badge
              className={cn(
                isRunning && "bg-blue-100 text-blue-800 border-blue-200",
                isCompleted && "bg-green-100 text-green-800 border-green-200",
                isFailed && "bg-red-100 text-red-800 border-red-200"
              )}
            >
              {isRunning && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {isCompleted && <CheckCircle className="w-3 h-3 mr-1" />}
              {isFailed && <XCircle className="w-3 h-3 mr-1" />}
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
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Completed At</span>
              <span className="font-mono text-sm text-gray-900">
                {execution.endTime.toLocaleString()}
              </span>
            </div>
          )}

          {execution.endTime && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Duration</span>
              <span className="font-semibold text-gray-900">
                {Math.round(
                  (execution.endTime.getTime() - execution.startTime.getTime()) / 1000
                )}{" "}
                seconds
              </span>
            </div>
          )}
        </div>
      </div>

      {execution.errors && execution.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
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
        </div>
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Migration Completed Successfully!</h3>
              <p className="text-sm text-green-800 mt-1">
                {execution.processedRecords.toLocaleString()} records have been migrated to the
                target database.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

