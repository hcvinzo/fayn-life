-- Migration: Remove automatic profile creation trigger
-- Date: 2025-01-23
-- Issue: #9 - Fix profile creation in sign-up flow
--
-- CHANGE SUMMARY:
-- Profile creation is now handled in the application layer (service layer)
-- instead of using a database trigger. This provides better control and
-- avoids race conditions between trigger execution and profile updates.
--
-- WHAT THIS MIGRATION DOES:
-- 1. Drops the trigger that automatically creates profiles on user signup
-- 2. Drops the function that was used by the trigger
--
-- NOTE: The application now explicitly creates profiles during sign-up.
-- See: web/src/lib/repositories/auth-repository.ts (ServerAuthRepository.signUp and ClientAuthRepository.signUp)

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();
