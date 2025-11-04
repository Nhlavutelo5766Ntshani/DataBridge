/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: "admin",
  DEVELOPER: "developer",
  VIEWER: "viewer",
} as const;

/**
 * Connection types
 */
export const CONNECTION_TYPES = {
  SOURCE: "source",
  TARGET: "target",
} as const;

/**
 * Database types
 */
export const DATABASE_TYPES = {
  SQL_SERVER: "sqlserver",
  POSTGRESQL: "postgresql",
} as const;

/**
 * Mapping project statuses
 */
export const MAPPING_PROJECT_STATUS = {
  DRAFT: "draft",
  VALIDATED: "validated",
  READY: "ready",
  ARCHIVED: "archived",
} as const;

/**
 * Transformation types
 */
export const TRANSFORMATION_TYPES = {
  BUILTIN: "builtin",
  CUSTOM: "custom",
} as const;

/**
 * Transformation categories
 */
export const TRANSFORMATION_CATEGORIES = {
  STRING: "string",
  NUMERIC: "numeric",
  DATE: "date",
  CONDITIONAL: "conditional",
  CUSTOM: "custom",
} as const;

/**
 * Migration execution statuses
 */
export const MIGRATION_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

/**
 * Migration stages
 */
export const MIGRATION_STAGES = {
  VALIDATION: "validation",
  EXTRACTION: "extraction",
  TRANSFORMATION: "transformation",
  LOADING: "loading",
  VERIFICATION: "verification",
} as const;

/**
 * Validation report types
 */
export const VALIDATION_REPORT_TYPES = {
  PRE_MIGRATION: "pre_migration",
  POST_MIGRATION: "post_migration",
} as const;

/**
 * Validation types
 */
export const VALIDATION_TYPES = {
  RECORD_COUNT: "record_count",
  DATA_TYPE: "data_type",
  INTEGRITY: "integrity",
  NULLABILITY: "nullability",
} as const;

/**
 * Validation statuses
 */
export const VALIDATION_STATUS = {
  PASSED: "passed",
  FAILED: "failed",
  WARNING: "warning",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type ConnectionType =
  (typeof CONNECTION_TYPES)[keyof typeof CONNECTION_TYPES];
export type DatabaseType = (typeof DATABASE_TYPES)[keyof typeof DATABASE_TYPES];
export type MappingProjectStatus =
  (typeof MAPPING_PROJECT_STATUS)[keyof typeof MAPPING_PROJECT_STATUS];
export type TransformationType =
  (typeof TRANSFORMATION_TYPES)[keyof typeof TRANSFORMATION_TYPES];
export type TransformationCategory =
  (typeof TRANSFORMATION_CATEGORIES)[keyof typeof TRANSFORMATION_CATEGORIES];
export type MigrationStatus =
  (typeof MIGRATION_STATUS)[keyof typeof MIGRATION_STATUS];
export type MigrationStage =
  (typeof MIGRATION_STAGES)[keyof typeof MIGRATION_STAGES];
export type ValidationReportType =
  (typeof VALIDATION_REPORT_TYPES)[keyof typeof VALIDATION_REPORT_TYPES];
export type ValidationType =
  (typeof VALIDATION_TYPES)[keyof typeof VALIDATION_TYPES];
export type ValidationStatus =
  (typeof VALIDATION_STATUS)[keyof typeof VALIDATION_STATUS];

