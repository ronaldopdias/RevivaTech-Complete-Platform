# Service Abstraction Layer - Complete Implementation Guide

## 🎯 Overview

The Service Abstraction Layer provides a comprehensive, enterprise-grade solution for managing external service integrations in the RevivaTech platform. This system enables seamless integration with CRM systems, payment processors, email services, and other external APIs with built-in resilience, monitoring, and configuration management.

## 🏗️ Architecture Overview

### Core Components

1. **Service Abstraction Layer** (`serviceAbstraction.ts`)
   - Base service interfaces and patterns
   - Circuit breaker implementation
   - Health monitoring and metrics
   - Configuration management

2. **Advanced Service Factory** (`advancedServiceFactory.ts`)
   - Dynamic service creation and registration
   - Dependency injection
   - Plugin system support
   - Service lifecycle management

3. **Service Registry** (`serviceRegistry.ts`)
   - Centralized service discovery
   - Dependency resolution
   - Health monitoring integration
   - Event-driven architecture

4. **Service Manager** (`serviceManager.ts`)
   - High-level service orchestration
   - Configuration hot-reloading
   - Performance monitoring
   - Alert management

### Key Features

- **Circuit Breaker Pattern**: Prevents cascading failures
- **Health Monitoring**: Real-time service health checks
- **Configuration Management**: Hot-reloading and environment-specific configs
- **Dependency Injection**: Automatic dependency resolution
- **Plugin System**: Extensible architecture
- **Performance Monitoring**: Metrics collection and analysis
- **Error Recovery**: Automatic retry and recovery strategies

## 🚀 Quick Start

### 1. Basic Service Implementation

```typescript
import { AbstractService, ServiceAbstractionConfig } from './serviceAbstraction';

// Define service configuration
interface MyServiceConfig extends ServiceAbstractionConfig {
  type: 'CUSTOM';
  options: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
  };
}

// Implement service
class MyService extends AbstractService {
  private config: MyServiceConfig;
  
  constructor(config: MyServiceConfig) {
    super(config);
    this.config = config;
  }

  protected async doConnect(): Promise<boolean> {
    // Implementation for connecting to external service
    return true;
  }

  protected async doDisconnect(): Promise<void> {
    // Implementation for disconnecting from external service
  }

  protected async doHealthCheck(): Promise<ServiceHealthCheck> {
    // Implementation for health checking
    return {
      service: this.config.name,
      status: 'healthy',
      responseTime: 100,
      timestamp: new Date()
    };
  }

  // Custom service methods
  async doSomething(): Promise<any> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          // Your service logic here
        });
      });
    });
  }
}
```

### 2. Service Registration and Usage

```typescript
import { ServiceManager } from './serviceManager';

// Get service manager instance
const serviceManager = ServiceManager.getInstance();

// Initialize the service manager
await serviceManager.initialize();

// Add a service
const serviceConfig: ServiceAbstractionConfig = {
  id: 'my-service',
  type: 'CUSTOM',
  name: 'My Custom Service',
  enabled: true,
  priority: 1,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  healthCheckInterval: 60000,
  environment: 'development',
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
  options: {
    apiKey: 'your-api-key',
    baseUrl: 'https://api.example.com',
    timeout: 30000
  }
};

const service = await serviceManager.addService(serviceConfig);

// Use the service
const result = await service.doSomething();
```

### 3. React Hook Usage

```typescript
import { useServiceManager } from './serviceManager';
import { useEffect, useState } from 'react';

function MyComponent() {
  const {
    getService,
    checkHealth,
    getActiveAlerts
  } = useServiceManager();
  
  const [healthStatus, setHealthStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const checkServiceHealth = async () => {
      const health = await checkHealth();
      setHealthStatus(health);
      
      const activeAlerts = getActiveAlerts();
      setAlerts(activeAlerts);
    };
    
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h2>Service Status</h2>
      {healthStatus && (
        <div>
          {Object.entries(healthStatus).map(([serviceId, health]) => (
            <div key={serviceId}>
              <span>{serviceId}: {health.status}</span>
            </div>
          ))}
        </div>
      )}
      
      <h2>Active Alerts</h2>
      {alerts.map(alert => (
        <div key={alert.id} className={`alert-${alert.severity}`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
}
```

## 📖 Service Implementation Examples

### Email Service Example

See `examples/EmailServiceExample.ts` for a complete implementation of an email service with:
- Multiple provider support (SMTP, SendGrid, Mailgun, SES)
- Template management
- Rate limiting
- Bulk email capabilities
- Error handling and retry logic

### CRM Service Example

See `examples/CRMServiceExample.ts` for a complete CRM integration with:
- Multiple CRM provider support (HubSpot, Salesforce, Pipedrive, Zoho)
- Contact, deal, and activity management
- Bidirectional sync capabilities
- Webhook handling
- Field mapping and transformation

## 🛠️ Advanced Features

### Circuit Breaker Pattern

The circuit breaker prevents cascading failures by monitoring service health and automatically "opening" the circuit when failures exceed a threshold.

```typescript
// Circuit breaker automatically applied when using service methods
const result = await service.withCircuitBreaker(async () => {
  return await externalAPICall();
});
```

**States:**
- **Closed**: Normal operation, requests pass through
- **Open**: Circuit is open, requests fail immediately
- **Half-Open**: Testing if service has recovered

### Health Monitoring

Services automatically report health status and metrics:

```typescript
// Get service health
const health = await service.healthCheck();

// Monitor service metrics
const metrics = service.getMetrics();
console.log(`Error rate: ${metrics.errorRate}%`);
console.log(`Average response time: ${metrics.avgResponseTime}ms`);
```

### Configuration Management

Services support hot-reloading of configuration:

```typescript
// Update service configuration
await service.updateConfig({
  timeout: 60000,
  retryAttempts: 5
});

// Reload configuration from external source
await service.reloadConfig();
```

### Event System

Services emit events for monitoring and integration:

```typescript
// Listen to service events
service.on('health_check', (data) => {
  console.log('Health check result:', data);
});

service.on('error', (error) => {
  console.error('Service error:', error);
});

service.on('config_updated', (config) => {
  console.log('Configuration updated:', config);
});
```

## 🔧 Configuration

### Service Configuration Structure

```typescript
interface ServiceAbstractionConfig {
  id: string;                    // Unique service identifier
  type: ServiceType;             // Service type (CRM, EMAIL, etc.)
  name: string;                  // Human-readable service name
  description?: string;          // Service description
  enabled: boolean;              // Enable/disable service
  priority: number;              // Service priority (1-10)
  timeout: number;               // Request timeout in milliseconds
  retryAttempts: number;         // Number of retry attempts
  retryDelay: number;            // Delay between retries
  circuitBreakerThreshold: number; // Circuit breaker failure threshold
  healthCheckInterval: number;   // Health check interval
  
  // Connection details
  endpoint?: string;             // Service endpoint URL
  apiKey?: string;               // API key for authentication
  accessToken?: string;          // Access token
  refreshToken?: string;         // Refresh token
  credentials?: Record<string, any>; // Additional credentials
  
  // Service-specific options
  options?: Record<string, any>; // Service-specific configuration
  mappings?: Record<string, any>; // Field mappings
  
  // Environment and metadata
  environment: 'development' | 'staging' | 'production';
  version?: string;              // Service version
  tags?: string[];               // Service tags
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Environment-Specific Configuration

```typescript
// Development configuration
const devConfig: ServiceAbstractionConfig = {
  id: 'email-service-dev',
  type: 'EMAIL',
  name: 'Email Service (Development)',
  enabled: true,
  priority: 1,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  healthCheckInterval: 60000,
  environment: 'development',
  options: {
    provider: 'smtp',
    host: 'localhost',
    port: 1025,
    secure: false,
    from: 'dev@revivatech.co.uk'
  }
};

// Production configuration
const prodConfig: ServiceAbstractionConfig = {
  ...devConfig,
  id: 'email-service-prod',
  name: 'Email Service (Production)',
  environment: 'production',
  timeout: 10000,
  retryAttempts: 5,
  healthCheckInterval: 30000,
  options: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    from: 'noreply@revivatech.co.uk'
  }
};
```

## 📊 Monitoring and Metrics

### Service Metrics

Services automatically collect and report metrics:

```typescript
interface ServiceMetrics {
  totalRequests: number;         // Total requests processed
  successfulRequests: number;    // Successful requests
  failedRequests: number;        // Failed requests
  avgResponseTime: number;       // Average response time
  uptime: number;               // Service uptime percentage
  lastError?: string;           // Last error message
  errorRate: number;            // Error rate percentage
  lastMetricsUpdate: Date;      // Last metrics update
}
```

### Performance Monitoring

```typescript
// Get performance metrics for a service
const metrics = serviceManager.getPerformanceMetrics('email-service');

// Get all performance metrics
const allMetrics = serviceManager.getAllPerformanceMetrics();

// Monitor service statistics
const stats = serviceManager.getStatistics();
console.log(`Total services: ${stats.totalServices}`);
console.log(`Healthy services: ${stats.servicesByStatus.healthy}`);
```

### Alert System

The system automatically generates alerts for service issues:

```typescript
// Get active alerts
const alerts = serviceManager.getActiveAlerts();

// Listen for new alerts
serviceManager.on('alert-created', (alert) => {
  console.log(`New alert: ${alert.message}`);
  
  // Send notification to admin
  if (alert.severity === 'critical') {
    sendEmergencyNotification(alert);
  }
});

// Alert types and severities
interface ServiceAlert {
  id: string;
  type: 'health' | 'performance' | 'error' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  serviceId: string;
  serviceName: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}
```

## 🔒 Security Features

### Authentication and Authorization

```typescript
// Service with authentication
const crmConfig: ServiceAbstractionConfig = {
  id: 'crm-service',
  type: 'CRM',
  name: 'CRM Service',
  // ... other config
  options: {
    provider: 'hubspot',
    apiKey: process.env.HUBSPOT_API_KEY,
    
    // OAuth configuration
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
    refreshToken: process.env.HUBSPOT_REFRESH_TOKEN
  }
};
```

### Rate Limiting

```typescript
// Rate limiting configuration
const emailConfig: ServiceAbstractionConfig = {
  // ... other config
  options: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    rateLimits: {
      perMinute: 100,
      perHour: 1000,
      perDay: 10000
    }
  }
};
```

### Input Validation

```typescript
// Service with input validation
class EmailService extends AbstractService {
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    // Validate input
    this.validateMessage(message);
    
    return await this.withCircuitBreaker(async () => {
      // Send email
    });
  }
  
  private validateMessage(message: EmailMessage): void {
    if (!message.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!this.validateEmailAddress(message.to)) {
      throw new Error('Invalid email address format');
    }
    
    // Additional validation...
  }
}
```

## 🧪 Testing

### Service Testing

```typescript
// Mock service for testing
class MockEmailService extends AbstractService {
  private sentEmails: EmailMessage[] = [];
  
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    this.sentEmails.push(message);
    
    return {
      messageId: `mock-${Date.now()}`,
      accepted: [message.to],
      rejected: [],
      pending: [],
      response: 'Mock email sent',
      envelope: {
        from: 'test@example.com',
        to: [message.to]
      }
    };
  }
  
  getSentEmails(): EmailMessage[] {
    return this.sentEmails;
  }
}

// Test service integration
describe('EmailService', () => {
  let emailService: EmailService;
  
  beforeEach(() => {
    emailService = new MockEmailService(mockConfig);
  });
  
  test('should send email successfully', async () => {
    const message: EmailMessage = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test'
    };
    
    const result = await emailService.sendEmail(message);
    
    expect(result.messageId).toBeDefined();
    expect(result.accepted).toContain('test@example.com');
  });
});
```

### Health Check Testing

```typescript
// Test service health
describe('Service Health', () => {
  test('should report healthy status', async () => {
    const health = await emailService.healthCheck();
    
    expect(health.status).toBe('healthy');
    expect(health.responseTime).toBeGreaterThan(0);
  });
  
  test('should report unhealthy status on failure', async () => {
    // Simulate service failure
    emailService.simulateFailure();
    
    const health = await emailService.healthCheck();
    
    expect(health.status).toBe('unhealthy');
    expect(health.error).toBeDefined();
  });
});
```

## 🔄 Migration Guide

### From Existing Services

If you have existing service implementations, you can migrate them to use the Service Abstraction Layer:

```typescript
// Before: Direct service usage
class BookingService {
  async sendConfirmationEmail(booking: Booking): Promise<void> {
    // Direct email service call
    await sendEmail({
      to: booking.customer.email,
      subject: 'Booking Confirmation',
      template: 'booking-confirmation',
      data: booking
    });
  }
}

// After: Using Service Abstraction Layer
class BookingService {
  private emailService: EmailService;
  
  constructor() {
    this.emailService = serviceManager.getService('email-service');
  }
  
  async sendConfirmationEmail(booking: Booking): Promise<void> {
    await this.emailService.sendTemplate(
      'booking-confirmation',
      booking.customer.email,
      booking,
      {
        subject: 'Booking Confirmation'
      }
    );
  }
}
```

### Configuration Migration

```typescript
// Before: Hardcoded configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'user@gmail.com',
    pass: 'password'
  }
};

// After: Service Abstraction Configuration
const emailServiceConfig: ServiceAbstractionConfig = {
  id: 'email-service',
  type: 'EMAIL',
  name: 'Email Service',
  enabled: true,
  priority: 1,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  healthCheckInterval: 60000,
  environment: 'production',
  options: {
    provider: 'smtp',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }
};
```

## 🚀 Best Practices

### 1. Service Design

- **Single Responsibility**: Each service should have a single, well-defined purpose
- **Stateless**: Services should be stateless and thread-safe
- **Idempotent**: Operations should be idempotent where possible
- **Error Handling**: Implement comprehensive error handling with proper error types

### 2. Configuration Management

- **Environment Variables**: Use environment variables for sensitive configuration
- **Validation**: Validate configuration at startup
- **Defaults**: Provide sensible defaults for optional configuration
- **Documentation**: Document all configuration options

### 3. Testing

- **Unit Tests**: Test individual service methods
- **Integration Tests**: Test service interactions
- **Mock Services**: Use mock services for testing
- **Health Checks**: Test health check functionality

### 4. Monitoring

- **Metrics**: Collect and monitor service metrics
- **Logging**: Implement structured logging
- **Alerts**: Set up appropriate alerts for service issues
- **Dashboards**: Create monitoring dashboards

### 5. Security

- **Authentication**: Implement proper authentication
- **Authorization**: Use role-based access control
- **Input Validation**: Validate all inputs
- **Rate Limiting**: Implement rate limiting to prevent abuse

## 📚 API Reference

### ServiceManager

```typescript
class ServiceManager {
  // Lifecycle
  static getInstance(config?: ServiceManagerConfig): ServiceManager
  async initialize(): Promise<void>
  async start(): Promise<void>
  async stop(): Promise<void>
  async restart(): Promise<void>
  
  // Service management
  async addService(config: ServiceAbstractionConfig): Promise<AbstractService>
  async removeService(serviceId: string): Promise<void>
  async updateService(serviceId: string, updates: Partial<ServiceAbstractionConfig>): Promise<void>
  
  // Service access
  getService(serviceId: string): AbstractService | undefined
  getServicesByType(type: ServiceType): AbstractService[]
  getAllServices(): AbstractService[]
  
  // Health and monitoring
  async checkHealth(): Promise<Record<string, ServiceHealthCheck>>
  async getOverallHealth(): Promise<'healthy' | 'unhealthy' | 'degraded'>
  getState(): ServiceManagerState
  
  // Performance metrics
  getPerformanceMetrics(serviceId: string): ServicePerformanceMetrics[]
  getAllPerformanceMetrics(): Record<string, ServicePerformanceMetrics[]>
  
  // Alerts
  getAlerts(): ServiceAlert[]
  getActiveAlerts(): ServiceAlert[]
  
  // Configuration
  async loadConfiguration(config: ServiceConfiguration): Promise<void>
  async reloadConfiguration(): Promise<void>
  
  // Events
  on(event: string, handler: (data: any) => void): void
  off(event: string, handler: (data: any) => void): void
}
```

### AbstractService

```typescript
abstract class AbstractService {
  // Lifecycle
  async initialize(): Promise<void>
  async connect(): Promise<boolean>
  async disconnect(): Promise<void>
  async destroy(): Promise<void>
  
  // Health monitoring
  async healthCheck(): Promise<ServiceHealthCheck>
  getStatus(): 'healthy' | 'unhealthy' | 'degraded'
  getMetrics(): ServiceMetrics
  
  // Configuration
  async updateConfig(updates: Partial<ServiceAbstractionConfig>): Promise<void>
  async reloadConfig(): Promise<void>
  getConfig(): ServiceAbstractionConfig
  
  // Events
  on(event: string, handler: (data: any) => void): void
  off(event: string, handler: (data: any) => void): void
  emit(event: string, data: any): void
  
  // Utility methods
  protected async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T>
  protected async withTimeout<T>(operation: () => Promise<T>, timeout?: number): Promise<T>
  protected async withRetry<T>(operation: () => Promise<T>, attempts?: number, delay?: number): Promise<T>
}
```

## 🎉 Conclusion

The Service Abstraction Layer provides a robust, enterprise-grade solution for managing external service integrations in the RevivaTech platform. With built-in resilience patterns, comprehensive monitoring, and flexible configuration management, it enables reliable integration with multiple external services while maintaining high availability and performance.

Key benefits:
- **Reliability**: Circuit breaker and retry patterns prevent cascading failures
- **Monitoring**: Real-time health checks and performance metrics
- **Flexibility**: Easy configuration and hot-reloading
- **Scalability**: Plugin system and dependency injection
- **Maintainability**: Standardized patterns and comprehensive documentation

This system is ready for production use and can be easily extended to support additional service types and integration patterns as the platform grows.