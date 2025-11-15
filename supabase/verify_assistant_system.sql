-- ============================================================================
-- VERIFICATION SCRIPT: Assistant Role System
-- ============================================================================
-- Run this script in Supabase SQL Editor to verify the system is set up correctly
-- ============================================================================

-- 1. CHECK USER ROLES ENUM
-- Should include: admin, practitioner, staff, assistant
SELECT '1. User Roles Enum:' as check_name;
SELECT unnest(enum_range(NULL::user_role)) as available_roles;

-- 2. CHECK PERMISSIONS TABLE
-- Should have 7 permissions
SELECT '2. Permissions Count:' as check_name;
SELECT COUNT(*) as total_permissions FROM permissions;

SELECT '   Permission Details:' as check_name;
SELECT code, name FROM permissions ORDER BY code;

-- 3. CHECK ROLE PERMISSIONS MAPPING
-- Should show all role-permission mappings
SELECT '3. Role Permissions:' as check_name;
SELECT
  r.role,
  COUNT(*) as permission_count,
  STRING_AGG(p.code, ', ' ORDER BY p.code) as permissions
FROM role_permissions r
JOIN permissions p ON p.id = r.permission_id
GROUP BY r.role
ORDER BY r.role;

-- 4. CHECK PRACTITIONER ASSIGNMENTS TABLE
-- Should exist and be ready for data
SELECT '4. Practitioner Assignments Table:' as check_name;
SELECT
  COUNT(*) as total_assignments,
  COUNT(DISTINCT assistant_id) as unique_assistants,
  COUNT(DISTINCT practitioner_id) as unique_practitioners
FROM practitioner_assignments;

-- 5. CHECK ASSISTANT PROFILES
-- List all assistant users
SELECT '5. Assistant Profiles:' as check_name;
SELECT
  id,
  email,
  full_name,
  role,
  practice_id,
  status,
  created_at
FROM profiles
WHERE role = 'assistant'
ORDER BY created_at DESC;

-- 6. CHECK PRACTITIONER ASSIGNMENTS WITH DETAILS
-- Show assistant → practitioner mappings
SELECT '6. Assignment Details:' as check_name;
SELECT
  a.email as assistant_email,
  a.full_name as assistant_name,
  p.email as practitioner_email,
  p.full_name as practitioner_name,
  pr.name as practice_name,
  pa.created_at
FROM practitioner_assignments pa
JOIN profiles a ON a.id = pa.assistant_id
JOIN profiles p ON p.id = pa.practitioner_id
JOIN practices pr ON pr.id = pa.practice_id
ORDER BY a.email, p.email;

-- 7. CHECK RLS POLICIES ON KEY TABLES
-- Verify policies exist
SELECT '7. RLS Policies:' as check_name;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('permissions', 'role_permissions', 'practitioner_assignments', 'appointments')
ORDER BY tablename, policyname;

-- 8. CHECK HELPER FUNCTIONS
-- Verify helper functions exist
SELECT '8. Helper Functions:' as check_name;
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('has_permission', 'get_user_permissions', 'get_assigned_practitioners')
ORDER BY routine_name;

-- 9. TEST PERMISSION CHECK FUNCTION (Example)
-- Test with a sample user ID (replace with actual assistant ID)
SELECT '9. Permission Check Test:' as check_name;
SELECT
  'Replace this query with actual assistant ID' as note;
-- Uncomment and replace with actual assistant user ID:
-- SELECT has_permission('ASSISTANT_USER_ID_HERE', 'manage_appointments') as has_manage_appointments;
-- SELECT has_permission('ASSISTANT_USER_ID_HERE', 'manage_availability') as has_manage_availability;

-- 10. VERIFY APPOINTMENT RLS FOR ASSISTANTS
-- Check that appointment policies include assistant logic
SELECT '10. Appointment RLS Policies:' as check_name;
SELECT
  policyname,
  permissive,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY CHECKS
-- ============================================================================

SELECT '--- SUMMARY ---' as summary;

-- Count by role
SELECT
  'User Counts by Role' as metric,
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- Assignments summary
SELECT
  'Assignment Summary' as metric,
  'Total Assignments' as detail,
  COUNT(*) as count
FROM practitioner_assignments
UNION ALL
SELECT
  'Assignment Summary' as metric,
  'Assistants with Assignments' as detail,
  COUNT(DISTINCT assistant_id) as count
FROM practitioner_assignments
UNION ALL
SELECT
  'Assignment Summary' as metric,
  'Practitioners Assigned' as detail,
  COUNT(DISTINCT practitioner_id) as count
FROM practitioner_assignments;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 1. 4 roles (admin, practitioner, staff, assistant)
-- 2. 7 permissions
-- 3. Admin: 7 permissions, Practitioner: 6, Assistant: 2, Staff: 2
-- 4. practitioner_assignments table exists
-- 5. Shows any assistant users created
-- 6. Shows assignment mappings (if any)
-- 7. RLS policies exist on all key tables
-- 8. 3 helper functions exist
-- 9. Permission checks work correctly
-- 10. Appointment policies include assistant logic
-- ============================================================================
