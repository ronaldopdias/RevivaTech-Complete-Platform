/**
 * Local Log File Writer
 * Creates downloadable debug log files on the client side
 * Provides categorized logs for easy analysis
 * Integrates with the debug upload service for local file generation
 */

import { debugUploadService, type DebugEvent } from './debug-upload-service';

export interface LogFileConfig {
  enabled: boolean;
  maxFileSizeKB: number;
  categorizeByType: boolean;
  categorizeBySource: boolean;
  includeDateInFilename: boolean;
  autoDownload: boolean;
  downloadThreshold: number; // Number of events before auto-download
}

export interface LogCategory {
  name: string;
  events: DebugEvent[];
  filename: string;
  size: number;
}

export interface LogFileStats {
  totalEvents: number;
  totalSizeKB: number;
  categories: LogCategory[];
  lastGenerated: string | null;
  autoDownloadCount: number;
}

class LocalLogWriter {
  private config: LogFileConfig;
  private eventQueue: DebugEvent[] = [];
  private stats: LogFileStats;
  private eventCount = 0;

  constructor(config?: Partial<LogFileConfig>) {
    this.config = {
      enabled: true,
      maxFileSizeKB: 1024, // 1MB max file size
      categorizeByType: true,
      categorizeBySource: false,
      includeDateInFilename: true,
      autoDownload: false,
      downloadThreshold: 100,
      ...config,
    };

    this.stats = {
      totalEvents: 0,
      totalSizeKB: 0,
      categories: [],
      lastGenerated: null,
      autoDownloadCount: 0,
    };

    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    // Subscribe to debug upload service events
    debugUploadService.subscribe((stats) => {
      // Get recent events for local file generation
      this.processUploadedEvents();
    });

    // Auto-download on threshold if enabled
    if (this.config.autoDownload) {
      setInterval(() => {
        if (this.eventCount >= this.config.downloadThreshold) {
          this.generateAndDownloadLogs();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private async processUploadedEvents(): Promise<void> {
    // This would ideally get events from the upload service
    // For now, we'll create a method to manually add events
  }

  /**
   * Add debug event to local log queue
   */
  addEvent(event: DebugEvent): void {
    if (!this.config.enabled) return;

    this.eventQueue.push(event);
    this.eventCount++;
    this.stats.totalEvents++;

    // Auto-download check
    if (this.config.autoDownload && this.eventCount >= this.config.downloadThreshold) {
      this.generateAndDownloadLogs();
    }
  }

  /**
   * Generate categorized log files
   */
  generateLogFiles(): LogCategory[] {
    if (this.eventQueue.length === 0) {
      return [];
    }

    const categories: LogCategory[] = [];

    if (this.config.categorizeByType) {
      // Group by event type
      const typeGroups = this.groupEventsByType();
      for (const [type, events] of typeGroups.entries()) {
        categories.push(this.createLogCategory(`${type}-errors`, events));
      }
    }

    if (this.config.categorizeBySource) {
      // Group by source
      const sourceGroups = this.groupEventsBySource();
      for (const [source, events] of sourceGroups.entries()) {
        categories.push(this.createLogCategory(`${source}-logs`, events));
      }
    }

    // Always create a comprehensive log
    categories.push(this.createLogCategory('debug-complete', this.eventQueue));

    // Filter out empty categories and check size limits
    const validCategories = categories.filter(cat => 
      cat.events.length > 0 && cat.size <= this.config.maxFileSizeKB * 1024
    );

    this.stats.categories = validCategories;
    this.stats.lastGenerated = new Date().toISOString();
    this.stats.totalSizeKB = validCategories.reduce((sum, cat) => sum + cat.size / 1024, 0);

    return validCategories;
  }

  private groupEventsByType(): Map<string, DebugEvent[]> {
    const groups = new Map<string, DebugEvent[]>();
    
    this.eventQueue.forEach(event => {
      if (!groups.has(event.type)) {
        groups.set(event.type, []);
      }
      groups.get(event.type)!.push(event);
    });

    return groups;
  }

  private groupEventsBySource(): Map<string, DebugEvent[]> {
    const groups = new Map<string, DebugEvent[]>();
    
    this.eventQueue.forEach(event => {
      if (!groups.has(event.source)) {
        groups.set(event.source, []);
      }
      groups.get(event.source)!.push(event);
    });

    return groups;
  }

  private createLogCategory(name: string, events: DebugEvent[]): LogCategory {
    const dateStr = this.config.includeDateInFilename 
      ? new Date().toISOString().split('T')[0] 
      : '';
    
    const filename = dateStr 
      ? `${name}-${dateStr}.log`
      : `${name}.log`;

    const content = this.formatEventsAsLog(events);
    const size = new Blob([content]).size;

    return {
      name,
      events: [...events],
      filename,
      size,
    };
  }

  private formatEventsAsLog(events: DebugEvent[]): string {
    const header = [
      '='.repeat(80),
      `Debug Log Generated: ${new Date().toISOString()}`,
      `Total Events: ${events.length}`,
      `RevivaTech Debug Capture System`,
      '='.repeat(80),
      '',
    ].join('\n');

    const logEntries = events
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => this.formatEventAsLogEntry(event))
      .join('\n\n');

    const footer = [
      '',
      '='.repeat(80),
      `End of Debug Log - ${events.length} events`,
      '='.repeat(80),
    ].join('\n');

    return header + logEntries + footer;
  }

  private formatEventAsLogEntry(event: DebugEvent): string {
    const lines = [
      `[${event.timestamp}] [${event.severity.toUpperCase()}] [${event.type}] [${event.source}]`,
      `Message: ${event.message}`,
    ];

    if (event.data) {
      lines.push(`Data: ${JSON.stringify(event.data, null, 2)}`);
    }

    if (event.sessionId) {
      lines.push(`Session: ${event.sessionId}`);
    }

    if (event.userId) {
      lines.push(`User: ${event.userId}`);
    }

    return lines.join('\n');
  }

  /**
   * Download a specific log category as a file
   */
  downloadLogFile(category: LogCategory): void {
    const content = this.formatEventsAsLog(category.events);
    this.downloadFile(category.filename, content);
  }

  /**
   * Generate and download all log files
   */
  generateAndDownloadLogs(): void {
    const categories = this.generateLogFiles();
    
    categories.forEach(category => {
      this.downloadLogFile(category);
    });

    // Clear processed events
    this.eventQueue = [];
    this.eventCount = 0;
    this.stats.autoDownloadCount++;
  }

  /**
   * Download content as a file
   */
  private downloadFile(filename: string, content: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export current queue as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      events: this.eventQueue,
      stats: this.stats,
      config: this.config,
    }, null, 2);
  }

  /**
   * Download current queue as JSON file
   */
  downloadAsJSON(): void {
    const content = this.exportAsJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    this.downloadFile(`debug-export-${dateStr}.json`, content);
  }

  /**
   * Create filtered log files by criteria
   */
  createFilteredLogs(filters: {
    severity?: DebugEvent['severity'][];
    type?: DebugEvent['type'][];
    source?: string[];
    timeRange?: { start: string; end: string };
  }): LogCategory[] {
    let filteredEvents = [...this.eventQueue];

    // Apply severity filter
    if (filters.severity?.length) {
      filteredEvents = filteredEvents.filter(event => 
        filters.severity!.includes(event.severity)
      );
    }

    // Apply type filter
    if (filters.type?.length) {
      filteredEvents = filteredEvents.filter(event => 
        filters.type!.includes(event.type)
      );
    }

    // Apply source filter
    if (filters.source?.length) {
      filteredEvents = filteredEvents.filter(event => 
        filters.source!.some(source => event.source.includes(source))
      );
    }

    // Apply time range filter
    if (filters.timeRange) {
      const startTime = new Date(filters.timeRange.start).getTime();
      const endTime = new Date(filters.timeRange.end).getTime();
      
      filteredEvents = filteredEvents.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      });
    }

    // Create filtered category
    const filterName = this.generateFilterName(filters);
    return [this.createLogCategory(filterName, filteredEvents)];
  }

  private generateFilterName(filters: any): string {
    const parts = ['filtered'];
    
    if (filters.severity?.length) {
      parts.push(`severity-${filters.severity.join('-')}`);
    }
    
    if (filters.type?.length) {
      parts.push(`type-${filters.type.join('-')}`);
    }
    
    if (filters.source?.length) {
      parts.push(`source-${filters.source.length}sources`);
    }
    
    if (filters.timeRange) {
      parts.push('timerange');
    }

    return parts.join('-');
  }

  /**
   * Get current statistics
   */
  getStats(): LogFileStats {
    return { ...this.stats };
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Clear event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
    this.eventCount = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LogFileConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Enable/disable log file generation
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): LogFileConfig {
    return { ...this.config };
  }
}

// Create singleton instance
export const localLogWriter = new LocalLogWriter();

// Convenience functions
export const addDebugEventToLog = (event: DebugEvent) => localLogWriter.addEvent(event);
export const downloadDebugLogs = () => localLogWriter.generateAndDownloadLogs();
export const downloadDebugJSON = () => localLogWriter.downloadAsJSON();
export const getLogFileStats = () => localLogWriter.getStats();

export default localLogWriter;