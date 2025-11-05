import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth/session";

/**
 * Public paths that don't require authentication
 */
const publicPaths = ["/", "/login", "/signup"];

/**
 * Auth paths that authenticated users shouldn't access
 */
const authPaths = ["/login", "/signup"];

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
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    },
  };
}

/**
 * Middleware to protect routes
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = publicPaths.includes(path);
  const isAuthPath = authPaths.includes(path);

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions()
  );

  const isLoggedIn = session.isLoggedIn === true;

  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

