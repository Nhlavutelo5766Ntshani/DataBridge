"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { QueryResponse } from "@/db/types/queries";
import { createClient } from "@/lib/auth/supabase-server";
import { PATHS } from "@/lib/constants/paths";
import { createErrorResponse } from "@/lib/utils/errors";
import { ERROR_CODES } from "@/lib/constants/error-codes";
import { createUser, getUserByEmail } from "@/db/queries/users";
import type { SessionData } from "@/lib/auth/session";

/**
 * Signup form schema
 */
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Login form schema
 */
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Sign up a new user using Supabase Auth
 * @param formData - Signup form data
 * @returns Success response or error
 */
export async function signupAction(
  formData: FormData
): Promise<QueryResponse<{ userId: string }>> {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validatedData = signupSchema.parse(rawData);
    
    let supabase;
    try {
      supabase = await createClient();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing Supabase")) {
        return createErrorResponse(
          "Server configuration error. Please contact support.",
          ERROR_CODES.SERVER_ERROR
        );
      }
      throw error;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
        },
      },
    });

    if (authError) {
      console.error("Supabase signup error:", authError);
      return createErrorResponse(
        authError.message || "Failed to create account",
        ERROR_CODES.AUTH_ERROR
      );
    }

    if (!authData.user) {
      return createErrorResponse(
        "Failed to create account",
        ERROR_CODES.AUTH_ERROR
      );
    }

    try {
      const existingUser = await getUserByEmail(validatedData.email);
      if (!existingUser) {
        await createUser({
          id: authData.user.id,
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          passwordHash: "",
          role: "developer",
          isActive: true,
        });
      }
    } catch (dbError) {
      console.error("Database error during user creation:", dbError);
      throw dbError;
    }

    return {
      success: true,
      data: { userId: authData.user.id },
    };
  } catch (error) {
    console.error("Signup action error:", error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        error.errors[0].message,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED") || error.message.includes("connect")) {
        return createErrorResponse(
          "Unable to connect. Please try again later.",
          ERROR_CODES.CONNECTION_FAILED
        );
      }
      
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return createErrorResponse(
          "An account with this email already exists",
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return createErrorResponse(
          "Database setup incomplete. Please contact support.",
          ERROR_CODES.DB_ERROR
        );
      }
    }

    return createErrorResponse(
      "Unable to create account. Please try again.",
      ERROR_CODES.AUTH_ERROR
    );
  }
}

/**
 * Log in a user using Supabase Auth
 * @param formData - Login form data
 * @returns Success response or error
 */
export async function loginAction(
  formData: FormData
): Promise<QueryResponse<{ userId: string }>> {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validatedData = loginSchema.parse(rawData);
    
    let supabase;
    try {
      supabase = await createClient();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing Supabase")) {
        return createErrorResponse(
          "Server configuration error. Please contact support.",
          ERROR_CODES.SERVER_ERROR
        );
      }
      throw error;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      return createErrorResponse(
        "Invalid email or password",
        ERROR_CODES.AUTH_ERROR
      );
    }

    if (!authData.user) {
      return createErrorResponse(
        "Invalid email or password",
        ERROR_CODES.AUTH_ERROR
      );
    }

    const user = await getUserByEmail(validatedData.email);
    if (user && !user.isActive) {
      return createErrorResponse(
        "Your account has been deactivated",
        ERROR_CODES.AUTH_ERROR
      );
    }

    return {
      success: true,
      data: { userId: authData.user.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        error.errors[0].message,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED") || error.message.includes("connect")) {
        return createErrorResponse(
          "Unable to connect. Please try again later.",
          ERROR_CODES.CONNECTION_FAILED
        );
      }
      
      if (error.message.includes("password") || error.message.includes("authentication")) {
        return createErrorResponse(
          "Invalid email or password",
          ERROR_CODES.AUTH_ERROR
        );
      }
    }

    return createErrorResponse(
      "Unable to sign in. Please check your credentials and try again.",
      ERROR_CODES.AUTH_ERROR
    );
  }
}

/**
 * Log out the current user using Supabase Auth
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(PATHS.PUBLIC.LOGIN);
}

/**
 * Get the current session from Supabase Auth
 */
export async function getSessionAction(): Promise<SessionData | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || !user.email) {
      return null;
    }

    const dbUser = await getUserByEmail(user.email);
    
    return {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.name || dbUser?.name || "",
      role: dbUser?.role || "developer",
      isLoggedIn: true,
    };
  } catch {
    return null;
  }
}

