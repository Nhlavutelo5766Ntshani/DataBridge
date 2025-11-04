"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping } from "@/db/queries/mappings";
import type { TransformationConfig, TransformationType } from "@/lib/types/transformation";
import { updateColumnMappingAction } from "@/lib/actions/mappings";

type TransformationEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnMapping: ColumnMapping;
  onSave: () => void;
};

const TRANSFORMATION_TYPES: { value: TransformationType; label: string; description: string }[] = [
  { value: "TYPE_CONVERSION", label: "Type Conversion", description: "Convert data types (e.g., VARCHAR → INT)" },
  { value: "CUSTOM_SQL", label: "Custom SQL", description: "Write custom SQL expression" },
  { value: "EXCLUDE_COLUMN", label: "Exclude Column", description: "Skip this column during migration" },
  { value: "DEFAULT_VALUE", label: "Default Value", description: "Set default value when NULL" },
  { value: "UPPERCASE", label: "Uppercase", description: "Convert text to uppercase" },
  { value: "LOWERCASE", label: "Lowercase", description: "Convert text to lowercase" },
  { value: "TRIM", label: "Trim", description: "Remove whitespace" },
  { value: "DATE_FORMAT", label: "Date Format", description: "Format date/time values" },
];

export const TransformationEditor = ({
  open,
  onOpenChange,
  columnMapping,
  onSave,
}: TransformationEditorProps) => {
  const existingConfig = columnMapping.transformationConfig as TransformationConfig | null;
  
  const [transformationType, setTransformationType] = useState<TransformationType>(
    existingConfig?.type || "TYPE_CONVERSION"
  );
  const [targetType, setTargetType] = useState(
    (existingConfig?.parameters?.targetType as string) || ""
  );
  const [sqlExpression, setSqlExpression] = useState(
    (existingConfig?.parameters?.expression as string) || ""
  );
  const [defaultValue, setDefaultValue] = useState(
    String(existingConfig?.parameters?.value || "")
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let config: TransformationConfig | null = null;

      switch (transformationType) {
        case "TYPE_CONVERSION":
          if (!targetType) {
            toast.error("Target type is required");
            return;
          }
          config = {
            type: "TYPE_CONVERSION",
            parameters: { sourceType: "", targetType },
          };
          break;

        case "CUSTOM_SQL":
          if (!sqlExpression) {
            toast.error("SQL expression is required");
            return;
          }
          config = {
            type: "CUSTOM_SQL",
            parameters: { expression: sqlExpression },
          };
          break;

        case "EXCLUDE_COLUMN":
          config = {
            type: "EXCLUDE_COLUMN",
            parameters: {},
          };
          break;

        case "DEFAULT_VALUE":
          config = {
            type: "DEFAULT_VALUE",
            parameters: { value: defaultValue },
          };
          break;

        case "UPPERCASE":
        case "LOWERCASE":
        case "TRIM":
          config = {
            type: transformationType,
            parameters: {},
          };
          break;

        default:
          config = {
            type: transformationType,
            parameters: {},
          };
      }

      const result = await updateColumnMappingAction(columnMapping.id, {
        transformationConfig: config,
      });

      if (result.success) {
        toast.success("Transformation saved successfully!");
        onSave();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to save transformation");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save transformation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const result = await updateColumnMappingAction(columnMapping.id, {
        transformationConfig: null,
      });

      if (result.success) {
        toast.success("Transformation removed");
        onSave();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to remove transformation");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Transformation</DialogTitle>
          <DialogDescription>
            {columnMapping.sourceColumn} → {columnMapping.targetColumn}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Transformation Type</Label>
            <Select
              value={transformationType}
              onValueChange={(value) => setTransformationType(value as TransformationType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transformation type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSFORMATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {transformationType === "TYPE_CONVERSION" && (
            <div className="space-y-2">
              <Label htmlFor="targetType">Target Data Type</Label>
              <Input
                id="targetType"
                placeholder="e.g., VARCHAR(255), INT, BIGINT, DATETIME"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the target database type (e.g., VARCHAR(100), INT, DECIMAL(10,2))
              </p>
            </div>
          )}

          {transformationType === "CUSTOM_SQL" && (
            <div className="space-y-2">
              <Label htmlFor="sqlExpression">SQL Expression</Label>
              <Textarea
                id="sqlExpression"
                placeholder="Use {column} as placeholder. Example: CONCAT({column}, '_suffix')"
                value={sqlExpression}
                onChange={(e) => setSqlExpression(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-gray-100 px-1 rounded">{"{column}"}</code> as placeholder for the source column
              </p>
            </div>
          )}

          {transformationType === "DEFAULT_VALUE" && (
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                placeholder="Enter default value for NULL/empty values"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
              />
            </div>
          )}

          {transformationType === "EXCLUDE_COLUMN" && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                This column will be excluded from the migration and will not be transferred to the target database.
              </p>
            </div>
          )}

          {["UPPERCASE", "LOWERCASE", "TRIM"].includes(transformationType) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                No additional configuration needed. This transformation will be applied automatically.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isLoading || !existingConfig}
          >
            <X className="h-4 w-4 mr-2" />
            Remove Transformation
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Transformation
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};





