"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, Loader2, GitBranch, Database, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

type DAGNode = {
  id: string;
  label: string;
  type: "source" | "transform" | "validate" | "load" | "complete";
  status?: "pending" | "active" | "complete";
};

type PreviewValidateProps = {
  projectName: string;
  onLoadPreview: () => Promise<PreviewData[]>;
};

export const PreviewValidate = ({ projectName, onLoadPreview }: PreviewValidateProps) => {
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState<PreviewData[]>([]);
  const [selectedTable, setSelectedTable] = useState(0);

  useEffect(() => {
    loadPreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreviews = async () => {
    setLoading(true);
    try {
      const data = await onLoadPreview();
      setPreviews(data);
    } catch (error) {
      console.error("Failed to load previews:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate DAG structure
  const dagNodes: DAGNode[] = [
    { id: "extract", label: "Extract Data", type: "source", status: "pending" },
    { id: "transform", label: "Transform & Map", type: "transform", status: "pending" },
    { id: "validate", label: "Validate Data", type: "validate", status: "pending" },
    { id: "load", label: "Load to Target", type: "load", status: "pending" },
    { id: "complete", label: "Complete", type: "complete", status: "pending" },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#06B6D4] mx-auto mb-4" />
          <p className="text-gray-600">Loading migration preview...</p>
        </div>
      </div>
    );
  }

  if (previews.length === 0) {
    return (
      <>
        <div className="flex-shrink-0 border-b bg-white px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900">Preview & Validate</h2>
          <p className="text-gray-600 mt-1">Review sample data and validation warnings</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">No preview data available. Please configure mappings first.</p>
          </div>
        </div>
      </>
    );
  }

  const currentPreview = previews[selectedTable];
  const totalRows = previews.reduce((sum, p) => sum + p.estimatedRows, 0);
  const totalWarnings = previews.reduce((sum, p) => sum + p.warnings.length, 0);

  return (
    <>
      {/* Content Header */}
      <div className="flex-shrink-0 border-b bg-white px-8 py-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preview & Validate Migration</h2>
          <p className="text-gray-600 mt-1">
            Review sample data, transformations, Airflow DAG structure, and validation warnings
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tables to Migrate</p>
                <p className="text-2xl font-bold text-gray-900">{previews.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Rows</p>
                <p className="text-2xl font-bold text-gray-900">{totalRows.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
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
          </Card>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-6xl">
          <Tabs defaultValue="dag" className="w-full">
            <TabsList>
              <TabsTrigger value="dag">DAG Structure</TabsTrigger>
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
              <TabsTrigger value="comparison">Before & After</TabsTrigger>
            </TabsList>

            {/* DAG Structure Tab */}
            <TabsContent value="dag" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#06B6D4]/10 rounded-lg">
                    <GitBranch className="w-5 h-5 text-[#06B6D4]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Airflow DAG Pipeline</h3>
                    <p className="text-sm text-gray-600">
                      Visualization of your data pipeline workflow
                    </p>
                  </div>
                </div>

                {/* DAG Visualization */}
                <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
                  <div className="flex flex-col items-center gap-6">
                    {dagNodes.map((node, index) => (
                      <div key={node.id} className="flex flex-col items-center w-full max-w-md">
                        <div
                          className={cn(
                            "w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all",
                            "bg-white border-gray-300 hover:border-[#06B6D4] hover:shadow-md"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              "bg-gray-100"
                            )}
                          >
                            {node.type === "source" && <Database className="w-5 h-5 text-blue-600" />}
                            {node.type === "transform" && <Zap className="w-5 h-5 text-purple-600" />}
                            {node.type === "validate" && <CheckCircle className="w-5 h-5 text-orange-600" />}
                            {node.type === "load" && <Database className="w-5 h-5 text-green-600" />}
                            {node.type === "complete" && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{node.label}</p>
                            <p className="text-xs text-gray-500">
                              {node.type === "source" && `Extract from ${previews.length} source ${previews.length === 1 ? "table" : "tables"}`}
                              {node.type === "transform" && `Apply transformations and mappings`}
                              {node.type === "validate" && `Validate data types and constraints`}
                              {node.type === "load" && `Load to ${previews.length} target ${previews.length === 1 ? "table" : "tables"}`}
                              {node.type === "complete" && `Migration complete`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Task {index + 1}
                          </Badge>
                        </div>
                        {index < dagNodes.length - 1 && (
                          <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">About this DAG:</p>
                      <p className="text-gray-600">
                        This pipeline will be deployed to Airflow as <span className="font-mono text-[#06B6D4]">{projectName.toLowerCase().replace(/\s+/g, "_")}_dag</span>.
                        Each task will execute sequentially with automatic retry logic and monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Data Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              {previews.length > 1 && (
                <Card className="p-4">
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
                          <Badge className="ml-2 bg-amber-500 text-white text-xs">
                            {preview.warnings.length}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6">
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

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {currentPreview.sampleData.transformed[0] &&
                          Object.keys(currentPreview.sampleData.transformed[0]).map((key) => (
                            <th key={key} className="text-left p-3 font-semibold text-gray-700">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentPreview.sampleData.transformed.slice(0, 10).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, vIndex) => (
                            <td key={vIndex} className="p-3 font-mono text-xs">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 text-center mt-3">
                  Showing first 10 rows of {currentPreview.estimatedRows.toLocaleString()} total
                </p>
              </Card>
            </TabsContent>

            {/* Before & After Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              <Card className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Source (Before)
                    </h4>
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
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-600" />
                      Target (After)
                    </h4>
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
                <p className="text-xs text-gray-600 text-center mt-4">
                  Showing first 5 rows of {currentPreview.estimatedRows.toLocaleString()} total
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="flex-shrink-0 border-t bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <Button variant="outline">Back</Button>

          <div className="flex gap-3">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
              Continue to Review & Deploy
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

