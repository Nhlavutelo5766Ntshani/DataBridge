/**
 * Standard query response type for all server actions
 */
export type QueryResponse<T> = {
  success: boolean;
  data?: T | null;
  error?: string | string[] | null;
  warning?: string | string[] | null;
  code?: string | null;
};

