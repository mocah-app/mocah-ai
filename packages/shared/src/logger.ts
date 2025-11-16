export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error;
  context: LogContext;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, error, context } = entry;
    const timestamp = new Date().toISOString();
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context.component) {
      logMessage += ` | Component: ${context.component}`;
    }
    
    if (context.action) {
      logMessage += ` | Action: ${context.action}`;
    }
    
    if (context.userId) {
      logMessage += ` | User: ${context.userId}`;
    }
    
    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (error.name) {
        logMessage += ` (${error.name})`;
      }
    }
    
    return logMessage;
  }

  private logToConsole(entry: LogEntry): void {
    const formattedMessage = this.formatLogEntry(entry);
    const { level, error, context } = entry;

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage, { context, error });
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, { context, error });
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, { context, error });
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage, { context, error, stack: error?.stack });
        break;
    }
  }

  private async logToExternal(entry: LogEntry): Promise<void> {
    // In production, you might want to send logs to an external service
    // like Sentry, LogRocket, or your own logging service
    if (!this.isDevelopment && entry.level >= LogLevel.ERROR) {
      try {
        // Example: Send to your API endpoint
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
      } catch (error) {
        console.error('Failed to send log to external service:', error);
      }
    }
  }

  private createContext(additionalContext: Partial<LogContext> = {}): LogContext {
    return {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...additionalContext
    };
  }

  debug(message: string, context: Partial<LogContext> = {}, error?: Error): void {
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      error,
      context: this.createContext(context)
    };
    this.logToConsole(entry);
  }

  info(message: string, context: Partial<LogContext> = {}, error?: Error): void {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      error,
      context: this.createContext(context)
    };
    this.logToConsole(entry);
  }

  warn(message: string, context: Partial<LogContext> = {}, error?: Error): void {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      error,
      context: this.createContext(context)
    };
    this.logToConsole(entry);
  }

  error(message: string, context: Partial<LogContext> = {}, error?: Error): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      error,
      context: this.createContext(context),
      stack: error?.stack
    };
    this.logToConsole(entry);
    this.logToExternal(entry);
  }

  critical(message: string, context: Partial<LogContext> = {}, error?: Error): void {
    const entry: LogEntry = {
      level: LogLevel.CRITICAL,
      message,
      error,
      context: this.createContext(context),
      stack: error?.stack
    };
    this.logToConsole(entry);
    this.logToExternal(entry);
  }

  // Specialized logging methods for common scenarios
  logAuthError(message: string, error: Error, context: Partial<LogContext> = {}): void {
    this.error(`Authentication Error: ${message}`, {
      component: 'auth',
      action: 'login',
      ...context
    }, error);
  }

  logValidationError(message: string, context: Partial<LogContext> = {}): void {
    this.warn(`Validation Error: ${message}`, {
      component: 'form',
      action: 'validation',
      ...context
    });
  }

  logNetworkError(message: string, error: Error, context: Partial<LogContext> = {}): void {
    this.error(`Network Error: ${message}`, {
      component: 'api',
      action: 'request',
      ...context
    }, error);
  }
}

export const logger = new Logger();

