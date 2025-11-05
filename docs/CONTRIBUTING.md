# Contributing to DataBridge

Thank you for your interest in contributing to DataBridge! This document provides guidelines and best practices for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This is an internal Integrove project. Please maintain professionalism and respect for all team members.

## Getting Started

### Prerequisites

- Node.js v21+
- Yarn 4.9.1+
- PostgreSQL 14+
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/integrove/DataBridge.git
cd DataBridge

# Install dependencies
yarn

# Set up environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your database credentials

# Run migrations
yarn db:deploy

# Start development server
yarn dev
```

## Development Workflow

### Branch Strategy

```
main (production)
  ↑
dev (development)
  ↑
feature/* or firstname.lastname/* (feature branches)
```

### Creating a Feature Branch

```bash
# Start from dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/PBI-123-add-feature-name
# OR
git checkout -b firstname.lastname/add-feature-name

# Make changes
git add .
git commit -m "feat: add feature description"

# Push to remote
git push -u origin feature/PBI-123-add-feature-name
```

### Making Changes

1. **Read the docs** - Review [ARCHITECTURE.md](./ARCHITECTURE.md) and [DEVELOPMENT.md](./DEVELOPMENT.md)
2. **Plan your changes** - Understand the three-layer architecture
3. **Check for existing code** - Don't duplicate functionality
4. **Write tests** - Add unit/integration tests
5. **Update documentation** - Keep docs in sync with code

## Code Standards

### TypeScript

✅ **DO**:
```typescript
// Use types, not interfaces
type User = {
  id: string;
  name: string;
  email: string;
};

// Explicit return types
const getUser = async (id: string): Promise<User | null> => {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
};

// No any type
type QueryResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

❌ **DON'T**:
```typescript
// Don't use interfaces
interface User {
  id: string;
}

// Don't use any
const data: any = await fetchData();

// Don't omit return types
const getUser = async (id: string) => {
  return await db.query.users.findFirst();
};
```

### React Components

✅ **DO**:
```typescript
// Server Component (default)
const ProjectList = async ({ userId }: { userId: string }) => {
  const projects = await fetchUserProjects(userId);
  return <div>{/* ... */}</div>;
};

// Client Component (when needed)
"use client";
const InteractiveForm = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
  return <form action={onSubmit}>{/* ... */}</form>;
};

// Arrow functions for components
export const MyComponent = ({ prop }: { prop: string }) => {
  return <div>{prop}</div>;
};
```

❌ **DON'T**:
```typescript
// Don't use classes
class MyComponent extends React.Component {
  render() {
    return <div>...</div>;
  }
}

// Don't use inline prop types
const MyComponent = ({ user }: { user: { id: string; name: string } }) => {
  // Extract to separate type definition
};
```

### Three-Layer Architecture

#### Layer 1: Schema (READ-ONLY)
```typescript
// packages/schema/src/schema.ts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});
```

**Rules**:
- Only modify through migrations: `yarn db:generate` then `yarn db:migrate`
- Never edit migration files manually
- Keep schema files minimal (no business logic)

#### Layer 2: Queries
```typescript
// apps/web/src/db/queries/users.ts

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  return user || null;
}
```

**Rules**:
- Pure database operations only
- No error handling (let errors bubble up)
- Return direct database types
- Add JSDoc comments
- Export Zod schemas for validation

#### Layer 3: Actions
```typescript
// apps/web/src/lib/actions/users.ts
"use server";

/**
 * Fetch user by email with error handling
 */
export async function fetchUserByEmail(
  email: string
): Promise<QueryResponse<User | null>> {
  try {
    if (!email) throw new Error("Email is required");
    const user = await getUserByEmail(email);
    return createSuccessResponse(user);
  } catch (error) {
    logger.error("Error fetching user", error);
    return createErrorResponse("fetchUserByEmail", error);
  }
}
```

**Rules**:
- Add `"use server"` directive
- Comprehensive error handling with try/catch
- Use Zod for input validation
- Return `QueryResponse<T>`
- Add JSDoc comments
- Use logger utility (no console.log)

### Error Handling

✅ **DO**:
```typescript
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { ERROR_CODES } from "@/lib/constants/error-codes";

export async function addProject(data: NewProject): Promise<QueryResponse<Project>> {
  try {
    // Validate input
    const validatedData = projectCreateSchema.parse(data);
    
    // Perform operation
    const project = await createProject(validatedData);
    
    // Return success
    return createSuccessResponse(project);
  } catch (error) {
    // Log error
    logger.error("Error creating project", { error, data });
    
    // Return standardized error
    return createErrorResponse("addProject", error);
  }
}
```

❌ **DON'T**:
```typescript
// Don't use console.log
console.log("Error:", error);

// Don't throw errors without handling
const project = await createProject(data); // No try/catch

// Don't return inconsistent error formats
return { error: "Something went wrong" }; // Use QueryResponse<T>
```

### File Organization

```typescript
// Component structure
import { ComponentA } from "./component-a";
import { ComponentB } from "./component-b";

type Props = {
  id: string;
  name: string;
};

export const MainComponent = ({ id, name }: Props) => {
  // Component logic
  return <div>...</div>;
};

// Helper functions (if needed)
function helperFunction() {
  // ...
}

// Static content
const CONSTANTS = {
  // ...
};
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`, `project-list.tsx`)
- **Directories**: kebab-case (`mapping-wizard/`, `pipeline-executor/`)
- **Components**: PascalCase (`UserProfile`, `ProjectList`)
- **Functions**: camelCase (`getUserById`, `createProject`)
- **Types**: PascalCase (`User`, `Project`, `QueryResponse`)
- **Constants**: UPPER_SNAKE_CASE (`ERROR_CODES`, `API_URL`)

### JSDoc Comments

✅ **DO**:
```typescript
/**
 * Creates a new mapping project with source and target connections
 * @param data - Project creation data
 * @returns Promise resolving to created project
 */
export async function createProject(data: NewProject): Promise<Project> {
  // ...
}
```

❌ **DON'T**:
```typescript
// Don't add JSDoc to React components
/**
 * User profile component  // ❌ Not needed
 */
export const UserProfile = () => {
  // ...
};

// Don't add redundant comments
const id = user.id; // Get the user ID  // ❌ Obvious

// Don't use inline comments
const data = fetchData(); // Fetches data from API  // ❌ Use JSDoc instead
```

## Testing

### Unit Tests

```typescript
// __tests__/unit/utils/validators.test.ts
import { describe, expect, it } from "vitest";
import { validateEmail } from "@/lib/utils/validators";

describe("Email Validation", () => {
  it("should validate correct email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("should reject invalid email", () => {
    expect(validateEmail("invalid")).toBe(false);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/api/projects.test.ts
import { describe, expect, it } from "vitest";
import { createProject, getProjectById } from "@/db/queries/projects";

describe("Project Queries", () => {
  it("should create and retrieve project", async () => {
    const project = await createProject({
      name: "Test Project",
      userId: "user-id",
      // ...
    });

    const retrieved = await getProjectById(project.id);
    expect(retrieved?.id).toBe(project.id);
  });
});
```

## Pull Request Process

### Before Submitting

1. ✅ Code follows style guidelines
2. ✅ All tests pass (`yarn test`)
3. ✅ No linting errors (`yarn lint`)
4. ✅ Type checking passes (`yarn typecheck`)
5. ✅ Build succeeds (`yarn build`)
6. ✅ Documentation updated
7. ✅ No console.logs or debugging code

### PR Template

```markdown
## Description
Brief description of changes

## Related PBI/Issue
PBI-123: Feature Name

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests added/updated
- [x] Integration tests added/updated
- [x] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Documentation updated
- [x] No console.logs or debugging code
- [x] Tests pass
- [x] Build succeeds
```

### Review Process

1. Create PR targeting `dev` branch
2. Request review from at least 1 team member
3. Address review comments
4. Ensure CI/CD passes
5. Squash merge when approved

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks (dependencies, build config)

### Examples

```bash
# Feature
git commit -m "feat(pipelines): add multi-pipeline support"

# Bug fix
git commit -m "fix(mapping): resolve column mapping validation error"

# Documentation
git commit -m "docs(architecture): update system architecture diagram"

# Refactor
git commit -m "refactor(queries): simplify user query functions"

# Breaking change
git commit -m "feat(auth)!: migrate to iron-session

BREAKING CHANGE: NextAuth.js replaced with iron-session"
```

## Common Mistakes to Avoid

### ❌ DON'T

1. **Edit schema files directly** - Use migrations
2. **Use `console.log`** - Use logger utility
3. **Use `any` type** - Define explicit types
4. **Skip error handling in actions** - Always wrap in try/catch
5. **Hardcode values** - Use constants or environment variables
6. **Create classes for React components** - Use arrow functions
7. **Skip JSDoc comments** - Document all functions
8. **Commit directly to `dev` or `main`** - Use feature branches
9. **Force push** - Only use when absolutely necessary and coordinated
10. **Skip tests** - Write tests for new features

## Questions?

1. Check existing documentation
2. Review similar code in the codebase
3. Ask team members in Slack/Teams
4. Create an issue for discussion

---

**Remember**: Quality over speed. Take time to write clean, tested, documented code.

**Internal Use Only - Integrove**

