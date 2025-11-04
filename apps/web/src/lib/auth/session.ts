import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId: string;
  email: string;
  name: string;
  role: string;
  isLoggedIn: boolean;
};

/**
 * Get session configuration
 */
function getSessionOptions() {
  const sessionPassword = process.env.SESSION_SECRET;
  
  if (!sessionPassword || sessionPassword.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long. " +
      "Generate one with: openssl rand -base64 32"
    );
  }

  return {
    password: sessionPassword,
    cookieName: "databridge_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    },
  };
}

/**
 * Get the current session
 * @returns Session data
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

/**
 * Create a session for a user
 * @param userId - User ID
 * @param email - User email
 * @param name - User name
 * @param role - User role
 */
export async function createSession(
  userId: string,
  email: string,
  name: string,
  role: string
): Promise<void> {
  const session = await getSession();
  
  session.userId = userId;
  session.email = email;
  session.name = name;
  session.role = role;
  session.isLoggedIn = true;
  
  await session.save();
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

/**
 * Check if user is authenticated
 * @returns True if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}

/**
 * Get current user from session
 * @returns User data or null
 */
export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    return null;
  }
  
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    isLoggedIn: session.isLoggedIn,
  };
}

