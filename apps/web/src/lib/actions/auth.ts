"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { QueryResponse } from "@/db/types/queries";
import { createUser, getUserByEmail } from "@/db/queries/users";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { PATHS } from "@/lib/constants/paths";
import { createErrorResponse } from "@/lib/utils/errors";
import { ERROR_CODES } from "@/lib/constants/error-codes";

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
 * Sign up a new user
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

    const existingUser = await getUserByEmail(validatedData.email);
    if (existingUser) {
      return createErrorResponse(
        "An account with this email already exists",
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const user = await createUser({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      passwordHash,
      role: "developer",
      isActive: true,
    });

    await createSession(user.id, user.email, user.name, user.role);

    return {
      success: true,
      data: { userId: user.id },
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
      
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return createErrorResponse(
          "An account with this email already exists",
          ERROR_CODES.VALIDATION_ERROR
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
 * Log in a user
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

    const user = await getUserByEmail(validatedData.email);
    
    if (!user) {
      return createErrorResponse(
        "Invalid email or password",
        ERROR_CODES.AUTH_ERROR
      );
    }

    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return createErrorResponse(
        "Invalid email or password",
        ERROR_CODES.AUTH_ERROR
      );
    }

    if (!user.isActive) {
      return createErrorResponse(
        "Your account has been deactivated",
        ERROR_CODES.AUTH_ERROR
      );
    }

    await createSession(user.id, user.email, user.name, user.role);

    return {
      success: true,
      data: { userId: user.id },
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
 * Log out the current user
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect(PATHS.PUBLIC.LOGIN);
}

/**
 * Get the current session
 */
export async function getSessionAction() {
  const session = await getSession();
  
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    isLoggedIn: session.isLoggedIn,
  };
}

