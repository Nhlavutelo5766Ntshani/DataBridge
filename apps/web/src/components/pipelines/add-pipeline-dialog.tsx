"use client";

import { useState } from "react";
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
import { addPipeline } from "@/lib/actions/pipelines";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Connection = {
  id: string;
  name: string;
  dbType: string;
};

type AddPipelineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  connections: Connection[];
};

export const AddPipelineDialog = ({
  open,
  onOpenChange,
  projectId,
  connections,
}: AddPipelineDialogProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sourceConnectionId: "",
    targetConnectionId: "",
    pipelineOrder: "1",
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sourceConnectionId || !formData.targetConnectionId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const result = await addPipeline({
      projectId,
      name: formData.name,
      description: formData.description || null,
      sourceConnectionId: formData.sourceConnectionId,
      targetConnectionId: formData.targetConnectionId,
      pipelineOrder: parseInt(formData.pipelineOrder),
      status: formData.status,
      dependsOnPipelineId: null,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Pipeline created successfully");
      setFormData({
        name: "",
        description: "",
        sourceConnectionId: "",
        targetConnectionId: "",
        pipelineOrder: "1",
        status: "draft",
      });
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create pipeline");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Pipeline</DialogTitle>
            <DialogDescription>
              Create a new pipeline for this project. Pipelines are executed in order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Pipeline Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Ingest to Staging"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this pipeline does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourceConnection">
                  Source Connection <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sourceConnectionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sourceConnectionId: value })
                  }
                >
                  <SelectTrigger id="sourceConnection">
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
                <Label htmlFor="targetConnection">
                  Target Connection <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.targetConnectionId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetConnectionId: value })
                  }
                >
                  <SelectTrigger id="targetConnection">
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
                <Label htmlFor="pipelineOrder">
                  Execution Order <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pipelineOrder"
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
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
              {isSubmitting ? "Creating..." : "Create Pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

