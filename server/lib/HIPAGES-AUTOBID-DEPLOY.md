# HiPages Auto-Bid (Riv) — Deploy Runbook

Autonomous bidding: scraped HiPages leads already sync to Twenty as Opportunities; the
**external n8n** workflow polls un-evaluated leads, an AI classifies each as
**pressure_washing / regrouting / none**, and matches are auto-accepted on HiPages via the
existing Playwright action server. All money-spending guardrails live server-side in the
Revive backend.

## What changed (files)
- `server/api/hipages.cjs` — new no-auth (X-Action-Secret) routes:
  `GET /api/hipages/auto-bid/candidates`, `POST /api/hipages/auto-bid/decision`.
- `server/lib/autobid-migration-012.sql` + `server/lib/apply-autobid-migration.cjs` — audit columns.
- `.env` — `ACTION_SECRET` (+ `AUTOBID_*` knobs). **Default = enabled but DRY-RUN (never spends).**
- `server/lib/hipages-autobid.n8n.json` — the n8n workflow to import.

### Pre-existing bugs fixed along the way
- `/api/hipages/lead-action` was registered **below** the JWT middleware, so the Twenty CRM
  workflow's secret-only calls always got 401. Moved above it (still gated by `X-Action-Secret`,
  which is now actually set).
- The `hipages_leads.status` CHECK constraint omitted `DECLINED`, so every decline failed at the
  DB update. Migration 012 rebuilds the constraint with `DECLINED` included (added `NOT VALID` so
  unexpected legacy values can't abort the migration; the runner attempts validation afterwards).

> `server/migrations/` and the repo root are not writable by the deploy user, so the migration
> SQL/runner and the workflow JSON live in `server/lib/`. Move them into `server/migrations/012_*`
> / an `automation/` dir later if you want (owned by `linuxuser`).

## Step 1 — Rebuild + restart the backend (picks up new routes + the migration runner)
```bash
cd /opt/deployments/apps/revivepropertyco
sudo docker compose -f docker-compose.yml -f docker-compose.override.yml build backend
sudo docker compose -f docker-compose.yml -f docker-compose.override.yml up -d backend
```

## Step 2 — Apply the DB migration (idempotent; runs inside the container that can reach Postgres)
```bash
sudo docker exec revivepropertyco-backend node server/lib/apply-autobid-migration.cjs
# expect: "auto_bid columns present: auto_bid_at, auto_bid_confidence, auto_bid_reason, auto_bid_service_line, auto_bid_status"
```

## Step 3 — Verify the endpoints (run from anywhere; SECRET is in .env)
```bash
SECRET=<ACTION_SECRET — value lives in .env, do not commit>
BASE=https://revivepropertyco.au/api/hipages

# Candidates (synced, open, un-evaluated leads):
curl -s -H "X-Action-Secret: $SECRET" "$BASE/auto-bid/candidates?limit=5" | jq

# Wrong/no secret must 401:
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/auto-bid/candidates"   # -> 401

# Decision in dry-run: pick a real opportunityId from the candidates output, then:
curl -s -X POST -H "X-Action-Secret: $SECRET" -H 'Content-Type: application/json' \
  -d '{"opportunityId":"<UUID>","decision":"accept","service_line":"pressure_washing","confidence":0.9,"reason":"manual test"}' \
  "$BASE/auto-bid/decision" | jq
# dry-run => { success:true, dryRun:true, recorded:"SKIPPED", would:"accept" }  (no credits spent)
```

## Step 4 — Import + configure the n8n workflow (n8n.ajinsights.com.au, host: v-rogue)
1. n8n → **Workflows → Import from File** → `server/lib/hipages-autobid.n8n.json`.
2. Open the **Config** node and replace:
   - `actionSecret` → the `ACTION_SECRET` value from `.env` (above).
   - `glmKey` → your GLM API key. (`glmUrl`/`glmModel` default to the Z.AI coding endpoint
     used by "Riv": `glm-4.7`, `thinking: disabled`. Swap to your Gemini/OpenAI endpoint if preferred.)
3. **Execute Workflow** once manually. Inspect the **Classify + decide** node output — confirm
   pressure-wash/regrout leads come back `decision:"accept"` and unrelated leads `"skip"`.
   - If your n8n version errors on `this.helpers.httpRequest` inside the Code node, replace that
     GLM call with a dedicated **HTTP Request** node and a small parser Code node.
4. Activate the workflow (5-min schedule).

## Step 5 — Validate, then GO LIVE
- Let it run in **dry-run** for a while. Review decision quality:
  ```bash
  sudo docker exec revivepropertyco-backend node -e "require('./server/lib/database.cjs').query(\
    \"SELECT auto_bid_status, auto_bid_service_line, auto_bid_confidence, auto_bid_reason, job_type, suburb \
     FROM hipages_leads WHERE auto_bid_at IS NOT NULL ORDER BY auto_bid_at DESC LIMIT 50\").then(r=>{console.table(r.rows);process.exit(0)})"
  ```
  Tune the prompt/keywords in the workflow and `AUTOBID_MIN_CONFIDENCE` as needed.
- When satisfied, flip dry-run off and restart the backend:
  ```bash
  sed -i 's/^AUTOBID_DRY_RUN=true/AUTOBID_DRY_RUN=false/' .env
  sudo docker compose -f docker-compose.yml -f docker-compose.override.yml up -d backend
  ```
  Guardrails remain: `AUTOBID_DAILY_CAP=10`, `AUTOBID_MAX_CREDITS=60`. Instant kill switch:
  set `AUTOBID_ENABLED=false` and restart the backend.
- (Optional) To re-evaluate leads that were skipped *only because of dry-run* after going live:
  ```sql
  UPDATE hipages_leads SET auto_bid_status = NULL
   WHERE auto_bid_status = 'SKIPPED' AND auto_bid_reason LIKE 'dry-run%';
  ```

## Guardrail / behaviour reference (`.env`)
| Var | Default | Effect |
|-----|---------|--------|
| `ACTION_SECRET` | (set) | Required header for `/auto-bid/*` and `/lead-action`. |
| `AUTOBID_ENABLED` | `true` | `false` → endpoint records nothing, returns `skipped:disabled`. |
| `AUTOBID_DRY_RUN` | `true` | Accept-intent leads recorded as `SKIPPED "dry-run: would accept"`, **no credits spent**. |
| `AUTOBID_MIN_CONFIDENCE` | `0.7` | Accept below this confidence → `SKIPPED low_confidence`. |
| `AUTOBID_MAX_CREDITS` | `60` | Accept above this credit cost → `SKIPPED over_ceiling`. `0` = no ceiling. |
| `AUTOBID_DAILY_CAP` | `10` | After N accepts today → `SKIPPED daily_cap`. `0` = no cap. |
| `AUTOBID_ACCEPT_STAGE` / `AUTOBID_SKIP_STAGE` | blank | Optional Twenty stage move (NEW/SCREENING/MEETING/PROPOSAL/CUSTOMER). |

## Decision outcomes (in `hipages_leads.auto_bid_status`)
`ACCEPTED` (live bid placed) · `SKIPPED` (not a match, guardrail-blocked, or dry-run) ·
`FAILED` (scraper reported the lead expired / button gone). `NULL` = not yet evaluated.
429/unreachable from the scraper are **not** recorded (left for n8n to retry).
