# Quick Start Guide - fayn.life

Get your fayn.life development environment up and running in 5 minutes.

## Prerequisites Check

Before you begin, make sure you have:
- ✅ Node.js 18 or higher (`node --version`)
- ✅ npm (`npm --version`)
- ✅ A code editor (VS Code recommended)
- ✅ A Supabase account (free tier is fine)

## Step-by-Step Setup

### 1. Navigate to the Project

```bash
cd web
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, Supabase, and Tailwind CSS.

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and update these values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 4. Set Up the Database (Optional for MVP)

The app will run without a database for UI development, but to enable full functionality:

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the contents of `../supabase/migrations/20240116000000_initial_schema.sql`
3. Paste and run it in the SQL Editor
4. Verify the tables were created under Database → Tables

### 5. Start the Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 1439ms
- Local:   http://localhost:3000
```

### 6. Open the Application

Open your browser and visit:
```
http://localhost:3000
```

You should be automatically redirected to the login page.

## What You Can Do Now

### Without Database (UI Development)
- ✅ View all pages and layouts
- ✅ Test navigation
- ✅ See mock data in tables
- ✅ Explore the UI/UX
- ❌ Cannot create actual accounts
- ❌ Cannot save data

### With Database (Full Functionality)
- ✅ Create an account
- ✅ Log in/out
- ✅ Create clients (coming soon)
- ✅ Schedule appointments (coming soon)
- ✅ View calendar (coming soon)

## Available Routes

Once running, you can visit:

- `/` - Home (redirects to login)
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (requires auth)
- `/clients` - Client management (requires auth)
- `/appointments` - Appointments (requires auth)
- `/calendar` - Calendar view (requires auth)
- `/settings` - Settings (requires auth)
- `/admin` - Admin panel placeholder (requires auth)

## Testing Authentication

### Creating a Test Account (with database connected)

1. Go to `http://localhost:3000/register`
2. Fill in:
   - Full Name: Test User
   - Email: test@example.com
   - Password: testpassword123
   - Confirm Password: testpassword123
3. Click "Create Account"
4. You'll be redirected to the dashboard

### Without Database

The auth pages will render but you cannot create accounts. You can still:
- View the login/register UI
- Test form validation
- See error states
- Navigate between auth pages

## Common Issues

### Port 3000 Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues
- Verify your `.env.local` has correct values
- Check that NEXT_PUBLIC_SUPABASE_URL starts with `https://`
- Ensure the anon key is the "anon/public" key, not the service role key

### TypeScript Errors
```bash
# Run type checking
npm run type-check

# Most errors can be fixed by restarting the dev server
# Press Ctrl+C and run npm run dev again
```

## Development Tips

### Hot Reload
- Changes to files are automatically reflected
- If something doesn't update, try refreshing the browser
- For major changes, restart the dev server

### VS Code Setup
The project includes recommended VS Code settings in `.vscode/settings.json`:
- Auto-format on save
- ESLint integration
- TypeScript support

### Recommended VS Code Extensions
- ESLint
- Tailwind CSS IntelliSense
- Prettier (optional)

## Next Steps

Once your environment is running:

1. **Explore the codebase:**
   - Review `src/app/` for routes and pages
   - Check `src/components/` for UI components
   - Look at `src/lib/` for utilities

2. **Read the documentation:**
   - [web/README.md](web/README.md) - Detailed web app docs
   - [README.md](README.md) - Project overview

3. **Set up the database:**
   - Follow the Supabase setup in step 4 above
   - Test authentication
   - Explore RLS policies

4. **Start developing:**
   - Pick a feature to implement
   - Follow the existing code patterns
   - Test as you go

## Getting Help

If you run into issues:

1. Check the [README.md](README.md) for more detailed information
2. Review the code comments in the files
3. Check Supabase documentation for backend issues
4. Check Next.js documentation for frontend issues

## Success Checklist

You're ready to develop when you can:
- ✅ Run `npm run dev` without errors
- ✅ Access `http://localhost:3000` in your browser
- ✅ See the login page
- ✅ Navigate between pages
- ✅ See the dashboard (with or without auth)

---

**Happy coding! 🚀**
