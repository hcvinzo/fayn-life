# fayn.life - Practice Management Platform

A comprehensive practice management platform designed for healthcare practitioners, therapists, and wellness professionals.

## Project Overview

**fayn.life** is a modern, cloud-based practice management solution that helps practitioners manage their daily operations efficiently. The platform includes features for client management, appointment scheduling, calendar management, and administrative controls.

### Current Phase

**Phase 1: Practice Management Portal MVP**
- ✅ Core authentication system
- ✅ Dashboard with statistics
- ✅ Client management interface
- ✅ Appointment scheduling interface
- ✅ Settings management
- 🔄 Database integration (in progress)

### Architecture

```
fayn-life/
├── web/                    # Next.js web application
├── mobile/                 # Flutter mobile app (Phase 2)
├── supabase/              # Database migrations and config
├── docs/                  # Documentation
└── README.md
```

## Technology Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage for files

### Deployment
- **Vercel** - Web application hosting
- **Supabase Cloud** - Database and backend services

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fayn.life
   ```

2. **Set up the web application:**
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   ```

3. **Configure Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - Run the database migration in `supabase/migrations/`

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [web/README.md](web/README.md)

## Project Structure

### Web Application (`/web`)

The web application is built with Next.js 14+ using the App Router architecture.

```
web/
├── src/
│   ├── app/                    # Application routes
│   │   ├── (portal)/          # Protected portal routes
│   │   │   ├── dashboard/     # Dashboard page
│   │   │   ├── clients/       # Client management
│   │   │   ├── appointments/  # Appointments
│   │   │   ├── calendar/      # Calendar view
│   │   │   └── settings/      # Settings
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   └── admin/             # Admin panel (Phase 2)
│   │
│   ├── components/
│   │   ├── portal/            # Portal components
│   │   ├── admin/             # Admin components
│   │   └── ui/                # UI components (shadcn)
│   │
│   ├── lib/
│   │   ├── supabase/          # Supabase clients
│   │   ├── utils.ts           # Utilities
│   │   └── constants.ts       # Constants
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── styles/                # Global styles
```

### Database (`/supabase`)

Database schema and migrations for Supabase.

```
supabase/
└── migrations/
    └── 20240116000000_initial_schema.sql
```

## Features

### Phase 1 - MVP (Current)

- ✅ **Authentication**
  - Email/password registration and login
  - Protected routes with middleware
  - Session management

- ✅ **Dashboard**
  - Overview statistics
  - Quick actions
  - Recent activity feed

- ✅ **Client Management**
  - Client list view
  - Search and filter
  - Client status tracking

- ✅ **Appointments**
  - Appointment list view
  - Status management
  - Filter by date and status

- ✅ **Calendar**
  - Calendar placeholder (full integration in Phase 2)

- ✅ **Settings**
  - Profile management
  - Practice settings
  - Notification preferences

### Phase 2 - Planned

- 🔜 **Full Database Integration**
  - Complete CRUD operations
  - Real-time updates
  - Data persistence

- 🔜 **Enhanced Features**
  - Full calendar integration
  - Advanced scheduling
  - Client history and notes
  - File attachments
  - Billing and invoicing

- 🔜 **Admin Panel**
  - User management
  - Practice configuration
  - Analytics and reports
  - Role-based access control

- 🔜 **Mobile Application**
  - Flutter mobile app
  - iOS and Android support
  - Offline functionality

## Development

### Available Scripts

```bash
# Web application
cd web
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run type-check   # Type checking
```

### Code Quality

- **ESLint** - Code linting
- **TypeScript** - Type safety
- **Prettier** - Code formatting (recommended)

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

The database includes the following main tables:

- **profiles** - User profiles extending Supabase auth
- **practices** - Practice/organization information
- **clients** - Client records
- **appointments** - Appointment scheduling

See `supabase/migrations/` for the complete schema.

## Security

- Row Level Security (RLS) enabled on all tables
- Authentication via Supabase Auth
- Protected API routes
- Environment variable protection
- Secure session management

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

The application will automatically deploy on every push to the main branch.

### Supabase Configuration

1. Create a Supabase project
2. Run migrations from `supabase/migrations/`
3. Configure authentication providers
4. Set up storage buckets (if needed)

## Contributing

This is a private project. For questions or support:
- Contact the development team
- Submit issues through the issue tracker

## Roadmap

### Q1 2024
- ✅ Phase 1 MVP completion
- 🔄 Database integration
- 🔜 User testing and feedback

### Q2 2024
- 🔜 Phase 2 feature development
- 🔜 Mobile app development
- 🔜 Beta testing

### Q3 2024
- 🔜 Production launch
- 🔜 Marketing and user acquisition

## License

Proprietary - All rights reserved

## Support

For support or questions, please contact:
- Email: support@fayn.life
- Documentation: [Coming Soon]

---

**Built with ❤️ for practitioners by practitioners**
