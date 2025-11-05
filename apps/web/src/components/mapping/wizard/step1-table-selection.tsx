"use client";

import { useState } from "react";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
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

  const handleSourceSelect = (tableName: string) => {
    setSelectedSource(tableName);
    setSelectedTargets([]);
  };

  const handleTargetToggle = (tableName: string) => {
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
    <>
      {/* Content Header - Fixed */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Select Tables to Migrate</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose source tables and map them to one or more target tables. One source table can map
            to multiple target tables for data breakout scenarios.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg border p-3 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Current Mappings</h3>
            <Badge variant="outline" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20 text-xs">
              {selectedMappings.length} {selectedMappings.length === 1 ? "table" : "tables"} mapped
            </Badge>
          </div>

          {selectedMappings.length === 0 ? (
            <div className="text-center py-3 text-gray-500 text-xs">
              No table mappings yet. Select tables below to create mappings.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
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
                  <div key={sourceTable} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-sm font-semibold text-gray-700 mt-1">
                        {sourceTable}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        {targets.map((target) => (
                          <div
                            key={`${sourceTable}-${target.targetTable}-${target.originalIndex}`}
                            className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
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
      </div>

      {/* Scrollable Table Panels - Takes remaining space */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Source Tables</h3>
              <Input
                placeholder="Filter tables..."
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
            {filteredSource.map((table) => {
              const qualifiedName = table.schema ? `${table.schema}.${table.name}` : table.name;
              const mapped = isMapped(qualifiedName, "source");
              const isSelected = selectedSource === qualifiedName;

              return (
                <button
                  key={qualifiedName}
                  onClick={() => handleSourceSelect(qualifiedName)}
                  className={cn(
                    "flex items-center justify-between w-full p-2 rounded border transition-all text-sm",
                    isSelected
                      ? "border-[#06B6D4] bg-[#06B6D4]/5 shadow-sm"
                      : mapped
                      ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  )}
                  disabled={mapped}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && <CheckCircle className="w-4 h-4 text-[#06B6D4]" />}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-sm">{table.name}</p>
                      {table.schema && (
                        <p className="text-xs text-gray-500">{table.schema}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{table.columns.length} cols</span>
                </button>
              );
            })}
          </div>
        </div>

            <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
              <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Target Tables</h3>
                  {selectedSource && selectedTargets.length > 0 && (
                    <Badge className="bg-[#32DBBC]/10 text-[#32DBBC] border-[#32DBBC]/20 text-xs">
                      {selectedTargets.length} selected
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="Filter tables..."
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  className="h-8 text-sm"
                />
                {selectedSource && (
                  <p className="text-xs text-gray-600 mt-1.5">
                    Select multiple target tables for <strong className="font-mono text-xs">{selectedSource}</strong>
                  </p>
                )}
              </div>

              <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
            {filteredTarget.map((table) => {
              const qualifiedName = table.schema ? `${table.schema}.${table.name}` : table.name;
              const mapped = isMapped(qualifiedName, "target");
              const isSelected = selectedTargets.includes(qualifiedName);

              return (
                <button
                  key={qualifiedName}
                  onClick={() => handleTargetToggle(qualifiedName)}
                  className={cn(
                    "flex items-center justify-between w-full p-2 rounded border transition-all text-sm",
                    isSelected
                      ? "border-[#32DBBC] bg-[#32DBBC]/5 shadow-sm"
                      : mapped
                      ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:bg-gray-50",
                    !selectedSource && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!selectedSource || mapped}
                >
                  <div className="flex items-center gap-2">
                    {selectedSource && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTargetToggle(qualifiedName)}
                        className="form-checkbox h-3.5 w-3.5 text-[#32DBBC] rounded border-gray-300 focus:ring-[#32DBBC]"
                      />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-sm">{table.name}</p>
                      {table.schema && (
                        <p className="text-xs text-gray-500">{table.schema}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{table.columns.length} cols</span>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons at Bottom */}
      <div className="flex-shrink-0 border-t bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9">
              Cancel
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Sparkles className="w-4 h-4" />
              Auto-Map All Tables
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleMapTables}
              disabled={!selectedSource || selectedTargets.length === 0}
              size="sm"
              className="bg-[#06B6D4] hover:bg-[#0891b2] text-white h-9"
            >
              Map Selected Tables
            </Button>

            <Button size="sm" className="bg-[#06B6D4] hover:bg-[#0891b2] text-white h-9">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};



