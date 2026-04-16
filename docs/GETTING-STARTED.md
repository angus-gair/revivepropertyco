<!-- generated-by: gsd-doc-writer -->
# Getting Started

## Prerequisites

Before running the Revive Property Co. application, ensure you have the following installed:

- **Node.js**: >= 20.0.0 (required for Vite 8 and React 19)
- **npm**: >= 9.0.0 (comes with Node.js)
- **PostgreSQL**: >= 14.0 (for database and migrations)
- **Git**: For cloning the repository

### Development Tools (Optional but Recommended)

- **Docker**: >= 20.10 (for containerized deployment)
- **Docker Compose**: >= 2.0 (for multi-container setup)

## Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/revive-property-co.git
   cd revive-property-co
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
   > **Note**: The `--legacy-peer-deps` flag is required due to dependency resolution in this project.

3. **Set up environment variables:**
   ```bash
   cp .env.production.example .env
   ```
   Edit the `.env` file with your configuration values (see [Configuration](CONFIGURATION.md) for details).

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

## First Run

Once installation is complete, start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Expected output:**
- Vite dev server running on port 3000
- Hot module replacement enabled
- Access to public pages, admin dashboard, and AI chat concierge

### Verify Installation

1. **Check the homepage**: Open `http://localhost:3000` in your browser
2. **Test the AI chat**: Click the chat widget in the bottom-right corner to interact with "Riv"
3. **Access admin portal**: Navigate to `http://localhost:3000/#/login` (requires admin credentials)

## Common Setup Issues

### Issue: Port 3000 Already in Use
**Solution**: The development server defaults to port 3000. If this port is occupied:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3001
```

### Issue: Missing Environment Variables
**Solution**: Ensure you've copied `.env.production.example` to `.env` and filled in all required values:
- Database connection strings (PostgreSQL)
- JWT secret for admin authentication
- Supabase credentials for customer portal
- Z.AI API key for the chat concierge

### Issue: Database Migration Failures
**Solution**: Verify your PostgreSQL database is running and credentials are correct:
```bash
# Check migration status
npm run migrate:status

# Run migrations with verbose output
npm run migrate
```

### Issue: Peer Dependency Conflicts
**Solution**: Always use `--legacy-peer-deps` when installing:
```bash
npm install --legacy-peer-deps
```

### Issue: Build Errors with React 19
**Solution**: Ensure you're using Node.js >= 20.0.0:
```bash
node --version  # Should be v20.0.0 or higher
```

## Next Steps

After successfully running the application:

- **Development**: See [DEVELOPMENT.md](DEVELOPMENT.md) for local development setup, build commands, and code style guidelines
- **Testing**: See [TESTING.md](TESTING.md) for running tests with Playwright and coverage requirements
- **Configuration**: See [CONFIGURATION.md](CONFIGURATION.md) for full environment variable reference and per-environment setup
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker deployment and production environment setup

## Production Quick Start

To run the production build locally:

```bash
# Build the application
npm run build

# Start the production Express server (serves from dist/ on port 8080)
npm start
```

For containerized deployment:
```bash
docker-compose up -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full production deployment instructions.
