"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  strategy: string | null;
  sourceConnectionId: string | null;
  targetConnectionId: string | null;
  createdAt: Date | null;
  lastExecutionTime: Date | null;
};

type DrawerMode = "details" | "edit";

type ProjectContextType = {
  isDrawerOpen: boolean;
  drawerMode: DrawerMode;
  selectedProject: Project | null;
  openDetailsDrawer: (project: Project) => void;
  openEditDrawer: (project: Project) => void;
  closeDrawer: () => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

export const ProjectProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("details");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const openDetailsDrawer = (project: Project): void => {
    setDrawerMode("details");
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (project: Project): void => {
    setDrawerMode("edit");
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedProject(null);
    }, 300);
  };

  return (
    <ProjectContext.Provider
      value={{
        isDrawerOpen,
        drawerMode,
        selectedProject,
        openDetailsDrawer,
        openEditDrawer,
        closeDrawer,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
};

