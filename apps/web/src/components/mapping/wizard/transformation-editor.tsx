"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransformationConfig } from "@/lib/types/transformation";

type TransformationEditorProps = {
  columnMapping: {
    sourceColumn: string;
    targetColumn: string;
    sourceDataType: string;
    targetDataType: string;
    transformation: TransformationConfig | null;
  };
  onSave: (transformation: TransformationConfig | null) => void;
  onCancel: () => void;
};

export const TransformationEditor = ({
  columnMapping,
  onSave,
  onCancel,
}: TransformationEditorProps) => {
  const [transformationType, setTransformationType] = useState<string>(
    columnMapping.transformation?.type || "NONE"
  );
  const [targetType, setTargetType] = useState(
    columnMapping.transformation?.type === "TYPE_CONVERSION"
      ? (columnMapping.transformation.parameters.targetType as string)
      : "VARCHAR"
  );
  const [sqlExpression, setSqlExpression] = useState(
    columnMapping.transformation?.type === "CUSTOM_SQL"
      ? (columnMapping.transformation.parameters.expression as string)
      : ""
  );
  const [defaultValue, setDefaultValue] = useState(
    columnMapping.transformation?.type === "DEFAULT_VALUE"
      ? String(columnMapping.transformation.parameters.value)
      : ""
  );

  const handleSave = () => {
    let transformation: TransformationConfig | null = null;

    switch (transformationType) {
      case "TYPE_CONVERSION":
        transformation = {
          type: "TYPE_CONVERSION",
          parameters: {
            sourceType: columnMapping.sourceDataType,
            targetType,
          },
        };
        break;
      case "CUSTOM_SQL":
        if (sqlExpression.trim()) {
          transformation = {
            type: "CUSTOM_SQL",
            parameters: {
              expression: sqlExpression.trim(),
            },
          };
        }
        break;
      case "EXCLUDE_COLUMN":
        transformation = {
          type: "EXCLUDE_COLUMN",
          parameters: {},
        };
        break;
      case "DEFAULT_VALUE":
        if (defaultValue.trim()) {
          transformation = {
            type: "DEFAULT_VALUE",
            parameters: {
              value: defaultValue.trim(),
            },
          };
        }
        break;
      case "NONE":
      default:
        transformation = null;
    }

    onSave(transformation);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Source:</span>{" "}
            <span className="font-mono">{columnMapping.sourceColumn}</span>
            <span className="text-gray-600 ml-2">({columnMapping.sourceDataType})</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Target:</span>{" "}
            <span className="font-mono">{columnMapping.targetColumn}</span>
            <span className="text-gray-600 ml-2">({columnMapping.targetDataType})</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="transformation-type">Transformation Type</Label>
        <Select value={transformationType} onValueChange={setTransformationType}>
          <SelectTrigger id="transformation-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None (Direct Copy)</SelectItem>
            <SelectItem value="TYPE_CONVERSION">Data Type Conversion</SelectItem>
            <SelectItem value="CUSTOM_SQL">Custom SQL Expression</SelectItem>
            <SelectItem value="DEFAULT_VALUE">Default Value</SelectItem>
            <SelectItem value="EXCLUDE_COLUMN">Exclude Column</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transformationType === "TYPE_CONVERSION" && (
        <div>
          <Label htmlFor="target-type">Target Data Type</Label>
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger id="target-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VARCHAR">VARCHAR</SelectItem>
              <SelectItem value="INTEGER">INTEGER</SelectItem>
              <SelectItem value="BIGINT">BIGINT</SelectItem>
              <SelectItem value="DECIMAL">DECIMAL</SelectItem>
              <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
              <SelectItem value="DATE">DATE</SelectItem>
              <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
              <SelectItem value="TEXT">TEXT</SelectItem>
              <SelectItem value="JSON">JSON</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600 mt-1">
            Convert {columnMapping.sourceDataType} to {targetType}
          </p>
        </div>
      )}

      {transformationType === "CUSTOM_SQL" && (
        <div>
          <Label htmlFor="sql-expression">SQL Expression</Label>
          <Textarea
            id="sql-expression"
            value={sqlExpression}
            onChange={(e) => setSqlExpression(e.target.value)}
            placeholder="UPPER(column_name), column_name * 1.1, etc."
            rows={4}
          />
          <p className="text-xs text-gray-600 mt-1">
            Use <code className="bg-gray-200 px-1 rounded">{columnMapping.sourceColumn}</code> to
            reference the source column
          </p>
        </div>
      )}

      {transformationType === "DEFAULT_VALUE" && (
        <div>
          <Label htmlFor="default-value">Default Value</Label>
          <Input
            id="default-value"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Enter default value..."
          />
          <p className="text-xs text-gray-600 mt-1">
            This value will be used if the source column is NULL
          </p>
        </div>
      )}

      {transformationType === "EXCLUDE_COLUMN" && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <p className="text-sm text-amber-800">
            This column will be excluded from the migration. No data will be transferred.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
          Save Transformation
        </Button>
      </div>
    </div>
  );
};

