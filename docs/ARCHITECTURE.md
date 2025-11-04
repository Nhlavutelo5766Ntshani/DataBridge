# DataBridge Architecture

## Overview

DataBridge is a production-ready data migration platform built for Integrove's internal use. It enables visual database mapping, data transformation, and automated ETL pipeline execution with Apache Airflow orchestration.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Web Application                 │
│                   (User Interface + API Routes)              │
└───────────────┬──────────────────────────┬──────────────────┘
                │                           │
                ▼                           ▼
┌───────────────────────┐      ┌──────────────────────────────┐
│   PostgreSQL Database │      │     Apache Airflow           │
│   (Drizzle ORM)       │      │   (Pipeline Orchestration)   │
└───────────────────────┘      └──────────────┬───────────────┘
                                               │
                                               ▼
                               ┌──────────────────────────────┐
                               │    GitHub Actions CI/CD       │
                               │   (DAG Deployment)            │
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
- **Next.js API Routes** - RESTful endpoints for Airflow integration
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **Iron Session** - Session management
- **bcryptjs** - Password hashing

### Infrastructure
- **Apache Airflow** - Workflow orchestration
- **GitHub Actions** - CI/CD pipeline
- **Vercel** - Application deployment (optional)
- **Docker** - Airflow containerization

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
- `airflow_dag_runs` - Airflow DAG execution tracking

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

### Step 4: Execution
- Triggers migration job
- Real-time progress tracking
- Error logging and retry capabilities

## Airflow Integration

### DAG Generation
- **Automatic DAG creation** from project configuration
- **Jinja2 templates** for flexible DAG structure
- **Task dependencies** based on pipeline order
- **Retry logic** and error handling
- **SLA monitoring**

### Deployment Flow
1. User clicks "Generate & Deploy DAG" in UI
2. System generates Python DAG file from template
3. Commits DAG to GitHub via GitHub API
4. GitHub Actions workflow triggers:
   - Validates DAG syntax
   - Runs quality checks
   - Deploys to Airflow (Git-based pull)
5. Airflow refreshes DAGs automatically
6. User can trigger DAG from UI or Airflow

### Git-Based Deployment
- **Development**: Airflow pulls from `dev` branch
- **Production**: Airflow pulls from `main` branch
- **No AWS/S3 required** - simple Git sync
- **Version controlled** - full DAG history in Git

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

### Pipeline Execution
- `POST /api/pipelines/[id]/execute` - Execute a single pipeline
- `GET /api/pipelines/[id]/execute` - Get pipeline execution status
- `POST /api/projects/[id]/execute` - Execute all pipelines in a project

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
│       │   │   │   ├── airflow-dag-generator.ts
│       │   │   │   ├── github-integration.ts
│       │   │   │   ├── pipeline-executor.ts
│       │   │   │   └── schema-discovery.ts
│       │   │   ├── auth/                # Session management
│       │   │   ├── constants/
│       │   │   └── utils/
│       │   └── middleware.ts            # Route protection
│       └── public/
├── packages/
│   └── schema/                          # Layer 1: Schema (READ-ONLY)
│       ├── src/
│       │   ├── schema.ts
│       │   ├── relations.ts
│       │   └── constants.ts
│       └── migrations/
├── airflow/                             # Airflow configuration
│   ├── dags/                            # Generated DAG files
│   ├── docker-compose.yml
│   └── README.md
├── .github/
│   └── workflows/
│       ├── airflow-dag-ci.yml          # DAG deployment
│       └── app-ci-cd.yml               # App deployment
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
- API keys for Airflow integration
- GitHub API token for automated commits
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
- Background job processing (Airflow)
- Asynchronous ETL execution

## Monitoring & Logging

### Application Logging
- `logger` utility for structured logging
- Log levels: info, warn, error
- Metadata support for context

### Migration Monitoring
- Real-time progress tracking in UI
- Pipeline execution status
- Error tracking and warnings
- Airflow DAG run history

### Airflow Monitoring
- Airflow UI for DAG execution
- Task-level logs and metrics
- SLA monitoring
- Retry and failure tracking

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
3. Environment variables in Vercel dashboard
4. Preview deployments for PRs

### Airflow (Self-Hosted)
1. Docker Compose setup
2. Git-based DAG sync
3. Automated via GitHub Actions
4. Health checks and monitoring

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

