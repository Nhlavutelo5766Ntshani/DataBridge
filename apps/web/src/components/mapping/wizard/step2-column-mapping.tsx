"use client";

import { useState } from "react";
import { ArrowRight, Settings, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import type { TableSchema } from "@/lib/types/schema";
import type { TransformationConfig } from "@/lib/types/transformation";
import { TransformationEditor } from "./transformation-editor";

type ColumnMappingData = {
  sourceColumn: string;
  targetColumn: string;
  sourceDataType: string;
  targetDataType: string;
  transformation: TransformationConfig | null;
  confidence?: number;
};

type TableMappingData = {
  sourceTable: string;
  targetTable: string;
  columnMappings: ColumnMappingData[];
};

type ColumnMappingProps = {
  sourceSchema: TableSchema[];
  targetSchema: TableSchema[];
  tableMappings: Array<{ sourceTable: string; targetTable: string }>;
  mappings: TableMappingData[];
  onMappingsChange: (mappings: TableMappingData[]) => void;
};

export const ColumnMapping = ({
  sourceSchema,
  targetSchema,
  tableMappings,
  mappings,
  onMappingsChange,
}: ColumnMappingProps) => {
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);
  const [selectedSourceColumn, setSelectedSourceColumn] = useState<string | null>(null);
  const [selectedTargetColumn, setSelectedTargetColumn] = useState<string | null>(null);

  const currentTableMapping = tableMappings[selectedTableIndex];
  if (!currentTableMapping) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No table mappings configured. Go back to select tables.</p>
      </div>
    );
  }

  const getQualifiedName = (table: TableSchema) => 
    table.schema ? `${table.schema}.${table.name}` : table.name;

  const sourceTable = sourceSchema.find(
    (t) => getQualifiedName(t) === currentTableMapping.sourceTable
  );
  const targetTable = targetSchema.find(
    (t) => getQualifiedName(t) === currentTableMapping.targetTable
  );

  if (!sourceTable || !targetTable) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: Could not find source or target table schema.</p>
      </div>
    );
  }

  const currentMapping = mappings.find(
    (m) =>
      m.sourceTable === currentTableMapping.sourceTable &&
      m.targetTable === currentTableMapping.targetTable
  );

  const columnMappings = currentMapping?.columnMappings || [];

  const handleRemoveMapping = (columnIndex: number) => {
    const updatedMappings = [...mappings];
    const tableIndex = updatedMappings.findIndex(
      (m) =>
        m.sourceTable === currentTableMapping.sourceTable &&
        m.targetTable === currentTableMapping.targetTable
    );

    if (tableIndex >= 0) {
      updatedMappings[tableIndex].columnMappings = updatedMappings[
        tableIndex
      ].columnMappings.filter((_, i) => i !== columnIndex);
      onMappingsChange(updatedMappings);
    }
  };

  const handleUpdateTransformation = (transformation: TransformationConfig | null) => {
    if (selectedColumnIndex === null) return;

    const updatedMappings = [...mappings];
    const tableIndex = updatedMappings.findIndex(
      (m) =>
        m.sourceTable === currentTableMapping.sourceTable &&
        m.targetTable === currentTableMapping.targetTable
    );

    if (tableIndex >= 0) {
      updatedMappings[tableIndex].columnMappings[selectedColumnIndex].transformation =
        transformation;
      onMappingsChange(updatedMappings);
    }

    setTransformDialogOpen(false);
    setSelectedColumnIndex(null);
  };

  const handleAddMapping = () => {
    if (!selectedSourceColumn || !selectedTargetColumn) return;

    const sourceCol = sourceTable!.columns.find((c) => c.name === selectedSourceColumn);
    const targetCol = targetTable!.columns.find((c) => c.name === selectedTargetColumn);

    if (!sourceCol || !targetCol) return;

    const updatedMappings = [...mappings];
    let tableIndex = updatedMappings.findIndex(
      (m) =>
        m.sourceTable === currentTableMapping.sourceTable &&
        m.targetTable === currentTableMapping.targetTable
    );

    if (tableIndex < 0) {
      updatedMappings.push({
        sourceTable: currentTableMapping.sourceTable,
        targetTable: currentTableMapping.targetTable,
        columnMappings: [],
      });
      tableIndex = updatedMappings.length - 1;
    }

    updatedMappings[tableIndex].columnMappings.push({
      sourceColumn: sourceCol.name,
      targetColumn: targetCol.name,
      sourceDataType: sourceCol.dataType,
      targetDataType: targetCol.dataType,
      transformation: null,
    });

    onMappingsChange(updatedMappings);
    setSelectedSourceColumn(null);
    setSelectedTargetColumn(null);
  };

  const getTypeCompatibility = (sourceType: string, targetType: string) => {
    if (sourceType === targetType) return "exact";
    if (
      (sourceType.includes("int") && targetType.includes("int")) ||
      (sourceType.includes("char") && targetType.includes("char"))
    ) {
      return "compatible";
    }
    return "incompatible";
  };

  const mappedSourceColumns = new Set(columnMappings.map((m) => m.sourceColumn));
  const mappedTargetColumns = new Set(columnMappings.map((m) => m.targetColumn));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Map Columns</h2>
        <p className="text-gray-600 mt-1">
          Define how columns from source tables map to target tables. Add transformations as needed.
        </p>
      </div>

      <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">How to map columns:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Select a source column (left side) - it will highlight in cyan</li>
              <li>Select a target column (right side) - it will highlight in teal</li>
              <li>Click the &quot;Map&quot; button that appears between them</li>
              <li>
                Click <Settings className="w-3.5 h-3.5 inline mx-1" />
                <strong>Transform</strong> button to add data transformations (type conversion, SQL
                expressions, etc.)
              </li>
            </ol>
          </div>
        </div>
      </div>

      {tableMappings.length > 1 && (
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Table Mapping
          </label>
          <div className="flex gap-2 flex-wrap">
            {tableMappings.map((mapping, index) => (
              <Button
                key={`${mapping.sourceTable}-${mapping.targetTable}`}
                variant={index === selectedTableIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTableIndex(index)}
                className={cn(
                  index === selectedTableIndex &&
                    "bg-[#06B6D4] hover:bg-[#0891b2] text-white"
                )}
              >
                {mapping.sourceTable} → {mapping.targetTable}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentTableMapping.sourceTable} → {currentTableMapping.targetTable}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {sourceTable.columns.length} source columns • {targetTable.columns.length} target
              columns
            </p>
          </div>
          <Badge variant="outline" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20">
            {columnMappings.length} mapped
          </Badge>
        </div>

        {columnMappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No column mappings yet. Use the section below to map columns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">
                    Source Column
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">→</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">
                    Target Column
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">
                    Transformation
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {columnMappings.map((mapping, index) => {
                  const compatibility = getTypeCompatibility(
                    mapping.sourceDataType,
                    mapping.targetDataType
                  );

                  return (
                    <tr key={`${mapping.sourceColumn}-${index}`} className="hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-mono text-sm">{mapping.sourceColumn}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {mapping.sourceDataType}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm">{mapping.targetColumn}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {mapping.targetDataType}
                        </Badge>
                        {compatibility === "incompatible" && (
                          <AlertCircle className="w-4 h-4 text-amber-500 inline ml-1" />
                        )}
                      </td>
                      <td className="p-3">
                        {mapping.transformation ? (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            {mapping.transformation.type}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No transformation</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedColumnIndex(index);
                              setTransformDialogOpen(true);
                            }}
                            className="gap-1.5 hover:border-[#06B6D4] hover:text-[#06B6D4]"
                            title="Add/Edit Transformation"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-xs">Transform</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMapping(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove Mapping"
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Create New Column Mapping</h3>

        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Column ({sourceTable.columns.length - mappedSourceColumns.size} available)
            </label>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {sourceTable.columns
                .filter((col) => !mappedSourceColumns.has(col.name))
                .map((col) => (
                  <div
                    key={col.name}
                    onClick={() => setSelectedSourceColumn(col.name)}
                    className={cn(
                      "p-3 border-b last:border-0 cursor-pointer transition-colors",
                      selectedSourceColumn === col.name
                        ? "bg-[#06B6D4]/10 border-l-4 border-l-[#06B6D4]"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{col.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {col.dataType}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 gap-2">
            <ArrowRight className="w-6 h-6 text-gray-400" />
            {selectedSourceColumn && selectedTargetColumn && (
              <Button
                onClick={handleAddMapping}
                size="sm"
                className="bg-[#06B6D4] hover:bg-[#0891b2] text-white mt-2"
              >
                Map
              </Button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Column ({targetTable.columns.length - mappedTargetColumns.size} available)
            </label>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {targetTable.columns
                .filter((col) => !mappedTargetColumns.has(col.name))
                .map((col) => (
                  <div
                    key={col.name}
                    onClick={() => setSelectedTargetColumn(col.name)}
                    className={cn(
                      "p-3 border-b last:border-0 cursor-pointer transition-colors",
                      selectedTargetColumn === col.name
                        ? "bg-[#32DBBC]/10 border-l-4 border-l-[#32DBBC]"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{col.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {col.dataType}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Auto-Map Columns
          </Button>
        </div>
      </div>

      <Dialog open={transformDialogOpen} onOpenChange={setTransformDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Transformation</DialogTitle>
          </DialogHeader>
          {selectedColumnIndex !== null && (
            <TransformationEditor
              columnMapping={columnMappings[selectedColumnIndex]}
              onSave={handleUpdateTransformation}
              onCancel={() => {
                setTransformDialogOpen(false);
                setSelectedColumnIndex(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

