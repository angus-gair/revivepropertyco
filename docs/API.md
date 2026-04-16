<!-- generated-by: gsd-doc-writer -->
# API Documentation

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. Admin endpoints and customer endpoints require authentication via the `Authorization` header.

**Token Format:**
```
Authorization: Bearer <jwt_token>
```

**Token Expiry:** 7 days

**Authentication Endpoints:**
- `POST /api/auth/login` - Admin authentication (returns JWT token)
- `POST /api/customer/login` - Customer authentication (returns JWT token)
- `POST /api/auth/verify` - Verify token validity

**Protected Routes:** All routes under `/api/crm`, `/api/quotes`, `/api/hipages` (except public endpoints), `/api/customer` (except register/login), and `/api/touchpoints` require authentication via the `authenticateToken` middleware.

## Endpoints Overview

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/api/auth/login` | Admin user login | No |
| `POST` | `/api/auth/verify` | Verify JWT token | No |
| `GET` | `/api/crm/leads` | Get all leads | Yes |
| `PATCH` | `/api/crm/leads/:id` | Update lead | Yes |
| `GET` | `/api/crm/appointments` | Get all appointments | Yes |
| `GET` | `/api/crm/tasks` | Get all tasks | Yes |
| `POST` | `/api/crm/tasks` | Create task | Yes |
| `PATCH` | `/api/crm/tasks/:id` | Update task | Yes |
| `DELETE` | `/api/crm/tasks/:id` | Delete task | Yes |
| `POST` | `/api/bookings` | Create new booking | No |
| `GET` | `/api/availability` | Get available time slots | No |
| `GET` | `/api/hipages/debug` | Hipages API health check | No |
| `GET` | `/api/hipages/test` | Test endpoint | No |
| `GET` | `/api/hipages/image` | Proxy hipages images | No |
| `GET` | `/api/hipages/noauth/leads` | Public hipages leads | No |
| `GET` | `/api/hipages/leads` | Get hipages leads | Yes |
| `GET` | `/api/hipages/leads/:id` | Get single hipages lead | Yes |
| `POST` | `/api/hipages/leads/:id/accept` | Convert hipages lead to CRM | Yes |
| `POST` | `/api/hipages/scrape/trigger` | Trigger manual scrape | Yes |
| `GET` | `/api/quotes` | Get all quotes | Yes |
| `POST` | `/api/quotes` | Create quote | Yes |
| `PUT` | `/api/quotes/:id` | Update quote | Yes |
| `DELETE` | `/api/quotes/:id` | Delete quote | Yes |
| `POST` | `/api/touchpoints` | Create touchpoint | Yes |
| `GET` | `/api/touchpoints/lead/:leadId` | Get touchpoints for lead | Yes |
| `POST` | `/api/customer/register` | Customer registration | No |
| `POST` | `/api/customer/login` | Customer login | No |
| `GET` | `/api/customer/profile` | Get customer profile | Yes |
| `PUT` | `/api/customer/profile` | Update customer profile | Yes |
| `POST` | `/api/customer/change-password` | Change customer password | Yes |
| `GET` | `/api/customer/documents` | Get customer documents | Yes |
| `POST` | `/api/customer/documents` | Upload document | Yes |
| `GET` | `/api/customer/documents/:id` | Get document by ID | Yes |
| `DELETE` | `/api/customer/documents/:id` | Delete document | Yes |
| `GET` | `/api/customer/quotes` | Get customer quotes | Yes |
| `GET` | `/api/customer/quotes/:id` | Get quote details | Yes |
| `POST` | `/api/customer/quotes/:id/approve` | Approve quote | Yes |
| `POST` | `/api/customer/quotes/:id/reject` | Reject quote | Yes |
| `GET` | `/api/queue` | Get failed queue items | No |
| `POST` | `/api/queue/process` | Process queued items | No |
| `DELETE` | `/api/queue/clear` | Clear queue | No |
| `GET` | `/api/notifications/settings` | Get notification settings | Yes |
| `PUT` | `/api/notifications/settings` | Update notification settings | Yes |
| `GET` | `/health` | Health check | No |

## Request/Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "details": "Additional error details (development only)"
}
```

### Authentication Request (Admin)
```json
{
  "username": "admin_username",
  "password": "admin_password"
}
```

### Authentication Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin_username",
    "email": "admin@example.com"
  }
}
```

### Booking Creation Request
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "0412345678",
  "address": "123 Main St",
  "serviceType": "Pressure Washing",
  "date": "2026-04-20",
  "timeSlot": "14:00",
  "type": "QUOTE",
  "notes": "Optional customer notes"
}
```

### Booking Creation Response
```json
{
  "success": true,
  "bookingReference": "uuid",
  "leadId": "uuid",
  "queuedForRetry": false
}
```

### Lead Update Request
```json
{
  "status": "CONTACTED",
  "notes": "Updated notes"
}
```

### Hipages Lead List Response
```json
{
  "success": true,
  "data": [
    {
      "lead_id": "string",
      "customer_name": "string",
      "credits": 0,
      "description": "string",
      "job_type": "string",
      "job_subtype": "string",
      "suburb": "string",
      "postcode": "string",
      "posted_date": "string",
      "status": "string",
      "scraped_at": "timestamp",
      "synced_to_crm": false,
      "crm_lead_id": "uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | Success |
| `201` | Resource created successfully |
| `400` | Bad request - invalid input data |
| `401` | Unauthorized - missing or invalid token |
| `403` | Forbidden - account suspended or insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict - duplicate resource (e.g., time slot already booked) |
| `500` | Internal server error |

### Common Error Messages

- `"Unauthorized. Token required."` - Missing Authorization header
- `"Invalid or expired token."` - Token verification failed
- `"Invalid credentials."` - Username/password incorrect
- `"This time slot is already booked. Please choose another time."` - Booking conflict (error code: `SLOT_ALREADY_BOOKED`)
- `"An account with this mobile number or email already exists"` - Duplicate customer registration
- `"Your account has been suspended. Please contact support."` - Account suspended

## Rate Limits

No rate limiting is currently implemented. API clients should implement their own rate limiting to avoid overwhelming the server.

<!-- VERIFY: Production rate limiting configuration if added -->

## Real-Time Updates

The API uses Socket.IO for real-time updates. Socket.IO is initialized on the server and available to routes via `app.set('io', io)`.

**Socket.IO Configuration:**
- CORS allowed origins: `https://revivepropertyco.au` (production), `*` (development)
- Credentials: enabled

**Real-time events are used for:**
- Hipages lead updates (via `subscribeToHipagesUpdates`)
- Live dashboard updates
- Notification broadcasts

<!-- VERIFY: Socket.IO event names and payload structures -->

## File Uploads

Customer document uploads use `multer` for file handling.

**Upload Configuration:**
- Destination: `uploads/customers/`
- File naming: Original filename preserved
- Max file size: <!-- VERIFY: Check multer configuration for size limits -->

**Document Upload Endpoint:**
```
POST /api/customer/documents
Content-Type: multipart/form-data
```

**Request:**
- `file`: Document file (form-data)
- Additional metadata fields

## Environment Variables

The API relies on the following environment variables (see `CONFIGURATION.md` for complete list):

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token signing secret
- `RESEND_FROM` - Sender email for notifications

**Optional:**
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 8080)
- `HIPAGES_USERNAME` - Hipages scraper credentials
- `HIPAGES_PASSWORD` - Hipages scraper credentials

## CORS Configuration

**Development:** All origins allowed (`*`)

**Production:** Only `https://revivepropertyco.au` allowed

Credentials are enabled for both environments.

## Health Check

`GET /health` returns server status:

```json
{
  "status": "healthy",
  "timestamp": "2026-04-16T00:00:00.000Z",
  "uptime": 12345.678,
  "environment": "production"
}
```
