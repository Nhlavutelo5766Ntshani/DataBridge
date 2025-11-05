# 🔄 Transformation Guide

## Overview

DataBridge supports comprehensive data transformations during migration through a wizard-based interface. This guide explains the 4-step wizard process and available transformation types.

## 🧙 Wizard-Based Mapping Interface

The mapping interface uses a 4-step wizard that guides you through the entire migration process:

```
Step 1: Table Selection → Step 2: Column Mapping → Step 3: Preview → Step 4: Execution
```

## 📋 Step-by-Step Guide

### **Step 1: Table Selection**

1. Navigate to your project's mapping page: `/projects/{id}/mapping`
2. **Select source tables** from the left panel
3. **Select target tables** from the right panel
4. **Map tables** by:
   - Click a source table
   - Click one or more target tables (supports one-to-many mapping)
   - Click **"Map Selected Tables"**

**Features:**
- Schema-qualified names displayed (e.g., `dbo.Users`, `staging.Customers`)
- One source table can map to multiple target tables
- Visual indication of mapped tables
- Click **"Continue"** to proceed to column mapping

---

### **Step 2: Interactive Column Mapping**

This step uses an **interactive click-to-map interface**:

1. **Select a table mapping** from the dropdown
2. **Click a source column** (highlighted in cyan)
3. **Click a target column** (highlighted in teal)
4. **Click "Map"** button to create the mapping

**Adding Transformations:**
1. Find the column mapping in the list
2. Click the **"Transform"** button
3. A dialog opens with transformation options (see below)

**Features:**
- Visual feedback with highlighted selections
- Real-time mapping list updates
- Edit or delete existing mappings
- Data type display for each column
- Clear instruction callout

---

### **Step 3: Preview Migration**

Before executing, preview the results:

- ✅ **Sample Data**: Shows 10 sample rows from source
- ✅ **Transformation Preview**: See how data will be transformed
- ✅ **Warnings**: Alerts for unmapped columns or data type issues
- ✅ **Row Counts**: Estimated number of records to migrate

**Example Preview:**
```
Source: { "customer_id": "123", "is_active": "true", "email": " USER@EXAMPLE.COM " }
Target: { "CustomerID": 123, "IsActive": 1, "Email": "user@example.com" }
         ↑ Type conversion   ↑ Custom SQL      ↑ Trim + Lowercase
```

Click **"Continue"** to proceed to execution.

---

### **Step 4: Execute Migration**

1. Review final summary
2. Click **"Start Migration"** button
3. Migration executes in real-time
4. View progress:
   - Records processed counter
   - Progress bar (0-100%)
   - Real-time logs
   - Error tracking

**What happens:**
- ✅ Processes in batches (configurable batch size)
- ✅ Applies all transformations in real-time
- ✅ Tracks progress continuously
- ✅ Records errors for failed rows
- ✅ Updates execution status

---

## 🛠️ Available Transformations

### **1. Type Conversion**

Convert data types between databases.

**Example:**
- Source: `VARCHAR("123")`
- Transformation: Convert to `INT`
- Target: `123` (integer)

**Use Cases:**
- SQL Server `BIT` → PostgreSQL `BOOLEAN`
- String IDs → Integer IDs
- `DATETIME2` → `TIMESTAMP`

**How to Apply:**
1. Click "Transform" on a column mapping
2. Select "Type Conversion"
3. Choose target data type from dropdown
4. Click "Save"

---

### **2. Custom SQL**

Write custom SQL expressions for complex transformations.

**Syntax:**
- Use `{column}` as placeholder for source column value
- Standard SQL functions supported

**Examples:**
```sql
-- Email normalization
LOWER(TRIM({column}))

-- Full name concatenation
CONCAT(TRIM(FirstName), ' ', TRIM(LastName))

-- Phone formatting
REPLACE(REPLACE(REPLACE({column}, '-', ''), '(', ''), ')', '')

-- Conditional logic
CASE WHEN {column} = 'Y' THEN 1 ELSE 0 END

-- Date manipulation
DATEADD(year, 1, {column})
```

**How to Apply:**
1. Click "Transform" on a column mapping
2. Select "Custom SQL"
3. Enter SQL expression
4. Use `{column}` placeholder
5. Click "Save"

---

### **3. Default Value**

Set fallback value for NULL or empty cells.

**Examples:**
- Numeric: `0`, `-1`
- Text: `'N/A'`, `'Unknown'`
- Boolean: `TRUE`, `FALSE`
- Date: `CURRENT_TIMESTAMP`, `'1900-01-01'`

**How to Apply:**
1. Click "Transform" on a column mapping
2. Select "Default Value"
3. Enter default value
4. Click "Save"

---

### **4. String Operations**

**Uppercase:**
- Converts all text to uppercase
- Example: `"john doe"` → `"JOHN DOE"`

**Lowercase:**
- Converts all text to lowercase
- Example: `"JOHN DOE"` → `"john doe"`

**Trim:**
- Removes leading and trailing whitespace
- Example: `" hello "` → `"hello"`

**How to Apply:**
1. Click "Transform" on a column mapping
2. Select "Uppercase", "Lowercase", or "Trim"
3. Click "Save"

---

### **5. Exclude Column**

Skip a column entirely during migration.

**Use Cases:**
- Legacy fields no longer needed
- Sensitive data that shouldn't migrate
- Columns with too many errors

**How to Apply:**
1. Click "Transform" on a column mapping
2. Select "Exclude Column"
3. Click "Save"

---

### **6. Date Format** (Future Enhancement)

Standardize date and time formats.

**Planned Features:**
- Convert to ISO 8601 format
- Add/remove timezone information
- Change date format (MM/DD/YYYY → YYYY-MM-DD)

---

## 🔄 Combined Transformations

You can apply multiple transformations by using Custom SQL:

```sql
-- Trim + Lowercase + Default
COALESCE(LOWER(TRIM({column})), 'unknown')

-- Type conversion + Validation
CAST(
  CASE 
    WHEN {column} ~ '^[0-9]+$' THEN {column}
    ELSE '0'
  END AS INTEGER
)

-- String manipulation + Concatenation
CONCAT(UPPER(LEFT({column}, 1)), LOWER(SUBSTRING({column}, 2)))
```

---

## 🛠️ Transformation Examples

### Example 1: Type Conversion
```
Source: VARCHAR "123"
Transformation: TYPE_CONVERSION → INT
Target: 123 (integer)
```

### Example 2: Custom SQL
```
Source: "john doe"
Transformation: CONCAT(UPPER({column}), '@example.com')
Target: "JOHN DOE@example.com"
```

### Example 3: Default Value
```
Source: NULL
Transformation: DEFAULT_VALUE → 0
Target: 0
```

### Example 4: Exclude Column
```
Source: "sensitive_data"
Transformation: EXCLUDE_COLUMN
Target: (not migrated)
```

---

## 🧪 Cross-Database Type Mapping

DataBridge automatically suggests type conversions based on database compatibility:

### PostgreSQL → SQL Server
| PostgreSQL | SQL Server | Transformation Needed |
|------------|------------|----------------------|
| `text` | `NVARCHAR(MAX)` | ❌ No |
| `integer` | `INT` | ❌ No |
| `boolean` | `BIT` | ✅ Yes (CAST) |
| `jsonb` | `NVARCHAR(MAX)` | ✅ Yes (Convert to string) |

### SQL Server → PostgreSQL
| SQL Server | PostgreSQL | Transformation Needed |
|------------|------------|----------------------|
| `NVARCHAR` | `VARCHAR` | ❌ No |
| `INT` | `INTEGER` | ❌ No |
| `BIT` | `BOOLEAN` | ✅ Yes (CASE WHEN) |
| `DATETIME2` | `TIMESTAMP` | ❌ No |

### MySQL → PostgreSQL
| MySQL | PostgreSQL | Transformation Needed |
|-------|------------|----------------------|
| `VARCHAR` | `VARCHAR` | ❌ No |
| `TINYINT(1)` | `BOOLEAN` | ✅ Yes (= 1) |
| `DATETIME` | `TIMESTAMP` | ❌ No |
| `JSON` | `JSONB` | ❌ No |

---

## 🚨 Common Issues & Solutions

### Issue 1: "No mappings yet"
**Solution:** Click "Auto Generate Mappings" first to create table/column connections.

### Issue 2: "Transformation not saving"
**Solution:** Ensure you've entered required fields (e.g., Target Type for TYPE_CONVERSION).

### Issue 3: "Preview shows warnings"
**Solution:** Check for:
- Unmapped source columns (will be lost)
- Excluded columns (intentional?)
- Data type mismatches

### Issue 4: "Migration failed"
**Solution:** Check:
- Connection credentials are valid
- Target table exists
- Column names match
- Data types are compatible

---

## 📊 Monitoring & Troubleshooting

### Real-Time Progress Tracking

Navigate to `/migrations/{executionId}` to see:
- 📈 **Progress Bar** (0-100%)
- ✅ **Records Processed**
- ❌ **Records Failed**
- ⏱️ **Duration**
- 🏷️ **Status** (pending, running, completed, failed)

### Check Logs

```bash
# View migration worker logs
yarn workspace @databridge/web worker
```

### Retry Failed Migrations

If a migration fails:
1. Fix the issue (connection, transformation, etc.)
2. Click "Execute Migration" again
3. System will create a new execution

---

## 🎓 Best Practices

### 1. Always Preview First
- Catch data type issues early
- Verify transformations work as expected
- Estimate migration time

### 2. Use Auto-Mapping as Starting Point
- 70-85% of mappings are usually correct
- Manually review and adjust edge cases
- Add transformations where needed

### 3. Test with Sample Data
- Start with a subset of tables
- Verify results in target database
- Then migrate full dataset

### 4. Document Custom Transformations
- Add comments in SQL expressions
- Keep track of business logic
- Share with team members

### 5. Monitor During Execution
- Watch for failed batches
- Check target database periodically
- Be ready to cancel if issues arise

---

## 🔗 Related Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [Setup Guide](./SETUP.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Contributing](./CONTRIBUTING.md)

---

## 🆘 Need Help?

If you encounter issues:
1. Check this guide first
2. Review error messages in toast notifications
3. Check browser console for detailed logs
4. Contact the development team

---

**Happy Migrating! 🚀**





