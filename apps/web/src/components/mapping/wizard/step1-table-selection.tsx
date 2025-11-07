"use client";

import { MappingDetailsDrawer } from "@/components/mapping/mapping-details-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapping } from "@/context/mapping-context";
import type { TableSchema } from "@/lib/types/schema";
import { cn } from "@/lib/utils/cn";
import { ArrowRight, CheckCircle, Download, Sparkles } from "lucide-react";
import { useState } from "react";

type TableSelectionProps = {
  sourceTables: TableSchema[];
  targetTables: TableSchema[];
  selectedMappings: Array<{
    sourceTable: string;
    targetTable: string;
    confidence?: number;
  }>;
  onMappingsChange: (
    mappings: Array<{
      sourceTable: string;
      targetTable: string;
      confidence?: number;
    }>
  ) => void;
};

export const TableSelection = ({
  sourceTables,
  targetTables,
  selectedMappings,
  onMappingsChange,
}: TableSelectionProps) => {
  const {
    openMappingDetails,
    isDrawerOpen,
    selectedMapping,
    sourceSchema,
    targetSchemas,
    closeDrawer,
  } = useMapping();
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
          (m) =>
            m.sourceTable === selectedSource && m.targetTable === targetTable
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
      type === "source"
        ? m.sourceTable === tableName
        : m.targetTable === tableName
    );
  };

  const handleViewMapping = (
    sourceTable: string,
    targetTableNames: string[]
  ) => {
    const source = sourceTables.find(
      (t) => (t.schema ? `${t.schema}.${t.name}` : t.name) === sourceTable
    );
    const targets = targetTableNames
      .map((targetName) =>
        targetTables.find(
          (t) => (t.schema ? `${t.schema}.${t.name}` : t.name) === targetName
        )
      )
      .filter((t): t is TableSchema => t !== undefined);

    openMappingDetails(
      { sourceTable, targetTables: targetTableNames },
      source || null,
      targets
    );
  };

  const handleExportMappings = () => {
    const dataStr = JSON.stringify(selectedMappings, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;
    const exportFileDefaultName = "table-mappings.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Select Tables to Migrate
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Choose source tables and map them to one or more target tables. One
            source table can map to multiple target tables for data breakout
            scenarios.
          </p>
        </div>
      </div>

      {/* Scrollable Three-Panel Content Area */}
      <div className="flex-1 min-h-0 overflow-visible px-6 py-4">
        {/* Use full available height from parent flex container to avoid clipping */}
        <div className="grid grid-cols-3 gap-4 h-full min-h-0">
          {/* Source Tables Panel */}
          <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Source Tables
              </h3>
              <Input
                placeholder="Filter tables..."
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 scrollbar-visible">
              {filteredSource.map((table) => {
                const qualifiedName = table.schema
                  ? `${table.schema}.${table.name}`
                  : table.name;
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {table.name}
                        </p>
                        {table.schema && (
                          <p className="text-xs text-gray-500 truncate">
                            {table.schema}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {table.columns.length} cols
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Tables Panel */}
          <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Target Tables
                </h3>
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
                  Select multiple target tables for{" "}
                  <strong className="font-mono text-xs">
                    {selectedSource}
                  </strong>
                </p>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 scrollbar-visible">
              {filteredTarget.map((table) => {
                const qualifiedName = table.schema
                  ? `${table.schema}.${table.name}`
                  : table.name;
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {selectedSource && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTargetToggle(qualifiedName)}
                          className="form-checkbox h-3.5 w-3.5 text-[#32DBBC] rounded border-gray-300 focus:ring-[#32DBBC] flex-shrink-0"
                        />
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {table.name}
                        </p>
                        {table.schema && (
                          <p className="text-xs text-gray-500 truncate">
                            {table.schema}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {table.columns.length} cols
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Mappings Panel */}
          <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Current Mappings
                </h3>
                <div className="flex items-center gap-2">
                  {selectedMappings.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportMappings}
                      className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20 text-xs"
                  >
                    {selectedMappings.length}{" "}
                    {selectedMappings.length === 1 ? "mapping" : "mappings"}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Click a mapping to view details
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-2 scrollbar-visible">
              {selectedMappings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    No mappings yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Select tables to create mappings
                  </p>
                </div>
              ) : (
                (() => {
                  const groupedMappings = selectedMappings.reduce(
                    (acc, mapping, index) => {
                      if (!acc[mapping.sourceTable]) {
                        acc[mapping.sourceTable] = [];
                      }
                      acc[mapping.sourceTable].push({
                        ...mapping,
                        originalIndex: index,
                      });
                      return acc;
                    },
                    {} as Record<
                      string,
                      Array<
                        (typeof selectedMappings)[0] & { originalIndex: number }
                      >
                    >
                  );

                  return Object.entries(groupedMappings).map(
                    ([sourceTable, targets]) => (
                      <div
                        key={sourceTable}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                        onClick={() =>
                          handleViewMapping(
                            sourceTable,
                            targets.map((t) => t.targetTable)
                          )
                        }
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded">
                              <CheckCircle className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="font-mono text-xs font-semibold text-gray-900">
                              {sourceTable}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pl-6">
                            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">
                              {targets.length} target{" "}
                              {targets.length === 1 ? "table" : "tables"}
                            </span>
                          </div>

                          <div className="pl-6 space-y-1.5">
                            {targets.map((target) => (
                              <div
                                key={`${sourceTable}-${target.targetTable}-${target.originalIndex}`}
                                className="flex items-center justify-between bg-white rounded px-2 py-1.5 border border-gray-200"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="font-mono text-xs text-gray-700 truncate">
                                    {target.targetTable}
                                  </span>
                                  {target.confidence && (
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs flex-shrink-0"
                                    >
                                      {Math.round(target.confidence * 100)}%
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveMapping(target.originalIndex)
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-6 px-2 flex-shrink-0"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  );
                })()
              )}
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

            <Button
              size="sm"
              className="bg-[#06B6D4] hover:bg-[#0891b2] text-white h-9"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Mapping Details Drawer */}
      <MappingDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        mapping={selectedMapping}
        sourceSchema={sourceSchema}
        targetSchemas={targetSchemas}
        onRemove={() => {
          if (selectedMapping) {
            const indicesToRemove = selectedMappings
              .map((m, idx) =>
                m.sourceTable === selectedMapping.sourceTable ? idx : -1
              )
              .filter((idx) => idx !== -1);
            onMappingsChange(
              selectedMappings.filter(
                (_, idx) => !indicesToRemove.includes(idx)
              )
            );
            closeDrawer();
          }
        }}
        onExport={handleExportMappings}
      />
    </div>
  );
};
