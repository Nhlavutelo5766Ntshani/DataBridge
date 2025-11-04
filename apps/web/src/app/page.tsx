import { ArrowRight, Database, GitBranch, Shield, Zap } from "lucide-react";
import Link from "next/link";

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DataBridge</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Visual Data Migration Made{" "}
              <span className="text-primary">Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              DataBridge is Integrove's internal platform for seamless SQL
              Server to PostgreSQL data migrations. Map, transform, and migrate
              your data with confidence.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Start Migrating
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="text-sm font-semibold leading-6 text-foreground"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for data migration
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful features designed for enterprise-grade data migrations
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <GitBranch className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Visual Mapping</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag-and-drop interface to map source and target schemas
                  visually
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Transformations</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Built-in and custom transformations for data type conversion
                  and cleaning
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Validation</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pre and post-migration validation with detailed reconciliation
                  reports
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Database className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Real-time Monitoring
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track migration progress with real-time status updates and
                  logs
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2025 Integrove. All rights reserved.</p>
          <p>DataBridge - Internal Use Only</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

