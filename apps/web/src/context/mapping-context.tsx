"use client";

import type { TableSchema } from "@/lib/types/schema";
import { createContext, ReactNode, useContext, useState } from "react";

type TableMappingData = {
  sourceTable: string;
  targetTables: string[];
  confidence?: number;
};

type MappingContextType = {
  isDrawerOpen: boolean;
  selectedMapping: TableMappingData | null;
  sourceSchema: TableSchema | null;
  targetSchemas: TableSchema[];
  openMappingDetails: (
    mapping: TableMappingData,
    sourceSchema: TableSchema | null,
    targetSchemas: TableSchema[]
  ) => void;
  closeDrawer: () => void;
};

const MappingContext = createContext<MappingContextType | undefined>(undefined);

type MappingProviderProps = {
  children: ReactNode;
};

export const MappingProvider = ({ children }: MappingProviderProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] =
    useState<TableMappingData | null>(null);
  const [sourceSchema, setSourceSchema] = useState<TableSchema | null>(null);
  const [targetSchemas, setTargetSchemas] = useState<TableSchema[]>([]);

  const openMappingDetails = (
    mapping: TableMappingData,
    source: TableSchema | null,
    targets: TableSchema[]
  ) => {
    setSelectedMapping(mapping);
    setSourceSchema(source);
    setTargetSchemas(targets);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Delay clearing to allow drawer animation to complete
    setTimeout(() => {
      setSelectedMapping(null);
      setSourceSchema(null);
      setTargetSchemas([]);
    }, 300);
  };

  return (
    <MappingContext.Provider
      value={{
        isDrawerOpen,
        selectedMapping,
        sourceSchema,
        targetSchemas,
        openMappingDetails,
        closeDrawer,
      }}
    >
      {children}
    </MappingContext.Provider>
  );
};

export const useMapping = () => {
  const context = useContext(MappingContext);
  if (context === undefined) {
    throw new Error("useMapping must be used within a MappingProvider");
  }
  return context;
};
