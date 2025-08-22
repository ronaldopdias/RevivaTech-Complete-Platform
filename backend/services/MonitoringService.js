/**
 * MonitoringService.js - Comprehensive System Monitoring & Performance Tracking
 * Session 8: Performance & Monitoring Implementation
 * 
 * Features:
 * - Real-time performance monitoring
 * - System health tracking
 * - Alert management with thresholds
 * - Historical metrics storage
 * - Performance analytics
 * - Resource utilization monitoring
 */

const EventEmitter = require('events');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class MonitoringService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      alertThresholds: {
        cpuUsage: 80,           // CPU usage percentage
        memoryUsage: 85,        // Memory usage percentage
        diskUsage: 90,          // Disk usage percentage
        responseTime: 500,      // Response time in ms
        errorRate: 5,           // Error rate percentage
        dbConnections: 80,      // Database connection pool usage
        cacheHitRatio: 70,      // Minimum cache hit ratio
        queueLength: 100,       // Maximum queue length
        ...config.alertThresholds
      },
      
      monitoringInterval: config.monitoringInterval || 30000, // 30 seconds
      metricsRetention: config.metricsRetention || 7 * 24 * 60 * 60 * 1000, // 7 days
      alertCooldown: config.alertCooldown || 5 * 60 * 1000, // 5 minutes
      
      // Services to monitor - using environment-aware URLs
      services: {
        database: { 
          enabled: true, 
          url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'revivatech'}:${process.env.DB_PASSWORD || 'revivatech_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5435}/${process.env.DB_NAME || 'revivatech'}`
        },
        cache: { 
          enabled: true, 
          url: `redis://localhost:${process.env.REDIS_PORT || 6383}`
        },
        api: { 
          enabled: true, 
          url: `http://localhost:${process.env.PORT || 3011}/health` 
        },
        frontend: { 
          enabled: true, 
          url: 'http://localhost:3010' 
        },
        ...config.services
      },
      
      ...config
    };

    this.metrics = new Map();
    this.alerts = new Map();
    this.alertHistory = [];
    this.monitoringIntervals = new Map();
    this.isMonitoring = false;
    this.startTime = Date.now();
    
    // Performance tracking
    this.performanceMetrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      totalResponseTime: 0,
      slowQueries: [],
      memoryLeaks: [],
      healthChecks: {}
    };

    this.init();
  }

  async init() {
    try {
      
      // Load historical metrics if available
      await this.loadHistoricalMetrics();
      
      // Start monitoring
      this.startMonitoring();
      
      // Setup cleanup interval
      this.setupCleanup();
      
      console.log('MonitoringService initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize MonitoringService:', error);
      throw error;
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // System metrics monitoring
    this.monitoringIntervals.set('system', setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.monitoringInterval));
    
    // Service health monitoring
    this.monitoringIntervals.set('services', setInterval(() => {
      this.checkServiceHealth();
    }, this.config.monitoringInterval));
    
    // Performance metrics monitoring
    this.monitoringIntervals.set('performance', setInterval(() => {
      this.analyzePerformance();
    }, this.config.monitoringInterval * 2)); // Every minute
    
    // Alert evaluation
    this.monitoringIntervals.set('alerts', setInterval(() => {
      this.evaluateAlerts();
    }, this.config.monitoringInterval / 2)); // Every 15 seconds
    
    console.log('Monitoring started');
    this.emit('monitoringStarted');
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Clear all intervals
    for (const [name, interval] of this.monitoringIntervals) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
    
    console.log('Monitoring stopped');
    this.emit('monitoringStopped');
  }

  async collectSystemMetrics() {
    try {
      const timestamp = Date.now();
      
      // CPU metrics
      const cpuUsage = await this.getCPUUsage();
      
      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      // Disk metrics
      const diskUsage = await this.getDiskUsage();
      
      // Network metrics
      const networkInterfaces = os.networkInterfaces();
      
      // Load average
      const loadAverage = os.loadavg();
      
      // Process metrics
      const processMetrics = {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };

      const systemMetrics = {
        timestamp,
        cpu: {
          usage: cpuUsage,
          cores: os.cpus().length,
          loadAverage: loadAverage,
          model: os.cpus()[0]?.model
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: memoryUsagePercent,
          process: processMetrics.memoryUsage
        },
        disk: diskUsage,
        network: this.getNetworkStats(networkInterfaces),
        process: processMetrics,
        os: {
          platform: os.platform(),
          release: os.release(),
          uptime: os.uptime(),
          hostname: os.hostname()
        }
      };

      this.storeMetric('system', systemMetrics);
      
      // Check thresholds
      this.checkThreshold('cpu_usage', cpuUsage, this.config.alertThresholds.cpuUsage);
      this.checkThreshold('memory_usage', memoryUsagePercent, this.config.alertThresholds.memoryUsage);
      this.checkThreshold('disk_usage', diskUsage.usagePercent, this.config.alertThresholds.diskUsage);
      
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      this.recordError('system_metrics_collection', error);
    }
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      
      setTimeout(() => {
        const cpuUsage = process.cpuUsage(startMeasure);
        const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000; // Convert to ms
        const cpuPercent = (totalUsage / 1000) * 100; // Convert to percentage
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  async getDiskUsage() {
    try {
      const stats = await fs.stat('.');
      // This is a simplified approach - in production, use more robust disk monitoring
      return {
        total: stats.size || 0,
        used: 0,
        free: 0,
        usagePercent: 0
      };
    } catch (error) {
      return { total: 0, used: 0, free: 0, usagePercent: 0 };
    }
  }

  getNetworkStats(interfaces) {
    const stats = {
      interfaces: Object.keys(interfaces).length,
      active: 0,
      addresses: []
    };

    for (const [name, addresses] of Object.entries(interfaces)) {
      if (addresses.some(addr => addr.family === 'IPv4' && !addr.internal)) {
        stats.active++;
        stats.addresses.push({
          name,
          addresses: addresses.map(addr => ({
            address: addr.address,
            family: addr.family,
            internal: addr.internal
          }))
        });
      }
    }

    return stats;
  }

  async checkServiceHealth() {
    const timestamp = Date.now();
    const healthResults = {};

    for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
      if (!serviceConfig.enabled) continue;

      try {
        const healthResult = await this.checkSingleService(serviceName, serviceConfig);
        healthResults[serviceName] = healthResult;
        
        // Store individual service metrics
        this.storeMetric(`service_${serviceName}`, {
          timestamp,
          ...healthResult
        });
        
        // Check response time threshold
        if (healthResult.responseTime > this.config.alertThresholds.responseTime) {
          this.checkThreshold(
            `${serviceName}_response_time`, 
            healthResult.responseTime, 
            this.config.alertThresholds.responseTime
          );
        }
        
      } catch (error) {
        console.error(`Health check failed for ${serviceName}:`, error);
        healthResults[serviceName] = {
          status: 'unhealthy',
          error: error.message,
          responseTime: null
        };
        
        this.recordError(`${serviceName}_health_check`, error);
      }
    }

    this.storeMetric('services_health', {
      timestamp,
      services: healthResults,
      overall: this.calculateOverallHealth(healthResults)
    });

    this.performanceMetrics.healthChecks = healthResults;
  }

  async checkSingleService(serviceName, serviceConfig) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (serviceName) {
        case 'database':
          result = await this.checkDatabase();
          break;
        case 'cache':
          result = await this.checkCache();
          break;
        case 'api':
        case 'frontend':
          result = await this.checkHTTPService(serviceConfig.url);
          break;
        default:
          result = await this.checkGenericService(serviceConfig);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        ...result
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkDatabase() {
    // This would connect to your actual database
    // For now, we'll simulate a database check
    return {
      connections: Math.floor(Math.random() * 50),
      activeQueries: Math.floor(Math.random() * 10),
      version: '14.5'
    };
  }

  async checkCache() {
    // This would connect to your Redis instance
    // For now, we'll simulate a cache check
    return {
      hitRatio: 85 + Math.random() * 10,
      memoryUsage: Math.floor(Math.random() * 1000),
      connections: Math.floor(Math.random() * 20)
    };
  }

  async checkHTTPService(url) {
    const fetch = require('node-fetch');
    const response = await fetch(url, { timeout: 5000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return {
      httpStatus: response.status,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type')
    };
  }

  async checkGenericService(serviceConfig) {
    // Generic service check implementation
    return {
      configured: true,
      url: serviceConfig.url
    };
  }

  calculateOverallHealth(healthResults) {
    const services = Object.values(healthResults);
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const totalCount = services.length;
    
    if (totalCount === 0) return 'unknown';
    
    const healthRatio = healthyCount / totalCount;
    
    if (healthRatio === 1) return 'healthy';
    if (healthRatio >= 0.8) return 'degraded';
    return 'unhealthy';
  }

  analyzePerformance() {
    const timestamp = Date.now();
    const uptime = timestamp - this.startTime;
    
    // Calculate performance metrics
    const avgResponseTime = this.performanceMetrics.responses > 0 ? 
      this.performanceMetrics.totalResponseTime / this.performanceMetrics.responses : 0;
    
    const errorRate = this.performanceMetrics.requests > 0 ? 
      (this.performanceMetrics.errors / this.performanceMetrics.requests) * 100 : 0;
    
    const requestsPerSecond = this.performanceMetrics.requests / (uptime / 1000);
    
    const performanceData = {
      timestamp,
      uptime,
      requests: {
        total: this.performanceMetrics.requests,
        perSecond: requestsPerSecond,
        errors: this.performanceMetrics.errors,
        errorRate
      },
      response: {
        average: avgResponseTime,
        total: this.performanceMetrics.totalResponseTime
      },
      slowQueries: this.performanceMetrics.slowQueries.slice(-10), // Last 10
      memoryLeaks: this.performanceMetrics.memoryLeaks.slice(-5)   // Last 5
    };
    
    this.storeMetric('performance', performanceData);
    
    // Check performance thresholds
    this.checkThreshold('avg_response_time', avgResponseTime, this.config.alertThresholds.responseTime);
    this.checkThreshold('error_rate', errorRate, this.config.alertThresholds.errorRate);
  }

  evaluateAlerts() {
    const now = Date.now();
    
    for (const [alertId, alert] of this.alerts) {
      // Skip if alert is in cooldown
      if (alert.lastTriggered && (now - alert.lastTriggered) < this.config.alertCooldown) {
        continue;
      }
      
      // Re-evaluate threshold
      const currentValue = this.getCurrentMetricValue(alert.metric);
      if (currentValue !== null && currentValue > alert.threshold) {
        this.triggerAlert(alertId, alert, currentValue);
      } else if (alert.active) {
        this.resolveAlert(alertId, alert);
      }
    }
  }

  checkThreshold(metric, value, threshold) {
    const alertId = `threshold_${metric}`;
    
    if (value > threshold) {
      if (!this.alerts.has(alertId)) {
        const alert = {
          id: alertId,
          metric,
          threshold,
          value,
          level: 'warning',
          message: `${metric} exceeded threshold: ${value} > ${threshold}`,
          active: true,
          created: Date.now(),
          lastTriggered: Date.now()
        };
        
        this.alerts.set(alertId, alert);
        this.triggerAlert(alertId, alert, value);
      }
    } else {
      if (this.alerts.has(alertId)) {
        this.resolveAlert(alertId, this.alerts.get(alertId));
      }
    }
  }

  triggerAlert(alertId, alert, currentValue) {
    alert.lastTriggered = Date.now();
    alert.value = currentValue;
    alert.active = true;
    
    console.warn(`🚨 ALERT TRIGGERED: ${alert.message} (Current: ${currentValue})`);
    
    // Add to history
    this.alertHistory.push({
      ...alert,
      action: 'triggered',
      timestamp: Date.now()
    });
    
    // Emit alert event
    this.emit('alertTriggered', alert);
    
    // Send notification (implement based on your needs)
    this.sendAlertNotification(alert);
  }

  resolveAlert(alertId, alert) {
    alert.active = false;
    alert.resolved = Date.now();
    
    
    // Add to history
    this.alertHistory.push({
      ...alert,
      action: 'resolved',
      timestamp: Date.now()
    });
    
    // Emit resolved event
    this.emit('alertResolved', alert);
    
    // Remove from active alerts
    this.alerts.delete(alertId);
  }

  sendAlertNotification(alert) {
    // Implement notification logic (email, Slack, webhook, etc.)
    // For now, just emit an event
    this.emit('notification', {
      type: 'alert',
      level: alert.level,
      message: alert.message,
      alert
    });
  }

  getCurrentMetricValue(metricName) {
    // Get the latest value for a specific metric
    try {
      switch (metricName) {
        case 'cpu_usage':
          return this.getLatestMetric('system')?.cpu?.usage;
        case 'memory_usage':
          return this.getLatestMetric('system')?.memory?.usagePercent;
        case 'disk_usage':
          return this.getLatestMetric('system')?.disk?.usagePercent;
        case 'avg_response_time':
          return this.getLatestMetric('performance')?.response?.average;
        case 'error_rate':
          return this.getLatestMetric('performance')?.requests?.errorRate;
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  getLatestMetric(type) {
    const metrics = this.metrics.get(type) || [];
    return metrics[metrics.length - 1];
  }

  storeMetric(type, data) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type);
    metrics.push(data);
    
    // Limit storage to prevent memory issues
    const maxMetrics = 1000;
    if (metrics.length > maxMetrics) {
      metrics.splice(0, metrics.length - maxMetrics);
    }
    
    this.emit('metricStored', { type, data });
  }

  recordError(context, error) {
    this.performanceMetrics.errors++;
    
    const errorData = {
      timestamp: Date.now(),
      context,
      message: error.message,
      stack: error.stack
    };
    
    this.storeMetric('errors', errorData);
    this.emit('errorRecorded', errorData);
  }

  recordRequest(responseTime) {
    this.performanceMetrics.requests++;
    this.performanceMetrics.responses++;
    this.performanceMetrics.totalResponseTime += responseTime;
    
    // Track slow queries
    if (responseTime > this.config.alertThresholds.responseTime) {
      this.performanceMetrics.slowQueries.push({
        timestamp: Date.now(),
        responseTime
      });
    }
  }

  getMetrics(type, timeRange = 3600000) { // Default 1 hour
    const now = Date.now();
    const since = now - timeRange;
    
    const allMetrics = this.metrics.get(type) || [];
    return allMetrics.filter(metric => metric.timestamp >= since);
  }

  getSystemHealth() {
    const latest = {
      system: this.getLatestMetric('system'),
      services: this.getLatestMetric('services_health'),
      performance: this.getLatestMetric('performance')
    };
    
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.active);
    
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      status: this.calculateSystemStatus(latest, activeAlerts),
      metrics: latest,
      alerts: {
        active: activeAlerts,
        total: this.alertHistory.length,
        recent: this.alertHistory.slice(-10)
      },
      isMonitoring: this.isMonitoring
    };
  }

  calculateSystemStatus(metrics, activeAlerts) {
    if (!this.isMonitoring) return 'monitoring_disabled';
    
    const criticalAlerts = activeAlerts.filter(alert => alert.level === 'critical');
    if (criticalAlerts.length > 0) return 'critical';
    
    const warningAlerts = activeAlerts.filter(alert => alert.level === 'warning');
    if (warningAlerts.length > 3) return 'warning';
    
    const servicesHealth = metrics.services?.overall;
    if (servicesHealth === 'unhealthy') return 'unhealthy';
    if (servicesHealth === 'degraded') return 'degraded';
    
    return 'healthy';
  }

  async loadHistoricalMetrics() {
    // In production, load from persistent storage
  }

  setupCleanup() {
    // Clean up old metrics and alerts every hour
    setInterval(() => {
      const now = Date.now();
      const retentionTime = this.config.metricsRetention;
      
      // Clean up old metrics
      for (const [type, metrics] of this.metrics) {
        const filtered = metrics.filter(metric => 
          (now - metric.timestamp) < retentionTime
        );
        this.metrics.set(type, filtered);
      }
      
      // Clean up old alert history
      this.alertHistory = this.alertHistory.filter(alert => 
        (now - alert.timestamp) < retentionTime
      );
      
      console.log('Metrics cleanup completed');
      
    }, 3600000); // Every hour
  }

  async destroy() {
    console.log('Shutting down MonitoringService...');
    
    this.stopMonitoring();
    
    // Save metrics if needed
    await this.saveMetrics();
    
    this.removeAllListeners();
    
    console.log('MonitoringService shut down');
  }

  async saveMetrics() {
    // In production, save metrics to persistent storage
    console.log('Metrics saved (stub implementation)');
  }
}

// Monitoring service instance
let monitoringInstance = null;

module.exports = {
  MonitoringService,
  
  // Singleton pattern
  getInstance: (config) => {
    if (!monitoringInstance) {
      monitoringInstance = new MonitoringService(config);
    }
    return monitoringInstance;
  },
  
  // Helper middleware for Express.js
  middleware: (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (monitoringInstance) {
        monitoringInstance.recordRequest(responseTime);
        
        if (res.statusCode >= 400) {
          monitoringInstance.recordError('http_request', new Error(`HTTP ${res.statusCode}`));
        }
      }
    });
    
    next();
  }
};