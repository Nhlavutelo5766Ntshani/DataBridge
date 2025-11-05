"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useConnection } from "@/context/connection-context";
import { ConnectionCreateForm } from "./connection-create-form";
import { ConnectionDetailsView } from "./connection-details-view";

export const ConnectionDrawer = (): JSX.Element => {
  const { isDrawerOpen, closeDrawer, drawerMode } = useConnection();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="w-[90%] sm:max-w-[700px] p-0 overflow-y-auto">
        {drawerMode === "details" ? (
          <ConnectionDetailsView />
        ) : (
          <ConnectionCreateForm />
        )}
      </SheetContent>
    </Sheet>
  );
};
