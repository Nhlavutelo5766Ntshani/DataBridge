"use client";

import {
  Activity,
  Database,
  FileText,
  FolderKanban,
  GitBranch,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectionDrawer } from "@/components/connections/connection-drawer";
import { ConnectionProvider, useConnection } from "@/context/connection-context";
import { fetchUserConnections } from "@/lib/actions/connections";
import { fetchUserProjects } from "@/lib/actions/projects";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";
import { PATHS } from "@/lib/constants/paths";

type DashboardStats = {
  activeConnections: number;
  totalProjects: number;
  totalMigrations: number;
  totalReports: number;
};

const DashboardContent = () => {
  const { openCreateDrawer } = useConnection();
  const [stats, setStats] = useState<DashboardStats>({
    activeConnections: 0,
    totalProjects: 0,
    totalMigrations: 0,
    totalReports: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [connectionsRes, projectsRes] = await Promise.all([
          fetchUserConnections(TEMP_USER_ID),
          fetchUserProjects(TEMP_USER_ID),
        ]);

        const activeConnections = connectionsRes.success && connectionsRes.data
          ? connectionsRes.data.filter((c) => c.isActive).length
          : 0;

        const totalProjects = projectsRes.success && projectsRes.data
          ? projectsRes.data.length
          : 0;

        setStats({
          activeConnections,
          totalProjects,
          totalMigrations: 0,
          totalReports: 0,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };
    loadStats();
  }, []);

  const statsConfig = [
    {
      title: "Active Connections",
      value: stats.activeConnections,
      icon: Database,
      href: PATHS.DASHBOARD.CONNECTIONS,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      href: PATHS.DASHBOARD.PROJECTS,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Migrations",
      value: stats.totalMigrations,
      icon: GitBranch,
      href: PATHS.DASHBOARD.MIGRATIONS,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Reports Generated",
      value: stats.totalReports,
      icon: FileText,
      href: PATHS.DASHBOARD.REPORTS,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-3">
            Welcome back! Here&apos;s an overview of your data migrations.
          </p>
        </div>
        <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to view details
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader variant="gray">
          <CardTitle variant="small">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="w-full h-auto p-5 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={openCreateDrawer}
            >
              <Database className="h-7 w-7 text-primary" />
              <div className="text-center">
                <div className="font-medium text-sm text-gray-900">
                  New Connection
                </div>
                <div className="text-xs text-gray-500 mt-1">Add database</div>
              </div>
            </Button>

            <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
              <Button
                variant="outline"
                className="w-full h-auto p-5 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <FolderKanban className="h-7 w-7 text-primary" />
                <div className="text-center">
                  <div className="font-medium text-sm text-gray-900">
                    New Project
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Start migration
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={PATHS.DASHBOARD.MIGRATIONS}>
              <Button
                variant="outline"
                className="w-full h-auto p-5 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <GitBranch className="h-7 w-7 text-primary" />
                <div className="text-center">
                  <div className="font-medium text-sm text-gray-900">
                    View Migrations
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Track progress
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={PATHS.DASHBOARD.REPORTS}>
              <Button
                variant="outline"
                className="w-full h-auto p-5 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <FileText className="h-7 w-7 text-primary" />
                <div className="text-center">
                  <div className="font-medium text-sm text-gray-900">
                    View Reports
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Analyze results
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader variant="gray">
          <CardTitle variant="small">Get Started</CardTitle>
          <CardDescription>
            Start by creating a database connection
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {stats.activeConnections === 0
                ? "No connections yet. Create your first database connection to get started."
                : "You're all set! Create a new project to begin your migration."}
            </p>
            {stats.activeConnections === 0 ? (
              <Button 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={openCreateDrawer}
              >
                Create Connection
              </Button>
            ) : (
              <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Create Project
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <ConnectionProvider>
      <DashboardContent />
      <ConnectionDrawer />
    </ConnectionProvider>
  );
};

export default DashboardPage;
