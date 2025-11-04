"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Edit, Trash2, Play, Pause } from "lucide-react";
import { useState } from "react";
import { ScheduleManagementDialog } from "./schedule-management-dialog";
import { deleteScheduleAction, updateScheduleAction } from "@/lib/actions/pipelines";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Schedule = {
  id: string;
  name: string;
  cronExpression: string;
  timezone: string | null;
  enabled: boolean | null;
  lastRun?: Date | null;
  nextRun?: Date | null;
  description?: string | null;
  projectId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  metadata?: unknown;
};

type ScheduleCardProps = {
  schedule: Schedule | null;
  projectId: string;
  onUpdate: () => void;
};

function getCronDescription(cron: string): string {
  const descriptions: Record<string, string> = {
    "*/15 * * * *": "Every 15 minutes",
    "0 * * * *": "Every hour",
    "0 */6 * * *": "Every 6 hours",
    "0 0 * * *": "Daily at midnight",
    "0 9 * * *": "Daily at 9 AM",
    "0 9 * * 1-5": "Weekdays at 9 AM",
    "0 0 * * 0": "Weekly (Sunday)",
    "0 0 1 * *": "Monthly (1st day)",
  };

  return descriptions[cron] || cron;
}

export function ScheduleCard({ schedule, projectId, onUpdate }: ScheduleCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleDelete = async () => {
    if (!schedule) return;

    setIsDeleting(true);
    try {
      const result = await deleteScheduleAction(schedule.id);
      if (result.success) {
        onUpdate();
        setShowDeleteDialog(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!schedule) return;

    setIsTogglingActive(true);
    try {
      const result = await updateScheduleAction({
        id: schedule.id,
        updateData: {
          enabled: !schedule.enabled,
        },
      });
      if (result.success) {
        onUpdate();
      }
    } finally {
      setIsTogglingActive(false);
    }
  };

  if (!schedule) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule
                </CardTitle>
                <CardDescription>No schedule configured</CardDescription>
              </div>
              <Button onClick={() => setShowEditDialog(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              DAG will run manually or use Airflow's default "@daily" schedule
            </p>
          </CardContent>
        </Card>

        <ScheduleManagementDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          projectId={projectId}
          existingSchedule={null}
          onSuccess={onUpdate}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {schedule.name}
                </CardTitle>
                <Badge variant={schedule.enabled ? "default" : "secondary"}>
                  {schedule.enabled ? "Active" : "Paused"}
                </Badge>
              </div>
              <CardDescription className="mt-1">{schedule.description || "Automated schedule"}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleActive}
                disabled={isTogglingActive}
                title={schedule.enabled ? "Pause schedule" : "Activate schedule"}
              >
                {schedule.enabled ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEditDialog(true)}
                title="Edit schedule"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                title="Delete schedule"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Frequency</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getCronDescription(schedule.cronExpression)}</span>
              </div>
              <code className="text-xs text-muted-foreground block mt-1">{schedule.cronExpression}</code>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Timezone</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{schedule.timezone || "UTC"}</span>
              </div>
            </div>
          </div>

          {(schedule.lastRun || schedule.nextRun) && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Execution Info</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {schedule.lastRun && (
                  <div>
                    <span className="text-muted-foreground">Last Run: </span>
                    <span>{new Date(schedule.lastRun).toLocaleDateString()}</span>
                  </div>
                )}
                {schedule.nextRun && (
                  <div>
                    <span className="text-muted-foreground">Next Run: </span>
                    <span>{new Date(schedule.nextRun).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleManagementDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        projectId={projectId}
        existingSchedule={schedule}
        onSuccess={onUpdate}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the scheduled execution for this project. The DAG will use Airflow's default "@daily"
              schedule or run manually. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete Schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

