/**
 * Password Reset Utility
 * Run with: npx tsx scripts/reset-password.ts <email> <new-password>
 */

import { db } from "../apps/web/src/db";
import { users } from "@databridge/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`🔍 Looking for user: ${email}`);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log("\n📋 Available users:");
      const allUsers = await db.select({
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      }).from(users);
      console.table(allUsers);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`🔐 Hashing new password...`);
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    console.log(`✅ Password reset successful!`);
    console.log(`\n📧 Email: ${user.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`\nYou can now log in with these credentials.`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>");
  console.error("Example: npx tsx scripts/reset-password.ts user@example.com MyNewPass123");
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("❌ Password must be at least 8 characters long");
  process.exit(1);
}

resetPassword(email, newPassword);

