# DataBridge

**Visual Data Migration and Mapping Platform for Integrove**

DataBridge is an internal tool designed to simplify SQL Server to PostgreSQL data migrations through an intuitive visual interface, drag-and-drop mapping, and automated validation.

## 🚀 Quick Start

```bash
# Install dependencies
yarn

# Start development server
yarn dev

# Start all services (web + worker)
yarn dev:all
```

## 📋 Prerequisites

- Node.js v21 or higher
- Yarn 4.9.1 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher (for BullMQ job queue)
- Docker (optional, for local PostgreSQL and Redis)

## 🛠️ Development Commands

```bash
# Development
yarn dev                    # Start web app
yarn dev:worker            # Start migration worker
yarn dev:all               # Start both

# Build
yarn build                 # Build all applications
yarn build:web            # Build web app only
yarn build:worker         # Build worker only

# Database
yarn db:generate          # Generate Drizzle migrations
yarn db:deploy            # Deploy migrations
yarn db:studio            # Open Drizzle Studio
yarn db:seed              # Seed database

# Linting & Testing
yarn lint                 # Lint all applications
yarn lint:fix:all        # Fix linting issues
yarn test                 # Run all tests
yarn test:unit           # Run unit tests
yarn test:integration    # Run integration tests
yarn test:e2e            # Run E2E tests
```

## 📁 Project Structure

```
DataBridge/
├── apps/
│   ├── web/                    # Next.js Web Application
│   │   ├── src/app/api/        # API Routes (executions, cron)
│   │   ├── src/lib/services/   # ETL Pipeline Services
│   │   └── src/lib/queue/      # BullMQ Worker & Queue
│   └── migration-worker/       # Background Worker (future separation)
├── packages/
│   └── schema/                 # Shared Database Schema
├── docs/                       # Documentation
└── scripts/                    # Utility Scripts
```

## 🏗️ Architecture

DataBridge follows a three-layer database architecture:

1. **Schema Layer** (`packages/schema/`) - READ-ONLY Drizzle schema definitions
2. **Query Layer** (`apps/web/src/db/queries/`) - Pure database operations
3. **Actions Layer** (`apps/web/src/lib/actions/`) - Server actions with error handling

## 📚 Documentation

- [Quick Start Guide](./docs/QUICK_START.md) - Get up and running in minutes
- [Getting Started](./docs/GETTING_STARTED.md) - Comprehensive onboarding guide
- [Setup Guide](./docs/SETUP.md) - Detailed setup instructions
- [Development Guide](./docs/DEVELOPMENT.md) - Development workflows and best practices
- [Project Status](./docs/PROJECT_STATUS.md) - Current status and roadmap
- [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) - Complete feature list

## 🎨 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Database**: PostgreSQL, Drizzle ORM
- **Validation**: Zod
- **State Management**: React Query, Zustand
- **Visualization**: React Flow
- **Job Queue**: BullMQ with Redis
- **ETL Pipeline**: Node.js-based 6-stage pipeline
- **Scheduling**: Vercel Cron for automated migrations
- **Testing**: Vitest, Playwright

## 🔒 Security

- All database credentials are encrypted
- Row-level security policies enforced
- Input sanitization and XSS prevention
- Rate limiting on API endpoints
- Authentication via middleware

## 📄 License

Internal use only - Integrove

## 👥 Team

Developed by the Integrove development team.
