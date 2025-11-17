import type { ETLPipelineConfig, StageResult, AttachmentMetadata, RecordIdMappingData } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { db } from "@/db";
import { getProjectById } from "@/db/queries/projects";
import { getConnectionById } from "@/db/queries/connections";
import { getSAPClient } from "@/lib/services/sap-object-store";
import { createAttachmentMigrations } from "@/db/queries/attachment-migrations";
import { createIdMappingsBatch, getIdMappingByCouchDbId } from "@/db/queries/record-id-mappings";
import { Client } from "pg";
import axios from "axios";
import { ERROR_CODES } from "@/lib/constants/error-codes";

/**
 * Stage 4: Load fact tables and migrate attachments
 * 
 * This stage:
 * - Loads fact/transactional tables from staging to target
 * - Validates foreign key relationships
 * - Handles errors based on error strategy
 * - Migrates attachments from CouchDB to SAP Object Store
 * - Updates target tables with SAP URLs
 * 
 * @param projectId - Project ID
 * @param executionId - Execution ID
 * @param config - ETL pipeline configuration
 * @returns Stage execution result
 */
export async function loadFacts(
  projectId: string,
  executionId: string,
  config: ETLPipelineConfig
): Promise<StageResult> {
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  let attachmentsMigrated = 0;
  let attachmentsFailed = 0;
  let idMappingsCreated = 0;

  logger.info(`[Stage 4] Starting fact table loading and attachment migration`, {
    projectId,
    executionId,
  });

  let targetClient: Client | null = null;

  try {
    const project = await getProjectById(projectId);
    if (!project || !project.targetConnectionId) {
      throw new Error("Project or target connection not found");
    }

    const targetConn = await getConnectionById(project.targetConnectionId);
    if (!targetConn) {
      throw new Error("Target connection not found");
    }

    logger.info(`[Stage 4] Connecting to target database`);

    targetClient = new Client({
      user: targetConn.username,
      password: targetConn.encryptedPassword,
      host: targetConn.host,
      port: targetConn.port || 5432,
      database: targetConn.database,
      ssl: false,
    });

    await targetClient.connect();
    logger.success(`[Stage 4] Connected to target database`);

    const tableMappings = await db.query.tableMappings.findMany({
      where: (tableMappings, { eq }) => eq(tableMappings.projectId, projectId),
      orderBy: (tableMappings, { asc }) => [asc(tableMappings.mappingOrder)],
    });

    if (!tableMappings || tableMappings.length === 0) {
      logger.warn(`[Stage 4] No fact tables found`);
      return {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime,
      };
    }

    logger.info(`[Stage 4] Found ${tableMappings.length} fact tables to load`);

    for (const tableMapping of tableMappings) {
      const tableStart = Date.now();

      try {
        logger.info(`[Stage 4] Loading fact table: ${tableMapping.targetTable}`);

        const stagingTable = `${config.staging.tablePrefix}${tableMapping.sourceTable}`;

        const columnMappings = await db.query.columnMappings.findMany({
          where: (columnMappings, { eq }) => eq(columnMappings.tableMappingId, tableMapping.id),
        });

        if (!columnMappings || columnMappings.length === 0) {
          logger.warn(`[Stage 4] No column mappings for ${tableMapping.targetTable}`);
          continue;
        }

        await targetClient.query("BEGIN");

        await ensureAttachmentUrlColumn(targetClient, tableMapping.targetTable);

        const { recordsLoaded, idMappings } = await loadFactTable(
          targetClient,
          stagingTable,
          tableMapping.targetTable,
          columnMappings,
          config.staging.schemaName,
          config.errorHandling,
          config.loadStrategy || "truncate-load",
          executionId,
          projectId
        );

        if (idMappings.length > 0) {
          try {
            await createIdMappingsBatch(idMappings);
            idMappingsCreated += idMappings.length;
            logger.success(`[Stage 4] Created ${idMappings.length} ID mappings for ${tableMapping.targetTable}`);
          } catch (error) {
            logger.error(`[Stage 4] Failed to create ID mappings`, {
              table: tableMapping.targetTable,
              error,
              code: ERROR_CODES.DB_ERROR,
            });
          }
        }

        await targetClient.query("COMMIT");

        recordsProcessed += recordsLoaded;

        const tableDuration = Date.now() - tableStart;
        logger.success(`[Stage 4] Fact table loaded successfully`, {
          table: tableMapping.targetTable,
          records: recordsLoaded,
          duration: `${tableDuration}ms`,
        });
      } catch (error) {
        await targetClient.query("ROLLBACK");
        recordsFailed++;

        logger.error(`[Stage 4] Failed to load fact table`, {
          table: tableMapping.targetTable,
          error,
        });

        if (config.errorHandling === "fail-fast") {
          throw error;
        }
      }
    }

    if (project.sourceConnectionId) {
      const sourceConn = await getConnectionById(project.sourceConnectionId);
      
      if (sourceConn && sourceConn.dbType === "couchdb") {
        logger.info(`[Stage 4] Starting attachment migration from CouchDB`);

        const attachmentResult = await migrateAttachments(
          projectId,
          executionId,
          sourceConn,
          config,
          targetClient
        );

        attachmentsMigrated = attachmentResult.migrated;
        attachmentsFailed = attachmentResult.failed;
      }
    }

    const duration = Date.now() - startTime;

    logger.success(`[Stage 4] Fact loading and attachment migration completed`, {
      recordsProcessed,
      recordsFailed,
      attachmentsMigrated,
      attachmentsFailed,
      idMappingsCreated,
      duration: `${duration}ms`,
    });

    return {
      success: true,
      recordsProcessed,
      recordsFailed,
      duration,
      idMappingsCreated,
      metadata: {
        attachmentsMigrated,
        attachmentsFailed,
        idMappingsCreated,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[Stage 4] Fact loading failed`, error);

    return {
      success: false,
      recordsProcessed,
      recordsFailed,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (targetClient) {
      await targetClient.end();
      logger.info(`[Stage 4] Closed target database connection`);
    }
  }
}

/**
 * Ensure attachment_url column exists in target table
 */
async function ensureAttachmentUrlColumn(client: Client, tableName: string): Promise<void> {
  try {
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      AND column_name = 'attachment_url'
    `;
    
    const result = await client.query(checkColumnSQL);
    
    if (result.rows.length === 0) {
      const alterTableSQL = `
        ALTER TABLE ${tableName} 
        ADD COLUMN IF NOT EXISTS attachment_url TEXT,
        ADD COLUMN IF NOT EXISTS attachment_metadata JSONB
      `;
      
      await client.query(alterTableSQL);
      logger.info(`[Stage 4] Added attachment columns to ${tableName}`);
    }
  } catch (error) {
    logger.warn(`[Stage 4] Could not add attachment columns to ${tableName}`, { error });
  }
}

/**
 * Load a single fact table and capture ID mappings
 */
async function loadFactTable(
  client: Client,
  stagingTable: string,
  targetTable: string,
  columnMappings: Array<{
    sourceColumn: string;
    targetColumn: string;
  }>,
  schemaName: string,
  errorHandling: string,
  loadStrategy: "truncate-load" | "merge" | "append",
  executionId: string,
  projectId: string
): Promise<{ recordsLoaded: number; idMappings: RecordIdMappingData[] }> {
  const sourceColumns = columnMappings.map((m) => `"${m.sourceColumn}"`).join(", ");
  const targetColumns = columnMappings.map((m) => `"${m.targetColumn}"`).join(", ");
  const idMappings: RecordIdMappingData[] = [];

  try {
    if (loadStrategy === "truncate-load") {
      logger.info(`[Stage 4] Truncating target table: ${targetTable}`);
      await client.query(`TRUNCATE TABLE ${targetTable}`);
    }

    const primaryKeyColumn = await getPrimaryKeyColumn(client, stagingTable, schemaName);
    
    if (primaryKeyColumn) {
      const insertWithReturnSQL = `
        WITH inserted AS (
          INSERT INTO ${targetTable} (${targetColumns})
          SELECT ${sourceColumns}
          FROM ${schemaName}.${stagingTable}
          RETURNING id, *
        )
        SELECT 
          inserted.id as target_id,
          staging."${primaryKeyColumn}" as source_id
        FROM inserted
        JOIN ${schemaName}.${stagingTable} staging
        ON inserted."${columnMappings.find(m => m.sourceColumn === primaryKeyColumn)?.targetColumn || primaryKeyColumn}" = staging."${primaryKeyColumn}"
      `;

      const result = await client.query(insertWithReturnSQL);
      
      result.rows.forEach((row) => {
        const couchdbDocId = `${targetTable.toLowerCase()}_${row.source_id}`;
        idMappings.push({
          executionId,
          projectId,
          tableName: targetTable,
          sourceId: String(row.source_id),
          sourceIdColumn: primaryKeyColumn,
          targetId: row.target_id,
          targetIdColumn: "id",
          couchdbDocumentId: couchdbDocId,
        });
      });

      logger.success(`[Stage 4] Loaded ${result.rowCount} records into ${targetTable} with ID mappings`);
      return { recordsLoaded: result.rowCount || 0, idMappings };
    } else {
      const insertSQL = `
        INSERT INTO ${targetTable} (${targetColumns})
        SELECT ${sourceColumns}
        FROM ${schemaName}.${stagingTable}
      `;

      const result = await client.query(insertSQL);
      logger.success(`[Stage 4] Loaded ${result.rowCount} records into ${targetTable}`);
      return { recordsLoaded: result.rowCount || 0, idMappings: [] };
    }
  } catch (error) {
    logger.error(`Failed to load fact table ${targetTable}`, { 
      error,
      code: ERROR_CODES.DB_ERROR,
    });
    
    if (errorHandling === "fail-fast") {
      throw error;
    }
    
    return { recordsLoaded: 0, idMappings: [] };
  }
}

/**
 * Get the primary key column from staging table
 */
async function getPrimaryKeyColumn(
  client: Client,
  tableName: string,
  schemaName: string
): Promise<string | null> {
  try {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      ORDER BY ordinal_position
      LIMIT 1
    `;
    
    const result = await client.query(query, [schemaName, tableName]);
    return result.rows[0]?.column_name || null;
  } catch (error) {
    logger.warn(`Could not determine primary key for ${schemaName}.${tableName}`, { error });
    return null;
  }
}

/**
 * Migrate attachments from CouchDB to SAP Object Store and link to PostgreSQL records
 */
async function migrateAttachments(
  projectId: string,
  executionId: string,
  couchDbConn: {
    host: string;
    port: number | null;
    username: string;
    encryptedPassword: string;
    database: string;
  },
  config: ETLPipelineConfig,
  targetClient: Client
): Promise<{ migrated: number; failed: number }> {
  const sapClient = getSAPClient();
  let migrated = 0;
  let failed = 0;

  try {
    const couchUrl = `http://${couchDbConn.host}:${couchDbConn.port || 5984}/${couchDbConn.database}`;
    const auth = Buffer.from(`${couchDbConn.username}:${couchDbConn.encryptedPassword}`).toString("base64");

    logger.info(`[Stage 4] Fetching documents with attachments from CouchDB`, {
      database: couchDbConn.database,
    });

    const allDocsResponse = await axios.get(`${couchUrl}/_all_docs?include_docs=true`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const docsWithAttachments = allDocsResponse.data.rows
      .filter((row: { doc: { _attachments?: Record<string, unknown> } }) => row.doc._attachments)
      .map((row: { doc: { _id: string; _attachments: Record<string, { content_type: string; length: number }> } }) => ({
        docId: row.doc._id,
        attachments: Object.entries(row.doc._attachments).map(([name, att]) => ({
          documentId: row.doc._id,
          attachmentName: name,
          contentType: att.content_type,
          size: att.length,
        })),
      }));

    logger.info(`[Stage 4] Found ${docsWithAttachments.length} documents with attachments`);

    for (const doc of docsWithAttachments) {
      const recordMapping = await getIdMappingByCouchDbId(executionId, doc.docId);
      
      if (!recordMapping) {
        logger.warn(`[Stage 4] No PostgreSQL record found for CouchDB doc: ${doc.docId}`, {
          code: ERROR_CODES.NOT_FOUND,
        });
        failed += doc.attachments.length;
        continue;
      }

      for (const attMetadata of doc.attachments) {
        try {
          const attUrl = `${couchUrl}/${doc.docId}/${attMetadata.attachmentName}`;
          
          logger.debug(`[Stage 4] Downloading attachment: ${attMetadata.attachmentName}`);
          const attResponse = await axios.get(attUrl, {
            headers: {
              Authorization: `Basic ${auth}`,
            },
            responseType: "arraybuffer",
          });

          const attBuffer = Buffer.from(attResponse.data);

          logger.debug(`[Stage 4] Uploading to SAP: ${attMetadata.attachmentName}`);
          const sapResult = await sapClient.uploadWithRetry(
            doc.docId,
            attBuffer,
            attMetadata as AttachmentMetadata
          );

          if (sapResult.success && sapResult.url) {
            await targetClient.query(`
              UPDATE ${recordMapping.tableName}
              SET attachment_url = $1, updated_at = NOW()
              WHERE id = $2
            `, [sapResult.url, recordMapping.targetId]);

            await createAttachmentMigrations([{
              executionId,
              projectId,
              documentId: doc.docId,
              attachmentName: attMetadata.attachmentName,
              postgresqlRecordId: recordMapping.targetId,
              sourceUrl: attUrl,
              targetUrl: sapResult.url,
              contentType: attMetadata.contentType,
              sizeBytes: attMetadata.size,
              status: "success",
              migratedAt: new Date(),
            }]);

            migrated++;
            logger.success(`[Stage 4] Attachment linked to PostgreSQL record`, {
              attachment: attMetadata.attachmentName,
              postgresqlRecordId: recordMapping.targetId,
              sapUrl: sapResult.url,
            });
          } else {
            failed++;
            logger.error(`[Stage 4] Failed to upload attachment to SAP`, {
              attachment: attMetadata.attachmentName,
              error: sapResult.error,
              code: ERROR_CODES.MIGRATION_FAILED,
            });

            await createAttachmentMigrations([{
              executionId,
              projectId,
              documentId: doc.docId,
              attachmentName: attMetadata.attachmentName,
              postgresqlRecordId: recordMapping.targetId,
              sourceUrl: attUrl,
              contentType: attMetadata.contentType,
              sizeBytes: attMetadata.size,
              status: "failed",
              errorMessage: sapResult.error,
            }]);
          }
        } catch (error) {
          failed++;
          logger.error(`[Stage 4] Attachment migration error`, {
            documentId: doc.docId,
            attachment: attMetadata.attachmentName,
            error,
            code: ERROR_CODES.MIGRATION_FAILED,
          });

          if (config.errorHandling === "fail-fast") {
            throw error;
          }
        }
      }
    }

    logger.success(`[Stage 4] Attachment migration completed`, {
      migrated,
      failed,
    });

    return { migrated, failed };
  } catch (error) {
    logger.error(`[Stage 4] Attachment migration failed`, error);
    return { migrated, failed };
  }
}
