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
- To apply migrations: Run the SQL in Supabase project's SQL Editor
- Core tables: `profiles`, `practices`, `clients`, `appointments`
- All tables have Row Level Security (RLS) enabled with practice-based isolation

## Architecture

### Next.js App Router Structure

The web app uses Next.js 14+ App Router with route groups:

- `app/(auth)/` - Public authentication pages (login, register)
- `app/(portal)/` - Protected practitioner portal pages (dashboard, clients, appointments, calendar, settings)
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

2. **server.ts** - Server client for Server Components/Actions
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

### Creating a Supabase Client

```typescript
// In Client Components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// In Server Components/Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### Database Operations

Always use the TypeScript types from `@/types/database`:

```typescript
import type { Database } from '@/types/database'

// Insert
const { data, error } = await supabase
  .from('clients')
  .insert({ ... })

// Query with practice_id filtering (handled by RLS)
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('status', 'active')
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
- Authentication (email/password)
- Dashboard with statistics
- Client management interface
- Appointment scheduling interface
- Settings management
- Calendar placeholder

Database integration is in progress. Currently using mock data for development.

## Code Style Notes

- Use TypeScript for all new files
- Follow existing component patterns in [web/src/components/](web/src/components/)
- Tailwind utility classes for styling
- Server Components by default; use 'use client' only when needed
- Async Server Components for data fetching
