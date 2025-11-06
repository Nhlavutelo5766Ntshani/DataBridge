# DataBridge ETL Pipeline

## Overview

DataBridge implements a production-ready, 6-stage ETL pipeline using Node.js, BullMQ job queue, and Redis for orchestration. This document details the architecture, implementation, and usage of the ETL system.

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Web Application                      │
│                  (UI + API Routes + Worker)                      │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                 │
             ▼                                 ▼
┌────────────────────────┐      ┌─────────────────────────────────┐
│   PostgreSQL Database   │      │       Redis + BullMQ            │
│   - Project config      │      │   - Job Queue                   │
│   - Execution history   │      │   - Progress tracking           │
│   - Stage results       │      │   - Retry management            │
└────────────────────────┘      └──────────────┬──────────────────┘
                                                │
                                                ▼
                                ┌──────────────────────────────────┐
                                │       ETL Worker Process          │
                                │   (6-Stage Pipeline Executor)     │
                                └──────────────────────────────────┘
                                                │
                                                ▼
                                ┌──────────────────────────────────┐
                                │        Vercel Cron Jobs           │
                                │    (Scheduled Migrations)         │
                                └──────────────────────────────────┘
```

---

## 🔄 6-Stage ETL Pipeline

### Stage 1: Extract (`stage1-extract.ts`)

**Purpose**: Extract data from source database and load into staging tables.

**Process**:
1. Connect to source database (SQL Server, MySQL, PostgreSQL, MongoDB)
2. Create staging tables in PostgreSQL (with `stg_` prefix)
3. Extract data in configurable batches
4. Bulk insert using optimized methods

**Key Features**:
- Connection pooling for performance
- Configurable batch size (100-10,000 rows)
- Dynamic table creation based on source schema
- Progress tracking per table
- Error handling with detailed logs

**Configuration**:
```typescript
{
  staging: {
    tablePrefix: "stg_",
    schemaName: "staging"
  },
  batchSize: 5000,
  parallelism: 4
}
```

---

### Stage 2: Transform & Cleanse (`stage2-transform.ts`)

**Purpose**: Apply transformations and data cleansing rules.

**Transformations Supported**:
- **Type Conversion**: Cast between data types
- **Custom SQL**: Execute custom expressions with `{column}` placeholders
- **Default Values**: Set fallback values for NULL/empty data
- **String Operations**: UPPER, LOWER, TRIM
- **Date Formatting**: Standardize date formats
- **Column Exclusion**: Skip specific columns

**Process**:
1. Read column mappings from database
2. Apply transformations to staging data
3. Update staging tables with transformed values
4. Log transformation errors

**Example Transformations**:
```sql
-- Email cleanup
LOWER(TRIM({email}))

-- Phone formatting
REGEXP_REPLACE({phone}, '[^0-9]', '', 'g')

-- Full name
CONCAT(TRIM({first_name}), ' ', TRIM({last_name}))

-- Currency rounding
ROUND(CAST({amount} AS NUMERIC), 2)
```

---

### Stage 3: Load Dimensions (`stage3-load-dimensions.ts`)

**Purpose**: Load dimension tables (lookup/reference tables) first.

**Why Dimensions First?**:
- Ensures referential integrity
- Foreign keys resolve correctly
- Enables fact table validation

**Process**:
1. Identify dimension tables (sorted by `mappingOrder`)
2. Connect to target PostgreSQL
3. Bulk insert using `pg-copy-streams`
4. Track progress per table
5. Commit transaction per table

**Performance**:
- Uses COPY protocol for fast bulk inserts
- Connection pooling
- Configurable parallelism

---

### Stage 4: Load Facts & Attachments (`stage4-load-facts.ts`)

**Purpose**: Load fact tables and migrate binary attachments.

**Process**:
1. Load fact tables (transactional data)
2. Validate foreign key constraints
3. Migrate attachments from CouchDB to SAP Object Store
4. Update attachment references in database

**Attachment Migration**:
```typescript
CouchDB → SAP Object Store
- Fetch attachment metadata
- Download binary from CouchDB
- Upload to SAP Object Store
- Update attachment URL in target DB
```

**API Integration**:
- Bearer token authentication
- Additional apiKey header for SAP
- Retry logic for failed uploads
- Progress tracking per attachment

---

### Stage 5: Validate (`stage5-validate.ts`)

**Purpose**: Validate data integrity and quality.

**Validation Types**:

1. **Row Count Reconciliation**
   ```sql
   SELECT COUNT(*) FROM staging.table
   vs
   SELECT COUNT(*) FROM production.table
   ```

2. **NULL Constraint Validation**
   ```sql
   SELECT COUNT(*) 
   FROM target_table 
   WHERE required_column IS NULL
   ```

3. **Foreign Key Integrity**
   - Check for orphaned records
   - Validate all FK relationships

4. **Custom Validation Rules**
   - User-defined SQL validation queries
   - Business logic validation

**Output**:
- Validation report stored in `data_validations` table
- Pass/fail status per validation
- Detailed error messages

---

### Stage 6: Generate Report (`stage6-generate-report.ts`)

**Purpose**: Create comprehensive execution report.

**Report Contents**:
- Execution summary (success/failure)
- Duration and performance metrics
- Records processed per table
- Validation results
- Error logs and warnings
- Attachment migration statistics

**Metrics Tracked**:
```typescript
{
  executionId: string;
  status: "success" | "failed" | "partial";
  duration: number;
  tablesProcessed: number;
  totalRecords: number;
  recordsSuccessful: number;
  recordsFailed: number;
  attachmentsMigrated: number;
  validationsPassed: number;
  validationsFailed: number;
  errors: ErrorLog[];
}
```

---

## 🔧 BullMQ Job Queue

### Queue Configuration

**File**: `apps/web/src/lib/queue/etl-queue.ts`

```typescript
const etlQueue = new Queue<ETLJobData>("etl-jobs", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});
```

### Worker Implementation

**File**: `apps/web/src/lib/queue/etl-worker.ts`

```typescript
const worker = new Worker<ETLJobData>("etl-jobs", async (job) => {
  const { projectId, executionId, config } = job.data;
  
  // Stage 1: Extract
  await job.updateProgress(10);
  const extractResult = await extractData(projectId, executionId, config);
  
  // Stage 2: Transform
  await job.updateProgress(30);
  const transformResult = await transformAndCleanse(projectId, executionId, config);
  
  // ... stages 3-6
  
  return { executionId, status: "completed" };
}, {
  connection: redisConnection,
  concurrency: 2,
});
```

### Job Lifecycle

```
Queued → Active → Processing → Completed/Failed
   ↓        ↓          ↓            ↓
[Redis] [Worker] [Stages 1-6] [Database]
```

---

## 📅 Scheduled Migrations (Vercel Cron)

### Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/run-scheduled-migrations",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Cron Endpoint

**File**: `apps/web/src/app/api/cron/run-scheduled-migrations/route.ts`

**Process**:
1. Verify `CRON_SECRET` for authentication
2. Query `schedules` table for due migrations
3. Check if schedule is active and due
4. Queue ETL job via BullMQ
5. Update `nextRunAt` for schedule
6. Return summary of queued jobs

**Security**:
```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response("Unauthorized", { status: 401 });
}
```

---

## 🚀 API Routes

### Start Execution

**Endpoint**: `POST /api/executions/start`

**Request**:
```json
{
  "projectId": "project-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec-uuid",
    "jobId": "bull-job-id",
    "status": "queued"
  }
}
```

---

### Get Execution Status

**Endpoint**: `GET /api/executions/[id]/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec-uuid",
    "status": "running",
    "progress": 65,
    "currentStage": "stage3-load-dimensions",
    "recordsProcessed": 15000,
    "recordsTotal": 23000,
    "startTime": "2025-11-06T12:00:00Z",
    "estimatedCompletion": "2025-11-06T12:15:00Z"
  }
}
```

---

### Cancel Execution

**Endpoint**: `POST /api/executions/[id]/cancel`

**Response**:
```json
{
  "success": true,
  "message": "Execution cancelled successfully"
}
```

---

### Queue Statistics

**Endpoint**: `GET /api/executions/queue-stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "waiting": 2,
    "active": 1,
    "completed": 45,
    "failed": 3,
    "delayed": 0
  }
}
```

---

## 📊 UI Integration

### Execution Monitor Component

**File**: `apps/web/src/components/mapping/wizard/step6-execution-monitor.tsx`

**Features**:
- Real-time progress tracking
- Stage-by-stage status visualization
- Pause/Resume/Cancel controls
- Error log display
- Performance metrics

**Real-Time Updates**:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/executions/${executionId}/status`);
    const result = await response.json();
    setExecutionStatus(result.data);
  }, 2000);
  
  return () => clearInterval(interval);
}, [executionId]);
```

---

### Queue Monitor Dashboard

**Route**: `/queue-monitor`

**Features**:
- Live queue statistics
- Active jobs list
- Failed jobs with retry option
- Pause/Resume queue controls
- Clear completed jobs

---

## ⚙️ Configuration

### ETL Config Schema

```typescript
type ETLPipelineConfig = {
  staging: {
    tablePrefix: string;
    schemaName: string;
  };
  batchSize: number;
  parallelism: number;
  errorHandling: "failFast" | "continueOnError" | "skipAndLog";
  logLevel: "debug" | "info" | "warning" | "error";
  hooks?: {
    preMigration?: string;
    postMigration?: string;
  };
  validation: {
    enabled: boolean;
    rowCountCheck: boolean;
    nullConstraintCheck: boolean;
    customValidations?: string[];
  };
};
```

### Performance Tuning

**Batch Size**:
- Small datasets (< 100K rows): 1,000 - 5,000
- Medium datasets (100K - 1M rows): 5,000 - 10,000
- Large datasets (> 1M rows): 10,000 - 50,000

**Parallelism**:
- Conservative: 2-4 concurrent operations
- Moderate: 4-8 concurrent operations
- Aggressive: 8-16 concurrent operations

---

## 🔍 Monitoring & Debugging

### Execution Logs

All logs are stored in the `logger` utility:

```typescript
logger.info("[Stage 1] Extracting data", { projectId, table, rows });
logger.error("[Stage 3] Load failed", { error, table });
logger.success("[Stage 6] Migration completed", { duration, records });
```

### Database Tracking

**Tables Used**:
- `etl_executions` - Execution history
- `execution_stages` - Stage-level tracking
- `data_validations` - Validation results

**Query Example**:
```sql
SELECT 
  es.stage_name,
  es.status,
  es.duration,
  es.records_processed,
  es.error_message
FROM execution_stages es
WHERE es.execution_id = 'exec-uuid'
ORDER BY es.sequence_order;
```

---

## 🧪 Testing

### Manual Testing

1. **Create test project** with small dataset
2. **Configure mapping** with simple transformations
3. **Start execution** and monitor progress
4. **Verify results** in target database
5. **Check validation** report

### API Testing

```bash
# Start execution
curl -X POST http://localhost:3000/api/executions/start \
  -H "Content-Type: application/json" \
  -d '{"projectId": "project-uuid"}'

# Check status
curl http://localhost:3000/api/executions/exec-uuid/status

# Cancel execution
curl -X POST http://localhost:3000/api/executions/exec-uuid/cancel
```

---

## 🚨 Error Handling

### Retry Strategy

BullMQ automatically retries failed jobs:

```typescript
{
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000
  }
}
```

**Retry Delays**:
- Attempt 1: 5 seconds
- Attempt 2: 25 seconds
- Attempt 3: 125 seconds

### Error Recovery

1. **Transient Errors** (network, timeout):
   - Automatic retry via BullMQ
   - Exponential backoff

2. **Data Errors** (constraint violation, type mismatch):
   - Log error with context
   - Continue or fail based on `errorHandling` config
   - Store in `execution_stages.error_message`

3. **Critical Errors** (DB connection lost):
   - Fail immediately
   - Rollback if in transaction
   - Notify via logs

---

## 🔒 Security

### Authentication

- **Cron endpoint**: Protected by `CRON_SECRET`
- **API routes**: Session-based authentication
- **SAP Object Store**: Bearer token + apiKey header

### Data Protection

- Connection credentials encrypted in database
- No credentials in logs
- Secure Redis connection (TLS in production)

---

## 📚 Related Documentation

- [Architecture](./ARCHITECTURE.md) - System architecture overview
- [Setup Guide](./SETUP.md) - Installation and configuration
- [Development Guide](./DEVELOPMENT.md) - Development workflows
- [Error Handling](./ERROR_HANDLING.md) - Error patterns and responses

---

## 🎯 Best Practices

1. **Start Small**: Test with subset of data first
2. **Monitor Closely**: Watch stage execution in real-time
3. **Validate Always**: Enable all validation checks
4. **Batch Appropriately**: Tune batch size for your data volume
5. **Use Staging**: Always use staging → production workflow
6. **Schedule Wisely**: Avoid peak hours for large migrations
7. **Backup First**: Take database backup before production migration

---

**Version**: 2.0  
**Last Updated**: November 2025  
**Maintained By**: Integrove Development Team

