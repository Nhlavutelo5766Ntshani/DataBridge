import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/auth/supabase-server";
import { getUserByEmail } from "@/db/queries/users";

export const metadata: Metadata = {
  title: {
    default: "DataBridge",
    template: "%s | DataBridge",
  },
  description: "Manage your data migrations and mappings",
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  let user = null;
  if (authUser) {
    const dbUser = await getUserByEmail(authUser.email || "");
    user = {
      name: authUser.user_metadata?.name || dbUser?.name || "",
      email: authUser.email || "",
    };
  }

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
