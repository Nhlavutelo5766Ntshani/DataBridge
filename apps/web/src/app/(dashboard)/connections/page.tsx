import { Database, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PATHS } from "@/lib/constants/paths";
import { fetchUserConnections } from "@/lib/actions/connections";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";
import { Badge } from "@/components/ui/badge";

const ConnectionsPage = async () => {
  const result = await fetchUserConnections(TEMP_USER_ID);
  const connections = result.success && result.data ? result.data : [];
  
  const activeCount = connections.filter(c => c.isActive).length;
  const dbTypes = new Set(connections.map(c => c.dbType)).size;

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Database Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your source and target database connections
          </p>
        </div>
        <Link href={PATHS.DASHBOARD.CONNECTIONS_NEW}>
          <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Connection
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Connections
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {connections.length === 0 ? "No connections yet" : "Total connections"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active connections
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Database Types
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbTypes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different database types
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Connections</CardTitle>
          <CardDescription>
            View and manage all your database connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first database connection to start migrating data.
                Connections can be to SQL Server, PostgreSQL, MySQL, or other
                supported databases.
              </p>
              <Link href={PATHS.DASHBOARD.CONNECTIONS_NEW}>
                <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Connection
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Database className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{conn.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {conn.dbType} • {conn.host}:{conn.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={conn.type === "source" ? "default" : "secondary"}>
                      {conn.type}
                    </Badge>
                    {conn.isActive && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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

export default ConnectionsPage;

