<!-- generated-by: gsd-doc-writer -->
# Revive Property Co.

A React + Vite + TypeScript web application for Revive Property Co., featuring an AI-powered concierge "Riv" and a comprehensive admin CRM portal for managing leads, appointments, tasks, and campaigns.

## Installation

```bash
npm install
```

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Preview production build:**
   ```bash
   npm run preview
   ```

4. **Run production server:**
   ```bash
   npm start
   ```
   Serves the built application from `dist/` on port 8080

## Usage Examples

### AI Chat Concierge "Riv"

The application includes an AI-powered chat widget that provides instant quotes and service information. The chat uses the Z.AI Dedicated Coding PAAS with the `glm-4.7` model optimized for ultra-fast responses (<2500ms).

### Admin Dashboard

Access the admin dashboard to:
- Manage leads (status: NEW, CONTACTED, BOOKED, ARCHIVED)
- Schedule appointments (QUOTE or JOB types)
- Create and track tasks
- Launch email/SMS campaigns
- Manage hipages leads integration

Navigate to `/login` to access the admin portal with authenticated credentials.

### Service Booking

Customers can book services through:
1. **Direct booking flow**: `/book` - Complete service booking with date/time selection
2. **Service-specific pages**: Individual pages for Pressure Washing, Garden Maintenance, Pool Maintenance, Rubbish Removal, and Re-grouting services

### Customer Portal

Customers can access their own portal at:
- `/customer/login` - Customer login
- `/customer/dashboard` - View quotes, documents, and profile
- `/customer/quotes` - Approve or reject quotes
- `/customer/documents` - Access uploaded documents

## Key Features

- **AI Concierge "Riv"**: High-speed specialized assistant using Z.AI API
- **Architectural Intake Protocol**: Refined 2-step booking flow for precision service calibration
- **Universal TeleQuote**: WebRTC-based video assessment without requiring apps or accounts
- **Industrial Dashboard**: High-density grid-driven UI with real-time data synchronization
- **hipages Integration**: Automated lead scraping and CRM synchronization
- **Customer Portal**: Self-service portal for quote approval and document management
- **Multi-service Support**: Pressure Washing, Garden Maintenance, Pool Maintenance, Rubbish Removal, Re-grouting

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (PostCSS)
- **Routing**: React Router DOM (HashRouter for nginx compatibility)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Authentication**: JWT (admin), Supabase (customer portal)
- **AI**: Z.AI Dedicated Coding PAAS (glm-4.7 model)
- **Testing**: Playwright
- **Deployment**: Docker multi-stage build with nginx

## Database Management

Run database migrations:

```bash
npm run migrate         # Run all pending migrations
npm run migrate:up     # Run next migration
npm run migrate:down   # Rollback last migration
npm run migrate:status # Show migration status
```

## Testing

Run end-to-end tests with Playwright:

```bash
npx playwright test
```

## Contributing

See CONTRIBUTING.md for guidelines.

## License

See LICENSE file for details.
