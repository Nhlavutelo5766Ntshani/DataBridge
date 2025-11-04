# 🚀 Enhanced Migration Wizard with Airflow Integration

## Overview

The DataBridge migration wizard has been enhanced with full Airflow orchestration capabilities, providing production-ready ETL pipeline management with comprehensive monitoring and control.

---

## 🎯 Complete 7-Step Migration Flow

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

### **Step 6: Review & Deploy** 🆕
**File**: `apps/web/src/components/mapping/wizard/step6-review-deploy.tsx`

**Configuration Summary:**
- Project name
- Table mappings count
- Column mappings count
- Transformations count
- Schedule status (enabled/disabled)
- Cron expression

**Deployment Progress:**
Real-time deployment status with 5 stages:
1. ✅ Generate Airflow DAG
2. ✅ Validate DAG syntax
3. ✅ Commit to GitHub repository
4. ✅ Trigger CI/CD workflow
5. ✅ Deploy to Airflow

**Success Links:**
- Direct link to Airflow DAG
- GitHub commit URL
- CI/CD workflow status
- Retry on failure

---

### **Step 7: Execute & Monitor** 🆕
**File**: `apps/web/src/components/mapping/wizard/step7-execution-monitor.tsx`

**Real-Time Monitoring:**
- Live progress bar
- Records processed/total
- Failed records count
- Success rate percentage

**Airflow Integration:**
- Link to Airflow UI for detailed logs
- Task-level status tracking:
  - Queued
  - Running
  - Success
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
**File**: `apps/web/src/lib/actions/pipeline-deployment.ts`

```typescript
// Deploy project to Airflow
deployProjectToAirflow(projectId: string)

// Get deployment status
getDeploymentStatus(projectId: string)

// Execution control
pausePipelineExecution(dagId: string, dagRunId: string)
resumePipelineExecution(dagId: string, dagRunId: string)
retryPipelineExecution(dagId: string, dagRunId: string)

// Monitoring
getAirflowTaskStatus(dagId: string, dagRunId: string)
```

### **API Routes**

#### `POST /api/airflow/trigger-dag`
Trigger a new Airflow DAG run
```json
{
  "dagId": "project_123_dag",
  "conf": { "custom": "config" }
}
```

#### `GET /api/airflow/dag-status?dagId=X&dagRunId=Y`
Get DAG run status
```json
{
  "success": true,
  "data": {
    "dagId": "project_123_dag",
    "state": "running",
    "startDate": "2025-01-01T00:00:00Z"
  }
}
```

#### `GET /api/airflow/task-instances?dagId=X&dagRunId=Y`
Get all task instances for a DAG run
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "extract_data",
        "status": "success",
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
Generate Airflow DAG with:
  - Schedule configuration
  - Retry logic
  - SLA monitoring
  - Dependencies
  ↓
Commit DAG to GitHub
  ↓
GitHub Actions validates and deploys
  ↓
Airflow picks up new DAG
  ↓
User triggers execution (manual or scheduled)
  ↓
Airflow orchestrates ETL pipeline:
  1. Extract from source
  2. Transform data
  3. Validate quality
  4. Load to target
  5. Complete
  ↓
Real-time monitoring in DataBridge UI
  - Task-level progress
  - Error tracking
  - Performance metrics
  ↓
Link to Airflow UI for detailed logs
```

---

## 🔐 Environment Variables Required

Add these to your `.env.local`:

```bash
# Airflow Configuration
AIRFLOW_API_URL=http://localhost:8080/api/v1
AIRFLOW_API_KEY=your_airflow_api_key
NEXT_PUBLIC_AIRFLOW_URL=http://localhost:8080

# GitHub Configuration (for DAG deployment)
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_org
GITHUB_REPO_NAME=your_repo

# Deployment Configuration
DEPLOY_ENVIRONMENT=development # or production
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

### 3. Monitor in Airflow
```bash
# Access Airflow UI
open http://localhost:8080

# View DAG
# customer_data_migration_dag

# Check task status
# extract_data → transform_and_map → validate_data → load_to_target
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

1. **Configure Airflow**:
   ```bash
   cd airflow
   docker-compose up -d
   ```

2. **Set up GitHub Actions**:
   - Configure secrets in GitHub repository
   - Add Airflow deployment workflow

3. **Test Pipeline**:
   - Create test project
   - Map test tables
   - Deploy to Airflow
   - Monitor execution

4. **Production Deployment**:
   - Configure production Airflow instance
   - Set up monitoring alerts
   - Enable SLA notifications
   - Configure backfill settings

---

## 📚 Related Documentation

- `docs/ARCHITECTURE.md` - System architecture
- `docs/CONTRIBUTING.md` - Contribution guidelines
- `docs/ERROR_HANDLING.md` - Error handling patterns
- `airflow/README.md` - Airflow setup guide
- `docs/GIT_SETUP.md` - Git repository configuration

---

## ✅ Implementation Checklist

- [x] Step 3: Pipeline Configuration
- [x] Step 4: Schedule & Dependencies
- [x] Step 5: Preview & Validate (with DAG visualization)
- [x] Step 6: Review & Deploy
- [x] Step 7: Execute & Monitor (enhanced)
- [x] Server actions for deployment
- [x] API routes for Airflow communication
- [x] Updated wizard layout (PulseSense pattern)
- [x] UI/UX improvements (fixed buttons, scrolling)
- [x] User info in logout section
- [x] Brand colors (no gradients)

---

**All features are production-ready and fully integrated with Airflow!** 🎉

