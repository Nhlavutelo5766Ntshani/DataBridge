"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileCode } from "lucide-react";
import { generateProjectDAG } from "@/lib/actions/airflow-dag";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type GenerateDAGButtonProps = {
  projectId: string;
  projectName: string;
  hasPipelines: boolean;
};

export const GenerateDAGButton = ({
  projectId,
  projectName,
  hasPipelines,
}: GenerateDAGButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!hasPipelines) {
      toast.error("Please add at least one pipeline before generating a DAG");
      return;
    }

    setIsGenerating(true);
    toast.loading("Generating Airflow DAG...");

    try {
      const result = await generateProjectDAG(projectId);

      if (!result.success || !result.data) {
        toast.dismiss();
        toast.error(result.error || "Failed to generate DAG");
        return;
      }

      const zip = new JSZip();
      const dagFolder = zip.folder("airflow-dag");

      if (dagFolder) {
        dagFolder.file(result.data.dagFile.name, result.data.dagFile.content);
        dagFolder.file(result.data.readmeFile.name, result.data.readmeFile.content);
        dagFolder.file(result.data.requirementsFile.name, result.data.requirementsFile.content);
        dagFolder.file(result.data.dockerComposeFile.name, result.data.dockerComposeFile.content);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const fileName = `${projectName.replace(/\s+/g, "_")}_airflow_dag.zip`;
      
      saveAs(content, fileName);

      toast.dismiss();
      toast.success("Airflow DAG generated successfully!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate DAG files");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || !hasPipelines}
      variant="outline"
    >
      {isGenerating ? (
        <>
          <FileCode className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Generate Airflow DAG
        </>
      )}
    </Button>
  );
};

