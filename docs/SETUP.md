# DataBridge Setup Guide

Complete setup instructions for the DataBridge data migration platform.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v21 or higher - [Download](https://nodejs.org/)
- **Yarn** 4.9.1+ (use Corepack)
- **PostgreSQL** 14 or higher
- **Git** - [Download](https://git-scm.com/)

### Enable Corepack (for Yarn 4)

```bash
corepack enable
node --version  # Should show v21.x.x or higher
yarn --version  # Should show 4.9.1 or higher
```

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/integrove/DataBridge.git
cd DataBridge

# 2. Install dependencies
yarn

# 3. Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your database credentials

# 4. Create PostgreSQL database
createdb databridge
# OR use Docker (see below)

# 5. Run migrations
yarn db:deploy

# 6. (Optional) Seed sample data
yarn db:seed

# 7. Start development server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Default Login** (after seeding):
- Email: `admin@integrove.com`
- Password: `password123`

## 🎯 What is DataBridge?

DataBridge is Integrove's internal data migration platform that enables:

- **Visual Mapping**: Wizard-based interface for schema mapping
- **Multi-Pipeline Projects**: Sequential ETL pipelines (Source → Staging → Production)
- **Data Transformations**: Type conversion, custom SQL, data cleansing
- **Airflow Integration**: Automated DAG generation and orchestration
- **Real-time Monitoring**: Track migration progress and errors
- **Support for 5 Databases**: PostgreSQL, MySQL, SQL Server, MongoDB, CouchDB

## 🗄️ Database Setup

### Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)
   - macOS: `brew install postgresql@14`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)
   - Linux: `sudo apt-get install postgresql-14`

2. **Create database:**
   ```bash
   createdb databridge
   ```
   
   OR using SQL:
   ```sql
   CREATE DATABASE databridge;
   ```

3. **Set DATABASE_URL** in `apps/web/.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/databridge"
   ```

### Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name databridge-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=databridge \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps | grep databridge-db

# Stop/Start container
docker stop databridge-db
docker start databridge-db
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

## 🚀 First Steps After Setup

### 1. Log In

Navigate to [http://localhost:3000](http://localhost:3000) and log in with the default credentials (if you ran `yarn db:seed`):

- Email: `admin@integrove.com`
- Password: `password123`

### 2. Create a Database Connection

1. Go to **Connections** → **New Connection**
2. Fill in connection details:
   - Name: e.g., "Source PostgreSQL"
   - Database Type: PostgreSQL, MySQL, SQL Server, MongoDB, or CouchDB
   - Host, Port, Database Name, Username, Password
3. Click **Test Connection** to verify
4. Click **Create Connection**

### 3. Create Your First Project

1. Go to **Projects** → **New Project**
2. Fill in project details:
   - Name: e.g., "Customer Data Migration"
   - Migration Strategy: Single Pipeline or Multi-Pipeline
   - Select Source and Target Connections
3. Click **Create Project**

### 4. Map Tables and Columns

**For Single Pipeline:**
1. Go to your project → **Mapping** tab
2. Follow the 4-step wizard:
   - Step 1: Select source and target tables
   - Step 2: Map columns (click source → click target → click "Map")
   - Step 3: Preview sample data
   - Step 4: Execute migration

**For Multi-Pipeline:**
1. Go to your project → **Pipelines** tab
2. Create multiple pipelines in sequence:
   - Pipeline 1: Source → Staging
   - Pipeline 2: Staging → Production
3. Map each pipeline separately

### 5. Execute and Monitor

- Click **Execute** to start the migration
- Monitor progress in real-time on the Migrations page
- View detailed logs and statistics
- Check for errors and warnings

### 6. (Optional) Set Up Airflow Integration

See [GIT_SETUP.md](./GIT_SETUP.md) for instructions on:
- Setting up GitHub repository
- Configuring GitHub Actions
- Generating and deploying Airflow DAGs
- Scheduling automated migrations

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 yarn dev
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

