"use client";

import { useState } from "react";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { TableSchema } from "@/lib/types/schema";

type TableSelectionProps = {
  sourceTables: TableSchema[];
  targetTables: TableSchema[];
  selectedMappings: Array<{ sourceTable: string; targetTable: string; confidence?: number }>;
  onMappingsChange: (
    mappings: Array<{ sourceTable: string; targetTable: string; confidence?: number }>
  ) => void;
};

export const TableSelection = ({
  sourceTables,
  targetTables,
  selectedMappings,
  onMappingsChange,
}: TableSelectionProps) => {
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const filteredSource = sourceTables.filter((t) =>
    t.name.toLowerCase().includes(sourceFilter.toLowerCase())
  );

  const filteredTarget = targetTables.filter((t) =>
    t.name.toLowerCase().includes(targetFilter.toLowerCase())
  );

  const handleMapTables = () => {
    if (!selectedSource || selectedTargets.length === 0) return;

    const newMappings = selectedTargets
      .filter((targetTable) => {
        const exists = selectedMappings.find(
          (m) => m.sourceTable === selectedSource && m.targetTable === targetTable
        );
        return !exists;
      })
      .map((targetTable) => ({
        sourceTable: selectedSource,
        targetTable,
      }));

    if (newMappings.length > 0) {
      onMappingsChange([...selectedMappings, ...newMappings]);
    }

    setSelectedSource(null);
    setSelectedTargets([]);
  };

  const handleToggleTargetSelection = (tableName: string) => {
    if (selectedTargets.includes(tableName)) {
      setSelectedTargets(selectedTargets.filter((t) => t !== tableName));
    } else {
      setSelectedTargets([...selectedTargets, tableName]);
    }
  };

  const handleRemoveMapping = (index: number) => {
    onMappingsChange(selectedMappings.filter((_, i) => i !== index));
  };

  const isMapped = (tableName: string, type: "source" | "target") => {
    return selectedMappings.some((m) =>
      type === "source" ? m.sourceTable === tableName : m.targetTable === tableName
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Tables to Migrate</h2>
        <p className="text-gray-600 mt-1">
          Choose source tables and map them to one or more target tables. One source table can map
          to multiple target tables for data breakout scenarios.
        </p>
      </div>

      <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">How to map tables:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Select a source table from the left side</li>
              <li>Select one or more target tables from the right side (checkboxes will appear)</li>
              <li>Click &quot;Map Selected Tables&quot; to create the mappings</li>
              <li>Repeat for additional source tables</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Current Mappings</h3>
          <Badge variant="outline" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20">
            {selectedMappings.length} {selectedMappings.length === 1 ? "table" : "tables"} mapped
          </Badge>
        </div>

        {selectedMappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No table mappings yet. Select tables below to create mappings.
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const groupedMappings = selectedMappings.reduce(
                (acc, mapping, index) => {
                  if (!acc[mapping.sourceTable]) {
                    acc[mapping.sourceTable] = [];
                  }
                  acc[mapping.sourceTable].push({ ...mapping, originalIndex: index });
                  return acc;
                },
                {} as Record<string, Array<typeof selectedMappings[0] & { originalIndex: number }>>
              );

              return Object.entries(groupedMappings).map(([sourceTable, targets]) => (
                <div key={sourceTable} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-sm font-semibold text-gray-700 mt-1">
                      {sourceTable}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      {targets.map((target) => (
                        <div
                          key={`${sourceTable}-${target.targetTable}-${target.originalIndex}`}
                          className="flex items-center justify-between bg-white rounded px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-700">
                              {target.targetTable}
                            </span>
                            {target.confidence && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 text-xs"
                              >
                                {Math.round(target.confidence * 100)}% match
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMapping(target.originalIndex)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 mb-2">Source Tables</h3>
            <Input
              placeholder="Filter tables..."
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            />
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredSource.map((table) => {
              const qualifiedName = table.schema ? `${table.schema}.${table.name}` : table.name;
              const mapped = isMapped(qualifiedName, "source");
              const isSelected = selectedSource === qualifiedName;

              return (
                <button
                  key={table.name}
                  onClick={() => setSelectedSource(qualifiedName)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border-2 transition-all",
                    isSelected && "border-[#06B6D4] bg-[#06B6D4]/5",
                    !isSelected && mapped && "border-green-200 bg-green-50",
                    !isSelected && !mapped && "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mapped && <Check className="w-4 h-4 text-green-600" />}
                      <div className="flex flex-col">
                        {table.schema && (
                          <span className="text-xs text-gray-500">{table.schema}</span>
                        )}
                        <span className="font-mono text-sm">{table.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{table.columns.length} cols</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Target Tables</h3>
              {selectedSource && selectedTargets.length > 0 && (
                <Badge className="bg-[#32DBBC]/10 text-[#32DBBC] border-[#32DBBC]/20">
                  {selectedTargets.length} selected
                </Badge>
              )}
            </div>
            <Input
              placeholder="Filter tables..."
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
            />
            {selectedSource && (
              <p className="text-xs text-gray-600 mt-2">
                Select multiple target tables for <strong className="font-mono">{selectedSource}</strong>
              </p>
            )}
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredTarget.map((table) => {
              const qualifiedName = table.schema ? `${table.schema}.${table.name}` : table.name;
              const mapped = isMapped(qualifiedName, "target");
              const isSelected = selectedTargets.includes(qualifiedName);

              return (
                <button
                  key={table.name}
                  onClick={() => handleToggleTargetSelection(qualifiedName)}
                  disabled={!selectedSource}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border-2 transition-all",
                    !selectedSource && "opacity-50 cursor-not-allowed",
                    isSelected && "border-[#32DBBC] bg-[#32DBBC]/5",
                    !isSelected && mapped && "border-green-200 bg-green-50",
                    !isSelected && !mapped && "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSource && (
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-[#32DBBC] border-[#32DBBC]"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      {!selectedSource && mapped && <Check className="w-4 h-4 text-green-600" />}
                      <div className="flex flex-col">
                        {table.schema && (
                          <span className="text-xs text-gray-500">{table.schema}</span>
                        )}
                        <span className="font-mono text-sm">{table.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{table.columns.length} cols</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={handleMapTables}
          disabled={!selectedSource || selectedTargets.length === 0}
          className="bg-[#06B6D4] hover:bg-[#0891b2] text-white"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          {selectedTargets.length > 0
            ? `Map to ${selectedTargets.length} Target ${selectedTargets.length === 1 ? "Table" : "Tables"}`
            : "Map Selected Tables"}
        </Button>

        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Auto-Map All Tables
        </Button>
      </div>
    </div>
  );
};



