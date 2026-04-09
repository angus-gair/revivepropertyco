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

The chat widget uses the Z.AI Dedicated Coding PAAS for ultra-fast natural language interactions:

- **Endpoint**: `https://api.z.ai/api/coding/paas/v4/chat/completions`
- **Model**: `glm-4.7` (Optimized for specialized reasoning and code)
- **Performance**: `thinking: { type: 'disabled' }` enabled for near-instant responses (<2500ms).
- **Environment variables**: `API_URL`, `API_KEY`
- System prompt: Calibrated for Canberra ACT suburbs and industrial pricing modules.
- Context: Truncated to 10-message sliding window.

### Styling & UI Framework

- **System**: **Tailwind CSS v4**
- **Build**: Local PostCSS integration via `@tailwindcss/postcss`.
- **Global Entry**: `index.css` using `@import "tailwindcss";`.
- **Design Philosophy**: High-density architectural "Blueprint" aesthetic. Zero-scroll success viewport containment.

### Deployment

Production deployment uses multi-stage Docker build:
1. **Builder stage**: Node 20 Alpine, runs `npm run build` (Vite + PostCSS)
2. **Production stage**: Nginx Alpine, serves static files with SPA routing support
- Health check on port 80
- Traefik labels for HTTPS routing (domain: `revivepropertyco.au`)
- Automated validation via `final-booking-test.sh` and `test-riv-performance.cjs`.

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
