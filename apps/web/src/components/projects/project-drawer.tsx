"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useProject } from "@/context/project-context";
import { ProjectDetailsView } from "./project-details-view";
import { ProjectEditForm } from "./project-edit-form";

export const ProjectDrawer = (): JSX.Element => {
  const { isDrawerOpen, closeDrawer, drawerMode } = useProject();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="w-[90%] sm:max-w-[700px] p-0 overflow-y-auto">
        {drawerMode === "details" ? (
          <ProjectDetailsView />
        ) : (
          <ProjectEditForm />
        )}
      </SheetContent>
    </Sheet>
  );
};

