# Multi-Pipeline Migration Workflow

## Overview

DataBridge's multi-pipeline architecture enables complex migrations with sequential ETL stages. This guide explains how to use multi-pipeline projects for staging-to-production workflows with data quality controls.

## Architecture: Single Project, Multiple Pipelines

Unlike the old two-project approach, DataBridge now supports **multiple pipelines within a single project**:

```
Single Project: "Customer Data Migration"
├── Pipeline 1: Source → Staging (Raw Load)
├── Pipeline 2: Staging → Production (Transformation)
└── Pipeline 3: Production → Analytics (Aggregation)
```

### Benefits of Multi-Pipeline Architecture

- ✅ **Unified Management**: All pipelines in one project
- ✅ **Sequential Execution**: Pipelines run in order automatically
- ✅ **Dependency Management**: Pipeline 2 waits for Pipeline 1
- ✅ **Granular Monitoring**: Track each pipeline separately
- ✅ **Airflow Integration**: Single DAG orchestrates all pipelines
- ✅ **Flexible Scheduling**: Schedule the entire project or individual pipelines

## Common Migration Patterns

### Pattern 1: Source → Staging → Production

```
┌─────────────────────────────────────────────────────────┐
│  Pipeline 1: Raw Data Load                              │
│  Source DB → Staging Schema                             │
│  - Minimal transformations                              │
│  - Fast bulk load                                       │
│  - Preserve raw data                                    │
└──────────────────┬──────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Pipeline 2: Transformation & Quality                   │
│  Staging Schema → Production Schema                     │
│  - Data cleansing                                       │
│  - Type conversions                                     │
│  - Business rules                                       │
│  - Validation                                           │
└─────────────────────────────────────────────────────────┘
```

### Pattern 2: Multi-Environment Migration

```
Pipeline 1: Source → Dev DB
Pipeline 2: Dev DB → QA DB
Pipeline 3: QA DB → Prod DB
```

### Pattern 3: Data Breakout (Normalization)

```
Pipeline 1: Source → Staging
Pipeline 2: Staging → Production Tables (1:N)
  - staging.Employees → dbo.Employees_Basic
  - staging.Employees → dbo.Employees_Contact
  - staging.Employees → dbo.Employees_Salary
```

## Step-by-Step Guide

### 1. Create a Multi-Pipeline Project

1. Navigate to **Projects** → **New Project**
2. Fill in project details:
   - **Name:** `Customer Data Migration`
   - **Description:** `Multi-stage migration with staging layer`
   - **Migration Strategy:** Select **"Multi-Pipeline"**
   - **Source Connection:** Leave blank (set per pipeline)
   - **Target Connection:** Leave blank (set per pipeline)
3. Click **Create Project**

**Note:** For multi-pipeline projects, connections are configured at the pipeline level, not the project level.

---

### 2. Create Pipeline 1: Source → Staging

1. Go to your project → **Pipelines** tab
2. Click **"Add Pipeline"**
3. Fill in pipeline details:
   - **Name:** `Source to Staging`
   - **Description:** `Raw data load from source to staging`
   - **Order:** `1` (executes first)
   - **Source Connection:** Select source database
   - **Target Connection:** Select target database (staging schema)
   - **Depends On:** Leave blank (first pipeline)
4. Click **Create Pipeline**

---

### 3. Map Tables for Pipeline 1 (Raw Load)

1. Click **"Configure Mapping"** on Pipeline 1
2. Follow the 4-step wizard:

**Step 1: Table Selection**
- Source: Select tables from source database
- Target: Select corresponding tables in `staging` schema
- Example: `dbo.Employees` → `staging.Employees`
- Click **"Map Selected Tables"**

**Step 2: Column Mapping**
- Interactive click-to-map interface
- Apply minimal transformations:
  - Type conversions only (if required)
  - No business logic at this stage
- Click **"Continue"**

**Step 3: Preview**
- Review sample data
- Check for data type issues
- Verify row counts
- Click **"Continue"**

**Step 4: Save Mapping**
- Click **"Save Mapping"**
- Returns to pipelines page

**Transformation Strategy for Pipeline 1:**
- ✅ Type conversions only (if required)
- ❌ No data cleansing
- ❌ No business logic
- ❌ Fast bulk load

---

### 4. Create Pipeline 2: Staging → Production

1. Click **"Add Pipeline"** again
2. Fill in pipeline details:
   - **Name:** `Staging to Production`
   - **Description:** `Transform and cleanse data for production`
   - **Order:** `2` (executes after Pipeline 1)
   - **Source Connection:** Select target database (staging schema)
   - **Target Connection:** Select target database (production schema)
   - **Depends On:** Select **"Source to Staging"** (Pipeline 1)
3. Click **Create Pipeline**

**Dependency Management:**
- Pipeline 2 will only execute after Pipeline 1 completes successfully
- If Pipeline 1 fails, Pipeline 2 will not run
- Airflow DAG enforces this dependency

---

### 5. Map Tables for Pipeline 2 (Transformation)

1. Click **"Configure Mapping"** on Pipeline 2
2. Follow the 4-step wizard:

**Step 1: Table Selection**
- Source: Select tables from `staging` schema
- Target: Select corresponding tables in `dbo` (production) schema
- Supports one-to-many mapping for data breakout
- Example: `staging.Employees` → `dbo.Employees`, `dbo.Employee_Details`

**Step 2: Column Mapping with Transformations**

For each column mapping, click **Transform** button to apply:

#### Data Cleansing Examples:

```sql
-- Email Validation & Cleanup
LOWER(TRIM(Email))

-- Phone Number Formatting
REPLACE(REPLACE(REPLACE(Phone, '-', ''), '(', ''), ')', '')

-- Full Name Concatenation
CONCAT(TRIM(FirstName), ' ', TRIM(LastName))

-- Currency Formatting
ROUND(Salary, 2)
```

#### Date Transformations:

```sql
-- Standardize Date Format
CAST(BirthDate AS DATE)

-- Add Default for Missing Dates
COALESCE(LastModified, CURRENT_TIMESTAMP)
```

#### Type Conversions:

```sql
-- String to Integer
CAST(EmployeeID AS INTEGER)

-- Numeric to String
CAST(PhoneNumber AS VARCHAR(20))
```

#### Default Values:

```sql
-- Set default for NULL values
COALESCE(Department, 'Unassigned')

-- Boolean defaults
COALESCE(IsActive, TRUE)
```

**Step 3: Preview**
- Review transformed data samples
- Check validation warnings
- Verify data quality

**Step 4: Execute**
- Start final migration to production
- Monitor progress
- Review completion status

---

## Data Quality Best Practices

### 1. Validation Checks

**Pre-Migration (Staging):**
```sql
-- Duplicate detection
SELECT Email, COUNT(*) 
FROM staging.Employees 
GROUP BY Email 
HAVING COUNT(*) > 1;

-- Required field validation
SELECT * FROM staging.Employees 
WHERE EmployeeID IS NULL 
   OR FirstName IS NULL 
   OR Email IS NULL;

-- Format validation
SELECT * FROM staging.Employees 
WHERE Email NOT LIKE '%@%.%';
```

**Post-Migration (Production):**
```sql
-- Row count reconciliation
SELECT 
  (SELECT COUNT(*) FROM staging.Employees) AS StagingCount,
  (SELECT COUNT(*) FROM dbo.Employees) AS ProductionCount;

-- Data integrity checks
SELECT COUNT(*) AS OrphansFound
FROM dbo.Orders o
LEFT JOIN dbo.Employees e ON o.EmployeeID = e.EmployeeID
WHERE e.EmployeeID IS NULL;
```

### 2. Exclude Invalid Data

Use **Exclude Column** transformation to skip problematic columns:
- Legacy fields no longer needed
- Sensitive data that shouldn't migrate
- Columns with too many nulls/errors

### 3. Incremental Loads

For ongoing synchronization:
1. Add `LastModified` timestamp to staging tables
2. Create new project for incremental loads
3. Use SQL filter in transformations:
   ```sql
   WHERE LastModified > '2025-01-01'
   ```

---

## Schema Support

DataBridge now supports **schema-qualified table names**:

### Display Format
```
Schema: staging
Table:  Employees
```

### Qualified Names in Mappings
- Source: `staging.Employees`
- Target: `dbo.Employees`
- Distinguishes: `staging.Orders` vs `archive.Orders`

### Benefits
- ✅ Prevents name collisions
- ✅ Clear data lineage
- ✅ Supports multi-schema migrations
- ✅ Enables staging → production workflows

---

## Monitoring & Rollback

### Real-Time Monitoring
Navigate to **Migrations** page to monitor:
- Records processed
- Success/failure counts
- Estimated completion time
- Error details

### Rollback Strategy
1. Keep staging data intact until production validated
2. Use database transactions for smaller migrations
3. Create backup before production migration:
   ```sql
   -- Backup production tables
   CREATE TABLE dbo.Employees_Backup AS 
   SELECT * FROM dbo.Employees;
   ```

### Post-Migration Validation
```sql
-- Compare aggregates
SELECT 
  MIN(Salary) AS MinSalary,
  MAX(Salary) AS MaxSalary,
  AVG(Salary) AS AvgSalary,
  COUNT(*) AS TotalEmployees
FROM dbo.Employees;
```

---

## Common Patterns

### Pattern 1: Data Cleansing Pipeline
```
Source → Staging (raw) → Production (clean)
         │
         └→ Apply quality checks
         └→ Apply transformations
         └→ Validate business rules
```

### Pattern 2: Data Breakout (Normalization)
```
staging.Employees → dbo.Employees_Basic
                  → dbo.Employees_Contact
                  → dbo.Employees_Compensation
```

### Pattern 3: Data Consolidation
```
staging.Orders_2023 ─┐
staging.Orders_2024 ─┼→ dbo.Orders (consolidated)
staging.Orders_2025 ─┘
```

---

## Next Steps

1. ✅ Schema-qualified names implemented
2. 🔄 Auto-mapping (coming next)
3. 🔄 Data quality validation framework
4. 🔄 Pre-migration validation rules
5. 🔄 Post-migration reconciliation reports

---

## Support

For questions or issues:
- Check the main [README.md](../README.md)
- Review [CONTRIBUTING.md](./CONTRIBUTING.md)
- Open an issue in the repository


