-- Create Admin User and Practice
-- This migration creates an admin practice and admin user for system administration

-- Step 1: Create admin practice
INSERT INTO practices (id, name, address, phone, email, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Administration',
  'N/A',
  'N/A',
  'admin@fayn.life',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create admin user in auth.users
-- Note: This uses Supabase's internal auth schema
-- The password '123456' will be hashed by Supabase
--
-- IMPORTANT: You must run this using Supabase SQL Editor with elevated permissions
-- Or use Supabase CLI: supabase db reset (which will run all migrations)
--
-- Alternative: Create the admin user via Supabase Dashboard > Authentication > Users
-- Then run Step 3 below to create the profile

-- For manual creation via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: admin@fayn.life
-- 4. Password: 123456
-- 5. Copy the user ID
-- 6. Run Step 3 below, replacing the user_id

-- Step 3: Create admin profile
-- If creating manually, replace '00000000-0000-0000-0000-000000000000' with actual user ID from auth.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to find existing auth user with admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@fayn.life'
  LIMIT 1;

  -- If user exists, create profile
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, role, practice_id, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin@fayn.life',
      'System Administrator',
      'admin',
      '00000000-0000-0000-0000-000000000001',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      practice_id = '00000000-0000-0000-0000-000000000001',
      updated_at = NOW();

    RAISE NOTICE 'Admin profile created for user ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users. Please create user manually via Supabase Dashboard:';
    RAISE NOTICE '1. Go to Authentication > Users > Add user';
    RAISE NOTICE '2. Email: admin@fayn.life, Password: 123456';
    RAISE NOTICE '3. After creating user, re-run this migration';
  END IF;
END $$;

-- Note: To create admin user programmatically, use Supabase Admin API or Dashboard
-- This migration will create the profile once the auth user exists
