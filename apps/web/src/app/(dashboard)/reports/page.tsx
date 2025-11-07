import { AlertCircle, CheckCircle2, FileText, Download } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllValidationReports } from "@/lib/actions/validation-reports";

const ReportsPage = async () => {
  const reportsResult = await fetchAllValidationReports();
  const reports = reportsResult.success && reportsResult.data ? reportsResult.data : [];

  const totalReports = reports.length;
  const successfulReports = reports.filter((r) => r.status === "passed").length;
  const warningReports = reports.filter((r) => r.status === "warning").length;
  const errorReports = reports.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Migration Reports
          </h1>
          <p className="text-gray-600 mt-3">
            View and download validation and reconciliation reports
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Reports
            </CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalReports}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalReports === 0 ? "No reports generated" : "Total reports"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Successful
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{successfulReports}</div>
            <p className="text-xs text-gray-500 mt-1">Successful validations</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              With Warnings
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{warningReports}</div>
            <p className="text-xs text-gray-500 mt-1">Minor issues found</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              With Errors
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{errorReports}</div>
            <p className="text-xs text-gray-500 mt-1">Critical issues found</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader variant="gray">
          <CardTitle variant="small">All Reports</CardTitle>
          <CardDescription>View and download generated reports</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground max-w-md">
                Reports will be generated after migration executions and
                validations are complete.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {reports.map((report) => {
                const details = report.details as { totalValidations?: number; passed?: number; failed?: number; warnings?: number } | null;
                
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {report.reportType.replace("-", " ").toUpperCase()} Report
                          </h4>
                          <Badge
                            variant={
                              report.status === "passed"
                                ? "default"
                                : report.status === "warning"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Execution: {report.executionId.slice(0, 8)}... •{" "}
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                        {details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {details.totalValidations || 0} validations • {details.passed || 0} passed •{" "}
                            {details.failed || 0} failed • {details.warnings || 0} warnings
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
