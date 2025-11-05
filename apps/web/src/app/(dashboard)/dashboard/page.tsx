import {
  Activity,
  Database,
  FileText,
  FolderKanban,
  GitBranch,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PATHS } from "@/lib/constants/paths";

type DashboardStats = {
  activeConnections: number;
  totalProjects: number;
  totalMigrations: number;
  totalReports: number;
};

async function getDashboardStats(): Promise<DashboardStats> {
  return {
    activeConnections: 0,
    totalProjects: 0,
    totalMigrations: 0,
    totalReports: 0,
  };
}

const DashboardPage = async () => {
  const stats = await getDashboardStats();

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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview of your data migrations.
          </p>
        </div>
        <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
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
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view details
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href={PATHS.DASHBOARD.CONNECTIONS_NEW}>
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:border-cyan-300 hover:bg-cyan-50/50"
              >
                <Database className="h-6 w-6 text-cyan-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">New Connection</div>
                  <div className="text-xs text-muted-foreground">
                    Add database
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={PATHS.DASHBOARD.PROJECTS_NEW}>
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:border-teal-300 hover:bg-teal-50/50"
              >
                <FolderKanban className="h-6 w-6 text-teal-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">New Project</div>
                  <div className="text-xs text-muted-foreground">
                    Start migration
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={PATHS.DASHBOARD.MIGRATIONS}>
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:border-cyan-300 hover:bg-cyan-50/50"
              >
                <GitBranch className="h-6 w-6 text-cyan-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">View Migrations</div>
                  <div className="text-xs text-muted-foreground">
                    Track progress
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={PATHS.DASHBOARD.REPORTS}>
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:border-teal-300 hover:bg-teal-50/50"
              >
                <FileText className="h-6 w-6 text-teal-600" />
                <div className="text-center">
                  <div className="font-medium text-sm">View Reports</div>
                  <div className="text-xs text-muted-foreground">
                    Analyze results
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Start by creating a database connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {stats.activeConnections === 0
                ? "No connections yet. Create your first database connection to get started."
                : "You're all set! Create a new project to begin your migration."}
            </p>
            <Link
              href={
                stats.activeConnections === 0
                  ? PATHS.DASHBOARD.CONNECTIONS_NEW
                  : PATHS.DASHBOARD.PROJECTS_NEW
              }
            >
              <Button className="bg-gradient-to-r from-primary to-secondary">
                {stats.activeConnections === 0
                  ? "Create Connection"
                  : "Create Project"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

