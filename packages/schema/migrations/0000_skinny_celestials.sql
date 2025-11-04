CREATE TABLE IF NOT EXISTS "column_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_mapping_id" uuid NOT NULL,
	"source_column" text NOT NULL,
	"target_column" text NOT NULL,
	"source_data_type" text NOT NULL,
	"target_data_type" text NOT NULL,
	"transformation_id" uuid,
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
CREATE TABLE IF NOT EXISTS "mapping_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_connection_id" uuid,
	"target_connection_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
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
CREATE TABLE IF NOT EXISTS "table_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"source_table" text NOT NULL,
	"target_table" text NOT NULL,
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
CREATE INDEX IF NOT EXISTS "column_mappings_table_mapping_id_idx" ON "column_mappings" ("table_mapping_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_user_id_idx" ON "connections" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_type_idx" ON "connections" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mapping_projects_user_id_idx" ON "mapping_projects" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mapping_projects_status_idx" ON "mapping_projects" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "migration_executions_project_id_idx" ON "migration_executions" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "migration_executions_status_idx" ON "migration_executions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "table_mappings_project_id_idx" ON "table_mappings" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transformations_type_idx" ON "transformations" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transformations_category_idx" ON "transformations" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "validation_reports_execution_id_idx" ON "validation_reports" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "validation_reports_status_idx" ON "validation_reports" ("status");--> statement-breakpoint
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
 ALTER TABLE "table_mappings" ADD CONSTRAINT "table_mappings_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
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
