-- Add strategy column to mapping_projects table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mapping_projects' 
    AND column_name = 'strategy'
  ) THEN
    ALTER TABLE "mapping_projects" ADD COLUMN "strategy" text DEFAULT 'single';
  END IF;
END $$;

