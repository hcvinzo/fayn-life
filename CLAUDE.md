# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**fayn.life** is a practice management platform for healthcare practitioners, therapists, and wellness professionals. The project is in Phase 1 (MVP) with a Next.js web application and Supabase backend. A Flutter mobile app is planned for Phase 2.

## Repository Structure

```
fayn.life/
├── web/                    # Next.js 15 web application (main development area)
├── supabase/              # Database migrations and schema
├── mobile/                # Flutter mobile app (Phase 2)
└── docs/                  # Documentation
```

## Development Commands

All development happens in the `web/` directory:

```bash
# Navigate to web directory first
cd web

# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Environment Setup

1. Copy `.env.example` to `.env.local` in the `web/` directory
2. Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

## Database Management

- Schema is defined in [supabase/migrations/20240116000000_initial_schema.sql](supabase/migrations/20240116000000_initial_schema.sql)
- Migration history:
  - `20240116000000_initial_schema.sql` - Initial schema with tables, RLS, indexes
  - `20250123000000_remove_profile_trigger.sql` - Removed auto-profile creation trigger (profiles now created in service layer)
  - `20251023000000_add_appointment_type.sql` - Added appointment_type enum and column (in_person, online)
  - `20251024000000_create_client_sessions.sql` - Added client_sessions table with session_status enum for session tracking
  - `20251024000001_create_files_table.sql` - Added files table for polymorphic file attachments
  - `20251024000002_create_storage_bucket.sql` - Created 'session-files' Supabase Storage bucket with RLS policies
- To apply migrations: Run the SQL in Supabase project's SQL Editor
- Core tables: `profiles`, `practices`, `clients`, `appointments`, `client_sessions`, `files`
- Storage buckets: `session-files` (for session file attachments)
- All tables have Row Level Security (RLS) enabled with practice-based isolation
- **Important:** Profile records are NOT auto-created by triggers. They are created explicitly in the service layer during sign-up.

### Recent Bug Fixes

**Client Names Not Displaying in Appointment List (2025-10-23)**
- **Issue:** Client names appeared empty/blank in the appointments list page
- **Root Cause:** In [appointment-repository.ts](web/src/lib/repositories/appointment-repository.ts), the `findByPracticeWithClient` method used incorrect Supabase join syntax: `.select('*, client:clients(*)')`
- **Fix:** Updated to use explicit foreign key reference with selected fields:
  ```typescript
  .select(`
    *,
    client:client_id (
      id, first_name, last_name, email, phone, full_name
    )
  `)
  ```
- **Impact:** Client names now display correctly in the appointments list
- **Technical Details:** Supabase requires using the foreign key column name (`client_id`) rather than the table name (`clients`) when creating aliased joins

**Appointment Conflict Detection (2025-10-23)**
- **Issue:** Creating any appointment would fail with "This time slot conflicts with an existing appointment" error, regardless of the selected date/time
- **Root Cause:** In [appointment-repository.ts](web/src/lib/repositories/appointment-repository.ts), the `hasConflict` method was using `.or()` logic instead of AND logic for time overlap detection
- **Fix:** Changed from `.or('start_time.lt.${endTime},end_time.gt.${startTime}')` to chained filters `.lt('start_time', endTime).gt('end_time', startTime)`
- **Impact:** Appointment creation now works correctly and only detects actual scheduling conflicts
- **Technical Details:** Time ranges overlap when `start_time < new_end_time AND end_time > new_start_time`. The previous OR logic would match ALL appointments instead of only overlapping ones.

**Session Timeout Redirect (2025-10-23)**
- **Issue:** When a user's session expired or they signed out, API calls would fail silently with errors logged to console, but the user would not be redirected to the login page
- **Root Cause:** The API client in [client.ts](web/src/lib/api/client.ts) did not handle 401 Unauthorized responses, allowing authentication errors to propagate without triggering a redirect
- **Fix:** Added 401 status code detection in the `request()` method that automatically redirects to `/login` when authentication fails:
  ```typescript
  // Handle 401 Unauthorized - session expired or user logged out
  if (response.status === 401) {
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new ApiClientError(
      'Session expired. Please log in again.',
      401,
      'UNAUTHORIZED'
    )
  }
  ```
- **Impact:** Users are now automatically redirected to the login page when their session expires or they are logged out, providing a clear user experience
- **Technical Details:** The middleware handles server-side redirects for page navigation, but the API client now handles client-side redirects for API call authentication failures. The `typeof window !== 'undefined'` check ensures this only runs in the browser.

**Appointment Form Time Field Validation Error (2025-10-23)**
- **Issue:** When submitting the appointment form without selecting a time, users received a confusing error: "Invalid input: expected string, received undefined"
- **Root Cause:** In [appointment-form.tsx](web/src/components/portal/appointment-form.tsx), the `time` field validation schema used `z.string().min(1)` but the field had no default value, causing it to be `undefined` when not selected
- **Fix:** Applied two changes to handle undefined values properly:
  1. Updated the Zod schema to include a custom error message: `z.string({ message: 'Please select a time' }).min(1, 'Please select a time')`
  2. Added default value for time field: `time: ""` in the form's defaultValues to prevent undefined state
- **Impact:** Users now see a clear, user-friendly error message "Please select a time" when they forget to select a time slot
- **Technical Details:** React Hook Form with Zod requires all fields to have a defined value (even if empty string) to prevent type coercion errors. The custom message parameter provides better UX than Zod's default type error.

**Session Creation API Route 404 Error (2025-10-24)**
- **Issue:** Starting a session returned 404 error with URL `/api/api/sessions` instead of `/api/sessions`
- **Root Cause:** In [session-api.ts](web/src/lib/api/session-api.ts), all API calls included `/api` prefix (e.g., `apiClient.post('/api/sessions', data)`), but the `apiClient` already has `/api` as its base URL, causing double prefix
- **Fix:** Removed `/api` prefix from all session API client methods - changed from `/api/sessions` to `/sessions`, from `/api/sessions/${id}` to `/sessions/${id}`, etc.
- **Impact:** Session API calls now work correctly with proper routing
- **Technical Details:** The `apiClient` in [client.ts](web/src/lib/api/client.ts) has `baseURL: '/api'` set in its constructor. All API client methods should use relative paths without the `/api` prefix.
- **Prevention:** Added prominent warning in CLAUDE.md under "API Client URL Pattern - CRITICAL" section to prevent this mistake in future implementations

## Architecture

### Clean Architecture Overview

The application follows **Clean Architecture** principles with clear separation of concerns:

```
web/src/
├── app/                    # Next.js App Router (Presentation Layer)
│   ├── (auth)/            # Public authentication pages
│   ├── (portal)/          # Protected portal pages
│   ├── api/               # API route handlers
│   └── admin/             # Admin panel (Phase 2)
├── lib/
│   ├── services/          # Business Logic Layer
│   ├── repositories/      # Data Access Layer
│   ├── api/               # API clients (frontend HTTP layer)
│   ├── validators/        # Zod schemas for validation
│   ├── supabase/          # Supabase client configurations
│   └── utils/             # Utilities and helpers
├── components/            # React components
└── types/                 # TypeScript type definitions
```

### Architecture Layers

**1. Presentation Layer** (`app/` and `components/`)
   - Next.js pages and components
   - Client Components use API clients (`lib/api/`)
   - Server Components use services directly (`lib/services/`)

**2. API Layer** (`app/api/`)
   - HTTP route handlers at `/api/*`
   - Call services for business logic
   - Return standardized JSON responses

**3. API Client Layer** (`lib/api/`)
   - Frontend HTTP clients (e.g., `auth-api.ts`, `practice-api.ts`)
   - Used by Client Components to call API routes
   - Provides type-safe interface to backend

**4. Service Layer** (`lib/services/`)
   - Business logic and orchestration
   - Validates input using Zod schemas
   - Coordinates between multiple repositories
   - Examples: `auth-service.ts` (orchestrates user + profile creation)

**5. Repository Layer** (`lib/repositories/`)
   - Direct database access via Supabase
   - Each entity has its own repository (e.g., `auth-repository.ts`, `profile-repository.ts`)
   - Single responsibility: handle CRUD operations only
   - No business logic

### Next.js App Router Structure

The web app uses Next.js 15+ App Router with route groups:

- `app/(auth)/` - Public authentication pages (login, register)
- `app/(portal)/` - Protected practitioner portal pages (dashboard, clients, appointments, calendar, settings)
- `app/api/` - API route handlers (e.g., `/api/auth/sign-up`, `/api/practices`)
- `app/admin/` - Admin panel (Phase 2)

### Route Protection

[web/middleware.ts](web/middleware.ts) handles authentication:
- Public routes (`/login`, `/register`) redirect to `/dashboard` if authenticated
- Protected routes redirect to `/login` if not authenticated
- Uses Supabase SSR for session management

### Supabase Client Architecture

Three separate client implementations in [web/src/lib/supabase/](web/src/lib/supabase/):

1. **client.ts** - Browser client for Client Components
   - Uses `createBrowserClient` from `@supabase/ssr`
   - Automatically handles auth state

2. **server.ts** - Server client for Server Components/Actions/Route Handlers
   - Uses `createServerClient` with cookie-based auth
   - Must be used in Server Components, Server Actions, and Route Handlers

3. **middleware.ts** - Middleware-specific client
   - Handles session refresh in middleware
   - Used by [web/middleware.ts](web/middleware.ts)

### Type System

- TypeScript types in [web/src/types/](web/src/types/)
- [web/src/types/database.ts](web/src/types/database.ts) - Supabase database schema types (manual, to be auto-generated)
- Import path alias: `@/*` maps to `src/*`

### Component Organization

- `components/ui/` - shadcn/ui components (primitive UI components)
- `components/portal/` - Portal-specific components (e.g., navigation)
- `components/admin/` - Admin panel components (Phase 2)

### Layout Structure

Portal pages use [web/src/app/(portal)/layout.tsx](web/src/app/(portal)/layout.tsx):
- Provides consistent sidebar navigation via `<PortalNav />`
- Responsive layout with fixed sidebar and scrollable main content

## Key Technologies

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Forms**: react-hook-form + zod validation
- **Icons**: Lucide React

## Database Schema Key Points

### User Roles
- `admin` - Full system access
- `practitioner` - Practice owner/primary user
- `staff` - Practice staff member

### Client Status
- `active` - Currently active client
- `inactive` - Temporarily inactive
- `archived` - Permanently archived

### Appointment Status
- `scheduled` - Initial booking
- `confirmed` - Client confirmed
- `completed` - Session completed
- `cancelled` - Cancelled by either party
- `no_show` - Client didn't show up

### Practice-Based Data Isolation
All client and appointment queries are scoped to the user's `practice_id` via RLS policies. Users can only access data within their own practice.

## Common Development Patterns

### API Client URL Pattern - CRITICAL

**⚠️ IMPORTANT: The `apiClient` already includes `/api` as its base URL!**

When creating API client files in `lib/api/`, **NEVER** include `/api` in the path:

```typescript
// ❌ WRONG - Double /api prefix
export const exampleApi = {
  async getAll() {
    return apiClient.get('/api/examples')  // Becomes /api/api/examples (404!)
  }
}

// ✅ CORRECT - No /api prefix
export const exampleApi = {
  async getAll() {
    return apiClient.get('/examples')  // Becomes /api/examples ✓
  }
}
```

**Rule**: In `lib/api/*-api.ts` files, always use paths like `/resource`, `/resource/${id}`, etc. The `/api` prefix is added automatically by the `apiClient`.

### Clean Architecture Data Flow

**Client Component → API Route → Service → Repository → Database**

```typescript
// 1. Client Component (uses API client)
import { authApi } from '@/lib/api/auth-api'

async function handleSignUp(data) {
  const result = await authApi.signUp(data)
}

// 2. API Route Handler
import { serverAuthService } from '@/lib/services/auth-service'

export async function POST(request: NextRequest) {
  const result = await serverAuthService.signUp(data)
  return successResponse(result.data)
}

// 3. Service (orchestrates business logic)
async signUp(input) {
  // Step 1: Create user
  const user = await authRepository.signUpUser(input)
  // Step 2: Create profile
  const profile = await profileRepository.createProfile({...})
  return { user, profile }
}

// 4. Repository (database access only)
async signUpUser(data) {
  const { data } = await supabase.auth.signUp({...})
  return data
}
```

### When to Use Which Layer

**Client Components:**
```typescript
// ✅ Use API clients
import { authApi } from '@/lib/api/auth-api'
const result = await authApi.signUp(data)

// ❌ Don't call services directly
```

**Server Components / Route Handlers:**
```typescript
// ✅ Use services directly
import { serverAuthService } from '@/lib/services/auth-service'
const result = await serverAuthService.signUp(data)

// ❌ Don't call repositories directly (use services instead)
```

**Services:**
```typescript
// ✅ Orchestrate multiple repositories
const user = await authRepository.signUpUser(data)
const profile = await profileRepository.createProfile(data)

// ✅ Handle business logic and validation
const validated = signUpSchema.parse(input)
```

**Repositories:**
```typescript
// ✅ Only handle database operations
const { data } = await supabase.from('profiles').insert({...})

// ❌ No business logic or validation
```

### Authentication Patterns

**Sign Up Flow (Multi-Step Orchestration):**
```typescript
// Service layer orchestrates user + profile creation
async signUp(input: SignUpInput) {
  // Step 1: Create auth user
  const authResult = await authRepository.signUpUser({
    email: input.email,
    password: input.password,
    fullName: input.fullName,
  })

  // Step 2: Create profile
  const profile = await profileRepository.createProfile({
    id: authResult.user.id,
    email: input.email,
    full_name: input.fullName,
    practice_id: input.practiceId,
    role: input.role,
  })

  return { user: authResult.user, session: authResult.session, profile }
}
```

**Note:** Profile creation is handled in the service layer, NOT by database triggers. This gives full control over the workflow.

### Repository Patterns

Each entity has its own repository following single responsibility:

```typescript
// auth-repository.ts - Auth operations only
class ServerAuthRepository {
  async signUpUser(data) { /* creates user in auth */ }
  async signInWithPassword(credentials) { /* signs in user */ }
  async signOut() { /* signs out user */ }
}

// profile-repository.ts - Profile operations only
class ProfileRepository {
  async createProfile(data) { /* creates profile */ }
  async findByUserId(userId) { /* fetches profile */ }
  async update(userId, data) { /* updates profile */ }
}
```

### Creating a Supabase Client

```typescript
// In Client Components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// In Server Components/Route Handlers
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### Protected Pages

Server Components in `(portal)/` routes automatically get auth via middleware. To get the current user:

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

## Current MVP Status

Phase 1 includes:
- ✅ Authentication (email/password) with clean architecture
- ✅ Practice dashboard with real-time statistics (Feature #5)
- ✅ Client management interface (Feature #2)
- ✅ Appointment scheduling interface (Feature #3)
- ✅ Calendar view for appointments (Feature #4)
- ✅ Enhanced appointment form with calendar picker (Feature #11)
- ✅ Appointment type classification (Feature #10)
- ✅ Settings management
- ✅ Full database integration with Supabase
- ✅ Clean architecture implementation (services, repositories, API clients)

## Implemented Features

### Client Management (Feature #2)
Complete CRUD operations for client records with the following capabilities:

**Pages:**
- `/clients` - List all clients with search and filter (status: active/inactive/archived)
- `/clients/new` - Create new client
- `/clients/[id]` - View client details
- `/clients/[id]/edit` - Edit client information

**Key Components:**
- [client-form.tsx](web/src/components/portal/client-form.tsx) - Reusable form for create/edit
- Form validates: first_name, last_name, email, phone, date_of_birth, status, notes

**Architecture Stack:**
- API Client: [client-api.ts](web/src/lib/api/client-api.ts)
- API Routes: [/api/clients](web/src/app/api/clients)
- Service: [client-service.ts](web/src/lib/services/client-service.ts)
- Repository: [client-repository.ts](web/src/lib/repositories/client-repository.ts)

**Features:**
- Real-time search with debouncing
- Status filtering (active, inactive, archived)
- Archive functionality (soft delete)
- Practice-based data isolation via RLS
- Full client profile management

### Appointment Scheduling (Feature #3)
Complete appointment management system with client linking:

**Pages:**
- `/appointments` - List all appointments with filters
- `/appointments/new` - Schedule new appointment
- `/appointments/[id]` - View appointment details
- `/appointments/[id]/edit` - Edit appointment

**Key Components:**
- [appointment-form.tsx](web/src/components/portal/appointment-form.tsx) - Reusable form with shadcn/ui calendar (Features #10 & #11):
  - Client selection dropdown (loads active clients)
  - **Appointment type selector** (In-Person / Online) - Feature #10
  - Duration selector (15min to 3hrs) - placed first for better UX
  - Interactive calendar with time slot picker (9:00 AM - 6:00 PM, 15-min intervals)
  - Prevents selecting past dates/times
  - Auto-calculated end time display
  - Status management
  - Notes field

**Architecture Stack:**
- API Client: [appointment-api.ts](web/src/lib/api/appointment-api.ts)
- API Routes: [/api/appointments](web/src/app/api/appointments)
- Service: [appointment-service.ts](web/src/lib/services/appointment-service.ts)
- Repository: [appointment-repository.ts](web/src/lib/repositories/appointment-repository.ts)

**Features:**
- **Appointment type classification** (In-Person/Online) - Feature #10
- Status filtering (scheduled, confirmed, completed, cancelled, no_show)
- Date range filtering (today, this week, this month, all)
- Cancel appointment functionality
- Linked to clients (shows client name with appointments)
- Practice-based data isolation via RLS
- Duration-based scheduling (auto-calculates end_time)

**Appointment Types:**
- `in_person` - In-person appointment at practice location
- `online` - Virtual/online appointment (video call, phone, etc.)

**Appointment Statuses:**
- `scheduled` - Initial booking
- `confirmed` - Client confirmed attendance
- `completed` - Appointment finished
- `cancelled` - Cancelled by either party
- `no_show` - Client didn't attend

**Enhanced UX (Feature #11 - Calendar Integration):**
- Replaced separate date/time inputs with integrated shadcn/ui calendar component
- Duration selection moved before date/time (better workflow)
- Visual calendar with disabled past dates
- Time slot picker (15-minute intervals, 9 AM - 6 PM)
- Real-time appointment summary with calculated end time
- Responsive design (side-by-side on desktop, stacked on mobile)

### Calendar View (Feature #4)
Interactive monthly calendar view of appointments:

**Page:**
- `/calendar` - Monthly calendar view showing all appointments

**Key Features:**
- **Month navigation:** Previous/Next month buttons and "Today" shortcut
- **Full calendar grid:** 7-day week view with proper month overflow (shows trailing/leading days from adjacent months)
- **Appointment display:**
  - Shows up to 3 appointments per day with time and client name
  - Color-coded by status (scheduled=blue, confirmed=green, completed=gray, cancelled=red, no_show=orange)
  - Clickable appointment cards linking to appointment details
  - "+X more" indicator when more than 3 appointments exist on a day
- **Today highlighting:** Current date highlighted with blue background
- **Status legend:** Visual reference for appointment status colors
- **Quick access:** "New Appointment" button in header
- **Loading states:** Graceful loading and error handling

**Implementation Details:**
- Client component using React hooks for state management
- Fetches appointments for current month via `appointmentApi.getAll()`
- Automatically refetches when navigating between months
- Calendar algorithm generates proper 6-week grid (42 cells)
- Responsive design with Tailwind CSS
- Directly uses appointment API client (no additional repository/service needed)

**Architecture:**
- Uses existing appointment API client: [appointment-api.ts](web/src/lib/api/appointment-api.ts)
- No new backend services needed (reuses existing appointment infrastructure)
- Direct integration with appointment list and detail pages

**UX Benefits:**
- Visual overview of schedule at a glance
- Easy identification of busy/available days
- Status-based color coding for quick recognition
- Seamless navigation to appointment details

### Practice Dashboard (Feature #5)
Real-time dashboard displaying practice statistics and upcoming appointments:

**Page:**
- `/dashboard` - Main dashboard with key metrics and appointments

**Key Metrics:**
- **Today Fill Rate:** Percentage of confirmed/completed appointments vs total scheduled for today
- **Week Fill Rate:** Percentage of confirmed/completed appointments vs total scheduled for current week (Monday-Sunday)
- **Total Clients:** Count of active clients in the practice
- **Quick Stats:** Today's appointment count and weekly appointment count

**Dashboard Widgets:**
- **Today's Appointments:** Chronological list of all appointments scheduled for today
  - Shows time range, client name, status, appointment type (in-person/online)
  - Color-coded status badges
  - Clickable cards linking to appointment details
  - Empty state when no appointments scheduled
- **Upcoming Appointments:** Mini calendar showing next 7 days of appointments
  - Displays date, time, client name, and status
  - Limited to 10 most recent upcoming appointments
  - Link to full calendar view
- **Quick Actions:** Functional buttons for common tasks
  - New Client (links to `/clients/new`)
  - New Appointment (links to `/appointments/new`)
  - View Calendar (links to `/calendar`)

**Architecture Stack:**
- Types: [dashboard.ts](web/src/types/dashboard.ts)
- API Client: [dashboard-api.ts](web/src/lib/api/dashboard-api.ts)
- API Route: [/api/dashboard](web/src/app/api/dashboard)
- Service: [dashboard-service.ts](web/src/lib/services/dashboard-service.ts)
- Repository: [dashboard-repository.ts](web/src/lib/repositories/dashboard-repository.ts)

**Technical Details:**
- Client component with real-time data fetching via API
- Parallel data loading for statistics, today's appointments, and upcoming appointments
- Fill rates calculated as: `(confirmed + completed) / total non-cancelled * 100`
- Week calculation: Monday (start) to Sunday (end) of current week
- Practice-based data isolation via RLS (only shows data for user's practice)

**Features:**
- Real-time statistics with automatic calculations
- Visual color-coded status indicators
- Responsive grid layout (4-column on desktop, stacked on mobile)
- Loading and error states
- Featured "New Appointment" quick action card with gradient styling
- Seamless navigation to related pages (appointments, clients, calendar)

## Code Style Notes

- Use TypeScript for all new files
- Follow existing component patterns in [web/src/components/](web/src/components/)
- Tailwind utility classes for styling
- Server Components by default; use 'use client' only when needed
- Async Server Components for data fetching

## Architecture Guidelines

**When adding new features:**

1. **Define types** in `src/types/`
2. **Create repository** in `src/lib/repositories/` for database operations
3. **Create service** in `src/lib/services/` for business logic
4. **Create API route** in `src/app/api/` for HTTP endpoints
5. **Create API client** in `src/lib/api/` for frontend calls
6. **Use validation** with Zod schemas in `src/lib/validators/`

**Example: Adding a new "Notes" feature**

```
1. src/types/note.ts - Type definitions
2. src/lib/validators/note-schema.ts - Zod validation schemas
3. src/lib/repositories/note-repository.ts - Database CRUD
4. src/lib/services/note-service.ts - Business logic
5. src/app/api/notes/route.ts - API endpoints
6. src/lib/api/note-api.ts - Frontend HTTP client
7. src/app/(portal)/notes/page.tsx - UI page
```

**Important Notes:**

- ⚠️ Profile creation is handled in the **service layer**, NOT by database triggers
- ⚠️ Always use **services** from Server Components/Route Handlers (never call repositories directly)
- ⚠️ **CRITICAL:** Client Components and hooks must use **API clients** ONLY (never call services/repositories directly)
- ⚠️ Client-side code should NEVER import from `@/lib/services/*` or `@/lib/repositories/*`
- ⚠️ Keep business logic in **services**, not in repositories or components
- ⚠️ Validate all inputs using **Zod schemas** before processing

**Common Mistakes to Avoid:**

```typescript
// ❌ WRONG - Client component importing service
"use client"
import { clientAuthService } from "@/lib/services/auth-service"

// ✅ CORRECT - Client component using API client
"use client"
import { authApi } from "@/lib/api/auth-api"
```

**Why This Matters:**
Importing services in client code causes server-side dependencies (like `next/headers`) to be bundled into the client, resulting in build errors. Always use the API client layer from client-side code.
