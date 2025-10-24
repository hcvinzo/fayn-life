-- Migration: Create files table for polymorphic file attachments
-- Description: Stores file metadata for any entity type (sessions, clients, etc.)
-- Created: 2025-10-24

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- e.g., 'client_sessions', 'clients', etc.
  entity_id UUID NOT NULL, -- The ID of the related entity
  bucket_name TEXT NOT NULL DEFAULT 'session-files',
  file_path TEXT NOT NULL, -- Path in the storage bucket
  file_name TEXT NOT NULL, -- Original file name
  file_type TEXT NOT NULL, -- MIME type
  file_size BIGINT NOT NULL, -- File size in bytes
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Indexes for fast lookups
  CONSTRAINT files_entity_check CHECK (entity_type IN ('client_sessions', 'clients', 'appointments', 'profiles'))
);

-- Create indexes
CREATE INDEX idx_files_practice_id ON files(practice_id);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files table
-- Users can only access files from their practice
CREATE POLICY "Users can view files from their practice"
  ON files FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files to their practice"
  ON files FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete files from their practice"
  ON files FOR DELETE
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_updated_at_trigger
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_files_updated_at();

-- Comments
COMMENT ON TABLE files IS 'Polymorphic file attachments for any entity in the system';
COMMENT ON COLUMN files.entity_type IS 'The table name of the entity (e.g., client_sessions)';
COMMENT ON COLUMN files.entity_id IS 'The UUID of the entity record';
COMMENT ON COLUMN files.bucket_name IS 'The Supabase storage bucket name';
COMMENT ON COLUMN files.file_path IS 'The full path to the file in the storage bucket';
