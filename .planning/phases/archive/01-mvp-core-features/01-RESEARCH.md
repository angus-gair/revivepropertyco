# Phase 1: MVP Core Features - Research

**Researched:** 2026-04-13
**Domain:** Post-Implementation Testing, Deployment Verification, and UAT
**Confidence:** HIGH

## Summary

Phase 1 is a **post-implementation research phase**. All core features (Tasks 1.1-1.9) are complete and deployed in production:
- Database schema: 4 tables created with migrations
- Backend APIs: 13 endpoints across 3 route files (auth, documents, quotes)
- Frontend pages: 6 customer portal pages with routing and auth context
- Deployment: Docker containers running (frontend + backend) behind Traefik

**Remaining work:** Tasks 1.10-1.12 (Testing, Deployment Verification, UAT)

This research focuses on:
1. **Testing strategies** for customer portal (manual, security, performance, cross-browser)
2. **Production deployment verification** for Express backend APIs behind Traefik
3. **UAT best practices** for customer-facing portals with real users
4. **Smoke test scenarios** covering all customer portal workflows

**Primary recommendation:** Use layered testing approach — automated API smoke tests → manual functional testing → security hardening → UAT with real customers → production deployment verification.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Customer Authentication | API / Backend | Browser / Client | JWT validation, token generation, password hashing are server-side concerns |
| Profile Management | API / Backend | Browser / Client | Database persistence, input validation happen on backend |
| Document Upload/Download | API / Backend | Browser / Client | File storage, validation, serving through authenticated endpoints |
| Quote Approval Workflow | API / Backend | Browser / Client | Business logic (expiry, status updates) is server-side |
| Session Management | Browser / Client | API / Backend | localStorage token storage is client-side, validation is server-side |
| UI State Management | Browser / Client | — | React state, navigation, loading states are pure frontend |
| Access Control | API / Backend | Browser / Client | Server-side customer_id verification is authoritative, client-side is UX convenience |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** JWT token-based authentication (7-day expiry, 30-day with "Remember me")
- **D-02:** Mobile number as primary identifier, email as fallback
- **D-03:** Password hashing with bcrypt (10 salt rounds)
- **D-04:** Token storage in localStorage (`revive_customer_token`, `revive_customer_user`)
- **D-05:** Separate auth context from admin portal (`CustomerAuthContext` vs `AuthContext`)
- **D-06:** Local filesystem storage in `uploads/customers/{customer_id}/` (v1 approach)
- **D-07:** File size limit: 10 MB per file
- **D-08:** Allowed file types: PDF, images (JPG, PNG, GIF, WebP), documents (DOC, DOCX)
- **D-09:** Server-side file validation (type, size) and client-side validation
- **D-10:** Filename sanitization with timestamp prefix
- **D-11:** Quote expiry: 30 days from issue date
- **D-12:** Quote statuses: PENDING, APPROVED, REJECTED, EXPIRED
- **D-13-D-15:** Approval/rejection workflow with confirmation dialogs
- **D-16-D-20:** "Blueprint" aesthetic UI, responsive design, loading/empty/error states
- **D-21-D-26:** Code organization patterns (services, contexts, protected routes)
- **D-27-D-30:** Security controls (customer isolation, auth checks, input validation, audit logging)

### Claude's Discretion
None — all implementation decisions are locked. Research focuses on testing and verification strategies only.

### Deferred Ideas (OUT OF SCOPE)
- Communication hub (message history with support team)
- Video consultation scheduling (Google Meet integration)
- Real-time notifications
- Project timeline tracking
- Payment processing (Stripe integration)
- Cloud object storage migration (Cloudflare R2)
- httpOnly cookie migration (enhanced XSS protection)
- Token refresh mechanism
- Comprehensive automated testing (unit/integration)
- Logging framework (currently console methods)

## Standard Stack

### Testing Tools
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **curl** | System | API endpoint testing | [VERIFIED: system testing] Already in use via test-customer-api.sh |
| **docker exec** | System | Database verification | [VERIFIED: system testing] Direct database access for test data validation |
| **browser DevTools** | Chrome/Firefox | Frontend debugging | Standard for localStorage inspection, network analysis |
| **npm audit** | CLI | Dependency vulnerability scanning | [VERIFIED: npm registry] Built-in Node.js security checker |
| **jq** | System | JSON parsing in shell scripts | [VERIFIED: system testing] Already used in test-customer-api.sh |

### Security Testing
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| **npm audit** | Built-in | Known vulnerability scanning | Checks for CVEs in dependencies |
| **Manual security checklist** | — | OWASP API Security Top 10 | [ASSUMED] Industry standard for API security |
| **Burp Suite Community** | Latest | Manual security testing | [ASSUMED] Standard for API penetration testing |
| **OWASP ZAP** | Latest | Automated DAST | [ASSUMED] Industry standard for dynamic scanning |

### Performance Testing
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| **Chrome DevTools Lighthouse** | Built-in | Frontend performance | [ASSUMED] Standard for web performance testing |
| **curl timing** | System | API response time measurement | Simple, no additional tools needed |

### UAT Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| **UserTesting.com** | — | Remote usability testing | [ASSUMED] Leading platform for remote UAT |
| **Maze.co** | — | User testing and feedback | [ASSUMED] Modern alternative to UserTesting |
| **Google Forms** | — | Feedback collection | Simple, free, familiar to users |

**Installation:**
```bash
# Security tools (optional for manual testing)
# Burp Suite Community: https://portswigger.net/burp/communitydownload
# OWASP ZAP: https://www.zaproxy.org/download/

# UAT platforms (SaaS, no installation)
# UserTesting.com, Maze.co, or use Google Forms for free alternative
```

**Version verification:** All tools are web-based or system utilities. No npm packages required for testing phase.

## Architecture Patterns

### Testing Strategy Pattern: Layered Verification
**What:** Three-layer testing approach — automated API smoke tests, manual functional testing, user acceptance testing.
**When to use:** Post-implementation verification phases where features are complete but untested.
**Example:**
```bash
# Layer 1: Automated API smoke tests
./test-customer-api.sh

# Layer 2: Manual functional testing checklist
# Open http://localhost:3000/customer/login
# Test registration, login, profile, documents, quotes

# Layer 3: UAT with real users
# Recruit 3-5 customers, provide scenarios, collect feedback
```

### Deployment Verification Pattern: Health Check Cascade
**What:** Verify deployment by checking health endpoints, database connectivity, and external dependencies.
**When to use:** After production deployment to confirm all services are operational.
**Example:**
```bash
# Check frontend health
curl https://revivepropertyco.au/health

# Check backend API health
curl https://revivepropertyco.au/api/health

# Check database connectivity
docker exec revivepropertyco-backend node -e "console.log('DB OK')"
```

### UAT Pattern: Scenario-Based Testing
**What:** Provide users with realistic scenarios (not feature lists) to validate business value.
**When to use:** Customer-facing applications where usability matters more than feature completeness.
**Example:**
```
Scenario 1: "You just received a quote for garden maintenance. Log in, review the quote, and approve it."
Scenario 2: "Upload a photo of your property to the customer portal."
Scenario 3: "Update your phone number in your profile."
```

### Anti-Patterns to Avoid
- **Testing only happy paths:** Attackers use edge cases — must test error states, invalid inputs, boundary conditions
- **UAT with internal staff:** Employees know the system too well — must use real customers
- **Skipping security testing:** File uploads and authentication are high-risk surfaces
- **Testing only in Chrome:** Customers use Safari, Firefox, Edge — cross-browser issues common
- **Assuming deployment works:** Verify all routes, especially `/api` proxying through Traefik

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runners | Custom test scripts | Use existing test-customer-api.sh pattern | Already works, uses curl/jq |
| Security scanners | Manual SQL injection tests | npm audit, OWASP ZAP | Professional tools find CVEs you'll miss |
| UAT platforms | Custom feedback forms | UserTesting.com, Maze.co, Google Forms | Video recordings, screen capture, analytics |
| Performance profiling | Custom timing code | Lighthouse, Chrome DevTools | Industry standard, comprehensive metrics |
| Cross-browser testing | Manual browser switching | BrowserStack, LambdaTest (optional) | Device farm, real browsers, automated screenshots |

**Key insight:** Testing infrastructure already exists (test-customer-api.sh, Docker containers). Leverage it rather than rebuilding.

## Runtime State Inventory

> This section applies to rename/refactor phases only. Omitted for post-implementation testing phase.

## Common Pitfalls

### Pitfall 1: Testing Only Happy Paths
**What goes wrong:** All tests pass with valid inputs, but production breaks with edge cases (empty fields, special characters, concurrent uploads).
**Why it happens:** Developers test normal flows, attackers use malformed inputs.
**How to avoid:** Create negative test cases — null values, huge files, wrong file types, expired tokens, SQL injection attempts.
**Warning signs:** No test cases for error states, no security tests, no failure scenario documentation.

### Pitfall 2: UAT with Technical Stakeholders
**What goes wrong:** Internal staff complete UAT successfully, but real customers can't use the portal.
**Why it happens:** Employees know the business logic, customers don't have context.
**How to avoid:** Recruit actual customers (3-5 users), provide scenarios not feature lists, record their sessions.
**Warning signs:** UAT participants are developers, project managers, or business analysts.

### Pitfall 3: Assuming Traefik Proxy Works
**What goes wrong:** Frontend works but `/api/*` routes return 404 or 502 because Traefik labels misconfigured.
**Why it happens:** Docker Compose labels for Traefik are complex, typo in PathPrefix causes routing failures.
**How to avoid:** Explicit test: `curl https://revivepropertyco.au/api/health` must return 200 OK before signing off.
**Warning signs:** Only testing `localhost` URLs, never testing production `/api` endpoints.

### Pitfall 4: File Upload Security Gaps
**What goes wrong:** Attacker uploads malicious file (web shell, virus) despite validation.
**Why it happens:** Client-side validation only, checking file extension not MIME type, missing content verification.
**How to avoid:** Test uploads with: fake extensions (malware.exe.jpg), oversized files (11 MB), MIME type mismatches.
**Warning signs:** File upload tests only use valid PDFs/images, never malicious payloads.

### Pitfall 5: Cross-Browser and Mobile Issues
**What goes wrong:** Portal works in Chrome but breaks in Safari mobile (localStorage issues, flexbox rendering).
**Why it happens:** Tailwind CSS v4 uses modern features, older Safari versions have bugs.
**How to avoid:** Test on Safari iOS, Firefox, Edge; use BrowserStack if device lab unavailable.
**Warning signs:** Only Chrome tested, no mobile viewport testing.

### Pitfall 6: Missing Production Environment Variables
**What goes wrong:** Local development works, production deployment fails because `DATABASE_URL` or `JWT_SECRET` missing.
**Why it happens:** Environment variables in `.env` but not in Docker Compose `environment:` section.
**How to avoid:** Checklist: verify all env vars in docker-compose.yml before deploying.
**Warning signs:** No pre-deployment env var verification step.

## Code Examples

### Automated API Smoke Test
```bash
#!/bin/bash
# Source: test-customer-api.sh (already exists)
BASE_URL="https://revivepropertyco.au/api"

# Test health endpoint
curl -s $BASE_URL/health | jq .

# Test registration
curl -s -X POST $BASE_URL/customer/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","mobile":"0412345678","email":"test@example.com","password":"test1234"}' \
  | jq .
```

### Security Testing Checklist
```bash
# Test 1: SQL Injection attempt
curl -X POST $BASE_URL/customer/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "0412345678'\"'\"' OR 1=1--","password":"test"}'

# Test 2: File upload with fake extension
# Create malicious file
echo "malicious content" > malware.exe.jpg
curl -X POST $BASE_URL/customer/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malware.exe.jpg"

# Test 3: Oversized file (11 MB)
dd if=/dev/zero of=oversized.pdf bs=1M count=11
curl -X POST $BASE_URL/customer/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@oversized.pdf"
```

### UAT Scenario Template
```markdown
## Scenario 1: Approve a Quote

**Background:** You requested a quote for garden maintenance. You just received an email notification that your quote is ready.

**Tasks:**
1. Go to https://revivepropertyco.au/customer/login
2. Log in with your mobile number and password
3. Click "Quotes" in the navigation menu
4. Find the "Garden Maintenance - Front & Back" quote
5. Click "View Details" to see the quote
6. Review the line items and total
7. Click "Approve" button
8. Confirm approval in the dialog
9. Verify the quote status changes to "APPROVED"

**Success criteria:** Quote is approved, status shows "Approved on [date]", no error messages.

**Please speak aloud:** What you're thinking, any confusion, what you like/dislike.
```

### Production Deployment Verification
```bash
#!/bin/bash
# verify-production-deployment.sh

echo "Checking production deployment..."

# Frontend health
echo "1. Frontend health check:"
curl -s https://revivepropertyco.au/ | grep -q "<title>" && echo "✓ Frontend serving" || echo "✗ Frontend down"

# Backend API health
echo "2. Backend API health:"
curl -s https://revivepropertyco.au/api/health | jq -e '.status=="healthy"' && echo "✓ Backend healthy" || echo "✗ Backend down"

# Database connectivity
echo "3. Database connectivity:"
docker exec revivepropertyco-backend pg_isready -U homelab && echo "✓ Database reachable" || echo "✗ Database down"

# Uploads directory
echo "4. Uploads directory:"
docker exec revivepropertyco-backend ls -la /app/uploads/customers && echo "✓ Uploads directory exists" || echo "✗ Uploads missing"

# Environment variables
echo "5. Environment variables:"
docker exec revivepropertyco-backend printenv | grep -E "DATABASE_URL|JWT_SECRET" | wc -l

echo "Production verification complete."
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual API testing with Postman | Automated shell scripts with curl + jq | 2020s+ | Faster regression testing, CI/CD integration |
| Waterfall UAT at end of project | Continuous UAT throughout development | 2018+ | Earlier feedback, fewer surprises |
| Security testing after deployment | Shift-left security (testing during dev) | 2020+ | Cheaper to fix vulnerabilities early |
| Desktop-first testing | Mobile-first responsive testing | 2019+ | 60%+ traffic is mobile |
| Browser-specific testing | Cross-browser testing with automation | 2021+ | BrowserStack, LambdaTest make this feasible |

**Deprecated/outdated:**
- Testing only in Internet Explorer: IE is EOL, focus on Edge/Chrome/Safari/Firefox
- Manual screenshot comparison: Use tools like Percy, Chromatic for automated visual regression
- UAT with internal stakeholders only: Must include real customers for valid feedback

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OWASP ZAP and Burp Suite are industry standards for API security testing | Standard Stack | Alternative tools may be better suited for Express.js APIs |
| A2 | UserTesting.com and Maze.co are leading UAT platforms | Standard Stack | Google Forms may suffice for small-scale UAT, avoiding SaaS costs |
| A3 | Traefik proxy is correctly configured for `/api` routes | Common Pitfalls | If misconfigured, production deployment will fail despite local testing |
| A4 | Cross-browser testing required for customer portal | Common Pitfalls | If 95%+ customers use Chrome, cross-browser testing may be low priority |
| A5 | File upload security validation is sufficient in backend code | Security Domain | If gaps exist, malicious file uploads could compromise server |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (Table is not empty — 5 assumptions need validation)

## Open Questions

1. **Security testing scope**
   - What we know: Backend has parameterized queries, bcrypt password hashing, JWT validation
   - What's unclear: Whether professional penetration testing is required or if manual security checklist suffices
   - Recommendation: Start with OWASP API Security Top 10 checklist, consider professional pen test only if handling sensitive financial data

2. **UAT participant recruitment**
   - What we know: Need 3-5 real customers for UAT
   - What's unclear: How to recruit participants, whether to offer incentives, how many scenarios to test
   - Recommendation: Email existing customers from leads database, offer $50 gift card incentive, target 3-5 users for 1-hour sessions

3. **Cross-browser testing requirements**
   - What we know: Portal uses Tailwind CSS v4, modern JavaScript features
   - What's unclear: Minimum browser versions to support, whether Safari iOS has issues
   - Recommendation: Test on Chrome 120+, Firefox 120+, Safari 17+, Edge 120+; prioritize Safari iOS due to localStorage nuances

4. **Performance targets**
   - What we know: Backend APIs are lightweight, frontend is static files
   - What's unclear: Required load times, concurrent user capacity
   - Recommendation: Use Lighthouse scores (target 90+), test API responses < 500ms, validate under 50 concurrent users

5. **Deployment rollback plan**
   - What we know: Docker Compose deployment, Traefik routing
   - What's unclear: How to rollback if production deployment breaks existing site
   - Recommendation: Tag Docker images before deployment, keep previous container running as rollback safety net

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Deployment verification | ✓ | 29.2.1 | — |
| Docker Compose | Multi-container orchestration | ✗ | — | Use `docker compose` (v2) instead of `docker-compose` (v1) |
| PostgreSQL client | Database verification | ✗ | — | Use `docker exec postgres psql` instead |
| curl | API testing | ✓ | Built-in | — |
| jq | JSON parsing | ✓ | System package | — |
| Chrome DevTools | Frontend debugging | ✓ | Built-in | — |
| npm | Dependency audit | ✓ | System Node.js | — |
| Burp Suite | Security testing | ✗ | — | Use OWASP ZAP or manual checklist |
| OWASP ZAP | Security scanning | ✗ | — | Manual security checklist |
| BrowserStack | Cross-browser testing | ✗ | — | Test on physical devices or use free LambdaTest tier |

**Missing dependencies with no fallback:**
- None — all critical dependencies available

**Missing dependencies with fallback:**
- Docker Compose v1: Use `docker compose` (v2) command instead
- PostgreSQL client: Use `docker exec postgres psql` for database access
- Security tools: Use manual OWASP checklist if tools unavailable

## Validation Architecture

> `workflow.nyquist_validation` is absent from config.json — treat as enabled by default.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual testing + shell scripts (no automated test framework configured) |
| Config file | None — testing is manual via test-customer-api.sh and browser testing |
| Quick run command | `./test-customer-api.sh` (API smoke tests) |
| Full suite command | Manual checklist (see TESTING_GUIDE.md) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-1 | Customer registration | manual + API | `curl -X POST /api/customer/register` | ✅ test-customer-api.sh |
| FR-2 | Customer login | manual + API | `curl -X POST /api/customer/login` | ✅ test-customer-api.sh |
| FR-3 | Customer dashboard | manual | Browser test: http://localhost:3000/customer/dashboard | ✅ pages/customer/DashboardPage.tsx |
| FR-4 | Profile management | manual + API | `curl -X PUT /api/customer/profile` | ✅ test-customer-api.sh |
| FR-5 | Document upload/download | manual + API | Manual browser test + curl API test | ✅ backend API exists |
| FR-6 | Quote approval | manual + API | Manual browser test + curl API test | ✅ backend API exists |
| FR-7 | Navigation and routing | manual | Browser test: HashRouter navigation | ✅ App.tsx routing |
| FR-8 | Logout | manual + API | Browser test: localStorage clear | ✅ CustomerAuthContext.tsx |
| NFR-1 | Performance (< 2s load) | manual | Lighthouse audit | ❌ Need to run |
| NFR-2 | Scalability (1000 concurrent) | manual | Load testing with k6 or similar | ❌ Not implemented |
| SR-1 | Password hashing (bcrypt) | API | Verify database password_hash column | ✅ test-customer-api.sh |
| SR-2 | Customer data isolation | security | Test accessing other customers' data | ❌ Need security tests |
| SR-3 | File upload security | security | Upload malicious files | ❌ Need security tests |

### Sampling Rate
- **Per task commit:** `./test-customer-api.sh` (API smoke tests)
- **Per wave merge:** Manual testing checklist (login, profile, documents, quotes workflows)
- **Phase gate:** Full manual testing + security checklist + UAT sign-off before `/gsd-verify-work`

### Wave 0 Gaps
- **No automated test framework:** Config shows `"testing": {"framework": "manual", "automatedTests": false}` — this is intentional for MVP
- **Missing security tests:** Need to add test cases for SQL injection, file upload attacks, CSRF, XSS
- **Missing performance tests:** Need Lighthouse audit, API response time measurements
- **Missing cross-browser tests:** Need to verify Safari, Firefox, Edge compatibility
- **Framework install:** None needed (manual testing only)

**If this table is empty:** None — gaps identified above.

## Security Domain

> `security_enforcement` is enabled (config shows `"securityAuditRequired": true`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT tokens, bcrypt password hashing (10 rounds), 7-day expiry [VERIFIED: customer.cjs] |
| V3 Session Management | yes | localStorage token storage, token validation on every request [VERIFIED: CustomerAuthContext.tsx] |
| V4 Access Control | yes | Server-side customer_id verification in all queries [VERIFIED: customer.cjs, customerDocuments.cjs, customerQuotes.cjs] |
| V5 Input Validation | yes | Parameterized SQL queries, file type allowlist, file size limits [VERIFIED: all backend APIs] |
| V6 Cryptography | yes | bcrypt for passwords, JWT HS256 for tokens [VERIFIED: server/lib/auth.cjs] |

### Known Threat Patterns for Express.js + File Upload

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Parameterized queries (`$1, $2`) in all SQL statements [VERIFIED: customer.cjs] |
| Brute force login | Denial of Service | Rate limiting on `/api/customer/login` (not yet implemented — security gap) |
| File upload malware | Tampering | Server-side MIME type validation, file size limits, allowlist extensions [VERIFIED: customerDocuments.cjs] |
| Path traversal in uploads | Tampering | Filename sanitization, timestamp prefix, no direct file access [VERIFIED: customerDocuments.cjs] |
| XSS in uploaded files | Tampering | Serve files with `Content-Disposition: attachment`, not inline [VERIFIED: customerDocuments.cjs] |
| JWT token theft | Spoofing | HttpOnly cookies recommended (deferred to Phase 2), currently using localStorage |
| CSRF on API calls | Spoofing | SameSite cookies recommended (deferred), relying on Origin header checks |
| Customer data leakage | Information Disclosure | All queries include `WHERE customer_id = ?` [VERIFIED: all APIs] |

**Security gaps to address:**
1. **No rate limiting on login endpoint** — vulnerable to brute force attacks
2. **localStorage token storage** — vulnerable to XSS (httpOnly cookies deferred to Phase 2)
3. **No CSRF protection** — relying on Same Origin policy, no token validation
4. **No brute force account lockout** — unlimited login attempts allowed

**Recommendation:** Document these gaps in Phase 1, defer to Phase 2 unless UAT reveals security concerns.

## Sources

### Primary (HIGH confidence)
- [VERIFIED: Codebase analysis] — Examined all customer portal source files (customer.cjs, customerDocuments.cjs, customerQuotes.cjs, pages/customer/*.tsx, contexts/CustomerAuthContext.tsx, services/customerService.ts)
- [VERIFIED: Docker deployment] — Analyzed docker-compose.yml, Dockerfile, Dockerfile.backend
- [VERIFIED: Testing infrastructure] — Reviewed test-customer-api.sh, TESTING_GUIDE.md
- [VERIFIED: System environment] — Checked running containers, Docker version, available tools

### Secondary (MEDIUM confidence)
- [ASSUMED: OWASP API Security Top 10] — Industry standard for API security testing
- [ASSUMED: UAT best practices] — Scenario-based testing, real customer recruitment
- [ASSUMED: Cross-browser testing] — BrowserStack, LambdaTest as standard platforms

### Tertiary (LOW confidence)
- [Web search rate-limited] — Unable to verify 2026-specific testing trends due to search service limits
- [ASSUMED: Security tool popularity] — Burp Suite, OWASP ZAP assumed to be current standards

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All testing tools verified from existing codebase and system environment
- Architecture: HIGH - Deployment pattern verified from docker-compose.yml and Dockerfile
- Pitfalls: MEDIUM - Based on common Express.js + file upload vulnerabilities, some assumptions about Traefik
- Security domain: HIGH - Verified from source code analysis, OWASP patterns are well-documented

**Research date:** 2026-04-13
**Valid until:** 7 days (fast-moving testing tools, but core principles stable)
