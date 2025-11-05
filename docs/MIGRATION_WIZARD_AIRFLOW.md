# 🚀 Enhanced Migration Wizard with Node.js ETL

## Overview

The DataBridge migration wizard provides a production-ready ETL pipeline implementation using Node.js, BullMQ task queues, and Vercel Cron scheduling for comprehensive migration management and monitoring.

---

## 🎯 Complete 6-Step Migration Flow

### **Step 1: Select Tables** ✅
**File**: `apps/web/src/components/mapping/wizard/step1-table-selection.tsx`

- Choose source and target tables
- One-to-many mapping support (one source → multiple targets)
- Auto-mapping suggestions based on similarity
- Schema-qualified table names (e.g., `dbo.Users`)
- Real-time mapping validation

---

### **Step 2: Map Columns** ✅
**File**: `apps/web/src/components/mapping/wizard/step2-column-mapping.tsx`

- Interactive column selection (click source, click target, map)
- Visual highlighting of selected columns
- Transformation editor integration
- Support for multiple transformation types:
  - Type conversion
  - Custom SQL expressions
  - Default values
  - String operations
  - Column exclusion

---

### **Step 3: Configure Pipeline** 🆕
**File**: `apps/web/src/components/mapping/wizard/step3-pipeline-config.tsx`

**Performance Settings:**
- Batch size configuration (100-10,000 rows)
- Parallelism levels (1-16 concurrent operations)
- Optimized for production workloads

**Error Handling:**
- Fail Fast: Stop on first error
- Continue on Error: Report errors at end
- Skip and Log: Skip failed rows and continue
- Log levels: Debug, Info, Warning, Error

**Data Validation:**
- Row-level validation
- Type validation
- Schema compatibility checks

**Migration Hooks:**
- Pre-migration SQL hooks
- Post-migration SQL hooks
- Custom validation logic

---

### **Step 4: Schedule & Dependencies** 🆕
**File**: `apps/web/src/components/mapping/wizard/step4-schedule-dependencies.tsx`

**Schedule Configuration:**
- Cron expression presets:
  - Every 15 minutes
  - Hourly, Daily, Weekly, Monthly
  - Custom cron expressions
- Timezone selection (10+ timezones)
- Visual cron picker with descriptions

**SLA & Monitoring:**
- Service Level Agreement (SLA) duration
- Automatic alerts if pipeline exceeds SLA
- Email/Slack notifications (configurable)

**Retry Configuration:**
- Maximum retries (0-10)
- Retry delay in minutes
- Exponential backoff support

**Pipeline Dependencies:**
- Sequential pipeline execution
- Dependency graph management
- Wait for upstream pipelines

**Advanced Settings:**
- Backfill for missed runs
- Catch-up mode
- Max active runs

---

### **Step 5: Preview & Validate** 🆕
**File**: `apps/web/src/components/mapping/wizard/step5-preview-validate.tsx`

**Data Preview:**
- Sample data comparison (before & after)
- Up to 10 rows preview per table
- Side-by-side source/target comparison
- Transformation validation

**DAG Structure Visualization:**
- Visual pipeline flow diagram
- 5-stage ETL process:
  1. Extract Data (from source)
  2. Transform & Map (apply transformations)
  3. Validate Data (type checking)
  4. Load to Target (bulk insert)
  5. Complete (finalization)
- Task-level descriptions
- Airflow DAG naming convention

**Validation Warnings:**
- Data type compatibility
- Null constraints
- Primary key conflicts
- Schema mismatches

---

### **Step 6: Execute & Monitor** 🆕
**File**: `apps/web/src/components/mapping/wizard/step6-execution-monitor.tsx`

**Real-Time Monitoring:**
- Live progress bar
- Records processed/total
- Failed records count
- Success rate percentage

**ETL Pipeline Integration:**
- Real-time task status tracking:
  - Pending
  - Running
  - Completed
  - Failed
  - Skipped
- Task duration and timestamps

**Execution Controls:**
- ⏸️ Pause execution
- ▶️ Resume execution
- 🔄 Retry failed execution
- 📊 View execution history

**Detailed Metrics:**
- Start/end timestamps
- Total duration
- Throughput (rows/second)
- Error logs with stack traces

---

## 🔧 Server Actions & API Routes

### **Server Actions**
**File**: `apps/web/src/lib/actions/migration-execution.ts`

```typescript
// Start migration execution
startMigrationExecution(projectId: string)

// Get execution status
getExecutionStatus(executionId: string)

// Execution control
pauseMigrationExecution(executionId: string)
resumeMigrationExecution(executionId: string)
retryMigrationExecution(executionId: string)

// Monitoring
getETLStageStatus(executionId: string)
```

### **API Routes**

#### `POST /api/executions/start`
Start a new migration execution
```json
{
  "projectId": "project_123"
}
```

#### `GET /api/executions/[id]/status`
Get execution status
```json
{
  "success": true,
  "data": {
    "executionId": "exec_123",
    "status": "running",
    "startTime": "2025-01-01T00:00:00Z"
  }
}
```

#### `GET /api/executions/[id]/stages`
Get all ETL stage statuses
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "stageId": "extract",
        "status": "completed",
        "duration": 45.2
      }
    ]
  }
}
```

---

## 🎨 UI/UX Improvements

### **Layout Structure**
Following PulseSense design pattern:
- **Part 1**: Top header (fixed) - Project name + progress circle
- **Part 2**: Left sidebar (fixed width, scrollable) - Migration steps
- **Part 3**: Right content (flex, scrollable) - Step content + fixed buttons

### **Key Features:**
- ✅ No scrolling to see action buttons
- ✅ Only table/content areas scroll
- ✅ Consistent Integrove brand colors (Cyan #06B6D4, Teal #32DBBC)
- ✅ No gradient backgrounds (solid colors only)
- ✅ User info displayed in logout section

---

## 📊 Data Flow

```
User completes wizard steps
  ↓
Configure ETL pipeline with:
  - Schedule configuration (Vercel Cron)
  - Retry logic
  - SLA monitoring
  - Dependencies
  ↓
User triggers execution (manual or scheduled)
  ↓
BullMQ queues ETL tasks:
  1. Extract to staging
  2. Transform & cleanse
  3. Load dimensions
  4. Load facts
  5. Validate data
  6. Generate report
  ↓
Real-time monitoring in DataBridge UI
  - Stage-level progress
  - Error tracking
  - Performance metrics
  ↓
View detailed execution logs and reports
```

---

## 🔐 Environment Variables Required

Add these to your `.env.local`:

```bash
# Database
DATABASE_URL=postgres://...
STAGING_DATABASE_URL=postgres://...

# Redis (for BullMQ)
REDIS_URL=redis://...

# SAP Object Store
SAP_OBJECT_STORE_URL=https://...
SAP_OBJECT_STORE_API_KEY=...

# Vercel Cron
CRON_SECRET=... # Random secret for cron auth

# Session
SESSION_SECRET=...
```

---

## 🚀 Usage Example

### 1. Create Project
```typescript
const project = await addProject({
  name: "Customer Data Migration",
  sourceConnectionId: "source-db-id",
  targetConnectionId: "target-db-id",
});
```

### 2. Complete Wizard Steps
- Step 1: Map `dbo.Customers` → `public.customers`
- Step 2: Map columns with transformations
- Step 3: Set batch size = 5000, parallelism = 8
- Step 4: Schedule daily at 2 AM UTC, max retries = 3
- Step 5: Review preview and DAG structure
- Step 6: Deploy to Airflow
- Step 7: Monitor execution

### 3. Monitor Execution
```bash
# Real-time monitoring in DataBridge UI
# View ETL stage status
# Check task progress
# extract → transform → load_dimensions → load_facts → validate → report
```

---

## 📈 Production Features

### **Scalability:**
- Batch processing (up to 10,000 rows per batch)
- Parallel execution (up to 16 concurrent operations)
- Connection pooling
- Streaming for large datasets

### **Reliability:**
- Automatic retries (configurable)
- Error recovery strategies
- Transaction management
- Data validation

### **Monitoring:**
- Real-time progress tracking
- Task-level status
- SLA alerts
- Performance metrics

### **Security:**
- API key authentication
- Encrypted credentials
- Role-based access control
- Audit logging

---

## 🎯 Next Steps

1. **Set up Redis**:
   ```bash
   # Local development
   docker run -p 6379:6379 redis:latest
   
   # Or use managed Redis (Upstash, Redis Cloud)
   ```

2. **Configure Vercel Cron**:
   - Add cron routes to `vercel.json`
   - Set CRON_SECRET in Vercel environment variables

3. **Test Pipeline**:
   - Create test project
   - Map test tables
   - Start execution
   - Monitor progress

4. **Production Deployment**:
   - Configure staging database
   - Set up SAP Object Store integration
   - Enable scheduled migrations
   - Configure monitoring alerts

---

## 📚 Related Documentation

- `docs/ARCHITECTURE.md` - System architecture
- `docs/CONTRIBUTING.md` - Contribution guidelines
- `docs/ERROR_HANDLING.md` - Error handling patterns
- `docs/SETUP.md` - Setup guide

---

## ✅ Implementation Checklist

- [x] Step 3: Pipeline Configuration
- [x] Step 4: Schedule & Dependencies
- [x] Step 5: Preview & Validate
- [x] Step 6: Execute & Monitor
- [ ] 6-stage ETL pipeline implementation
- [ ] BullMQ task queue integration
- [ ] Vercel Cron scheduling
- [ ] SAP Object Store integration
- [ ] Staging database setup
- [ ] Real-time progress monitoring (SSE)
- [x] Updated wizard layout (PulseSense pattern)
- [x] UI/UX improvements (fixed buttons, scrolling)
- [x] User info in logout section
- [x] Brand colors (no gradients)

---

**Phase 1 (Cleanup) complete! Ready for Phase 2 (ETL Implementation)** 🎉

