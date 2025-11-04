"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";

type PreviewData = {
  tableName: string;
  sourceTable: string;
  targetTable: string;
  estimatedRows: number;
  sampleData: {
    source: Record<string, unknown>[];
    transformed: Record<string, unknown>[];
  };
  warnings: string[];
};

type MigrationPreviewProps = {
  onLoadPreview: () => Promise<PreviewData[]>;
  onValidationComplete: (isValid: boolean) => void;
};

export const MigrationPreview = ({
  onLoadPreview,
  onValidationComplete,
}: MigrationPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState<PreviewData[]>([]);
  const [selectedTable, setSelectedTable] = useState(0);

  useEffect(() => {
    loadPreviews();
  }, []);

  const loadPreviews = async () => {
    setLoading(true);
    try {
      const data = await onLoadPreview();
      setPreviews(data);
      onValidationComplete(data.length > 0);
    } catch (error) {
      console.error("Failed to load previews:", error);
      onValidationComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
        <span className="ml-3 text-gray-600">Loading migration preview...</span>
      </div>
    );
  }

  if (previews.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">No preview data available. Please configure mappings first.</p>
      </div>
    );
  }

  const currentPreview = previews[selectedTable];
  const totalRows = previews.reduce((sum, p) => sum + p.estimatedRows, 0);
  const totalWarnings = previews.reduce((sum, p) => sum + p.warnings.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Preview & Validate Migration</h2>
        <p className="text-gray-600 mt-1">
          Review sample data, transformations, and validation warnings before executing the
          migration.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tables to Migrate</p>
              <p className="text-2xl font-bold text-gray-900">{previews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Rows</p>
              <p className="text-2xl font-bold text-gray-900">{totalRows.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                totalWarnings > 0 ? "bg-amber-100" : "bg-green-100"
              )}
            >
              <AlertCircle
                className={cn("w-6 h-6", totalWarnings > 0 ? "text-amber-600" : "text-green-600")}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">{totalWarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {previews.length > 1 && (
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Table to Preview
          </label>
          <div className="flex gap-2 flex-wrap">
            {previews.map((preview, index) => (
              <Button
                key={preview.tableName}
                variant={index === selectedTable ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTable(index)}
                className={cn(
                  index === selectedTable && "bg-[#06B6D4] hover:bg-[#0891b2] text-white"
                )}
              >
                {preview.sourceTable} → {preview.targetTable}
                {preview.warnings.length > 0 && (
                  <Badge className="ml-2 bg-amber-500 text-white">{preview.warnings.length}</Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentPreview.sourceTable} → {currentPreview.targetTable}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Estimated {currentPreview.estimatedRows.toLocaleString()} rows •{" "}
              {currentPreview.warnings.length} warnings
            </p>
          </div>
        </div>

        {currentPreview.warnings.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-2">Validation Warnings</h4>
                <ul className="space-y-1">
                  {currentPreview.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-800">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList>
            <TabsTrigger value="comparison">Before & After</TabsTrigger>
            <TabsTrigger value="source">Source Data</TabsTrigger>
            <TabsTrigger value="transformed">Transformed Data</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Source (Before)</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {currentPreview.sampleData.source[0] &&
                          Object.keys(currentPreview.sampleData.source[0]).map((key) => (
                            <th key={key} className="text-left p-2 font-semibold text-gray-700">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentPreview.sampleData.source.slice(0, 5).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, vIndex) => (
                            <td key={vIndex} className="p-2 font-mono text-xs">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Target (After)</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {currentPreview.sampleData.transformed[0] &&
                          Object.keys(currentPreview.sampleData.transformed[0]).map((key) => (
                            <th key={key} className="text-left p-2 font-semibold text-gray-700">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentPreview.sampleData.transformed.slice(0, 5).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, vIndex) => (
                            <td key={vIndex} className="p-2 font-mono text-xs">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Showing first 5 rows of {currentPreview.estimatedRows.toLocaleString()} total
            </p>
          </TabsContent>

          <TabsContent value="source">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {currentPreview.sampleData.source[0] &&
                      Object.keys(currentPreview.sampleData.source[0]).map((key) => (
                        <th key={key} className="text-left p-2 font-semibold text-gray-700">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentPreview.sampleData.source.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value, vIndex) => (
                        <td key={vIndex} className="p-2 font-mono text-xs">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              Showing first 10 rows of {currentPreview.estimatedRows.toLocaleString()} total
            </p>
          </TabsContent>

          <TabsContent value="transformed">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {currentPreview.sampleData.transformed[0] &&
                      Object.keys(currentPreview.sampleData.transformed[0]).map((key) => (
                        <th key={key} className="text-left p-2 font-semibold text-gray-700">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentPreview.sampleData.transformed.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value, vIndex) => (
                        <td key={vIndex} className="p-2 font-mono text-xs">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              Showing first 10 rows of {currentPreview.estimatedRows.toLocaleString()} total
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

