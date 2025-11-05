import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Users table - Stores user authentication and profile information
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role: text("role").notNull().default("developer"),
    isActive: boolean("is_active").default(true),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
  })
);

/**
 * Database connections table - Stores source and target database connection details
 */
export const connections = pgTable(
  "connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    dbType: text("db_type").notNull(),
    host: text("host").notNull(),
    port: integer("port").notNull(),
    database: text("database").notNull(),
    username: text("username").notNull(),
    encryptedPassword: text("encrypted_password").notNull(),
    isActive: boolean("is_active").default(true),
    lastTestedAt: timestamp("last_tested_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    userIdIdx: index("connections_user_id_idx").on(t.userId),
    typeIdx: index("connections_type_idx").on(t.type),
  })
);

/**
 * Mapping projects table - Stores high-level mapping project information
 */
export const mappingProjects = pgTable(
  "mapping_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sourceConnectionId: uuid("source_connection_id").references(
      () => connections.id,
      {
        onDelete: "set null",
      }
    ),
    targetConnectionId: uuid("target_connection_id").references(
      () => connections.id,
      {
        onDelete: "set null",
      }
    ),
    strategy: text("strategy").default("single"),
    status: text("status").notNull().default("draft"),
    scheduleEnabled: boolean("schedule_enabled").default(false),
    scheduleCron: varchar("schedule_cron", { length: 100 }),
    scheduleInterval: integer("schedule_interval"),
    lastExecutionTime: timestamp("last_execution_time"),
    etlConfig: jsonb("etl_config"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    userIdIdx: index("mapping_projects_user_id_idx").on(t.userId),
    statusIdx: index("mapping_projects_status_idx").on(t.status),
    scheduleEnabledIdx: index("mapping_projects_schedule_enabled_idx").on(t.scheduleEnabled),
  })
);

/**
 * Pipelines table - Individual pipelines within a project (e.g., staging, production)
 */
export const pipelines: ReturnType<typeof pgTable> = pgTable(
  "pipelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    pipelineOrder: integer("pipeline_order").notNull().default(1),
    sourceConnectionId: uuid("source_connection_id").references(
      () => connections.id
    ),
    targetConnectionId: uuid("target_connection_id").references(
      () => connections.id
    ),
    dependsOnPipelineId: uuid("depends_on_pipeline_id"),
    status: text("status").default("draft"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    projectIdIdx: index("pipelines_project_id_idx").on(t.projectId),
    dependsOnIdx: index("pipelines_depends_on_idx").on(t.dependsOnPipelineId),
  })
);

/**
 * Project executions - Tracks execution of entire project (all pipelines)
 */
export const projectExecutions = pgTable(
  "project_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    triggeredBy: text("triggered_by").default("manual"),
    status: text("status").notNull().default("running"),
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").default("{}"),
  },
  (t) => ({
    projectIdIdx: index("project_executions_project_id_idx").on(t.projectId),
    statusIdx: index("project_executions_status_idx").on(t.status),
    startedAtIdx: index("project_executions_started_at_idx").on(t.startedAt),
  })
);

/**
 * Pipeline executions - Tracks execution of individual pipeline within a project execution
 */
export const pipelineExecutions = pgTable(
  "pipeline_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    projectExecutionId: uuid("project_execution_id")
      .notNull()
      .references(() => projectExecutions.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    recordsProcessed: integer("records_processed").default(0),
    recordsFailed: integer("records_failed").default(0),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").default("{}"),
  },
  (t) => ({
    pipelineIdIdx: index("pipeline_executions_pipeline_id_idx").on(t.pipelineId),
    projectExecutionIdIdx: index("pipeline_executions_project_execution_id_idx").on(
      t.projectExecutionId
    ),
    statusIdx: index("pipeline_executions_status_idx").on(t.status),
  })
);

/**
 * Schedules - Automated execution schedules for projects
 */
export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    cronExpression: text("cron_expression").notNull(),
    timezone: text("timezone").default("UTC"),
    enabled: boolean("enabled").default(true),
    lastRun: timestamp("last_run"),
    nextRun: timestamp("next_run"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    metadata: jsonb("metadata").default("{}"),
  },
  (t) => ({
    projectIdIdx: index("schedules_project_id_idx").on(t.projectId),
    enabledIdx: index("schedules_enabled_idx").on(t.enabled),
    nextRunIdx: index("schedules_next_run_idx").on(t.nextRun),
  })
);

/**
 * Airflow DAG runs - Links DataBridge project executions to Airflow DAG runs
 */
export const airflowDagRuns = pgTable(
  "airflow_dag_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectExecutionId: uuid("project_execution_id")
      .notNull()
      .references(() => projectExecutions.id, { onDelete: "cascade" }),
    dagId: text("dag_id").notNull(),
    dagRunId: text("dag_run_id").notNull(),
    airflowExecutionDate: timestamp("airflow_execution_date").notNull(),
    airflowState: text("airflow_state"),
    airflowUrl: text("airflow_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    projectExecutionIdIdx: index("airflow_dag_runs_project_execution_id_idx").on(
      t.projectExecutionId
    ),
    dagIdIdx: index("airflow_dag_runs_dag_id_idx").on(t.dagId),
  })
);

/**
 * Table mappings - Stores table-level mapping configurations
 */
export const tableMappings = pgTable(
  "table_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    pipelineId: uuid("pipeline_id").references(() => pipelines.id, {
      onDelete: "cascade",
    }),
    sourceTable: text("source_table").notNull(),
    targetTable: text("target_table").notNull(),
    mappingRules: jsonb("mapping_rules"),
    mappingOrder: integer("mapping_order").notNull().default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    projectIdIdx: index("table_mappings_project_id_idx").on(t.projectId),
    pipelineIdIdx: index("table_mappings_pipeline_id_idx").on(t.pipelineId),
  })
);

/**
 * Column mappings - Stores column-level mapping configurations
 */
export const columnMappings = pgTable(
  "column_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableMappingId: uuid("table_mapping_id")
      .notNull()
      .references(() => tableMappings.id, { onDelete: "cascade" }),
    sourceColumn: text("source_column").notNull(),
    targetColumn: text("target_column").notNull(),
    sourceDataType: text("source_data_type").notNull(),
    targetDataType: text("target_data_type").notNull(),
    transformationId: uuid("transformation_id").references(
      () => transformations.id,
      {
        onDelete: "set null",
      }
    ),
    transformationConfig: jsonb("transformation_config"),
    isNullable: boolean("is_nullable").default(true),
    defaultValue: text("default_value"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    tableMappingIdIdx: index("column_mappings_table_mapping_id_idx").on(
      t.tableMappingId
    ),
  })
);

/**
 * Transformations - Stores transformation logic for data conversion
 */
export const transformations = pgTable(
  "transformations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    isReusable: boolean("is_reusable").default(true),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    typeIdx: index("transformations_type_idx").on(t.type),
    categoryIdx: index("transformations_category_idx").on(t.category),
  })
);

/**
 * Migration executions - Tracks migration execution history and status
 */
export const migrationExecutions = pgTable(
  "migration_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    executedBy: uuid("executed_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    stage: text("stage"),
    totalRecords: integer("total_records"),
    processedRecords: integer("processed_records").default(0),
    failedRecords: integer("failed_records").default(0),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    errorMessage: text("error_message"),
    logs: jsonb("logs"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    projectIdIdx: index("migration_executions_project_id_idx").on(t.projectId),
    statusIdx: index("migration_executions_status_idx").on(t.status),
  })
);

/**
 * Validation reports - Stores pre and post-migration validation results
 */
export const validationReports = pgTable(
  "validation_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => migrationExecutions.id, { onDelete: "cascade" }),
    reportType: text("report_type").notNull(),
    validationType: text("validation_type").notNull(),
    status: text("status").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    executionIdIdx: index("validation_reports_execution_id_idx").on(
      t.executionId
    ),
    statusIdx: index("validation_reports_status_idx").on(t.status),
  })
);

/**
 * ETL Execution Stages - Tracks each stage of the ETL pipeline
 */
export const etlExecutionStages = pgTable(
  "etl_execution_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: varchar("execution_id", { length: 255 }).notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    stageId: varchar("stage_id", { length: 50 }).notNull(),
    stageName: varchar("stage_name", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    duration: integer("duration"),
    recordsProcessed: integer("records_processed").default(0),
    recordsFailed: integer("records_failed").default(0),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    uniqueExecutionStage: unique("unique_execution_stage").on(
      t.executionId,
      t.stageId
    ),
    executionIdx: index("idx_etl_stages_execution").on(t.executionId),
    projectIdx: index("idx_etl_stages_project").on(t.projectId),
    statusIdx: index("idx_etl_stages_status").on(t.status),
  })
);

/**
 * Attachment Migrations - Tracks CouchDB to SAP Object Store migrations
 */
export const attachmentMigrations = pgTable(
  "attachment_migrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: varchar("execution_id", { length: 255 }).notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    documentId: varchar("document_id", { length: 255 }).notNull(),
    attachmentName: varchar("attachment_name", { length: 500 }).notNull(),
    sourceUrl: text("source_url"),
    targetUrl: text("target_url"),
    contentType: varchar("content_type", { length: 100 }),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    errorMessage: text("error_message"),
    migratedAt: timestamp("migrated_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqueAttachmentMigration: unique("unique_attachment_migration").on(
      t.executionId,
      t.documentId,
      t.attachmentName
    ),
    executionIdx: index("idx_attachment_migrations_execution").on(t.executionId),
    projectIdx: index("idx_attachment_migrations_project").on(t.projectId),
    statusIdx: index("idx_attachment_migrations_status").on(t.status),
  })
);

/**
 * Data Validations - Stores validation results for each execution
 */
export const dataValidations = pgTable(
  "data_validations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: varchar("execution_id", { length: 255 }).notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    tableName: varchar("table_name", { length: 255 }).notNull(),
    validationType: varchar("validation_type", { length: 50 }).notNull(),
    expectedValue: text("expected_value"),
    actualValue: text("actual_value"),
    status: varchar("status", { length: 20 }).notNull(),
    message: text("message"),
    validatedAt: timestamp("validated_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    executionIdx: index("idx_data_validations_execution").on(t.executionId),
    projectIdx: index("idx_data_validations_project").on(t.projectId),
    statusIdx: index("idx_data_validations_status").on(t.status),
  })
);

/**
 * Migration Reports - Comprehensive reports for each migration execution
 */
export const migrationReports = pgTable(
  "migration_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: varchar("execution_id", { length: 255 })
      .unique("unique_execution_id")
      .notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => mappingProjects.id, { onDelete: "cascade" }),
    projectName: varchar("project_name", { length: 255 }).notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    durationMs: integer("duration_ms").notNull(),
    summary: jsonb("summary").notNull(),
    stages: jsonb("stages").notNull(),
    validations: jsonb("validations").notNull(),
    tableDetails: jsonb("table_details").notNull(),
    errors: jsonb("errors"),
    warnings: jsonb("warnings"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    executionIdx: index("idx_migration_reports_execution").on(t.executionId),
    projectIdx: index("idx_migration_reports_project").on(t.projectId),
    createdIdx: index("idx_migration_reports_created").on(t.createdAt),
  })
);

