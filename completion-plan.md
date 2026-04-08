# Revive Property Co. - Production Readiness Completion Plan

> **Status Audit Date**: 2026-03-12
> **Current Completion**: ~75%
> **Estimated Time to Production**: 3-5 days
> **Database**: Local PostgreSQL (homelab instance)
> **Email**: Resend (to be configured)

---

## Executive Summary

The website has solid frontend infrastructure with a booking flow, admin dashboard, and AI chat. However, **critical production gaps exist**:

- Emails are mock (console logs only) — no real confirmations sent
- No backend API — static site cannot reliably process bookings
- Database not connected — app runs in demo mode with localStorage only
- No business notifications — owner receives no alerts when bookings come in
- No race-condition protection on bookings
- Database schema file is corrupted/empty

**Key Risk**: A customer can fill the form, click submit, see a success message, but nothing is actually saved or communicated to the business.

---

## Gap Analysis

| Component | Status | Issues | Priority |
|-----------|--------|---------|----------|
| Booking Form | 80% | Validates and collects data, but no robust backend integration | HIGH |
| Email Service | 0% | Mock implementation only — console.log instead of real emails | CRITICAL |
| Availability Lockout | 40% | Client-side only, race conditions possible | HIGH |
| CRM Storage | 20% | localStorage fallback only, PostgreSQL not connected | CRITICAL |
| Business Notifications | 0% | No alerts to owner when booking received | CRITICAL |
| Admin Dashboard | 85% | UI complete, but data source unreliable without DB | MEDIUM |
| Chat Widget | 90% | Working with GLM API, stores session in localStorage | LOW |
| Authentication | 40% | Supabase integration exists but not configured, needs local auth | HIGH |

---

## Homelab Infrastructure

### Existing PostgreSQL Database

The homelab already has a PostgreSQL instance running:

| Setting | Value |
|---------|-------|
| **Host** | `postgres` (internal Docker network) |
| **Port** | 5432 |
| **Username** | `homelab` |
| **Password** | `BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg` |
| **Volume** | `homelab_postgres_data` |
| **Source** | `/var/lib/docker/volumes/homelab_postgres_data/_data` |

**Action**: Create a new database `revivepropertyco` in this instance for the application data.

### Email Options

| Option | Details |
|--------|---------|
| **Resend** (Recommended) | Simple API, 3,000 free emails/month, need to create account |
| **mail.ajinsights.com.au** | Existing mail server, credentials available in Bitwarden |
| **SMTP via local** | If mail.ajinsights.com.au supports outbound SMTP |

**Decision**: Start with Resend for simplicity; fallback to mail.ajinsights.com.au SMTP if needed.

---

## Recommended Architecture (Simplest Robust Solution)

### Frontend (Existing + Minor Changes)
- React + Vite + TypeScript (no changes)
- HashRouter (no changes)
- Form validation enhanced with error display

### Backend (New: Minimal Express API)
```
/server
  ├── /api
  │   ├── bookings.js      - Handle booking submissions
  │   ├── availability.js  - Check real-time slots
  │   ├── auth.js          - Simple admin authentication
  │   └── health.js        - Health check endpoint
  ├── /lib
  │   ├── email.js         - Resend/SMTP wrapper
  │   ├── database.js      - PostgreSQL connection with retry logic
  │   └── queue.js         - Simple in-memory queue for failures
  └── index.js            - Express app setup
```

### Database (Local PostgreSQL)

```
Connection: postgresql://homelab:password@postgres:5432/revivepropertyco

Tables:
  - leads (id, firstName, lastName, email, phone, address,
          serviceInterest, notes, status, createdAt, statusHistory)
  - appointments (id, leadId, serviceType, type, date,
                  timeSlot, notes, status)
  - touchpoints (id, leadId, type, timestamp, metadata) - NEW
  - quotes (id, leadId, amount, status, validUntil,
            notes, createdAt) - NEW
  - admin_users (id, username, password_hash, created_at) - NEW
```

---

## End-State Workflow

### Customer Journey (Happy Path)

```
1. Customer navigates to /book
2. Selects service type (QUOTE or JOB)
3. Picks date and time slot from real-time availability
4. Fills contact details and property address
5. Clicks "Finalize Manifest & Dispatch"
6. ┌─────────────────────────────────────────────────────────────┐
7. │  Backend receives POST /api/bookings                      │
8. │  → Validates input                                         │
9. │  → Checks availability with DB lock (UNIQUE constraint)      │
10. │  → Creates lead record (status: NEW → BOOKED)               │
11. │  → Creates appointment record                              │
12. │  → Creates touchpoint record (timestamp, source)             │
13. │  → Sends confirmation email to customer                    │
14. │  → Sends notification email to business owner                │
15. │  → Returns success with booking reference                    │
16. └─────────────────────────────────────────────────────────────┘
17. UI shows success page with booking reference
18. Business owner receives email with full details
19. Business owner logs into admin to manage
```

### Failure Path (What Should Happen)

```
1. Customer submits booking
2. Database connection fails
3. → Request is queued for retry
4. → Customer sees "Processing..." message with timeout
5. → Backend stores backup to localStorage as fallback
6. → Customer notified that request was received
7. → System auto-retries DB connection
8. → Once restored, data syncs to CRM
```

---

## Modular Task Breakdown

### Module 1: Database Setup
**Purpose**: Connect to existing PostgreSQL and create schema

| Aspect | Details |
|--------|---------|
| Files | `db_schema.sql` (recreate), `.env` (create) |
| Backend | Connect to existing postgres container |
| Frontend | None |
| DB | Create database `revivepropertyco`, create all tables |
| Edge Cases | Connection refused, permissions, table creation failures |
| Dependencies | None (infrastructure exists) |
| Definition of Done | - Database `revivepropertyco` created<br>- All 5 tables created (leads, appointments, touchpoints, quotes, admin_users)<br>- `.env` file with DATABASE_URL<br>- Can query tables via psql |
| Test Plan | 1. Connect to postgres container<br>2. Verify database and tables exist<br>3. Test insert via psql<br>4. Verify UNIQUE constraint works on appointments |

---

### Module 2: Email Integration
**Purpose**: Send real confirmations and notifications

| Aspect | Details |
|--------|---------|
| Files | `services/emailService.ts`, `server/lib/email.js` |
| Backend | Implement Resend API calls |
| Frontend | None |
| DB | None |
| Edge Cases | Email bounces, rate limits, API down |
| Dependencies | Resend API key (create account) |
| Definition of Done | - `sendConfirmationEmail` calls real API<br>- `sendBusinessNotification` function created<br>- Email templates for both customer and owner<br>- Error handling with fallback to log |
| Test Plan | 1. Create test booking<br>2. Verify customer email received<br>3. Verify owner notification received<br>4. Check email content and formatting<br>5. Test with invalid email (should log error) |

---

### Module 3: Backend API - Bookings
**Purpose**: Reliable booking processing server-side

| Aspect | Details |
|--------|---------|
| Files | `server/api/bookings.js`, `server/index.js`, `server/lib/database.js` |
| Backend | Express POST endpoint `/api/bookings` |
| Frontend | Update `BookingPage.tsx` to fetch instead of direct service calls |
| DB | Write to leads, appointments, touchpoints |
| Edge Cases | Double-booking, validation errors, DB connection failure |
| Dependencies | Express, pg (PostgreSQL client) |
| Definition of Done | - POST /api/bookings accepts and validates data<br>- Atomic transaction: lead + appointment + touchpoint<br>- Returns booking reference<br>- Handles errors with proper HTTP codes<br>- Server runs on port 8080 |
| Test Plan | 1. POST valid booking data<br>2. Verify all 3 records created in DB<br>3. Try double-booking same slot<br>4. Verify second request fails<br>5. Send invalid data and verify 400 response |

---

### Module 4: Backend API - Availability
**Purpose**: Real-time slot availability with locking

| Aspect | Details |
|--------|---------|
| Files | `server/api/availability.js` |
| Backend | GET endpoint `/api/availability?date=YYYY-MM-DD` |
| Frontend | Update `CalendarPicker.tsx` to call API |
| DB | Query appointments table for date |
| Edge Cases | Past dates, invalid date format |
| Dependencies | None |
| Definition of Done | - Returns available time slots<br>- Filters out CONFIRMED appointments<br>- Closes past dates<br>- Response format: `{ date: "2026-03-15", slots: ["08:00", "09:00"] }` |
| Test Plan | 1. Request availability for date with no bookings<br>2. Verify all slots returned<br>3. Book a slot<br>4. Request availability again<br>5. Verify booked slot excluded |

---

### Module 5: Backend API - Auth
**Purpose**: Simple admin authentication

| Aspect | Details |
|--------|---------|
| Files | `server/api/auth.js`, `server/lib/auth.js` (new) |
| Backend | JWT-based authentication for admin endpoints |
| Frontend | Update `AuthContext` to use new API |
| DB | Check admin_users table |
| Edge Cases | Token expiry, password reset |
| Dependencies | jsonwebtoken, bcrypt |
| Definition of Done | - Admin can login via `/api/auth/login`<br>- Returns JWT token<br>- Token validates on protected routes<br>- Passwords hashed with bcrypt |
| Test Plan | 1. Login with valid credentials<br>2. Verify token returned<br>3. Use token to access protected route<br>4. Test with invalid credentials |

---

### Module 6: Frontend - Booking Form Integration
**Purpose**: Connect form to new backend

| Aspect | Details |
|--------|---------|
| Files | `pages/BookingPage.tsx` |
| Backend | None |
| Frontend | Replace direct crmService calls with fetch to /api/bookings |
| DB | None |
| Edge Cases | Network timeout, server error, partial success |
| Dependencies | Module 3 must be complete |
| Definition of Done | - Form submits to /api/bookings<br>- Loading state during submission<br>- Error messages displayed to user<br>- Success page shows booking reference<br>- Form resets after success |
| Test Plan | 1. Fill and submit booking form<br>2. Verify loading state<br>3. Verify success page with reference<br>4. Check database for records<br>5. Simulate server error, verify error message |

---

### Module 7: Touchpoint Tracking
**Purpose**: Track all customer interactions for CRM funnel

| Aspect | Details |
|--------|---------|
| Files | `services/touchpointService.ts` (new), server/api/touchpoints.js (new) |
| Backend | Track: chat messages, page visits, form views, bookings |
| Frontend | Add tracking to ChatWidget, BookingPage, LandingPage |
| DB | Write to touchpoints table |
| Edge Cases | Privacy concerns, data volume |
| Dependencies | Module 1 (database) |
| Definition of Done | - TouchpointService with type definitions<br>- Tracking on key user actions<br>- Admin dashboard shows touchpoint timeline<br>- Lead detail view shows touchpoint history |
| Test Plan | 1. Visit landing page<br>2. Open chat widget<br>3. Navigate to booking page<br>4. Complete booking<br>5. Check admin lead detail for all touchpoints |

---

### Module 8: Quote Management
**Purpose**: Track quotes and conversion

| Aspect | Details |
|--------|---------|
| Files | `types.ts` (add Quote type), `services/quoteService.ts` (new), pages/AdminDashboard.tsx (update) |
| Backend | CRUD for quotes, link to leads |
| Frontend | Quote creation/edit UI in admin |
| DB | Quotes table with status tracking |
| Edge Cases | Quote expiry, revision history |
| Dependencies | Module 1 (database) |
| Definition of Done | - Quote type in types.ts<br>- QuoteService for CRUD<br>- Admin can create/edit/delete quotes<br>- Quote status workflow: DRAFT → SENT → ACCEPTED/REJECTED<br>- Lead shows related quote |
| Test Plan | 1. Create quote for existing lead<br>2. Edit quote amount<br>3. Change status to SENT<br>4. Verify lead detail shows quote<br>5. Delete quote |

---

### Module 9: Failure Handling & Queue
**Purpose**: No lost bookings, graceful degradation

| Aspect | Details |
|--------|---------|
| Files | `server/lib/queue.js` (new), `pages/BookingPage.tsx` (update) |
| Backend | In-memory queue for failed DB writes, retry logic |
| Frontend | Show appropriate message on failure |
| DB | None |
| Edge Cases | Server restart, long outage |
| Dependencies | Module 3 (bookings API) |
| Definition of Done | - Failed writes queued in memory<br>- Automatic retry with exponential backoff<br>- Frontend shows "We received your request" on error<br>- Admin view of queued items<br>- Persisted queue to file on shutdown |
| Test Plan | 1. Simulate DB connection failure<br>2. Submit booking<br>3. Verify queued locally<br>4. Restore DB connection<br>5. Verify item processed from queue |

---

### Module 10: Admin Notifications
**Purpose**: Alert business to new bookings and urgent items

| Aspect | Details |
|--------|---------|
| Files | `server/lib/email.js` (update), `services/notificationService.ts` (new) |
| Backend | Email triggers for: new booking, new chat, urgent tasks |
| Frontend | Optional browser notifications for admin |
| DB | None |
| Edge Cases | Spam prevention, notification fatigue |
| Dependencies | Module 2 (email) |
| Definition of Done | - New booking triggers owner email<br>- New chat message triggers email summary<br>- Urgent tasks (due today) email<br>- Notification preferences in settings |
| Test Plan | 1. Create booking as customer<br>2. Verify owner email received<br>3. Send chat message<br>4. Verify owner receives summary<br>5. Mark notification as read |

---

## Recommended Implementation Sequence

### Phase 1: Foundation (Day 1)
1. Module 1: Database Setup (Create database in existing PostgreSQL)
2. Module 2: Email Integration (Resend setup)

**Goal**: Data storage and email capability working

---

### Phase 2: Core Booking Flow (Day 2)
3. Module 3: Backend API - Bookings
4. Module 4: Backend API - Availability
5. Module 5: Backend API - Auth
6. Module 6: Frontend - Booking Form Integration

**Goal**: End-to-end booking with real backend and auth

---

### Phase 3: CRM Enhancement (Day 3-4)
7. Module 7: Touchpoint Tracking
8. Module 8: Quote Management
9. Module 10: Admin Notifications

**Goal**: Complete CRM funnel and notifications

---

### Phase 4: Reliability (Day 4-5)
10. Module 9: Failure Handling & Queue
11. Testing & QA
12. Deployment & Launch

**Goal**: Production-ready with no data loss

---

## Minimum CRM/Data Model

```sql
-- Create database first: CREATE DATABASE revivepropertyco;

-- Leads table
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  service_interest TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, BOOKED, ARCHIVED
  created_at BIGINT NOT NULL,
  status_history JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);

-- Appointments table
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  type TEXT NOT NULL, -- 'QUOTE' or 'JOB'
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  time_slot TEXT NOT NULL, -- 'HH:MM'
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, COMPLETED, CANCELLED,
  created_at BIGINT NOT NULL,
  UNIQUE(date, time_slot) WHERE status = 'CONFIRMED' -- Prevent double-booking
);

CREATE INDEX idx_appointments_date ON appointments(date, status);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);

-- Touchpoint tracking
CREATE TABLE touchpoints (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'PAGE_VIEW', 'CHAT_MESSAGE', 'FORM_VIEW', 'BOOKING', 'EMAIL'
  timestamp BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_touchpoints_lead ON touchpoints(lead_id, timestamp);

-- Quotes
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
  valid_until TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quotes_lead ON quotes(lead_id);

-- Admin users
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Reliability/Failure Handling Approach

### Strategy: Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│                    User Submits Form                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Validate Input    │ ──┐
        └──────────┬───────────┘   │
                   │               │
                   ▼               │
        ┌──────────────────────┐   │
        │   Try DB Write      │   │
        │   (with lock)       │   │
        └──────────┬───────────┘   │
                   │               │
          ┌────────┴────────┐     │
          │                 │     │
    Success            Failure     │
          │                 │     │
          ▼                 ▼     ▼
   ┌─────────────┐   ┌─────────────────┐
   │ Send Emails │   │   Queue for     │──┐
   └──────┬──────┘   │   Retry        │  │
          │          └─────────────────┘  │
          ▼                               │
   ┌─────────────┐                      │
   │ Return      │                      │
   │ Success     │                      │
   └─────────────┘                      │
                                        │
          ┌───────────────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │   Show UI           │
   │   Success/Error     │
   └─────────────────────┘
```

### Key Principles

1. **Never lose data**: Queue failed writes for retry
2. **User always informed**: Show processing status
3. **Graceful degradation**: If emails fail, log and continue
4. **Atomic transactions**: Lead + Appointment + Touchpoint written together
5. **Unique constraints**: Database prevents double-booking

### Retry Logic

```javascript
// Simple retry with exponential backoff
async function withRetry(fn, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw lastError;
}
```

---

## Testing Strategy

### Unit Tests (Critical Paths)
- Email sending functions
- Availability calculation logic
- Touchpoint creation
- Input validation

### Integration Tests
- Booking flow (form → DB → email)
- Availability lockout
- Admin dashboard with real data

### Manual Test Checklist

| Test | Pass/Fail | Notes |
|------|------------|-------|
| Customer can book appointment | | |
| Double-booking is prevented | | |
| Customer receives confirmation email | | |
| Business owner receives notification | | |
| Admin can login | | |
| Admin can view new booking | | |
| Admin can change booking status | | |
| Touchpoints are tracked | | |
| Quote can be created and sent | | |
| Failed bookings are queued | | |
| Retried bookings eventually succeed | | |
| Chat widget saves messages | | |

---

## Open Decisions & Recommendations

| Decision | Options | Recommendation |
|-----------|----------|----------------|
| **Email Provider** | Resend, SendGrid, SMTP (local) | **Resend first** - Simple API, good free tier; fallback to mail.ajinsights.com.au SMTP |
| **Queue Implementation** | Redis, local file, in-memory | **In-memory with file backup** - Simple for single server |
| **Admin Auth** | JWT + bcrypt, Session-based, Basic Auth | **JWT + bcrypt** - Good balance of security and simplicity |
| **Domain for backend** | Same domain, subdomain, different domain | **Same domain** `/api/*` - avoids CORS |
| **Notification Channels** | Email only, SMS + Email, Push only | **Email first** for owner, browser notifications optional for admin |
| **Touchpoint Privacy** | IP addresses, detailed metadata, minimal | **Minimal** - just type and timestamp |
| **Booking Lock Duration** | 5 min, 15 min, 30 min | **15 min** - gives time to complete form |
| **Retry Count** | 3, 5, 10 | **5** with exponential backoff |
| **Admin Email Notifications** | angus@gair.com.au, angusjames@gair.com.au, angus@ajinsights.com.au | **All three** as recipients |

---

## Launch Readiness Checklist

### Pre-Launch
- [ ] Database `revivepropertyco` created in homelab PostgreSQL
- [ ] All tables created with proper schema
- [ ] Admin user account created in admin_users table
- [ ] Resend account created, API key in `.env`
- [ ] Backend API tested locally
- [ ] Email templates designed and tested

### Pre-Deployment
- [ ] `.env` files populated (DATABASE_URL, RESEND_API_KEY, JWT_SECRET)
- [ ] Dockerfile includes backend files
- [ ] Docker Compose exposes API ports, connects to homelab network
- [ ] Health check endpoint added
- [ ] Database migration script exists

### Post-Deployment
- [ ] API health check returns 200
- [ ] Test booking submitted successfully
- [ ] Confirmation email received
- [ ] Owner notification received
- [ ] Admin login works
- [ ] Admin dashboard shows booking
- [ ] Double-booking tested and prevented
- [ ] HTTPS verified working
- [ ] DNS A records correct

### Monitoring
- [ ] Error logging in place
- [ ] Failed booking queue monitored
- [ ] Email delivery rates checked
- [ ] Database connection status

---

## Estimated Effort Summary

| Phase | Days | Complexity |
|--------|-------|------------|
| Phase 1: Foundation | 1 | Low-Medium |
| Phase 2: Core Booking Flow | 1 | Medium |
| Phase 3: CRM Enhancement | 2 | Medium |
| Phase 4: Reliability | 1-2 | Medium-High |
| **Total** | **5-6 days** | |

**Note**: This assumes a single developer familiar with the stack.

---

## Immediate Risks

1. **Data Loss**: Current app uses localStorage only, data lost on browser clear
2. **No Business Visibility**: Owner won't know about bookings unless they check admin
3. **Race Conditions**: Two customers could book same slot simultaneously
4. **API Key Exposure**: GLM API key hardcoded in source (security risk)
5. **No Backup Strategy**: If PostgreSQL goes down, booking submissions fail

---

## Recommended Next Steps (Priority Order)

1. **TODAY**: Connect to homelab PostgreSQL and create `revivepropertyco` database
2. **TODAY**: Run schema migration to create all tables
3. **TODAY**: Create admin user in admin_users table
4. **TODAY**: Sign up for Resend, get API key
5. **TODAY**: Update `.env` with credentials
6. **TOMORROW**: Implement real email sending
7. **TOMORROW**: Build backend `/api/bookings` endpoint
8. **Day 3**: Connect frontend to backend API
9. **Day 4**: Add failure handling and queue
10. **Day 5**: Testing and deployment

---

## File Changes Summary

### New Files to Create
```
/server
  ├── index.js           - Express app setup
  ├── api
  │   ├── bookings.js     - Booking endpoint
  │   ├── availability.js - Slot checking
  │   ├── auth.js         - Authentication endpoint
  │   └── health.js      - Health check
  └── lib
      ├── database.js     - PostgreSQL connection with pg
      ├── email.js        - Email service (Resend)
      ├── auth.js         - JWT helpers
      └── queue.js        - Failed request queue

/services
  ├── touchpointService.ts  - Touchpoint tracking (new)
  ├── quoteService.ts       - Quote management (new)
  └── notificationService.ts - Notifications (new)

.env                     - Environment variables (new)
db_schema_clean.sql       - Working SQL schema (new)
```

### Files to Modify
```
package.json            - Add backend dependencies (pg, express, jsonwebtoken, bcrypt)
Dockerfile              - Include server files, add backend build stage
docker-compose.yml       - Expose API port, connect to homelab_postgres network
services/emailService.ts - Replace mock with real implementation
services/crmService.ts  - Remove Supabase client, update for API calls
lib/supabase.ts         - Remove or replace with API client
contexts/AuthContext.tsx - Update to use new auth API
pages/BookingPage.tsx    - Call API instead of direct DB
components/CalendarPicker.tsx - Call API for availability
pages/AdminDashboard.tsx - Add touchpoint and quote views
```

---

## Environment Variables Template (.env)

```bash
# Database (Homelab PostgreSQL)
DATABASE_URL=postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@postgres:5432/revivepropertyco

# Email (Resend)
RESEND_API_KEY=re_xxxxxx
RESEND_FROM=no-reply@revivepropertyco.au

# Admin Email Notifications
ADMIN_EMAIL_1=angus@gair.com.au
ADMIN_EMAIL_2=angusjames@gair.com.au
ADMIN_EMAIL_3=angus@ajinsights.com.au

# JWT Secret for Auth
JWT_SECRET=your-secret-key-change-this

# AI Chat (GLM API)
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
GLM_API_KEY=your-glm-key

# Node Environment
NODE_ENV=production
PORT=8080
```

---

*Last Updated: 2026-03-12*
*Database: Local PostgreSQL (homelab)*
*Email Provider: Resend*
