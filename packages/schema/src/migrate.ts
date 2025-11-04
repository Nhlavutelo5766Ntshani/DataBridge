import { config } from "dotenv";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: resolve(__dirname, "../../../apps/web/.env.local") });

/**
 * Run database migrations
 */
async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("🔄 Connecting to database...");
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log("🔄 Running migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migrations applied successfully");
    await migrationClient.end();
  } catch (error) {
    console.error("❌ Error during migration:", error);
    await migrationClient.end();
    throw error;
  }
}

runMigrations()
  .then(() => {
    console.log("✅ Migrations completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });

