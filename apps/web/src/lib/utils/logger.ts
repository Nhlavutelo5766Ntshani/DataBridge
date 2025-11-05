type LogLevel = "info" | "warn" | "error" | "debug" | "success";

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Enhanced logger utility for structured, color-coded logging
 * Only logs in development environment
 */
class Logger {
  /**
   * Log a success message (for successful operations)
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  success(message: string, meta?: Record<string, unknown>): void {
    this.log("success", message, meta);
  }

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
    const errorDetails = this.extractErrorDetails(error);
    this.log("error", message, errorDetails);
  }

  /**
   * Log a debug message (only in development)
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, meta);
    }
  }

  /**
   * Extract detailed information from error objects
   * @param error - The error to extract details from
   * @returns Formatted error details
   */
  private extractErrorDetails(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      };
    }
    return { error };
  }

  /**
   * Format metadata for display
   * @param meta - Metadata object
   * @returns Formatted string
   */
  private formatMeta(meta: Record<string, unknown>): string {
    try {
      return JSON.stringify(meta, null, 2);
    } catch {
      return String(meta);
    }
  }

  /**
   * Get color for log level
   * @param level - The log level
   * @returns ANSI color code
   */
  private getColor(level: LogLevel): string {
    switch (level) {
      case "success":
        return colors.green;
      case "info":
        return colors.cyan;
      case "warn":
        return colors.yellow;
      case "error":
        return colors.red;
      case "debug":
        return colors.gray;
      default:
        return colors.reset;
    }
  }

  /**
   * Get emoji for log level
   * @param level - The log level
   * @returns Emoji string
   */
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "❌";
      case "debug":
        return "🔍";
      default:
        return "";
    }
  }

  /**
   * Internal log method with color coding and formatting
   * @param level - The log level
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const timestamp = new Date().toISOString();
    const color = this.getColor(level);
    const emoji = this.getEmoji(level);
    const levelLabel = level.toUpperCase().padEnd(7);

    const header = `${colors.gray}[${timestamp}]${colors.reset} ${emoji} ${color}${colors.bright}${levelLabel}${colors.reset}`;
    const body = `${color}${message}${colors.reset}`;

    if (meta && Object.keys(meta).length > 0) {
      const metaFormatted = this.formatMeta(meta);
      // Use console.error for errors to show in red in terminal
      if (level === "error") {
        console.error(`${header} ${body}`);
        console.error(`${colors.dim}${metaFormatted}${colors.reset}`);
      } else {
        console.log(`${header} ${body}`);
        console.log(`${colors.dim}${metaFormatted}${colors.reset}`);
      }
    } else {
      if (level === "error") {
        console.error(`${header} ${body}`);
      } else {
        console.log(`${header} ${body}`);
      }
    }
  }
}

export const logger = new Logger();

