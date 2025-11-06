"use client";

import { Database, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConnection } from "@/context/connection-context";
import { fetchUserConnections } from "@/lib/actions/connections";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";

type Connection = {
  id: string;
  name: string;
  type: string;
  dbType: string;
  host: string;
  port: number;
  database: string;
  isActive: boolean | null;
};

export const ConnectionsList = (): JSX.Element => {
  const { openCreateDrawer, openDetailsDrawer } = useConnection();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConnections = async (): Promise<void> => {
      const result = await fetchUserConnections(TEMP_USER_ID);
      if (result.success && result.data) {
        setConnections(result.data);
      }
      setIsLoading(false);
    };
    loadConnections();
  }, []);

  const activeCount = connections.filter((c) => c.isActive).length;
  const dbTypes = new Set(connections.map((c) => c.dbType)).size;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Database Connections
            </h1>
            <p className="text-gray-600 mt-3">
              Manage your source and target database connections
            </p>
          </div>
          <Skeleton className="h-10 w-[160px]" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-l-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[100px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader variant="gray">
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-[180px] mb-2" />
                      <Skeleton className="h-4 w-[140px]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-[60px] rounded-full" />
                    <Skeleton className="h-6 w-[50px] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Database Connections
          </h1>
          <p className="text-gray-600 mt-3">
            Manage your source and target database connections
          </p>
        </div>
        <Button
          onClick={openCreateDrawer}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Connection
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Connections
            </CardTitle>
            <Database className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {connections.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {connections.length === 0
                ? "No connections yet"
                : "Total connections"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Active
            </CardTitle>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {activeCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active connections</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Database Types
            </CardTitle>
            <Database className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{dbTypes}</div>
            <p className="text-xs text-gray-500 mt-1">
              Different database types
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader variant="gray">
          <CardTitle variant="small">All Connections</CardTitle>
          <CardDescription>
            View and manage all your database connections
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first database connection to start migrating data.
                Connections can be to SQL Server, PostgreSQL, MySQL, or other
                supported databases.
              </p>
              <Button
                onClick={openCreateDrawer}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  onClick={() => openDetailsDrawer(conn)}
                  className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-base">
                        {conn.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {conn.dbType} • {conn.host}:{conn.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={conn.type === "source" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {conn.type}
                    </Badge>
                    {conn.isActive && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
