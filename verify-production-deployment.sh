#!/bin/bash

# Production Deployment Verification Script for hipages Scraper
# This script checks the health of the hipages-scraper container, database, logs, and dashboard

set -e

# Configuration
CONTAINER_NAME="revive-hipages-scraper"
DB_NAME="revivepropertyco"
DB_USER="homelab"
DB_HOST="postgres"
DB_PORT="5432"
DASHBOARD_URL="https://revivepropertyco.au/admin/hipages-leads"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_container_health() {
  echo -e "\n${YELLOW}Checking container health...${NC}"

  # Check if container is running
  if docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${GREEN}✓ Container $CONTAINER_NAME is running${NC}"
  else
    echo -e "${RED}✗ Container $CONTAINER_NAME is not running${NC}"
    return 1
  fi

  # Check container health status
  HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-healthcheck")

  if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✓ Container health status: $HEALTH_STATUS${NC}"
  elif [ "$HEALTH_STATUS" = "starting" ]; then
    echo -e "${YELLOW}⚠ Container health status: $HEALTH_STATUS (still starting)${NC}"
  else
    echo -e "${RED}✗ Container health status: $HEALTH_STATUS${NC}"
    return 1
  fi

  return 0
}

check_recent_scrapes() {
  echo -e "\n${YELLOW}Checking for recent scrapes in database...${NC}"

  # Query database for recent scrapes (last 24 hours)
  QUERY="SELECT COUNT(*), MAX(scraped_at) FROM hipages_leads WHERE scraped_at > NOW() - INTERVAL '24 hours'"

  # Try to connect to postgres container and run query
  RESULT=$(docker exec postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "$QUERY" 2>/dev/null || echo "0 |")

  COUNT=$(echo "$RESULT" | awk '{print $1}' | tr -d ' ')
  LAST_SCRAPE=$(echo "$RESULT" | awk '{print $2}' | tr -d ' ')

  if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $COUNT recent leads (last 24 hours)${NC}"
    echo -e "  Last scrape: $LAST_SCRAPE"
    return 0
  else
    echo -e "${RED}✗ No recent scrapes found in database${NC}"
    echo -e "  This might be normal if scraper hasn't run yet (scheduled every 6 hours)"
    return 1
  fi
}

check_scraper_logs() {
  echo -e "\n${YELLOW}Checking scraper logs for successful runs...${NC}"

  # Check logs for successful scrape completion
  LOGS=$(docker compose logs --tail=100 hipages-scraper 2>/dev/null || echo "")

  if echo "$LOGS" | grep -q "Scrape completed"; then
    echo -e "${GREEN}✓ Found successful scrape completion in logs${NC}"

    # Show last 3 scrape completion lines
    echo -e "  Recent completions:"
    echo "$LOGS" | grep "Scrape completed" | tail -3 | sed 's/^/    /'

    return 0
  else
    echo -e "${YELLOW}⚠ No scrape completion found in recent logs${NC}"
    echo -e "  This might be normal if scraper hasn't run yet (scheduled every 6 hours)"
    return 1
  fi
}

check_dashboard_access() {
  echo -e "\n${YELLOW}Checking dashboard HTTP access...${NC}"

  # Check HTTP response code
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Dashboard accessible (HTTP $HTTP_CODE)${NC}"
    return 0
  elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ Dashboard responding (HTTP $HTTP_CODE - auth required/redirect)${NC}"
    return 0
  else
    echo -e "${RED}✗ Dashboard not accessible (HTTP $HTTP_CODE)${NC}"
    return 1
  fi
}

test_realtime_sync() {
  echo -e "\n${YELLOW}Testing real-time sync (NOTIFY mechanism)...${NC}"

  # Send a test NOTIFY
  echo "  Sending test NOTIFY to database..."
  docker exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "NOTIFY hipages_leads_updated, '{\"count\": 1, \"test\": true}'" >/dev/null 2>&1

  # Check backend logs for sync message
  sleep 1
  BACKEND_LOGS=$(docker compose logs --tail=50 backend 2>/dev/null || echo "")

  if echo "$BACKEND_LOGS" | grep -q "hipages_leads_updated"; then
    echo -e "${GREEN}✓ Real-time sync working (backend received NOTIFY)${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ Could not verify NOTIFY reception in backend logs${NC}"
    echo -e "  This requires WebSocket/real-time sync implementation to verify"
    return 1
  fi
}

check_database_connection() {
  echo -e "\n${YELLOW}Checking database connection from scraper container...${NC}"

  # Test database connectivity from scraper container using same syntax as healthcheck
  DB_TEST=$(docker exec "$CONTAINER_NAME" node -e "new (require('pg').Client)(process.env.DATABASE_URL).connect().then(() => console.log('OK')).catch(() => console.log('FAIL'))" 2>/dev/null || echo "FAIL")

  if [ "$DB_TEST" = "OK" ]; then
    echo -e "${GREEN}✓ Scraper can connect to database${NC}"
    return 0
  else
    echo -e "${RED}✗ Scraper cannot connect to database${NC}"
    return 1
  fi
}

# Main execution
main() {
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}hipages Scraper Production Verification${NC}"
  echo -e "${YELLOW}========================================${NC}"

  FAILED=0

  # Run all checks
  check_container_health || FAILED=$((FAILED + 1))
  check_database_connection || FAILED=$((FAILED + 1))
  check_recent_scrapes || true  # Don't fail if no recent scrapes (might be scheduled)
  check_scraper_logs || true    # Don't fail if no logs yet
  check_dashboard_access || FAILED=$((FAILED + 1))
  test_realtime_sync || true    # Don't fail if real-time sync not verified

  echo -e "\n${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Verification Summary${NC}"
  echo -e "${YELLOW}========================================${NC}"

  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical checks passed! ✓${NC}"
    exit 0
  else
    echo -e "${RED}$FAILED critical check(s) failed${NC}"
    exit 1
  fi
}

# Run main function
main
