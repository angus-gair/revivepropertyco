<!-- generated-by: gsd-doc-writer -->
# Deployment

## Deployment Targets

Revive Property Co. uses container-based deployment with Docker Compose and Traefik for reverse proxy routing.

- **Docker Compose** (Primary) - Multi-container deployment defined in `docker-compose.yml`
  - Frontend: Nginx Alpine serving static React build
  - Backend: Node.js Express API server
  - Hipages Scraper: Scheduled lead extraction service
- **Traefik** - Reverse proxy with automatic HTTPS via Cloudflare certificate resolver
  - Domain: `revivepropertyco.au`
  - WWW redirects to apex domain
  - WebSocket support for Socket.IO

## Build Pipeline

The application uses a multi-stage Docker build process:

### Stage 1: Builder (Frontend)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
```

### Stage 2: Production (Frontend)
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Backend Build
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN mkdir -p uploads/customers
```

### Build Commands
```bash
# Build and start all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build app
docker-compose up -d --build backend

# View logs
docker-compose logs -f app
docker-compose logs -f backend
```

## Environment Setup

### Required Environment Variables

#### Frontend (app service)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | Yes | - | Z.AI API endpoint for AI chat service |
| `API_KEY` | Yes | - | Z.AI API key for chat completions |
| `VITE_ADMIN_USERNAME` | Yes | admin | Admin dashboard username |
| `VITE_ADMIN_PASSWORD` | Yes | - | Admin dashboard password |

#### Backend (backend service)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | production | Node environment |
| `PORT` | Yes | 8080 | Backend server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret for authentication |
| `RESEND_API_KEY` | Yes | - | Resend API key for email service |
| `RESEND_FROM` | Yes | - | From email address |

#### Hipages Scraper (hipages-scraper service)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | production | Node environment |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `HIPAGES_USERNAME` | Yes | - | Hipages login username |
| `HIPAGES_PASSWORD` | Yes | - | Hipages login password |
| `HIPAGES_HEADLESS` | No | true | Run browser in headless mode |
| `CRON_SCHEDULE` | No | 0 */6 * * * | Cron schedule for scraping |

### Configuration Notes
- Database URL format: `postgresql://user:password@host:port/database`
- <!-- VERIFY: Production DATABASE_URL should be set in docker-compose.yml or external secrets manager -->
- <!-- VERIFY: Production JWT_SECRET should be a strong random string, not the default value -->
- <!-- VERIFY: Production RESEND_API_KEY must be obtained from Resend dashboard -->

## Per-Environment Overrides

### Development
```bash
# Run development server locally
npm run dev

# Backend with hot reload
npm run start
```

### Production
```bash
# Deploy via Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=2
```

### Environment-Specific Files
- `.env` - Local development (not committed)
- `.env.production` - Production environment variables
- `.env.production.example` - Template for production setup

## Rollback Procedure

### Docker Compose Rollback
```bash
# Stop current services
docker-compose down

# Rebuild and start previous version
git checkout <previous-commit-tag>
docker-compose up -d --build

# Verify health
docker-compose ps
curl http://localhost:8080/health
```

### Database Rollback
```bash
# Run database migrations down
npm run migrate:down

# Or run specific migration
node server/migrations/run-migration.cjs down <migration-file>
```

### Image Tag Rollback
```bash
# List available images
docker images | grep revivepropertyco

# Run specific image
docker-compose up -d --image <image-id>
```

## Monitoring

### Health Checks

#### Frontend Health Check
- **Endpoint**: `http://127.0.0.1:80/`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

#### Backend Health Check
- **Endpoint**: `http://127.0.0.1:8080/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

#### Hipages Scraper Health Check
- **Test**: Database connection check
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Monitoring Tools

#### Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f hipages-scraper

# Last 100 lines
docker-compose logs --tail=100 backend
```

#### Service Status
```bash
# Check all services
docker-compose ps

# Check container health
docker inspect --format='{{.State.Health.Status}}' revivepropertyco
docker inspect --format='{{.State.Health.Status}}' revivepropertyco-backend
```

#### Resource Usage
```bash
# Container stats
docker stats revivepropertyco revivepropertyco-backend revive-hipages-scraper

# Disk usage
docker system df
```

### Error Tracking
<!-- VERIFY: Monitoring dashboard URLs (Sentry, Datadog, etc.) should be documented here if implemented -->

### Alerting
<!-- VERIFY: Alert webhook endpoints or notification channels should be documented here if implemented -->

## Network Configuration

### Traefik Routes

#### Frontend (app service)
- **HTTP to HTTPS redirect**: `revivepropertyco-http`, `revivepropertyco-www-http`
- **WWW to apex redirect**: `revivepropertyco-www`
- **HTTPS router**: `revivepropertyco` (priority 50)
- **Port**: 80

#### Backend API (backend service)
- **HTTPS router**: `revivepropertyco-api` (priority 100)
- **Path prefix**: `/api`
- **Port**: 8080

#### Socket.IO WebSocket (backend service)
- **HTTPS router**: `revivepropertyco-socketio` (priority 100)
- **Path prefix**: `/socket.io`
- **WebSocket headers**: Upgrade, Connection
- **Port**: 8080

### External Networks
- `homelab_web` - Internal web services
- `traefik-public` - Traefik reverse proxy network
- `homelab_internal` - Internal service communication

## Volumes

### Persistent Data
- `customer-uploads` - Customer file uploads (backend service)
- `hipages-output` - Hipages scraper output files

## Security Considerations

### Secrets Management
- Never commit `.env` files to version control
- Use strong, unique `JWT_SECRET` for production
- Rotate API keys regularly
- <!-- VERIFY: Use external secrets manager (Vault, AWS Secrets Manager, etc.) for production deployments -->

### TLS/SSL
- Certificates managed by Traefik with Cloudflare resolver
- Automatic HTTP to HTTPS redirects
- All services communicate over HTTPS in production

### Container Security
- Run as non-root user where possible
- Use minimal base images (Alpine)
- Regular security updates via `docker-compose pull`
