"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { logoutAction } from "@/lib/actions/auth";
import { PATHS } from "@/lib/constants/paths";
import { cn } from "@/lib/utils/cn";

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
      <div className="flex h-16 items-center justify-between border-b px-6">
        {!isCollapsed && (
          <Link href={PATHS.DASHBOARD.HOME} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-primary">
              DataBridge
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 hover:bg-gray-100", isCollapsed && "mx-auto")}
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
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.title}</span>}
                {!isCollapsed && item.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
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
                  "flex items-center gap-3 hover:bg-gray-50 rounded-lg p-3 transition-colors cursor-pointer w-full text-left",
                  isCollapsed && "justify-center p-2"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              side="right" 
              className="w-56"
              sideOffset={8}
            >
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 rounded-lg p-3">
            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">No user</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
