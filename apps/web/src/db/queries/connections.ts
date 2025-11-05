import { db } from "@/db";
import { connections } from "@databridge/schema";
import { and, desc, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export const connectionCreateSchema = createInsertSchema(connections);

/**
 * Get connection by ID
 * @param connectionId - Connection ID
 * @returns The connection data or null if not found
 */
export async function getConnectionById(
  connectionId: string
): Promise<Connection | null> {
  const connection = await db.query.connections.findFirst({
    where: eq(connections.id, connectionId),
  });

  return connection || null;
}

/**
 * Get all connections for a user
 * @param userId - User ID
 * @returns Array of connections
 */
export async function getUserConnections(
  userId: string
): Promise<Connection[]> {
  const userConnections = await db.query.connections.findMany({
    where: and(eq(connections.userId, userId), eq(connections.isActive, true)),
    orderBy: [desc(connections.createdAt)],
  });

  return userConnections;
}

/**
 * Create a new connection
 * @param connectionData - The connection data
 * @returns The created connection
 */
export async function createConnection(
  connectionData: NewConnection
): Promise<Connection> {
  const rest = { ...connectionData };
  delete rest.id;
  const [newConnection] = await db.insert(connections).values(rest).returning();

  if (!newConnection) {
    throw new Error("Failed to create connection");
  }

  return newConnection;
}

/**
 * Update a connection
 * @param connectionId - Connection ID
 * @param connectionData - Connection data to update
 * @returns The updated connection
 */
export async function updateConnection(
  connectionId: string,
  connectionData: Partial<NewConnection>
): Promise<Connection> {
  const rest = { ...connectionData };
  delete rest.id;
  const [updatedConnection] = await db
    .update(connections)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(connections.id, connectionId))
    .returning();

  if (!updatedConnection) {
    throw new Error("Connection not found or could not be updated");
  }

  return updatedConnection;
}

/**
 * Delete a connection (soft delete)
 * @param connectionId - Connection ID
 * @returns The deleted connection
 */
export async function deleteConnection(
  connectionId: string
): Promise<Connection> {
  const [deletedConnection] = await db
    .update(connections)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(connections.id, connectionId))
    .returning();

  if (!deletedConnection) {
    throw new Error("Connection not found or could not be deleted");
  }

  return deletedConnection;
}

