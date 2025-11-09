import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "DataBridge",
    template: "%s | DataBridge",
  },
  description: "Manage your data migrations and mappings",
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={
          user
            ? {
                name: user.name,
                email: user.email,
              }
            : undefined
        }
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
