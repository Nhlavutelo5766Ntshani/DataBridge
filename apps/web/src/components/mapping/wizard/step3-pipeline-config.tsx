"use client";

import { Settings, AlertTriangle, Zap, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type PipelineConfig = {
  batchSize: number;
  errorHandling: "fail-fast" | "continue-on-error" | "skip-and-log";
  parallelism: number;
  validateData: boolean;
  preMigrationHook: string;
  postMigrationHook: string;
  enableRowValidation: boolean;
  enableTypeValidation: boolean;
  logLevel: "debug" | "info" | "warning" | "error";
};

type Step3Props = {
  config: PipelineConfig;
  onConfigChange: (config: PipelineConfig) => void;
};

export const PipelineConfig = ({ config, onConfigChange }: Step3Props) => {
  return (
    <>
      {/* Content Header */}
      <div className="flex-shrink-0 border-b bg-white px-8 py-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configure Pipeline</h2>
          <p className="text-gray-600 mt-1">
            Set up performance, error handling, and validation rules for your data migration
          </p>
        </div>

        <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Production-Ready Settings:</p>
              <p className="text-gray-600">
                These configurations ensure your migration runs efficiently and safely at scale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-3xl">
          {/* Performance Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#06B6D4]/10 rounded-lg">
                <Zap className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
                <p className="text-sm text-gray-600">Optimize for speed and efficiency</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-size">Batch Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={config.batchSize}
                  onChange={(e) =>
                    onConfigChange({ ...config, batchSize: parseInt(e.target.value) || 1000 })
                  }
                />
                <p className="text-xs text-gray-500">
                  Number of rows to process in each batch (recommended: 1000-5000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parallelism">Parallelism Level</Label>
                <Select
                  value={config.parallelism.toString()}
                  onValueChange={(value) =>
                    onConfigChange({ ...config, parallelism: parseInt(value) })
                  }
                >
                  <SelectTrigger id="parallelism">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Sequential)</SelectItem>
                    <SelectItem value="2">2 (Low)</SelectItem>
                    <SelectItem value="4">4 (Medium)</SelectItem>
                    <SelectItem value="8">8 (High)</SelectItem>
                    <SelectItem value="16">16 (Very High)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Number of concurrent operations (higher = faster but more resource-intensive)
                </p>
              </div>
            </div>
          </Card>

          {/* Error Handling */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error Handling</h3>
                <p className="text-sm text-gray-600">Define how errors should be handled</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="error-strategy">Error Strategy</Label>
                <Select
                  value={config.errorHandling}
                  onValueChange={(value: "fail-fast" | "continue-on-error" | "skip-and-log") =>
                    onConfigChange({ ...config, errorHandling: value })
                  }
                >
                  <SelectTrigger id="error-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fail-fast">
                      <div className="flex flex-col">
                        <span className="font-medium">Fail Fast</span>
                        <span className="text-xs text-gray-500">Stop on first error</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="continue-on-error">
                      <div className="flex flex-col">
                        <span className="font-medium">Continue on Error</span>
                        <span className="text-xs text-gray-500">
                          Continue processing, report errors at end
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="skip-and-log">
                      <div className="flex flex-col">
                        <span className="font-medium">Skip and Log</span>
                        <span className="text-xs text-gray-500">
                          Skip failed rows and continue
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="log-level">Log Level</Label>
                <Select
                  value={config.logLevel}
                  onValueChange={(value: "debug" | "info" | "warning" | "error") =>
                    onConfigChange({ ...config, logLevel: value })
                  }
                >
                  <SelectTrigger id="log-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug (Verbose)</SelectItem>
                    <SelectItem value="info">Info (Standard)</SelectItem>
                    <SelectItem value="warning">Warning (Important only)</SelectItem>
                    <SelectItem value="error">Error (Failures only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Data Validation */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Data Validation</h3>
                <p className="text-sm text-gray-600">Ensure data quality during migration</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enable-row-validation"
                  checked={config.enableRowValidation}
                  onChange={(e) =>
                    onConfigChange({ ...config, enableRowValidation: e.target.checked })
                  }
                  className="w-4 h-4 text-[#06B6D4] border-gray-300 rounded focus:ring-[#06B6D4]"
                />
                <div>
                  <Label htmlFor="enable-row-validation" className="text-sm font-medium">
                    Enable row-level validation
                  </Label>
                  <p className="text-xs text-gray-500">
                    Validate each row against defined constraints
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enable-type-validation"
                  checked={config.enableTypeValidation}
                  onChange={(e) =>
                    onConfigChange({ ...config, enableTypeValidation: e.target.checked })
                  }
                  className="w-4 h-4 text-[#06B6D4] border-gray-300 rounded focus:ring-[#06B6D4]"
                />
                <div>
                  <Label htmlFor="enable-type-validation" className="text-sm font-medium">
                    Enable type validation
                  </Label>
                  <p className="text-xs text-gray-500">
                    Verify data types match target schema
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Migration Hooks */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Migration Hooks (Optional)</h3>
                <p className="text-sm text-gray-600">Run custom SQL before/after migration</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pre-hook">Pre-Migration Hook</Label>
                <Textarea
                  id="pre-hook"
                  value={config.preMigrationHook || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, preMigrationHook: e.target.value })
                  }
                  placeholder="-- SQL to run before migration&#10;-- Example: TRUNCATE TABLE target_table;"
                  className="font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  SQL executed on target database before migration starts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-hook">Post-Migration Hook</Label>
                <Textarea
                  id="post-hook"
                  value={config.postMigrationHook || ""}
                  onChange={(e) =>
                    onConfigChange({ ...config, postMigrationHook: e.target.value })
                  }
                  placeholder="-- SQL to run after migration&#10;-- Example: CREATE INDEX idx_name ON target_table(column);"
                  className="font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  SQL executed on target database after migration completes
                </p>
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
              Continue to Schedule
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

