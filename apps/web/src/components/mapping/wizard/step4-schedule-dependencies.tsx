"use client";

import { useState } from "react";
import { Clock, AlertCircle, RefreshCw, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

type ScheduleConfig = {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  slaMinutes: number;
  maxRetries: number;
  retryDelayMinutes: number;
  enableBackfill: boolean;
  dependsOnPipelineId: string | null;
};

type Step4Props = {
  config: ScheduleConfig;
  availablePipelines?: Array<{ id: string; name: string }>;
  onConfigChange: (config: ScheduleConfig) => void;
};

const CRON_PRESETS = [
  { label: "Every 15 minutes", value: "*/15 * * * *", description: "Runs 4 times per hour" },
  { label: "Every hour", value: "0 * * * *", description: "Runs at the start of every hour" },
  { label: "Every 6 hours", value: "0 */6 * * *", description: "Runs 4 times per day" },
  { label: "Daily at midnight", value: "0 0 * * *", description: "Runs once per day" },
  { label: "Daily at 9 AM", value: "0 9 * * *", description: "Weekdays business hours" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0", description: "Once per week" },
  { label: "Monthly (1st day)", value: "0 0 1 * *", description: "First day of each month" },
  { label: "Custom", value: "custom", description: "Define your own schedule" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export const ScheduleDependencies = ({ config, availablePipelines = [], onConfigChange }: Step4Props) => {
  const [showCustomCron, setShowCustomCron] = useState(false);

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      setShowCustomCron(true);
    } else {
      setShowCustomCron(false);
      onConfigChange({ ...config, cronExpression: preset });
    }
  };

  return (
    <>
      {/* Content Header */}
      <div className="flex-shrink-0 border-b bg-white px-8 py-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule & Dependencies</h2>
          <p className="text-gray-600 mt-1">
            Configure when and how your pipeline runs, set up monitoring alerts, and define dependencies.
          </p>
        </div>

        <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">Airflow Integration:</p>
              <p className="text-gray-600">
                These settings will be used to generate your Airflow DAG. You can modify them later
                in the Airflow UI or by updating the pipeline configuration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-3xl">
          {/* Schedule Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#06B6D4]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Schedule Configuration</h3>
                <p className="text-sm text-gray-600">Define when your pipeline should run</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="schedule-enabled"
                  checked={config.enabled}
                  onChange={(e) => onConfigChange({ ...config, enabled: e.target.checked })}
                  className="w-4 h-4 text-[#06B6D4] border-gray-300 rounded focus:ring-[#06B6D4]"
                />
                <Label htmlFor="schedule-enabled" className="text-sm font-medium">
                  Enable automatic scheduling
                </Label>
              </div>

              {config.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cron-preset">Schedule Preset</Label>
                      <Select
                        value={showCustomCron ? "custom" : config.cronExpression}
                        onValueChange={handlePresetChange}
                      >
                        <SelectTrigger id="cron-preset">
                          <SelectValue placeholder="Select a preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {CRON_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{preset.label}</span>
                                <span className="text-xs text-gray-500">{preset.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={config.timezone}
                        onValueChange={(value) => onConfigChange({ ...config, timezone: value })}
                      >
                        <SelectTrigger id="timezone">
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
                  </div>

                  {showCustomCron && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-cron">Custom Cron Expression</Label>
                      <Input
                        id="custom-cron"
                        value={config.cronExpression}
                        onChange={(e) => onConfigChange({ ...config, cronExpression: e.target.value })}
                        placeholder="0 */6 * * *"
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500">
                        Format: minute hour day month weekday (e.g., 0 */6 * * * = every 6 hours)
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Current Schedule:</p>
                    <code className="text-sm text-[#06B6D4] font-mono">{config.cronExpression}</code>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* SLA & Monitoring */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">SLA & Monitoring</h3>
                <p className="text-sm text-gray-600">Set up alerts for pipeline performance</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sla">SLA (Service Level Agreement)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="sla"
                    type="number"
                    min={1}
                    value={config.slaMinutes}
                    onChange={(e) =>
                      onConfigChange({ ...config, slaMinutes: parseInt(e.target.value) || 60 })
                    }
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
                <p className="text-xs text-gray-500">
                  Alert if pipeline execution exceeds this duration
                </p>
              </div>
            </div>
          </Card>

          {/* Retry Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Retry Configuration</h3>
                <p className="text-sm text-gray-600">Configure automatic retry behavior</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-retries">Maximum Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min={0}
                    max={10}
                    value={config.maxRetries}
                    onChange={(e) =>
                      onConfigChange({ ...config, maxRetries: parseInt(e.target.value) || 3 })
                    }
                  />
                  <p className="text-xs text-gray-500">Number of retry attempts on failure</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry-delay">Retry Delay</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="retry-delay"
                      type="number"
                      min={1}
                      value={config.retryDelayMinutes}
                      onChange={(e) =>
                        onConfigChange({
                          ...config,
                          retryDelayMinutes: parseInt(e.target.value) || 5,
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                  <p className="text-xs text-gray-500">Wait time between retries</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pipeline Dependencies */}
          {availablePipelines.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pipeline Dependencies</h3>
                  <p className="text-sm text-gray-600">
                    Define which pipeline must complete before this one starts
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depends-on">Depends On Pipeline</Label>
                  <Select
                    value={config.dependsOnPipelineId || "none"}
                    onValueChange={(value) =>
                      onConfigChange({
                        ...config,
                        dependsOnPipelineId: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger id="depends-on">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-500">No dependency</span>
                      </SelectItem>
                      {availablePipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    This pipeline will wait for the selected pipeline to complete successfully
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Backfill Settings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                <p className="text-sm text-gray-600">Additional configuration options</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enable-backfill"
                  checked={config.enableBackfill}
                  onChange={(e) =>
                    onConfigChange({ ...config, enableBackfill: e.target.checked })
                  }
                  className="w-4 h-4 text-[#06B6D4] border-gray-300 rounded focus:ring-[#06B6D4]"
                />
                <div>
                  <Label htmlFor="enable-backfill" className="text-sm font-medium">
                    Enable backfill for missed runs
                  </Label>
                  <p className="text-xs text-gray-500">
                    Run pipeline for any missed scheduled executions
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="flex-shrink-0 border-t bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <Button variant="outline">Back</Button>

          <div className="flex gap-3">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
              Continue to Preview
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

