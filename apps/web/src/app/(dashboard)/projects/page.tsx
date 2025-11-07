"use client";

import { ProjectDrawer } from "@/components/projects/project-drawer";
import { ProjectsList } from "@/components/projects/projects-list";
import { ProjectProvider } from "@/context/project-context";

const ProjectsPage = (): JSX.Element => {
  return (
    <ProjectProvider>
      <ProjectsList />
      <ProjectDrawer />
    </ProjectProvider>
  );
};

export default ProjectsPage;
