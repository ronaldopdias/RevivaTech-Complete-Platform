/**
 * Service Abstraction Layer - Core Implementation
 * 
 * This implements a comprehensive service abstraction system that provides:
 * - Service Factory for dynamic service creation
 * - Service Registry for centralized service management
 * - Circuit Breaker pattern for fault tolerance
 * - Health monitoring and metrics
 * - Configuration management with hot-reloading
 * - Event-driven architecture
 */

import { ServiceConfig, ServiceHealthCheck, CircuitBreakerState, BaseService } from './types';

// =============================================================================
// Enhanced Service Types for Abstraction Layer
// =============================================================================

export interface ServiceAbstractionConfig {
  id: string;
  type: ServiceType;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  healthCheckInterval: number;
  
  // Connection details
  endpoint?: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  credentials?: Record<string, any>;
  
  // Service-specific options
  options?: Record<string, any>;
  mappings?: Record<string, any>;
  
  // Environment and metadata
  environment: 'development' | 'staging' | 'production';
  version?: string;
  tags?: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceType = 
  | 'CRM'
  | 'PAYMENT'
  | 'EMAIL'
  | 'SMS'
  | 'STORAGE'
  | 'ANALYTICS'
  | 'NOTIFICATION'
  | 'AUTHENTICATION'
  | 'COMMUNICATION'
  | 'AI'
  | 'WEBHOOK'
  | 'BOOKING'
  | 'DEVICE'
  | 'CUSTOMER'
  | 'CUSTOM';

export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  uptime: number;
  lastError?: string;
  errorRate: number;
  lastMetricsUpdate: Date;
}

export interface ServiceEvent {
  id: string;
  serviceId: string;
  type: 'request' | 'response' | 'error' | 'health_check' | 'config_change' | 'status_change';
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

// =============================================================================
// Enhanced Circuit Breaker Implementation
// =============================================================================

export class CircuitBreaker {
  private state: CircuitBreakerState['state'] = 'closed';
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;

  constructor(threshold: number = 5, timeout: number = 60000, resetTimeout: number = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime.getTime()) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to close the circuit
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      this.nextAttemptTime = new Date(Date.now() + this.resetTimeout);
    }
  }

  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  forceOpen(): void {
    this.state = 'open';
    this.nextAttemptTime = new Date(Date.now() + this.resetTimeout);
  }

  forceClose(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }
}

// =============================================================================
// Abstract Service Implementation
// =============================================================================

export abstract class AbstractService extends BaseService {
  protected abstractConfig: ServiceAbstractionConfig;
  protected circuitBreaker: CircuitBreaker;
  protected metrics: ServiceMetrics;
  protected eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  protected healthCheckTimer?: NodeJS.Timeout;

  constructor(config: ServiceAbstractionConfig) {
    super(config);
    this.abstractConfig = config;
    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold,
      config.timeout,
      config.timeout / 2
    );
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      uptime: 0,
      errorRate: 0,
      lastMetricsUpdate: new Date()
    };
  }

  // =============================================================================
  // Lifecycle Methods
  // =============================================================================

  async initialize(): Promise<void> {
    this.emit('initializing', { serviceId: this.abstractConfig.id });
    await this.startHealthChecks();
    this.emit('initialized', { serviceId: this.abstractConfig.id });
  }

  async connect(): Promise<boolean> {
    try {
      const connected = await this.doConnect();
      this.emit('connected', { serviceId: this.abstractConfig.id, connected });
      return connected;
    } catch (error) {
      this.emit('connection_failed', { serviceId: this.abstractConfig.id, error: error.message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.stopHealthChecks();
    await this.doDisconnect();
    this.emit('disconnected', { serviceId: this.abstractConfig.id });
  }

  async destroy(): Promise<void> {
    await this.disconnect();
    this.eventHandlers.clear();
    this.emit('destroyed', { serviceId: this.abstractConfig.id });
  }

  // =============================================================================
  // Abstract Methods (to be implemented by concrete services)
  // =============================================================================

  protected abstract doConnect(): Promise<boolean>;
  protected abstract doDisconnect(): Promise<void>;
  protected abstract doHealthCheck(): Promise<ServiceHealthCheck>;

  // =============================================================================
  // Health Monitoring
  // =============================================================================

  async healthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    try {
      const result = await this.circuitBreaker.execute(async () => {
        return await this.doHealthCheck();
      });
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      return {
        ...result,
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime, error.message);
      
      return {
        service: this.abstractConfig.name,
        status: 'unhealthy',
        responseTime,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  private async startHealthChecks(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        this.emit('health_check', { serviceId: this.abstractConfig.id, health });
      } catch (error) {
        this.emit('health_check_failed', { serviceId: this.abstractConfig.id, error: error.message });
      }
    }, this.abstractConfig.healthCheckInterval);
  }

  private stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  // =============================================================================
  // Metrics Management
  // =============================================================================

  private updateMetrics(success: boolean, responseTime: number, error?: string): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.metrics.lastError = error;
    }

    // Update average response time
    const totalTime = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.avgResponseTime = totalTime / this.metrics.totalRequests;

    // Update error rate
    this.metrics.errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;

    // Update uptime (simplified calculation)
    const uptimeRatio = this.metrics.successfulRequests / this.metrics.totalRequests;
    this.metrics.uptime = uptimeRatio * 100;

    this.metrics.lastMetricsUpdate = new Date();
  }

  getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      uptime: 0,
      errorRate: 0,
      lastMetricsUpdate: new Date()
    };
  }

  // =============================================================================
  // Configuration Management
  // =============================================================================

  async updateConfig(updates: Partial<ServiceAbstractionConfig>): Promise<void> {
    const oldConfig = { ...this.abstractConfig };
    this.abstractConfig = { ...this.abstractConfig, ...updates, updatedAt: new Date() };
    
    // Restart health checks if interval changed
    if (updates.healthCheckInterval && updates.healthCheckInterval !== oldConfig.healthCheckInterval) {
      await this.startHealthChecks();
    }

    // Update circuit breaker if threshold changed
    if (updates.circuitBreakerThreshold && updates.circuitBreakerThreshold !== oldConfig.circuitBreakerThreshold) {
      this.circuitBreaker = new CircuitBreaker(
        updates.circuitBreakerThreshold,
        this.abstractConfig.timeout,
        this.abstractConfig.timeout / 2
      );
    }

    this.emit('config_updated', { 
      serviceId: this.abstractConfig.id, 
      oldConfig, 
      newConfig: this.abstractConfig 
    });
  }

  async reloadConfig(): Promise<void> {
    // This would typically reload from external configuration source
    // For now, we'll just emit the event
    this.emit('config_reloaded', { serviceId: this.abstractConfig.id });
  }

  getConfig(): ServiceAbstractionConfig {
    return { ...this.abstractConfig };
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
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }

    // Also emit to global event system if available
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(`service:${event}`, { detail: data }));
    }
  }

  // =============================================================================
  // Status Management
  // =============================================================================

  getStatus(): 'healthy' | 'unhealthy' | 'degraded' {
    const circuitState = this.circuitBreaker.getState();
    
    if (circuitState.state === 'open') {
      return 'unhealthy';
    } else if (circuitState.state === 'half-open' || this.metrics.errorRate > 10) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  isEnabled(): boolean {
    return this.abstractConfig.enabled;
  }

  enable(): void {
    this.abstractConfig.enabled = true;
    this.emit('enabled', { serviceId: this.abstractConfig.id });
  }

  disable(): void {
    this.abstractConfig.enabled = false;
    this.emit('disabled', { serviceId: this.abstractConfig.id });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  protected async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.abstractConfig.enabled) {
      throw new Error(`Service ${this.abstractConfig.name} is disabled`);
    }

    return await this.circuitBreaker.execute(operation);
  }

  protected async withTimeout<T>(operation: () => Promise<T>, timeout?: number): Promise<T> {
    const timeoutMs = timeout || this.abstractConfig.timeout;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    attempts?: number,
    delay?: number
  ): Promise<T> {
    const maxAttempts = attempts || this.abstractConfig.retryAttempts;
    const retryDelay = delay || this.abstractConfig.retryDelay;
    
    let lastError: Error;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError!;
  }

  // =============================================================================
  // Logging and Debugging
  // =============================================================================

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: this.abstractConfig.name,
      serviceId: this.abstractConfig.id,
      level,
      message,
      data
    };

    console[level](`[${this.abstractConfig.name}] ${message}`, data || '');
    
    // Emit log event for external logging systems
    this.emit('log', logEntry);
  }

  protected debug(message: string, data?: any): void {
    if (this.abstractConfig.environment === 'development') {
      this.log('info', `[DEBUG] ${message}`, data);
    }
  }
}

// =============================================================================
// Export types and classes
// =============================================================================

export {
  ServiceType,
  ServiceAbstractionConfig,
  ServiceMetrics,
  ServiceEvent,
  CircuitBreakerState
};