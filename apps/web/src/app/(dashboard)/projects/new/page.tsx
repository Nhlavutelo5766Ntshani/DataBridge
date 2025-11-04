"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PATHS } from "@/lib/constants/paths";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";
import { fetchUserConnections, type Connection } from "@/lib/actions/connections";
import { addProject } from "@/lib/actions/projects";

const NewProjectPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    strategy: "single" as "single" | "multi-pipeline",
    sourceConnectionId: "",
    targetConnectionId: "",
  });

  useEffect(() => {
    const loadConnections = async () => {
      const result = await fetchUserConnections(TEMP_USER_ID);
      if (result.success && result.data) {
        setConnections(result.data);
      } else {
        toast.error("Failed to load connections");
      }
      setLoadingConnections(false);
    };

    loadConnections();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (formData.strategy === "single") {
      if (!formData.sourceConnectionId) {
        toast.error("Please select a source connection");
        return;
      }

      if (!formData.targetConnectionId) {
        toast.error("Please select a target connection");
        return;
      }

      if (formData.sourceConnectionId === formData.targetConnectionId) {
        toast.error("Source and target connections must be different");
        return;
      }
    }

    setIsLoading(true);

    const result = await addProject({
      userId: TEMP_USER_ID,
      name: formData.name,
      description: formData.description || null,
      strategy: formData.strategy,
      sourceConnectionId: formData.sourceConnectionId || null,
      targetConnectionId: formData.targetConnectionId || null,
      status: "draft",
    });

    setIsLoading(false);

    if (result.success) {
      toast.success("Project created successfully!");
      router.push(PATHS.DASHBOARD.PROJECTS);
    } else {
      const errorMessage = Array.isArray(result.error)
        ? result.error.join(", ")
        : result.error || "Failed to create project";
      toast.error(errorMessage);
    }
  };

  const sourceConnections = connections.filter(c => c.type === "source");
  const targetConnections = connections.filter(c => c.type === "target");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={PATHS.DASHBOARD.PROJECTS}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            New Migration Project
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new data migration project
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Configure your migration project settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Database Migration"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this migration project..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Migration Strategy *</Label>
              <Select
                value={formData.strategy}
                onValueChange={(value) =>
                  handleChange("strategy", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Single Pipeline</span>
                      <span className="text-xs text-muted-foreground">
                        Direct migration from source to target
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="multi-pipeline">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Multi-Pipeline</span>
                      <span className="text-xs text-muted-foreground">
                        Staging → Production workflow with transformations
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.strategy === "multi-pipeline" && (
                <p className="text-xs text-muted-foreground mt-2">
                  You'll configure individual pipelines after creating the project
                </p>
              )}
            </div>

            {formData.strategy === "single" && (
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">Source Connection *</Label>
                <Select
                  value={formData.sourceConnectionId}
                  onValueChange={(value) =>
                    handleChange("sourceConnectionId", value)
                  }
                  disabled={isLoading || loadingConnections}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source database" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceConnections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No source connections available
                      </div>
                    ) : (
                      sourceConnections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name} ({conn.dbType})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Connection *</Label>
                <Select
                  value={formData.targetConnectionId}
                  onValueChange={(value) =>
                    handleChange("targetConnectionId", value)
                  }
                  disabled={isLoading || loadingConnections}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target database" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetConnections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No target connections available
                      </div>
                    ) : (
                      targetConnections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name} ({conn.dbType})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}

            {formData.strategy === "single" && (sourceConnections.length === 0 || targetConnections.length === 0) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  You need at least one source and one target connection to create a project.{" "}
                  <Link
                    href={PATHS.DASHBOARD.CONNECTIONS_NEW}
                    className="underline font-medium"
                  >
                    Create connections
                  </Link>
                </p>
              </div>
            )}

            {formData.strategy === "multi-pipeline" && (
              <div className="p-4 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Multi-Pipeline Strategy:</strong> After creating the project, you'll be able to add multiple pipelines (e.g., Source → Staging, Staging → Production) with custom transformations for each stage.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Link href={PATHS.DASHBOARD.PROJECTS}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (formData.strategy === "single" && 
                    (sourceConnections.length === 0 || targetConnections.length === 0))
                }
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewProjectPage;

