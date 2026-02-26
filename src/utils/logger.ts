/**
 * Centralized logging service for the application
 * Use this instead of console.log/console.error/console.warn
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 100;

  private createEntry(level: LogLevel, message: string, data?: any, stack?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
      ...(stack && { stack }),
    };
  }

  private logToConsole(level: LogLevel, message: string, data?: any) {
    if (!this.isDevelopment) return;

    const prefix = `[${level.toUpperCase()}]`;
    const styles = {
      debug: 'color: gray',
      info: 'color: blue',
      warn: 'color: orange',
      error: 'color: red',
    };

    if (console[level]) {
      if (data) {
        console[level](`%c${prefix} ${message}`, styles[level], data);
      } else {
        console[level](`%c${prefix} ${message}`, styles[level]);
      }
    }
  }

  private addToMemory(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }
  }

  debug(message: string, data?: any) {
    const entry = this.createEntry('debug', message, data);
    this.logToConsole('debug', message, data);
    this.addToMemory(entry);
  }

  info(message: string, data?: any) {
    const entry = this.createEntry('info', message, data);
    this.logToConsole('info', message, data);
    this.addToMemory(entry);
  }

  warn(message: string, data?: any) {
    const entry = this.createEntry('warn', message, data);
    this.logToConsole('warn', message, data);
    this.addToMemory(entry);
  }

  error(message: string, error?: any, data?: any) {
    const stack = error?.stack || (error instanceof Error ? error.message : '');
    const entry = this.createEntry('error', message, { error, ...data }, stack);
    this.logToConsole('error', message, { error, ...data });
    this.addToMemory(entry);
  }

  /**
   * Get all logged entries for debugging/analytics
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logged entries
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON string (useful for error reporting)
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
export default logger;
