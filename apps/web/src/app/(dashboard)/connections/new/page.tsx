"use client";

import { ArrowLeft, Database } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { addConnection } from "@/lib/actions/connections";
import { testDatabaseConnection } from "@/lib/actions/test-connection";
import { useCurrentUser } from "@/hooks/use-current-user";

import { Alert, AlertDescription } from "@/components/ui/alert";
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

const NewConnectionPage = () => {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    connectionType: "source",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    ssl: "false",
    description: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setError("");

    const result = await testDatabaseConnection({
      dbType: formData.type,
      host: formData.host,
      port: parseInt(formData.port),
      database: formData.database,
      username: formData.username,
      password: formData.password,
      sslMode: formData.ssl,
    });

    setIsTesting(false);

    if (result.success) {
      toast.success(result.data?.message || "Connection test successful!");
    } else {
      const errorMessage = Array.isArray(result.error)
        ? result.error.join(", ")
        : result.error || "Connection test failed";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      toast.error("Please log in to continue");
      router.push("/login");
      return;
    }

    setIsLoading(true);

    const result = await addConnection({
      userId,
      name: formData.name,
      type: formData.connectionType,
      dbType: formData.type,
      host: formData.host,
      port: parseInt(formData.port),
      database: formData.database,
      username: formData.username,
      encryptedPassword: formData.password,
      isActive: true,
    });

    setIsLoading(false);

    if (result.success) {
      toast.success("Connection created successfully!");
      router.push(PATHS.DASHBOARD.CONNECTIONS);
    } else {
      let errorMessage = "Failed to create connection. Please check your details and try again.";
      
      if (Array.isArray(result.error)) {
        errorMessage = result.error.join(", ");
      } else if (typeof result.error === "string") {
        if (result.error.includes("foreign key")) {
          errorMessage = "Unable to save connection. Please try logging out and back in.";
        } else if (result.error.includes("unique")) {
          errorMessage = "A connection with this name already exists. Please use a different name.";
        } else if (result.error.includes("connection")) {
          errorMessage = "Could not connect to the database. Please verify your connection details.";
        } else {
          errorMessage = result.error;
        }
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Link href={PATHS.DASHBOARD.CONNECTIONS}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            New Database Connection
          </h1>
          <p className="text-gray-600 mt-1">
            Add a new source or target database connection
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <span>Connection Details</span>
            </CardTitle>
            <CardDescription>
              Enter the connection details for your database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Connection Type */}
              <div className="space-y-2">
                <Label htmlFor="connectionType">Connection Type *</Label>
                <Select
                  value={formData.connectionType}
                  onValueChange={(value) =>
                    handleChange("connectionType", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source">Source (Read From)</SelectItem>
                    <SelectItem value="target">Target (Write To)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Connection Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production PostgreSQL"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Database Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Database Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                    <SelectItem value="couchdb">CouchDB</SelectItem>
                    <SelectItem value="oracle">Oracle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Host and Port */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="host">Host *</Label>
                  <Input
                    id="host"
                    placeholder="localhost or IP address"
                    value={formData.host}
                    onChange={(e) => handleChange("host", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port *</Label>
                  <Input
                    id="port"
                    placeholder="5432"
                    value={formData.port}
                    onChange={(e) => handleChange("port", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Database Name */}
              <div className="space-y-2">
                <Label htmlFor="database">Database Name *</Label>
                <Input
                  id="database"
                  placeholder="database_name"
                  value={formData.database}
                  onChange={(e) => handleChange("database", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* SSL */}
              <div className="space-y-2">
                <Label htmlFor="ssl">SSL Mode</Label>
                <Select
                  value={formData.ssl}
                  onValueChange={(value) => handleChange("ssl", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Disabled</SelectItem>
                    <SelectItem value="true">Required</SelectItem>
                    <SelectItem value="prefer">Prefer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this connection..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isLoading || isTesting}
                >
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                <div className="flex-1" />
                <Link href={PATHS.DASHBOARD.CONNECTIONS}>
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Connection"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewConnectionPage;
