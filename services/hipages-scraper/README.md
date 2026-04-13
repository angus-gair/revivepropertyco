# Hipages Scraper Service

Automated lead scraper for hipages.com.au with PostgreSQL integration and cron-based scheduling.

## Overview

This microservice runs independently from the main Revive Property Co. application, scraping leads from hipages.com.au every 6 hours and storing them in the shared PostgreSQL database. It emits PostgreSQL NOTIFY events for real-time dashboard updates.

## Architecture

```
┌─────────────────┐
│  Scheduler.js   │ ← Cron job (every 6 hours)
│  (node-cron)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Scraper.js     │ ← Playwright browser automation
│  (playwright)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  db-writer.js   │ ← PostgreSQL integration
│  (pg)           │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │ ← hipages_leads table
│   (NOTIFY)      │
└─────────────────┘
```

## Features

- **Browser Automation**: Uses Playwright for reliable hipages.com.au scraping
- **Direct Database Integration**: Writes leads to PostgreSQL via connection pool
- **Duplicate Prevention**: ON CONFLICT DO UPDATE prevents duplicate leads
- **Real-time Updates**: Emits PostgreSQL NOTIFY events for dashboard
- **Scheduled Execution**: Cron-based scheduling (default: every 6 hours)
- **Lock File**: Prevents concurrent scraper runs
- **Graceful Shutdown**: Proper cleanup on SIGINT/SIGTERM

## Quick Start

### 1. Install Dependencies

```bash
cd /opt/homelab/apps/revivepropertyco/services/hipages-scraper
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your credentials
```

Required environment variables:
- `HIPAGES_USERNAME`: Your hipages.com.au account email
- `HIPAGES_PASSWORD`: Your hipages.com.au account password
- `DATABASE_URL`: PostgreSQL connection string

### 3. Test Database Connection

```bash
npm run test-db
```

This verifies:
- Database connection works
- hipages_leads table exists
- User has INSERT/UPDATE permissions

### 4. Run Scraper

**One-time scrape:**
```bash
npm run scrape
```

**Start scheduler (runs every 6 hours):**
```bash
npm start
```

**Run once on startup, then schedule:**
```bash
RUN_ON_STARTUP=true npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run scrape` | Run single scrape operation |
| `npm start` | Start cron scheduler |
| `npm run test-db` | Test database connection |
| `npm test` | Alias for `npm run scrape` |

## File Structure

```
services/hipages-scraper/
├── src/
│   ├── scraper.js       # Playwright browser automation
│   ├── db-writer.js     # PostgreSQL integration
│   └── scheduler.js     # Cron job scheduling
├── package.json         # NPM dependencies
├── Dockerfile           # Container build configuration
├── .env.example         # Environment variable template
├── test-db-connection.js # Database connection test
├── TESTING.md           # Detailed testing guide
└── README.md            # This file
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HIPAGES_USERNAME` | Yes | - | hipages.com.au account email |
| `HIPAGES_PASSWORD` | Yes | - | hipages.com.au account password |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `HIPAGES_HEADLESS` | No | `true` | Run browser in headless mode |
| `CRON_SCHEDULE` | No | `0 */6 * * *` | Cron schedule for scraping |
| `RUN_ON_STARTUP` | No | `false` | Run scrape on scheduler start |
| `LOCK_FILE` | No | `/tmp/hipages-scraper.lock` | Lock file path |
| `OUTPUT_DIR` | No | `/app/output` | Debug output directory |

## Database Schema

The scraper writes to the `hipages_leads` table (created in migration 002):

```sql
CREATE TABLE hipages_leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hipages_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  postcode TEXT,
  job_type TEXT NOT NULL,
  job_subtype TEXT,
  description TEXT,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'FIRST_TO_ACCEPT', 'WAITLIST', 'ACCEPTED', 'EXPIRED')),
  contact_status TEXT,
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_to_crm BOOLEAN DEFAULT FALSE,
  crm_lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Docker Build

```bash
docker build -t hipages-scraper:latest .
```

### Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  hipages-scraper:
    build: ./services/hipages-scraper
    container_name: hipages-scraper
    restart: unless-stopped
    environment:
      HIPAGES_USERNAME: ${HIPAGES_USERNAME}
      HIPAGES_PASSWORD: ${HIPAGES_PASSWORD}
      DATABASE_URL: ${DATABASE_URL}
      CRON_SCHEDULE: "0 */6 * * *"
    volumes:
      - /tmp/hipages-scraper.lock:/tmp/hipages-scraper.lock
    depends_on:
      - postgres
```

## Security Considerations

1. **Credentials**: Store in `.env` file with 600 permissions
2. **Password Rotation**: Rotate hipages password every 90 days
3. **Database User**: Use read-only user with INSERT/UPDATE on hipages_leads only
4. **Logging**: Never log credentials or DATABASE_URL
5. **Container Security**: Runs as non-root user (scraper)

## Troubleshooting

See [TESTING.md](./TESTING.md) for detailed troubleshooting guide.

## Monitoring

### Check Scraper Logs

```bash
# If running in Docker
docker logs -f hipages-scraper

# If running directly
tail -f /var/log/hipages-scraper.log
```

### Verify Database Writes

```bash
docker exec -i postgres psql -U homelab -d revivepropertyco -c "
  SELECT
    COUNT(*) as total_leads,
    COUNT(CASE WHEN scraped_at > NOW() - INTERVAL '6 hours' THEN 1 END) as recent_leads
  FROM hipages_leads
"
```

### Check Lock File

```bash
# Should show PID if scraper is running
cat /tmp/hipages-scraper.lock

# Should show process details
ps aux | grep node
```

## Development

### Adding New Features

1. **New lead fields**: Add to `scraper.js` parseLeadsFromText(), update migration, db-writer.js
2. **New scrape targets**: Add URL to CONFIG, scrapePage() call in runScrape()
3. **Custom scheduling**: Modify CRON_SCHEDULE env var

### Testing Changes

1. Test locally with `HIPAGES_HEADLESS=false` to see browser
2. Use `RUN_ON_STARTUP=true` for immediate testing
3. Check database writes: `SELECT * FROM hipages_leads ORDER BY scraped_at DESC LIMIT 5`

## Related Files

- Migration: `server/migrations/002_create_hipages_leads_table.sql`
- Plan: `.planning/phases/04-integrate-hipages-lead-scraper-with-real-time-data-sync/04-02-PLAN.md`
- Original POC: `/home/ghost/hipages/scrape-leads.js`

## License

Proprietary - Revive Property Co.
