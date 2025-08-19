-- Add name column to assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update the guide delivery to include name in the delivered content
-- This will be used by the PDF generator