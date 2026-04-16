# Roadmap - Customer Portal Implementation

**Project:** Revive Property Co. Customer Portal
**Last Updated:** 2026-04-13
**Status:**

## Overview

This roadmap outlines the phased implementation of the Customer Portal feature for Revive Property Co. The project is structured to deliver a functional MVP (Phase 1) quickly, with future phases adding enhanced capabilities.

**Current Phase:** Phase 1 - MVP Core Features
**Target Timeline:** Phase 1 completion within 2-3 weeks
**Deployment Strategy:** Local dev → QA → Production deployment

---

## Phase 1: MVP Core Features

**Timeline:** Weeks 1-3
**Goal:** Deliver a functional customer portal with authentication, profile management, document handling, and quote approval.

**Status:** 🔄 Not Started

### 1.1 Database Setup and Schema Changes

**Tasks:**
- [ ] Create migration scripts for new tables:
  - [ ] `customers` table
  - [ ] `customer_documents` table
  - [ ] `quote_approvals` table
  - [ ] `audit_log` table
- [ ] Modify existing `quotes` table (add customer_id, status, dates)
- [ ] Create database indexes for performance
- [ ] Test migrations locally
- [ ] Document rollback procedures

**Deliverables:**
- Migration SQL scripts in `server/migrations/`
- Updated database schema documentation
- Tested and verified database structure

**Success Criteria:**
- All tables created successfully
- Indexes improve query performance (verified with EXPLAIN)
- Foreign key constraints enforced correctly
- Rollback script reverts changes cleanly

**Dependencies:** None (can start immediately)

**Estimated Time:** 4-6 hours

---

### 1.2 Backend API - Authentication

**Tasks:**
- [ ] Create `server/api/customer.cjs` route module
- [ ] Implement `POST /api/customer/register` endpoint:
  - [ ] Validate mobile/email format
  - [ ] Check for existing accounts
  - [ ] Hash password with bcrypt
  - [ ] Create customer record
  - [ ] Generate JWT token
  - [ ] Return customer data + token
- [ ] Implement `POST /api/customer/login` endpoint:
  - [ ] Look up customer by mobile or email
  - [ ] Verify password hash
  - [ ] Generate JWT token (7-day or 30-day expiry)
  - [ ] Return customer data + token
- [ ] Implement `GET /api/customer/profile` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Fetch customer profile
  - [ ] Return customer data
- [ ] Implement `PUT /api/customer/profile` endpoint:
  - [ ] Validate inputs
  - [ ] Update customer record
  - [ ] Return updated data
- [ ] Implement password change endpoint:
  - [ ] Verify current password
  - [ ] Hash new password
  - [ ] Update database
- [ ] Add audit logging for auth events

**Deliverables:**
- Working authentication API endpoints
- JWT token generation/validation
- Audit log entries for all auth events
- API testing results

**Success Criteria:**
- Registration creates valid customer accounts
- Login authenticates correctly with mobile or email
- Profile updates persist to database
- Password changes require verification of current password
- Invalid tokens return 401 Unauthorized
- Audit trail captured for all events

**Dependencies:** Task 1.1 (database schema)

**Estimated Time:** 8-10 hours

---

### 1.3 Backend API - Documents

**Tasks:**
- [ ] Set up file storage infrastructure:
  - [ ] Create `uploads/customers/` directory structure
  - [ ] Configure filesystem permissions
  - [ ] Set up multer for file uploads
- [ ] Implement `POST /api/customer/documents` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Validate file type (allowlist)
  - [ ] Validate file size (max 10 MB)
  - [ ] Sanitize filename
  - [ ] Save to `uploads/customers/{customer_id}/`
  - [ ] Create database record
  - [ ] Return document metadata
- [ ] Implement `GET /api/customer/documents` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Fetch customer's documents
  - [ ] Return list with metadata
- [ ] Implement `GET /api/customer/documents/:id` endpoint (download):
  - [ ] Authenticate with JWT
  - [ ] Verify document ownership
  - [ ] Stream file to response
  - [ ] Set Content-Disposition header
- [ ] Implement `DELETE /api/customer/documents/:id` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Verify document ownership
  - [ ] Delete file from filesystem
  - [ ] Remove database record
- [ ] Add cleanup job for orphaned files

**Deliverables:**
- Document upload/download/delete API
- File storage directory structure
- File validation and security checks
- Orphaned file cleanup script

**Success Criteria:**
- Files upload securely to customer-specific directories
- Only valid file types accepted (PDF, images, docs)
- File size limits enforced
- Customers can only access their own documents
- Download serves files with correct headers
- Delete removes both file and database record

**Dependencies:** Task 1.1 (database schema), Task 1.2 (auth)

**Estimated Time:** 10-12 hours

---

### 1.4 Backend API - Quotes

**Tasks:**
- [ ] Implement `GET /api/customer/quotes` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Fetch quotes linked to customer_id
  - [ ] Include quote status, dates, totals
  - [ ] Return paginated list
- [ ] Implement `GET /api/customer/quotes/:id` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Fetch full quote details
  - [ ] Include line items, terms, status
  - [ ] Verify customer ownership
- [ ] Implement `POST /api/customer/quotes/:id/approve` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Verify quote belongs to customer
  - [ ] Check quote is PENDING and not expired
  - [ ] Update quote status to APPROVED
  - [ ] Set approved_at timestamp
  - [ ] Create audit record in quote_approvals
  - [ ] (Optional) Send email notification to admin
- [ ] Implement `POST /api/customer/quotes/:id/reject` endpoint:
  - [ ] Authenticate with JWT
  - [ ] Verify quote belongs to customer
  - [ ] Check quote is PENDING and not expired
  - [ ] Update quote status to REJECTED
  - [ ] Set rejected_at timestamp
  - [ ] Store rejection reason (if provided)
  - [ ] Create audit record in quote_approvals
  - [ ] (Optional) Send email notification to admin
- [ ] Implement quote expiry logic:
  - [ ] Check expiry_date against current date
  - [ ] Return EXPIRED status if past expiry
  - [ ] Block actions on expired quotes

**Deliverables:**
- Quote listing and detail API
- Quote approval/rejection endpoints
- Quote expiry handling
- Audit trail for quote actions

**Success Criteria:**
- Customers see only their own quotes
- Quote status prevents duplicate approvals
- Expired quotes are clearly marked
- Approval/rejection creates audit record
- Admin receives email notifications (if implemented)

**Dependencies:** Task 1.1 (database schema), Task 1.2 (auth)

**Estimated Time:** 6-8 hours

---

### 1.5 Frontend - Authentication Pages

**Tasks:**
- [ ] Create `pages/customer/LoginPage.tsx`:
  - [ ] Login form (identifier, password, remember me)
  - [ ] Mobile/email validation
  - [ ] API call to `/api/customer/login`
  - [ ] Error handling and display
  - [ ] Loading state
  - [ ] Link to registration page
- [ ] Create `pages/customer/RegisterPage.tsx`:
  - [ ] Registration form (name, mobile, email, password, confirm)
  - [ ] Mobile/email validation
  - [ ] Password strength validation
  - [ ] API call to `/api/customer/register`
  - [ ] Error handling and display
  - [ ] Loading state
  - [ ] Link to login page
- [ ] Create `contexts/CustomerAuthContext.tsx`:
  - [ ] Auth state management (user, token, loading)
  - [ ] Login function (stores token + user in localStorage)
  - [ ] Logout function (clears localStorage)
  - [ ] Auto-authentication on page load
  - [ ] Protected route hook
- [ ] Create `components/CustomerProtectedRoute.tsx`:
  - [ ] Check for valid token
  - [ ] Redirect to login if not authenticated
  - [ ] Save intended destination
  - [ ] Show loading spinner while checking
- [ ] Update `types.ts` with Customer interface:
  - [ ] customer_id, first_name, last_name, mobile, email, etc.

**Deliverables:**
- Login and registration pages
- Customer auth context
- Protected route component
- TypeScript types for Customer

**Success Criteria:**
- Login works with mobile or email
- Registration creates account and auto-logs in
- Protected routes redirect unauthenticated users
- Token persists across page refreshes
- Logout clears auth state correctly

**Dependencies:** Task 1.2 (backend auth API)

**Estimated Time:** 8-10 hours

---

### 1.6 Frontend - Dashboard and Navigation

**UI/UX Reference:** Use `/opt/homelab/apps/revivepropertyco/revive-client-portal-main/src/App.tsx` as the visual template for the dashboard design. This template demonstrates the desired aesthetic with:
- Modern, clean interface with motion animations (framer-motion)
- Document-centric dashboard layout
- Blueprint-style aesthetic with monochrome color scheme
- Responsive design with mobile-friendly navigation
- Status badges and action buttons
- Header with navigation and logout
- Footer with system verification text

**Tasks:**
- [ ] Study the template dashboard design in `revive-client-portal-main/src/App.tsx`:
  - [ ] Analyze the Dashboard component structure (lines ~1746-1777)
  - [ ] Review the Header component for navigation pattern
  - [ ] Examine motion/animation approach with AnimatePresence
  - [ ] Note the card-based layout and status badge styling
  - [ ] Document the visual hierarchy and spacing patterns
- [ ] Create `pages/customer/DashboardPage.tsx` based on template:
  - [ ] Welcome message with customer name
  - [ ] Summary cards (active projects, pending quotes, documents) - styled like template
  - [ ] Quick action buttons with hover states
  - [ ] Recent activity timeline
  - [ ] Empty state handling
  - [ ] Apply template's motion animations and transitions
- [ ] Create `components/CustomerLayout.tsx`:
  - [ ] Header with logo and navigation (match template style)
  - [ ] Navigation menu (Dashboard, Profile, Documents, Quotes, Logout)
  - [ ] Mobile-responsive hamburger menu
  - [ ] Footer with system verification text (see template lines ~1812-1819)
- [ ] Create `components/CustomerNav.tsx`:
  - [ ] Navigation links
  - [ ] Active state highlighting
  - [ ] Mobile menu toggle
- [ ] Update `App.tsx` with customer portal routes:
  - [ ] `/customer/login`
  - [ ] `/customer/register`
  - [ ] `/customer/dashboard`
  - [ ] `/customer/profile`
  - [ ] `/customer/documents`
  - [ ] `/customer/quotes`
  - [ ] Wrap all routes except login/register in CustomerProtectedRoute

**Important Design Notes:**
- The template uses a sophisticated "blueprint" aesthetic with technical overlays
- Motion animations are key to the UX feel - use framer-motion or similar
- Status badges use high-contrast monochrome styling
- Document cards show metadata (status, date, amount) clearly
- The layout is responsive and mobile-first
- Navigation includes floating back button when in detail views (see line ~1807-1810)

**Deliverables:**
- Customer dashboard page matching template aesthetic
- Customer layout component with header/footer
- Navigation component with active states
- Updated routing in App.tsx

**Success Criteria:**
- Dashboard visually matches template design aesthetic
- Dashboard loads customer-specific data
- Navigation works across all pages
- Mobile menu is functional
- Active page is highlighted
- Motion animations feel smooth and professional
- Logout redirects to home or login

**Dependencies:** Task 1.5 (auth pages)

**Estimated Time:** 8-10 hours (increased due to template matching requirements)

---

### 1.7 Frontend - Profile Management

**UI/UX Reference:** Adapt the visual style from `/opt/homelab/apps/revivepropertyco/revive-client-portal-main/src/App.tsx` for the profile page. The profile page should:
- Follow the template's card-based layout and spacing
- Use the same monochrome status badge styling
- Apply template's motion animations for transitions
- Maintain the blueprint aesthetic with clean typography
- Use template's button styles and hover states
- Include the same footer and navigation patterns

**Tasks:**
- [ ] Review template's form inputs and button styling patterns
- [ ] Create `pages/customer/ProfilePage.tsx` based on template style:
  - [ ] Profile view mode (display current info) - styled like template cards
  - [ ] Profile edit mode (form with validation) - match template input styling
  - [ ] Save changes (PUT to `/api/customer/profile`)
  - [ ] Change password section with show/hide toggle
  - [ ] Loading and error states with template's spinner approach
  - [ ] Success message on save (match template's notification style)
  - [ ] Apply template's motion animations for mode transitions
- [ ] Implement client-side validation:
  - [ ] Mobile format validation
  - [ ] Email format validation
  - [ ] At least one contact method required
- [ ] Create `services/customerService.ts`:
  - [ ] `getProfile()` function
  - [ ] `updateProfile()` function
  - [ ] `changePassword()` function
  - [ ] Auth header helpers
  - [ ] Error handling

**Design Implementation Notes:**
- Form inputs should use the same rounded corners and focus states as template
- Buttons should match template's hover effects and active states
- Loading states should use similar spinner/progress indicators
- Error messages should follow template's alert/banner pattern
- Use template's typography hierarchy (headings, labels, body text)
- Apply template's spacing and padding patterns consistently

**Deliverables:**
- Profile management page matching template aesthetic
- Customer service functions
- Form validation logic

**Success Criteria:**
- Profile page visually matches template design style
- Profile displays current customer data
- Updates save successfully to database
- Password change requires current password verification
- Validation errors prevent invalid submissions
- Success messages confirm actions
- Edit/view mode transitions use smooth animations

**Dependencies:** Task 1.5 (auth), Task 1.6 (layout)

**Estimated Time:** 5-7 hours (increased due to template styling requirements)

---

### 1.8 Frontend - Document Management

**UI/UX Reference:** Use `/opt/homelab/apps/revivepropertyco/revive-client-portal-main/src/App.tsx` as the PRIMARY design reference. The template includes a complete document management interface that should be adapted:

**Key Template Features to Implement:**
- **Document List View** (lines ~1466-1488): Cards with project name, doc type, status, date, amount
- **Status Badges**: Monochrome badges showing "IN REVIEW", "APPROVED", etc.
- **Filter System** (line ~1476): Filter by "ALL_DOCS", "QUOTES", "STATEMENTS_OF_WORK"
- **Sort System** (lines ~1474-1475): Sort by issue date or status, ascending/descending
- **Upload Component** (lines ~1618-1664): Drag-and-drop with progress tracking
- **Download Functionality** (lines ~1482-1616): Generate PDF with jsPDF and autoTable
- **Document Actions**: Approve/reject buttons, revert to previous version, download
- **Motion Animations**: Smooth transitions between list and detail views
- **Empty States**: Clear messaging when no documents exist

**Tasks:**
- [ ] Deep-dive template's document management implementation:
  - [ ] Study the Document interface and data structure (lines ~31-32)
  - [ ] Analyze the filteredAndSortedDocuments logic (lines ~1727-1744)
  - [ ] Review the handleUpload function for drag-and-drop pattern (lines ~1618-1664)
  - [ ] Examine the handleDownload PDF generation (lines ~1482-1616)
  - [ ] Document the filter/sort UI components and interactions
- [ ] Create `pages/customer/DocumentsPage.tsx` based on template:
  - [ ] Document list view with cards matching template design
  - [ ] Document metadata display (name, size, upload date, status)
  - [ ] Filter dropdown (All, Quotes, Statements, Other Documents)
  - [ ] Sort controls (by date, by status, asc/desc)
  - [ ] Upload button with drag-and-drop area
  - [ ] Delete button with confirmation dialog
  - [ ] Download link/button (opens in new tab)
  - [ ] Empty state message with call-to-action
  - [ ] Apply template's card hover effects and transitions
- [ ] Implement file upload component based on template:
  - [ ] Drag-and-drop area with visual feedback
  - [ ] File picker button
  - [ ] File type validation (client-side)
  - [ ] File size validation (client-side)
  - [ ] Progress indicator with percentage
  - [ ] Upload to `/api/customer/documents`
  - [ ] Show active uploads with progress (like template's activeUploads state)
- [ ] Create document service functions:
  - [ ] `getDocuments()` - fetch list
  - [ ] `uploadDocument()` - upload file
  - [ ] `deleteDocument()` - delete file
- [ ] Handle upload errors:
  - [ ] File too large
  - [ ] Invalid file type
  - [ ] Network errors
  - [ ] Server errors

**Critical Design Elements from Template:**
- Document cards should use the same shadow and hover effects
- Status badges should match the monochrome rectangle style
- Upload progress should show animated progress bars
- Filter/sort controls should use the same dropdown styling
- The overall layout should match the template's spacing and rhythm
- Apply template's AnimatePresence for smooth view transitions

**Deliverables:**
- Documents management page closely matching template
- File upload component with drag-and-drop
- Document service functions
- Error handling matching template style

**Success Criteria:**
- Document page closely matches template's visual design
- Documents list displays customer's files
- Filter and sort controls work correctly
- Upload shows progress and completes successfully
- Invalid files are rejected before upload with clear error messages
- Download opens/saves file correctly
- Delete requires confirmation and removes file
- Empty state encourages first upload
- Animations and transitions feel as smooth as template

**Dependencies:** Task 1.3 (backend documents API), Task 1.6 (layout)

**Estimated Time:** 10-12 hours (increased due to template complexity)

---

### 1.9 Frontend - Quote Management

**UI/UX Reference:** Use `/opt/homelab/apps/revivepropertyco/revive-client-portal-main/src/App.tsx` as the PRIMARY design reference. The template includes a complete quote viewing and approval interface:

**Key Template Features to Implement:**
- **Quote List View** (Dashboard component): Quote cards with ID, project name, amount, status
- **Quote Detail View** (lines ~1779-1786): Full quote with line items in table format
- **Status Management**: Approve/reject buttons with confirmation
- **Line Item Table** (lines ~1547-1567): Table with description, qty, unit price, GST, total
- **PDF Export** (lines ~1545-1573): Generate downloadable quote PDF using jsPDF
- **Version History** (lines ~1704-1725): Track quote versions and revert functionality
- **Status Badges**: Visual indicators for PENDING, APPROVED, REJECTED, EXPIRED
- **Motion Transitions**: Animated transitions between list and detail views
- **Floating Back Button** (lines ~1807-1810): Easy navigation back to list

**Tasks:**
- [ ] Deep-dive template's quote management implementation:
  - [ ] Study the QuoteView component structure (referenced in render logic)
  - [ ] Analyze the QUOTE_ITEMS data structure and line item format (lines ~300-349)
  - [ ] Review the handleDownload PDF generation for quotes (lines ~1545-1573)
  - [ ] Examine status change logic (lines ~1704-1725)
  - [ ] Document the approval/rejection workflow and UI
- [ ] Create `pages/customer/QuotesPage.tsx` based on template:
  - [ ] Quote list view with cards matching template design
  - [ ] Quote status badges (PENDING, APPROVED, REJECTED, EXPIRED) - match template styling
  - [ ] Quote summary info (ID, date, total, project name)
  - [ ] View details button with hover effect
  - [ ] Empty state message
  - [ ] Apply template's card layout and hover effects
- [ ] Create quote detail view based on template's QuoteView:
  - [ ] Full quote details with line items in table format
  - [ ] Issue and expiry dates display
  - [ ] Line items table with description, quantity, rate, GST, total columns
  - [ ] Approve button (if PENDING) - match template button style
  - [ ] Reject button (if PENDING) with reason input
  - [ ] Status message (if not PENDING)
  - [ ] Rejection reason display (if rejected)
  - [ ] Download quote as PDF button (like template's handleDownload)
  - [ ] Back to list button (or use floating back button)
  - [ ] Apply template's motion animations for transitions
- [ ] Implement approval/rejection workflow:
  - [ ] Confirmation dialog before approving
  - [ ] Confirmation dialog before rejecting with reason textarea
  - [ ] API call to approve/reject endpoint
  - [ ] Update quote status locally with animation
  - [ ] Show success message
  - [ ] Refresh quote list or navigate back
- [ ] Create quote service functions:
  - [ ] `getQuotes()` - fetch list
  - [ ] `getQuoteById()` - fetch details
  - [ ] `approveQuote()` - approve quote
  - [ ] `rejectQuote()` - reject quote with reason
- [ ] Handle expired quotes:
  - [ ] Show expiry message prominently
  - [ ] Disable action buttons
  - [ ] Suggest contacting for new quote
- [ ] Implement PDF export (optional but recommended):
  - [ ] Use jsPDF and autoTable like template
  - [ ] Include quote header with logo and branding
  - [ ] Format line items table
  - [ ] Add total amount
  - [ ] Include system verification footer

**Critical Design Elements from Template:**
- Quote cards should match template's shadow and spacing
- Line item table should use template's grid styling
- Status badges should use monochrome rectangles
- Approve/reject buttons should match template's primary/secondary button styles
- PDF layout should follow template's document design (header, table, footer)
- Transitions between list/detail should use AnimatePresence
- Back button should use floating action button pattern

**Deliverables:**
- Quote management page matching template design
- Quote detail view with line item table
- Approval/rejection workflows with confirmations
- Quote service functions
- Optional: PDF quote export functionality

**Success Criteria:**
- Quote page closely matches template's visual design
- Quote list shows all customer quotes
- Detail view displays complete quote information
- Line item table matches template's formatting
- Approval updates status correctly
- Rejection captures and displays reason
- Expired quotes are clearly marked with disabled actions
- PDF download works (if implemented)
- Animations and transitions match template feel

**Dependencies:** Task 1.4 (backend quotes API), Task 1.6 (layout)

**Estimated Time:** 8-10 hours (increased due to template matching and optional PDF export)

---

### 1.10 Testing and QA

**Tasks:**
- [ ] Unit tests (if feasible):
  - [ ] Service functions (customerService)
  - [ ] Auth context functions
  - [ ] Validation utilities
- [ ] Integration tests:
  - [ ] Registration flow
  - [ ] Login flow
  - [ ] Document upload/download
  - [ ] Quote approval/rejection
- [ ] Manual testing checklist:
  - [ ] Test registration with mobile
  - [ ] Test registration with email
  - [ ] Test login with mobile
  - [ ] Test login with email
  - [ ] Test invalid credentials
  - [ ] Test profile update
  - [ ] Test password change
  - [ ] Test document upload (valid file)
  - [ ] Test document upload (invalid file)
  - [ ] Test document download
  - [ ] Test document delete
  - [ ] Test quote approval
  - [ ] Test quote rejection
  - [ ] Test expired quote behavior
  - [ ] Test logout
  - [ ] Test session persistence (refresh page)
  - [ ] Test protected routes (redirect unauthenticated)
  - [ ] Test mobile responsiveness
  - [ ] Test tablet responsiveness
  - [ ] Test cross-browser (Chrome, Firefox, Safari)
- [ ] Security testing:
  - [ ] Test SQL injection prevention
  - [ ] Test file upload exploits
  - [ ] Test authorization (can't access other customers' data)
  - [ ] Test XSS prevention
- [ ] Performance testing:
  - [ ] Measure page load times
  - [ ] Test file upload performance
  - [ ] Test database query performance

**Deliverables:**
- Test results document
- Bug list (if any)
- Fixes for critical bugs
- Performance metrics

**Success Criteria:**
- All manual tests pass
- No critical security vulnerabilities
- Page loads under 2 seconds
- File uploads complete in reasonable time
- Mobile responsive on all devices

**Dependencies:** All previous tasks (1.1-1.9)

**Estimated Time:** 10-12 hours

---

### 1.11 Deployment

**Tasks:**
- [ ] Prepare production deployment:
  - [ ] Set environment variables in production (.env or docker-compose)
  - [ ] Run database migrations on production database
  - [ ] Create `uploads/customers/` directory on production server
  - [ ] Set correct file permissions
- [ ] Update production deployment configuration:
  - [ ] Option A: Run Express server as separate container
  - [ ] Option B: Configure nginx to proxy `/api/*` to Express
  - [ ] Update docker-compose.yml if needed
- [ ] Deploy frontend:
  - [ ] Build production bundle (`npm run build`)
  - [ ] Deploy new Docker image
  - [ ] Verify nginx serving new assets
- [ ] Deploy backend (if separate):
  - [ ] Deploy Express server container
  - [ ] Verify API endpoints accessible
  - [ ] Test health check endpoint
- [ ] Smoke tests on production:
  - [ ] Test customer portal registration
  - [ ] Test customer portal login
  - [ ] Test document upload
  - [ ] Test quote viewing

**Deliverables:**
- Production deployment
- Deployment documentation
- Smoke test results

**Success Criteria:**
- Customer portal accessible at https://revivepropertyco.au/customer/*
- Registration and login work in production
- Documents can be uploaded/downloaded
- Quotes visible and actionable
- No breaking changes to existing site

**Dependencies:** Task 1.10 (testing complete)

**Estimated Time:** 4-6 hours

---

### 1.12 User Acceptance Testing (UAT)

**Tasks:**
- [ ] Recruit test users (3-5 people):
  - [ ] Customers with varying technical skill
  - [ ] Mobile and desktop users
  - [ ] Tablet users (if available)
- [ ] Create UAT scenarios:
  - [ ] Scenario 1: New customer registration and profile setup
  - [ ] Scenario 2: Upload project photos
  - [ ] Scenario 3: Review and approve quote
  - [ ] Scenario 4: Update personal details
- [ ] Conduct UAT sessions:
  - [ ] Observe users completing scenarios
  - [ ] Note pain points and confusion
  - [ ] Collect feedback on UI/UX
  - [ ] Record bugs and issues
- [ ] Analyze feedback:
  - [ ] Categorize issues (critical, major, minor)
  - [ ] Prioritize fixes
  - [ ] Create improvement backlog for Phase 2
- [ ] Fix critical issues:
  - [ ] Address blockers preventing normal use
  - [ ] Fix major bugs affecting core functionality
  - [ ] Deploy fixes to production

**Deliverables:**
- UAT feedback summary
- List of issues and fixes
- Improved customer portal
- Backlog for Phase 2

**Success Criteria:**
- At least 80% of users complete core scenarios without assistance
- No critical issues remaining
- User satisfaction score (qualitative) positive
- Ready for public launch

**Dependencies:** Task 1.11 (production deployment)

**Estimated Time:** 8-10 hours

---

## Phase 1 Summary

**Total Estimated Time:** 94-122 hours (approximately 2.5-3 weeks)
*Note: Time estimates increased for Tasks 1.6-1.9 to account for template matching requirements*

**Key Deliverables:**
1. Functional customer authentication system
2. Customer profile management
3. Document upload/download/management
4. Quote viewing and approval workflow
5. Customer dashboard with navigation
6. Production deployment
7. Completed UAT

**Success Criteria:**
✅ Customers can register and log in independently
✅ Customers can manage their profiles
✅ Customers can upload and download project documents
✅ Customers can review and approve/reject quotes
✅ All features work on mobile, tablet, and desktop
✅ No security vulnerabilities
✅ No breaking changes to existing site
✅ Positive user feedback from UAT

**Rollout Plan:**
1. Soft launch to existing customers (email invitation)
2. Monitor for bugs and feedback for 1 week
3. Public launch (add "Customer Portal" link to main website)
4. Continue monitoring and support

---

## Phase 2: Enhanced Features (Future)

**Timeline:** Weeks 4-6 (after Phase 1 completion)
**Goal:** Add communication hub, video consultations, and real-time notifications.

**Status:** ⏸️ Not Planned

### Planned Features (Draft):

**2.1 Communication Hub**
- Message history with support team
- Send new messages
- File attachments in messages
- Real-time notifications for new messages
- Email integration for message history

**2.2 Video Consultations**
- Google Meet integration
- Schedule video calls
- Join upcoming calls
- View call history
- Calendar integration

**2.3 Real-Time Notifications**
- In-app notifications
- Browser notifications (optional)
- Notification preferences
- Notification history

**2.4 Enhanced Dashboard**
- Project timeline tracking
- Booking history
- Invoice viewing and payment
- Service history

**2.5 Mobile App Considerations**
- Evaluate need for native mobile app
- Progressive Web App (PWA) capabilities
- Offline functionality

**Note:** Phase 2 features will be prioritized and scoped based on Phase 1 feedback and business needs.

---

## Phase 3: Advanced Features (Future)

**Timeline:** TBD
**Goal:** Advanced customer self-service and automation.

**Status:** ⏸️ Not Planned

### Potential Features:
- Payment processing (Stripe integration)
- Online booking modifications
- Real-time chat with support
- AI-powered quote assistant
- Customer analytics and insights
- Multi-language support

---

## Phase 05: Historical Leads Extraction & UI Toggle

**Timeline:** 1-2 days (after Phase 04 completion)
**Goal:** Enhance scraper to extract all historical leads (not just today's) and add UI toggle for "Last 50" vs "All Time" view.

**Status:** 📝 Planned

**Purpose:** Current scraper only captures ~50 leads from today. Need to extract all available historical leads and provide UI control for viewing datasets of different sizes.

**Requirements:** Historical lead extraction, pagination/scrolling logic, UI toggle component, backend API limit parameter support

**Depends on:** Phase 04 (hipages scraper integration complete)

**Plans:** 3 plans in 3 waves

Plans:
- [ ] 05-01-PLAN.md — Scraper enhancement for pagination/historical extraction
- [ ] 05-02-PLAN.md — Backend API limit parameter and frontend UI toggle
- [ ] 05-03-PLAN.md — Deployment, monitoring, and documentation

**Success Criteria:**
- Scraper extracts leads beyond first page (pagination/scrolling works)
- Database contains leads from multiple dates (historical data)
- UI toggle allows switching between "Last 50" and "All Time" views
- Performance acceptable (<2s for Last 50, <10s for All Time)
- No hipages account restrictions triggered

---

## Dependencies and Blockers

**External Dependencies:**
- Production deployment requires infrastructure changes (nginx routing or separate container)
- May need to coordinate with IT for firewall/routing changes

**Technical Blockers:**
- None identified currently

**Resource Blockers:**
- Developer availability (Angus)
- UAT participant availability

---

## Risk Management

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| File upload security vulnerabilities | Medium | High | Strict validation, allowlist file types, sanitize filenames |
| SQL injection in customer queries | Low | Critical | Parameterized queries, whitelist column names |
| Performance issues with large file uploads | Medium | Medium | File size limits, progress indicators, consider CDN in future |
| Mobile usability issues | Medium | Medium | Extensive mobile testing, responsive design |
| Production deployment breaks existing site | Low | Critical | Thorough testing, rollback plan, deploy during low-traffic period |
| Customer adoption low | Medium | High | User-friendly UI, clear onboarding, promote benefits |

---

## Success Metrics (Phase 1)

**Quantitative:**
- Customer registration rate: Target 20% of existing customers register in first month
- Portal adoption: Target 50% of new customers register within 1 week of booking
- Quote approval time: Target 50% reduction in time from quote sent to approved
- Support inquiries: Target 30% reduction in phone/email inquiries for status updates

**Qualitative:**
- Positive feedback from UAT participants
- No critical bugs reported in first 2 weeks post-launch
- Customers report portal is easy to use

---

## Next Steps

1. **Immediate:** Start Phase 1, Task 1.1 (Database Setup)
2. **This Week:** Complete database setup and backend auth API (1.1, 1.2)
3. **Next 2 Weeks:** Complete remaining Phase 1 tasks
4. **Week 3:** Deploy to production and conduct UAT
5. **Week 4:** Review feedback, plan Phase 2 based on learnings

**Goal:** Integrate standalone hipages lead scraper POC into main application with real-time PostgreSQL sync and admin dashboard integration.

**Purpose:** Migrate working scraper from /home/ghost/hipages to containerized microservice, enable real-time lead updates via WebSocket, provide admin interface for lead acceptance.

**Requirements:** Real-time sync, database integration, admin dashboard, docker orchestration

**Depends on:** Phase 1 (Customer Portal - database schema exists)

**Plans:** 6 plans in 4 waves

Plans:
- [x] 04-01-PLAN.md — Database migration for hipages_leads table
- [x] 04-02-PLAN.md — Scraper service with Playwright automation and PostgreSQL integration
- [x] 04-03-PLAN.md — Backend API and real-time sync via LISTEN/NOTIFY
- [x] 04-04-PLAN.md — Admin dashboard hipages leads page with real-time updates
- [x] 04-05-PLAN.md — Docker Compose integration and environment configuration
- [x] 04-06-PLAN.md — Production deployment, verification, and cleanup

### Phase 6: hipages jobs and leads integration with visual testing dashboard

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 5
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 6 to break down)

---

*Roadmap version 1.0 - 2026-04-13*
*Last updated: 2026-04-13*
