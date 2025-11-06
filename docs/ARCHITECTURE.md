# DataBridge Architecture

## Overview

DataBridge is a production-ready data migration platform built for Integrove's internal use. It enables visual database mapping, data transformation, and automated ETL pipeline execution with BullMQ job orchestration and a 6-stage Node.js-based pipeline.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Web Application                 │
│                   (User Interface + API Routes)              │
└───────────────┬──────────────────────────┬──────────────────┘
                │                           │
                ▼                           ▼
┌───────────────────────┐      ┌──────────────────────────────┐
│   PostgreSQL Database │      │     BullMQ + Redis           │
│   (Drizzle ORM)       │      │   (Job Queue Orchestration)  │
└───────────────────────┘      └──────────────┬───────────────┘
                                               │
                                               ▼
                               ┌──────────────────────────────┐
                               │    ETL Worker Process         │
                               │   (6-Stage Pipeline)          │
                               └──────────────────────────────┘
                                               │
                                               ▼
                               ┌──────────────────────────────┐
                               │    Vercel Cron Jobs           │
                               │   (Scheduled Migrations)      │
                               └──────────────────────────────┘
```

## Core Technologies

### Frontend
- **Next.js 15** - App Router with Server Components
- **React 18** - UI framework
- **TypeScript 5.3** - Type safety
- **Tailwind CSS** - Styling (Integrove brand colors)
- **Shadcn UI** - Component library
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - RESTful endpoints for ETL execution control
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **Iron Session** - Session management
- **bcryptjs** - Password hashing
- **BullMQ** - Job queue for background processing
- **Redis** - In-memory data store for BullMQ

### Infrastructure
- **BullMQ Worker** - Background job processing
- **Redis** - Job queue and caching
- **Vercel Cron** - Scheduled task execution
- **Vercel** - Application deployment
- **Docker** - Development environment (optional)

## Database Schema

### Core Tables

#### Authentication
- `users` - User accounts with passwordHash

#### Connection Management
- `connections` - Database connection configurations (PostgreSQL, MySQL, SQL Server, MongoDB, CouchDB)

#### Project Management
- `mapping_projects` - Top-level projects
  - `strategy` field: 'single-pipeline' | 'multi-pipeline'

#### Multi-Pipeline Architecture
- `pipelines` - Individual ETL pipelines within a project
  - Sequential execution order
  - Dependencies between pipelines
- `table_mappings` - Table-level mapping rules (linked to pipelines)
- `column_mappings` - Column-level mapping with transformations

#### Execution Tracking
- `project_executions` - Project-level execution history
- `pipeline_executions` - Pipeline-level execution tracking
- `migration_executions` - Legacy table for backward compatibility

#### Scheduling & Monitoring
- `schedules` - Cron-based project schedules
- `execution_stages` - ETL pipeline stage tracking
- `data_validations` - Data quality validation results

## Three-Layer Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Layer 3: Server Actions (apps/web/src/lib/actions/)     │
│  - Error handling with createErrorResponse                │
│  - Zod validation                                         │
│  - Returns QueryResponse<T>                               │
│  - "use server" directive                                 │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 2: Query Layer (apps/web/src/db/queries/)          │
│  - Pure database operations                               │
│  - No error handling (errors bubble up)                   │
│  - Returns direct database types                          │
│  - Zod schemas for validation                             │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 1: Schema (packages/schema/src/)                   │
│  - READ-ONLY (modify only through migrations)            │
│  - Drizzle ORM schema definitions                         │
│  - Shared across all services                            │
└───────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Layer 1: Schema (READ-ONLY)
- Define database tables using Drizzle ORM
- Define relations between tables
- Export type-safe schema objects
- **Never edit directly** - use `yarn db:generate` and `yarn db:migrate`

#### Layer 2: Query Layer
- **Pure database operations** - no side effects
- **No error handling** - let errors bubble up
- **Return database types** directly
- **Export Zod schemas** for validation
- Example: `getUserByEmail(email: string): Promise<User | null>`

#### Layer 3: Actions Layer
- **Add "use server"** directive (Next.js server actions)
- **Comprehensive error handling** with try/catch
- **Zod validation** of inputs
- **Return `QueryResponse<T>`** type consistently
- **Call query layer** functions
- Example: `fetchUserByEmail(email: string): Promise<QueryResponse<User | null>>`

## Multi-Pipeline Architecture

DataBridge supports complex migrations with multiple sequential pipelines:

### Single Pipeline Project
```
Source DB → Target DB
```

### Multi-Pipeline Project
```
Source DB → Staging DB → Production DB
    ↓           ↓             ↓
Pipeline 1  Pipeline 2   Pipeline 3
```

### Features
- **Sequential Execution** - Pipelines run in order
- **Dependencies** - Pipeline 2 waits for Pipeline 1
- **Granular Monitoring** - Track each pipeline separately
- **Flexible Mapping** - Different transformations per pipeline

## Wizard-Based Mapping UI

The mapping interface uses a 4-step wizard (replaced complex React Flow canvas):

### Step 1: Table Selection
- Select source and target tables
- Support for **one-to-many** mappings (1 source → multiple targets)
- Display schema-qualified names (e.g., `dbo.Users`, `staging.Orders`)

### Step 2: Column Mapping
- **Interactive click-to-map** interface
- Click source column → Click target column → Click "Map"
- Visual highlighting of selected columns
- Transform button for each mapping

### Step 3: Preview
- Shows sample data with transformations applied
- Displays warnings for unmapped columns
- Row count estimates

### Step 4: Schedule & Dependencies
- Configure cron-based schedules
- Set pipeline dependencies
- Define SLA and retry policies
- Advanced execution settings

### Step 5: Preview & Validate
- Review sample data with transformations
- Preview ETL pipeline structure
- Data validation warnings

### Step 6: Execute & Monitor
- Start ETL pipeline execution
- Real-time stage-by-stage tracking
- Progress metrics and error logs
- Pause/Resume/Cancel controls

## ETL Pipeline Architecture

### 6-Stage Pipeline
DataBridge implements a production-ready ETL pipeline with six sequential stages:

1. **Stage 1: Extract** (`stage1-extract.ts`)
   - Connect to source database (SQL Server, MySQL, PostgreSQL, MongoDB)
   - Create staging tables in target PostgreSQL
   - Bulk data extraction with configurable batch sizes
   - Connection pooling for optimal performance

2. **Stage 2: Transform & Cleanse** (`stage2-transform.ts`)
   - Apply column mappings and transformations
   - Data type conversions
   - Custom SQL expressions
   - NULL handling and default values
   - String operations (UPPER, LOWER, TRIM)

3. **Stage 3: Load Dimensions** (`stage3-load-dimensions.ts`)
   - Load dimension tables first (for referential integrity)
   - Bulk insert using pg-copy-streams
   - Transaction management
   - Progress tracking per table

4. **Stage 4: Load Facts & Attachments** (`stage4-load-facts.ts`)
   - Load fact tables
   - Migrate attachments from CouchDB to SAP Object Store
   - Handle binary data and metadata
   - Maintain data integrity

5. **Stage 5: Validate** (`stage5-validate.ts`)
   - Row count reconciliation
   - NULL constraint validation
   - Foreign key integrity checks
   - Custom validation rules
   - Generate validation report

6. **Stage 6: Generate Report** (`stage6-generate-report.ts`)
   - Execution summary
   - Success/failure statistics
   - Performance metrics (throughput, duration)
   - Error logs and warnings
   - Store report in database

### BullMQ Job Queue
- **Job Orchestration**: BullMQ manages ETL job lifecycle
- **Redis Backend**: High-performance job storage and state management
- **Worker Process**: Dedicated worker for job execution (`etl-worker.ts`)
- **Job Retry**: Automatic retry with exponential backoff
- **Progress Tracking**: Real-time progress updates
- **Concurrency Control**: Configurable parallel job execution

### Vercel Cron Scheduling
- **Automated Execution**: Scheduled migrations via Vercel Cron
- **API Route**: `/api/cron/run-scheduled-migrations`
- **Security**: Protected by CRON_SECRET environment variable
- **Flexibility**: Cron expressions for complex schedules
- **Timezone Support**: UTC-based scheduling

## Authentication & Authorization

### Current Implementation
- **Session-based** authentication using Iron Session
- **bcryptjs** password hashing
- **Protected routes** via Next.js middleware
- **No login from top-right** - logout in sidebar only

### Session Management
- Encrypted session cookies
- Server-side session validation
- `getCurrentUser()` utility for auth checks

## Transformation Engine

### Supported Transformations
1. **Type Conversion** - Convert data types across databases
2. **Custom SQL** - Write custom expressions with `{column}` placeholders
3. **Default Values** - Set fallback for NULL/empty values
4. **String Operations** - UPPER, LOWER, TRIM
5. **Date Formatting** - Standardize date/time formats
6. **Column Exclusion** - Skip specific columns

### Type Compatibility Matrix
- Automatic suggestions for compatible types
- Cross-database type mapping (PostgreSQL ↔ SQL Server ↔ MySQL)

## API Routes

### Execution Management
- `POST /api/executions/start` - Start a new migration execution
- `GET /api/executions/[id]/status` - Get real-time execution status
- `POST /api/executions/[id]/cancel` - Cancel a running execution
- `GET /api/executions/history` - Get execution history
- `GET /api/executions/queue-stats` - Get BullMQ queue statistics

### Scheduled Migrations
- `POST /api/cron/run-scheduled-migrations` - Vercel Cron endpoint for scheduled runs

### Health Check
- `GET /api/health` - System health status

## File Structure

```
DataBridge/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/              # Login, Signup
│       │   │   ├── (dashboard)/         # Protected routes
│       │   │   │   ├── connections/
│       │   │   │   ├── projects/
│       │   │   │   │   └── [id]/
│       │   │   │   │       ├── mapping/
│       │   │   │   │       └── pipelines/
│       │   │   │   ├── migrations/
│       │   │   │   ├── reports/
│       │   │   │   └── settings/
│       │   │   └── api/                 # API routes
│       │   ├── components/
│       │   │   ├── ui/                  # Shadcn components
│       │   │   ├── layout/              # Sidebar, Header
│       │   │   ├── mapping/             # Wizard components
│       │   │   └── pipelines/           # Pipeline management
│       │   ├── db/
│       │   │   └── queries/             # Layer 2: Queries
│       │   ├── lib/
│       │   │   ├── actions/             # Layer 3: Server actions
│       │   │   ├── services/            # Business logic
│       │   │   │   ├── etl/             # 6-stage ETL pipeline
│       │   │   │   │   ├── stage1-extract.ts
│       │   │   │   │   ├── stage2-transform.ts
│       │   │   │   │   ├── stage3-load-dimensions.ts
│       │   │   │   │   ├── stage4-load-facts.ts
│       │   │   │   │   ├── stage5-validate.ts
│       │   │   │   │   └── stage6-generate-report.ts
│       │   │   │   └── schema-discovery.ts
│       │   │   ├── queue/               # BullMQ integration
│       │   │   │   ├── etl-queue.ts
│       │   │   │   └── etl-worker.ts
│       │   │   ├── auth/                # Session management
│       │   │   ├── constants/
│       │   │   └── utils/
│       │   └── middleware.ts            # Route protection
│       └── public/
├── packages/
│   └── schema/                          # Layer 1: Schema
│       ├── src/
│       │   ├── schema.ts
│       │   ├── relations.ts
│       │   └── constants.ts
│       └── migrations/
├── vercel.json                          # Vercel Cron configuration
└── docs/
```

## Security

### Authentication
- Passwords hashed with bcryptjs (10 rounds)
- Session cookies encrypted with Iron Session
- Protected API routes with middleware

### Database Security
- Connection credentials encrypted in database
- Environment variables for sensitive data
- No hardcoded secrets in code

### API Security
- CRON_SECRET for scheduled task authentication
- Session-based authentication for API routes
- Rate limiting (future enhancement)

## Performance Considerations

### Database Optimization
- Connection pooling for all database types
- Batch processing (configurable batch size)
- Streaming for large datasets
- Transaction management for data integrity

### Caching
- Server Components cache by default
- Revalidation on data mutations
- Client-side state management minimal

### Scalability
- Horizontal scaling via Vercel
- Database connection pooling
- Background job processing (BullMQ with Redis)
- Asynchronous ETL execution with worker processes

## Monitoring & Logging

### Application Logging
- `logger` utility for structured logging
- Log levels: info, warn, error
- Metadata support for context

### Migration Monitoring
- Real-time progress tracking in UI
- Stage-by-stage execution status
- Error tracking and warnings
- Execution history and metrics
- BullMQ queue monitoring dashboard

### ETL Stage Tracking
- 6-stage pipeline visualization
- Per-stage status (pending, running, completed, failed)
- Duration and performance metrics
- Detailed error logs per stage
- Retry and recovery tracking

## Error Handling

### Error Response Format
```typescript
{
  success: false,
  error: string | string[],
  code: ErrorCode
}
```

### Error Categories
- `DB_ERROR` - Database operation failures
- `VALIDATION_ERROR` - Input validation failures
- `CONNECTION_ERROR` - External connection issues
- `AUTH_ERROR` - Authentication failures
- `NOT_FOUND` - Resource not found
- `SERVER_ERROR` - Internal server errors
- `UNKNOWN` - Uncategorized errors

## Design System

### Integrove Brand Colors
- **Primary (Cyan)**: `#06B6D4` - Source connections, primary actions
- **Secondary (Teal)**: `#32DBBC` - Target connections, secondary actions

### UI Principles
- Clean, professional interface
- No purple gradients or AI design patterns
- Focus on data and functionality
- Responsive design (mobile-friendly)
- Accessibility (ARIA labels, semantic HTML)

## Development Workflow

### Branch Strategy
- `main` - Production
- `dev` - Development
- `feature/*` - Feature branches

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- No `console.log` in production
- No `any` types
- JSDoc for all functions (except React components)

### Testing Strategy (Future)
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows

## Deployment

### Vercel (Web Application)
1. Connect GitHub repository
2. Auto-deploy on push to `main`
3. Environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `CRON_SECRET`
   - `SESSION_SECRET`
   - `SAP_OBJECT_STORE_URL`
   - `SAP_OBJECT_STORE_API_KEY`
4. Preview deployments for PRs
5. Vercel Cron for scheduled migrations

### Redis (Job Queue)
1. Use managed Redis (Upstash, Redis Cloud, etc.)
2. Configure `REDIS_URL` environment variable
3. Ensure network connectivity from Vercel
4. Monitor memory usage and performance

## Future Enhancements

- Role-based access control (RBAC)
- Multi-user collaboration
- Migration templates and presets
- Advanced transformation editor with syntax highlighting
- Data quality rules and validation framework
- Automated rollback capabilities
- Cost estimation before migration
- Integration with Azure DevOps pipelines

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Integrove Development Team

