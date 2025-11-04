"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATHS } from "@/lib/constants/paths";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/lib/actions/auth";

type SidebarProps = {
  user?: {
    name: string;
    email: string;
  };
};

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
];

export const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
  };

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
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
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

      {/* User & Logout Section with Dropdown */}
      <div className="border-t p-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 hover:bg-accent rounded-lg p-2 transition-colors cursor-pointer w-full text-left",
                  isCollapsed && "justify-center"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center space-x-3 hover:bg-destructive/10 rounded-lg p-2 transition-colors cursor-pointer w-full text-left",
              isCollapsed && "justify-center"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">Log out</p>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

