-- Practitioner Availability Management System
-- This migration creates tables for managing practitioner schedules and availability

-- =====================================================
-- 1. PRACTITIONER AVAILABILITY (Regular Weekly Schedule)
-- =====================================================

CREATE TABLE IF NOT EXISTS practitioner_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Appointment type this availability applies to
  appointment_type appointment_type NOT NULL,

  -- Working hours for this day
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Active flag (allows temporarily disabling without deleting)
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (end_time > start_time),

  -- Unique constraint: one record per practitioner per day per appointment type
  UNIQUE(practitioner_id, day_of_week, appointment_type)
);

-- =====================================================
-- 2. AVAILABILITY EXCEPTIONS (Time Off & Special Hours)
-- =====================================================

-- Exception types
CREATE TYPE exception_type AS ENUM (
  'time_off',           -- Practitioner unavailable
  'modified_hours',     -- Different hours than usual
  'type_only'           -- Only specific appointment type(s) available
);

CREATE TABLE IF NOT EXISTS availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Exception type
  exception_type exception_type NOT NULL,

  -- Time period for this exception
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,

  -- For 'modified_hours': new working hours
  modified_start_time TIME,
  modified_end_time TIME,

  -- For 'type_only': which appointment type(s) are allowed
  allowed_appointment_types appointment_type[],

  -- Description/notes (e.g., "Vacation", "Conference", "Emergency only")
  description TEXT,

  -- Active flag
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (end_datetime > start_datetime),
  CHECK (
    CASE
      WHEN exception_type = 'modified_hours' THEN modified_start_time IS NOT NULL AND modified_end_time IS NOT NULL
      WHEN exception_type = 'type_only' THEN allowed_appointment_types IS NOT NULL AND array_length(allowed_appointment_types, 1) > 0
      ELSE true
    END
  )
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Practitioner availability indexes
CREATE INDEX idx_practitioner_availability_practitioner ON practitioner_availability(practitioner_id);
CREATE INDEX idx_practitioner_availability_practice ON practitioner_availability(practice_id);
CREATE INDEX idx_practitioner_availability_day ON practitioner_availability(day_of_week);
CREATE INDEX idx_practitioner_availability_type ON practitioner_availability(appointment_type);
CREATE INDEX idx_practitioner_availability_active ON practitioner_availability(is_active);

-- Availability exceptions indexes
CREATE INDEX idx_availability_exceptions_practitioner ON availability_exceptions(practitioner_id);
CREATE INDEX idx_availability_exceptions_practice ON availability_exceptions(practice_id);
CREATE INDEX idx_availability_exceptions_dates ON availability_exceptions(start_datetime, end_datetime);
CREATE INDEX idx_availability_exceptions_active ON availability_exceptions(is_active);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE practitioner_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Practitioner Availability Policies
CREATE POLICY "Users can view availability in their practice"
  ON practitioner_availability
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own availability"
  ON practitioner_availability
  FOR INSERT
  WITH CHECK (
    practitioner_id = auth.uid() AND
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own availability"
  ON practitioner_availability
  FOR UPDATE
  USING (practitioner_id = auth.uid())
  WITH CHECK (practitioner_id = auth.uid());

CREATE POLICY "Users can delete their own availability"
  ON practitioner_availability
  FOR DELETE
  USING (practitioner_id = auth.uid());

-- Availability Exceptions Policies
CREATE POLICY "Users can view exceptions in their practice"
  ON availability_exceptions
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own exceptions"
  ON availability_exceptions
  FOR INSERT
  WITH CHECK (
    practitioner_id = auth.uid() AND
    practice_id IN (
      SELECT practice_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own exceptions"
  ON availability_exceptions
  FOR UPDATE
  USING (practitioner_id = auth.uid())
  WITH CHECK (practitioner_id = auth.uid());

CREATE POLICY "Users can delete their own exceptions"
  ON availability_exceptions
  FOR DELETE
  USING (practitioner_id = auth.uid());

-- =====================================================
-- 5. UPDATED_AT TRIGGERS
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_practitioner_availability_updated_at
  BEFORE UPDATE ON practitioner_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_exceptions_updated_at
  BEFORE UPDATE ON availability_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. HELPER FUNCTION: Get Available Time Slots
-- =====================================================

-- This function checks if a practitioner is available at a given time
-- considering both regular schedule and exceptions
CREATE OR REPLACE FUNCTION is_practitioner_available(
  p_practitioner_id UUID,
  p_appointment_type appointment_type,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_time_only TIME;
  v_has_regular_availability BOOLEAN;
  v_has_blocking_exception BOOLEAN;
  v_exception_record RECORD;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  v_day_of_week := EXTRACT(DOW FROM p_start_datetime);
  v_time_only := p_start_datetime::TIME;

  -- Check for blocking exceptions (time_off)
  SELECT EXISTS(
    SELECT 1 FROM availability_exceptions
    WHERE practitioner_id = p_practitioner_id
      AND is_active = true
      AND exception_type = 'time_off'
      AND start_datetime <= p_start_datetime
      AND end_datetime >= p_end_datetime
  ) INTO v_has_blocking_exception;

  IF v_has_blocking_exception THEN
    RETURN false;
  END IF;

  -- Check for type_only exceptions
  SELECT * INTO v_exception_record
  FROM availability_exceptions
  WHERE practitioner_id = p_practitioner_id
    AND is_active = true
    AND exception_type = 'type_only'
    AND start_datetime <= p_start_datetime
    AND end_datetime >= p_end_datetime
  LIMIT 1;

  IF FOUND THEN
    -- If type_only exception exists, check if appointment type is allowed
    IF NOT (p_appointment_type = ANY(v_exception_record.allowed_appointment_types)) THEN
      RETURN false;
    END IF;
  END IF;

  -- Check for modified_hours exceptions
  SELECT * INTO v_exception_record
  FROM availability_exceptions
  WHERE practitioner_id = p_practitioner_id
    AND is_active = true
    AND exception_type = 'modified_hours'
    AND start_datetime <= p_start_datetime
    AND end_datetime >= p_end_datetime
  LIMIT 1;

  IF FOUND THEN
    -- Use modified hours instead of regular schedule
    RETURN v_time_only >= v_exception_record.modified_start_time
       AND p_end_datetime::TIME <= v_exception_record.modified_end_time;
  END IF;

  -- Check regular weekly availability
  SELECT EXISTS(
    SELECT 1 FROM practitioner_availability
    WHERE practitioner_id = p_practitioner_id
      AND day_of_week = v_day_of_week
      AND appointment_type = p_appointment_type
      AND is_active = true
      AND start_time <= v_time_only
      AND end_time >= p_end_datetime::TIME
  ) INTO v_has_regular_availability;

  RETURN v_has_regular_availability;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DEFAULT AVAILABILITY FOR EXISTING PRACTITIONERS
-- =====================================================

-- Insert default availability (Mon-Fri, 9 AM - 5 PM) for all existing practitioners
-- This runs once during migration
DO $$
DECLARE
  v_profile RECORD;
  v_day INTEGER;
  v_type appointment_type;
BEGIN
  -- Loop through all practitioners who have a practice_id
  FOR v_profile IN
    SELECT id, practice_id
    FROM profiles
    WHERE role = 'practitioner'
      AND practice_id IS NOT NULL
  LOOP
    -- Loop through weekdays (1 = Monday to 5 = Friday)
    FOR v_day IN 1..5 LOOP
      -- Loop through appointment types
      FOR v_type IN
        SELECT unnest(enum_range(NULL::appointment_type))
      LOOP
        -- Insert default availability if not exists
        INSERT INTO practitioner_availability (
          practice_id,
          practitioner_id,
          day_of_week,
          appointment_type,
          start_time,
          end_time,
          is_active
        ) VALUES (
          v_profile.practice_id,
          v_profile.id,
          v_day,
          v_type,
          '09:00:00'::TIME,
          '17:00:00'::TIME,
          true
        )
        ON CONFLICT (practitioner_id, day_of_week, appointment_type) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE practitioner_availability IS 'Stores regular weekly availability schedule for practitioners by appointment type';
COMMENT ON TABLE availability_exceptions IS 'Stores exceptions to regular schedule: time off, modified hours, or appointment type restrictions';
COMMENT ON FUNCTION is_practitioner_available IS 'Checks if a practitioner is available for a given appointment type and time range';
