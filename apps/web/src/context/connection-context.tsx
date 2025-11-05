"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type Connection = {
  id: number;
  name: string;
  type: string;
  dbType: string;
  host: string;
  port: number;
  database: string;
  isActive: boolean;
};

type DrawerMode = "create" | "details" | "edit";

type ConnectionContextType = {
  isDrawerOpen: boolean;
  drawerMode: DrawerMode;
  selectedConnection: Connection | null;
  openCreateDrawer: () => void;
  openDetailsDrawer: (connection: Connection) => void;
  openEditDrawer: (connection: Connection) => void;
  closeDrawer: () => void;
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
);

export const ConnectionProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);

  const openCreateDrawer = (): void => {
    setDrawerMode("create");
    setSelectedConnection(null);
    setIsDrawerOpen(true);
  };

  const openDetailsDrawer = (connection: Connection): void => {
    setDrawerMode("details");
    setSelectedConnection(connection);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (connection: Connection): void => {
    setDrawerMode("edit");
    setSelectedConnection(connection);
    setIsDrawerOpen(true);
  };

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedConnection(null);
    }, 300);
  };

  return (
    <ConnectionContext.Provider
      value={{
        isDrawerOpen,
        drawerMode,
        selectedConnection,
        openCreateDrawer,
        openDetailsDrawer,
        openEditDrawer,
        closeDrawer,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = (): ConnectionContextType => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return context;
};
