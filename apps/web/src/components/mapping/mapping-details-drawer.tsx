"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { TableSchema } from "@/lib/types/schema";
import { ArrowRight, Database, Download, Edit, Trash2, X } from "lucide-react";

type TableMappingData = {
  sourceTable: string;
  targetTables: string[];
  confidence?: number;
};

type MappingDetailsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  mapping: TableMappingData | null;
  sourceSchema: TableSchema | null;
  targetSchemas: TableSchema[];
  onEdit?: () => void;
  onRemove?: () => void;
  onExport?: () => void;
};

export const MappingDetailsDrawer = ({
  isOpen,
  onClose,
  mapping,
  sourceSchema,
  targetSchemas,
  onEdit,
  onRemove,
  onExport,
}: MappingDetailsDrawerProps) => {
  if (!mapping) return null;

  const totalSourceColumns = sourceSchema?.columns.length || 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90%] sm:max-w-[800px] p-0 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Mapping Details
              </h2>
              <p className="text-sm text-gray-600">
                View and manage table mapping configuration
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Source Columns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalSourceColumns}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available for mapping
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Target Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {mapping.targetTables.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mapped destinations
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {mapping.confidence
                    ? `${Math.round(mapping.confidence * 100)}%`
                    : "N/A"}
                </div>
                <p className="text-xs text-gray-500 mt-1">Match quality</p>
              </CardContent>
            </Card>
          </div>

          {/* Source Table Info */}
          <Card>
            <CardHeader variant="gray">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle variant="small">Source Table</CardTitle>
                  <CardDescription>{mapping.sourceTable}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Source
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Schema:</span>
                  <span className="font-medium font-mono text-gray-900">
                    {sourceSchema?.schema || "default"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Columns:</span>
                  <span className="font-medium text-gray-900">
                    {totalSourceColumns}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Table Type:</span>
                  <Badge variant="outline" className="text-xs">
                    Source
                  </Badge>
                </div>
              </div>

              {/* Column Preview */}
              {sourceSchema && sourceSchema.columns.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Column Preview
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {sourceSchema.columns.slice(0, 10).map((col, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                      >
                        <span className="font-mono text-gray-700">
                          {col.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {col.dataType}
                        </Badge>
                      </div>
                    ))}
                    {sourceSchema.columns.length > 10 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        + {sourceSchema.columns.length - 10} more columns
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Tables */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900">
                Target Tables ({mapping.targetTables.length})
              </h3>
            </div>

            {targetSchemas.map((targetSchema, idx) => (
              <Card key={idx}>
                <CardHeader variant="gray">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle variant="small">Target Table</CardTitle>
                      <CardDescription>{targetSchema.name}</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-secondary/10 text-secondary"
                    >
                      Target
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Schema:</span>
                      <span className="font-medium font-mono text-gray-900">
                        {targetSchema.schema || "default"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Columns:</span>
                      <span className="font-medium text-gray-900">
                        {targetSchema.columns.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Table Type:</span>
                      <Badge variant="outline" className="text-xs">
                        Target
                      </Badge>
                    </div>
                  </div>

                  {/* Column Preview */}
                  {targetSchema.columns.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Column Preview
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                        {targetSchema.columns
                          .slice(0, 10)
                          .map((col, colIdx) => (
                            <div
                              key={colIdx}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                            >
                              <span className="font-mono text-gray-700">
                                {col.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {col.dataType}
                              </Badge>
                            </div>
                          ))}
                        {targetSchema.columns.length > 10 && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            + {targetSchema.columns.length - 10} more columns
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Steps Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Next Step: Column Mapping
                  </h4>
                  <p className="text-xs text-blue-700">
                    Continue to the next step to map individual columns between
                    source and target tables. You can also define
                    transformations and data type conversions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 flex justify-between bg-white sticky bottom-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            {onExport && (
              <Button
                variant="outline"
                onClick={onExport}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            {onRemove && (
              <Button
                variant="outline"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Mapping
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={onEdit}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Mapping
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
