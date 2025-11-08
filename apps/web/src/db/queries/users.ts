import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@databridge/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Zod schema for user creation
 */
export const userCreateSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(2),
  passwordHash: z.string().min(60),
  role: z.enum(["admin", "developer"]).default("developer"),
}).omit({ id: true, createdAt: true, updatedAt: true });

/**
 * Get user by email
 * @param email - User email
 * @returns User or undefined
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
}

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User or undefined
 */
export async function getUserById(userId: string): Promise<User | undefined> {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

/**
 * Create a new user
 * @param userData - User data
 * @returns Created user
 */
export async function createUser(userData: NewUser): Promise<User> {
  const [newUser] = await db
    .insert(users)
    .values({ 
      name: userData.name,
      email: userData.email.toLowerCase(), 
      passwordHash: userData.passwordHash,
      role: userData.role || "developer",
      isActive: userData.isActive ?? true
    })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser;
}

/**
 * Update user's last login timestamp
 * @param userId - User ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ updatedAt: new Date() })
    .where(eq(users.id, userId));
}

