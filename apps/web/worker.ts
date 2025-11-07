#!/usr/bin/env tsx

import { config } from "dotenv";
import { join } from "path";

// Load environment variables FIRST
const envPath = join(__dirname, ".env.local");
const result = config({ path: envPath });

if (result.error) {
  console.error("❌ Failed to load .env.local:", result.error);
  console.error("Looking for env file at:", envPath);
  process.exit(1);
}

console.log("\n" + "=".repeat(60));
console.log("🚀 DataBridge ETL Worker");
console.log("=".repeat(60));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🔧 Node version: ${process.version}`);
console.log(`📂 Working directory: ${process.cwd()}`);
console.log(`📄 Env file: ${envPath}`);
console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? "Set" : "Missing"}`);
console.log(`✅ REDIS_URL: ${process.env.REDIS_URL ? "Set" : "Missing"}`);
console.log("=".repeat(60) + "\n");

// Use dynamic imports AFTER env vars are loaded
async function startWorker() {
  const { initializeWorker } = await import("./src/lib/queue/etl-worker");
  const { logger } = await import("./src/lib/utils/logger");

  logger.info("⚙️ [STARTUP] Initializing ETL Worker...");

  initializeWorker();

  logger.success("✅ [STARTUP] ETL Worker is running and waiting for jobs!");
  logger.info("💡 [STARTUP] Press Ctrl+C to stop the worker\n");
}

startWorker().catch((error) => {
  console.error("❌ Failed to start worker:", error);
  process.exit(1);
});

