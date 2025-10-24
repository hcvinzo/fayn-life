-- Migration: Add appointment type field
-- Created: 2025-10-23
-- Description: Adds appointment_type column to appointments table with enum values (in_person, online)

-- Create appointment type enum
CREATE TYPE appointment_type AS ENUM ('in_person', 'online');

-- Add appointment_type column to appointments table
ALTER TABLE appointments
ADD COLUMN appointment_type appointment_type NOT NULL DEFAULT 'in_person';

-- Add comment to document the column
COMMENT ON COLUMN appointments.appointment_type IS 'Type of appointment: in_person or online';
