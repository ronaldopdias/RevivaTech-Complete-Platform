/**
 * Smart Console Manager
 * Manages all console output throughout the application
 * Handles production console cleanup and enhanced development logging
 * Integrates with existing error reporting and debug systems
 * Auto-uploads debug events for analysis
 */

import { debugUploadService, type DebugEvent } from '../debug/debug-upload-service';

export interface ConsoleEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'table' | 'group' | 'groupEnd';
  message: string;
  args: any[];
  stack?: string;
  context?: {
    url: string;
    userAgent: string;
    component?: string;
    function?: string;
    line?: number;
    column?: number;
  };
  metadata?: {
    performance?: {
      memory?: number;
      timing?: number;
    };
    network?: {
      onLine: boolean;
      effectiveType?: string;
    };
    viewport?: {
      width: number;
      height: number;
    };
  };
}

export interface ConsoleConfig {
  enableInProduction: boolean;
  maxEntries: number;
  persistToStorage: boolean;
  enableStackTraces: boolean;
  enableMetadata: boolean;
  groupingEnabled: boolean;
  enablePerformanceMetrics: boolean;
  enableRemoteLogging: boolean;
  logLevels: ConsoleEntry['level'][];
}

class ConsoleManager {
  private entries: ConsoleEntry[] = [];
  private originalConsole: typeof console;
  private groupStack: string[] = [];
  private config: ConsoleConfig;
  private subscribers: Array<(entry: ConsoleEntry) => void> = [];
  private pendingGroups: Map<string, ConsoleEntry[]> = new Map();
  
  constructor(config?: Partial<ConsoleConfig>) {
    this.config = {
      enableInProduction: false,
      maxEntries: 1000,
      persistToStorage: true,
      enableStackTraces: true,
      enableMetadata: true,
      groupingEnabled: true,
      enablePerformanceMetrics: true,
      enableRemoteLogging: false,
      logLevels: ['log', 'error', 'warn', 'info', 'debug', 'trace'],
      ...config,
    };

    // Preserve original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
      trace: console.trace.bind(console),
      table: console.table.bind(console),
      group: console.group.bind(console),
      groupCollapsed: console.groupCollapsed.bind(console),
      groupEnd: console.groupEnd.bind(console),
      clear: console.clear.bind(console),
      count: console.count.bind(console),
      time: console.time.bind(console),
      timeEnd: console.timeEnd.bind(console),
      assert: console.assert.bind(console),
    };

    this.initialize();
  }

  private initialize(): void {
    this.loadPersistedEntries();
    this.overrideConsoleMethods();
    this.setupPerformanceMonitoring();
    this.setupNetworkMonitoring();
  }

  private overrideConsoleMethods(): void {
    const methods: Array<keyof Pick<Console, 'log' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'table'>> = 
      ['log', 'error', 'warn', 'info', 'debug', 'trace', 'table'];

    methods.forEach((method) => {
      (console as any)[method] = (...args: any[]) => {
        this.captureConsoleCall(method, args);
        
        // Only call original console in development or if explicitly enabled in production
        if (process.env.NODE_ENV === 'development' || this.config.enableInProduction) {
          this.originalConsole[method](...args);
        }
      };
    });

    // Handle grouping methods specially
    console.group = (...args: any[]) => {
      const groupName = args.length > 0 ? String(args[0]) : `Group ${Date.now()}`;
      this.groupStack.push(groupName);
      this.captureConsoleCall('group', args);
      
      if (process.env.NODE_ENV === 'development' || this.config.enableInProduction) {
        this.originalConsole.group(...args);
      }
    };

    console.groupCollapsed = (...args: any[]) => {
      const groupName = args.length > 0 ? String(args[0]) : `Group ${Date.now()}`;
      this.groupStack.push(groupName);
      this.captureConsoleCall('group', args);
      
      if (process.env.NODE_ENV === 'development' || this.config.enableInProduction) {
        this.originalConsole.groupCollapsed(...args);
      }
    };

    console.groupEnd = () => {
      this.groupStack.pop();
      this.captureConsoleCall('groupEnd', []);
      
      if (process.env.NODE_ENV === 'development' || this.config.enableInProduction) {
        this.originalConsole.groupEnd();
      }
    };
  }

  private captureConsoleCall(level: ConsoleEntry['level'], args: any[]): void {
    if (!this.config.logLevels.includes(level)) {
      return;
    }

    const entry: ConsoleEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(args),
      args: this.sanitizeArgs(args),
      context: this.getCallContext(),
      metadata: this.config.enableMetadata ? this.getMetadata() : undefined,
    };

    if (this.config.enableStackTraces && (level === 'error' || level === 'warn')) {
      entry.stack = this.getStackTrace();
    }

    this.addEntry(entry);

    // Upload to debug capture system for analysis
    this.uploadToDebugCapture(entry);
  }

  private formatMessage(args: any[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, this.circularReplacer(), 2);
          } catch {
            return '[Object]';
          }
        }
        return String(arg);
      })
      .join(' ');
  }

  private sanitizeArgs(args: any[]): any[] {
    try {
      return JSON.parse(JSON.stringify(args, this.circularReplacer()));
    } catch {
      return args.map(arg => 
        typeof arg === 'object' ? '[Object]' : arg
      );
    }
  }

  private circularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  private getCallContext(): ConsoleEntry['context'] {
    if (typeof window === 'undefined') return undefined;

    const stack = new Error().stack;
    const caller = this.parseStackTrace(stack);
    
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      component: caller?.component,
      function: caller?.function,
      line: caller?.line,
      column: caller?.column,
    };
  }

  private parseStackTrace(stack?: string) {
    if (!stack) return null;
    
    const lines = stack.split('\n');
    // Skip the first few lines which are from this manager
    const relevantLine = lines.find((line, index) => 
      index > 3 && 
      !line.includes('console-manager') && 
      !line.includes('webpack') &&
      line.includes('.tsx')
    );
    
    if (!relevantLine) return null;

    const match = relevantLine.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/) ||
                  relevantLine.match(/at\s+(.+):(\d+):(\d+)/);
                  
    if (match) {
      return {
        function: match[1]?.trim(),
        component: this.extractComponentName(match[2] || match[1]),
        line: parseInt(match[3] || match[2]),
        column: parseInt(match[4] || match[3]),
      };
    }
    
    return null;
  }

  private extractComponentName(path: string): string | undefined {
    const match = path.match(/([^/]+)\.tsx?/);
    return match ? match[1] : undefined;
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    
    const lines = stack.split('\n');
    // Remove the first few lines which are from this manager
    return lines.slice(4).join('\n');
  }

  private getMetadata(): ConsoleEntry['metadata'] {
    if (typeof window === 'undefined') return undefined;

    const metadata: ConsoleEntry['metadata'] = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      network: {
        onLine: navigator.onLine,
      },
    };

    // Performance metadata
    if (this.config.enablePerformanceMetrics && 'performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        metadata.performance = {
          memory: memory.usedJSHeapSize,
          timing: performance.now(),
        };
      }
    }

    // Network connection info
    const connection = (navigator as any).connection;
    if (connection) {
      metadata.network!.effectiveType = connection.effectiveType;
    }

    return metadata;
  }

  private generateId(): string {
    return `console_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private uploadToDebugCapture(entry: ConsoleEntry): void {
    // Convert console entry to debug event format
    const severity = this.mapConsoleLevelToSeverity(entry.level);
    
    const debugEvent: DebugEvent = {
      type: 'console',
      severity,
      source: 'console-manager',
      message: entry.message,
      data: {
        level: entry.level,
        args: entry.args,
        stack: entry.stack,
        context: entry.context,
        metadata: entry.metadata,
        consoleId: entry.id,
      },
      timestamp: entry.timestamp,
    };

    // Upload to debug capture system
    debugUploadService.addEvent(debugEvent);
  }

  private mapConsoleLevelToSeverity(level: ConsoleEntry['level']): DebugEvent['severity'] {
    switch (level) {
      case 'error':
      case 'trace':
        return 'high';
      case 'warn':
        return 'medium';
      case 'info':
      case 'debug':
      case 'log':
      case 'table':
      case 'group':
      case 'groupEnd':
      default:
        return 'low';
    }
  }

  private addEntry(entry: ConsoleEntry): void {
    // Handle grouping
    if (this.config.groupingEnabled && this.groupStack.length > 0) {
      const currentGroup = this.groupStack[this.groupStack.length - 1];
      if (!this.pendingGroups.has(currentGroup)) {
        this.pendingGroups.set(currentGroup, []);
      }
      this.pendingGroups.get(currentGroup)!.push(entry);
      
      // Don't add to main entries yet if we're in a group
      if (entry.level !== 'groupEnd') {
        this.notifySubscribers(entry);
        return;
      }
    }

    this.entries.push(entry);
    
    // Trim entries if we exceed max
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }

    this.notifySubscribers(entry);
    this.persistEntries();

    // Send to remote logging if enabled
    if (this.config.enableRemoteLogging) {
      this.sendToRemoteLogger(entry);
    }
  }

  private notifySubscribers(entry: ConsoleEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        this.originalConsole.error('Error in console subscriber:', error);
      }
    });
  }

  private persistEntries(): void {
    if (!this.config.persistToStorage || typeof window === 'undefined') return;

    try {
      const recentEntries = this.entries.slice(-100); // Store only last 100
      localStorage.setItem('revivatech_console_logs', JSON.stringify(recentEntries));
    } catch (error) {
      // Storage might be full or unavailable
    }
  }

  private loadPersistedEntries(): void {
    if (!this.config.persistToStorage || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('revivatech_console_logs');
      if (stored) {
        const entries = JSON.parse(stored);
        this.entries = entries.map((entry: any) => ({
          ...entry,
          id: entry.id || this.generateId(),
        }));
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMetrics || typeof window === 'undefined') return;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.captureConsoleCall('warn', [
                `🐌 Long Task Detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`,
                { entry }
              ]);
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // PerformanceObserver not supported
      }
    }

    // Monitor memory usage
    setInterval(() => {
      if ('performance' in window && (performance as any).memory) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          this.captureConsoleCall('warn', [
            `🧠 High Memory Usage: ${usedPercent.toFixed(1)}%`,
            { 
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit 
            }
          ]);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor network status changes
    window.addEventListener('online', () => {
      this.captureConsoleCall('info', ['🌐 Network: Back online']);
    });

    window.addEventListener('offline', () => {
      this.captureConsoleCall('warn', ['🌐 Network: Gone offline']);
    });
  }

  private async sendToRemoteLogger(entry: ConsoleEntry): Promise<void> {
    try {
      // Only send errors and warnings to remote service
      if (entry.level === 'error' || entry.level === 'warn') {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      // Silently fail - don't create infinite loop
    }
  }

  // Public API

  /**
   * Get all console entries
   */
  getEntries(limit?: number): ConsoleEntry[] {
    return limit ? this.entries.slice(-limit) : [...this.entries];
  }

  /**
   * Get entries by level
   */
  getEntriesByLevel(level: ConsoleEntry['level']): ConsoleEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  /**
   * Get entries within time range
   */
  getEntriesByTimeRange(startTime: string, endTime: string): ConsoleEntry[] {
    return this.entries.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Search entries by message content
   */
  searchEntries(query: string, caseSensitive = false): ConsoleEntry[] {
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    return this.entries.filter(entry => {
      const message = caseSensitive ? entry.message : entry.message.toLowerCase();
      return message.includes(searchQuery);
    });
  }

  /**
   * Subscribe to new console entries
   */
  subscribe(callback: (entry: ConsoleEntry) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.pendingGroups.clear();
    
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem('revivatech_console_logs');
    }

    if (process.env.NODE_ENV === 'development' || this.config.enableInProduction) {
      this.originalConsole.clear();
    }
  }

  /**
   * Export entries as JSON
   */
  export(): string {
    return JSON.stringify({
      entries: this.entries,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalEntries: this.entries.length,
        config: this.config,
      },
    }, null, 2);
  }

  /**
   * Get statistics about console usage
   */
  getStats(): {
    total: number;
    byLevel: Record<ConsoleEntry['level'], number>;
    timeRange: { start: string; end: string } | null;
    topComponents: Array<{ component: string; count: number }>;
  } {
    const byLevel = this.entries.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1;
      return acc;
    }, {} as Record<ConsoleEntry['level'], number>);

    const componentCounts = this.entries
      .filter(entry => entry.context?.component)
      .reduce((acc, entry) => {
        const component = entry.context!.component!;
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topComponents = Object.entries(componentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([component, count]) => ({ component, count }));

    return {
      total: this.entries.length,
      byLevel,
      timeRange: this.entries.length > 0 ? {
        start: this.entries[0].timestamp,
        end: this.entries[this.entries.length - 1].timestamp,
      } : null,
      topComponents,
    };
  }

  /**
   * Restore original console methods
   */
  restore(): void {
    Object.assign(console, this.originalConsole);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConsoleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const consoleManager = new ConsoleManager();

// Auto-initialize in development, manual in production
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    // Auto-enable in development
    consoleManager.updateConfig({ enableInProduction: false });
  } else {
    // In production, only enable if explicitly requested
    const debugMode = localStorage.getItem('revivatech_debug_mode') === 'true';
    consoleManager.updateConfig({ enableInProduction: debugMode });
  }
}

// Convenience exports
export const getConsoleLogs = (limit?: number) => consoleManager.getEntries(limit);
export const searchConsoleLogs = (query: string) => consoleManager.searchEntries(query);
export const clearConsole = () => consoleManager.clear();
export const exportConsoleLogs = () => consoleManager.export();
export const subscribeToConsole = (callback: (entry: ConsoleEntry) => void) => 
  consoleManager.subscribe(callback);

export default consoleManager;