# Clean Architecture Implementation

This document describes the clean architecture implementation for the fayn.life project, completed as part of **Issue #7**.

## Overview

The application now follows a layered clean architecture pattern that completely separates the frontend from backend logic. This makes the codebase database-agnostic, testable, and maintainable.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Frontend (UI Layer)                 │
│  React Components, Pages, Forms             │
│  Location: app/(portal)/, app/(auth)/       │
└───────────────┬─────────────────────────────┘
                │ HTTP Requests (fetch)
┌───────────────▼─────────────────────────────┐
│         Frontend API Client                 │
│  Type-safe HTTP wrapper                     │
│  Location: lib/api/                         │
└───────────────┬─────────────────────────────┘
                │ Calls
┌───────────────▼─────────────────────────────┐
│         API Routes (Entry Point)            │
│  Next.js API Routes: /api/*                 │
│  Location: app/api/                         │
└───────────────┬─────────────────────────────┘
                │ Calls
┌───────────────▼─────────────────────────────┐
│       Services (Business Logic)             │
│  Validation, Authorization, Logic           │
│  Location: lib/services/                    │
└───────────────┬─────────────────────────────┘
                │ Uses
┌───────────────▼─────────────────────────────┐
│      Repositories (Data Access)             │
│  CRUD operations, Queries                   │
│  Location: lib/repositories/                │
└───────────────┬─────────────────────────────┘
                │ Interacts with
┌───────────────▼─────────────────────────────┐
│    Database Client (Supabase)               │
│  ONLY layer that imports Supabase           │
│  Location: lib/db/                          │
└─────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Database Client Layer (`lib/db/`)

**Purpose:** Single source of truth for database connection.

**Files:**
- `client.ts` - Supabase singleton client (ONLY file that imports `@supabase/supabase-js`)
- `types.ts` - Database type exports

**Key Points:**
- This is the ONLY place that should import Supabase
- Provides singleton pattern for database client
- Easy to replace Supabase by only changing this layer

### 2. Repository Layer (`lib/repositories/`)

**Purpose:** Handle all database operations and queries.

**Files:**
- `base-repository.ts` - Abstract base class with common CRUD operations
- `profile-repository.ts` - Profile-specific database operations
- `*-repository.ts` - Other entity repositories (to be added)

**Key Points:**
- One repository per entity
- Extends BaseRepository for common operations
- Contains all SQL/query logic
- No business logic here (that belongs in services)

**Example:**
```typescript
// In your service
import { profileRepository } from '@/lib/repositories/profile-repository'

const profile = await profileRepository.findByUserId(userId)
```

### 3. Service Layer (`lib/services/`)

**Purpose:** Business logic, validation, and authorization.

**Files:**
- `profile-service.ts` - Profile business logic
- `*-service.ts` - Other entity services (to be added)

**Key Points:**
- Validates input using Zod schemas
- Enforces business rules
- Checks authorization
- Calls repositories for data access
- No direct database access

**Example:**
```typescript
// In your API route
import { profileService } from '@/lib/services/profile-service'

const profile = await profileService.updateProfile(userId, data, requestingUserId)
```

### 4. API Routes Layer (`app/api/`)

**Purpose:** HTTP endpoints for frontend consumption.

**Files:**
- `profile/route.ts` - Profile endpoints
- `profile/[id]/route.ts` - Profile by ID endpoints
- Other entity endpoints (to be added)

**Key Points:**
- RESTful design
- Handles authentication
- Parses requests
- Calls services
- Returns standardized responses

**Example:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const profile = await profileService.getProfile(user.id, user.id)
    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 5. Frontend API Client (`lib/api/`)

**Purpose:** Frontend HTTP client for making API calls.

**Files:**
- `client.ts` - Base HTTP client wrapper
- `profile-api.ts` - Profile API methods
- `*-api.ts` - Other entity API clients (to be added)

**Key Points:**
- Type-safe requests/responses
- Centralized error handling
- NO Supabase imports in frontend
- All API calls go through this layer

**Example:**
```typescript
// In your React component
import { profileApi } from '@/lib/api/profile-api'

const profile = await profileApi.getCurrent()
const updated = await profileApi.update({ full_name: 'New Name' })
```

## Supporting Systems

### Error Handling (`lib/utils/errors.ts`, `lib/utils/response.ts`)

Custom error classes for different scenarios:
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `DatabaseError` (500)

Standardized API responses:
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { message: "...", code: "...", details: {...} } }
```

### Validation (`lib/validators/`)

Zod schemas for input validation:
- `profile-schema.ts`
- `client-schema.ts`
- `appointment-schema.ts`

### Types (`types/`)

Domain types for entities:
- `api.ts` - Common API types
- `profile.ts` - Profile domain types
- `client.ts` - Client domain types
- `appointment.ts` - Appointment domain types

## Usage Examples

### Frontend Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { profileApi } from '@/lib/api/profile-api'
import type { Profile } from '@/types/profile'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await profileApi.getCurrent()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updates: UpdateProfileDto) => {
    try {
      const updated = await profileApi.update(updates)
      setProfile(updated)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  // NO Supabase code here! Just clean API calls
  return <div>{/* UI code */}</div>
}
```

## Adding a New Entity

To add support for a new entity (e.g., "Session"), follow these steps:

### 1. Define Types (`types/session.ts`)

```typescript
import type { Database } from './database'

export type Session = Database['public']['Tables']['sessions']['Row']

export type CreateSessionDto = {
  client_id: string
  start_time: string
  // ... other fields
}

export type UpdateSessionDto = Partial<CreateSessionDto>
```

### 2. Create Validation Schema (`lib/validators/session-schema.ts`)

```typescript
import { z } from 'zod'

export const createSessionSchema = z.object({
  client_id: z.string().uuid(),
  start_time: z.string().datetime(),
  // ... other fields
})

export const updateSessionSchema = createSessionSchema.partial()
```

### 3. Create Repository (`lib/repositories/session-repository.ts`)

```typescript
import { BaseRepository } from './base-repository'
import type { Session, CreateSessionDto } from '@/types/session'

class SessionRepository extends BaseRepository<'sessions'> {
  constructor() {
    super('sessions')
  }

  // Add entity-specific methods
  async findByClientId(clientId: string): Promise<Session[]> {
    return this.findAll({ client_id: clientId } as any)
  }
}

export const sessionRepository = new SessionRepository()
```

### 4. Create Service (`lib/services/session-service.ts`)

```typescript
import { sessionRepository } from '@/lib/repositories/session-repository'
import { createSessionSchema } from '@/lib/validators/session-schema'
import type { Session, CreateSessionDto } from '@/types/session'

class SessionService {
  async createSession(data: CreateSessionDto, practitionerId: string): Promise<Session> {
    // Validate
    const validated = createSessionSchema.parse(data)

    // Business logic here

    // Create
    return await sessionRepository.create(validated as any)
  }

  // ... other methods
}

export const sessionService = new SessionService()
```

### 5. Create API Routes (`app/api/sessions/route.ts`)

```typescript
import { NextRequest } from 'next/server'
import { sessionService } from '@/lib/services/session-service'
import { successResponse, handleApiError } from '@/lib/utils/response'
import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError } from '@/lib/utils/errors'

async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new UnauthorizedError()
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const sessions = await sessionService.getAll(user.id)
    return successResponse(sessions)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const body = await request.json()
    const session = await sessionService.createSession(body, user.id)
    return successResponse(session, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 6. Create Frontend API Client (`lib/api/sessions-api.ts`)

```typescript
import { apiClient } from './client'
import type { Session, CreateSessionDto, UpdateSessionDto } from '@/types/session'

export const sessionsApi = {
  getAll: () => apiClient.get<Session[]>('/sessions'),
  getById: (id: string) => apiClient.get<Session>(`/sessions/${id}`),
  create: (data: CreateSessionDto) => apiClient.post<Session>('/sessions', data),
  update: (id: string, data: UpdateSessionDto) =>
    apiClient.put<Session>(`/sessions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sessions/${id}`),
}
```

### 7. Use in Frontend

```typescript
import { sessionsApi } from '@/lib/api/sessions-api'

const sessions = await sessionsApi.getAll()
const newSession = await sessionsApi.create({ client_id: '...', ... })
```

## Benefits

✅ **Database-Agnostic** - Replace Supabase by only changing repository layer (1 layer vs 100+ files)
✅ **Testable** - Easy to mock services and repositories
✅ **Maintainable** - Clear separation of concerns
✅ **Type-Safe** - TypeScript throughout all layers
✅ **Secure** - No direct database access from frontend
✅ **Scalable** - Can extract API to separate backend later
✅ **Professional** - Production-ready architecture

## Migration from Old Code

If you have existing code that uses Supabase directly in components:

**Before:**
```typescript
// ❌ BAD: Direct Supabase usage in component
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('profiles').select('*').eq('id', userId)
```

**After:**
```typescript
// ✅ GOOD: Use API client
import { profileApi } from '@/lib/api/profile-api'

const profile = await profileApi.getById(userId)
```

## Important Rules

1. **NEVER import Supabase in frontend components** - Always use API clients
2. **NEVER import Supabase in services** - Always use repositories
3. **NEVER put business logic in repositories** - That belongs in services
4. **NEVER put database queries in services** - That belongs in repositories
5. **ALWAYS validate input in services** - Use Zod schemas
6. **ALWAYS use standardized responses** - Use `successResponse()` and `handleApiError()`

## Testing

This architecture makes testing much easier:

```typescript
// Mock the repository in service tests
jest.mock('@/lib/repositories/profile-repository')

// Mock the service in API route tests
jest.mock('@/lib/services/profile-service')

// Mock the API client in component tests
jest.mock('@/lib/api/profile-api')
```

## Next Steps

To complete the clean architecture migration:

1. ✅ Profile entity fully implemented (Issue #7)
2. ⏳ Implement Client entity following the same pattern (Issue #2)
3. ⏳ Implement Appointment entity following the same pattern (Issue #3)
4. ⏳ Refactor existing components to use API clients instead of Supabase
5. ⏳ Add comprehensive error handling throughout
6. ⏳ Add logging and monitoring
7. ⏳ Add unit tests for each layer

## Resources

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)
