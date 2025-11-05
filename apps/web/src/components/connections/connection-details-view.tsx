"use client";

import { Database, Edit, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConnection } from "@/context/connection-context";

export const ConnectionDetailsView = (): JSX.Element => {
  const { selectedConnection, closeDrawer, openEditDrawer } = useConnection();

  if (!selectedConnection) {
    return <div>No connection selected</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">
              {selectedConnection.name}
            </h2>
            <p className="text-sm text-gray-600">Connection Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDrawer(selectedConnection)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              selectedConnection.type === "source" ? "default" : "secondary"
            }
          >
            {selectedConnection.type}
          </Badge>
          {selectedConnection.isActive && (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              Active
            </Badge>
          )}
        </div>

        {/* Connection Info */}
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Database Type
            </div>
            <div className="text-sm text-gray-900 mt-1 uppercase">
              {selectedConnection.dbType}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700">Host</div>
            <div className="text-sm text-gray-900 mt-1">
              {selectedConnection.host}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700">Port</div>
            <div className="text-sm text-gray-900 mt-1">
              {selectedConnection.port}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700">Database</div>
            <div className="text-sm text-gray-900 mt-1">
              {selectedConnection.database}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700">
              Connection String
            </div>
            <div className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 p-2 rounded border border-gray-200">
              {selectedConnection.host}:{selectedConnection.port}/
              {selectedConnection.database}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50/80 px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={closeDrawer}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
