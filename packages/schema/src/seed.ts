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

  console.log("🔄 Connecting to database...");
  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    console.log("🌱 Seeding database...");
    
    await db.delete(schema.users);
    console.log("🗑️  Cleared existing users");
    
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@integrove.com",
        name: "Admin User",
        role: "admin",
      })
      .returning();

    if (adminUser) {
      console.log("✅ Created admin user:", adminUser.email);
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    const [devUser] = await db
      .insert(schema.users)
      .values({
        email: "developer@integrove.com",
        name: "Developer User",
        role: "developer",
      })
      .returning();

    if (devUser) {
      console.log("✅ Created developer user:", devUser.email);
    } else {
      console.log("ℹ️  Developer user already exists");
    }

    console.log("✅ Database seeding completed successfully");
    await client.end();
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    await client.end();
    throw error;
  }
}

seed()
  .then(() => {
    console.log("✅ Seed process completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed process failed:", error);
    process.exit(1);
  });

