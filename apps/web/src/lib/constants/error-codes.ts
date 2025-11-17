export const ERROR_CODES = {
  DB_ERROR: "DB_ERROR",
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_RECORD: "DUPLICATE_RECORD",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONNECTION_FAILED: "CONNECTION_FAILED",
  MIGRATION_FAILED: "MIGRATION_FAILED",
  TRANSFORMATION_ERROR: "TRANSFORMATION_ERROR",
  SCHEMA_MISMATCH: "SCHEMA_MISMATCH",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  INVALID_MAPPING: "INVALID_MAPPING",
  MISSING_REQUIRED_DATA: "MISSING_REQUIRED_DATA",
  INVALID_REFERENCE: "INVALID_REFERENCE",
  INVALID_FORMAT: "INVALID_FORMAT",
  TIMEOUT: "TIMEOUT",
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
  AUTH_ERROR: "AUTH_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.DB_ERROR]: "An unexpected database error occurred",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found",
  [ERROR_CODES.DUPLICATE_RECORD]:
    "A record with this information already exists",
  [ERROR_CODES.VALIDATION_ERROR]: "Validation failed",
  [ERROR_CODES.CONNECTION_FAILED]: "Failed to connect to the database",
  [ERROR_CODES.MIGRATION_FAILED]: "Migration execution failed",
  [ERROR_CODES.TRANSFORMATION_ERROR]: "Data transformation failed",
  [ERROR_CODES.SCHEMA_MISMATCH]: "Source and target schemas do not match",
  [ERROR_CODES.PERMISSION_DENIED]:
    "You don't have permission to perform this action",
  [ERROR_CODES.INVALID_MAPPING]: "Invalid mapping configuration",
  [ERROR_CODES.MISSING_REQUIRED_DATA]: "Required information is missing",
  [ERROR_CODES.INVALID_REFERENCE]:
    "This operation references data that doesn't exist",
  [ERROR_CODES.INVALID_FORMAT]: "Invalid data format",
  [ERROR_CODES.TIMEOUT]: "The operation took too long to complete",
  [ERROR_CODES.LIMIT_EXCEEDED]: "Operation limits exceeded",
  [ERROR_CODES.AUTH_ERROR]: "Authentication failed",
  [ERROR_CODES.SERVER_ERROR]: "Server configuration error",
};

