# Staging → Production Migration Workflow

## Overview
This guide explains how to use DataBridge for a two-phase migration strategy with data quality controls.

## Architecture: Two-Project Pipeline

### Phase 1: Source → Staging (Raw Data Load)
**Purpose:** Load raw data into staging schema for validation and transformation

**Project Configuration:**
- **Name:** `Source_To_Staging_Migration`
- **Source Connection:** Your source database
- **Target Connection:** Your target database (staging schema)

**Mapping Strategy:**
```
Source Database                → Target Database (Staging)
─────────────────────────────────────────────────────────
SourceDB.dbo.Employees         → TargetDB.staging.Employees
SourceDB.dbo.Orders            → TargetDB.staging.Orders
SourceDB.dbo.Products          → TargetDB.staging.Products
```

**Transformations:** Minimal
- Type conversions only (if required)
- No business logic
- Fast bulk load

**Benefits:**
- ✅ Preserve raw source data
- ✅ Quick initial load
- ✅ Audit trail of source data
- ✅ Can re-process if needed

---

### Phase 2: Staging → Production (Transformation + Quality)
**Purpose:** Apply transformations, validation, and business rules

**Project Configuration:**
- **Name:** `Staging_To_Production_Migration`
- **Source Connection:** Your target database (staging schema)
- **Target Connection:** Your target database (production schema)

**Mapping Strategy:**
```
Target Database (Staging)            → Target Database (Production)
───────────────────────────────────────────────────────────────────
TargetDB.staging.Employees           → TargetDB.dbo.Employees
TargetDB.staging.Orders              → TargetDB.dbo.Orders_Clean
TargetDB.staging.Products            → TargetDB.dbo.Products_Validated

# Data Breakout Example:
TargetDB.staging.Employees           → TargetDB.dbo.Employee_Basic_Info
                                     → TargetDB.dbo.Employee_Contact
                                     → TargetDB.dbo.Employee_Salary
```

**Transformations:** Full Suite
- ✅ Type conversions
- ✅ Custom SQL expressions
- ✅ Data cleansing (TRIM, UPPER, etc.)
- ✅ Date format standardization
- ✅ Default values for missing data
- ✅ Column exclusions
- ✅ Derived/calculated columns

---

## Step-by-Step Workflow

### 1. Create Source → Staging Project

1. Navigate to **Projects** → **New Project**
2. Fill in details:
   - **Name:** `Source_To_Staging_Migration`
   - **Source Connection:** Select your source database
   - **Target Connection:** Select target database (with staging schema)
3. Click **Create Project**

### 2. Map Tables (Phase 1)

**Step 1: Table Selection**
- Source: Select tables from source database
- Target: Select corresponding tables in `staging` schema
- Example: `dbo.Employees` → `staging.Employees`

**Step 2: Column Mapping**
- Use **Auto-Map Columns** for initial mapping
- Apply minimal transformations (type conversion only if needed)
- Click **Continue**

**Step 3: Preview**
- Review sample data transformation
- Check for data type issues
- Click **Continue**

**Step 4: Execute**
- Click **Start Migration**
- Monitor progress in real-time
- Wait for completion

### 3. Validate Staging Data

Before proceeding to Phase 2, validate your staging data:

```sql
-- Check row counts
SELECT 'Employees' AS TableName, COUNT(*) AS RowCount 
FROM staging.Employees
UNION ALL
SELECT 'Orders', COUNT(*) FROM staging.Orders;

-- Check for nulls in critical columns
SELECT COUNT(*) AS NullEmails 
FROM staging.Employees 
WHERE Email IS NULL;

-- Check data quality
SELECT * FROM staging.Employees 
WHERE Email NOT LIKE '%@%' 
LIMIT 10;
```

### 4. Create Staging → Production Project

1. Navigate to **Projects** → **New Project**
2. Fill in details:
   - **Name:** `Staging_To_Production_Migration`
   - **Source Connection:** Target database (staging schema)
   - **Target Connection:** Target database (production schema)
3. Click **Create Project**

### 5. Map Tables with Transformations (Phase 2)

**Step 1: Table Selection**
- Source: Select tables from `staging` schema
- Target: Select corresponding tables in `dbo` (production) schema
- Supports one-to-many mapping for data breakout

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


