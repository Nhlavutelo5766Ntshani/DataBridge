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
 * Creates a standardized error response
 * @param context - The context where the error occurred
 * @param error - The error object
 * @returns A standardized QueryResponse with error details
 */
export function createErrorResponse<T>(
  _context: string,
  error: unknown
): QueryResponse<T> {
  const isDevelopment =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  if (error instanceof Error) {
    const errorCode = categorizeError(error.message);
    const userMessage = ERROR_MESSAGES[errorCode];

    return {
      success: false,
      data: null,
      error: isDevelopment ? error.message : userMessage,
      code: errorCode,
    };
  }

  return {
    success: false,
    data: null,
    error: isDevelopment ? String(error) : ERROR_MESSAGES[ERROR_CODES.DB_ERROR],
    code: ERROR_CODES.DB_ERROR,
  };
}

/**
 * Creates a success response
 * @param data - The data to return
 * @returns A standardized QueryResponse with success status
 */
export function createSuccessResponse<T>(data: T): QueryResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}
