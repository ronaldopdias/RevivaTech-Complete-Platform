import { EventEmitter } from 'events';
import { cache } from '../config/redis';
import { getConfig } from '../config/environment';

const config = getConfig();

// Metric types
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface CounterMetric extends Metric {
  type: 'counter';
}

export interface GaugeMetric extends Metric {
  type: 'gauge';
}

export interface HistogramMetric extends Metric {
  type: 'histogram';
  buckets: number[];
}

export interface TimerMetric extends Metric {
  type: 'timer';
  duration: number;
}

// Metrics collector
export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private metrics = new Map<string, Metric[]>();
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private timers = new Map<string, number>();
  
  constructor() {
    super();
    this.setupPeriodicCollection();
  }
  
  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector();
    }
    return this.instance;
  }
  
  // Counter metrics
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + value;
    
    this.counters.set(key, newValue);
    
    const metric: CounterMetric = {
      name,
      value: newValue,
      timestamp: new Date(),
      labels,
      type: 'counter',
    };
    
    this.recordMetric(metric);
  }
  
  // Gauge metrics
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    this.gauges.set(key, value);
    
    const metric: GaugeMetric = {
      name,
      value,
      timestamp: new Date(),
      labels,
      type: 'gauge',
    };
    
    this.recordMetric(metric);
  }
  
  // Timer metrics
  startTimer(name: string, labels?: Record<string, string>): string {
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, Date.now());
    return timerId;
  }
  
  endTimer(timerId: string, name: string, labels?: Record<string, string>): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) {
      throw new Error(`Timer ${timerId} not found`);
    }
    
    const duration = Date.now() - startTime;
    this.timers.delete(timerId);
    
    const metric: TimerMetric = {
      name,
      value: duration,
      timestamp: new Date(),
      labels,
      type: 'timer',
      duration,
    };
    
    this.recordMetric(metric);
    return duration;
  }
  
  // Measure function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const timerId = this.startTimer(name, labels);
    try {
      const result = await fn();
      this.endTimer(timerId, name, labels);
      return result;
    } catch (error) {
      this.endTimer(timerId, name, { ...labels, error: 'true' });
      throw error;
    }
  }
  
  // Histogram metrics
  recordHistogram(
    name: string,
    value: number,
    buckets: number[] = [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    labels?: Record<string, string>
  ): void {
    const metric: HistogramMetric = {
      name,
      value,
      timestamp: new Date(),
      labels,
      type: 'histogram',
      buckets,
    };
    
    this.recordMetric(metric);
  }
  
  // Get current metric values
  getCounterValue(name: string, labels?: Record<string, string>): number {
    const key = this.createKey(name, labels);
    return this.counters.get(key) || 0;
  }
  
  getGaugeValue(name: string, labels?: Record<string, string>): number {
    const key = this.createKey(name, labels);
    return this.gauges.get(key) || 0;
  }
  
  // Get metric history
  getMetricHistory(name: string, hours: number = 24): Metric[] {
    const allMetrics = this.metrics.get(name) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return allMetrics.filter(metric => metric.timestamp >= cutoff);
  }
  
  // Get all metrics
  getAllMetrics(): Record<string, Metric[]> {
    return Object.fromEntries(this.metrics);
  }
  
  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    let output = '';
    
    // Counters
    for (const [key, value] of this.counters) {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatPrometheusLabels(labels);
      output += `# TYPE ${name} counter\n`;
      output += `${name}${labelsStr} ${value}\n`;
    }
    
    // Gauges
    for (const [key, value] of this.gauges) {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatPrometheusLabels(labels);
      output += `# TYPE ${name} gauge\n`;
      output += `${name}${labelsStr} ${value}\n`;
    }
    
    return output;
  }
  
  // Private methods
  private recordMetric(metric: Metric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricArray = this.metrics.get(metric.name)!;
    metricArray.push(metric);
    
    // Keep only last 1000 metrics per name
    if (metricArray.length > 1000) {
      metricArray.splice(0, metricArray.length - 1000);
    }
    
    // Emit metric event
    this.emit('metric', metric);
    
    // Store in Redis for persistence
    this.storeMetricInRedis(metric);
  }
  
  private createKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelPairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}{${labelPairs}}`;
  }
  
  private parseKey(key: string): { name: string; labels: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    if (!match) {
      return { name: key, labels: {} };
    }
    
    const [, name, labelStr] = match;
    const labels: Record<string, string> = {};
    
    if (labelStr) {
      labelStr.split(',').forEach(pair => {
        const [key, value] = pair.split('=');
        labels[key] = value;
      });
    }
    
    return { name, labels };
  }
  
  private formatPrometheusLabels(labels: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    
    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `{${labelPairs}}`;
  }
  
  private async storeMetricInRedis(metric: Metric): Promise<void> {
    try {
      const key = `metric:${metric.name}:${metric.timestamp.getTime()}`;
      await cache.set(key, metric, 24 * 3600); // Store for 24 hours
    } catch (error) {
      console.error('Failed to store metric in Redis:', error);
    }
  }
  
  private setupPeriodicCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
    
    // Collect application metrics every 60 seconds
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 60000);
  }
  
  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memory metrics
    this.setGauge('nodejs_memory_heap_used_bytes', memoryUsage.heapUsed);
    this.setGauge('nodejs_memory_heap_total_bytes', memoryUsage.heapTotal);
    this.setGauge('nodejs_memory_external_bytes', memoryUsage.external);
    this.setGauge('nodejs_memory_rss_bytes', memoryUsage.rss);
    
    // CPU metrics
    this.setGauge('nodejs_cpu_user_microseconds_total', cpuUsage.user);
    this.setGauge('nodejs_cpu_system_microseconds_total', cpuUsage.system);
    
    // Process metrics
    this.setGauge('nodejs_process_uptime_seconds', process.uptime());
    this.setGauge('nodejs_process_pid', process.pid);
  }
  
  private collectApplicationMetrics(): void {
    // Application-specific metrics
    this.setGauge('nodejs_active_handles', (process as any)._getActiveHandles?.().length || 0);
    this.setGauge('nodejs_active_requests', (process as any)._getActiveRequests?.().length || 0);
    
    // Event loop lag
    this.measureEventLoopLag();
  }
  
  private measureEventLoopLag(): void {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      this.setGauge('nodejs_eventloop_lag_milliseconds', lag);
    });
  }
}

// Application-specific metrics
export class ApplicationMetrics {
  private collector: MetricsCollector;
  
  constructor() {
    this.collector = MetricsCollector.getInstance();
  }
  
  // HTTP request metrics
  recordHTTPRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = { method, route, status_code: statusCode.toString() };
    
    this.collector.incrementCounter('http_requests_total', 1, labels);
    this.collector.recordHistogram('http_request_duration_milliseconds', duration, undefined, labels);
    
    if (statusCode >= 400) {
      this.collector.incrementCounter('http_errors_total', 1, labels);
    }
  }
  
  // Database query metrics
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    const labels = { operation, table, success: success.toString() };
    
    this.collector.incrementCounter('database_queries_total', 1, labels);
    this.collector.recordHistogram('database_query_duration_milliseconds', duration, undefined, labels);
    
    if (!success) {
      this.collector.incrementCounter('database_errors_total', 1, labels);
    }
  }
  
  // Business metrics
  recordBookingCreated(deviceType: string, serviceType: string): void {
    const labels = { device_type: deviceType, service_type: serviceType };
    this.collector.incrementCounter('bookings_created_total', 1, labels);
  }
  
  recordQuoteApproved(amount: number, serviceType: string): void {
    const labels = { service_type: serviceType };
    this.collector.incrementCounter('quotes_approved_total', 1, labels);
    this.collector.recordHistogram('quote_amount_pounds', amount, undefined, labels);
  }
  
  recordPaymentProcessed(amount: number, method: string, success: boolean): void {
    const labels = { method, success: success.toString() };
    this.collector.incrementCounter('payments_processed_total', 1, labels);
    
    if (success) {
      this.collector.recordHistogram('payment_amount_pounds', amount, undefined, labels);
    } else {
      this.collector.incrementCounter('payment_failures_total', 1, labels);
    }
  }
  
  recordRepairCompleted(serviceType: string, duration: number): void {
    const labels = { service_type: serviceType };
    this.collector.incrementCounter('repairs_completed_total', 1, labels);
    this.collector.recordHistogram('repair_duration_hours', duration / 3600000, undefined, labels);
  }
  
  // User activity metrics
  recordUserLogin(method: string, success: boolean): void {
    const labels = { method, success: success.toString() };
    this.collector.incrementCounter('user_logins_total', 1, labels);
  }
  
  recordUserRegistration(method: string): void {
    const labels = { method };
    this.collector.incrementCounter('user_registrations_total', 1, labels);
  }
  
  // Cache metrics
  recordCacheHit(cache: string): void {
    this.collector.incrementCounter('cache_hits_total', 1, { cache });
  }
  
  recordCacheMiss(cache: string): void {
    this.collector.incrementCounter('cache_misses_total', 1, { cache });
  }
  
  // Error metrics
  recordError(type: string, severity: string): void {
    const labels = { type, severity };
    this.collector.incrementCounter('application_errors_total', 1, labels);
  }
  
  // Security metrics
  recordSecurityEvent(type: string, severity: string): void {
    const labels = { type, severity };
    this.collector.incrementCounter('security_events_total', 1, labels);
  }
  
  recordRateLimitHit(endpoint: string): void {
    this.collector.incrementCounter('rate_limit_hits_total', 1, { endpoint });
  }
  
  recordAuthenticationFailure(reason: string): void {
    this.collector.incrementCounter('authentication_failures_total', 1, { reason });
  }
}

// Metrics dashboard data
export class MetricsDashboard {
  private collector: MetricsCollector;
  private appMetrics: ApplicationMetrics;
  
  constructor() {
    this.collector = MetricsCollector.getInstance();
    this.appMetrics = new ApplicationMetrics();
  }
  
  // Get dashboard summary
  async getDashboardSummary(): Promise<{
    system: any;
    application: any;
    business: any;
    errors: any;
  }> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    return {
      system: {
        memoryUsage: this.collector.getGaugeValue('nodejs_memory_heap_used_bytes'),
        cpuUsage: this.collector.getGaugeValue('nodejs_cpu_user_microseconds_total'),
        uptime: this.collector.getGaugeValue('nodejs_process_uptime_seconds'),
        eventLoopLag: this.collector.getGaugeValue('nodejs_eventloop_lag_milliseconds'),
      },
      application: {
        totalRequests: this.collector.getCounterValue('http_requests_total'),
        errorRate: this.calculateErrorRate(),
        averageResponseTime: this.calculateAverageResponseTime(),
        activeConnections: this.collector.getGaugeValue('nodejs_active_handles'),
      },
      business: {
        totalBookings: this.collector.getCounterValue('bookings_created_total'),
        totalQuotes: this.collector.getCounterValue('quotes_approved_total'),
        totalRevenue: this.calculateTotalRevenue(),
        completedRepairs: this.collector.getCounterValue('repairs_completed_total'),
      },
      errors: {
        totalErrors: this.collector.getCounterValue('application_errors_total'),
        databaseErrors: this.collector.getCounterValue('database_errors_total'),
        httpErrors: this.collector.getCounterValue('http_errors_total'),
        securityEvents: this.collector.getCounterValue('security_events_total'),
      },
    };
  }
  
  // Get time series data
  getTimeSeriesData(metricName: string, hours: number = 24): Array<{ timestamp: Date; value: number }> {
    const metrics = this.collector.getMetricHistory(metricName, hours);
    return metrics.map(metric => ({
      timestamp: metric.timestamp,
      value: metric.value,
    }));
  }
  
  // Calculate error rate
  private calculateErrorRate(): number {
    const totalRequests = this.collector.getCounterValue('http_requests_total');
    const totalErrors = this.collector.getCounterValue('http_errors_total');
    
    if (totalRequests === 0) return 0;
    return (totalErrors / totalRequests) * 100;
  }
  
  // Calculate average response time
  private calculateAverageResponseTime(): number {
    const metrics = this.collector.getMetricHistory('http_request_duration_milliseconds', 1);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }
  
  // Calculate total revenue
  private calculateTotalRevenue(): number {
    const metrics = this.collector.getMetricHistory('payment_amount_pounds', 24);
    return metrics.reduce((acc, metric) => acc + metric.value, 0);
  }
}

// Create singleton instances
export const metricsCollector = MetricsCollector.getInstance();
export const applicationMetrics = new ApplicationMetrics();
export const metricsDashboard = new MetricsDashboard();

// Middleware for automatic HTTP metrics collection
export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path || 'unknown';
      
      applicationMetrics.recordHTTPRequest(
        req.method,
        route,
        res.statusCode,
        duration
      );
    });
    
    next();
  };
}