-- Create client_sessions table
-- Migration: Add client sessions for tracking appointment sessions with notes and attachments

-- Session status enum
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'cancelled');

-- Client sessions table
CREATE TABLE IF NOT EXISTS client_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  end_time TIMESTAMP WITH TIME ZONE,

  -- Session data
  status session_status NOT NULL DEFAULT 'in_progress',
  notes TEXT,

  -- File attachments (stored as JSON array of file metadata)
  -- Each attachment: { id, name, url, type, size, uploaded_at }
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Constraints
  CONSTRAINT unique_appointment_session UNIQUE (appointment_id),
  CONSTRAINT valid_end_time CHECK (end_time IS NULL OR end_time >= start_time)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_practice_id ON client_sessions(practice_id);
CREATE INDEX IF NOT EXISTS idx_sessions_appointment_id ON client_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_practitioner_id ON client_sessions(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON client_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON client_sessions(start_time);

-- Add updated_at trigger
CREATE TRIGGER update_client_sessions_updated_at
  BEFORE UPDATE ON client_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_sessions
CREATE POLICY "Users can view sessions in their practice"
  ON client_sessions FOR SELECT
  USING (practice_id IN (SELECT practice_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create sessions in their practice"
  ON client_sessions FOR INSERT
  WITH CHECK (practice_id IN (SELECT practice_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update sessions in their practice"
  ON client_sessions FOR UPDATE
  USING (practice_id IN (SELECT practice_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete sessions in their practice"
  ON client_sessions FOR DELETE
  USING (practice_id IN (SELECT practice_id FROM profiles WHERE id = auth.uid()));

-- Add comment
COMMENT ON TABLE client_sessions IS 'Tracks client sessions associated with appointments, including notes and file attachments';
COMMENT ON COLUMN client_sessions.attachments IS 'JSONB array of file metadata: [{ id, name, url, type, size, uploaded_at }]';
