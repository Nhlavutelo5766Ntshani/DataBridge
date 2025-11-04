# DataBridge - Quick Start Guide

This guide will help you get DataBridge up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- Yarn package manager
- PostgreSQL database (local or remote)

## Installation Steps

### 1. Install Dependencies

```bash
# From the project root
yarn install
```

This will install all dependencies for the monorepo (root, web app, schema package).

### 2. Set Up Environment Variables

Create a `.env` file in the `apps/web` directory:

```bash
cd apps/web
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/databridge"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 3. Set Up the Database

```bash
# Generate migration files (if schema changed)
yarn db:generate

# Run migrations
yarn db:deploy

# (Optional) Seed initial data
yarn db:seed
```

### 4. Start the Development Server

```bash
# Start the web application
yarn dev

# Or start all services (web + worker)
yarn dev:all
```

The application will be available at `http://localhost:3000`

## Default Routes

- **Homepage**: `http://localhost:3000`
- **Login**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Connections**: `http://localhost:3000/dashboard/connections`
- **Projects**: `http://localhost:3000/dashboard/projects`
- **Migrations**: `http://localhost:3000/dashboard/migrations`
- **Reports**: `http://localhost:3000/dashboard/reports`
- **Settings**: `http://localhost:3000/dashboard/settings`

## Development Commands

```bash
# Development
yarn dev                 # Start web app only
yarn dev:worker         # Start migration worker
yarn dev:all            # Start both web and worker

# Build
yarn build              # Build all packages
yarn build:web          # Build web app only

# Database
yarn db:generate        # Generate new migrations
yarn db:deploy          # Apply migrations
yarn db:studio          # Open Drizzle Studio (database GUI)
yarn db:seed            # Seed database with initial data

# Code Quality
yarn lint               # Lint all packages
yarn lint:fix:all       # Fix linting issues
yarn typecheck          # Run TypeScript type checking

# Testing
yarn test               # Run all tests
yarn test:unit          # Run unit tests
yarn test:e2e           # Run end-to-end tests
```

## Project Structure

```
DataBridge/
├── apps/
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/           # Next.js App Router pages
│       │   │   ├── (auth)/    # Authentication pages
│       │   │   ├── (dashboard)/ # Dashboard pages
│       │   │   └── api/       # API routes
│       │   ├── components/    # React components
│       │   │   ├── ui/        # UI components (ShadCN)
│       │   │   └── layout/    # Layout components
│       │   ├── db/            # Database layer
│       │   │   ├── queries/   # Database queries
│       │   │   └── types/     # Query types
│       │   └── lib/           # Utilities and helpers
│       │       ├── actions/   # Server actions
│       │       ├── constants/ # Constants
│       │       └── utils/     # Utility functions
│       └── public/            # Static assets
│
├── packages/
│   └── schema/                # Shared database schema
│       ├── src/
│       │   ├── schema.ts      # Drizzle schema definitions
│       │   ├── relations.ts   # Table relations
│       │   ├── constants.ts   # Schema constants
│       │   └── migrate.ts     # Migration script
│       └── migrations/        # SQL migration files
│
├── docs/                      # Documentation
├── .cursorrules              # Cursor AI rules
├── package.json              # Root package.json
└── tsconfig.json             # Root TypeScript config
```

## Key Features Implemented

### ✅ Completed

- Monorepo structure with Yarn workspaces
- Next.js 15 with App Router
- Tailwind CSS with Integrove theme (cyan/teal)
- ShadCN UI component library
- Authentication pages (login/signup)
- Dashboard with navigation
- Connections management UI
- Projects management UI
- Migrations monitoring UI
- Reports management UI
- Settings page
- Database schema with Drizzle ORM

### 🚧 In Progress

- Visual mapping canvas with React Flow
- Transformation library
- Migration execution engine
- Validation and reporting features
- Backend integration (queries & actions)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it:

```bash
PORT=3001 yarn dev
```

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check your `DATABASE_URL` in `.env`
3. Verify database credentials
4. Try connecting with `psql` or a database client

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules
rm yarn.lock
yarn install
```

### Build Errors

```bash
# Clean build
yarn clean  # If clean script exists
yarn build
```

## Next Steps

1. **Set Up Authentication**

   - Configure NextAuth.js
   - Add authentication providers
   - Implement protected routes

2. **Connect Database**

   - Implement query layer
   - Add server actions
   - Test CRUD operations

3. **Build Visual Mapping**

   - Integrate React Flow
   - Create mapping interface
   - Add transformation selection

4. **Develop Migration Engine**
   - Set up background worker
   - Implement job queue
   - Add progress tracking

## Getting Help

- Check the [SETUP.md](./docs/SETUP.md) for detailed setup instructions
- Review [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflows
- See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current status
- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for feature details

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

Follow the guidelines in [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

---

**Need Help?** Contact the Integrove development team.
