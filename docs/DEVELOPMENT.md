# DataBridge Development Guide

## 🎯 Development Workflow

### Starting Development

```bash
# 1. Pull latest changes
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/PBI-123-feature-name
# OR
git checkout -b firstname.lastname/feature-name

# 3. Start development server
yarn dev

# 4. Open in browser
# http://localhost:3000
```

### Making Changes

#### Adding a New Feature

1. **Plan the feature**
   - Review [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Check for existing similar functionality
   - Plan database changes if needed
   - Review cursor rules

2. **Database changes** (if needed)
   - **NEVER edit** `packages/schema/src/schema.ts` directly
   - Follow migration workflow:
     ```bash
     # Make schema changes
     # Edit packages/schema/src/schema.ts
     
     # Generate migration
     yarn db:generate
     
     # Review migration files in packages/schema/migrations/
     
     # Test locally
     yarn db:deploy
     
     # Verify with Drizzle Studio
     yarn db:studio
     ```

3. **Implement three-layer architecture**

   **Layer 1: Schema** (`packages/schema/src/schema.ts`)
   - READ-ONLY - modify only through migrations
   - Drizzle ORM table definitions
   ```typescript
   export const projects = pgTable("mapping_projects", {
     id: uuid("id").defaultRandom().primaryKey(),
     name: text("name").notNull(),
     userId: uuid("user_id").notNull(),
   });
   ```

   **Layer 2: Queries** (`apps/web/src/db/queries/`)
   - Pure database operations
   - No error handling (errors bubble up)
   - Return direct DB types
   - Export Zod schemas
   ```typescript
   /**
    * Get project by ID
    */
   export async function getProjectById(id: string): Promise<Project | null> {
     const project = await db.query.mappingProjects.findFirst({
       where: eq(mappingProjects.id, id),
     });
     return project || null;
   }
   
   // Zod schema for validation
   export const projectCreateSchema = createInsertSchema(mappingProjects);
   ```

   **Layer 3: Actions** (`apps/web/src/lib/actions/`)
   - Server actions with "use server"
   - Comprehensive error handling
   - Zod validation
   - Return `QueryResponse<T>`
   ```typescript
   "use server";
   
   /**
    * Fetch project by ID with error handling
    */
   export async function fetchProject(
     id: string
   ): Promise<QueryResponse<Project | null>> {
     try {
       if (!id) throw new Error("ID required");
       const project = await getProjectById(id);
       return createSuccessResponse(project);
     } catch (error) {
       logger.error("Error fetching project", { error, id });
       return createErrorResponse("fetchProject", error);
     }
   }
   ```

   **Layer 4: Components** (`apps/web/src/app/` or `apps/web/src/components/`)
   ```typescript
   // Server Component (default)
   const ProjectDisplay = async ({ id }: { id: string }) => {
     const result = await fetchProject(id);
     
     if (!result.success) {
       return <div>Error: {result.error}</div>;
     }
     
     return <div>{result.data?.name}</div>;
   };
   
   // Client Component (for interactivity)
   "use client";
   const ProjectForm = () => {
     const [error, setError] = useState("");
     
     const handleSubmit = async (formData: FormData) => {
       const result = await addProject(/* ... */);
       
       if (!result.success) {
         const errorMessage = Array.isArray(result.error)
           ? result.error.join(", ")
           : result.error || "An error occurred";
         setError(errorMessage);
         return;
       }
       
       // Handle success
     };
     
     return <form action={handleSubmit}>...</form>;
   };
   ```

4. **Add tests** (when testing is set up)
   ```bash
   # Unit tests
   __tests__/unit/your-feature.test.ts
   
   # Integration tests
   __tests__/integration/your-feature.test.ts
   
   # Run tests
   yarn test
   ```

5. **Update documentation**
   - Add JSDoc comments to all functions (except React components)
   - Update relevant documentation files
   - Add examples if needed

### Code Standards

#### TypeScript

```typescript
// ✅ Good
type User = {
  id: string;
  name: string;
  email: string;
};

const getUser = async (id: string): Promise<User | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user || null;
};

// ❌ Bad
interface User {  // Use type, not interface
  id: any;  // Never use any
  name: string;
}

const getUser = async (id) => {  // Missing types
  console.log(id);  // No console.log
  return await db.query.users.findFirst();
};
```

#### React Components

```typescript
// ✅ Good - Server Component
const ProjectList = async ({ userId }: { userId: string }) => {
  const result = await fetchUserProjects(userId);
  
  if (!result.success) {
    return <div>Error loading projects</div>;
  }
  
  return (
    <div>
      {result.data?.map((project) => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};

// ✅ Good - Client Component
"use client";
const ProjectForm = ({ onSubmit }: { onSubmit: () => void }) => {
  return <form onSubmit={onSubmit}>{/* ... */}</form>;
};

// ❌ Bad
class ProjectList extends React.Component {  // No classes
  render() {
    return <div>{/* ... */}</div>;
  }
}
```

#### Error Handling

```typescript
// ✅ Good
export async function fetchUser(
  id: string
): Promise<QueryResponse<User | null>> {
  try {
    if (!id) throw new Error("User ID is required");
    
    const user = await getUserById(id);
    return createSuccessResponse(user);
  } catch (error) {
    logger.error("Error fetching user", { error, id });
    return createErrorResponse("fetchUser", error);
  }
}

// ❌ Bad
export async function fetchUser(id: string) {  // Missing return type
  const user = await getUserById(id);  // No error handling
  console.log(user);  // No console.log
  return user;  // Wrong return type
}
```

### Testing

#### Unit Tests

```typescript
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

#### Integration Tests

```typescript
import { describe, expect, it } from "vitest";
import { createConnection, getConnectionById } from "@/db/queries/connections";

describe("Connection Queries", () => {
  it("should create and retrieve connection", async () => {
    const connection = await createConnection({
      name: "Test Connection",
      dbType: "postgresql",
      // ...
    });
    
    const retrieved = await getConnectionById(connection.id);
    expect(retrieved?.id).toBe(connection.id);
  });
});
```

### Git Workflow

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/PBI-123-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add feature description"

# 3. Push to remote
git push -u origin feature/PBI-123-feature-name

# 4. Create Pull Request
# - Target: dev branch
# - Add description
# - Link to PBI/Epic
# - Request review

# 5. After approval, squash merge to dev
# (Done via GitHub UI)

# 6. Clean up local branch
git checkout dev
git pull origin dev
git branch -d feature/PBI-123-feature-name
```

### Database Migrations

```bash
# 1. Edit schema
# Edit packages/schema/src/schema.ts

# 2. Generate migration
yarn db:generate
# Drizzle will prompt for migration name

# 3. Review migration files
# Check packages/schema/migrations/XXXX_migration_name.sql

# 4. Test locally
yarn db:deploy

# 5. Verify changes
yarn db:studio

# 6. Commit migration files
git add packages/schema/
git commit -m "feat: add migration for feature-name"
```

## 🛠️ Common Tasks

### Adding a New Page

```bash
# 1. Create route directory
mkdir -p apps/web/src/app/(dashboard)/your-route

# 2. Create page.tsx
touch apps/web/src/app/(dashboard)/your-route/page.tsx

# 3. Implement page (Server Component by default)
# apps/web/src/app/(dashboard)/your-route/page.tsx
```

Example:
```typescript
// apps/web/src/app/(dashboard)/projects/page.tsx
import { fetchUserProjects } from "@/lib/actions/projects";
import { TEMP_USER_ID } from "@/lib/constants/temp-data";

const ProjectsPage = async () => {
  const result = await fetchUserProjects(TEMP_USER_ID);
  
  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }
  
  return (
    <div>
      <h1>Projects</h1>
      {result.data?.map((project) => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
};

export default ProjectsPage;
```

### Adding a New Component

```bash
# 1. Create component file
touch apps/web/src/components/project-card.tsx

# 2. Implement component
# Use arrow function
# Add types
# Export as named export
```

Example:
```typescript
// apps/web/src/components/project-card.tsx
type ProjectCardProps = {
  id: string;
  name: string;
  description: string;
};

export const ProjectCard = ({ id, name, description }: ProjectCardProps) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{name}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
```

### Adding a New Query

```bash
# 1. Add to queries file
# apps/web/src/db/queries/projects.ts

# 2. Add corresponding action
# apps/web/src/lib/actions/projects.ts

# 3. Use in page/component
```

### Adding a New API Route

```bash
# 1. Create route directory
mkdir -p apps/web/src/app/api/your-endpoint

# 2. Create route.ts
touch apps/web/src/app/api/your-endpoint/route.ts

# 3. Implement handlers (GET, POST, etc.)
```

Example:
```typescript
// apps/web/src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This

```typescript
// 1. Using 'any'
const data: any = await fetch();

// 2. Console.log in production
console.log('Debug info');

// 3. Inline types
const MyComponent = ({ user }: { user: { id: string; name: string } }) => {};

// 4. Missing error handling
const data = await riskyOperation();

// 5. Editing schema files directly without migrations
// Edit packages/schema/src/schema.ts without running db:generate

// 6. Using classes for components
class MyComponent extends React.Component {}

// 7. Hardcoded values
const API_URL = 'http://localhost:3000';

// 8. Not using QueryResponse
return { error: "Failed" };  // Use QueryResponse<T>

// 9. Error handling in query layer
export async function getProject(id: string) {
  try {  // ❌ No try/catch in queries
    return await db.query.projects.findFirst();
  } catch (error) {
    return null;
  }
}

// 10. Using console.log instead of logger
console.error("Error:", error);  // ❌ Use logger.error
```

### ✅ Do This Instead

```typescript
// 1. Explicit types
type User = { id: string; name: string };
const data: User = await fetchUser();

// 2. Use logger
logger.info('Debug info', { context });

// 3. Separate types
type User = { id: string; name: string };
const MyComponent = ({ user }: { user: User }) => {};

// 4. Always handle errors (in actions)
try {
  const data = await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error });
  return createErrorResponse('operation', error);
}

// 5. Use migrations
// Edit schema → yarn db:generate → yarn db:deploy

// 6. Use arrow functions
const MyComponent = ({ prop }: { prop: string }) => {};

// 7. Use environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 8. Use QueryResponse<T>
return createSuccessResponse(data);
// OR
return { success: false, error: "Failed" };

// 9. No error handling in query layer
export async function getProject(id: string): Promise<Project | null> {
  const project = await db.query.projects.findFirst();
  return project || null;
}

// 10. Use logger utility
logger.error("Error occurred", { error, context });
```

## 📊 Development Tools

### Drizzle Studio

Visual database browser:

```bash
yarn db:studio
# Opens on http://localhost:4983
```

Features:
- Browse all tables
- View data
- Execute queries
- Visualize relationships

### Environment Variables

```env
# apps/web/.env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/databridge"

# Redis (for BullMQ job queue)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Session
SESSION_SECRET="your-32-char-secret-key-here"

# Vercel Cron (for scheduled migrations)
CRON_SECRET="your-cron-secret-here"

# SAP Object Store (optional, for attachment migration)
SAP_OBJECT_STORE_URL="https://your-sap-url"
SAP_OBJECT_STORE_API_KEY="your-api-key"
```

## 🔍 Debugging

### Server-Side Debugging

1. **Use logger utility**:
   ```typescript
   logger.info("Processing migration", { migrationId, records: 1000 });
   logger.error("Migration failed", { error, migrationId });
   ```

2. **Check terminal output** - All server logs appear in the terminal where `yarn dev` is running

3. **Use Drizzle Studio** to inspect database state

### Client-Side Debugging

1. **Browser DevTools Console**
2. **React DevTools** extension
3. **Network tab** for API calls

### Common Issues

**Issue**: "Database connection failed"
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL
echo $DATABASE_URL
```

**Issue**: "Module not found"
```bash
# Clear and reinstall
rm -rf node_modules
yarn install
```

**Issue**: "Build fails"
```bash
# Check for TypeScript errors
yarn typecheck

# Check for linting errors
yarn lint
```

## 📚 Resources

### Internal Documentation
- [Architecture](./ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Setup Guide](./SETUP.md)
- [Git Setup](./GIT_SETUP.md)

### External Resources
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Getting Help

1. Check documentation first
2. Review similar existing code
3. Search for error messages in GitHub issues
4. Ask team members in Slack/Teams
5. Create detailed issue with:
   - What you're trying to do
   - What you've tried
   - Error messages
   - Steps to reproduce

---

**Happy Coding! 🚀**

_Internal Use Only - Integrove_
