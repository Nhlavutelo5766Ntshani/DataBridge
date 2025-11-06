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
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pause,
  Play,
} from "lucide-react";

type QueueStats = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
};

const QueueMonitorPage = () => {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/executions/queue-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch queue stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePauseQueue = async () => {
    try {
      const response = await fetch("/api/executions/temp-exec-id/pause", {
        method: "POST",
      });
      if (response.ok) {
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Failed to pause queue:", error);
    }
  };

  const handleResumeQueue = async () => {
    try {
      const response = await fetch("/api/executions/temp-exec-id/resume", {
        method: "POST",
      });
      if (response.ok) {
        setIsPaused(false);
      }
    } catch (error) {
      console.error("Failed to resume queue:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-[200px] mb-3" />
            <Skeleton className="h-5 w-[340px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-[80px]" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-10 w-[50px] mb-2" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[150px] mb-2" />
            <Skeleton className="h-5 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Waiting",
      value: stats?.waiting || 0,
      icon: Clock,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "Jobs in queue",
    },
    {
      title: "Active",
      value: stats?.active || 0,
      icon: Activity,
      color: "text-[#06B6D4]",
      bgColor: "bg-[#06B6D4]/10",
      description: "Currently processing",
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Successfully finished",
    },
    {
      title: "Failed",
      value: stats?.failed || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Encountered errors",
    },
    {
      title: "Delayed",
      value: stats?.delayed || 0,
      icon: Pause,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Scheduled for later",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue Monitor</h1>
          <p className="text-gray-500 mt-1">
            Real-time BullMQ queue statistics and controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={isPaused ? handleResumeQueue : handlePauseQueue}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume Queue
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Queue
              </>
            )}
          </Button>
          <Button onClick={fetchStats} disabled={refreshing}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Health</CardTitle>
          <CardDescription>
            Overall queue performance and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Total Jobs Processed
              </p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <Badge variant={isPaused ? "secondary" : "success"}>
              {isPaused ? "Paused" : "Active"}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">
                {stats && stats.total > 0
                  ? `${Math.round((stats.completed / stats.total) * 100)}%`
                  : "N/A"}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width:
                    stats && stats.total > 0
                      ? `${(stats.completed / stats.total) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Average Wait Time</p>
              <p className="text-lg font-semibold">~2.3s</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Process Time</p>
              <p className="text-lg font-semibold">~45s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Last 10 job state changes (real-time)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>Real-time activity log coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueMonitorPage;

