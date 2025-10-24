# Storage Bucket Setup Instructions

Since storage policies require superuser privileges, you need to create the bucket and policies through the Supabase Dashboard.

## Step 1: Create the Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `session-files`
   - **Public bucket**: ✅ Yes (checked)
   - Click **Create bucket**

## Step 2: Create Storage Policies

After creating the bucket, click on the `session-files` bucket, then go to the **Policies** tab.

### Policy 1: Upload Files (INSERT)

Click **New policy** → **Create a policy from scratch**

```
Policy name: Users can upload files to their practice folder
Allowed operation: INSERT
Policy definition:
```

```sql
(bucket_id = 'session-files'::text)
AND (auth.role() = 'authenticated'::text)
AND ((storage.foldername(name))[1] IN (
  SELECT (profiles.practice_id)::text
  FROM profiles
  WHERE (profiles.id = auth.uid())
))
```

### Policy 2: View/Download Files (SELECT)

Click **New policy** → **Create a policy from scratch**

```
Policy name: Users can view files from their practice folder
Allowed operation: SELECT
Policy definition:
```

```sql
(bucket_id = 'session-files'::text)
AND (auth.role() = 'authenticated'::text)
AND ((storage.foldername(name))[1] IN (
  SELECT (profiles.practice_id)::text
  FROM profiles
  WHERE (profiles.id = auth.uid())
))
```

### Policy 3: Delete Files (DELETE)

Click **New policy** → **Create a policy from scratch**

```
Policy name: Users can delete files from their practice folder
Allowed operation: DELETE
Policy definition:
```

```sql
(bucket_id = 'session-files'::text)
AND (auth.role() = 'authenticated'::text)
AND ((storage.foldername(name))[1] IN (
  SELECT (profiles.practice_id)::text
  FROM profiles
  WHERE (profiles.id = auth.uid())
))
```

## Step 3: Verify Setup

1. Go to **Storage** → `session-files` bucket
2. You should see 3 policies in the **Policies** tab
3. The bucket should be marked as **Public**

## Alternative: Use Supabase CLI (If you have it installed)

If you have the Supabase CLI installed locally, you can run:

```bash
# From your project root
supabase storage create session-files --public

# Then apply the policies via Dashboard as described above
```

## Security Note

The policies ensure practice-based isolation:
- Files are stored in folders named after practice_id: `{practice_id}/{entity_type}/{entity_id}/...`
- Users can only access files in their own practice's folder
- All operations (upload, view, delete) check that the folder name matches the user's practice_id
