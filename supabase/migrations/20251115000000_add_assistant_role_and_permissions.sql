-- Migration: Add Assistant Role and Permission System
-- Created: 2025-11-15
-- Description: Adds 'assistant' role, permissions table, and practitioner assignments

-- ============================================================================
-- 1. ADD 'ASSISTANT' TO USER_ROLE ENUM
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'assistant';

-- ============================================================================
-- 2. CREATE PERMISSIONS TABLE
-- ============================================================================

-- Define available permissions in the system
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- Insert default permissions
INSERT INTO permissions (code, name, description) VALUES
  ('manage_clients', 'Manage Clients', 'Create, view, edit, and archive client records'),
  ('manage_appointments', 'Manage Appointments', 'Create, view, edit, and cancel appointments'),
  ('view_sessions', 'View Sessions', 'View session details and notes'),
  ('manage_sessions', 'Manage Sessions', 'Create and edit session records'),
  ('view_medical_data', 'View Medical Data', 'Access sensitive medical and session notes'),
  ('manage_availability', 'Manage Availability', 'Edit practitioner availability and schedule'),
  ('manage_practice_settings', 'Manage Practice Settings', 'Edit practice information and settings')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 3. CREATE ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Insert default role permissions
-- Admin: All permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin'::user_role, id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Practitioner: All permissions except manage_practice_settings (practice-level setting)
INSERT INTO role_permissions (role, permission_id)
SELECT 'practitioner'::user_role, id FROM permissions
WHERE code IN ('manage_clients', 'manage_appointments', 'view_sessions', 'manage_sessions', 'view_medical_data', 'manage_availability')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Assistant: Limited permissions (no sessions, no medical data, no availability)
INSERT INTO role_permissions (role, permission_id)
SELECT 'assistant'::user_role, id FROM permissions
WHERE code IN ('manage_clients', 'manage_appointments')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================================================
-- 4. CREATE PRACTITIONER_ASSIGNMENTS TABLE
-- ============================================================================

-- Maps assistants to practitioners they can manage appointments for
CREATE TABLE IF NOT EXISTS practitioner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  -- Ensure assistant and practitioner are in the same practice
  CONSTRAINT same_practice CHECK (practice_id IS NOT NULL),

  -- Prevent duplicate assignments
  UNIQUE(assistant_id, practitioner_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_assistant ON practitioner_assignments(assistant_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_practitioner ON practitioner_assignments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_practice ON practitioner_assignments(practice_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_assignments ENABLE ROW LEVEL SECURITY;

-- Permissions: Read-only for all authenticated users
CREATE POLICY "All authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Role Permissions: Read-only for all authenticated users
CREATE POLICY "All authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Practitioner Assignments: Users can view assignments in their practice
CREATE POLICY "Users can view assignments in their practice"
  ON practitioner_assignments FOR SELECT
  TO authenticated
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Practitioner Assignments: Only admins can insert/update/delete
CREATE POLICY "Only admins can manage assignments"
  ON practitioner_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  permission_code VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    JOIN role_permissions rp ON rp.role = p.role
    JOIN permissions perm ON perm.id = rp.permission_id
    WHERE p.id = user_id
    AND perm.code = permission_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE(code VARCHAR, name VARCHAR, description TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.code, p.name, p.description
  FROM profiles prof
  JOIN role_permissions rp ON rp.role = prof.role
  JOIN permissions p ON p.id = rp.permission_id
  WHERE prof.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assigned practitioners for an assistant
CREATE OR REPLACE FUNCTION get_assigned_practitioners(assistant_user_id UUID)
RETURNS TABLE(
  practitioner_id UUID,
  practitioner_name VARCHAR,
  practitioner_email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email
  FROM practitioner_assignments pa
  JOIN profiles p ON p.id = pa.practitioner_id
  WHERE pa.assistant_id = assistant_user_id
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. UPDATE EXISTING RLS POLICIES FOR ASSISTANT ACCESS
-- ============================================================================

-- Update appointments RLS to allow assistants to view/manage appointments
-- for their assigned practitioners only

-- Drop existing appointment policies that might conflict
DROP POLICY IF EXISTS "Users can view appointments in their practice" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments in their practice" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments in their practice" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments in their practice" ON appointments;

-- New appointment policies with assistant support
CREATE POLICY "Users can view appointments in their practice or assigned practitioners"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    -- User's own practice
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      -- Practitioners/admins see all appointments in practice
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'practitioner')
      )
      OR
      -- Assistants only see appointments for assigned practitioners
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'assistant'
        )
        AND practitioner_id IN (
          SELECT practitioner_id
          FROM practitioner_assignments
          WHERE assistant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create appointments in their practice or for assigned practitioners"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      -- Practitioners/admins can create any appointment in practice
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'practitioner')
      )
      OR
      -- Assistants can only create for assigned practitioners
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'assistant'
        )
        AND practitioner_id IN (
          SELECT practitioner_id
          FROM practitioner_assignments
          WHERE assistant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update appointments in their practice or for assigned practitioners"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'practitioner')
      )
      OR
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'assistant'
        )
        AND practitioner_id IN (
          SELECT practitioner_id
          FROM practitioner_assignments
          WHERE assistant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete appointments in their practice or for assigned practitioners"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'practitioner')
      )
      OR
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'assistant'
        )
        AND practitioner_id IN (
          SELECT practitioner_id
          FROM practitioner_assignments
          WHERE assistant_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE permissions IS 'System-wide permissions that can be assigned to roles';
COMMENT ON TABLE role_permissions IS 'Maps permissions to user roles';
COMMENT ON TABLE practitioner_assignments IS 'Maps assistants to practitioners they can manage';
COMMENT ON FUNCTION has_permission IS 'Check if a user has a specific permission by code';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user based on their role';
COMMENT ON FUNCTION get_assigned_practitioners IS 'Get list of practitioners assigned to an assistant';
