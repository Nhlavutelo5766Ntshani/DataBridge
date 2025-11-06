"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

type Execution = {
  id: string;
  projectId: string;
  projectName: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed: number;
  recordsFailed: number;
  progress: number;
};

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary" as const,
  },
  running: {
    label: "Running",
    icon: Loader2,
    variant: "default" as const,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    variant: "success" as const,
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive" as const,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "secondary" as const,
  },
};

const ExecutionHistory = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExecutions = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/executions/history");
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error("Failed to fetch execution history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-[240px] mb-3" />
            <Skeleton className="h-5 w-[320px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[180px] mb-2" />
            <Skeleton className="h-5 w-[300px]" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[160px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Execution History
          </h1>
          <p className="text-gray-500 mt-1">
            View and monitor all migration executions
          </p>
        </div>
        <Button onClick={fetchExecutions} disabled={refreshing}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>
            All migration execution runs across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No executions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Start a migration to see execution history
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => {
                  const config = statusConfig[execution.status];
                  const StatusIcon = config.icon;

                  return (
                    <TableRow key={execution.id}>
                      <TableCell className="font-medium">
                        {execution.projectName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>
                          <StatusIcon
                            className={`w-3 h-3 mr-1 ${
                              execution.status === "running"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(execution.startTime)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDuration(execution.duration)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">
                            ✓ {execution.recordsProcessed}
                          </div>
                          {execution.recordsFailed > 0 && (
                            <div className="text-red-600">
                              ✗ {execution.recordsFailed}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#06B6D4]"
                              style={{ width: `${execution.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {execution.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/migrations/${execution.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionHistory;
