import axios, { type AxiosInstance } from "axios";
import FormData from "form-data";
import type { AttachmentMetadata, AttachmentMigrationResult } from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";

/**
 * SAP Object Store Configuration
 */
type SAPConfig = {
  apiUrl: string;
  apiKey: string;
  customApiKey: string; // User's custom header value
  timeout: number;
  maxRetries: number;
};

/**
 * SAP Object Store Client
 * Handles file uploads to SAP integration suite
 */
export class SAPObjectStoreClient {
  private config: SAPConfig;
  private client: AxiosInstance;

  constructor() {
    const apiUrl = process.env.SAP_OBJECT_STORE_URL;
    const apiKey = process.env.SAP_OBJECT_STORE_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error(
        "SAP_OBJECT_STORE_URL and SAP_OBJECT_STORE_API_KEY environment variables are required"
      );
    }

    this.config = {
      apiUrl,
      apiKey,
      customApiKey: "6axnGqA0Al09VFynfGfMUPgBygJMO9CG", // User's specific requirement
      timeout: 300000, // 5 minutes
      maxRetries: 3,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        apiKey: this.config.customApiKey,
      },
    });

    logger.info(`SAP Object Store client initialized`, {
      apiUrl: this.config.apiUrl,
    });
  }

  /**
   * Upload a single attachment to SAP Object Store
   * @param documentId - Source document ID
   * @param attachmentData - File buffer
   * @param metadata - Attachment metadata
   * @returns Upload result with SAP URL
   */
  async uploadAttachment(
    documentId: string,
    attachmentData: Buffer,
    metadata: AttachmentMetadata
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    logger.info(`Uploading attachment to SAP`, {
      documentId,
      attachmentName: metadata.attachmentName,
      size: metadata.size,
      contentType: metadata.contentType,
    });

    try {
      const formData = new FormData();
      formData.append("file", attachmentData, {
        filename: metadata.attachmentName,
        contentType: metadata.contentType,
      });
      formData.append("documentId", documentId);
      formData.append("contentType", metadata.contentType);
      formData.append("size", metadata.size.toString());

      const response = await this.client.post("/upload", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const sapUrl = response.data.url || response.data.fileUrl;

      logger.success(`Attachment uploaded to SAP`, {
        documentId,
        attachmentName: metadata.attachmentName,
        sapUrl,
      });

      return {
        success: true,
        url: sapUrl,
      };
    } catch (error) {
      logger.error(`Failed to upload attachment to SAP`, {
        documentId,
        attachmentName: metadata.attachmentName,
        error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Upload attachment with retry logic
   * @param documentId - Source document ID
   * @param attachmentData - File buffer
   * @param metadata - Attachment metadata
   * @param attempt - Current attempt number
   * @returns Upload result
   */
  async uploadWithRetry(
    documentId: string,
    attachmentData: Buffer,
    metadata: AttachmentMetadata,
    attempt = 1
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const result = await this.uploadAttachment(
      documentId,
      attachmentData,
      metadata
    );

    if (result.success || attempt >= this.config.maxRetries) {
      return result;
    }

    logger.warn(`Retrying attachment upload (attempt ${attempt + 1})`, {
      documentId,
      attachmentName: metadata.attachmentName,
    });

    // Exponential backoff
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return this.uploadWithRetry(
      documentId,
      attachmentData,
      metadata,
      attempt + 1
    );
  }

  /**
   * Batch upload multiple attachments
   * @param attachments - Array of attachments to upload
   * @param concurrency - Number of concurrent uploads
   * @returns Array of upload results
   */
  async batchUpload(
    attachments: Array<{
      documentId: string;
      data: Buffer;
      metadata: AttachmentMetadata;
    }>,
    concurrency = 5
  ): Promise<AttachmentMigrationResult[]> {
    logger.info(`Starting batch upload to SAP`, {
      totalAttachments: attachments.length,
      concurrency,
    });

    const results: AttachmentMigrationResult[] = [];
    const chunks = this.chunkArray(attachments, concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (attachment) => {
          const result = await this.uploadWithRetry(
            attachment.documentId,
            attachment.data,
            attachment.metadata
          );

          return {
            documentId: attachment.documentId,
            attachmentName: attachment.metadata.attachmentName,
            success: result.success,
            targetUrl: result.url,
            error: result.error,
          };
        })
      );

      results.push(...chunkResults);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    logger.success(`Batch upload completed`, {
      total: results.length,
      successful,
      failed,
    });

    return results;
  }

  /**
   * Download attachment from SAP Object Store
   * @param sapUrl - SAP file URL
   * @returns File buffer
   */
  async downloadAttachment(sapUrl: string): Promise<Buffer> {
    logger.info(`Downloading attachment from SAP`, { sapUrl });

    try {
      const response = await this.client.get(sapUrl, {
        responseType: "arraybuffer",
      });

      logger.success(`Attachment downloaded from SAP`, { sapUrl });

      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Failed to download attachment from SAP`, {
        sapUrl,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete attachment from SAP Object Store
   * @param sapUrl - SAP file URL
   * @returns Success status
   */
  async deleteAttachment(sapUrl: string): Promise<boolean> {
    logger.info(`Deleting attachment from SAP`, { sapUrl });

    try {
      await this.client.delete(sapUrl);

      logger.success(`Attachment deleted from SAP`, { sapUrl });

      return true;
    } catch (error) {
      logger.error(`Failed to delete attachment from SAP`, {
        sapUrl,
        error,
      });
      return false;
    }
  }

  /**
   * Check if attachment exists in SAP Object Store
   * @param sapUrl - SAP file URL
   * @returns Existence status
   */
  async checkAttachmentExists(sapUrl: string): Promise<boolean> {
    try {
      await this.client.head(sapUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get attachment metadata from SAP
   * @param sapUrl - SAP file URL
   * @returns Attachment metadata
   */
  async getAttachmentMetadata(sapUrl: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    try {
      const response = await this.client.head(sapUrl);

      return {
        size: parseInt(response.headers["content-length"] || "0"),
        contentType: response.headers["content-type"] || "application/octet-stream",
        lastModified: new Date(response.headers["last-modified"] || Date.now()),
      };
    } catch (error) {
      logger.error(`Failed to get attachment metadata`, { sapUrl, error });
      return null;
    }
  }

  /**
   * Chunk array into smaller arrays
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Global SAP Object Store client instance
 */
let sapClient: SAPObjectStoreClient | null = null;

/**
 * Get or create SAP Object Store client instance
 * @returns SAP client instance
 */
export function getSAPClient(): SAPObjectStoreClient {
  if (!sapClient) {
    sapClient = new SAPObjectStoreClient();
  }
  return sapClient;
}

