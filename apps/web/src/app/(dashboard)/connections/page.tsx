"use client";

import { ConnectionDrawer } from "@/components/connections/connection-drawer";
import { ConnectionsList } from "@/components/connections/connections-list";
import { ConnectionProvider } from "@/context/connection-context";

const ConnectionsPage = (): JSX.Element => {
  return (
    <ConnectionProvider>
      <ConnectionsList />
      <ConnectionDrawer />
    </ConnectionProvider>
  );
};

export default ConnectionsPage;
