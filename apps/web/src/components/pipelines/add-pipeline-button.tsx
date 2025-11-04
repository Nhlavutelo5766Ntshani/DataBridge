"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPipelineDialog } from "./add-pipeline-dialog";

type Connection = {
  id: string;
  name: string;
  dbType: string;
};

type AddPipelineButtonProps = {
  projectId: string;
  connections: Connection[];
};

export const AddPipelineButton = ({ projectId, connections }: AddPipelineButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Pipeline
      </Button>
      <AddPipelineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        connections={connections}
      />
    </>
  );
};

