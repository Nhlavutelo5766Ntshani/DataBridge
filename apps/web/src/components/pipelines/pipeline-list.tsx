"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, ArrowRight, Edit, Trash2, Play } from "lucide-react";
import { deletePipelineAction } from "@/lib/actions/pipelines";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditPipelineDialog } from "./edit-pipeline-dialog";

type Connection = {
  id: string;
  name: string;
  dbType: string;
};

type Pipeline = {
  id: string;
  name: string;
  description: string | null;
  pipelineOrder: number;
  sourceConnectionId: string | null;
  targetConnectionId: string | null;
  dependsOnPipelineId: string | null;
  status: string | null;
};

type PipelineListProps = {
  pipelines: Pipeline[];
  connections: Connection[];
  projectId: string;
};

export const PipelineList = ({ pipelines, connections, projectId }: PipelineListProps) => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedPipelines = [...pipelines].sort((a, b) => a.pipelineOrder - b.pipelineOrder);

  const getConnectionName = (connectionId: string | null) => {
    if (!connectionId) return "Not set";
    const connection = connections.find((c) => c.id === connectionId);
    return connection ? connection.name : "Unknown";
  };

  const getDependentPipelineName = (pipelineId: string | null) => {
    if (!pipelineId) return null;
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    return pipeline ? pipeline.name : "Unknown";
  };

  const handleDelete = async () => {
    if (!selectedPipeline) return;

    setIsDeleting(true);
    const result = await deletePipelineAction(selectedPipeline.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Pipeline deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedPipeline(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete pipeline");
    }
  };

  const handleEdit = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {sortedPipelines.map((pipeline, index) => {
          const dependsOnName = getDependentPipelineName(pipeline.dependsOnPipelineId);
          const isLast = index === sortedPipelines.length - 1;

          return (
            <div key={pipeline.id} className="relative">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {pipeline.pipelineOrder}
                        </Badge>
                        <CardTitle>{pipeline.name}</CardTitle>
                        <Badge 
                          variant={
                            pipeline.status === "active" 
                              ? "default" 
                              : pipeline.status === "draft"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {pipeline.status || "draft"}
                        </Badge>
                      </div>
                      {pipeline.description && (
                        <CardDescription>{pipeline.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(pipeline)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Play className="mr-2 h-4 w-4" />
                          Execute
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(pipeline)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Source:</span>
                      <Badge variant="secondary">
                        {getConnectionName(pipeline.sourceConnectionId)}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Target:</span>
                      <Badge variant="secondary">
                        {getConnectionName(pipeline.targetConnectionId)}
                      </Badge>
                    </div>
                    {dependsOnName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Depends on:</span>
                        <Badge variant="outline">{dependsOnName}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!isLast && (
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-px bg-border" />
                    <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedPipeline?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedPipeline && (
        <EditPipelineDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          pipeline={selectedPipeline}
          connections={connections}
          pipelines={pipelines}
          projectId={projectId}
        />
      )}
    </>
  );
};

