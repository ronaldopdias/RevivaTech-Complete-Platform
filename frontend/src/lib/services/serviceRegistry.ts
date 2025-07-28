/**
 * Service Registry - Centralized Service Management
 * 
 * This provides a centralized registry for all services with features:
 * - Service discovery and lookup
 * - Dependency injection
 * - Service lifecycle management
 * - Health monitoring integration
 * - Configuration management
 * - Event-driven architecture
 */

import { AbstractService, ServiceType, ServiceAbstractionConfig } from './serviceAbstraction';
import { ServiceHealthCheck } from './types';

// =============================================================================
// Service Registry Types
// =============================================================================

export interface ServiceRegistryEntry {
  id: string;
  service: AbstractService;
  type: ServiceType;
  name: string;
  config: ServiceAbstractionConfig;
  dependencies: string[];
  dependents: string[];
  status: ServiceStatus;
  registeredAt: Date;
  lastAccessed: Date;
  accessCount: number;
  metadata?: Record<string, any>;
}

export type ServiceStatus = 'registered' | 'initializing' | 'running' | 'stopped' | 'error';

export interface ServiceDependency {
  serviceId: string;
  required: boolean;
  version?: string;
}

export interface ServiceRegistryConfig {
  enableHealthMonitoring: boolean;
  enableDependencyInjection: boolean;
  enableServiceDiscovery: boolean;
  healthCheckInterval: number;
  maxConcurrentServices: number;
  allowCircularDependencies: boolean;
  autoStartServices: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ServiceRegistryStats {
  totalServices: number;
  runningServices: number;
  stoppedServices: number;
  errorServices: number;
  servicesByType: Record<ServiceType, number>;
  averageAccessCount: number;
  memoryUsage: number;
  uptime: number;
}

// =============================================================================
// Service Registry Implementation
// =============================================================================

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceRegistryEntry> = new Map();
  private servicesByType: Map<ServiceType, Set<string>> = new Map();
  private servicesByName: Map<string, string> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private config: ServiceRegistryConfig;
  private healthMonitor?: NodeJS.Timeout;
  private startTime: Date = new Date();
  private logger: typeof console = console;

  private constructor(config: ServiceRegistryConfig) {
    this.config = config;
    this.initializeRegistry();
  }

  // =============================================================================
  // Singleton Pattern
  // =============================================================================

  static getInstance(config?: ServiceRegistryConfig): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      const defaultConfig: ServiceRegistryConfig = {
        enableHealthMonitoring: true,
        enableDependencyInjection: true,
        enableServiceDiscovery: true,
        healthCheckInterval: 30000,
        maxConcurrentServices: 100,
        allowCircularDependencies: false,
        autoStartServices: true,
        logLevel: 'info'
      };

      ServiceRegistry.instance = new ServiceRegistry({ ...defaultConfig, ...config });
    }

    return ServiceRegistry.instance;
  }

  // =============================================================================
  // Service Registration
  // =============================================================================

  async register(
    service: AbstractService,
    dependencies: string[] = [],
    metadata?: Record<string, any>
  ): Promise<string> {
    const config = service.getConfig();
    const serviceId = config.id;

    // Validate service
    this.validateService(service);

    // Check for duplicate registration
    if (this.services.has(serviceId)) {
      throw new Error(`Service with ID ${serviceId} is already registered`);
    }

    // Check service limit
    if (this.services.size >= this.config.maxConcurrentServices) {
      throw new Error(`Maximum concurrent services limit reached: ${this.config.maxConcurrentServices}`);
    }

    // Validate dependencies
    if (this.config.enableDependencyInjection) {
      this.validateDependencies(serviceId, dependencies);
    }

    // Create registry entry
    const entry: ServiceRegistryEntry = {
      id: serviceId,
      service,
      type: config.type,
      name: config.name,
      config,
      dependencies,
      dependents: [],
      status: 'registered',
      registeredAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      metadata
    };

    // Register service
    this.services.set(serviceId, entry);
    
    // Index by type
    if (!this.servicesByType.has(config.type)) {
      this.servicesByType.set(config.type, new Set());
    }
    this.servicesByType.get(config.type)!.add(serviceId);

    // Index by name
    this.servicesByName.set(config.name, serviceId);

    // Update dependency graph
    this.updateDependencyGraph(serviceId, dependencies);

    // Set up event listeners
    this.setupServiceEventListeners(service);

    // Auto-start service if enabled
    if (this.config.autoStartServices) {
      await this.startService(serviceId);
    }

    this.log('info', `Registered service: ${config.name} (${serviceId})`);
    this.emit('service-registered', { serviceId, service, entry });

    return serviceId;
  }

  async unregister(serviceId: string): Promise<boolean> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      return false;
    }

    // Check for dependents
    if (entry.dependents.length > 0) {
      throw new Error(`Cannot unregister service ${serviceId}: has dependents ${entry.dependents.join(', ')}`);
    }

    // Stop service if running
    if (entry.status === 'running') {
      await this.stopService(serviceId);
    }

    // Remove from indexes
    this.services.delete(serviceId);
    this.servicesByType.get(entry.type)?.delete(serviceId);
    this.servicesByName.delete(entry.name);

    // Update dependency graph
    this.removeDependencyGraphEntry(serviceId);

    // Destroy service
    try {
      await entry.service.destroy();
    } catch (error) {
      this.log('error', `Error destroying service ${serviceId}`, { error: error.message });
    }

    this.log('info', `Unregistered service: ${entry.name} (${serviceId})`);
    this.emit('service-unregistered', { serviceId, entry });

    return true;
  }

  // =============================================================================
  // Service Discovery
  // =============================================================================

  get(serviceId: string): AbstractService | undefined {
    const entry = this.services.get(serviceId);
    if (entry) {
      entry.lastAccessed = new Date();
      entry.accessCount++;
      return entry.service;
    }
    return undefined;
  }

  getByName(name: string): AbstractService | undefined {
    const serviceId = this.servicesByName.get(name);
    return serviceId ? this.get(serviceId) : undefined;
  }

  getByType(type: ServiceType): AbstractService[] {
    const serviceIds = this.servicesByType.get(type) || new Set();
    const services: AbstractService[] = [];

    for (const serviceId of serviceIds) {
      const service = this.get(serviceId);
      if (service) {
        services.push(service);
      }
    }

    return services;
  }

  getAll(): AbstractService[] {
    const services: AbstractService[] = [];
    
    for (const [serviceId] of this.services) {
      const service = this.get(serviceId);
      if (service) {
        services.push(service);
      }
    }

    return services;
  }

  getHealthy(): AbstractService[] {
    return this.getAll().filter(service => service.getStatus() === 'healthy');
  }

  getRunning(): AbstractService[] {
    const services: AbstractService[] = [];
    
    for (const [serviceId, entry] of this.services) {
      if (entry.status === 'running') {
        const service = this.get(serviceId);
        if (service) {
          services.push(service);
        }
      }
    }

    return services;
  }

  // =============================================================================
  // Service Lifecycle Management
  // =============================================================================

  async startService(serviceId: string): Promise<boolean> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    if (entry.status === 'running') {
      return true;
    }

    try {
      entry.status = 'initializing';
      
      // Start dependencies first
      await this.startDependencies(serviceId);
      
      // Initialize and connect service
      await entry.service.initialize();
      await entry.service.connect();
      
      entry.status = 'running';
      
      this.log('info', `Started service: ${entry.name} (${serviceId})`);
      this.emit('service-started', { serviceId, entry });
      
      return true;
    } catch (error) {
      entry.status = 'error';
      this.log('error', `Failed to start service: ${entry.name} (${serviceId})`, { error: error.message });
      this.emit('service-error', { serviceId, entry, error });
      throw error;
    }
  }

  async stopService(serviceId: string): Promise<boolean> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    if (entry.status === 'stopped') {
      return true;
    }

    try {
      // Stop dependents first
      await this.stopDependents(serviceId);
      
      // Disconnect service
      await entry.service.disconnect();
      
      entry.status = 'stopped';
      
      this.log('info', `Stopped service: ${entry.name} (${serviceId})`);
      this.emit('service-stopped', { serviceId, entry });
      
      return true;
    } catch (error) {
      entry.status = 'error';
      this.log('error', `Failed to stop service: ${entry.name} (${serviceId})`, { error: error.message });
      this.emit('service-error', { serviceId, entry, error });
      throw error;
    }
  }

  async restartService(serviceId: string): Promise<boolean> {
    await this.stopService(serviceId);
    return await this.startService(serviceId);
  }

  async startAll(): Promise<void> {
    const serviceIds = Array.from(this.services.keys());
    
    // Start services in dependency order
    const startOrder = this.getStartOrder(serviceIds);
    
    for (const serviceId of startOrder) {
      try {
        await this.startService(serviceId);
      } catch (error) {
        this.log('error', `Failed to start service during startAll: ${serviceId}`, { error: error.message });
      }
    }
  }

  async stopAll(): Promise<void> {
    const serviceIds = Array.from(this.services.keys());
    
    // Stop services in reverse dependency order
    const stopOrder = this.getStartOrder(serviceIds).reverse();
    
    for (const serviceId of stopOrder) {
      try {
        await this.stopService(serviceId);
      } catch (error) {
        this.log('error', `Failed to stop service during stopAll: ${serviceId}`, { error: error.message });
      }
    }
  }

  // =============================================================================
  // Health Monitoring
  // =============================================================================

  async checkHealth(): Promise<Record<string, ServiceHealthCheck>> {
    const healthChecks: Record<string, ServiceHealthCheck> = {};

    for (const [serviceId, entry] of this.services) {
      try {
        const health = await entry.service.healthCheck();
        healthChecks[serviceId] = health;
      } catch (error) {
        healthChecks[serviceId] = {
          service: entry.name,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error.message
        };
      }
    }

    return healthChecks;
  }

  async getOverallHealth(): Promise<'healthy' | 'unhealthy' | 'degraded'> {
    const healthChecks = await this.checkHealth();
    const healthStatuses = Object.values(healthChecks).map(h => h.status);
    
    if (healthStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    } else if (healthStatuses.every(status => status === 'unhealthy')) {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  }

  startHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
    }

    this.healthMonitor = setInterval(async () => {
      try {
        const healthChecks = await this.checkHealth();
        this.emit('health-check', healthChecks);
        
        // Handle unhealthy services
        for (const [serviceId, health] of Object.entries(healthChecks)) {
          if (health.status === 'unhealthy') {
            await this.handleUnhealthyService(serviceId);
          }
        }
      } catch (error) {
        this.log('error', 'Health monitoring error', { error: error.message });
      }
    }, this.config.healthCheckInterval);
  }

  stopHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
      this.healthMonitor = undefined;
    }
  }

  // =============================================================================
  // Configuration Management
  // =============================================================================

  async updateServiceConfig(
    serviceId: string,
    configUpdates: Partial<ServiceAbstractionConfig>
  ): Promise<boolean> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      return false;
    }

    try {
      await entry.service.updateConfig(configUpdates);
      entry.config = { ...entry.config, ...configUpdates };
      
      this.log('info', `Updated service config: ${entry.name} (${serviceId})`);
      this.emit('service-config-updated', { serviceId, entry, configUpdates });
      
      return true;
    } catch (error) {
      this.log('error', `Failed to update service config: ${serviceId}`, { error: error.message });
      return false;
    }
  }

  updateRegistryConfig(configUpdates: Partial<ServiceRegistryConfig>): void {
    this.config = { ...this.config, ...configUpdates };
    
    // Restart health monitoring if interval changed
    if (configUpdates.healthCheckInterval && this.healthMonitor) {
      this.startHealthMonitoring();
    }
    
    this.log('info', 'Updated registry configuration', configUpdates);
    this.emit('registry-config-updated', { config: this.config });
  }

  // =============================================================================
  // Statistics and Information
  // =============================================================================

  getStats(): ServiceRegistryStats {
    const stats: ServiceRegistryStats = {
      totalServices: this.services.size,
      runningServices: 0,
      stoppedServices: 0,
      errorServices: 0,
      servicesByType: {},
      averageAccessCount: 0,
      memoryUsage: 0,
      uptime: Date.now() - this.startTime.getTime()
    };

    let totalAccessCount = 0;

    for (const [serviceId, entry] of this.services) {
      // Count by status
      switch (entry.status) {
        case 'running':
          stats.runningServices++;
          break;
        case 'stopped':
          stats.stoppedServices++;
          break;
        case 'error':
          stats.errorServices++;
          break;
      }

      // Count by type
      const type = entry.type;
      stats.servicesByType[type] = (stats.servicesByType[type] || 0) + 1;

      // Sum access counts
      totalAccessCount += entry.accessCount;
    }

    stats.averageAccessCount = this.services.size > 0 ? totalAccessCount / this.services.size : 0;

    // Memory usage (simplified)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      stats.memoryUsage = process.memoryUsage().heapUsed;
    }

    return stats;
  }

  getServiceInfo(serviceId: string): ServiceRegistryEntry | undefined {
    return this.services.get(serviceId);
  }

  getAllServiceInfo(): ServiceRegistryEntry[] {
    return Array.from(this.services.values());
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
      window.dispatchEvent(new CustomEvent(`service-registry-${event}`, { detail: data }));
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private initializeRegistry(): void {
    this.log('info', 'Initializing service registry', this.config);
    
    if (this.config.enableHealthMonitoring) {
      this.startHealthMonitoring();
    }
  }

  private validateService(service: AbstractService): void {
    if (!service) {
      throw new Error('Service cannot be null or undefined');
    }

    const config = service.getConfig();
    if (!config.id) {
      throw new Error('Service must have an ID');
    }

    if (!config.name) {
      throw new Error('Service must have a name');
    }

    if (!config.type) {
      throw new Error('Service must have a type');
    }
  }

  private validateDependencies(serviceId: string, dependencies: string[]): void {
    // Check for self-dependency
    if (dependencies.includes(serviceId)) {
      throw new Error(`Service ${serviceId} cannot depend on itself`);
    }

    // Check for circular dependencies if not allowed
    if (!this.config.allowCircularDependencies) {
      this.detectCircularDependencies(serviceId, dependencies);
    }

    // Check if all dependencies exist
    for (const dep of dependencies) {
      if (!this.services.has(dep)) {
        throw new Error(`Dependency ${dep} not found for service ${serviceId}`);
      }
    }
  }

  private detectCircularDependencies(serviceId: string, dependencies: string[]): void {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const hasCycle = (id: string): boolean => {
      if (stack.has(id)) {
        return true;
      }

      if (visited.has(id)) {
        return false;
      }

      visited.add(id);
      stack.add(id);

      const deps = id === serviceId ? dependencies : (this.services.get(id)?.dependencies || []);
      for (const dep of deps) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      stack.delete(id);
      return false;
    };

    if (hasCycle(serviceId)) {
      throw new Error(`Circular dependency detected for service ${serviceId}`);
    }
  }

  private updateDependencyGraph(serviceId: string, dependencies: string[]): void {
    this.dependencyGraph.set(serviceId, new Set(dependencies));

    // Update dependents
    for (const dep of dependencies) {
      const entry = this.services.get(dep);
      if (entry && !entry.dependents.includes(serviceId)) {
        entry.dependents.push(serviceId);
      }
    }
  }

  private removeDependencyGraphEntry(serviceId: string): void {
    const dependencies = this.dependencyGraph.get(serviceId) || new Set();
    this.dependencyGraph.delete(serviceId);

    // Remove from dependents
    for (const dep of dependencies) {
      const entry = this.services.get(dep);
      if (entry) {
        entry.dependents = entry.dependents.filter(id => id !== serviceId);
      }
    }
  }

  private async startDependencies(serviceId: string): Promise<void> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      return;
    }

    for (const dep of entry.dependencies) {
      const depEntry = this.services.get(dep);
      if (depEntry && depEntry.status !== 'running') {
        await this.startService(dep);
      }
    }
  }

  private async stopDependents(serviceId: string): Promise<void> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      return;
    }

    for (const dependent of entry.dependents) {
      const depEntry = this.services.get(dependent);
      if (depEntry && depEntry.status === 'running') {
        await this.stopService(dependent);
      }
    }
  }

  private getStartOrder(serviceIds: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string): void => {
      if (visited.has(id)) {
        return;
      }

      visited.add(id);
      
      const entry = this.services.get(id);
      if (entry) {
        for (const dep of entry.dependencies) {
          if (serviceIds.includes(dep)) {
            visit(dep);
          }
        }
      }

      result.push(id);
    };

    for (const id of serviceIds) {
      visit(id);
    }

    return result;
  }

  private setupServiceEventListeners(service: AbstractService): void {
    service.on('status_change', (data) => {
      this.emit('service-status-change', { serviceId: service.getConfig().id, ...data });
    });

    service.on('error', (data) => {
      this.emit('service-error', { serviceId: service.getConfig().id, ...data });
    });

    service.on('health_check', (data) => {
      this.emit('service-health-check', { serviceId: service.getConfig().id, ...data });
    });
  }

  private async handleUnhealthyService(serviceId: string): Promise<void> {
    const entry = this.services.get(serviceId);
    if (!entry) {
      return;
    }

    this.log('warn', `Service is unhealthy: ${entry.name} (${serviceId})`);

    // Implement recovery strategies
    // For now, just emit an event
    this.emit('service-unhealthy', { serviceId, entry });
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        source: 'ServiceRegistry',
        message,
        data
      };

      this.logger[level === 'debug' ? 'info' : level](`[ServiceRegistry] ${message}`, data || '');
    }
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async destroy(): Promise<void> {
    this.stopHealthMonitoring();
    
    // Stop all services
    await this.stopAll();
    
    // Unregister all services
    for (const serviceId of Array.from(this.services.keys())) {
      await this.unregister(serviceId);
    }
    
    // Clear all data structures
    this.services.clear();
    this.servicesByType.clear();
    this.servicesByName.clear();
    this.dependencyGraph.clear();
    this.eventHandlers.clear();
    
    this.log('info', 'Service registry destroyed');
  }
}

export default ServiceRegistry;