import { QueryResponse } from "@/db/types/queries";
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  ErrorCode,
} from "@/lib/constants/error-codes";

/**
 * Categorizes error based on message patterns
 * @param errorMessage - The error message to categorize
 * @returns The appropriate error code
 */
function categorizeError(errorMessage: string): ErrorCode {
  const message = errorMessage.toLowerCase();

  if (/unique constraint|duplicate key|already exists/i.test(message)) {
    return ERROR_CODES.DUPLICATE_RECORD;
  }
  if (/foreign key constraint|referenced|references/i.test(message)) {
    return ERROR_CODES.INVALID_REFERENCE;
  }
  if (/null value|not-null|required|cannot be null/i.test(message)) {
    return ERROR_CODES.MISSING_REQUIRED_DATA;
  }
  if (/permission|privilege|authorization|not allowed|access/i.test(message)) {
    return ERROR_CODES.PERMISSION_DENIED;
  }
  if (/syntax|invalid|malformed|not valid/i.test(message)) {
    return ERROR_CODES.INVALID_FORMAT;
  }
  if (/timeout|timed out|too slow|deadlock/i.test(message)) {
    return ERROR_CODES.TIMEOUT;
  }
  if (/limit|quota|exceeded|too many/i.test(message)) {
    return ERROR_CODES.LIMIT_EXCEEDED;
  }
  if (/connection|connect|econnrefused/i.test(message)) {
    return ERROR_CODES.CONNECTION_FAILED;
  }

  return ERROR_CODES.DB_ERROR;
}

/**
 * Creates a standardized error response with automatic logging
 * @param context - The context where the error occurred
 * @param error - The error object
 * @returns A standardized QueryResponse with error details
 */
export function createErrorResponse<T>(
  context: string,
  error: unknown
): QueryResponse<T> {
  const isDevelopment =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  if (error instanceof Error) {
    const errorCode = categorizeError(error.message);
    const userMessage = ERROR_MESSAGES[errorCode];

    // Log error for better visibility in development
    if (typeof window === "undefined") {
      const { logger } = require("./logger");
      logger.error(`[${context}] ${error.message}`, {
        code: errorCode,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      });
    }

    return {
      success: false,
      data: null,
      error: isDevelopment ? error.message : userMessage,
      code: errorCode,
    };
  }

  // Log non-Error objects
  if (typeof window === "undefined") {
    const { logger } = require("./logger");
    logger.error(`[${context}] Unknown error`, { error: String(error) });
  }

  return {
    success: false,
    data: null,
    error: isDevelopment ? String(error) : ERROR_MESSAGES[ERROR_CODES.DB_ERROR],
    code: ERROR_CODES.DB_ERROR,
  };
}

/**
 * Creates a success response with optional logging
 * @param data - The data to return
 * @param context - Optional context for logging
 * @returns A standardized QueryResponse with success status
 */
export function createSuccessResponse<T>(
  data: T,
  context?: string
): QueryResponse<T> {
  // Log success in development for better visibility
  if (context && typeof window === "undefined") {
    const { logger } = require("./logger");
    const dataPreview =
      typeof data === "object" && data !== null
        ? Object.keys(data as object).length > 0
          ? `(${Object.keys(data as object).length} fields)`
          : "(empty)"
        : String(data);
    logger.success(`[${context}] Operation successful`, {
      data: dataPreview,
    });
  }

  return {
    success: true,
    data,
    error: null,
  };
}
