# Error Handling Guide

## Overview

DataBridge uses a standardized error handling approach across all layers of the application. This guide explains the error handling patterns, utilities, and best practices.

## Error Response Format

All server actions return a consistent `QueryResponse<T>` type:

```typescript
type QueryResponse<T> = {
  success: true;
  data: T;
  error?: never;
} | {
  success: false;
  data?: never;
  error: string | string[];
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
  error: "Project not found"
}
```

### Multiple Errors

```typescript
{
  success: false,
  error: [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

## Error Utilities

### Creating Success Responses

```typescript
import { createSuccessResponse } from "@/lib/utils/errors";

export async function fetchProject(id: string): Promise<QueryResponse<Project | null>> {
  try {
    const project = await getProjectById(id);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("fetchProject", error);
  }
}
```

### Creating Error Responses

```typescript
import { createErrorResponse } from "@/lib/utils/errors";

export async function addProject(data: NewProject): Promise<QueryResponse<Project>> {
  try {
    const project = await createProject(data);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("addProject", error);
  }
}
```

## Error Codes

Centralized error codes are defined in `apps/web/src/lib/constants/error-codes.ts`:

```typescript
export const ERROR_CODES = {
  DB_ERROR: "DB_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.DB_ERROR]: "Database operation failed",
  [ERROR_CODES.VALIDATION_ERROR]: "Validation failed",
  [ERROR_CODES.CONNECTION_ERROR]: "Connection failed",
  [ERROR_CODES.AUTH_ERROR]: "Authentication failed",
  [ERROR_CODES.NOT_FOUND]: "Resource not found",
  [ERROR_CODES.SERVER_ERROR]: "Internal server error",
  [ERROR_CODES.UNKNOWN]: "An unknown error occurred",
};
```

### Using Error Codes

```typescript
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/constants/error-codes";

if (!user) {
  return {
    success: false,
    error: ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
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
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const project = await db.query.mappingProjects.findFirst({
    where: eq(mappingProjects.id, id),
  });
  return project || null;
}

// No try/catch - errors bubble up
```

### Layer 3: Actions Layer (Comprehensive Error Handling)

Actions layer functions implement comprehensive error handling:

```typescript
// apps/web/src/lib/actions/projects.ts
"use server";

import { logger } from "@/lib/utils/logger";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { getProjectById } from "@/db/queries/projects";

/**
 * Fetch project by ID with error handling
 */
export async function fetchProject(
  id: string
): Promise<QueryResponse<Project | null>> {
  try {
    // Validate input
    if (!id) {
      throw new Error("Project ID is required");
    }

    // Call query layer
    const project = await getProjectById(id);

    // Return success
    return createSuccessResponse(project);
  } catch (error) {
    // Log error with context
    logger.error("Error fetching project", { error, id });

    // Return standardized error
    return createErrorResponse("fetchProject", error);
  }
}
```

## Validation Errors

### Using Zod for Validation

```typescript
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { mappingProjects } from "@databridge/schema";

// Create Zod schema from Drizzle schema
export const projectCreateSchema = createInsertSchema(mappingProjects, {
  name: z.string().min(1, "Project name is required"),
  userId: z.string().uuid("Invalid user ID"),
});

// Use in action
export async function addProject(
  data: z.infer<typeof projectCreateSchema>
): Promise<QueryResponse<Project>> {
  try {
    // Validate input
    const validatedData = projectCreateSchema.parse(data);

    // Create project
    const project = await createProject(validatedData);

    return createSuccessResponse(project);
  } catch (error) {
    // Zod errors are automatically caught
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message),
      };
    }

    logger.error("Error adding project", { error, data });
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
  };
}
```

## Form Data Validation

### Using parseFormData Utility

```typescript
import { parseFormData } from "@/lib/utils/validators";

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
      };
    }

    logger.error("Error creating connection", { error });
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
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, metadata);
    }
  },
};
```

## Client-Side Error Handling

### Using React Error Boundaries (Future)

```typescript
"use client";

import { Component, ReactNode } from "react";

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

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-destructive rounded-lg">
          <h2 className="text-lg font-semibold text-destructive">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Handling Action Errors in Components

```typescript
"use client";

import { useState } from "react";
import { addProject } from "@/lib/actions/projects";

export const ProjectForm = () => {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");

    const result = await addProject({
      name: formData.get("name") as string,
      userId: formData.get("userId") as string,
      // ...
    });

    if (!result.success) {
      // Handle error
      const errorMessage = Array.isArray(result.error)
        ? result.error.join(", ")
        : result.error || "An error occurred";
      setError(errorMessage);
      setLoading(false);
      return;
    }

    // Handle success
    setLoading(false);
    // Redirect or show success message
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

## Database Error Handling

### Connection Errors

```typescript
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
    logger.error("Connection test failed", {
      error,
      connectionId: connection.id,
      dbType: connection.dbType,
    });

    return {
      success: false,
      error: `Failed to connect to ${connection.dbType}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
```

### Query Errors

```typescript
export async function executeMigration(
  migrationId: string
): Promise<QueryResponse<MigrationExecution>> {
  try {
    const migration = await getMigrationById(migrationId);

    if (!migration) {
      return {
        success: false,
        error: ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
      };
    }

    // Execute migration logic
    const result = await performMigration(migration);

    return createSuccessResponse(result);
  } catch (error) {
    logger.error("Migration execution failed", {
      error,
      migrationId,
    });

    return createErrorResponse("executeMigration", error);
  }
}
```

## API Route Error Handling

### Next.js API Routes

```typescript
// apps/web/src/app/api/pipelines/[id]/execute/route.ts

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Pipeline ID is required" },
        { status: 400 }
      );
    }

    // Execute pipeline
    const result = await executePipeline(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("API error", { error, endpoint: "/api/pipelines/[id]/execute" });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
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

// Success
toast.success("Project created successfully");

// Error
toast.error("Failed to create project");

// With description
toast.error("Failed to create project", {
  description: "Please check your input and try again",
});
```

### Alert Components

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to load project. Please try again.
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
    logger.error("Error adding project", { error, data });
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
      throw new Error("Project ID is required");
    }

    const project = await getProjectById(id);
    return createSuccessResponse(project);
  } catch (error) {
    return createErrorResponse("fetchProject", error);
  }
}
```

### 3. Log Errors with Context

```typescript
// ✅ Good
logger.error("Migration failed", {
  error,
  migrationId,
  recordsProcessed,
  duration,
});

// ❌ Bad
console.log("Error:", error);
```

### 4. Return Consistent Response Types

```typescript
// ✅ Good - Always return QueryResponse<T>
export async function addProject(data: NewProject): Promise<QueryResponse<Project>> {
  // ...
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
  // ...
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map((e) => e.message),
    };
  }

  return createErrorResponse("action", error);
}
```

### 6. Don't Expose Internal Errors to Users

```typescript
// ✅ Good
catch (error) {
  logger.error("Database connection failed", { error, details });
  return {
    success: false,
    error: "Failed to connect to database. Please check your credentials.",
  };
}

// ❌ Bad
catch (error) {
  return {
    success: false,
    error: error.stack, // Exposes internal details
  };
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { describe, expect, it } from "vitest";
import { fetchProject } from "@/lib/actions/projects";

describe("fetchProject Error Handling", () => {
  it("should return error for invalid ID", async () => {
    const result = await fetchProject("");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return error for non-existent project", async () => {
    const result = await fetchProject("non-existent-id");

    expect(result.success).toBe(false);
  });
});
```

## Common Errors and Solutions

### Error: "Database connection failed"
**Solution**: Check `DATABASE_URL` in `.env.local` and ensure PostgreSQL is running.

### Error: "Validation failed"
**Solution**: Review Zod schema and ensure input data matches expected format.

### Error: "Resource not found"
**Solution**: Verify the resource ID exists in the database.

### Error: "Authentication failed"
**Solution**: Check session management and ensure user is logged in.

---

**Remember**: Good error handling is essential for production applications. Always handle errors gracefully and provide helpful feedback to users.

**Internal Use Only - Integrove**

