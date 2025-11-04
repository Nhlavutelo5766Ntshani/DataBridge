# DataBridge Setup Guide

Complete setup instructions for the DataBridge data migration platform.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v21 or higher - [Download](https://nodejs.org/)
- **Yarn** 4.9.1 or higher
- **PostgreSQL** 14 or higher
- **Git** - [Download](https://git-scm.com/)

### Enable Corepack (for Yarn 4)

```bash
corepack enable
node --version  # Should show v21.x.x or higher
```

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd DataBridge

# 2. Install dependencies
yarn

# 3. Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your database credentials

# 4. Start PostgreSQL database
# Make sure PostgreSQL is running on localhost:5432

# 5. Generate and run migrations
yarn db:generate
yarn db:deploy

# 6. Seed the database (optional)
yarn db:seed

# 7. Start development server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🗄️ Database Setup

### Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)
2. **Create database:**

```sql
CREATE DATABASE databridge;
```

3. **Set DATABASE_URL** in `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/databridge"
```

### Using Docker (Alternative)

```bash
docker run --name databridge-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=databridge \
  -p 5432:5432 \
  -d postgres:14
```

## 📦 Project Structure

```
DataBridge/
├── apps/
│   ├── web/                    # Next.js Web Application
│   └── migration-worker/       # Background Worker (future)
├── packages/
│   └── schema/                 # Shared Database Schema (READ-ONLY)
├── docs/                       # Documentation
└── scripts/                    # Utility Scripts
```

## 🛠️ Development Commands

### Application

```bash
yarn dev                    # Start web app (localhost:3000)
yarn build                 # Build for production
yarn start                 # Start production server
yarn lint                  # Lint all code
yarn lint:fix:all         # Fix linting issues
yarn typecheck            # TypeScript type checking
```

### Database

```bash
yarn db:generate          # Generate Drizzle migrations
yarn db:deploy            # Deploy migrations to database
yarn db:studio            # Open Drizzle Studio (database GUI)
yarn db:seed              # Seed database with sample data
yarn db:reset-seed        # Reset and reseed database
```

### Testing

```bash
yarn test                 # Run all tests
yarn test:unit           # Run unit tests
yarn test:integration    # Run integration tests
yarn test:e2e            # Run E2E tests
```

## 🔧 Configuration

### Environment Variables

Create `apps/web/.env.local` with:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/databridge"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Schema

⚠️ **IMPORTANT**: Schema files in `packages/schema/` are READ-ONLY.

To modify the database schema:

1. Edit `packages/schema/src/schema.ts`
2. Generate migration: `yarn db:generate`
3. Review migration files in `packages/schema/migrations/`
4. Deploy migration: `yarn db:deploy`

## 🏗️ Architecture

DataBridge follows a three-layer database architecture:

### 1. Schema Layer (READ-ONLY)

**Location**: `packages/schema/src/schema.ts`

- Drizzle ORM schema definitions
- Shared across all applications
- Only modify when making intentional schema changes

### 2. Query Layer

**Location**: `apps/web/src/db/queries/*.ts`

- Pure database operations
- No error handling (errors bubble up)
- Returns direct database types
- Exports Zod schemas

### 3. Actions Layer

**Location**: `apps/web/src/lib/actions/*.ts`

- Server actions with 'use server' directive
- Comprehensive error handling
- Zod validation
- Returns `QueryResponse<T>` type

## 🎨 Styling

DataBridge uses **Integrove brand colors**:

- **Primary (Cyan)**: #06B6D4
- **Secondary (Teal)**: #32DBBC

Tailwind CSS is configured with these colors. No purple gradients or typical AI design patterns are used.

## 🧪 Testing Strategy

### Unit Tests

- Test all utility functions
- Located in `__tests__/unit/`

### Integration Tests

- Test database operations
- Test API endpoints
- Located in `__tests__/integration/`

### E2E Tests

- Test complete user workflows
- Use Playwright
- Located in `__tests__/e2e/`

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000
```

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env.local`
3. Test connection:

```bash
psql $DATABASE_URL -c "SELECT current_database();"
```

### Yarn Issues

```bash
# Clear cache and reinstall
yarn cache clean
rm -rf node_modules
yarn install
```

### Migration Issues

```bash
# Reset migrations (WARNING: Deletes all data)
yarn db:reset-seed
```

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Git Workflow](./GIT_WORKFLOW.md)

## 🆘 Getting Help

For issues or questions:

1. Check the troubleshooting section above
2. Review the documentation in `docs/`
3. Contact the development team

---

**Internal Use Only - Integrove**

