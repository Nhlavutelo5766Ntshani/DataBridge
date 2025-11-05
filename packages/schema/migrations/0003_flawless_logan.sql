CREATE TABLE IF NOT EXISTS "airflow_dag_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_execution_id" uuid NOT NULL,
	"dag_id" text NOT NULL,
	"dag_run_id" text NOT NULL,
	"airflow_execution_date" timestamp NOT NULL,
	"airflow_state" text,
	"airflow_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipeline_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"project_execution_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"records_processed" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"pipeline_order" integer DEFAULT 1 NOT NULL,
	"source_connection_id" uuid,
	"target_connection_id" uuid,
	"depends_on_pipeline_id" uuid,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"triggered_by" text DEFAULT 'manual',
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cron_expression" text NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"enabled" boolean DEFAULT true,
	"last_run" timestamp,
	"next_run" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
ALTER TABLE "table_mappings" ADD COLUMN IF NOT EXISTS "pipeline_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;--> statement-breakpoint
UPDATE "users" SET "password_hash" = '' WHERE "password_hash" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airflow_dag_runs_project_execution_id_idx" ON "airflow_dag_runs" ("project_execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airflow_dag_runs_dag_id_idx" ON "airflow_dag_runs" ("dag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_executions_pipeline_id_idx" ON "pipeline_executions" ("pipeline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_executions_project_execution_id_idx" ON "pipeline_executions" ("project_execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_executions_status_idx" ON "pipeline_executions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipelines_project_id_idx" ON "pipelines" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipelines_depends_on_idx" ON "pipelines" ("depends_on_pipeline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_executions_project_id_idx" ON "project_executions" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_executions_status_idx" ON "project_executions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_executions_started_at_idx" ON "project_executions" ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_project_id_idx" ON "schedules" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_enabled_idx" ON "schedules" ("enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_next_run_idx" ON "schedules" ("next_run");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "table_mappings" ADD CONSTRAINT "table_mappings_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airflow_dag_runs" ADD CONSTRAINT "airflow_dag_runs_project_execution_id_project_executions_id_fk" FOREIGN KEY ("project_execution_id") REFERENCES "project_executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipeline_executions" ADD CONSTRAINT "pipeline_executions_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipeline_executions" ADD CONSTRAINT "pipeline_executions_project_execution_id_project_executions_id_fk" FOREIGN KEY ("project_execution_id") REFERENCES "project_executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_source_connection_id_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_target_connection_id_connections_id_fk" FOREIGN KEY ("target_connection_id") REFERENCES "connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_executions" ADD CONSTRAINT "project_executions_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
