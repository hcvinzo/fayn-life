-- Add practice status field to practices table
-- This migration adds status management for practices

-- Create practice status enum
CREATE TYPE practice_status AS ENUM ('active', 'suspended', 'inactive');

-- Add status column to practices table
ALTER TABLE practices
ADD COLUMN status practice_status NOT NULL DEFAULT 'active';

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_practices_status ON practices(status);

-- Update RLS policies to include status checks (admins can see all, practitioners can only see active)
-- Note: Existing RLS policies will continue to work, this is just for future reference
