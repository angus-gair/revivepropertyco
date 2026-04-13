# Hipages Scraper Testing Guide

## Prerequisites

1. **Hipages Account**: You need a valid hipages.com.au business account with access to /leads and /jobs pages
2. **Database Access**: PostgreSQL database must be running and accessible
3. **Environment Variables**: Copy `.env.example` to `.env` and fill in required values

## Setup

### 1. Create Environment File

```bash
cd /opt/homelab/apps/revivepropertyco/services/hipages-scraper
cp .env.example .env
```

Edit `.env` and add your credentials:
- `HIPAGES_USERNAME`: Your hipages.com.au account email
- `HIPAGES_PASSWORD`: Your hipages.com.au account password
- `DATABASE_URL`: PostgreSQL connection string

### 2. Install Dependencies (already done)

```bash
npm install
```

## Testing

### Option A: One-Time Manual Scrape

Run a single scrape operation:

```bash
npm run scrape
```

**Expected output:**
```
[scraper] Starting hipages scrape...
[scraper] Navigating to login page...
[scraper] Found email input: input[name="email"]
[scraper] Entered email: your-email@example.com
[scraper] Clicked Next button
[scraper] Looking for "log in with password" option...
[scraper] Password entered
[scraper] Clicked login button
[scraper] Waiting for redirect after login...
[scraper] Current URL: https://business.hipages.com.au/leads
[scraper] Scraping leads page...
[scraper] leads page title: Leads - hipages
[scraper] Found 15 leads on leads
[scraper] Scraping jobs page...
[scraper] jobs page title: Jobs - hipages
[scraper] Found 8 leads on jobs
[scraper] Total leads extracted: 23
[scraper] Saving leads to database...
[db-writer] Saved 23 leads to database
[scraper] Scrape complete: 23 leads saved
```

### Option B: Start Scheduler Service

Run the cron-based scheduler:

```bash
# Run once on startup, then every 6 hours
RUN_ON_STARTUP=true npm start
```

**Expected output:**
```
[scheduler] Hipages scraper scheduler starting...
[scheduler] Cron schedule: 0 */6 * * * (every 6 hours)
[scheduler] RUN_ON_STARTUP=true, running initial scrape...
[scheduler] Starting scheduled scrape
[scheduler] Time: 2026-04-13T10:00:00.000Z
[scheduler] Lock acquired (PID 12345)
[scraper] Starting hipages scrape...
... (scrape output) ...
[scheduler] Scrape completed: 23 leads saved, 0 updated
[scheduler] Lock released
[scheduler] Hipages scraper scheduler started
[scheduler] Next scrape will run at the top of the next 6-hour window
[scheduler] Press Ctrl+C to stop
```

## Verification

### 1. Check Database Writes

```bash
# Connect to PostgreSQL database
docker exec -i postgres psql -U homelab -d revivepropertyco -c "SELECT COUNT(*) FROM hipages_leads"

# View recent leads
docker exec -i postgres psql -U homelab -d revivepropertyco -c "SELECT lead_id, customer_name, suburb, job_type, status, posted_date FROM hipages_leads ORDER BY posted_date DESC LIMIT 5"

# Check for duplicates (should be 0 due to ON CONFLICT)
docker exec -i postgres psql -U homelab -d revivepropertyco -c "SELECT hipages_id, COUNT(*) FROM hipages_leads GROUP BY hipages_id HAVING COUNT(*) > 1"
```

### 2. Check PostgreSQL NOTIFY Events

If you have LISTEN/NOTIFY enabled in your backend, you should see `hipages_leads_updated` events after each scrape.

### 3. Check Lock File

```bash
# Lock file should exist during scrape, be removed after
cat /tmp/hipages-scraper.lock
```

## Troubleshooting

### Authentication Failures

**Error**: "Login failed - still on login page"
- Verify HIPAGES_USERNAME and HIPAGES_PASSWORD are correct
- Check if hipages.com.au is accessible from your network
- Try running with `HIPAGES_HEADLESS=false` to see the browser

### Database Connection Errors

**Error**: "Connection refused" or "authentication failed"
- Verify DATABASE_URL is correct
- Check PostgreSQL container is running: `docker ps | grep postgres`
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### No Leads Found

**Error**: "Found 0 leads on leads"
- Check if your hipages account actually has leads/jobs
- Verify hipages.com.au page structure hasn't changed
- Run with `HIPAGES_HEADLESS=false` to debug

### Lock File Issues

**Error**: "Scraper already running (PID 12345)"
- Check if scraper is actually running: `ps aux | grep node`
- If not, remove stale lock: `rm /tmp/hipages-scraper.lock`

### Playwright Browser Errors

**Error**: "Executable doesn't exist"
- Reinstall Playwright browsers: `npx playwright install chromium`

## Security Notes

1. **Never commit `.env` file** - it contains sensitive credentials
2. **Rotate passwords regularly** - Every 90 days as per threat model
3. **Use read-only database user** - Scraper only needs INSERT/UPDATE on hipages_leads table
4. **Monitor logs for credential leaks** - Scraper should never log passwords

## Next Steps After Testing

1. **Containerize**: Build Docker image with `docker build -t hipages-scraper .`
2. **Deploy**: Add to docker-compose.yml with environment variables
3. **Monitor**: Check logs and database regularly
4. **Schedule**: Verify cron runs at expected times (every 6 hours)
