/**
 * Error Logger Utility
 * Captures console errors and stores them for feedback/telemetry
 */

export interface LoggedError {
  message: string;
  stack?: string;
  timestamp: string;
  type: 'error' | 'warning' | 'unhandledRejection';
}

class ErrorLogger {
  private errors: LoggedError[] = [];
  private maxErrors = 10; // Keep last 10 errors
  private isListening = false;

  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;

  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
  }

  /**
   * Start capturing console errors
   */
  public startListening(): void {
    if (this.isListening) return;

    this.isListening = true;

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.logError('error', args);
      this.originalConsoleError.apply(console, args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.logError('warning', args);
      this.originalConsoleWarn.apply(console, args);
    };

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Capture global errors
    window.addEventListener('error', this.handleGlobalError);
  }

  /**
   * Stop capturing console errors
   */
  public stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;

    // Restore original console methods
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;

    // Remove event listeners
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  /**
   * Log an error
   */
  private logError(type: 'error' | 'warning' | 'unhandledRejection', args: any[]): void {
    try {
      const message = args.map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object') {
          return JSON.stringify(arg);
        }
        return String(arg);
      }).join(' ');

      const stack = args.find(arg => arg instanceof Error)?.stack;

      const loggedError: LoggedError = {
        message: message.substring(0, 500), // Limit message length
        stack: stack?.substring(0, 1000), // Limit stack length
        timestamp: new Date().toISOString(),
        type,
      };

      this.errors.push(loggedError);

      // Keep only the last maxErrors errors
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(-this.maxErrors);
      }
    } catch (e) {
      // Fail silently to avoid infinite loops
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.logError('unhandledRejection', [event.reason]);
  };

  /**
   * Handle global errors
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    this.logError('error', [event.error || event.message]);
  };

  /**
   * Get all logged errors
   */
  public getErrors(): LoggedError[] {
    return [...this.errors]; // Return a copy
  }

  /**
   * Get recent errors (last N errors)
   */
  public getRecentErrors(count: number = 5): LoggedError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear all logged errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if there are any errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get error summary for telemetry
   */
  public getErrorSummary(): {
    hasErrors: boolean;
    errorCount: number;
    warningCount: number;
    recentErrors: string[];
  } {
    const errorCount = this.errors.filter(e => e.type === 'error' || e.type === 'unhandledRejection').length;
    const warningCount = this.errors.filter(e => e.type === 'warning').length;
    const recentErrors = this.getRecentErrors(3).map(e =>
      `[${e.type}] ${e.message}`.substring(0, 200)
    );

    return {
      hasErrors: this.hasErrors(),
      errorCount,
      warningCount,
      recentErrors,
    };
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Auto-start listening when the module is imported
errorLogger.startListening();
