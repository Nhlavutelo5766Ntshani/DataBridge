# Phase 6 Testing Plan

## Testing Checklist

### ✅ 1. Project Creation Flow with ETL Configuration

#### Test Steps:
1. Navigate to `/projects/new`
2. **Step 1 - Project Details:**
   - Enter project name: "Test ETL Project"
   - Enter description: "Testing Phase 6 ETL configuration"
   - Click Next
3. **Step 2 - Connections:**
   - Select source connection (SQL Server)
   - Select target connection (PostgreSQL)
   - Click Next
4. **Step 3 - Configuration:**
   - **Migration Settings:**
     - Select mapping strategy: "Manual Mapping"
   - **ETL Configuration:**
     - Batch Size: 2000 (change from default 1000)
     - Parallelism: 8 (change from default 4)
     - Error Handling: "Continue on Error"
     - Data Validation: Toggle ON (should be default)
     - Staging Schema: "staging"
     - Staging Prefix: "stg_"
   - **Schedule Configuration:**
     - Enable Scheduling: Toggle ON
     - Interval: 120 minutes
     - Cron Expression: "0 */2 * * *"
   - Click Next
5. **Step 4 - Review:**
   - Verify all settings display correctly
   - Verify ETL config shows: Batch Size=2000, Parallelism=8
   - Verify Schedule shows: "Every 120 minutes"
   - Click Create Project

#### Expected Results:
- ✅ All form fields save correctly
- ✅ ETL config displays in review
- ✅ Schedule config displays when enabled
- ✅ Project creates successfully
- ✅ ETL and schedule data saved to database

---

### ✅ 2. Mapping Wizard - Real API Integration

#### Test Steps:
1. Navigate to existing project's mapping page
2. Complete table and column mappings
3. Configure pipeline (Step 3)
4. Configure schedule (Step 4)
5. Preview & Validate (Step 5)
6. **Execute & Monitor (Step 6):**
   - Click "Start Execution"
   - Observe real-time progress updates
   - Test Pause button
   - Test Resume button
   - Wait for completion or test Cancel

#### Expected Results:
- ✅ Start Execution calls `POST /api/executions/start`
- ✅ Status polling calls `GET /api/executions/[id]/status` every 2s
- ✅ Progress bar updates in real-time
- ✅ Stage-by-stage progress displays
- ✅ Pause/Resume buttons work
- ✅ Cancel button stops execution

---

### ✅ 3. Execution History Page

#### Test Steps:
1. Navigate to `/migrations`
2. Observe list of executions
3. Click "Refresh" button
4. Click "View Details" on an execution
5. Let page auto-refresh (5s intervals)

#### Expected Results:
- ✅ Page loads successfully
- ✅ Displays all executions from database
- ✅ Status badges show correct colors:
  - Pending: Gray (Clock icon)
  - Running: Blue (Loader icon, spinning)
  - Completed: Green (CheckCircle icon)
  - Failed: Red (XCircle icon)
- ✅ Progress bars display correct percentages
- ✅ Records processed/failed counts display
- ✅ Duration displays in human-readable format
- ✅ Auto-refresh works (page updates every 5s)
- ✅ Refresh button works manually
- ✅ "View Details" links work

---

### ✅ 4. Queue Monitor Dashboard

#### Test Steps:
1. Navigate to `/queue-monitor`
2. Observe queue statistics
3. Test Pause Queue button
4. Test Resume Queue button
5. Click Refresh button
6. Let page auto-refresh (2s intervals)

#### Expected Results:
- ✅ Page loads successfully
- ✅ Displays 5 stat cards:
  - Waiting (gray)
  - Active (cyan)
  - Completed (green)
  - Failed (red)
  - Delayed (yellow)
- ✅ Total jobs processed displays
- ✅ Success rate calculation correct
- ✅ Success rate progress bar displays
- ✅ Pause button works (pauses BullMQ queue)
- ✅ Resume button works (resumes queue)
- ✅ Badge shows "Active" or "Paused" correctly
- ✅ Auto-refresh works (every 2s)
- ✅ Refresh button works manually

---

### ✅ 5. API Endpoints Testing

#### Endpoints to Test:

##### `POST /api/executions/start`
```bash
curl -X POST http://localhost:3000/api/executions/start \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-id",
    "executionId": "exec-test-123",
    "config": {
      "batchSize": 1000,
      "parallelism": 4,
      "errorHandling": "fail-fast",
      "validateData": true,
      "staging": {
        "databaseUrl": "postgresql://...",
        "schemaName": "staging",
        "tablePrefix": "stg_"
      }
    }
  }'
```
**Expected:** `200 OK`, returns `{ success: true, executionId, jobIds }`

##### `GET /api/executions/[id]/status`
```bash
curl http://localhost:3000/api/executions/exec-test-123/status
```
**Expected:** `200 OK`, returns execution status with stages

##### `POST /api/executions/[id]/pause`
```bash
curl -X POST http://localhost:3000/api/executions/exec-test-123/pause
```
**Expected:** `200 OK`, queue paused

##### `POST /api/executions/[id]/resume`
```bash
curl -X POST http://localhost:3000/api/executions/exec-test-123/resume
```
**Expected:** `200 OK`, queue resumed

##### `POST /api/executions/[id]/cancel`
```bash
curl -X POST http://localhost:3000/api/executions/exec-test-123/cancel
```
**Expected:** `200 OK`, jobs cancelled

##### `GET /api/executions/history`
```bash
curl http://localhost:3000/api/executions/history
```
**Expected:** `200 OK`, returns array of executions

##### `GET /api/executions/queue-stats`
```bash
curl http://localhost:3000/api/executions/queue-stats
```
**Expected:** `200 OK`, returns `{ waiting, active, completed, failed, delayed, total }`

---

### ✅ 6. Database Validation

#### Check Schema Updates:
```sql
-- Verify etlExecutionStages table
SELECT * FROM etl_execution_stages LIMIT 5;

-- Verify attachmentMigrations table
SELECT * FROM attachment_migrations LIMIT 5;

-- Verify dataValidations table
SELECT * FROM data_validations LIMIT 5;

-- Verify migrationReports table
SELECT * FROM migration_reports LIMIT 5;

-- Verify mappingProjects has new fields
SELECT 
  id, 
  name, 
  schedule_enabled, 
  schedule_cron, 
  schedule_interval, 
  last_execution_time,
  etl_config 
FROM mapping_projects LIMIT 5;
```

---

### ✅ 7. Component Rendering Tests

#### Components to Verify:
- ✅ Switch component renders correctly
- ✅ Badge with "success" variant displays green
- ✅ ETL config form fields all functional
- ✅ Schedule config conditional rendering works
- ✅ Execution history table renders
- ✅ Queue monitor stats cards render

---

## Known Issues / Edge Cases to Test

### 1. Empty States:
- ✅ Execution history with no executions
- ✅ Queue monitor with no jobs

### 2. Error Handling:
- ✅ API call failures display user-friendly errors
- ✅ Invalid form inputs show validation messages
- ✅ Network errors don't crash the app

### 3. Real-time Updates:
- ✅ Execution status polling doesn't create memory leaks
- ✅ Auto-refresh intervals clean up on unmount
- ✅ Multiple executions update correctly

### 4. Performance:
- ✅ Large execution history lists render smoothly
- ✅ Frequent polling doesn't slow down browser
- ✅ BullMQ queue handles high load

---

## Testing Environment Requirements

### Required Services:
- ✅ PostgreSQL database (with Drizzle schema)
- ✅ Redis server (for BullMQ)
- ✅ Staging database (for ETL)
- ✅ SQL Server (source)
- ✅ CouchDB (for attachments, optional)
- ✅ SAP Object Store (for attachments, optional)

### Environment Variables:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
STAGING_DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret
NEXT_PUBLIC_STAGING_DATABASE_URL=postgresql://...
SAP_OBJECT_STORE_URL=https://...
SAP_OBJECT_STORE_API_KEY=...
CRON_SECRET=your-cron-secret
```

---

## Test Results

### Manual Testing Results:
- [ ] Project creation flow
- [ ] Mapping wizard execution
- [ ] Execution history page
- [ ] Queue monitor page
- [ ] API endpoints
- [ ] Database validation
- [ ] Component rendering

### Automated Test Results:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

---

## Next Steps After Testing

1. ✅ Fix any bugs found during testing
2. ✅ Add automated tests for critical paths
3. ✅ Update documentation with screenshots
4. ✅ Prepare deployment to staging
5. ✅ User acceptance testing
6. ✅ Production deployment

---

## Test Report Template

### Test Date: _____________
### Tester: _____________
### Environment: _____________

#### Test Results:
| Test Case | Status | Notes |
|-----------|--------|-------|
| Project Creation | ⬜ PASS / ⬜ FAIL | |
| Mapping Wizard | ⬜ PASS / ⬜ FAIL | |
| Execution History | ⬜ PASS / ⬜ FAIL | |
| Queue Monitor | ⬜ PASS / ⬜ FAIL | |
| API Endpoints | ⬜ PASS / ⬜ FAIL | |

#### Bugs Found:
1. 
2. 
3. 

#### Recommendations:
1. 
2. 
3. 

