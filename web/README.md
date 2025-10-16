# fayn.life - Practice Management Platform

A modern practice management platform built with Next.js and Supabase.

## Tech Stack

- **Frontend:** Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** shadcn/ui
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository and navigate to the web directory:

```bash
cd web
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional for development)

### Setting up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migrations (coming soon)
3. Copy your project credentials to `.env.local`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
web/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (portal)/        # Portal routes (protected)
│   │   ├── (auth)/          # Auth routes (login, register)
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── portal/          # Portal-specific components
│   │   ├── admin/           # Admin-specific components (future)
│   │   └── ui/              # shadcn UI components
│   ├── lib/
│   │   ├── supabase/        # Supabase clients
│   │   ├── utils.ts         # Utility functions
│   │   └── constants.ts     # App constants
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── styles/              # Global styles
├── public/                   # Static files
└── [config files]
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Features

### Phase 1 - MVP (Current)

- ✅ User authentication (login/register)
- ✅ Dashboard with overview statistics
- ✅ Client management (list view)
- ✅ Appointment management (list view)
- ✅ Calendar view (placeholder)
- ✅ Settings page

### Phase 2 - Coming Soon

- Database integration with Supabase
- Full CRUD operations for clients and appointments
- Calendar integration
- Admin panel
- User roles and permissions
- Real-time updates

## Authentication

The app uses Supabase Auth with the following flow:

1. Users can register or login via email/password
2. Protected routes are managed by Next.js middleware
3. Session state is handled by Supabase Auth helpers
4. User profiles are stored in the `profiles` table

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

```bash
npm run build
```

## Contributing

This is a private project. For issues or questions, contact the development team.

## License

Proprietary - All rights reserved
