"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Eye, Trash2 } from "lucide-react";

type MappingCardProps = {
  sourceTable: string;
  targetTables: string[];
  confidence?: number;
  onView: () => void;
  onRemove: () => void;
};

export const MappingCard = ({
  sourceTable,
  targetTables,
  confidence,
  onView,
  onRemove,
}: MappingCardProps) => {
  return (
    <div
      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="space-y-2">
        {/* Source Table Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <Database className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-mono text-xs font-semibold text-gray-900">
            {sourceTable}
          </span>
          {confidence && (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs ml-auto"
            >
              {Math.round(confidence * 100)}% match
            </Badge>
          )}
        </div>

        {/* Target Count */}
        <div className="flex items-center gap-2 pl-6">
          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600">
            {targetTables.length} target{" "}
            {targetTables.length === 1 ? "table" : "tables"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pl-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};
