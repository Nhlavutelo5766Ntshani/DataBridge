/**
 * ETL Types and Interfaces for Node.js Migration Pipeline
 */

/**
 * ETL Stage Status
 */
export type StageStatus = "pending" | "running" | "completed" | "failed" | "skipped";

/**
 * ETL Execution Status
 */
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";

/**
 * Individual ETL Stage Information
 */
export type ETLStage = {
  stageId: string;
  stageName: string;
  status: StageStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  recordsProcessed?: number;
  recordsFailed?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Complete ETL Execution Information
 */
export type ETLExecution = {
  executionId: string;
  projectId: string;
  status: ExecutionStatus;
  currentStage?: string;
  stages: ETLStage[];
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  progress: number;
  startTime: Date;
  endTime?: Date;
  errors?: string[];
  warnings?: string[];
};

/**
 * Stage Result returned by each ETL stage
 */
export type StageResult = {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Table Mapping for ETL processing
 */
export type TableMapping = {
  id: string;
  sourceTable: string;
  targetTable: string;
  mappingOrder: number;
  isActive: boolean;
  columnMappings: ColumnMapping[];
};

/**
 * Column Mapping with transformation
 */
export type ColumnMapping = {
  id: string;
  sourceColumn: string;
  targetColumn: string;
  sourceDataType: string;
  targetDataType: string;
  transformationId?: string;
  transformationConfig?: Record<string, unknown>;
  isNullable: boolean;
  defaultValue?: string;
};

/**
 * Attachment Metadata for CouchDB → SAP migration
 */
export type AttachmentMetadata = {
  documentId: string;
  attachmentName: string;
  contentType: string;
  size: number;
  sourceUrl?: string;
};

/**
 * Attachment Migration Result
 */
export type AttachmentMigrationResult = {
  documentId: string;
  attachmentName: string;
  success: boolean;
  targetUrl?: string;
  error?: string;
};

/**
 * Data Validation Result
 */
export type ValidationResult = {
  table: string;
  validationType: "row_count" | "data_type" | "null_constraint" | "foreign_key" | "custom";
  expected: number | string;
  actual: number | string;
  status: "passed" | "failed" | "warning";
  message?: string;
};

/**
 * Migration Report
 */
export type MigrationReport = {
  executionId: string;
  projectId: string;
  projectName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  summary: {
    totalTables: number;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    attachmentsMigrated: number;
    attachmentsFailed: number;
  };
  stages: Array<{
    name: string;
    status: StageStatus;
    duration: string;
    recordsProcessed: number;
  }>;
  validations: ValidationResult[];
  tableDetails: Array<{
    tableName: string;
    sourceCount: number;
    targetCount: number;
    duration: string;
    status: string;
  }>;
  errors: string[];
  warnings: string[];
};

/**
 * Staging Configuration
 */
export type StagingConfig = {
  databaseUrl: string;
  schemaName: string;
  tablePrefix: string;
  cleanupAfterMigration: boolean;
  autoCreate?: boolean;
};

/**
 * Load strategy for target tables
 * - truncate-load: Truncate target table before loading (simple, loses history)
 * - merge: UPSERT based on primary key (updates existing, inserts new)
 * - append: Simple INSERT (for fact tables that should accumulate)
 */
export type LoadStrategy = "truncate-load" | "merge" | "append";

/**
 * ETL Pipeline Configuration
 */
export type ETLPipelineConfig = {
  projectId: string;
  executionId: string;
  batchSize: number;
  parallelism: number;
  errorHandling: "fail-fast" | "continue-on-error" | "skip-and-log";
  validateData: boolean;
  staging: StagingConfig;
  loadStrategy?: LoadStrategy;
  retryAttempts: number;
  retryDelayMs: number;
};

/**
 * BullMQ Job Data for ETL stages
 */
export type ETLJobData = {
  projectId: string;
  executionId: string;
  stage: "extract" | "transform" | "load-dimensions" | "load-facts" | "validate" | "report";
  config: ETLPipelineConfig;
  metadata?: Record<string, unknown>;
};

