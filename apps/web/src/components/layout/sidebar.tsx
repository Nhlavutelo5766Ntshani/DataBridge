"use client";

import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/constants/paths";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: PATHS.DASHBOARD.HOME,
    icon: LayoutDashboard,
  },
  {
    title: "Connections",
    href: PATHS.DASHBOARD.CONNECTIONS,
    icon: Database,
  },
  {
    title: "Projects",
    href: PATHS.DASHBOARD.PROJECTS,
    icon: FolderKanban,
  },
  {
    title: "Migrations",
    href: PATHS.DASHBOARD.MIGRATIONS,
    icon: GitBranch,
  },
  {
    title: "Reports",
    href: PATHS.DASHBOARD.REPORTS,
    icon: FileText,
  },
  {
    title: "Settings",
    href: PATHS.DASHBOARD.SETTINGS,
    icon: Settings,
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link
            href={PATHS.DASHBOARD.HOME}
            className="flex items-center space-x-2"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-primary">DataBridge</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isCollapsed && "mx-auto")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Section - Authentication pending */}
      <div className="border-t p-4">
        <Link href={PATHS.DASHBOARD.SETTINGS}>
          <div
            className={cn(
              "flex items-center space-x-3 hover:bg-accent rounded-lg p-2 transition-colors cursor-pointer",
              isCollapsed && "justify-center"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-medium">
              <Settings className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Account</p>
                <p className="text-xs text-muted-foreground">View settings</p>
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
};

