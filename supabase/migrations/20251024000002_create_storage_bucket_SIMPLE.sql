-- Migration: Create Supabase storage bucket for session files
-- Description: Creates the 'session-files' bucket (policies must be added via Dashboard)
-- Created: 2025-10-24
--
-- NOTE: Storage policies CANNOT be created via SQL Editor due to permission restrictions.
-- After running this migration, follow the instructions in:
-- supabase/migrations/20251024000002_create_storage_bucket_INSTRUCTIONS.md

-- Create storage bucket for session files
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-files', 'session-files', true)
ON CONFLICT (id) DO NOTHING;

-- ⚠️ IMPORTANT: Storage policies must be created via Supabase Dashboard
-- See: supabase/migrations/20251024000002_create_storage_bucket_INSTRUCTIONS.md
--
-- Required policies:
-- 1. INSERT policy: Users can upload files to their practice folder
-- 2. SELECT policy: Users can view files from their practice folder
-- 3. DELETE policy: Users can delete files from their practice folder
--
-- All policies enforce practice-based isolation using:
-- (storage.foldername(name))[1] IN (SELECT practice_id::text FROM profiles WHERE id = auth.uid())
