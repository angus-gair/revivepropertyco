#!/usr/bin/env bash
# ============================================================================
# HiPages Auto-Bid — ONE-SHOT GO LIVE  (run with sudo)
#   sudo bash server/lib/go-live.sh
#
# Does everything:
#   1. Rebuild + restart the backend (new /auto-bid + /ai routes)
#   2. Apply DB migration 012 (auto_bid audit columns + status constraint fix)
#   3. Smoke-test the endpoints (auth, candidates, OpenRouter)
#   4. Import + ACTIVATE the n8n workflow via the n8n CLI (no API key needed),
#      with ACTION_SECRET + OPENROUTER_API_KEY auto-injected from .env
#   5. Restart n8n so the schedule trigger registers, then show first candidates
#
# Stays in DRY-RUN (AUTOBID_DRY_RUN=true) — spends NO credits. Flip later to go fully live.
# ============================================================================
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"
NODE=/usr/bin/node
N8N_CONTAINER=n8n
WF_NAME="HiPages Auto-Bid (Riv)"
DC="docker compose -f docker-compose.yml -f docker-compose.override.yml"

echo "############################################################"
echo "# HiPages Auto-Bid — GO LIVE (dry-run mode)"
echo "############################################################"

echo; echo "=== [1/5] Rebuild + restart backend ==="
$DC build backend && $DC up -d backend || { echo "✗ backend build/up failed"; exit 1; }
echo "Waiting 8s for backend..."; sleep 8

echo; echo "=== [2/5] Apply migration 012 ==="
docker exec revivepropertyco-backend node server/lib/apply-autobid-migration.cjs || { echo "✗ migration failed"; exit 1; }

echo; echo "=== [3/5] Smoke-test endpoints ==="
SECRET=$(grep '^ACTION_SECRET=' .env | cut -d= -f2-)
BASE=https://revivepropertyco.au/api/hipages
echo -n "  /auto-bid/candidates no secret (want 401): "; curl -so /dev/null -w "%{http_code}\n" "$BASE/auto-bid/candidates"
echo    "  /auto-bid/candidates with secret:"
curl -sf -H "X-Action-Secret: $SECRET" "$BASE/auto-bid/candidates?limit=3" | python3 -m json.tool 2>/dev/null | head -30 || echo "    (no candidates yet or error)"
echo    "  /ai/chat (live OpenRouter call):"
curl -sf -X POST -H 'Content-Type: application/json' -d '{"message":"Reply with exactly: OK"}' "$BASE/ai/chat" | python3 -m json.tool 2>/dev/null || echo "    ✗ /ai/chat failed (check OPENROUTER_API_KEY)"

echo; echo "=== [4/5] Import + activate n8n workflow (CLI, no API key) ==="
TMP=/tmp/hipages-autobid-injected.json
$NODE server/lib/n8n-import.cjs --emit "$TMP" || { echo "✗ could not build injected workflow"; exit 1; }

# Idempotency: skip import if a workflow with this name already exists
EXISTING_ID=$(docker exec "$N8N_CONTAINER" n8n list:workflow 2>/dev/null | awk -F'|' -v n="$WF_NAME" '$2==n{print $1; exit}')
if [ -n "${EXISTING_ID:-}" ]; then
  echo "  Workflow already present (id=$EXISTING_ID) — re-activating, not duplicating."
  WF_ID="$EXISTING_ID"
else
  docker cp "$TMP" "$N8N_CONTAINER":/tmp/wf.json || { echo "✗ docker cp failed"; exit 1; }
  docker exec "$N8N_CONTAINER" n8n import:workflow --input=/tmp/wf.json || { echo "✗ n8n import failed"; exit 1; }
  docker exec "$N8N_CONTAINER" rm -f /tmp/wf.json
  WF_ID=$(docker exec "$N8N_CONTAINER" n8n list:workflow 2>/dev/null | awk -F'|' -v n="$WF_NAME" '$2==n{print $1; exit}')
  echo "  Imported workflow id=$WF_ID"
fi
rm -f "$TMP"

if [ -z "${WF_ID:-}" ]; then echo "✗ could not determine workflow id — import may have failed"; exit 1; fi
docker exec "$N8N_CONTAINER" n8n update:workflow --id="$WF_ID" --active=true && echo "  ✓ activated id=$WF_ID"

echo; echo "=== [5/5] Restart n8n so schedule trigger registers ==="
docker restart "$N8N_CONTAINER" >/dev/null && echo "  ✓ n8n restarted"
sleep 6

echo
echo "############################################################"
echo "# DONE — auto-bid is LIVE in DRY-RUN."
echo "#  - Backend routes deployed, migration applied"
echo "#  - n8n workflow '$WF_NAME' active (id=$WF_ID), 5-min schedule"
echo "#  - AUTOBID_DRY_RUN=true → classifies real leads, spends NOTHING yet"
echo "#"
echo "# Watch decisions accumulate:"
echo "#   docker exec revivepropertyco-backend node -e \"require('./server/lib/database.cjs').query(\\\"SELECT auto_bid_status,auto_bid_service_line,auto_bid_confidence,auto_bid_reason,job_type,suburb FROM hipages_leads WHERE auto_bid_at IS NOT NULL ORDER BY auto_bid_at DESC LIMIT 30\\\").then(r=>{console.table(r.rows);process.exit()})\""
echo "#"
echo "# To go FULLY LIVE (spend credits) once decisions look right:"
echo "#   sed -i 's/^AUTOBID_DRY_RUN=true/AUTOBID_DRY_RUN=false/' .env && $DC up -d backend"
echo "############################################################"
