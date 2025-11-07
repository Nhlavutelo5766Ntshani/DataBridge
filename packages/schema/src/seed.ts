import { config } from "dotenv";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

config({ path: resolve(__dirname, "../../../apps/web/.env.local") });

/**
 * Seed the database with initial data
 */
async function seed() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    await db.delete(schema.users);
    
    await db
      .insert(schema.users)
      .values({
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@integrove.com",
        name: "Admin User",
        role: "admin",
        passwordHash: "$2b$10$om3w2JTKlRoY37RuR72quOjJXSZvwTWjzfRu3CEUnWVtk6VIwgPoC",
      })
      .returning();

    await db
      .insert(schema.users)
      .values({
        email: "developer@integrove.com",
        name: "Developer User",
        role: "developer",
        passwordHash: "$2b$10$om3w2JTKlRoY37RuR72quOjJXSZvwTWjzfRu3CEUnWVtk6VIwgPoC",
      })
      .returning();

    await client.end();
  } catch (error) {
    await client.end();
    throw error;
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });

