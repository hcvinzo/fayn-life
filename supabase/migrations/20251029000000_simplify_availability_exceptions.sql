-- =====================================================
-- Simplify Availability Exceptions
-- Date: 2025-10-29
--
-- Changes:
-- 1. Remove complex exception_type enum (time_off, modified_hours, type_only)
-- 2. Add simple availability_status enum (off, online_only, in_person_only)
-- 3. Remove modified_hours related columns (modified_start_time, modified_end_time)
-- 4. Remove type_only related column (allowed_appointment_types)
-- 5. Update is_practitioner_available() function to use new schema
-- =====================================================

-- =====================================================
-- 1. DROP OLD CONSTRAINTS AND COLUMNS
-- =====================================================

-- Drop the CHECK constraint that validates exception_type fields
ALTER TABLE availability_exceptions
  DROP CONSTRAINT IF EXISTS availability_exceptions_check;

-- Drop columns for modified_hours type
ALTER TABLE availability_exceptions
  DROP COLUMN IF EXISTS modified_start_time CASCADE;

ALTER TABLE availability_exceptions
  DROP COLUMN IF EXISTS modified_end_time CASCADE;

-- Drop column for type_only
ALTER TABLE availability_exceptions
  DROP COLUMN IF EXISTS allowed_appointment_types CASCADE;

-- Drop the old exception_type column
ALTER TABLE availability_exceptions
  DROP COLUMN IF EXISTS exception_type CASCADE;

-- Drop the old exception_type enum
DROP TYPE IF EXISTS exception_type CASCADE;

-- =====================================================
-- 2. CREATE NEW ENUM AND ADD COLUMN
-- =====================================================

-- Create new availability_status enum
CREATE TYPE availability_status AS ENUM (
  'off',              -- Practitioner completely unavailable
  'online_only',      -- Only online appointments allowed
  'in_person_only'    -- Only in-person appointments allowed
);

-- Add new availability_status column
ALTER TABLE availability_exceptions
  ADD COLUMN availability_status availability_status NOT NULL DEFAULT 'off';

-- Remove the default (we want explicit selection going forward)
ALTER TABLE availability_exceptions
  ALTER COLUMN availability_status DROP DEFAULT;

-- =====================================================
-- 3. MIGRATE EXISTING DATA (if any)
-- =====================================================

-- Note: Since we dropped exception_type column, existing rows will have
-- availability_status = 'off' from the temporary default above.
-- If you need to preserve specific mappings, do it before dropping the column.

-- =====================================================
-- 4. UPDATE HELPER FUNCTION
-- =====================================================

-- Drop and recreate the availability check function with new logic
DROP FUNCTION IF EXISTS is_practitioner_available(UUID, appointment_type, TIMESTAMPTZ, TIMESTAMPTZ);

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
  v_exception_record RECORD;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  v_day_of_week := EXTRACT(DOW FROM p_start_datetime);
  v_time_only := p_start_datetime::TIME;

  -- Check for any exception during this time period
  SELECT * INTO v_exception_record
  FROM availability_exceptions
  WHERE practitioner_id = p_practitioner_id
    AND is_active = true
    AND start_datetime <= p_start_datetime
    AND end_datetime >= p_end_datetime
  LIMIT 1;

  IF FOUND THEN
    -- Handle exception based on availability_status
    CASE v_exception_record.availability_status
      WHEN 'off' THEN
        -- Practitioner is completely unavailable
        RETURN false;

      WHEN 'online_only' THEN
        -- Only online appointments allowed
        IF p_appointment_type != 'online' THEN
          RETURN false;
        END IF;

      WHEN 'in_person_only' THEN
        -- Only in-person appointments allowed
        IF p_appointment_type != 'in_person' THEN
          RETURN false;
        END IF;
    END CASE;
  END IF;

  -- Check regular availability schedule
  SELECT EXISTS(
    SELECT 1 FROM practitioner_availability
    WHERE practitioner_id = p_practitioner_id
      AND is_active = true
      AND day_of_week = v_day_of_week
      AND appointment_type = p_appointment_type
      AND start_time <= v_time_only
      AND end_time >= (p_end_datetime::TIME)
  ) INTO v_has_regular_availability;

  RETURN v_has_regular_availability;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE
-- =====================================================

-- Note: All RLS policies, indexes, and triggers remain unchanged
-- as they don't depend on the removed columns or enum.
