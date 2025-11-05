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
ALTER TABLE "mapping_projects" ADD COLUMN "schedule_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "mapping_projects" ADD COLUMN "schedule_cron" varchar(100);--> statement-breakpoint
ALTER TABLE "mapping_projects" ADD COLUMN "schedule_interval" integer;--> statement-breakpoint
ALTER TABLE "mapping_projects" ADD COLUMN "last_execution_time" timestamp;--> statement-breakpoint
ALTER TABLE "mapping_projects" ADD COLUMN "etl_config" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_execution" ON "attachment_migrations" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_project" ON "attachment_migrations" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_status" ON "attachment_migrations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_validations_execution" ON "data_validations" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_validations_project" ON "data_validations" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_validations_status" ON "data_validations" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_etl_stages_execution" ON "etl_execution_stages" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_etl_stages_project" ON "etl_execution_stages" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_etl_stages_status" ON "etl_execution_stages" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_migration_reports_execution" ON "migration_reports" ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_migration_reports_project" ON "migration_reports" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_migration_reports_created" ON "migration_reports" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mapping_projects_schedule_enabled_idx" ON "mapping_projects" ("schedule_enabled");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachment_migrations" ADD CONSTRAINT "attachment_migrations_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "migration_reports" ADD CONSTRAINT "migration_reports_project_id_mapping_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "mapping_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
