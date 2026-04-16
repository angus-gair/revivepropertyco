<!-- generated-by: gsd-doc-writer -->
# Development Guide

This guide covers the development workflow, build commands, code style, and contribution process for the Revive Property Co. application.

## Local Setup

To set up the project for local development:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd revivepropertyco
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.production.example .env
   ```
   Edit `.env` with your local development values (see CONFIGURATION.md for required variables).

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The dev server runs on port 3000 and is accessible on all interfaces (0.0.0.0).

For first-time setup, see GETTING-STARTED.md for prerequisites and initial configuration.

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server on port 3000 (hot reload enabled) |
| `npm run build` | Build production bundle using Vite (outputs to `dist/`) |
| `npm run preview` | Preview production build locally (serves dist/ on port 4173) |
| `npm start` | Run production Express server (serves dist/ on port 8080) |
| `npm run migrate` | Run all pending database migrations |
| `npm run migrate:up` | Run next pending migration |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate:status` | Show migration status |

### Build Artifacts

The production build process creates a multi-stage Docker output:
- **Builder stage**: Vite compiles React/TypeScript code to static assets in `dist/`
- **Production stage**: Nginx Alpine serves static files with SPA routing support

Build output naming pattern:
- JavaScript chunks: `assets/[name]-[hash].js`
- Asset files: `assets/[name]-[hash].[ext]`

## Code Style

This project uses the following tooling for code quality:

### TypeScript
- **Configuration**: `tsconfig.json`
- **Target**: ES2022 with bundler module resolution
- **Path aliases**: `@/*` maps to project root (`./`)
- **Strict mode**: Enabled with isolated modules

### Vite Build Tool
- **Configuration**: `vite.config.ts`
- **Plugin**: `@vitejs/plugin-react` for React JSX transformation
- **Dev server**: Host binding to 0.0.0.0 for Docker compatibility
- **Port**: 3000 (development)

### Styling
- **Framework**: Tailwind CSS v4
- **Build**: PostCSS with `@tailwindcss/postcss` plugin
- **Config**: `tailwind.config.js` and `postcss.config.js`
- **Entry point**: `index.css` with `@import "tailwindcss";`

**Note**: This project does not currently have ESLint, Prettier, or Biome configured. Code formatting is at developer discretion but should follow existing patterns in the codebase.

## Branch Conventions

Git branch naming follows feature-based conventions:

- **Main branch**: `main` (production-ready code)
- **Feature branches**: `feature/<description>` (e.g., `feature/booking-redesign-v2`)
- **No convention documented**: Fix, hotfix, or release branch patterns are not currently standardized

Create feature branches from `main` and merge back via pull request.

## Pull Request Process

This project does not have a documented PR template or contribution checklist. When submitting pull requests:

1. **Branch from main**: Ensure your feature branch is based on the latest `main` branch
2. **Test locally**: Run `npm run build` and verify no build errors
3. **Test functionality**: Manually test affected features (see TESTING_GUIDE.md for test procedures)
4. **Describe changes**: Include a clear PR title and description of what changes were made and why
5. **Review feedback**: Address review comments before requesting merge approval

**Note**: No automated CI/CD pipeline is currently configured. Tests and builds must be verified locally before pushing.

## Development Workflow

### Typical Feature Development

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and test locally
   ```bash
   npm run dev  # Start dev server
   # Make changes, browser will auto-reload
   ```

3. Build and verify production output
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

4. Commit and push changes
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/your-feature-name
   ```

5. Create pull request on GitHub

### Working with Services

The project includes several backend services:
- **Express server** (`server.js`) - Production static file server
- **Database migrations** (`server/migrations/`) - PostgreSQL schema changes
- **Hipages scraper** (`services/hipages-scraper/`) - External lead data import

When modifying these services, restart the dev server or rebuild Docker containers as appropriate.

## Next Steps

- See **GETTING-STARTED.md** for first-time setup instructions
- See **TESTING_GUIDE.md** for testing procedures and validation steps
- See **CONFIGURATION.md** for environment variable reference
- See **ARCHITECTURE.md** for system design and component overview
