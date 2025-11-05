import type {
  ETLExecution,
  ETLPipelineConfig,
  StageResult,
} from "@/lib/types/etl";
import { logger } from "@/lib/utils/logger";
import { extractToStaging } from "./stage1-extract";
import { transformAndCleanse } from "./stage2-transform";
import { loadDimensions } from "./stage3-load-dimensions";
import { loadFacts } from "./stage4-load-facts";
import { validateData } from "./stage5-validate";
import { generateMigrationReport } from "./stage6-generate-report";

/**
 * Main ETL Migration Controller
 * Orchestrates the 6-stage ETL pipeline for data migration
 */
export class MigrationController {
  private config: ETLPipelineConfig;

  constructor(config: ETLPipelineConfig) {
    this.config = config;
  }

  /**
   * Execute the complete 6-stage ETL pipeline
   * @returns ETL execution result with all stage details
   */
  async execute(): Promise<ETLExecution> {
    const { projectId, executionId } = this.config;
    const startTime = new Date();

    logger.info(`Starting ETL pipeline execution`, {
      projectId,
      executionId,
      batchSize: this.config.batchSize,
      parallelism: this.config.parallelism,
    });

    const execution: ETLExecution = {
      executionId,
      projectId,
      status: "running",
      currentStage: "extract",
      stages: [
        {
          stageId: "extract",
          stageName: "Extract to Staging",
          status: "pending",
        },
        {
          stageId: "transform",
          stageName: "Transform & Cleanse",
          status: "pending",
        },
        {
          stageId: "load-dimensions",
          stageName: "Load Dimensions",
          status: "pending",
        },
        {
          stageId: "load-facts",
          stageName: "Load Facts",
          status: "pending",
        },
        {
          stageId: "validate",
          stageName: "Validate Data",
          status: "pending",
        },
        {
          stageId: "report",
          stageName: "Generate Report",
          status: "pending",
        },
      ],
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      progress: 0,
      startTime,
    };

    try {
      // Stage 1: Extract to Staging
      await this.executeStage(execution, "extract", () =>
        extractToStaging(projectId, executionId, this.config)
      );

      // Stage 2: Transform & Cleanse
      await this.executeStage(execution, "transform", () =>
        transformAndCleanse(projectId, executionId, this.config)
      );

      // Stage 3: Load Dimensions
      await this.executeStage(execution, "load-dimensions", () =>
        loadDimensions(projectId, executionId, this.config)
      );

      // Stage 4: Load Facts
      await this.executeStage(execution, "load-facts", () =>
        loadFacts(projectId, executionId, this.config)
      );

      // Stage 5: Validate Data
      await this.executeStage(execution, "validate", () =>
        validateData(projectId, executionId, this.config)
      );

      // Stage 6: Generate Report
      await this.executeStage(execution, "report", () =>
        generateMigrationReport(projectId, executionId)
      );

      execution.status = "completed";
      execution.endTime = new Date();
      execution.progress = 100;

      logger.success(`ETL pipeline completed successfully`, {
        executionId,
        duration: execution.endTime.getTime() - startTime.getTime(),
        totalRecords: execution.totalRecords,
        processedRecords: execution.processedRecords,
        failedRecords: execution.failedRecords,
      });

      return execution;
    } catch (error) {
      execution.status = "failed";
      execution.endTime = new Date();
      execution.errors = execution.errors || [];
      execution.errors.push(
        error instanceof Error ? error.message : String(error)
      );

      logger.error(`ETL pipeline failed`, error);

      return execution;
    }
  }

  /**
   * Execute a single ETL stage and update execution status
   * @param execution - Current execution state
   * @param stageId - Stage identifier
   * @param stageFn - Stage execution function
   */
  private async executeStage(
    execution: ETLExecution,
    stageId: string,
    stageFn: () => Promise<StageResult>
  ): Promise<void> {
    const stage = execution.stages.find((s) => s.stageId === stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    execution.currentStage = stageId;
    stage.status = "running";
    stage.startTime = new Date();

    logger.info(`Starting stage: ${stage.stageName}`, {
      executionId: execution.executionId,
      stageId,
    });

    try {
      const result = await stageFn();

      stage.status = result.success ? "completed" : "failed";
      stage.endTime = new Date();
      stage.duration = result.duration;
      stage.recordsProcessed = result.recordsProcessed;
      stage.recordsFailed = result.recordsFailed;
      stage.metadata = result.metadata;

      if (!result.success) {
        stage.errorMessage = result.error;
        
        if (this.config.errorHandling === "fail-fast") {
          throw new Error(`Stage ${stageId} failed: ${result.error}`);
        } else {
          logger.warn(`Stage ${stageId} failed but continuing`, {
            error: result.error,
          });
        }
      }

      execution.processedRecords += result.recordsProcessed;
      execution.failedRecords += result.recordsFailed;
      execution.progress = this.calculateProgress(execution);

      logger.success(`Stage completed: ${stage.stageName}`, {
        duration: result.duration,
        recordsProcessed: result.recordsProcessed,
        recordsFailed: result.recordsFailed,
      });
    } catch (error) {
      stage.status = "failed";
      stage.endTime = new Date();
      stage.errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error(`Stage failed: ${stage.stageName}`, error);

      throw error;
    }
  }

  /**
   * Calculate overall execution progress percentage
   * @param execution - Current execution state
   * @returns Progress percentage (0-100)
   */
  private calculateProgress(execution: ETLExecution): number {
    const totalStages = execution.stages.length;
    const completedStages = execution.stages.filter(
      (s) => s.status === "completed"
    ).length;

    return Math.round((completedStages / totalStages) * 100);
  }

  /**
   * Pause the current ETL execution
   */
  async pause(): Promise<void> {
    logger.info(`Pausing ETL execution`, {
      executionId: this.config.executionId,
    });
    // Implementation will depend on BullMQ job control
  }

  /**
   * Resume a paused ETL execution
   */
  async resume(): Promise<void> {
    logger.info(`Resuming ETL execution`, {
      executionId: this.config.executionId,
    });
    // Implementation will depend on BullMQ job control
  }

  /**
   * Cancel the current ETL execution
   */
  async cancel(): Promise<void> {
    logger.info(`Cancelling ETL execution`, {
      executionId: this.config.executionId,
    });
    // Implementation will depend on BullMQ job control
  }
}

/**
 * Execute ETL pipeline for a project
 * @param config - ETL pipeline configuration
 * @returns ETL execution result
 */
export async function executeETLPipeline(
  config: ETLPipelineConfig
): Promise<ETLExecution> {
  const controller = new MigrationController(config);
  return await controller.execute();
}

