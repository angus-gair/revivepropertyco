# Phase 5: CRM Opportunity Integration - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build backend endpoint and frontend Promote button to promote scraped Hipages leads into Twenty CRM Opportunities, resolving/matching the contact as a Twenty CRM Person and mapping all lead metadata. Write Playwright E2E tests to verify the integration.

</domain>

<decisions>
## Implementation Decisions

### Promote Endpoint & Twenty Integration
- **D-01:** Implement `POST /api/hipages/leads/:id/promote-opportunity` in `server/api/hipages.cjs`.
- **D-02:** First check if the lead has already been promoted (`synced_to_crm = true`).
- **D-03:** Read the tenant's Twenty workspace and token details (fallback to global environment variables if empty).
- **D-04:** Check if a Person with the lead's customer name exists in Twenty CRM, or create a new Person.
- **D-05:** Create an Opportunity in Twenty CRM linked to the Person with:
  - `name`: `"[Job Type] - [Customer Name] - [Suburb]"`
  - `amount`: Map estimated value from the lead (e.g. `credits` * $20 in micro-currency) or standard default.
  - `stage`: Set to `'NEW'`.
  - `description`: Set to the full lead description + metadata.
- **D-06:** Update the local database `hipages_leads` record to set `synced_to_crm = TRUE` and store the created Opportunity ID in `crm_lead_id`.

### Frontend UI Promote Action
- **D-07:** Update `HipagesLeadsNoAuthPage.tsx` to display a "Promote to CRM" button.
- **D-08:** The button should show loading status during promotion and disable itself once successfully promoted.
- **D-09:** Render an "Opportunity Created" badge for promoted leads linking to Twenty CRM.

### E2E Testing
- **D-10:** Add a Playwright test file `tests/hipages-crm-opportunity.spec.ts` that mocks Twenty CRM's GraphQL API endpoints and tests the full UI promotion flow.

</decisions>

<canonical_refs>
## Canonical References

### CRM & API Wrappers
- `server/lib/twenty-client.cjs` — Twenty Client API wrapper
- `server/api/hipages.cjs` — Hipages routes and accept endpoint

### UI Pages
- `pages/admin/HipagesLeadsNoAuthPage.tsx` — Scraped leads dashboard UI

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TwentyClient` class (`server/lib/twenty-client.cjs`) can execute GraphQL queries and mutations.
- `createPerson` function inside `services/twenty-migrate/import-to-twenty.cjs` is a reusable GraphQL pattern.

</code_context>

<deferred>
## Deferred Ideas

- None.

</deferred>

---

*Phase: 05-crm-opportunity-integration*
*Context gathered: 2026-05-30*
