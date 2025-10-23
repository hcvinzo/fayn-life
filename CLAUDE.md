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
- To apply migrations: Run the SQL in Supabase project's SQL Editor
- Core tables: `profiles`, `practices`, `clients`, `appointments`
- All tables have Row Level Security (RLS) enabled with practice-based isolation
- **Important:** Profile records are NOT auto-created by triggers. They are created explicitly in the service layer during sign-up.

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
- ✅ Dashboard with statistics
- ✅ Client management interface
- ✅ Appointment scheduling interface
- ✅ Settings management
- 🚧 Calendar placeholder (in development)
- ✅ Full database integration with Supabase
- ✅ Clean architecture implementation (services, repositories, API clients)

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
