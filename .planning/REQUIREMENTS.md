# Requirements: CRM Opportunity Integration (v1.1-opportunities)

**Defined:** 2026-05-30
**Core Value:** Automatically promote scraped Hipages leads into Twenty CRM Opportunities directly from the admin dashboard to streamline client acquisition.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### CRM Opportunity Promotion

- [x] **OPP-01**: The system SHALL provide a backend endpoint `POST /api/hipages/leads/:id/promote-opportunity` to promote a scraped Hipages lead.
- [x] **OPP-02**: The promote API SHALL look up the corresponding Hipages lead in the database and verify it has not already been promoted/synced to an Opportunity.
- [x] **OPP-03**: The promote API SHALL search for an existing `Person` record in Twenty CRM by the lead's customer name or create a new `Person` record using the customer name.
- [x] **OPP-04**: The promote API SHALL create an `Opportunity` record in Twenty CRM linked to the matched or newly created `Person` record.
- [x] **OPP-05**: The promote API SHALL map all available data from the Hipages lead into the `Opportunity` fields:
  - `name`: Generated as `"[Job Type] - [Customer Name] - [Suburb]"`
  - `amount`: Set from the lead's estimated value or standard default based on service type
  - `stage`: Set to the default initial opportunity stage in Twenty CRM (e.g. `NEW` or `DISCOVERY`)
  - `description`: Set to the full lead description, including job sub-type, posted date, and credits details.
- [x] **OPP-06**: The promote API SHALL update the local database `hipages_leads` record:
  - Set `synced_to_crm = TRUE`
  - Set `crm_lead_id` (or a new field `crm_opportunity_id`) to the newly created Twenty CRM Opportunity ID.
- [x] **OPP-07**: The contractor leads UI (`/contractors/hp-leads` page) SHALL display a "Promote to CRM" button for each lead.
- [x] **OPP-08**: The "Promote to CRM" button SHALL show a loading spinner during API execution and disable itself once the lead is successfully promoted.
- [x] **OPP-09**: The leads list and detail view SHALL display a visual indicator (e.g. "Opportunity Created" badge) with a direct hyperlink pointing to the Twenty CRM Opportunity URL (`https://crm.revivepropertyco.au/objects/opportunities`) for all successfully promoted leads.
- [x] **OPP-10**: The promote UI and API actions SHALL require the contractor/admin to be authenticated with a valid JWT token.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Automated Pipelines

- **AUTO-01**: Auto-promote new scraped leads to Opportunities if they meet predefined category and location filters.
- **AUTO-02**: Automatically generate Quote objects in Twenty CRM when an Opportunity is created.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-workspace routing | Each tenant is currently mapped to a single workspace, which is sufficient for v1. |
| Custom Opportunity stages | Standard initial Opportunity stage will be used for simplicity. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OPP-01 | Phase 5 | Satisfied |
| OPP-02 | Phase 5 | Satisfied |
| OPP-03 | Phase 5 | Satisfied |
| OPP-04 | Phase 5 | Satisfied |
| OPP-05 | Phase 5 | Satisfied |
| OPP-06 | Phase 5 | Satisfied |
| OPP-07 | Phase 5 | Satisfied |
| OPP-08 | Phase 5 | Satisfied |
| OPP-09 | Phase 5 | Satisfied |
| OPP-10 | Phase 5 | Satisfied |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-30*
*Last updated: 2026-05-30 after initial definition*
