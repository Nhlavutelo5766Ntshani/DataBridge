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
CREATE TABLE IF NOT EXISTS "attachment_migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar(255) NOT NULL,
	"project_id" uuid NOT NULL,
	"document_id" varchar(255) NOT NULL,
	"attachment_name" varchar(500) NOT NULL,
	"source_url" text,
	"target_url" text,
	"content_type" varchar(100),
	"size_bytes" bigint,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"migrated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_attachment_migration" UNIQUE("execution_id","document_id","attachment_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "column_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_mapping_id" uuid NOT NULL,
	"source_column" text NOT NULL,
	"target_column" text NOT NULL,
	"source_data_type" text NOT NULL,
	"target_data_type" text NOT NULL,
	"transformation_id" uuid,
	"transformation_config" jsonb,
	"is_nullable" boolean DEFAULT true,
	"default_value" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"db_type" text NOT NULL,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"database" text NOT NULL,
	"username" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_tested_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar(255) NOT NULL,
	"project_id" uuid NOT NULL,
	"table_name" varchar(255) NOT NULL,
	"validation_type" varchar(50) NOT NULL,
	"expected_value" text,
	"actual_value" text,
	"status" varchar(20) NOT NULL,
	"message" text,
	"validated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "etl_execution_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar(255) NOT NULL,
	"project_id" uuid NOT NULL,
	"stage_id" varchar(50) NOT NULL,
	"stage_name" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"duration" integer,
	"records_processed" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_execution_stage" UNIQUE("execution_id","stage_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mapping_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_connection_id" uuid,
	"target_connection_id" uuid,
	"strategy" text DEFAULT 'single',
	"status" text DEFAULT 'draft' NOT NULL,
	"schedule_enabled" boolean DEFAULT false,
	"schedule_cron" varchar(100),
	"schedule_interval" integer,
	"last_execution_time" timestamp,
	"etl_config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "migration_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"executed_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stage" text,
	"total_records" integer,
	"processed_records" integer DEFAULT 0,
	"failed_records" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"logs" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "migration_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar(255) NOT NULL,
	"project_id" uuid NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration_ms" integer NOT NULL,
	"summary" jsonb NOT NULL,
	"stages" jsonb NOT NULL,
	"validations" jsonb NOT NULL,
	"table_details" jsonb NOT NULL,
	"errors" jsonb,
	"warnings" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_execution_id" UNIQUE("execution_id")
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
CREATE TABLE IF NOT EXISTS "table_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"pipeline_id" uuid,
	"source_table" text NOT NULL,
	"target_table" text NOT NULL,
	"mapping_rules" jsonb,
	"mapping_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transformations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_reusable" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'developer' NOT NULL,
	"is_active" boolean DEFAULT true,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "validation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"validation_type" text NOT NULL,
	"status" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airflow_dag_runs_project_execution_id_idx" ON "airflow_dag_runs" ("project_execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airflow_dag_runs_dag_id_idx" ON "airflow_dag_runs" ("dag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_execution" ON "attachment_migrations" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_project" ON "attachment_migrations" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_status" ON "attachment_migrations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "column_mappings_table_mapping_id_idx" ON "column_mappings" ("table_mapping_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_user_id_idx" ON "connections" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_type_idx" ON "connections" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_validations_execution" ON "data_validations" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_validations_project" ON "data_validations" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_validations_status" ON "data_validations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_etl_stages_execution" ON "etl_execution_stages" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_etl_stages_project" ON "etl_execution_stages" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_etl_stages_status" ON "etl_execution_stages" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mapping_projects_user_id_idx" ON "mapping_projects" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mapping_projects_status_idx" ON "mapping_projects" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mapping_projects_schedule_enabled_idx" ON "mapping_projects" ("schedule_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "migration_executions_project_id_idx" ON "migration_executions" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "migration_executions_status_idx" ON "migration_executions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_migration_reports_execution" ON "migration_reports" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_migration_reports_project" ON "migration_reports" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_migration_reports_created" ON "migration_reports" ("created_at");--> statement-breakpoint
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
CREATE INDEX IF NOT EXISTS "table_mappings_project_id_idx" ON "table_mappings" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "table_mappings_pipeline_id_idx" ON "table_mappings" ("pipeline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transformations_type_idx" ON "transformations" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transformations_category_idx" ON "transformations" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "validation_reports_execution_id_idx" ON "validation_reports" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "validation_reports_status_idx" ON "validation_reports" ("status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airflow_dag_runs" ADD CONSTRAINT "airflow_dag_runs_project_execution_id_project_executions_id_fk" FOREIGN KEY ("project_execution_id") REFERENCES "project_executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachment_migrations" ADD CONSTRAINT "attachment_migrations_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "column_mappings" ADD CONSTRAINT "column_mappings_table_mapping_id_table_mappings_id_fk" FOREIGN KEY ("table_mapping_id") REFERENCES "table_mappings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "column_mappings" ADD CONSTRAINT "column_mappings_transformation_id_transformations_id_fk" FOREIGN KEY ("transformation_id") REFERENCES "transformations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_validations" ADD CONSTRAINT "data_validations_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "etl_execution_stages" ADD CONSTRAINT "etl_execution_stages_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mapping_projects" ADD CONSTRAINT "mapping_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mapping_projects" ADD CONSTRAINT "mapping_projects_source_connection_id_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "connections"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mapping_projects" ADD CONSTRAINT "mapping_projects_target_connection_id_connections_id_fk" FOREIGN KEY ("target_connection_id") REFERENCES "connections"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "migration_executions" ADD CONSTRAINT "migration_executions_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "migration_executions" ADD CONSTRAINT "migration_executions_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "migration_reports" ADD CONSTRAINT "migration_reports_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "table_mappings" ADD CONSTRAINT "table_mappings_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "table_mappings" ADD CONSTRAINT "table_mappings_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transformations" ADD CONSTRAINT "transformations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "validation_reports" ADD CONSTRAINT "validation_reports_execution_id_migration_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "migration_executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
