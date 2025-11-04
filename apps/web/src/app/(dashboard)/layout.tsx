import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Dashboard - DataBridge",
  description: "Manage your data migrations and mappings",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

