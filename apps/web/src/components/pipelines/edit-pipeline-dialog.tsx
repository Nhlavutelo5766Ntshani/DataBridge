"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePipelineAction } from "@/lib/actions/pipelines";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

type EditPipelineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  connections: Connection[];
  pipelines: Pipeline[];
  projectId: string;
};

export const EditPipelineDialog = ({
  open,
  onOpenChange,
  pipeline,
  connections,
  pipelines,
}: EditPipelineDialogProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: pipeline.name,
    description: pipeline.description || "",
    sourceConnectionId: pipeline.sourceConnectionId || "",
    targetConnectionId: pipeline.targetConnectionId || "",
    pipelineOrder: pipeline.pipelineOrder.toString(),
    dependsOnPipelineId: pipeline.dependsOnPipelineId || "",
    status: pipeline.status || "draft",
  });

  useEffect(() => {
    setFormData({
      name: pipeline.name,
      description: pipeline.description || "",
      sourceConnectionId: pipeline.sourceConnectionId || "",
      targetConnectionId: pipeline.targetConnectionId || "",
      pipelineOrder: pipeline.pipelineOrder.toString(),
      dependsOnPipelineId: pipeline.dependsOnPipelineId || "",
      status: pipeline.status || "draft",
    });
  }, [pipeline]);

  const availableDependencies = pipelines.filter(
    (p) => p.id !== pipeline.id && p.pipelineOrder < pipeline.pipelineOrder
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sourceConnectionId || !formData.targetConnectionId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const result = await updatePipelineAction({
      id: pipeline.id,
      name: formData.name,
      description: formData.description || null,
      sourceConnectionId: formData.sourceConnectionId,
      targetConnectionId: formData.targetConnectionId,
      pipelineOrder: parseInt(formData.pipelineOrder),
      dependsOnPipelineId: formData.dependsOnPipelineId || null,
      status: formData.status,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Pipeline updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update pipeline");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Pipeline</DialogTitle>
            <DialogDescription>
              Update the pipeline configuration and dependencies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Pipeline Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., Ingest to Staging"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this pipeline does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sourceConnection">
                  Source Connection <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sourceConnectionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sourceConnectionId: value })
                  }
                >
                  <SelectTrigger id="edit-sourceConnection">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.name} ({conn.dbType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetConnection">
                  Target Connection <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.targetConnectionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetConnectionId: value })
                  }
                >
                  <SelectTrigger id="edit-targetConnection">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.name} ({conn.dbType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pipelineOrder">
                  Execution Order <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-pipelineOrder"
                  type="number"
                  min="1"
                  value={formData.pipelineOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, pipelineOrder: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dependsOn">Depends On Pipeline</Label>
              <Select
                value={formData.dependsOnPipelineId}
                onValueChange={(value) =>
                  setFormData({ ...formData, dependsOnPipelineId: value })
                }
              >
                <SelectTrigger id="edit-dependsOn">
                  <SelectValue placeholder="No dependency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No dependency</SelectItem>
                  {availableDependencies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (Order: {p.pipelineOrder})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

