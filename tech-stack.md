# fayn.life - Tech Stack Documentation

## Project Overview

**fayn.life** is a comprehensive practice management platform designed to streamline operations for practitioners and their clients. The platform consists of three core modules delivered across two applications:

### Modules
1. **Practice Management Portal** - Core business operations for practitioners
2. **System Admin Panel** - Administrative controls and system management
3. **Client Mobile App** - Client-facing mobile experience

### Applications
- **Web Application** - Houses Practice Management Portal and Admin Panel
- **Mobile Application** - Native Flutter app for clients (Future Phase)

---

## Development Phases

### Phase 1: Practice Management Portal MVP (Current)
Focus on core practice management functionality with essential features:
- User authentication and authorization
- Client management
- Appointment scheduling
- Basic reporting
- Profile management

### Phase 2: System Admin Panel
- User management
- System configuration
- Analytics and monitoring
- Role and permission management

### Phase 3: Client Mobile App
- Client portal access
- Appointment booking
- Communication features
- Document access

---

## Technology Stack

### Web Application

#### Frontend Framework
- **Next.js 14+** (App Router)
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes
  - File-based routing
  - React Server Components

#### UI & Styling
- **React 18+** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
  - Built on Radix UI primitives
  - Fully customizable components
  - Accessible by default

#### Build Tool
- **Vite** - Next-generation frontend tooling
  - Fast HMR (Hot Module Replacement)
  - Optimized builds
  - Native ESM support

#### State Management
- **React Hooks** (useState, useEffect, useContext)
- **Zustand** or **React Query** (recommended for server state)

#### Form Handling
- **React Hook Form** - Performant form validation
- **Zod** - TypeScript-first schema validation

#### Date & Time
- **date-fns** or **Day.js** - Date manipulation

#### HTTP Client
- **Supabase JS Client** - Primary data layer
- **Fetch API** - Standard HTTP requests

### Mobile Application (Future Phase)

#### Framework
- **Flutter 3.x+**
  - Cross-platform (iOS & Android)
  - Single codebase
  - Native performance

#### State Management
- **Riverpod** or **Bloc** (TBD)

#### Local Storage
- **Hive** or **Drift**

#### HTTP Client
- **Supabase Flutter SDK**
- **Dio** - HTTP client

### Backend & Infrastructure

#### Backend as a Service (BaaS)
- **Supabase**
  - **Authentication** - Multi-provider auth (email, OAuth, magic links)
  - **PostgreSQL Database** - Relational database with real-time subscriptions
  - **Row Level Security (RLS)** - Database-level authorization
  - **Edge Functions** - Serverless Deno-based functions
  - **Storage** - File storage with access controls
  - **Realtime** - WebSocket subscriptions for live data

#### Database
- **PostgreSQL** (via Supabase)
  - ACID compliance
  - Complex queries and relationships
  - Full-text search
  - JSON support

#### API Layer
- **Supabase Edge Functions** (Deno runtime)
  - Custom business logic
  - Third-party integrations
  - Scheduled tasks
  - Webhooks

### Development Tools

#### Language
- **TypeScript** - Type-safe JavaScript for web
- **Dart** - For Flutter mobile app

#### Package Management
- **pnpm** or **npm** - Node package manager
- **pub** - Dart package manager (Flutter)

#### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

#### Version Control
- **Git** - Source control
- **GitHub** or **GitLab** - Repository hosting

#### Testing (Recommended)
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

### DevOps & Deployment

#### Hosting
- **Vercel** (recommended for Next.js)
  - Automatic deployments
  - Edge functions
  - Preview deployments
  - Built-in analytics
- **Netlify** (alternative)

#### CI/CD
- **GitHub Actions** or **Vercel** automatic deployments

#### Monitoring (Future)
- **Sentry** - Error tracking
- **Vercel Analytics** - Web vitals
- **Supabase Analytics** - Database insights

---

## Project Structure

```
fayn-life/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities and helpers
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── types/         # TypeScript types
│   │   │   └── styles/        # Global styles
│   │   ├── public/            # Static assets
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.js
│   │   └── next.config.js
│   │
│   └── mobile/                # Flutter application (Future)
│       ├── lib/
│       ├── android/
│       ├── ios/
│       └── pubspec.yaml
│
├── supabase/                  # Supabase configuration
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge functions
│   └── seed.sql              # Seed data
│
├── docs/                      # Documentation
├── .github/                   # GitHub workflows
└── README.md
```

---

## Key Dependencies (Web App)

### Core
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### Supabase
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@supabase/auth-helpers-nextjs": "^0.8.0"
}
```

### UI & Styling
```json
{
  "tailwindcss": "^3.4.0",
  "@radix-ui/react-*": "latest",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### Forms & Validation
```json
{
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0"
}
```

### Utilities
```json
{
  "date-fns": "^2.30.0",
  "lucide-react": "^0.294.0"
}
```

---

## Environment Variables

### Web Application (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Getting Started (Phase 1)

### Prerequisites
- Node.js 18+ and pnpm/npm
- Supabase account and project
- Git

### Initial Setup

1. **Create Next.js Application**
   ```bash
   npx create-next-app@latest web --typescript --tailwind --app
   cd web
   ```

2. **Install shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   ```

3. **Install Supabase Client**
   ```bash
   pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

4. **Configure Supabase**
   - Set up environment variables
   - Initialize Supabase client
   - Configure authentication

5. **Set Up Database Schema**
   - Create tables in Supabase
   - Set up Row Level Security policies
   - Create necessary indexes

### Development Workflow
```bash
# Start development server
pnpm dev

# Run linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## Architecture Decisions

### Why This Stack?

**Next.js + React**
- Modern React framework with excellent DX
- Built-in optimization and performance
- SEO-friendly with SSR/SSG
- Large ecosystem and community

**Tailwind CSS + shadcn/ui**
- Rapid UI development
- Consistent design system
- Highly customizable
- No runtime CSS-in-JS overhead

**Supabase**
- Rapid backend development
- Real-time capabilities out of the box
- Built-in authentication
- PostgreSQL power with modern API
- Cost-effective for MVP

**Monorepo Structure**
- Share types and utilities
- Consistent tooling
- Easier dependency management
- Future scalability for mobile app

---

## Security Considerations

### Authentication & Authorization
- JWT-based authentication via Supabase
- Row Level Security (RLS) for database access
- Role-based access control (RBAC)
- Secure session management

### Data Protection
- HTTPS only in production
- Environment variable management
- SQL injection protection via parameterized queries
- XSS protection via React's built-in escaping

### Best Practices
- Regular dependency updates
- Security audits with `npm audit`
- Secure API key management
- Input validation on client and server

---

## Performance Optimization

### Web Application
- Code splitting via Next.js dynamic imports
- Image optimization with Next.js Image component
- Lazy loading components
- React Server Components for reduced JS bundle
- Edge caching with Vercel

### Database
- Proper indexing strategy
- Query optimization
- Connection pooling via Supabase
- Caching strategies with React Query

---

## Future Considerations

### Scalability
- Migrate to microservices if needed
- Implement caching layer (Redis)
- CDN for static assets
- Database read replicas

### Features
- Real-time notifications
- Advanced analytics
- Third-party integrations
- Multi-tenancy support
- Internationalization (i18n)

### Mobile App Integration
- Shared API contracts
- Consistent authentication flow
- Offline-first capabilities
- Push notifications

---

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

### Community
- Next.js Discord
- Supabase Discord
- Stack Overflow

---

## Version History

- **v1.0.0** - Initial tech stack documentation
- Phase 1: Practice Management Portal MVP (Current)

---

*Last Updated: October 2025*