#!/usr/bin/env bash
# Auto-bid deploy — rebuild backend, apply migration, smoke-test endpoints.
# Run from /opt/deployments/apps/revivepropertyco:
#   sudo bash server/lib/deploy-autobid.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
echo "=== [1/4] Build backend ==="
docker compose -f docker-compose.yml -f docker-compose.override.yml build backend

echo "=== [2/4] Restart backend ==="
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d backend
echo "Waiting 8s for backend to come up..."
sleep 8

echo "=== [3/4] Apply migration 012 ==="
docker exec revivepropertyco-backend node server/lib/apply-autobid-migration.cjs

echo "=== [4/4] Smoke tests ==="
SECRET=$(grep '^ACTION_SECRET=' .env | cut -d= -f2-)
BASE=https://revivepropertyco.au/api/hipages

echo "--- health ---"
curl -sf "$BASE/debug" | python3 -m json.tool --no-ensure-ascii 2>/dev/null || curl -sf "$BASE/debug"

echo "--- candidates (no secret → 401) ---"
STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE/auto-bid/candidates")
[ "$STATUS" = "401" ] && echo "✓ 401 as expected" || echo "✗ got $STATUS (expected 401)"

echo "--- candidates (with secret) ---"
curl -sf -H "X-Action-Secret: $SECRET" "$BASE/auto-bid/candidates?limit=5" \
  | python3 -m json.tool --no-ensure-ascii 2>/dev/null \
  || curl -sf -H "X-Action-Secret: $SECRET" "$BASE/auto-bid/candidates?limit=5"

echo "--- lead-action auth check (no secret → 401) ---"
STATUS=$(curl -so /dev/null -w "%{http_code}" -X POST -H 'Content-Type: application/json' \
  -d '{"opportunityId":"test","action":"accept"}' "$BASE/lead-action")
[ "$STATUS" = "401" ] && echo "✓ 401 as expected" || echo "✗ got $STATUS (expected 401)"

echo "--- OpenRouter AI chat (live model call) ---"
curl -sf -X POST -H 'Content-Type: application/json' \
  -d '{"message":"Reply with exactly: OK"}' "$BASE/ai/chat" \
  | python3 -m json.tool --no-ensure-ascii 2>/dev/null \
  || echo "✗ /ai/chat failed (check OPENROUTER_API_KEY in .env)"

echo "=== Done. Review candidates output above. ==="
echo "When ready to go live: set AUTOBID_DRY_RUN=false in .env and re-run up -d backend."
