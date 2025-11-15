# Assistant Role - Quick Start Guide

Quick reference for testing and using the assistant role system.

## 🚀 Quick Test (5 Minutes)

### 1. Apply Migration
```bash
# Open Supabase Dashboard → SQL Editor
# Copy/paste: supabase/migrations/20251115000000_add_assistant_role_and_permissions.sql
# Click "Run"
```

### 2. Verify Migration
```bash
# Run in Supabase SQL Editor:
# Copy/paste: supabase/verify_assistant_system.sql
# Should show 4 roles, 7 permissions, 3 helper functions
```

### 3. Start Dev Server
```bash
cd web
npm run dev
```

### 4. Create Test Assistant (As Admin)
1. Login as admin → http://localhost:3000/admin
2. Click "Assistants" → "Add Assistant"
3. Fill form:
   - Name: Test Assistant
   - Email: test.assistant@example.com
   - Password: Test123!@#
   - Practice: Select any
   - Check 1-2 practitioners
4. Click "Create Assistant"

### 5. Test Assistant Login
1. Logout
2. Login as: test.assistant@example.com / Test123!@#
3. Should redirect to `/dashboard`
4. Navigate to "Appointments" → "New Appointment"
5. **Verify**: Form shows "Practitioner" dropdown with only assigned practitioners
6. Create test appointment
7. **Verify**: Success!

## ✅ Success Indicators

**If everything works, you'll see:**
- ✅ Assistant can login
- ✅ Redirected to `/dashboard` (not `/admin`)
- ✅ Practitioner selector appears in appointment form
- ✅ Only assigned practitioners in dropdown
- ✅ Can create appointment successfully
- ✅ No "Availability Settings" in Settings page

## 🎯 Key Features Implemented

### Admin Panel
- `/admin/assistants` - List all assistants
- `/admin/assistants/new` - Create assistant + assign practitioners
- `/admin/assistants/[id]` - View details and assignments
- `/admin/assistants/[id]/edit` - Edit assistant and update assignments

### Assistant Portal
- Permission-based navigation (hides items they can't access)
- Practitioner selector in appointment form
- Only sees appointments for assigned practitioners
- Cannot access availability settings

### Permission System
```
Assistant Permissions (Default):
✅ manage_clients - Create, view, edit clients
✅ manage_appointments - Create, view, edit appointments

Assistant Restrictions:
❌ view_sessions - Cannot view session notes
❌ manage_sessions - Cannot create sessions
❌ view_medical_data - Cannot access medical data
❌ manage_availability - Cannot manage schedules
❌ manage_practice_settings - Cannot change practice settings
```

## 📊 Database Schema

```
New Tables:
- permissions: 7 system permissions
- role_permissions: Maps permissions to roles
- practitioner_assignments: Assistant → Practitioner mapping

Updated:
- user_role enum: Added 'assistant'
- appointments RLS: Enforces assignment-based access
```

## 🔧 Common Commands

### Check System Status
```sql
-- Run in Supabase SQL Editor
SELECT unnest(enum_range(NULL::user_role)) as roles;
SELECT COUNT(*) FROM permissions;
SELECT COUNT(*) FROM practitioner_assignments;
```

### List All Assistants
```sql
SELECT email, full_name, status
FROM profiles
WHERE role = 'assistant';
```

### View Assistant Assignments
```sql
SELECT
  a.email as assistant,
  p.email as assigned_to_practitioner
FROM practitioner_assignments pa
JOIN profiles a ON a.id = pa.assistant_id
JOIN profiles p ON p.id = pa.practitioner_id;
```

## 🛠️ Troubleshooting

### "assistant is not a valid enum value"
**Fix**: Migration not applied. Run the migration SQL.

### Practitioner dropdown is empty
**Fix**:
1. Verify assistant has assignments: `SELECT * FROM practitioner_assignments WHERE assistant_id = 'USER_ID';`
2. Verify practice has practitioners
3. Check browser console for API errors

### Can see all appointments (not just assigned)
**Fix**: RLS policies not applied. Re-run migration (it's idempotent).

### Form says "Practitioner ID is required"
**Fix**: This is expected for assistants - they MUST select a practitioner.

## 📁 File Structure

```
Key Files Created/Modified:

Database:
├── supabase/migrations/20251115000000_add_assistant_role_and_permissions.sql
└── supabase/verify_assistant_system.sql

Backend:
├── web/src/types/permission.ts (NEW)
├── web/src/types/database.ts (updated)
├── web/src/lib/repositories/practitioner-assignment-repository.ts (NEW)
├── web/src/lib/services/authorization-service.ts (NEW)
├── web/src/lib/api/practitioner-assignment-api.ts (NEW)
└── web/src/app/api/practitioner-assignments/* (NEW)

Frontend - Hooks:
├── web/src/hooks/use-permissions.ts (NEW)
└── web/src/hooks/use-assigned-practitioners.ts (NEW)

Frontend - Components:
├── web/src/components/portal/practitioner-selector.tsx (NEW)
├── web/src/components/portal/permission-gate.tsx (NEW)
├── web/src/components/portal/nav.tsx (updated - permission filtering)
├── web/src/components/portal/appointment-form.tsx (updated - practitioner selector)
└── web/src/components/admin/assistant-form.tsx (NEW)

Admin Pages:
├── web/src/app/admin/assistants/page.tsx (NEW)
├── web/src/app/admin/assistants/new/page.tsx (NEW)
├── web/src/app/admin/assistants/[id]/page.tsx (NEW)
├── web/src/app/admin/assistants/[id]/edit/page.tsx (NEW)
└── web/src/components/admin/admin-nav.tsx (updated)

Other:
└── web/middleware.ts (updated - assistant routing)
```

## 🎓 Usage Examples

### Admin: Create Assistant
```typescript
// Admin panel automatically handles this
// Navigate to /admin/assistants/new
// Form creates user + assignments in one transaction
```

### Admin: Assign More Practitioners
```typescript
// Navigate to /admin/assistants/[id]/edit
// Check/uncheck practitioners
// Save → assignments replaced atomically
```

### Assistant: Create Appointment
```typescript
// Navigate to /appointments/new
// Select practitioner (only assigned ones shown)
// Select client, date, time
// System validates practitioner is assigned
// Appointment created with selected practitioner_id
```

### Check Permission (Frontend)
```typescript
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { canManageClients, isAssistant } = usePermissions();

  if (isAssistant) {
    // Show assistant-specific UI
  }

  if (canManageClients) {
    // Show client management buttons
  }
}
```

### Check Permission (Backend)
```typescript
import { serverAuthorizationService } from '@/lib/services/authorization-service';

// In API route
const context = await serverAuthorizationService.getAuthorizationContext(userId);
if (!context) throw new Error('Unauthorized');

if (serverAuthorizationService.canManageAppointments(context)) {
  // Allow appointment creation
}

if (serverAuthorizationService.canAccessPractitioner(context, practitionerId)) {
  // Allow access to this practitioner's data
}
```

## 📚 Additional Resources

- Full Testing Guide: `TESTING_ASSISTANT_ROLE.md`
- Migration Script: `supabase/migrations/20251115000000_add_assistant_role_and_permissions.sql`
- Verification Script: `supabase/verify_assistant_system.sql`
- Project Docs: `CLAUDE.md`

## 🎉 What's Next?

After successful testing:

1. **Production Deployment**: Apply migration to production
2. **Create Real Assistants**: Use admin panel to create actual assistant accounts
3. **Optional Enhancements**:
   - Add practitioner filter to appointments list
   - Add practitioner filter to calendar
   - Create multi-practitioner schedule view
   - Add email notifications for assignments

---

**Need Help?**
- Check browser console for errors
- Check Supabase logs for database errors
- Run verification script to check system state
- Refer to `TESTING_ASSISTANT_ROLE.md` for detailed testing steps
