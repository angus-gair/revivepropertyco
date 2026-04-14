# Requirements - Customer Portal

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Draft

## Table of Contents
1. [Functional Requirements](#functional-requirements)
2. [Non-Functional Requirements](#non-functional-requirements)
3. [Data Requirements](#data-requirements)
4. [Security Requirements](#security-requirements)
5. [UI/UX Requirements](#uiux-requirements)
6. [Integration Requirements](#integration-requirements)

---

## Functional Requirements

### FR-1: Customer Registration

**FR-1.1:** The system SHALL allow new customers to register an account using:
- **Primary:** Mobile number (Australian format: +61 or 04xxxxxxxx)
- **Fallback:** Email address (if mobile unavailable)

**FR-1.2:** Registration form SHALL collect:
- Full name
- Mobile number OR email address (at least one required)
- Password (minimum 8 characters, must include letter and number)
- Confirm password (must match)

**FR-1.3:** The system SHALL validate mobile number format for Australian numbers:
- Accept formats: `04XX XXX XXX`, `04XXXXXXXX`, `+61 4XX XXX XXX`
- Reject invalid formats with clear error message

**FR-1.4:** The system SHALL validate email format using standard regex pattern

**FR-1.5:** The system SHALL verify that mobile number or email is not already registered:
- Return error if account exists
- Offer link to login page for existing users

**FR-1.6:** The system SHALL create a customer record in the database upon successful registration:
- Hash password using bcrypt (salt rounds: 10)
- Store customer with status `ACTIVE`
- Generate customer ID (UUID or sequential)

**FR-1.7:** The system SHALL automatically log in the customer after registration:
- Generate JWT token (expires: 7 days)
- Store token in localStorage (`revive_customer_token`)
- Store user info in localStorage (`revive_customer_user`)
- Redirect to customer dashboard

### FR-2: Customer Login

**FR-2.1:** The system SHALL allow customers to log in using:
- Mobile number + password
- Email address + password

**FR-2.2:** The login form SHALL accept:
- Identifier (mobile or email)
- Password
- "Remember me" checkbox (extends token to 30 days)

**FR-2.3:** The system SHALL authenticate credentials against the database:
- Look up customer by mobile or email
- Compare password hash using bcrypt
- Return clear error if credentials invalid (don't reveal which field is wrong)

**FR-2.4:** The system SHALL generate JWT token upon successful authentication:
- Token payload includes: `customer_id`, `mobile`, `email`, `name`, `exp`
- Default expiry: 7 days
- Extended expiry: 30 days if "Remember me" checked

**FR-2.5:** The system SHALL store authentication data in localStorage:
- Key: `revive_customer_token` (JWT string)
- Key: `revive_customer_user` (JSON object with customer details)

**FR-2.6:** The system SHALL redirect authenticated customers to the dashboard

**FR-2.7:** The system SHALL show friendly error messages for:
- Invalid credentials
- Account not found
- Account disabled/suspended
- Server errors

### FR-3: Customer Dashboard

**FR-3.1:** The system SHALL display a customer dashboard after login with:
- Welcome message with customer name
- Summary cards showing:
  - Active projects count
  - Pending quotes count
  - Recent documents count
- Quick action buttons:
  - View Quotes
  - Upload Document
  - Edit Profile
- Recent activity timeline (last 5 actions)

**FR-3.2:** The dashboard SHALL be responsive and mobile-friendly

**FR-3.3:** The dashboard SHALL load data asynchronously with loading indicators

**FR-3.4:** The dashboard SHALL handle empty states gracefully (e.g., "No active projects" message)

### FR-4: Customer Profile Management

**FR-4.1:** The system SHALL provide a profile page where customers can:
- View their current profile information
- Edit personal details (name, mobile, email)
- Change password

**FR-4.2:** Profile form SHALL include:
- Full name (required)
- Mobile number (required if email not provided)
- Email address (required if mobile not provided)
- Address (optional)
- Suburb (optional)
- Postcode (optional)

**FR-4.3:** The system SHALL validate profile updates:
- Mobile format validation
- Email format validation
- At least one contact method required

**FR-4.4:** The system SHALL save profile changes to the database:
- Update `customers` table
- Return success message
- Handle errors gracefully

**FR-4.5:** Password change form SHALL require:
- Current password (verification)
- New password (minimum 8 chars, letter + number)
- Confirm new password (must match)

**FR-4.6:** The system SHALL verify current password before allowing change:
- Compare against stored hash
- Reject if incorrect

**FR-4.7:** The system SHALL update password hash on successful change:
- Hash new password with bcrypt
- Update database
- Require re-login (optional, for security)

### FR-5: Document Management

**FR-5.1:** The system SHALL allow customers to upload files to their account:
- Supported formats: PDF, JPG, JPEG, PNG, DOC, DOCX
- Maximum file size: 10 MB per file
- Storage path: `uploads/customers/{customer_id}/{filename}`

**FR-5.2:** Upload form SHALL include:
- File picker/drag-and-drop area
- File type validation (client and server-side)
- File size validation (client and server-side)
- Progress indicator during upload
- Description field (optional text notes about the file)

**FR-5.3:** The system SHALL store document metadata in database:
- Table: `customer_documents`
- Fields: document_id, customer_id, filename, original_filename, file_path, file_size, mime_type, description, uploaded_at

**FR-5.4:** The system SHALL sanitize filenames on upload:
- Remove special characters
- Add timestamp prefix to prevent conflicts
- Preserve file extension

**FR-5.5:** The system SHALL validate files on server-side:
- Check file type against allowed list
- Verify file size limits
- Reject invalid uploads with clear error message

**FR-5.6:** The system SHALL display a list of uploaded documents:
- Document name (clickable to download)
- Upload date
- File size (human-readable)
- Description (if provided)
- Delete button (with confirmation)

**FR-5.7:** The system SHALL allow customers to download their documents:
- Click document name to trigger download
- Set proper Content-Disposition header
- Stream file to client

**FR-5.8:** The system SHALL allow customers to delete their documents:
- Show confirmation dialog ("Are you sure?")
- Delete file from filesystem
- Remove database record
- Update document list

**FR-5.9:** The system SHALL enforce access control:
- Customers can only view/upload/download their own documents
- Server-side verification of customer_id

### FR-6: Quote Management

**FR-6.1:** The system SHALL display a list of quotes for the customer:
- Quote ID / reference number
- Quote date
- Status (PENDING, APPROVED, REJECTED, EXPIRED)
- Total amount
- Action buttons (View, Approve, Reject)

**FR-6.2:** The system SHALL show quote details when a quote is selected:
- Quote reference number
- Issue date and expiry date
- Line items (description, quantity, unit price, total)
- Subtotal, GST, total amount
- Terms and conditions
- Status badge
- Approve/Reject buttons (if PENDING)

**FR-6.3:** The system SHALL allow customers to approve quotes:
- Click "Approve" button
- Show confirmation dialog
- Update quote status to APPROVED in database
- Record approval timestamp
- Display success message
- Refresh quote list

**FR-6.4:** The system SHALL allow customers to reject quotes:
- Click "Reject" button
- Optional: Reason textarea (why rejecting)
- Show confirmation dialog
- Update quote status to REJECTED in database
- Record rejection timestamp and reason
- Display success message
- Refresh quote list

**FR-6.5:** The system SHALL show different actions based on quote status:
- PENDING: Approve, Reject buttons visible
- APPROVED: "Approved on {date}" message, no actions
- REJECTED: "Rejected on {date}" message, no actions
- EXPIRED: "Expired on {date}" message, no actions

**FR-6.6:** The system SHALL enforce quote expiry rules:
- Quotes older than 30 days show as EXPIRED
- No actions allowed on expired quotes
- Clear message: "This quote has expired. Contact us for a new quote."

### FR-7: Navigation and Routing

**FR-7.1:** The system SHALL provide the following customer portal routes:
- `/customer/login` - Login page
- `/customer/register` - Registration page
- `/customer/dashboard` - Main dashboard (default after login)
- `/customer/profile` - Profile management
- `/customer/documents` - Document management
- `/customer/quotes` - Quote list and approval

**FR-7.2:** The system SHALL protect all customer portal routes except login/register:
- Check for valid JWT token in localStorage
- Redirect to `/customer/login` if not authenticated
- Save intended destination for redirect after login

**FR-7.3:** The system SHALL provide navigation menu:
- Visible on all customer portal pages
- Links to Dashboard, Profile, Documents, Quotes
- Logout button
- Active state highlighting

**FR-7.4:** The system SHALL include a breadcrumb or back button for navigation

### FR-8: Logout

**FR-8.1:** The system SHALL provide a logout function:
- Clear JWT token from localStorage
- Clear customer user info from localStorage
- Redirect to home page or login page
- Show logout confirmation message

**FR-8.2:** The system SHALL provide logout button in:
- Navigation menu
- Profile page (for accessibility)

---

## Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1:** Page load times SHALL be under 2 seconds for all customer portal pages on 4G networks

**NFR-1.2:** Dashboard SHALL load within 3 seconds with all data fetched

**NFR-1.3:** File uploads SHALL show progress indicator and complete within 30 seconds for files up to 10 MB on standard broadband

**NFR-1.4:** The system SHALL use lazy loading for document lists if more than 50 documents

### NFR-2: Scalability

**NFR-2.1:** The system SHALL support at least 1000 concurrent customer users

**NFR-2.2:** The system SHALL support storage of up to 10 GB of customer documents on local filesystem

**NFR-2.3:** The system SHALL include database indexes on customer_id for all customer-specific queries

**NFR-2.4:** The system SHALL be designed for future migration to cloud object storage (R2) without code changes to service layer

### NFR-3: Reliability

**NFR-3.1:** The system SHALL have an uptime target of 99% during business hours

**NFR-3.2:** The system SHALL handle database connection failures gracefully:
- Show user-friendly error message
- Retry failed requests automatically (up to 3 times)
- Log errors for monitoring

**NFR-3.3:** The system SHALL validate all user inputs both client-side and server-side

**NFR-3.4:** The system SHALL use database transactions for multi-step operations (e.g., quote approval with logging)

### NFR-4: Usability

**NFR-4.1:** All pages SHALL be mobile-responsive and work on:
- Desktop (1920x1080 and larger)
- Laptop (1366x768 and larger)
- Tablet (768x1024 and larger)
- Mobile (375x667 and larger)

**NFR-4.2:** All forms SHALL provide clear validation messages:
- Inline validation where possible
- Error messages in plain language
- Examples for complex fields (e.g., mobile format)

**NFR-4.3:** The system SHALL use consistent UI/UX patterns matching the admin portal:
- Tailwind CSS styling
- Blueprint aesthetic
- Loading states (spinners or skeletons)
- Error message styling
- Success message styling

**NFR-4.4:** The system SHALL be accessible:
- Keyboard navigation support
- ARIA labels on form inputs
- Focus indicators on interactive elements
- Color contrast ratios meeting WCAG AA standards

### NFR-5: Maintainability

**NFR-5.1:** Code SHALL follow existing project patterns:
- Service layer for API calls (`customerService.ts`)
- Type definitions in `types.ts`
- Protected routes pattern
- Context providers for shared state

**NFR-5.2:** All new code SHALL include:
- TypeScript types (no `as any` without documented reason)
- Error handling with try/catch
- Loading states
- User-friendly error messages

**NFR-5.3:** Database changes SHALL be documented in migration notes

**NFR-5.4:** API endpoints SHALL follow REST conventions:
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update profile
- `POST /api/customer/documents` - Upload document
- `GET /api/customer/documents` - List documents
- `DELETE /api/customer/documents/:id` - Delete document
- `GET /api/customer/quotes` - List quotes
- `POST /api/customer/quotes/:id/approve` - Approve quote
- `POST /api/customer/quotes/:id/reject` - Reject quote

---

## Data Requirements

### DR-1: Database Schema

**DR-1.1:** Create `customers` table:

```sql
CREATE TABLE customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  address TEXT,
  suburb VARCHAR(100),
  postcode VARCHAR(10),
  state VARCHAR(50) DEFAULT 'ACT',
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_customers_mobile ON customers(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_status ON customers(status);
```

**DR-1.2:** Create `customer_documents` table:

```sql
CREATE TABLE customer_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_documents_uploaded ON customer_documents(uploaded_at DESC);
```

**DR-1.3:** Create `quote_approvals` table (for audit trail):

```sql
CREATE TABLE quote_approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(customer_id),
  action VARCHAR(20) NOT NULL, -- APPROVED, REJECTED
  reason TEXT,
  actioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actioned_ip VARCHAR(45) -- Store IP for audit
);

-- Indexes
CREATE INDEX idx_approvals_quote ON quote_approvals(quote_id);
CREATE INDEX idx_approvals_customer ON quote_approvals(customer_id);
```

**DR-1.4:** Modify existing `quotes` table (if needed):

```sql
-- Add customer reference if not exists
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(customer_id);

-- Add approval tracking if not exists
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'; -- PENDING, APPROVED, REJECTED, EXPIRED
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
```

### DR-2: File Storage Structure

**DR-2.1:** Create directory structure:
```
uploads/
  customers/
    {customer_id}/
      {timestamp}_{filename}
```

**DR-2.2:** Create `uploads/` directory if it doesn't exist on server startup

**DR-2.3:** Ensure proper file permissions on uploaded files (owner: node user, mode: 644)

**DR-2.4:** Implement cleanup script for orphaned files (files in filesystem but not in database)

---

## Security Requirements

### SR-1: Authentication

**SR-1.1:** All passwords SHALL be hashed using bcrypt with salt rounds of 10

**SR-1.2:** JWT tokens SHALL:
- Use HS256 algorithm
- Include secret key from environment variable (`JWT_SECRET`)
- Expire after 7 days (or 30 days with "Remember me")
- Include customer_id, mobile, email in payload

**SR-1.3:** The system SHALL validate JWT tokens on every protected API request:
- Check signature
- Verify expiration
- Reject invalid tokens with 401 Unauthorized

**SR-1.4:** The system SHALL use HTTPS in production (enforced by Traefik)

### SR-2: Authorization

**SR-2.1:** Customers SHALL only access their own data:
- Server-side verification of customer_id in all queries
- WHERE customer_id = ? in all SELECT/UPDATE/DELETE queries
- No customer can access another customer's documents, quotes, or profile

**SR-2.2:** Admin accounts SHALL NOT be able to access customer portal routes:
- Separate auth context (`AuthContext` for admin, `CustomerAuthContext` for customers)
- Separate localStorage keys (`revive_admin_token` vs `revive_customer_token`)

### SR-3: File Upload Security

**SR-3.1:** All file uploads SHALL be validated:
- File extension check (allowlist: .pdf, .jpg, .jpeg, .png, .doc, .docx)
- MIME type verification (server-side check, not just extension)
- File size limit (10 MB max)
- Content validation for images (verify actual image data)

**SR-3.2:** Uploaded files SHALL be stored outside web root:
- Use `uploads/` directory with no direct HTTP access
- Serve files through API endpoint with authentication check

**SR-3.3:** Filenames SHALL be sanitized:
- Remove path traversal sequences (`../`, `..\\`)
- Remove special characters
- Add timestamp prefix
- Preserve original filename in database for display

**SR-3.4:** The system SHALL set Content-Disposition header to `attachment` when serving files

**SR-3.5:** Executable files SHALL be strictly blocked:
- Block: .exe, .sh, .bat, .cmd, .scr, .dll, etc.
- Return 400 Bad Request if attempted

### SR-4: Input Validation

**SR-4.1:** All user inputs SHALL be validated server-side:
- Never trust client-side validation
- Use parameterized queries for all SQL
- Whitelist allowed column names

**SR-4.2:** SQL queries SHALL use parameterized queries:
- No string concatenation for user input
- Use $1, $2, ... placeholders
- Prevents SQL injection

**SR-4.3:** Output SHALL be escaped to prevent XSS:
- React's default escaping protects DOM rendering
- For user-generated content, ensure proper escaping

### SR-5: Session Management

**SR-5.1:** JWT tokens SHALL be stored in localStorage (not cookies for now, to avoid CSRF complexity)

**SR-5.2:** The system SHALL support token refresh (optional for MVP):

**SR-5.3:** Logout SHALL clear all authentication data from localStorage

### SR-6: Audit Logging

**SR-6.1:** The system SHALL log security-relevant events:
- Successful logins (timestamp, IP, customer_id)
- Failed login attempts (timestamp, IP, identifier used)
- Password changes
- Profile updates
- Document uploads/deletes
- Quote approvals/rejections

**SR-6.2:** Logs SHALL be stored in `audit_log` table:

```sql
CREATE TABLE audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(customer_id),
  action VARCHAR(100) NOT NULL, -- LOGIN, LOGOUT, PASSWORD_CHANGE, etc.
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_customer ON audit_log(customer_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

---

## UI/UX Requirements

### UXR-1: Design System

**UXR-1.1:** Customer portal SHALL match existing admin portal styling:
- Tailwind CSS v4 with same color palette
- Same button styles, form inputs, cards
- Consistent spacing and typography
- Blueprint aesthetic (high-density, professional)

**UXR-1.2:** Color scheme:
- Primary: Blue (matches existing `bg-blue-600`)
- Success: Green (`bg-green-600`)
- Error: Red (`bg-red-600`)
- Warning: Yellow (`bg-yellow-600`)
- Background: Slate (`bg-slate-50`, `bg-slate-100`, etc.)

**UXR-1.3:** Typography:
- Headings: Bold, larger font sizes
- Body text: Regular weight, readable (text-slate-700)
- Small text: Muted (text-slate-500)

### UXR-2: Layout

**UXR-2.1:** All customer portal pages SHALL include:
- Header with logo and navigation menu
- Main content area
- Footer with copyright and contact info

**UXR-2.2:** Navigation menu SHALL be:
- Horizontal on desktop
- Hamburger menu on mobile
- Show active page highlight

**UXR-2.3:** Dashboard SHALL use card-based layout:
- Summary cards at top (2-3 columns)
- Activity timeline below
- Quick actions section

### UXR-2.4:** Forms SHALL use consistent layout:
- Labels above inputs
- Inline validation messages
- Submit button at bottom right
- Loading state during submission

### UXR-3: Responsive Design

**UXR-3.1:** Mobile breakpoint (< 768px):
- Stack columns vertically
- Hide less important info
- Larger touch targets (44px min)
- Slide-out navigation menu

**UXR-3.2:** Tablet breakpoint (768px - 1024px):
- 2-column layouts where appropriate
- Condensed spacing

**UXR-3.3:** Desktop breakpoint (> 1024px):
- Full multi-column layouts
- Maximum width containers (1280px or 1536px)

### UXR-4: Loading States

**UXR-4.1:** Show spinner during:
- Initial page load
- Form submissions
- File uploads (with progress bar)
- Data fetching

**UXR-4.2:** Use skeleton screens for lists if loading takes > 1 second

### UXR-5: Empty States

**UXR-5.1:** Show friendly messages when:
- No documents uploaded ("You haven't uploaded any documents yet")
- No quotes available ("No quotes at this time")
- No recent activity ("No recent activity to display")

**UXR-5.2:** Include call-to-action in empty states (e.g., "Upload your first document")

### UXR-6: Error States

**UXR-6.1:** Error messages SHALL be:
- Clear and specific (what went wrong)
- Actionable (what to do next)
- Non-blaming (avoid "you made an error")

**UXR-6.2:** Error display:
- Red background or border
- Icon for visual indication
- Dismissible for non-critical errors

---

## Integration Requirements

### IR-1: Existing Systems

**IR-1.1:** Customer portal SHALL integrate with existing authentication infrastructure:
- Reuse `server/lib/auth.cjs` for token generation/validation
- Reuse bcrypt password hashing
- Follow same JWT pattern as admin portal

**IR-1.2:** Customer portal SHALL follow existing service layer pattern:
- Create `services/customerService.ts`
- Use fetch with auth headers
- Map snake_case DB rows to camelCase TypeScript interfaces

**IR-1.3:** Customer portal SHALL reuse existing types from `types.ts`:
- Extend `Quote` interface if needed
- Create new `Customer`, `CustomerDocument` interfaces

### IR-2: Database Integration

**IR-2.1:** Customer portal SHALL connect to existing PostgreSQL database:
- Reuse `server/lib/database.cjs` connection pool
- Use same `DATABASE_URL` environment variable

**IR-2.2:** Customer data SHALL be linked to existing `leads` and `appointments` tables:
- Optional: Link customers to their historical data
- Allow customers to see their past bookings (Phase 2)

### IR-3: Email Integration

**IR-3.1:** Registration confirmation email (optional for MVP):
- Use existing `server/lib/email.cjs` Resend integration
- Send welcome email after registration

**IR-3.2:** Quote notification emails:
- Notify admin when customer approves/rejects quote
- Use existing email templates or create new ones

### IR-4: Future Integrations (Out of Scope for MVP)

**IR-4.1:** Video consultation (Google Meet):
- Generate Meet links via Google Calendar API
- Store links in database
- Display in customer portal

**IR-4.2:** Communication hub:
- Integrate with email service to show message history
- Add real-time chat (WebSocket or polling)

**IR-4.3:** Payment processing:
- Integrate payment gateway (Stripe, etc.)
- Allow customers to pay invoices online

---

## Requirements Traceability Matrix

| Req ID | Description | Priority | Status | Dependencies |
|--------|-------------|----------|--------|--------------|
| FR-1 | Customer Registration | High | Not Started | DR-1.1, SR-1.1 |
| FR-2 | Customer Login | High | Not Started | DR-1.1, SR-1.1 |
| FR-3 | Customer Dashboard | High | Not Started | FR-1, FR-2 |
| FR-4 | Profile Management | Medium | Not Started | FR-1, FR-2 |
| FR-5 | Document Management | High | Not Started | DR-1.2, DR-2, SR-3 |
| FR-6 | Quote Management | High | Not Started | DR-1.4 |
| FR-7 | Navigation and Routing | High | Not Started | FR-1, FR-2 |
| FR-8 | Logout | High | Not Started | FR-2 |
| NFR-1 | Performance | Medium | Not Started | All FRs |
| NFR-2 | Scalability | Medium | Not Started | DR-1, DR-2 |
| NFR-3 | Reliability | High | Not Started | All FRs |
| NFR-4 | Usability | High | Not Started | All FRs |
| NFR-5 | Maintainability | Medium | Not Started | All FRs |
| DR-1 | Database Schema | High | Not Started | None |
| DR-2 | File Storage | High | Not Started | None |
| SR-1 | Authentication | High | Not Started | DR-1.1 |
| SR-2 | Authorization | High | Not Started | FR-1, FR-2 |
| SR-3 | File Upload Security | High | Not Started | FR-5 |
| SR-4 | Input Validation | High | Not Started | All FRs |
| SR-5 | Session Management | High | Not Started | FR-2, FR-8 |
| SR-6 | Audit Logging | Medium | Not Started | All FRs |
| UXR-1 | Design System | High | Not Started | None |
| UXR-2 | Layout | Medium | Not Started | UXR-1 |
| UXR-3 | Responsive Design | High | Not Started | UXR-1 |
| UXR-4 | Loading States | Medium | Not Started | None |
| UXR-5 | Empty States | Low | Not Started | None |
| UXR-6 | Error States | High | Not Started | None |
| IR-1 | Existing Systems | High | Not Started | None |
| IR-2 | Database Integration | High | Not Started | IR-1.2 |
| IR-3 | Email Integration | Low | Not Started | IR-1.1 |
| IR-4 | Future Integrations | Out of Scope | Not Started | None |

---

*Requirements document: 2026-04-13*
*Version 1.0*
