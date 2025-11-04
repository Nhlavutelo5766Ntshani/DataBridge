# 🔄 Transformation Guide

## Overview

DataBridge supports comprehensive data transformations during migration, including type conversion, custom SQL expressions, column exclusion, and more.

---

## 🎯 How to Apply Transformations

### **Step 1: Generate Auto-Mappings**

1. Navigate to your project's mapping page: `/projects/{id}/mapping`
2. Click **"Auto Generate Mappings"** button (top right)
3. Wait for the system to:
   - Match tables by name similarity (70% confidence)
   - Match columns by name + data type
   - Create table & column mappings
   - Save to database

**Result:** You'll see a toast notification showing how many mappings were created.

---

### **Step 2: View & Edit Mappings**

After auto-mapping, the **"Current Mappings"** panel (right sidebar) displays:

- 📊 **Table Mappings**: Source → Target table pairs
- 🔗 **Column Mappings**: Individual column connections
- 🏷️ **Transformation Badges**: Shows if transformations are applied

---

### **Step 3: Add Transformations to Columns**

1. In the "Current Mappings" panel, find the column mapping
2. Click the **Edit (✏️)** button next to the column
3. A dialog opens with transformation options:

#### **Available Transformation Types:**

**1. Type Conversion**
- Convert data types (e.g., `VARCHAR` → `INT`, `BOOLEAN` → `BIT`)
- Example: `VARCHAR(255)`, `INT`, `BIGINT`, `DATETIME2`

**2. Custom SQL**
- Write custom SQL expressions
- Use `{column}` as placeholder for source column
- Example: `CONCAT({column}, '_suffix')`, `UPPER({column})`

**3. Exclude Column**
- Skip this column during migration
- Column will not be transferred to target

**4. Default Value**
- Set fallback value for NULL/empty cells
- Example: `0`, `'N/A'`, `GETDATE()`

**5. Uppercase / Lowercase**
- Convert text case automatically

**6. Trim**
- Remove leading/trailing whitespace

**7. Date Format**
- Format date/time values (coming soon)

---

### **Step 4: Preview Migration**

Before executing, click **"Preview Migration"** to see:
- ✅ Sample data (10 rows)
- ✅ Before/after transformation
- ✅ Warnings about unmapped columns
- ✅ Total row count estimates

**Example Preview:**
```json
Source: { "customer_id": "123", "is_active": "true" }
Target: { "CustomerID": 123, "IsActive": 1 }
```

---

### **Step 5: Execute Migration**

1. Click **"Execute Migration"** button
2. Migration runs in background (BullMQ queue)
3. You're redirected to `/migrations/{executionId}` to monitor progress

**What happens:**
- ✅ Processes in batches (1000 rows/batch)
- ✅ Applies transformations in real-time
- ✅ Tracks progress (0-100%)
- ✅ Records errors for failed rows
- ✅ Updates `migrationExecutions` table

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





