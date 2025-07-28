/**
 * Advanced Service Factory - Enhanced Service Management System
 * 
 * This extends the existing ServiceFactory with advanced features:
 * - Service abstraction layer
 * - Advanced health monitoring
 * - Circuit breaker pattern
 * - Configuration management
 * - Service registry with dependency injection
 * - Plugin architecture support
 */

import { ServiceFactory as BaseServiceFactory, ServiceFactoryConfig as BaseConfig } from './serviceFactory';
import { ServiceAbstractionConfig, AbstractService, ServiceType } from './serviceAbstraction';
import { ServiceConfig } from './types';

// =============================================================================
// Enhanced Service Factory Types
// =============================================================================

export interface AdvancedServiceFactoryConfig extends BaseConfig {
  // Advanced features
  enableAdvancedMonitoring?: boolean;
  enableCircuitBreaker?: boolean;
  enableServiceRegistry?: boolean;
  enableDependencyInjection?: boolean;
  
  // Health monitoring
  healthCheckInterval?: number;
  unhealthyThreshold?: number;
  
  // Circuit breaker settings
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  circuitBreakerResetTimeout?: number;
  
  // Service configuration
  serviceConfigs?: Record<string, ServiceAbstractionConfig>;
  
  // Plugin system
  plugins?: ServicePlugin[];
}

export interface ServicePlugin {
  name: string;
  version: string;
  initialize(factory: AdvancedServiceFactory): void;
  destroy?(): void;
}

export interface ServiceDefinition {
  name: string;
  type: ServiceType;
  priority: number;
  dependencies: string[];
  config: ServiceAbstractionConfig;
  instance?: AbstractService;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'unhealthy' | 'degraded';
}

export interface ServiceRegistryEntry {
  service: AbstractService;
  definition: ServiceDefinition;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

// =============================================================================
// Advanced Service Factory Implementation
// =============================================================================

export class AdvancedServiceFactory extends BaseServiceFactory {
  private static advancedInstance: AdvancedServiceFactory;
  private advancedConfig: AdvancedServiceFactoryConfig;
  private serviceRegistry: Map<string, ServiceRegistryEntry> = new Map();
  private serviceDefinitions: Map<string, ServiceDefinition> = new Map();
  private serviceConstructors: Map<ServiceType, typeof AbstractService> = new Map();
  private plugins: Map<string, ServicePlugin> = new Map();
  private healthMonitor?: NodeJS.Timeout;
  private logger: typeof console = console;

  private constructor(config: AdvancedServiceFactoryConfig) {
    super(config);
    this.advancedConfig = config;
    this.initializeAdvancedFeatures();
  }

  // =============================================================================
  // Singleton Pattern
  // =============================================================================

  static getAdvancedInstance(config?: AdvancedServiceFactoryConfig): AdvancedServiceFactory {
    if (!AdvancedServiceFactory.advancedInstance) {
      const defaultConfig: AdvancedServiceFactoryConfig = {
        environment: 'development',
        useMockServices: false,
        enableAdvancedMonitoring: true,
        enableCircuitBreaker: true,
        enableServiceRegistry: true,
        enableDependencyInjection: true,
        healthCheckInterval: 30000,
        unhealthyThreshold: 3,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 60000,
        circuitBreakerResetTimeout: 30000,
        serviceConfigs: {},
        plugins: []
      };
      
      AdvancedServiceFactory.advancedInstance = new AdvancedServiceFactory(
        { ...defaultConfig, ...config }
      );
    }
    
    return AdvancedServiceFactory.advancedInstance;
  }

  // =============================================================================
  // Advanced Service Management
  // =============================================================================

  registerServiceType(type: ServiceType, constructor: typeof AbstractService): void {
    this.serviceConstructors.set(type, constructor);
    this.log('info', `Registered service type: ${type}`);
  }

  registerServiceDefinition(definition: ServiceDefinition): void {
    this.validateServiceDefinition(definition);
    this.serviceDefinitions.set(definition.name, definition);
    this.log('info', `Registered service definition: ${definition.name}`);
  }

  async createAdvancedService(
    name: string,
    overrideConfig?: Partial<ServiceAbstractionConfig>
  ): Promise<AbstractService> {
    const definition = this.serviceDefinitions.get(name);
    if (!definition) {
      throw new Error(`Service definition not found: ${name}`);
    }

    // Check if service already exists
    const existingEntry = this.serviceRegistry.get(name);
    if (existingEntry) {
      existingEntry.lastAccessed = new Date();
      existingEntry.accessCount++;
      return existingEntry.service;
    }

    // Check dependencies
    await this.resolveDependencies(definition);

    // Merge configurations
    const finalConfig = this.mergeConfigurations(definition.config, overrideConfig || {});

    // Create service instance
    const ServiceConstructor = this.serviceConstructors.get(definition.type);
    if (!ServiceConstructor) {
      throw new Error(`Service constructor not found for type: ${definition.type}`);
    }

    const service = new ServiceConstructor(finalConfig);

    // Initialize service
    await this.initializeService(service, definition);

    // Register in registry
    const registryEntry: ServiceRegistryEntry = {
      service,
      definition,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1
    };
    
    this.serviceRegistry.set(name, registryEntry);

    this.log('info', `Created advanced service: ${name}`, { type: definition.type });
    return service;
  }

  async createServicesByType(type: ServiceType): Promise<AbstractService[]> {
    const definitions = Array.from(this.serviceDefinitions.values())
      .filter(def => def.type === type)
      .sort((a, b) => b.priority - a.priority);

    const services: AbstractService[] = [];
    
    for (const definition of definitions) {
      try {
        const service = await this.createAdvancedService(definition.name);
        services.push(service);
      } catch (error) {
        this.log('error', `Failed to create service: ${definition.name}`, { error: error.message });
      }
    }

    return services;
  }

  // =============================================================================
  // Service Registry Management
  // =============================================================================

  getRegisteredService(name: string): AbstractService | undefined {
    const entry = this.serviceRegistry.get(name);
    if (entry) {
      entry.lastAccessed = new Date();
      entry.accessCount++;
      return entry.service;
    }
    return undefined;
  }

  getServicesByType(type: ServiceType): AbstractService[] {
    const services: AbstractService[] = [];
    
    for (const [name, entry] of this.serviceRegistry) {
      if (entry.definition.type === type) {
        entry.lastAccessed = new Date();
        entry.accessCount++;
        services.push(entry.service);
      }
    }
    
    return services;
  }

  async removeService(name: string): Promise<boolean> {
    const entry = this.serviceRegistry.get(name);
    if (!entry) {
      return false;
    }

    // Destroy service
    try {
      await entry.service.destroy();
      this.serviceRegistry.delete(name);
      this.log('info', `Removed service: ${name}`);
      return true;
    } catch (error) {
      this.log('error', `Failed to remove service: ${name}`, { error: error.message });
      return false;
    }
  }

  async removeServicesByType(type: ServiceType): Promise<number> {
    const services = this.getServicesByType(type);
    let removed = 0;

    for (const service of services) {
      const serviceName = service.getConfig().name;
      if (await this.removeService(serviceName)) {
        removed++;
      }
    }

    return removed;
  }

  // =============================================================================
  // Advanced Health Monitoring
  // =============================================================================

  async checkAdvancedHealthStatus(): Promise<Record<string, any>> {
    const healthStatus: Record<string, any> = {};

    for (const [name, entry] of this.serviceRegistry) {
      try {
        const health = await entry.service.healthCheck();
        const metrics = entry.service.getMetrics();
        
        healthStatus[name] = {
          health,
          metrics,
          registryInfo: {
            createdAt: entry.createdAt,
            lastAccessed: entry.lastAccessed,
            accessCount: entry.accessCount
          }
        };
      } catch (error) {
        healthStatus[name] = {
          health: {
            service: name,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date()
          },
          metrics: null,
          registryInfo: {
            createdAt: entry.createdAt,
            lastAccessed: entry.lastAccessed,
            accessCount: entry.accessCount
          }
        };
      }
    }

    return healthStatus;
  }

  startAdvancedHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
    }

    this.healthMonitor = setInterval(async () => {
      const healthStatus = await this.checkAdvancedHealthStatus();
      
      // Process health status
      for (const [serviceName, status] of Object.entries(healthStatus)) {
        const entry = this.serviceRegistry.get(serviceName);
        if (entry) {
          entry.definition.healthStatus = status.health.status;
          entry.definition.lastHealthCheck = new Date();
          
          // Handle unhealthy services
          if (status.health.status === 'unhealthy') {
            this.handleUnhealthyService(serviceName, entry);
          }
        }
      }

      // Emit health check event
      this.emitEvent('advanced-health-check', healthStatus);
    }, this.advancedConfig.healthCheckInterval || 30000);
  }

  stopAdvancedHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
      this.healthMonitor = undefined;
    }
  }

  // =============================================================================
  // Plugin System
  // =============================================================================

  registerPlugin(plugin: ServicePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this.plugins.set(plugin.name, plugin);
    plugin.initialize(this);
    this.log('info', `Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  unregisterPlugin(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return false;
    }

    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(name);
    this.log('info', `Unregistered plugin: ${name}`);
    return true;
  }

  getPlugin(name: string): ServicePlugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): ServicePlugin[] {
    return Array.from(this.plugins.values());
  }

  // =============================================================================
  // Configuration Management
  // =============================================================================

  async updateServiceConfig(
    serviceName: string,
    configUpdates: Partial<ServiceAbstractionConfig>
  ): Promise<boolean> {
    const entry = this.serviceRegistry.get(serviceName);
    if (!entry) {
      return false;
    }

    try {
      await entry.service.updateConfig(configUpdates);
      this.log('info', `Updated service config: ${serviceName}`);
      return true;
    } catch (error) {
      this.log('error', `Failed to update service config: ${serviceName}`, { error: error.message });
      return false;
    }
  }

  async reloadServiceConfig(serviceName: string): Promise<boolean> {
    const entry = this.serviceRegistry.get(serviceName);
    if (!entry) {
      return false;
    }

    try {
      await entry.service.reloadConfig();
      this.log('info', `Reloaded service config: ${serviceName}`);
      return true;
    } catch (error) {
      this.log('error', `Failed to reload service config: ${serviceName}`, { error: error.message });
      return false;
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private initializeAdvancedFeatures(): void {
    this.log('info', 'Initializing advanced service factory features', {
      enableAdvancedMonitoring: this.advancedConfig.enableAdvancedMonitoring,
      enableCircuitBreaker: this.advancedConfig.enableCircuitBreaker,
      enableServiceRegistry: this.advancedConfig.enableServiceRegistry
    });

    // Initialize plugins
    if (this.advancedConfig.plugins) {
      for (const plugin of this.advancedConfig.plugins) {
        this.registerPlugin(plugin);
      }
    }

    // Start health monitoring
    if (this.advancedConfig.enableAdvancedMonitoring) {
      this.startAdvancedHealthMonitoring();
    }
  }

  private validateServiceDefinition(definition: ServiceDefinition): void {
    if (!definition.name) {
      throw new Error('Service definition must have a name');
    }
    
    if (!definition.type) {
      throw new Error('Service definition must have a type');
    }
    
    if (!definition.config) {
      throw new Error('Service definition must have a config');
    }
  }

  private async resolveDependencies(definition: ServiceDefinition): Promise<void> {
    for (const dependency of definition.dependencies) {
      if (!this.serviceRegistry.has(dependency)) {
        // Try to create the dependency
        const depDefinition = this.serviceDefinitions.get(dependency);
        if (depDefinition) {
          await this.createAdvancedService(dependency);
        } else {
          throw new Error(`Dependency not found: ${dependency}`);
        }
      }
    }
  }

  private mergeConfigurations(
    baseConfig: ServiceAbstractionConfig,
    overrideConfig: Partial<ServiceAbstractionConfig>
  ): ServiceAbstractionConfig {
    return {
      ...baseConfig,
      ...overrideConfig,
      updatedAt: new Date()
    };
  }

  private async initializeService(service: AbstractService, definition: ServiceDefinition): Promise<void> {
    // Initialize service
    await service.initialize();
    
    // Connect if auto-connect is enabled
    if (definition.config.enabled !== false) {
      await service.connect();
    }
  }

  private handleUnhealthyService(serviceName: string, entry: ServiceRegistryEntry): void {
    this.log('warn', `Service is unhealthy: ${serviceName}`);
    
    // Implement recovery strategies here
    // For now, just emit an event
    this.emitEvent('service-unhealthy', {
      serviceName,
      service: entry.service,
      definition: entry.definition
    });
  }

  private emitEvent(eventName: string, data: any): void {
    // Emit to plugins
    for (const plugin of this.plugins.values()) {
      if (typeof (plugin as any).onEvent === 'function') {
        try {
          (plugin as any).onEvent(eventName, data);
        } catch (error) {
          this.log('error', `Plugin event handler error: ${plugin.name}`, { error: error.message });
        }
      }
    }

    // Emit to global event system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`advanced-service-${eventName}`, { detail: data }));
    }
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (this.advancedConfig.environment === 'production' && level === 'info') {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      source: 'AdvancedServiceFactory',
      message,
      data
    };

    this.logger[level](`[AdvancedServiceFactory] ${message}`, data || '');
  }

  // =============================================================================
  // Statistics and Monitoring
  // =============================================================================

  getServiceStatistics(): {
    totalServices: number;
    servicesByType: Record<ServiceType, number>;
    servicesByStatus: Record<string, number>;
    averageAccessCount: number;
    totalPlugins: number;
  } {
    const stats = {
      totalServices: this.serviceRegistry.size,
      servicesByType: {} as Record<ServiceType, number>,
      servicesByStatus: {} as Record<string, number>,
      averageAccessCount: 0,
      totalPlugins: this.plugins.size
    };

    let totalAccess = 0;
    
    for (const [name, entry] of this.serviceRegistry) {
      // Count by type
      const type = entry.definition.type;
      stats.servicesByType[type] = (stats.servicesByType[type] || 0) + 1;
      
      // Count by status
      const status = entry.definition.healthStatus || 'unknown';
      stats.servicesByStatus[status] = (stats.servicesByStatus[status] || 0) + 1;
      
      // Sum access count
      totalAccess += entry.accessCount;
    }

    stats.averageAccessCount = this.serviceRegistry.size > 0 ? totalAccess / this.serviceRegistry.size : 0;

    return stats;
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async destroyAdvanced(): Promise<void> {
    this.stopAdvancedHealthMonitoring();
    
    // Destroy all services
    for (const [name, entry] of this.serviceRegistry) {
      try {
        await entry.service.destroy();
      } catch (error) {
        this.log('error', `Error destroying service: ${name}`, { error: error.message });
      }
    }
    
    // Unregister all plugins
    for (const pluginName of this.plugins.keys()) {
      this.unregisterPlugin(pluginName);
    }
    
    this.serviceRegistry.clear();
    this.serviceDefinitions.clear();
    this.serviceConstructors.clear();
    
    // Call base destroy
    this.destroy();
  }
}

// =============================================================================
// React Hook for Advanced Services
// =============================================================================

export const useAdvancedServices = () => {
  const factory = AdvancedServiceFactory.getAdvancedInstance();
  
  return {
    // Service access
    getService: (name: string) => factory.getRegisteredService(name),
    getServicesByType: (type: ServiceType) => factory.getServicesByType(type),
    createService: (name: string, config?: Partial<ServiceAbstractionConfig>) => 
      factory.createAdvancedService(name, config),
    
    // Health monitoring
    checkHealth: () => factory.checkAdvancedHealthStatus(),
    startHealthMonitoring: () => factory.startAdvancedHealthMonitoring(),
    stopHealthMonitoring: () => factory.stopAdvancedHealthMonitoring(),
    
    // Configuration
    updateServiceConfig: (name: string, config: Partial<ServiceAbstractionConfig>) =>
      factory.updateServiceConfig(name, config),
    reloadServiceConfig: (name: string) => factory.reloadServiceConfig(name),
    
    // Statistics
    getStatistics: () => factory.getServiceStatistics(),
    
    // Plugin management
    registerPlugin: (plugin: ServicePlugin) => factory.registerPlugin(plugin),
    unregisterPlugin: (name: string) => factory.unregisterPlugin(name),
    
    // Base service access (from original factory)
    booking: factory.getBookingService(),
    customer: factory.getCustomerService(),
    device: factory.getDeviceService(),
  };
};

export default AdvancedServiceFactory;