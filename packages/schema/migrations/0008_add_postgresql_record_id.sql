-- Add postgresql_record_id column to attachment_migrations if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attachment_migrations' 
    AND column_name = 'postgresql_record_id'
  ) THEN
    ALTER TABLE "attachment_migrations" ADD COLUMN "postgresql_record_id" uuid;
  END IF;
END $$;
--> statement-breakpoint
-- Create index on postgresql_record_id if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_attachment_migrations_pg_record" ON "attachment_migrations" ("postgresql_record_id");

