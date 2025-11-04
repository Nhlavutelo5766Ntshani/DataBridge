type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Simple logger utility for structured logging
 */
class Logger {
  /**
   * Log an info message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  /**
   * Log an error message
   * @param message - The message to log
   * @param error - The error object
   */
  error(message: string, error?: unknown): void {
    this.log("error", message, { error });
  }

  /**
   * Log a debug message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, meta);
    }
  }

  /**
   * Internal log method
   * @param level - The log level
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  private log(
    _level: LogLevel,
    _message: string,
    _meta?: Record<string, unknown>
  ): void {
    if (process.env.NODE_ENV === "production") {
      return;
    }
  }
}

export const logger = new Logger();

