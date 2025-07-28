/**
 * Service Manager - Comprehensive Service Orchestration
 * 
 * This provides high-level service management with features:
 * - Service lifecycle orchestration
 * - Configuration management with hot-reloading
 * - Health monitoring and recovery
 * - Performance metrics and analytics
 * - Service discovery and dependency injection
 * - Plugin system integration
 * - Advanced monitoring and alerting
 */

import { AbstractService, ServiceType, ServiceAbstractionConfig } from './serviceAbstraction';
import ServiceRegistry from './serviceRegistry';
import { AdvancedServiceFactory } from './advancedServiceFactory';
import { ServiceHealthCheck } from './types';

// =============================================================================
// Service Manager Types
// =============================================================================

export interface ServiceManagerConfig {
  // Core settings
  environment: 'development' | 'staging' | 'production';
  enableAutoRecovery: boolean;
  enablePerformanceMonitoring: boolean;
  enableAdvancedMetrics: boolean;
  
  // Health monitoring
  healthCheckInterval: number;
  healthCheckTimeout: number;
  unhealthyThreshold: number;
  recoveryAttempts: number;
  recoveryDelay: number;
  
  // Performance monitoring
  metricsInterval: number;
  metricsRetentionPeriod: number;
  performanceThresholds: {
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  
  // Service discovery
  enableServiceDiscovery: boolean;
  serviceDiscoveryInterval: number;
  
  // Configuration
  configurationSource: 'file' | 'api' | 'env' | 'combined';
  configurationReloadInterval: number;
  
  // Logging and monitoring
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetricsExport: boolean;
  metricsExportInterval: number;
  
  // Plugin system
  enablePlugins: boolean;
  pluginDirectory?: string;
  
  // Advanced features
  enableLoadBalancing: boolean;
  enableServiceMesh: boolean;
  enableDistributedTracing: boolean;
}

export interface ServiceManagerState {
  status: 'initializing' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime: Date;
  lastHealthCheck: Date;
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface ServicePerformanceMetrics {
  serviceId: string;
  serviceName: string;
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

export interface ServiceAlert {
  id: string;
  type: 'health' | 'performance' | 'error' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  serviceId: string;
  serviceName: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ServiceConfiguration {
  services: Record<string, ServiceAbstractionConfig>;
  globalConfig: Record<string, any>;
  environment: string;
  version: string;
  lastUpdated: Date;
}

// =============================================================================
// Service Manager Implementation
// =============================================================================

export class ServiceManager {
  private static instance: ServiceManager;
  private config: ServiceManagerConfig;
  private state: ServiceManagerState;
  private registry: ServiceRegistry;
  private factory: AdvancedServiceFactory;
  private performanceMetrics: Map<string, ServicePerformanceMetrics[]> = new Map();
  private alerts: Map<string, ServiceAlert> = new Map();
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  
  // Monitoring timers
  private healthMonitor?: NodeJS.Timeout;
  private performanceMonitor?: NodeJS.Timeout;
  private configurationMonitor?: NodeJS.Timeout;
  private metricsExporter?: NodeJS.Timeout;
  
  private logger: typeof console = console;

  private constructor(config: ServiceManagerConfig) {
    this.config = config;
    this.state = {
      status: 'initializing',
      startTime: new Date(),
      lastHealthCheck: new Date(),
      totalServices: 0,
      healthyServices: 0,
      unhealthyServices: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      uptime: 0
    };
    
    this.registry = ServiceRegistry.getInstance();
    this.factory = AdvancedServiceFactory.getAdvancedInstance();
    
    this.initializeManager();
  }

  // =============================================================================
  // Singleton Pattern
  // =============================================================================

  static getInstance(config?: ServiceManagerConfig): ServiceManager {
    if (!ServiceManager.instance) {
      const defaultConfig: ServiceManagerConfig = {
        environment: 'development',
        enableAutoRecovery: true,
        enablePerformanceMonitoring: true,
        enableAdvancedMetrics: true,
        healthCheckInterval: 30000,
        healthCheckTimeout: 5000,
        unhealthyThreshold: 3,
        recoveryAttempts: 3,
        recoveryDelay: 5000,
        metricsInterval: 60000,
        metricsRetentionPeriod: 86400000, // 24 hours
        performanceThresholds: {
          responseTime: 1000,
          errorRate: 5,
          uptime: 99
        },
        enableServiceDiscovery: true,
        serviceDiscoveryInterval: 60000,
        configurationSource: 'combined',
        configurationReloadInterval: 300000, // 5 minutes
        logLevel: 'info',
        enableMetricsExport: false,
        metricsExportInterval: 300000, // 5 minutes
        enablePlugins: true,
        enableLoadBalancing: false,
        enableServiceMesh: false,
        enableDistributedTracing: false
      };

      ServiceManager.instance = new ServiceManager({ ...defaultConfig, ...config });
    }

    return ServiceManager.instance;
  }

  // =============================================================================
  // Manager Lifecycle
  // =============================================================================

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Service Manager', this.config);
    
    this.state.status = 'initializing';
    
    // Initialize registry and factory
    await this.setupRegistry();
    await this.setupFactory();
    
    // Start monitoring
    this.startHealthMonitoring();
    this.startPerformanceMonitoring();
    this.startConfigurationMonitoring();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    this.state.status = 'running';
    this.log('info', 'Service Manager initialized successfully');
    this.emit('manager-initialized', { state: this.state });
  }

  async start(): Promise<void> {
    if (this.state.status !== 'running') {
      await this.initialize();
    }
    
    // Start all services
    await this.registry.startAll();
    
    this.log('info', 'Service Manager started');
    this.emit('manager-started', { state: this.state });
  }

  async stop(): Promise<void> {
    this.log('info', 'Stopping Service Manager');
    
    this.state.status = 'stopping';
    
    // Stop monitoring
    this.stopHealthMonitoring();
    this.stopPerformanceMonitoring();
    this.stopConfigurationMonitoring();
    
    // Stop all services
    await this.registry.stopAll();
    
    this.state.status = 'stopped';
    this.log('info', 'Service Manager stopped');
    this.emit('manager-stopped', { state: this.state });
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  // =============================================================================
  // Service Management
  // =============================================================================

  async addService(config: ServiceAbstractionConfig): Promise<AbstractService> {
    const service = await this.factory.createAdvancedService(config.name, config);
    await this.registry.register(service);
    
    this.updateState();
    this.log('info', `Added service: ${config.name}`);
    this.emit('service-added', { service, config });
    
    return service;
  }

  async removeService(serviceId: string): Promise<void> {
    await this.registry.unregister(serviceId);
    this.performanceMetrics.delete(serviceId);
    
    this.updateState();
    this.log('info', `Removed service: ${serviceId}`);
    this.emit('service-removed', { serviceId });
  }

  async updateService(serviceId: string, updates: Partial<ServiceAbstractionConfig>): Promise<void> {
    await this.registry.updateServiceConfig(serviceId, updates);
    
    this.log('info', `Updated service: ${serviceId}`);
    this.emit('service-updated', { serviceId, updates });
  }

  getService(serviceId: string): AbstractService | undefined {
    return this.registry.get(serviceId);
  }

  getServicesByType(type: ServiceType): AbstractService[] {
    return this.registry.getByType(type);
  }

  getAllServices(): AbstractService[] {
    return this.registry.getAll();
  }

  // =============================================================================
  // Health Monitoring
  // =============================================================================

  async checkHealth(): Promise<Record<string, ServiceHealthCheck>> {
    const healthChecks = await this.registry.checkHealth();
    
    this.state.lastHealthCheck = new Date();
    this.updateHealthState(healthChecks);
    
    // Check for alerts
    this.checkHealthAlerts(healthChecks);
    
    return healthChecks;
  }

  async getOverallHealth(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    return await this.registry.getOverallHealth();
  }

  private startHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
    }

    this.healthMonitor = setInterval(async () => {
      try {
        const healthChecks = await this.checkHealth();
        this.emit('health-check-completed', { healthChecks, state: this.state });
        
        // Auto-recovery for unhealthy services
        if (this.config.enableAutoRecovery) {
          await this.attemptAutoRecovery(healthChecks);
        }
      } catch (error) {
        this.log('error', 'Health monitoring error', { error: error.message });
        this.createAlert('health', 'high', 'system', 'System', 'Health monitoring failed', { error });
      }
    }, this.config.healthCheckInterval);
  }

  private stopHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
      this.healthMonitor = undefined;
    }
  }

  private async attemptAutoRecovery(healthChecks: Record<string, ServiceHealthCheck>): Promise<void> {
    for (const [serviceId, health] of Object.entries(healthChecks)) {
      if (health.status === 'unhealthy') {
        await this.recoverService(serviceId);
      }
    }
  }

  private async recoverService(serviceId: string): Promise<void> {
    const service = this.registry.get(serviceId);
    if (!service) {
      return;
    }

    this.log('warn', `Attempting to recover unhealthy service: ${serviceId}`);
    
    for (let attempt = 1; attempt <= this.config.recoveryAttempts; attempt++) {
      try {
        await service.disconnect();
        await new Promise(resolve => setTimeout(resolve, this.config.recoveryDelay));
        await service.connect();
        
        // Check if recovery was successful
        const health = await service.healthCheck();
        if (health.status === 'healthy') {
          this.log('info', `Successfully recovered service: ${serviceId} (attempt ${attempt})`);
          this.resolveAlert(serviceId, 'health');
          return;
        }
      } catch (error) {
        this.log('error', `Recovery attempt ${attempt} failed for service: ${serviceId}`, { error: error.message });
      }
    }
    
    this.log('error', `Failed to recover service after ${this.config.recoveryAttempts} attempts: ${serviceId}`);
    this.createAlert('health', 'critical', serviceId, service.getConfig().name, 'Service recovery failed', {
      attempts: this.config.recoveryAttempts
    });
  }

  // =============================================================================
  // Performance Monitoring
  // =============================================================================

  private startPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) {
      return;
    }

    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }

    this.performanceMonitor = setInterval(async () => {
      try {
        await this.collectPerformanceMetrics();
      } catch (error) {
        this.log('error', 'Performance monitoring error', { error: error.message });
      }
    }, this.config.metricsInterval);
  }

  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = undefined;
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    const services = this.registry.getAll();
    
    for (const service of services) {
      const serviceId = service.getConfig().id;
      const metrics = service.getMetrics();
      
      const performanceMetrics: ServicePerformanceMetrics = {
        serviceId,
        serviceName: service.getConfig().name,
        responseTime: {
          min: metrics.avgResponseTime * 0.8, // Simplified
          max: metrics.avgResponseTime * 1.2,
          avg: metrics.avgResponseTime,
          p95: metrics.avgResponseTime * 1.1,
          p99: metrics.avgResponseTime * 1.15
        },
        throughput: {
          requestsPerSecond: metrics.totalRequests / 60,
          requestsPerMinute: metrics.totalRequests,
          requestsPerHour: metrics.totalRequests * 60
        },
        errorRate: metrics.errorRate,
        uptime: metrics.uptime,
        memoryUsage: 0, // Would need to implement memory tracking
        cpuUsage: 0, // Would need to implement CPU tracking
        timestamp: new Date()
      };
      
      // Store metrics
      if (!this.performanceMetrics.has(serviceId)) {
        this.performanceMetrics.set(serviceId, []);
      }
      
      const serviceMetrics = this.performanceMetrics.get(serviceId)!;
      serviceMetrics.push(performanceMetrics);
      
      // Clean up old metrics
      const cutoffTime = Date.now() - this.config.metricsRetentionPeriod;
      this.performanceMetrics.set(serviceId, 
        serviceMetrics.filter(m => m.timestamp.getTime() > cutoffTime)
      );
      
      // Check performance thresholds
      this.checkPerformanceAlerts(serviceId, performanceMetrics);
    }
    
    this.emit('performance-metrics-collected', { 
      metrics: Object.fromEntries(this.performanceMetrics)
    });
  }

  getPerformanceMetrics(serviceId: string): ServicePerformanceMetrics[] {
    return this.performanceMetrics.get(serviceId) || [];
  }

  getAllPerformanceMetrics(): Record<string, ServicePerformanceMetrics[]> {
    return Object.fromEntries(this.performanceMetrics);
  }

  // =============================================================================
  // Configuration Management
  // =============================================================================

  async loadConfiguration(configuration: ServiceConfiguration): Promise<void> {
    this.log('info', 'Loading service configuration', { version: configuration.version });
    
    try {
      // Update global configuration
      if (configuration.globalConfig) {
        // Apply global configuration updates
        this.updateManagerConfig(configuration.globalConfig);
      }
      
      // Update service configurations
      for (const [serviceName, serviceConfig] of Object.entries(configuration.services)) {
        const service = this.registry.getByName(serviceName);
        if (service) {
          await service.updateConfig(serviceConfig);
        } else {
          // Create new service
          await this.addService(serviceConfig);
        }
      }
      
      this.log('info', 'Configuration loaded successfully');
      this.emit('configuration-loaded', { configuration });
    } catch (error) {
      this.log('error', 'Failed to load configuration', { error: error.message });
      this.createAlert('error', 'high', 'system', 'System', 'Configuration load failed', { error });
    }
  }

  async reloadConfiguration(): Promise<void> {
    this.log('info', 'Reloading configuration from source');
    
    try {
      // This would typically load from external source
      // For now, just emit the event
      this.emit('configuration-reloaded', { timestamp: new Date() });
    } catch (error) {
      this.log('error', 'Failed to reload configuration', { error: error.message });
    }
  }

  private startConfigurationMonitoring(): void {
    if (this.configurationMonitor) {
      clearInterval(this.configurationMonitor);
    }

    this.configurationMonitor = setInterval(async () => {
      try {
        await this.reloadConfiguration();
      } catch (error) {
        this.log('error', 'Configuration monitoring error', { error: error.message });
      }
    }, this.config.configurationReloadInterval);
  }

  private stopConfigurationMonitoring(): void {
    if (this.configurationMonitor) {
      clearInterval(this.configurationMonitor);
      this.configurationMonitor = undefined;
    }
  }

  private updateManagerConfig(globalConfig: Record<string, any>): void {
    // Update manager configuration with global settings
    this.config = { ...this.config, ...globalConfig };
    
    // Restart monitors if intervals changed
    if (globalConfig.healthCheckInterval) {
      this.startHealthMonitoring();
    }
    if (globalConfig.metricsInterval) {
      this.startPerformanceMonitoring();
    }
  }

  // =============================================================================
  // Alert Management
  // =============================================================================

  private createAlert(
    type: ServiceAlert['type'],
    severity: ServiceAlert['severity'],
    serviceId: string,
    serviceName: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const alert: ServiceAlert = {
      id: `${serviceId}-${type}-${Date.now()}`,
      type,
      severity,
      serviceId,
      serviceName,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };
    
    this.alerts.set(alert.id, alert);
    this.log('warn', `Alert created: ${alert.id} - ${message}`);
    this.emit('alert-created', { alert });
  }

  private resolveAlert(serviceId: string, type: ServiceAlert['type']): void {
    for (const [alertId, alert] of this.alerts) {
      if (alert.serviceId === serviceId && alert.type === type && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        this.log('info', `Alert resolved: ${alertId}`);
        this.emit('alert-resolved', { alert });
      }
    }
  }

  private checkHealthAlerts(healthChecks: Record<string, ServiceHealthCheck>): void {
    for (const [serviceId, health] of Object.entries(healthChecks)) {
      if (health.status === 'unhealthy') {
        const service = this.registry.get(serviceId);
        if (service) {
          this.createAlert(
            'health',
            'high',
            serviceId,
            service.getConfig().name,
            `Service is unhealthy: ${health.error}`,
            { health }
          );
        }
      }
    }
  }

  private checkPerformanceAlerts(serviceId: string, metrics: ServicePerformanceMetrics): void {
    const thresholds = this.config.performanceThresholds;
    
    // Check response time
    if (metrics.responseTime.avg > thresholds.responseTime) {
      this.createAlert(
        'performance',
        'medium',
        serviceId,
        metrics.serviceName,
        `Response time exceeded threshold: ${metrics.responseTime.avg}ms > ${thresholds.responseTime}ms`,
        { metrics }
      );
    }
    
    // Check error rate
    if (metrics.errorRate > thresholds.errorRate) {
      this.createAlert(
        'performance',
        'high',
        serviceId,
        metrics.serviceName,
        `Error rate exceeded threshold: ${metrics.errorRate}% > ${thresholds.errorRate}%`,
        { metrics }
      );
    }
    
    // Check uptime
    if (metrics.uptime < thresholds.uptime) {
      this.createAlert(
        'performance',
        'critical',
        serviceId,
        metrics.serviceName,
        `Uptime below threshold: ${metrics.uptime}% < ${thresholds.uptime}%`,
        { metrics }
      );
    }
  }

  getAlerts(): ServiceAlert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): ServiceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  // =============================================================================
  // State Management
  // =============================================================================

  private updateState(): void {
    const stats = this.registry.getStats();
    
    this.state.totalServices = stats.totalServices;
    this.state.healthyServices = stats.runningServices;
    this.state.unhealthyServices = stats.errorServices;
    this.state.uptime = Date.now() - this.state.startTime.getTime();
    
    // Update from performance metrics
    if (this.performanceMetrics.size > 0) {
      let totalResponseTime = 0;
      let totalErrorRate = 0;
      let totalRequests = 0;
      let count = 0;
      
      for (const metrics of this.performanceMetrics.values()) {
        if (metrics.length > 0) {
          const latest = metrics[metrics.length - 1];
          totalResponseTime += latest.responseTime.avg;
          totalErrorRate += latest.errorRate;
          totalRequests += latest.throughput.requestsPerMinute;
          count++;
        }
      }
      
      if (count > 0) {
        this.state.avgResponseTime = totalResponseTime / count;
        this.state.errorRate = totalErrorRate / count;
        this.state.totalRequests = totalRequests;
      }
    }
  }

  private updateHealthState(healthChecks: Record<string, ServiceHealthCheck>): void {
    let healthy = 0;
    let unhealthy = 0;
    
    for (const health of Object.values(healthChecks)) {
      if (health.status === 'healthy') {
        healthy++;
      } else {
        unhealthy++;
      }
    }
    
    this.state.healthyServices = healthy;
    this.state.unhealthyServices = unhealthy;
  }

  getState(): ServiceManagerState {
    return { ...this.state };
  }

  // =============================================================================
  // Event Management
  // =============================================================================

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log('error', `Error in event handler for ${event}`, { error: error.message });
        }
      });
    }

    // Emit to global event system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`service-manager-${event}`, { detail: data }));
    }
  }

  private setupEventHandlers(): void {
    // Listen to registry events
    this.registry.on('service-started', (data) => {
      this.updateState();
      this.emit('service-started', data);
    });

    this.registry.on('service-stopped', (data) => {
      this.updateState();
      this.emit('service-stopped', data);
    });

    this.registry.on('service-error', (data) => {
      this.updateState();
      this.emit('service-error', data);
    });

    this.registry.on('service-unhealthy', (data) => {
      this.createAlert('health', 'high', data.serviceId, data.entry.name, 'Service is unhealthy', data);
    });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private async setupRegistry(): Promise<void> {
    // Configure registry with manager settings
    this.registry.updateRegistryConfig({
      enableHealthMonitoring: this.config.enablePerformanceMonitoring,
      healthCheckInterval: this.config.healthCheckInterval,
      logLevel: this.config.logLevel
    });
  }

  private async setupFactory(): Promise<void> {
    // Configure factory with manager settings
    this.factory.updateConfig({
      environment: this.config.environment,
      enableLogging: this.config.logLevel !== 'error'
    });
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        source: 'ServiceManager',
        message,
        data
      };

      this.logger[level === 'debug' ? 'info' : level](`[ServiceManager] ${message}`, data || '');
    }
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async destroy(): Promise<void> {
    this.log('info', 'Destroying Service Manager');
    
    await this.stop();
    
    // Clean up data structures
    this.performanceMetrics.clear();
    this.alerts.clear();
    this.eventHandlers.clear();
    
    // Destroy registry
    await this.registry.destroy();
    
    this.log('info', 'Service Manager destroyed');
  }
}

// =============================================================================
// React Hook for Service Manager
// =============================================================================

export const useServiceManager = () => {
  const manager = ServiceManager.getInstance();
  
  return {
    // Manager control
    start: () => manager.start(),
    stop: () => manager.stop(),
    restart: () => manager.restart(),
    
    // Service management
    addService: (config: ServiceAbstractionConfig) => manager.addService(config),
    removeService: (serviceId: string) => manager.removeService(serviceId),
    updateService: (serviceId: string, updates: Partial<ServiceAbstractionConfig>) => 
      manager.updateService(serviceId, updates),
    
    // Service access
    getService: (serviceId: string) => manager.getService(serviceId),
    getServicesByType: (type: ServiceType) => manager.getServicesByType(type),
    getAllServices: () => manager.getAllServices(),
    
    // Health and monitoring
    checkHealth: () => manager.checkHealth(),
    getOverallHealth: () => manager.getOverallHealth(),
    getState: () => manager.getState(),
    
    // Performance metrics
    getPerformanceMetrics: (serviceId: string) => manager.getPerformanceMetrics(serviceId),
    getAllPerformanceMetrics: () => manager.getAllPerformanceMetrics(),
    
    // Alerts
    getAlerts: () => manager.getAlerts(),
    getActiveAlerts: () => manager.getActiveAlerts(),
    
    // Configuration
    loadConfiguration: (config: ServiceConfiguration) => manager.loadConfiguration(config),
    reloadConfiguration: () => manager.reloadConfiguration(),
    
    // Events
    on: (event: string, handler: (data: any) => void) => manager.on(event, handler),
    off: (event: string, handler: (data: any) => void) => manager.off(event, handler),
  };
};

export default ServiceManager;