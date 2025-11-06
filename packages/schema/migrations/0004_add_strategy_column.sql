-- Add strategy column to mapping_projects table
ALTER TABLE "mapping_projects" ADD COLUMN IF NOT EXISTS "strategy" text DEFAULT 'single';

