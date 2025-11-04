# DataBridge Development Guide

## 🎯 Development Workflow

### Starting Development

```bash
# 1. Pull latest changes
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b firstname.lastname/feature-name

# 3. Start development server
yarn dev

# 4. Open in browser
# http://localhost:3000
```

### Making Changes

#### Adding a New Feature

1. **Plan the feature**

   - Review existing architecture
   - Check for existing similar functionality
   - Plan database changes if needed

2. **Database changes** (if needed)

   - Edit `packages/schema/src/schema.ts`
   - Generate migration: `yarn db:generate`
   - Review migration files
   - Deploy locally: `yarn db:deploy`

3. **Implement three-layer architecture**

   **Layer 1: Queries** (`apps/web/src/db/queries/`)

   ```typescript
   // Pure database operations
   // No error handling
   // Return direct DB types
   export async function getItemById(id: string): Promise<Item | null> {
     const item = await db.query.items.findFirst({
       where: eq(items.id, id),
     });
     return item || null;
   }
   ```

   **Layer 2: Actions** (`apps/web/src/lib/actions/`)

   ```typescript
   "use server";

   // Error handling
   // Validation
   // Return QueryResponse<T>
   export async function fetchItem(
     id: string
   ): Promise<QueryResponse<Item | null>> {
     try {
       if (!id) throw new Error("ID required");
       const item = await getItemById(id);
       return createSuccessResponse(item);
     } catch (error) {
       logger.error("Error fetching item", error);
       return createErrorResponse("fetchItem", error);
     }
   }
   ```

   **Layer 3: Components** (`apps/web/src/components/`)

   ```typescript
   // Server Component
   const ItemDisplay = async ({ id }: { id: string }) => {
     const result = await fetchItem(id);
     if (!result.success) return <div>Error: {result.error}</div>;
     return <div>{result.data?.name}</div>;
   };

   // Client Component
   ("use client");
   const ItemForm = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
     return <form action={onSubmit}>...</form>;
   };
   ```

4. **Add tests**

   ```bash
   # Unit tests
   __tests__/unit/your-feature.test.ts

   # Integration tests
   __tests__/integration/your-feature.test.ts

   # Run tests
   yarn test
   ```

5. **Update documentation**
   - Add JSDoc comments
   - Update relevant docs
   - Add examples if needed

### Code Standards

#### TypeScript

```typescript
// ✅ Good
type User = {
  id: string;
  name: string;
};

const getUser = async (id: string): Promise<User | null> => {
  // ...
};

// ❌ Bad
interface User {
  // Use type, not interface
  id: any; // Never use any
  name: string;
}

const getUser = async (id) => {
  // Missing types
  console.log(id); // No console.log
  // ...
};
```

#### Components

```typescript
// ✅ Good - Server Component
const UserList = async ({ limit }: { limit: number }) => {
  const users = await fetchUsers(limit);
  return <div>{/* ... */}</div>;
};

// ✅ Good - Client Component
("use client");
const UserForm = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
  return <form>{/* ... */}</form>;
};

// ❌ Bad
class UserList extends React.Component {
  // No classes
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
    logger.error("Error fetching user", error);
    return createErrorResponse("fetchUser", error);
  }
}

// ❌ Bad
export async function fetchUser(id: string) {
  // Missing return type
  const user = await getUserById(id); // No error handling
  console.log(user); // No console.log
  return user; // Wrong return type
}
```

### Testing

#### Unit Tests

```typescript
import { describe, expect, it } from "vitest";
import { validateMapping } from "@/lib/utils/validators";

describe("Mapping Validation", () => {
  it("should validate compatible types", () => {
    const result = validateMapping({
      sourceType: "varchar",
      targetType: "text",
    });
    expect(result.isValid).toBe(true);
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
      // ...
    });

    const retrieved = await getConnectionById(connection.id);
    expect(retrieved?.id).toBe(connection.id);
  });
});
```

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b firstname.lastname/feature-name

# 2. Make changes and commit
git add .
git commit -m "Add feature description"

# 3. Push to remote
git push -u origin firstname.lastname/feature-name

# 4. Create Pull Request
# - Target: dev branch
# - Add description
# - Link to PBI/Epic
# - Request review

# 5. After approval, squash merge to dev
```

### Database Migrations

```bash
# 1. Edit schema
# Edit packages/schema/src/schema.ts

# 2. Generate migration
yarn db:generate

# 3. Review migration files
# Check packages/schema/migrations/

# 4. Test locally
yarn db:deploy

# 5. Verify changes
yarn db:studio

# 6. Commit migration files
git add packages/schema/migrations/
git commit -m "Add migration for feature-name"
```

## 🛠️ Common Tasks

### Adding a New Page

```bash
# 1. Create route directory
mkdir -p apps/web/src/app/your-route

# 2. Create page.tsx
touch apps/web/src/app/your-route/page.tsx

# 3. Implement page
# apps/web/src/app/your-route/page.tsx
```

### Adding a New Component

```bash
# 1. Create component file
touch apps/web/src/components/your-component.tsx

# 2. Implement component
# Use arrow function
# Add types
# Export as named export
```

### Adding a New Query

```bash
# 1. Add to queries file
# apps/web/src/db/queries/your-entity.ts

# 2. Add corresponding action
# apps/web/src/lib/actions/your-entity.ts

# 3. Test both layers
# __tests__/unit/queries/your-entity.test.ts
# __tests__/unit/actions/your-entity.test.ts
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This

```typescript
// 1. Using 'any'
const data: any = await fetch();  // ❌

// 2. Console.log in production
console.log('Debug info');  // ❌

// 3. Inline types
const MyComponent = ({ user }: { user: { id: string; name: string } }) => {  // ❌

// 4. Missing error handling
const data = await riskyOperation();  // ❌

// 5. Editing schema files directly without migrations
// Edit packages/schema/src/schema.ts without running db:generate  // ❌

// 6. Using classes for components
class MyComponent extends React.Component {  // ❌

// 7. Hardcoded values
const API_URL = 'http://localhost:3000';  // ❌
```

### ✅ Do This Instead

```typescript
// 1. Explicit types
type FetchResult = {
  data: string;
  error: null;
} | {
  data: null;
  error: string;
};
const data: FetchResult = await fetch();  // ✅

// 2. Use logger
logger.info('Debug info', { context });  // ✅

// 3. Separate types
type User = {
  id: string;
  name: string;
};
const MyComponent = ({ user }: { user: User }) => {  // ✅

// 4. Always handle errors
try {
  const data = await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  return createErrorResponse('operation', error);
}  // ✅

// 5. Use migrations
// Edit schema → yarn db:generate → yarn db:deploy  // ✅

// 6. Use arrow functions
const MyComponent = ({ prop }: { prop: string }) => {  // ✅

// 7. Use constants
const API_URL = process.env.NEXT_PUBLIC_API_URL;  // ✅
```

## 📚 Resources

### Documentation

- [Setup Guide](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Cursor Rules](./.cursorrules)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Flow Documentation](https://reactflow.dev/)

## 🆘 Getting Help

1. Check documentation first
2. Review similar existing code
3. Search for error messages
4. Ask team members
5. Create detailed issue with:
   - What you're trying to do
   - What you've tried
   - Error messages
   - Steps to reproduce

---

**Happy Coding!** 🚀

_Internal Use Only - Integrove_
