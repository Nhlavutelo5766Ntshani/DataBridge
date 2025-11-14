# Error Handling Guide

## Overview

DataBridge uses a standardized, pattern-based error handling approach across all layers of the application. This system provides consistent error responses, user-friendly messages, and detailed logging for debugging.

## Core Principles

1. **Pattern-Based Matching**: Use regex patterns to identify error types across different database providers
2. **Centralized Error Codes**: All error codes defined in one location for consistency
3. **Three-Layer Architecture**: Errors bubble up from queries to actions where they're handled
4. **User-Friendly Messages**: Production errors are generic and safe; development errors are detailed
5. **Consistent Response Format**: All server actions return `QueryResponse<T>` type

## Error Response Format

All server actions return a consistent `QueryResponse<T>` type:

```typescript
type QueryResponse<T> = {
  success: true;
  data: T;
  error?: never;
  code?: never;
} | {
  success: false;
  data?: never;
  error: string | string[];
  code?: string;
};
```

### Success Response

```typescript
{
  success: true,
  data: { id: "123", name: "Project Name" }
}
```

### Error Response

```typescript
{
  success: false,
  error: "Project not found",
  code: "NOT_FOUND"
}
```

### Multiple Errors (Validation)

```typescript
{
  success: false,
  error: [
    "Email is required",
    "Password must be at least 8 characters"
  ],
  code: "VALIDATION_ERROR"
}
```

## Centralized Error Codes

All error codes are defined in `apps/web/src/lib/constants/error-codes.ts`:

```typescript
export const ERROR_CODES = {
  // Database Errors
  DB_ERROR: "DB_ERROR",
  DUPLICATE_RECORD: "DUPLICATE_RECORD",
  INVALID_REFERENCE: "INVALID_REFERENCE",
  MISSING_REQUIRED_DATA: "MISSING_REQUIRED_DATA",
  
  // Validation Errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_FORMAT: "INVALID_FORMAT",
  
  // Connection Errors
  CONNECTION_ERROR: "CONNECTION_ERROR",
  TIMEOUT: "TIMEOUT",
  
  // Authorization Errors
  AUTH_ERROR: "AUTH_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  
  // Resource Errors
  NOT_FOUND: "NOT_FOUND",
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
  
  // General Errors
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.DB_ERROR]: "An unexpected database error occurred",
  [ERROR_CODES.DUPLICATE_RECORD]: "A record with this information already exists",
  [ERROR_CODES.INVALID_REFERENCE]: "This operation references data that doesn't exist",
  [ERROR_CODES.MISSING_REQUIRED_DATA]: "Required information is missing",
  [ERROR_CODES.VALIDATION_ERROR]: "Validation failed",
  [ERROR_CODES.INVALID_FORMAT]: "Invalid data format",
  [ERROR_CODES.CONNECTION_ERROR]: "Connection failed",
  [ERROR_CODES.TIMEOUT]: "The database operation took too long to complete",
  [ERROR_CODES.AUTH_ERROR]: "Authentication failed",
  [ERROR_CODES.PERMISSION_DENIED]: "You don't have permission to perform this action",
  [ERROR_CODES.NOT_FOUND]: "Resource not found",
  [ERROR_CODES.LIMIT_EXCEEDED]: "Operation limits exceeded",
  [ERROR_CODES.SERVER_ERROR]: "Internal server error",
  [ERROR_CODES.UNKNOWN]: "An unknown error occurred",
};
```

## Error Pattern Matching

The `createErrorResponse` utility uses regex pattern matching to identify error types and map them to standardized error codes:

| Error Pattern             | Regex Pattern                                                  | Error Code              | User-Friendly Message                               |
| ------------------------- | -------------------------------------------------------------- | ----------------------- | --------------------------------------------------- |
| Duplicate entry           | `/unique constraint\|duplicate key\|already exists/i`          | `DUPLICATE_RECORD`      | "A record with this information already exists"     |
| Foreign key violation     | `/foreign key constraint\|referenced\|references/i`            | `INVALID_REFERENCE`     | "This operation references data that doesn't exist" |
| Null constraint violation | `/null value\|not-null\|required\|cannot be null/i`            | `MISSING_REQUIRED_DATA` | "Required information is missing"                   |
| Permission error          | `/permission\|privilege\|authorization\|not allowed\|access/i` | `PERMISSION_DENIED`     | "You don't have permission to perform this action"  |
| Syntax error              | `/syntax\|invalid\|malformed\|not valid/i`                     | `INVALID_FORMAT`        | "Invalid data format"                               |
| Timeout                   | `/timeout\|timed out\|too slow\|deadlock/i`                    | `TIMEOUT`               | "The database operation took too long to complete"  |
| Limit exceeded            | `/limit\|quota\|exceeded\|too many/i`                          | `LIMIT_EXCEEDED`        | "Operation limits exceeded"                         |
| Not found                 | `/not found\|does not exist\|no such/i`                        | `NOT_FOUND`             | "Resource not found"                                |
| Connection error          | `/connection\|connect\|network\|unreachable/i`                 | `CONNECTION_ERROR`      | "Connection failed"                                 |
| Other errors              | (default)                                                      | `DB_ERROR`              | "An unexpected database error occurred"             |

### Why Pattern Matching?

1. **Database Agnostic**: Works across PostgreSQL, MySQL, SQL Server, MongoDB, CouchDB
2. **Resilient**: Catches errors regardless of specific error code implementations
3. **Future-Proof**: Adapts to changes in database drivers or ORM updates
4. **Consistent**: Provides uniform error codes throughout the application

## Environment-Specific Behavior

### Development Mode
- Returns **detailed error messages** with stack traces
- Includes **context metadata** for debugging
- Logs errors to console with full details

### Production Mode
- Returns **generic, user-friendly messages** based on error patterns
- Hides **sensitive information** and stack traces
- Logs errors to monitoring service (e.g., Sentry)

## Error Utilities

### Creating Error Responses

```typescript
import { createErrorResponse } from "@/lib/utils/errors";

export async function fetchProject(id: string): Promise<QueryResponse<Project | null>> {
  try {
    const project = await getProjectById(id);
    return { success: true, data: project };
  } catch (error) {
    // Automatically matches error patterns and returns appropriate code
    return createErrorResponse("fetchProject", error);
  }
}
```

### Creating Success Responses

```typescript
import { createSuccessResponse } from "@/lib/utils/errors";

export async function addProject(data: NewProject): Promise<QueryResponse<Project>> {
  try {
    const project = await createProject(data);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("addProject", error);
  }
}
```

### Using Error Codes Directly

```typescript
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/constants/error-codes";

if (!user) {
  return {
    success: false,
    error: ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
    code: ERROR_CODES.NOT_FOUND,
  };
}
```

## Three-Layer Error Handling

### Layer 1: Schema (No Error Handling)

The schema layer is READ-ONLY and contains only Drizzle ORM definitions. No error handling occurs here.

### Layer 2: Query Layer (No Error Handling)

Query layer functions are pure database operations that **do not handle errors**. Errors bubble up to the actions layer.

```typescript
// apps/web/src/db/queries/projects.ts

/**
 * Get project by ID
 * @param id - Project ID
 * @returns Project or null
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const project = await db.query.mappingProjects.findFirst({
    where: eq(mappingProjects.id, id),
  });
  return project || null;
}

// No try/catch - errors bubble up to actions layer
```

**Key Points:**
- ✅ Pure database operations
- ✅ Return direct database types
- ✅ No error handling
- ✅ No 'use server' directive
- ❌ No try/catch blocks
- ❌ No logging

### Layer 3: Actions Layer (Comprehensive Error Handling)

Actions layer functions implement comprehensive error handling with pattern matching:

```typescript
// apps/web/src/lib/actions/projects.ts
"use server";

import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { getProjectById } from "@/db/queries/projects";
import type { QueryResponse } from "@/db/types/queries";

/**
 * Fetch project by ID with error handling
 * @param id - Project ID
 * @returns Query response with project data or error
 */
export async function fetchProject(
  id: string
): Promise<QueryResponse<Project | null>> {
  try {
    // Validate input
    if (!id) {
      return {
        success: false,
        error: "Project ID is required",
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }

    // Call query layer
    const project = await getProjectById(id);

    // Return success
    return createSuccessResponse(project);
  } catch (error) {
    // Pattern matching happens here
    return createErrorResponse("fetchProject", error);
  }
}
```

**Key Points:**
- ✅ Include 'use server' directive
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Return QueryResponse<T>
- ✅ Use createErrorResponse utility
- ✅ Pattern-based error codes

## Validation Errors

### Using Zod for Validation

```typescript
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { mappingProjects } from "@databridge/schema";
import { ERROR_CODES } from "@/lib/constants/error-codes";

// Create Zod schema from Drizzle schema
export const projectCreateSchema = createInsertSchema(mappingProjects, {
  name: z.string().min(1, "Project name is required"),
  userId: z.string().uuid("Invalid user ID"),
  sourceConnectionId: z.string().uuid("Invalid source connection ID"),
});

export type ProjectCreateData = z.infer<typeof projectCreateSchema>;

// Use in action
export async function addProject(
  data: ProjectCreateData
): Promise<QueryResponse<Project>> {
  try {
    // Validate input
    const validatedData = projectCreateSchema.parse(data);

    // Create project
    const project = await createProject(validatedData);

    return createSuccessResponse(project);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message),
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }

    // Handle other errors with pattern matching
    return createErrorResponse("addProject", error);
  }
}
```

### Handling Zod Errors

```typescript
if (error instanceof z.ZodError) {
  return {
    success: false,
    error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    code: ERROR_CODES.VALIDATION_ERROR,
  };
}
```

## Form Data Validation

### Using parseFormData Utility

```typescript
import { parseFormData } from "@/lib/utils/validators";
import { connectionCreateSchema } from "@/db/queries/connections";

export async function createConnectionAction(
  formData: FormData
): Promise<QueryResponse<Connection>> {
  try {
    // Parse and validate form data
    const data = parseFormData(formData, connectionCreateSchema);

    // Create connection
    const connection = await createConnection(data);

    return createSuccessResponse(connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message),
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }

    return createErrorResponse("createConnectionAction", error);
  }
}
```

## Logging Errors

### Using the Logger Utility

```typescript
import { logger } from "@/lib/utils/logger";

// Info level
logger.info("Project created successfully", { projectId: project.id });

// Warning level
logger.warn("Connection test timeout", { connectionId, timeout: 5000 });

// Error level
logger.error("Migration failed", {
  error,
  migrationId,
  recordsProcessed: 1000,
  duration: "5m 30s",
});
```

### Logger Configuration

The logger utility provides structured logging with metadata:

```typescript
export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[INFO] ${message}`, metadata || {});
    }
  },

  warn: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`, metadata || {});
    }
  },

  error: (message: string, metadata?: unknown) => {
    console.error(`[ERROR] ${message}`, metadata);
    // In production, send to monitoring service (e.g., Sentry)
  },
};
```

## Client-Side Error Handling

### Handling Action Errors in Components

```typescript
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addProject } from "@/lib/actions/projects";
import { ERROR_CODES } from "@/lib/constants/error-codes";

export const ProjectForm = () => {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");

    const result = await addProject({
      name: formData.get("name") as string,
      userId: formData.get("userId") as string,
      // ...
    });

    if (!result.success) {
      // Handle error with code
      const errorMessage = Array.isArray(result.error)
        ? result.error.join(", ")
        : result.error || "An error occurred";
      
      setError(errorMessage);
      
      // Show appropriate toast based on error code
      if (result.code === ERROR_CODES.DUPLICATE_RECORD) {
        toast.error("Project already exists", {
          description: "Please use a different name",
        });
      } else {
        toast.error(errorMessage);
      }
      
      setIsLoading(false);
      return;
    }

    // Handle success
    toast.success("Project created successfully");
    setIsLoading(false);
  };

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {/* Form fields */}
    </form>
  );
};
```

### Using React Error Boundaries

```typescript
"use client";

import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full p-6 border border-destructive rounded-lg bg-destructive/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">
                Something went wrong
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Database Error Handling

### Connection Errors

```typescript
import { ERROR_CODES } from "@/lib/constants/error-codes";

export async function testDatabaseConnection(
  connection: Connection
): Promise<QueryResponse<boolean>> {
  try {
    const client = await createDatabaseConnection(connection);

    // Test query
    await client.query("SELECT 1");

    await closeDatabaseConnection(client);

    return createSuccessResponse(true);
  } catch (error) {
    // Pattern matching will identify connection errors
    return createErrorResponse("testDatabaseConnection", error);
  }
}
```

### Transaction Errors

```typescript
export async function executeMigration(
  migrationId: string
): Promise<QueryResponse<MigrationExecution>> {
  try {
    const migration = await getMigrationById(migrationId);

    if (!migration) {
      return {
        success: false,
        error: "Migration not found",
        code: ERROR_CODES.NOT_FOUND,
      };
    }

    // Execute migration in transaction
    const result = await db.transaction(async (tx) => {
      // Migration logic
      return await performMigration(tx, migration);
    });

    return createSuccessResponse(result);
  } catch (error) {
    // Pattern matching handles transaction errors
    return createErrorResponse("executeMigration", error);
  }
}
```

## API Route Error Handling

### Next.js API Routes

```typescript
// apps/web/src/app/api/cron/process-jobs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ERROR_CODES } from "@/lib/constants/error-codes";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized", code: ERROR_CODES.AUTH_ERROR },
        { status: 401 }
      );
    }

    // Process jobs
    const result = await processJobs();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}
```

## Error Display Patterns

### Toast Notifications

```typescript
import { toast } from "sonner";
import { ERROR_CODES } from "@/lib/constants/error-codes";

// Success
toast.success("Project created successfully");

// Error with code-based handling
if (result.code === ERROR_CODES.DUPLICATE_RECORD) {
  toast.error("Project already exists", {
    description: "Please use a different name",
  });
} else if (result.code === ERROR_CODES.TIMEOUT) {
  toast.error("Operation timed out", {
    description: "Please try again",
  });
} else {
  toast.error(result.error);
}
```

### Alert Components

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ERROR_CODES } from "@/lib/constants/error-codes";

// Error alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    {result.error}
  </AlertDescription>
</Alert>

// Warning alert
<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This operation may take a few minutes
  </AlertDescription>
</Alert>

// Info alert
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>
    No projects found. Create your first project to get started.
  </AlertDescription>
</Alert>
```

## Best Practices

### 1. Always Use Try/Catch in Actions

```typescript
// ✅ Good
export async function addProject(data: NewProject): Promise<QueryResponse<Project>> {
  try {
    const project = await createProject(data);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("addProject", error);
  }
}

// ❌ Bad
export async function addProject(data: NewProject) {
  const project = await createProject(data); // No error handling
  return project;
}
```

### 2. Validate Input Early

```typescript
// ✅ Good
export async function fetchProject(id: string): Promise<QueryResponse<Project | null>> {
  try {
    if (!id) {
      return {
        success: false,
        error: "Project ID is required",
        code: ERROR_CODES.VALIDATION_ERROR,
      };
    }

    const project = await getProjectById(id);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("fetchProject", error);
  }
}
```

### 3. Use Pattern Matching for Database Errors

```typescript
// ✅ Good - Let createErrorResponse handle pattern matching
try {
  await createConnection(data);
} catch (error) {
  return createErrorResponse("createConnection", error);
  // Automatically detects: duplicate, foreign key, timeout, etc.
}

// ❌ Bad - Manual error code assignment
try {
  await createConnection(data);
} catch (error) {
  if (error.message.includes("duplicate")) {
    return { success: false, error: "Duplicate", code: "DUPLICATE" };
  }
  // Missing other error types
}
```

### 4. Return Consistent Response Types

```typescript
// ✅ Good - Always return QueryResponse<T>
export async function addProject(data: NewProject): Promise<QueryResponse<Project>> {
  try {
    const project = await createProject(data);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("addProject", error);
  }
}

// ❌ Bad - Inconsistent return types
export async function addProject(data: NewProject) {
  try {
    return await createProject(data);
  } catch (error) {
    return { error: "Failed" }; // Different structure
  }
}
```

### 5. Handle Zod Errors Separately

```typescript
// ✅ Good
try {
  const validatedData = schema.parse(data);
  const result = await createProject(validatedData);
  return createSuccessResponse(result);
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map((e) => e.message),
      code: ERROR_CODES.VALIDATION_ERROR,
    };
  }

  return createErrorResponse("createProject", error);
}
```

### 6. Don't Expose Internal Errors to Users

```typescript
// ✅ Good - Pattern matching provides safe messages
catch (error) {
  return createErrorResponse("operation", error);
  // Returns: "An unexpected database error occurred"
}

// ❌ Bad - Exposes internal details
catch (error) {
  return {
    success: false,
    error: error.stack, // Exposes stack trace
    code: "ERROR",
  };
}
```

### 7. Use Error Codes for Client-Side Logic

```typescript
// ✅ Good
const result = await createProject(data);

if (!result.success) {
  if (result.code === ERROR_CODES.DUPLICATE_RECORD) {
    // Show specific UI for duplicates
    setShowDuplicateWarning(true);
  } else if (result.code === ERROR_CODES.TIMEOUT) {
    // Offer retry option
    setShowRetryButton(true);
  } else {
    // Generic error handling
    toast.error(result.error);
  }
}
```

### 8. Log Errors with Context

```typescript
// ✅ Good
catch (error) {
  logger.error("Migration failed", {
    error,
    migrationId,
    recordsProcessed,
    duration,
    stage: "transform",
  });
  return createErrorResponse("executeMigration", error);
}

// ❌ Bad
catch (error) {
  console.log("Error:", error); // No context
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { describe, expect, it } from "vitest";
import { fetchProject } from "@/lib/actions/projects";
import { ERROR_CODES } from "@/lib/constants/error-codes";

describe("fetchProject Error Handling", () => {
  it("should return validation error for empty ID", async () => {
    const result = await fetchProject("");

    expect(result.success).toBe(false);
    expect(result.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it("should return not found error for non-existent project", async () => {
    const result = await fetchProject("non-existent-id");

    expect(result.success).toBe(false);
    expect(result.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("should handle duplicate record errors", async () => {
    const result = await createProject({ name: "Existing Project" });

    expect(result.success).toBe(false);
    expect(result.code).toBe(ERROR_CODES.DUPLICATE_RECORD);
  });
});
```

## Extending Error Codes

To add new error codes:

1. **Add to ERROR_CODES** in `apps/web/src/lib/constants/error-codes.ts`:
```typescript
export const ERROR_CODES = {
  // ... existing codes
  NEW_ERROR_TYPE: "NEW_ERROR_TYPE",
} as const;
```

2. **Add to ERROR_MESSAGES**:
```typescript
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // ... existing messages
  [ERROR_CODES.NEW_ERROR_TYPE]: "User-friendly message",
};
```

3. **Update pattern matching** in `createErrorResponse` if needed:
```typescript
if (/new error pattern/i.test(errorMessage)) {
  return {
    success: false,
    error: ERROR_MESSAGES[ERROR_CODES.NEW_ERROR_TYPE],
    code: ERROR_CODES.NEW_ERROR_TYPE,
  };
}
```

4. **Update this documentation** with the new error code

## Common Errors and Solutions

### Error: "A record with this information already exists"
**Code**: `DUPLICATE_RECORD`  
**Solution**: Check for existing records before creating. Provide option to update instead.

### Error: "This operation references data that doesn't exist"
**Code**: `INVALID_REFERENCE`  
**Solution**: Verify foreign key relationships. Ensure referenced records exist.

### Error: "Required information is missing"
**Code**: `MISSING_REQUIRED_DATA`  
**Solution**: Check Zod schema. Ensure all required fields are provided.

### Error: "The database operation took too long to complete"
**Code**: `TIMEOUT`  
**Solution**: Optimize query. Add indexes. Consider batch processing.

### Error: "You don't have permission to perform this action"
**Code**: `PERMISSION_DENIED`  
**Solution**: Check user roles and permissions. Verify authentication.

### Error: "Connection failed"
**Code**: `CONNECTION_ERROR`  
**Solution**: Verify `DATABASE_URL`. Check network connectivity. Ensure database is running.

---

**Remember**: Good error handling is essential for production applications. Use pattern matching for consistent error codes, provide user-friendly messages, and log detailed information for debugging.

**Internal Use Only - Integrove**
