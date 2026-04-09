# Revive Property Co. - Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Configure Environment Variables

Copy the example environment file and fill in your actual values:

```bash
cp .env.production.example .env.production
nano .env.production  # Or your preferred editor
```

**Required Variables:**
- `RESEND_API_KEY` - Get from https://resend.com/api-keys
- `JWT_SECRET` - Generate a strong random string (e.g., use: `openssl rand -base64 32`)
- `ADMIN_EMAIL_1/2/3` - Already configured
- `DATABASE_URL` - Already configured for homelab
- `GLM_API_KEY` - Already configured (if needed)

### 2. Verify Database Connection

Test the PostgreSQL connection:

```bash
docker exec -i postgres psql -U homelab -d revivepropertyco -c "SELECT NOW();"
```

Expected output: Current timestamp

### 3. Update Admin Password

The admin user was created with a temporary hash. To update with proper bcrypt hash:

```bash
# In a Node.js environment
node -e "const bcrypt = require('bcryptjs'); bcrypt.genSalt(10).then(salt => bcrypt.hash('YourStrongPassword', salt).then(hash => console.log(hash)))"
```

Then update the database:
```bash
docker exec -i postgres psql -U homelab -d revivepropertyco -c "UPDATE admin_users SET password_hash = 'YOUR_BCRYPT_HASH' WHERE username = 'admin';"
```

## 🚀 Deployment

### Quick Deploy (Using Script)

```bash
./deploy.sh
```

This will:
1. ✅ Build Docker image (frontend + backend)
2. ✅ Stop existing container
3. ✅ Start new container
4. ✅ Run health checks
5. ✅ Display access URLs

### Manual Deploy (Using Docker Compose)

```bash
# Build
docker-compose -f docker-compose.production.yml build

# Deploy
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## 📊 Post-Deployment Verification

### 1. Automated System Validation

Run the following scripts to verify system integrity post-deployment:

```bash
# E2E Booking & Email Chain Test
./final-booking-test.sh

# AI Concierge Performance Benchmark
node test-riv-performance.cjs
```

### 2. Manual Health Check

Check the backend health endpoint:

```bash
curl https://revivepropertyco.au/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-09T03:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### 3. Concierge Latency Check

Verify that the AI responses are under the 3000ms threshold:

```bash
node test-riv-performance.cjs | grep "Duration"
```

Expected output: `Duration: < 2500 ms` per query.

### 2. Test Booking Flow

1. Visit https://revivepropertyco.au
2. Navigate to booking page
3. Fill out the form with valid data
4. Select a date and time slot
5. Submit the booking
6. Verify:
   - Success page appears with booking reference
   - Email received at customer email
   - Email received at admin emails (all 3)
   - Database contains lead, appointment, and touchpoint records

### 3. Test Double-Booking Prevention

1. Open two browser tabs
2. Fill booking form in both tabs
3. Select the same date and time slot
4. Submit both bookings at the same time
5. Verify:
   - First booking succeeds
   - Second booking fails with "time slot already booked" error
   - Database UNIQUE constraint prevents duplicate

### 4. Test Admin Auth

```bash
curl -X POST https://revivepropertyco.au/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "admin-1",
    "username": "admin",
    "email": "admin@revivepropertyco.au"
  }
}
```

### 5. Test API Endpoints

**Availability API:**
```bash
curl "https://revivepropertyco.au/api/availability?date=2026-03-15"
```

**Touchpoints API** (requires JWT):
```bash
curl -X POST https://revivepropertyco.au/api/touchpoints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"PAGE_VIEW","metadata":{"page":"landing"}}'
```

## 🔧 Troubleshooting

### Container won't start

```bash
# Check if port 80 is already in use
docker ps | grep revivepropertyco

# View logs
docker-compose -f docker-compose.production.yml logs revivepropertyco
```

### Health check failing

```bash
# Check if backend is running
docker exec revivepropertyco ps aux | grep node

# Check database connectivity
docker exec revivepropertyco node -e "console.log('DB URL:', process.env.DATABASE_URL)"

# View database
docker exec -i postgres psql -U homelab -d revivepropertyco -c "\dt"
```

### Emails not sending

```bash
# Check Resend API key
grep RESEND_API_KEY .env.production

# Test Resend connection directly
node -e "const { Resend } = require('resend'); const resend = new Resend(process.env.RESEND_API_KEY); resend.emails.send({ from: 'test@revivepropertyco.au', to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' }).then(console.log).catch(console.error)"
```

## 📝 Monitoring

### View Application Logs

```bash
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

### Monitor Resource Usage

```bash
docker stats revivepropertyco
```

### View Failed Queue

```bash
curl https://revivepropertyco.au/api/queue
```

## 🔄 Updates and Rollbacks

### To Update the Application

```bash
# 1. Build new image
./deploy.sh

# Script handles restart automatically
```

### To Rollback (If Issues Occur)

```bash
# Stop current deployment
docker-compose -f docker-compose.production.yml down

# Revert to previous version
# (You should use git tags for versioning)
git checkout <previous-version-tag>

# Re-deploy
./deploy.sh
```

## 📌 Cleanup

### Remove Failed Queue

```bash
# Via API
curl -X DELETE https://revivepropertyco.au/api/queue/clear \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Pending Touchpoints

```bash
curl https://revivepropertyco.au/api/touchpoints/lead/<LEAD_ID> \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📞 Support & Maintenance

### Important Files

| File | Purpose |
|------|---------|
| `Dockerfile.production` | Production Docker build configuration |
| `docker-compose.production.yml` | Production container orchestration |
| `.env.production` | Production environment variables |
| `deploy.sh` | Automated deployment script |
| `server/` | Backend Express.js API |
| `server/lib/` | Backend utilities (DB, email, auth, queue) |

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Port 80 already in use | Stop other containers or use different port |
| Database connection refused | Verify homelab_postgres container is running |
| CORS errors | Check Traefik configuration and labels |
| Emails not delivering | Verify RESEND_API_KEY and check Resend dashboard |

### Security Notes

- ⚠️ Change default JWT_SECRET before production
- ⚠️ Use strong passwords for admin account
- ⚠️ Keep API keys secret (don't commit to git)
- ⚠️ Monitor Resend email delivery rates (3000/month free tier)
- ⚠️ Regularly check for failed items in queue

---

Last Updated: 2026-03-12
Deployment: Production Environment
