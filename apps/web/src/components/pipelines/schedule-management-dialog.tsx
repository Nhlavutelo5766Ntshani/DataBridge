"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addSchedule, updateScheduleAction } from "@/lib/actions/pipelines";
import { AlertCircle, Clock } from "lucide-react";

type Schedule = {
  id?: string;
  name: string;
  cronExpression: string;
  timezone: string | null;
  enabled: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  description?: string | null;
  lastRun?: Date | null;
  nextRun?: Date | null;
  metadata?: unknown;
  projectId: string;
};

type ScheduleManagementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingSchedule?: Schedule | null;
  onSuccess?: () => void;
};

const CRON_PRESETS = [
  { label: "Every 15 minutes", value: "*/15 * * * *", description: "Runs every 15 minutes" },
  { label: "Every hour", value: "0 * * * *", description: "Runs at the start of every hour" },
  { label: "Every 6 hours", value: "0 */6 * * *", description: "Runs every 6 hours" },
  { label: "Daily at midnight", value: "0 0 * * *", description: "Runs once per day at 00:00" },
  { label: "Daily at 9 AM", value: "0 9 * * *", description: "Runs daily at 09:00" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5", description: "Runs Mon-Fri at 09:00" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0", description: "Runs every Sunday at midnight" },
  { label: "Monthly (1st)", value: "0 0 1 * *", description: "Runs on the 1st of each month" },
  { label: "Custom", value: "custom", description: "Enter your own cron expression" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Africa/Johannesburg",
];

export function ScheduleManagementDialog({
  open,
  onOpenChange,
  projectId,
  existingSchedule,
  onSuccess,
}: ScheduleManagementDialogProps) {
  const [name, setName] = useState("");
  const [preset, setPreset] = useState("0 0 * * *");
  const [customCron, setCustomCron] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingSchedule) {
      setName(existingSchedule.name);
      
      const matchingPreset = CRON_PRESETS.find(
        (p) => p.value === existingSchedule.cronExpression
      );
      
      if (matchingPreset && matchingPreset.value !== "custom") {
        setPreset(matchingPreset.value);
      } else {
        setPreset("custom");
        setCustomCron(existingSchedule.cronExpression);
      }
      
      setTimezone(existingSchedule.timezone || "UTC");
      setDescription(existingSchedule.description || "");
    } else {
      setName(`${projectId.slice(0, 8)} Schedule`);
      setPreset("0 0 * * *");
      setCustomCron("");
      setTimezone("UTC");
      setDescription("");
    }
    setError(null);
  }, [existingSchedule, projectId, open]);

  const getCronExpression = (): string => {
    return preset === "custom" ? customCron : preset;
  };

  const validateCron = (cron: string): boolean => {
    const parts = cron.trim().split(/\s+/);
    return parts.length === 5;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cronExpression = getCronExpression();

    if (!name.trim()) {
      setError("Schedule name is required");
      return;
    }

    if (!cronExpression.trim()) {
      setError("Cron expression is required");
      return;
    }

    if (!validateCron(cronExpression)) {
      setError("Invalid cron expression. Must have 5 parts (minute hour day month weekday)");
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        projectId,
        name: name.trim(),
        cronExpression,
        timezone,
        enabled: true,
        description: description.trim() || null,
      };

      let result;
      if (existingSchedule?.id) {
        result = await updateScheduleAction({
          id: existingSchedule.id,
          updateData: scheduleData,
        });
      } else {
        result = await addSchedule(scheduleData);
      }

      if (!result.success) {
        throw new Error(result.error ? String(result.error) : "Failed to save schedule");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPreset = CRON_PRESETS.find((p) => p.value === preset);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {existingSchedule ? "Edit Schedule" : "Create Schedule"}
          </DialogTitle>
          <DialogDescription>
            Configure when this project's DAG should run automatically in Airflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily ETL Run"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset">Schedule Frequency</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRON_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customCron">Custom Cron Expression</Label>
              <Input
                id="customCron"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="*/15 * * * *"
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day month weekday (e.g., "0 9 * * 1-5" for weekdays at 9 AM)
              </p>
            </div>
          )}

          {selectedPreset && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Current Expression:</p>
              <code className="text-primary">{getCronExpression()}</code>
              <p className="text-muted-foreground mt-1">{selectedPreset.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this schedule..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : existingSchedule ? "Update Schedule" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

