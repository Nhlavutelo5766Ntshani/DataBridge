import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Execution API Endpoints', () => {
  const BASE_URL = 'http://localhost:3000';
  let testExecutionId: string;

  beforeAll(() => {
    testExecutionId = `test-exec-${Date.now()}`;
  });

  describe('POST /api/executions/start', () => {
    it('should start a new execution', async () => {
      const response = await fetch(`${BASE_URL}/api/executions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 'test-project-id',
          executionId: testExecutionId,
          config: {
            projectId: 'test-project-id',
            executionId: testExecutionId,
            batchSize: 1000,
            parallelism: 4,
            errorHandling: 'fail-fast',
            validateData: true,
            staging: {
              databaseUrl: process.env.STAGING_DATABASE_URL || '',
              schemaName: 'staging',
              tablePrefix: 'stg_',
              cleanupAfterMigration: false,
            },
            retryAttempts: 3,
            retryDelayMs: 5000,
          },
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.executionId).toBeDefined();
      expect(data.jobIds).toBeDefined();
      expect(Array.isArray(data.jobIds)).toBe(true);
    }, 10000);

    it('should return 400 for missing projectId', async () => {
      const response = await fetch(`${BASE_URL}/api/executions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          executionId: testExecutionId,
          config: {},
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/executions/[id]/status', () => {
    it('should return execution status', async () => {
      const response = await fetch(
        `${BASE_URL}/api/executions/${testExecutionId}/status`
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.executionId).toBe(testExecutionId);
      expect(data.status).toBeDefined();
      expect(data.stages).toBeDefined();
      expect(Array.isArray(data.stages)).toBe(true);
    });

    it('should return 404 for non-existent execution', async () => {
      const response = await fetch(
        `${BASE_URL}/api/executions/non-existent-id/status`
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/executions/[id]/pause', () => {
    it('should pause the queue', async () => {
      const response = await fetch(
        `${BASE_URL}/api/executions/${testExecutionId}/pause`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('paused');
    });
  });

  describe('POST /api/executions/[id]/resume', () => {
    it('should resume the queue', async () => {
      const response = await fetch(
        `${BASE_URL}/api/executions/${testExecutionId}/resume`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('resumed');
    });
  });

  describe('POST /api/executions/[id]/cancel', () => {
    it('should cancel execution', async () => {
      const response = await fetch(
        `${BASE_URL}/api/executions/${testExecutionId}/cancel`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('cancelled');
    });
  });

  describe('GET /api/executions/history', () => {
    it('should return execution history', async () => {
      const response = await fetch(`${BASE_URL}/api/executions/history`);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.executions).toBeDefined();
      expect(Array.isArray(data.executions)).toBe(true);
    });

    it('should return executions with correct structure', async () => {
      const response = await fetch(`${BASE_URL}/api/executions/history`);
      const data = await response.json();

      if (data.executions.length > 0) {
        const execution = data.executions[0];
        expect(execution).toHaveProperty('id');
        expect(execution).toHaveProperty('projectId');
        expect(execution).toHaveProperty('projectName');
        expect(execution).toHaveProperty('status');
        expect(execution).toHaveProperty('startTime');
        expect(execution).toHaveProperty('recordsProcessed');
        expect(execution).toHaveProperty('recordsFailed');
        expect(execution).toHaveProperty('progress');
      }
    });
  });

  describe('GET /api/executions/queue-stats', () => {
    it('should return queue statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/executions/queue-stats`);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats).toHaveProperty('waiting');
      expect(data.stats).toHaveProperty('active');
      expect(data.stats).toHaveProperty('completed');
      expect(data.stats).toHaveProperty('failed');
      expect(data.stats).toHaveProperty('delayed');
      expect(data.stats).toHaveProperty('total');
    });

    it('should return numeric values for stats', async () => {
      const response = await fetch(`${BASE_URL}/api/executions/queue-stats`);
      const data = await response.json();

      expect(typeof data.stats.waiting).toBe('number');
      expect(typeof data.stats.active).toBe('number');
      expect(typeof data.stats.completed).toBe('number');
      expect(typeof data.stats.failed).toBe('number');
      expect(typeof data.stats.delayed).toBe('number');
      expect(typeof data.stats.total).toBe('number');
    });
  });
});

