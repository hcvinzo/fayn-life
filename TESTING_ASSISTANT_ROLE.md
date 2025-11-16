# Testing Assistant Role System

This guide will help you test the newly implemented assistant role functionality.

## Prerequisites

- Running Supabase project
- Admin account access
- At least one practice created
- At least one practitioner account

## Step 1: Apply Database Migration ⚠️ CRITICAL

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Copy the entire contents of: `supabase/migrations/20251115000000_add_assistant_role_and_permissions.sql`
   - Paste into SQL Editor
   - Click **Run**

3. **Verify Migration Success**
   Run this query to verify:
   ```sql
   -- Check if assistant role exists
   SELECT unnest(enum_range(NULL::user_role)) as roles;

   -- Should see: admin, practitioner, staff, assistant

   -- Check permissions table
   SELECT * FROM permissions;

   -- Should see 7 permissions

   -- Check role_permissions
   SELECT r.role, p.code
   FROM role_permissions r
   JOIN permissions p ON p.id = r.permission_id
   ORDER BY r.role, p.code;

   -- Should see permissions mapped to each role
   ```

## Step 2: Start the Development Server

```bash
cd web
npm run dev
```

Open http://localhost:3000

## Step 3: Test Admin Panel - Create Assistant

### 3.1 Login as Admin

1. Navigate to `/login`
2. Login with your admin credentials
3. You should be redirected to `/admin`

### 3.2 Navigate to Assistants

1. Click **"Assistants"** in the sidebar
2. You should see the assistants list page (empty initially)

### 3.3 Create Test Assistant

1. Click **"Add Assistant"** button
2. Fill in the form:
   - **Full Name**: Jane Assistant
   - **Email**: jane.assistant@gmail.com (or use your own email)
   - **Password**: SecurePass123!
   - **Confirm Password**: SecurePass123!
   - **Practice**: Select your practice
   - **Status**: Active

   **⚠️ Important - Email Restrictions:**
   - Supabase blocks emails containing "test" (e.g., test@example.com, test.assistant@gmail.com)
   - Supabase blocks the "example.com" domain
   - Use real-looking emails like: jane.assistant@gmail.com, assistant1@yourdomain.com
   - Pro tip: Use your own email with a + sign: youremail+assistant1@gmail.com

3. **Assign Practitioners**:
   - After selecting practice, you should see a list of practitioners
   - Check the boxes for 1-2 practitioners
   - Note: If no practitioners appear, you need to create a practitioner first in `/admin/practitioners`

4. Click **"Create Assistant"**
5. You should be redirected to `/admin/assistants`
6. Verify the assistant appears in the list

**Expected Result:**
✅ Assistant created successfully
✅ Assignment count shows in the list
✅ No errors in console

### 3.4 View Assistant Details

1. Click the **eye icon** (View) next to the assistant
2. Verify you see:
   - Full name and email
   - Practice name
   - Status badge
   - List of assigned practitioners with names

**Expected Result:**
✅ All information displays correctly
✅ Assigned practitioners are listed

### 3.5 Edit Assistant

1. Click **"Edit Assistant"** button
2. Try changing:
   - Full Name to "Updated Assistant"
   - Status to "Suspended"
   - Uncheck one practitioner, check another
3. Click **"Update Assistant"**
4. Verify changes are saved

**Expected Result:**
✅ Changes saved successfully
✅ Assignments updated correctly

## Step 4: Test Assistant Login & Portal Access

### 4.1 Logout and Login as Assistant

1. Sign out from admin account
2. Navigate to `/login`
3. Login with assistant credentials:
   - Email: jane.assistant@gmail.com (use the email you created)
   - Password: SecurePass123! (use the password you set)

**Expected Result:**
✅ Redirected to `/dashboard` (NOT `/admin`)
✅ No errors

### 4.2 Check Navigation Menu

Look at the sidebar navigation. You should see:

**✅ VISIBLE:**
- Dashboard
- Clients
- Appointments
- Calendar
- Settings

**❌ HIDDEN:**
- (Nothing should be hidden for assistants with default permissions)

### 4.3 Check Settings Page

1. Click **"Settings"** in the sidebar
2. Navigate to `/settings`

**Expected Result:**
✅ Settings page loads
❌ **"Availability Settings"** card should NOT be visible (assistants can't manage availability)

## Step 5: Test Appointment Creation (Assistant)

### 5.1 Navigate to Create Appointment

1. Click **"Appointments"** in sidebar
2. Click **"New Appointment"** button
3. You should see the appointment form

### 5.2 Verify Practitioner Selector

**Expected UI:**
✅ Form shows **"Practitioner *"** field (required)
✅ Dropdown shows ONLY assigned practitioners (from step 3.3)
✅ Help text: "You can only create appointments for assigned practitioners"

### 5.3 Create Test Appointment

1. **Select Client**: Choose any active client
2. **Select Practitioner**: Choose one of the assigned practitioners
3. **Appointment Type**: In-Person
4. **Duration**: 60 minutes
5. **Date**: Tomorrow
6. **Time**: 10:00 AM
7. Click **"Save Appointment"**

**Expected Result:**
✅ Appointment created successfully
✅ Redirected to appointments list
✅ Appointment appears in the list
✅ No errors

### 5.4 Try Invalid Scenarios

**Scenario A: No practitioner selected**
1. Fill out form but DON'T select a practitioner
2. Try to submit

**Expected Result:**
❌ Form validation error: "Please select a practitioner"

**Scenario B: Verify data isolation**
1. Check appointments list
2. You should ONLY see appointments for:
   - Practitioners you're assigned to
   - NOT appointments from other practitioners

**Expected Result:**
✅ Only assigned practitioners' appointments visible

## Step 6: Test Practitioner Login (Verify No Changes)

### 6.1 Login as Practitioner

1. Sign out from assistant account
2. Login with a practitioner account

**Expected Result:**
✅ Everything works as before
✅ NO practitioner selector in appointment form
✅ Appointments use practitioner's own ID automatically

## Step 7: Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check assistant profile
SELECT id, email, full_name, role, practice_id
FROM profiles
WHERE email = 'jane.assistant@gmail.com'; -- Use your assistant email

-- 2. Check practitioner assignments
SELECT
  pa.id,
  a.email as assistant_email,
  p.email as practitioner_email
FROM practitioner_assignments pa
JOIN profiles a ON a.id = pa.assistant_id
JOIN profiles p ON p.id = pa.practitioner_id
WHERE a.email = 'jane.assistant@gmail.com'; -- Use your assistant email

-- 3. Check appointments created by assistant
SELECT
  app.id,
  app.start_time,
  c.full_name as client_name,
  p.email as practitioner_email
FROM appointments app
JOIN clients c ON c.id = app.client_id
JOIN profiles p ON p.id = app.practitioner_id
WHERE app.practice_id IN (
  SELECT practice_id FROM profiles WHERE email = 'jane.assistant@gmail.com' -- Use your assistant email
);

-- 4. Verify RLS policies (as assistant)
-- This query should only return appointments for assigned practitioners
-- Run while logged in as assistant in the app
```

## Step 8: Permission System Verification

### 8.1 Test Permission Gates

1. As assistant, try to access:
   - `/settings/availability` (should fail or redirect)

2. Check browser console for:
   - No permission errors
   - No 403 errors

### 8.2 Verify API Access

Open browser DevTools > Network tab:

1. As assistant, load appointments page
2. Check the API request to `/api/appointments`
3. Verify it returns ONLY appointments for assigned practitioners

## Checklist Summary

### ✅ Database
- [ ] Migration applied successfully
- [ ] `assistant` role exists in enum
- [ ] `permissions` table has 7 records
- [ ] `role_permissions` table populated
- [ ] `practitioner_assignments` table created

### ✅ Admin Panel
- [ ] Can navigate to `/admin/assistants`
- [ ] Can create assistant with practitioner assignments
- [ ] Can view assistant details
- [ ] Can edit assistant and update assignments
- [ ] Assigned practitioners display correctly

### ✅ Assistant Portal
- [ ] Assistant redirected to `/dashboard` (not `/admin`)
- [ ] Navigation menu shows correct items
- [ ] Settings page hides "Availability Settings"
- [ ] Appointment form shows practitioner selector
- [ ] Only assigned practitioners appear in dropdown
- [ ] Can create appointment successfully
- [ ] Only sees appointments for assigned practitioners

### ✅ Practitioner Portal
- [ ] Practitioner workflow unchanged
- [ ] No practitioner selector in form
- [ ] Appointments use practitioner's own ID

### ✅ Security
- [ ] RLS policies enforce assignment-based access
- [ ] Assistants can't see other practitioners' data
- [ ] API returns filtered data correctly

## Troubleshooting

### Issue: "assistant is not a valid enum value"
**Solution**: Migration not applied. Run the migration SQL in Supabase.

### Issue: Practitioner selector doesn't show practitioners
**Solution**:
1. Verify assistant has practitioner assignments in database
2. Check browser console for API errors
3. Verify practice has practitioners

### Issue: Can't create appointment
**Solution**:
1. Check browser console for errors
2. Verify all required fields filled
3. Check that selected practitioner is assigned

### Issue: See all appointments (not just assigned)
**Solution**: RLS policies may not be applied correctly. Re-run migration section 7.

## Success Criteria

🎉 **All tests pass when:**
1. ✅ Assistant can login and access portal
2. ✅ Navigation is permission-based
3. ✅ Practitioner selector works correctly
4. ✅ Only sees assigned practitioners' appointments
5. ✅ Can create appointments for assigned practitioners only
6. ✅ Cannot access availability settings
7. ✅ Admin can manage assistants and assignments
8. ✅ Practitioner workflow unchanged

## Next Steps After Testing

Once testing is complete and successful:

1. **Production Deployment**:
   - Apply migration to production Supabase
   - Deploy updated web application
   - Create assistant accounts

2. **Optional Enhancements**:
   - Add practitioner filter to appointments list
   - Add practitioner filter to calendar
   - Create assistant schedule overview page
   - Add assignment notifications

3. **Documentation**:
   - Update user documentation
   - Create assistant onboarding guide
   - Document assignment workflow

---

**Questions or Issues?**
Check browser console and Supabase logs for errors. All API calls and database queries should be visible there.
