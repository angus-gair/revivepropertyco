# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Revive Property Co. is a React + Vite + TypeScript web application for a property services company. It includes:
- Public pages for service showcasing and booking
- AI chat concierge "Riv" for instant quotes
- Admin CRM portal for managing leads, appointments, tasks, and campaigns

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on port 3000, accessible on all interfaces)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run production Express server (serves from dist/ on port 8080)
npm start
```

## Architecture

### Routing
- Uses **HashRouter** (`react-router-dom`) for client-side routing - important for compatibility with nginx reverse proxy
- Routes defined in `App.tsx` with `Layout` wrapping all pages
- `ProtectedRoute` component guards admin pages

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `pages/` | Route components (LandingPage, BookingPage, AdminDashboard, etc.) |
| `components/` | Reusable UI components (ChatWidget, CalendarPicker, etc.) |
| `contexts/` | React Context providers (AuthContext for Supabase auth) |
| `services/` | API integration services (geminiService, crmService, emailService) |
| `lib/` | Supabase client initialization |

### AI Chat Service ("Riv")

The chat widget uses the GLM API (OpenAI-compatible) for natural language interactions:

- **Endpoint**: Configured in `services/geminiService.ts`
- **Model**: `glm-4.7`
- **Environment variables**: `API_URL`, `API_KEY`
- System prompt includes service pricing tiers and conversion guidelines
- Maintains chat history (truncated to last 10 messages)

**Important**: The service is called "geminiService" and "Riv" but actually uses the GLM API (Zhipu AI), not Google Gemini.

### Supabase Integration

- Supabase client initialized in `lib/supabase.ts`
- Used for authentication (admin login) and data persistence (leads, appointments, tasks, campaigns)
- `AuthContext` provides `user`, `session`, `loading`, and `signOut` throughout the app
- Database schema in `db_schema.sql`

### Deployment

Production deployment uses multi-stage Docker build:
1. **Builder stage**: Node 20 Alpine, runs `npm run build`
2. **Production stage**: Nginx Alpine, serves static files with SPA routing support
- Health check on port 80
- Traefik labels for HTTPS routing (domain: `revivepropertyco.au`)
- Connected to `homelab_web` and `traefik-public` networks

### TypeScript Configuration

- Target: ES2022
- Module resolution: bundler
- Path alias: `@/*` maps to `./`

### Key Types (`types.ts`)

- `ServiceType`: Enum for service categories (Pressure Washing, Garden Maintenance, etc.)
- `LeadStatus`: Enum (NEW, CONTACTED, BOOKED, ARCHIVED)
- `Lead`, `Appointment`, `Task`, `Campaign`: Core data models
- `TeleQuoteSession`: Video consultation session tracking
- `AppointmentType`: 'QUOTE' or 'JOB'

## Static Assets

- `public/angus.png`, `public/family.png`: Static images (automatically copied to dist during build)
