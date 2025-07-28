import {
  BookingService,
  CustomerService,
  DeviceService,
  AuthService,
  CRMService,
  PaymentService,
  NotificationService,
  ServiceConfig,
  ServiceHealthCheck,
} from './types';

import { BookingServiceImpl } from './bookingService';
import { DeviceServiceImpl } from './deviceService';
import { CustomerServiceImpl } from './customerService';
import { AuthServiceImpl } from './authService';
import { MockBookingService, MockDeviceService, MockCustomerService } from './mockServices';
import { getServiceConfig } from '../../../config/services/api.config';

// Service registry interface
export interface ServiceRegistry {
  booking: BookingService;
  customer: CustomerService;
  device: DeviceService;
  auth: AuthService;
  crm?: CRMService;
  payment?: PaymentService;
  notification?: NotificationService;
}

// Service factory configuration
export interface ServiceFactoryConfig {
  environment: 'development' | 'staging' | 'production';
  useMockServices: boolean;
  authToken?: string;
  apiBaseUrl?: string;
  customConfigs?: Record<string, Partial<ServiceConfig>>;
}

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Partial<ServiceRegistry> = {};
  private config: ServiceFactoryConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor(config: ServiceFactoryConfig) {
    this.config = config;
    this.initializeServices();
  }

  static getInstance(config?: ServiceFactoryConfig): ServiceFactory {
    if (!ServiceFactory.instance && config) {
      ServiceFactory.instance = new ServiceFactory(config);
    } else if (!ServiceFactory.instance) {
      // Default configuration
      ServiceFactory.instance = new ServiceFactory({
        environment: 'production',
        useMockServices: false,
      });
    }
    return ServiceFactory.instance;
  }

  private initializeServices(): void {
    const { environment, useMockServices, authToken, customConfigs } = this.config;

    // Initialize booking service
    const bookingConfig = this.getConfigForService('booking', environment, customConfigs?.booking);
    if (authToken) {
      bookingConfig.auth = { 
        type: 'bearer',
        ...bookingConfig.auth, 
        token: authToken 
      };
    }

    if (useMockServices) {
      this.services.booking = new MockBookingService(bookingConfig);
    } else {
      this.services.booking = new BookingServiceImpl(bookingConfig);
    }

    // Initialize device service
    const deviceConfig = this.getConfigForService('device', environment, customConfigs?.device);
    if (useMockServices) {
      this.services.device = new MockDeviceService(deviceConfig);
    } else {
      this.services.device = new DeviceServiceImpl(deviceConfig);
    }

    // Initialize customer service
    const customerConfig = this.getConfigForService('customer', environment, customConfigs?.customer);
    if (authToken) {
      customerConfig.auth = { 
        type: 'bearer',
        ...customerConfig.auth, 
        token: authToken 
      };
    }

    if (useMockServices) {
      this.services.customer = new MockCustomerService(customerConfig);
    } else {
      this.services.customer = new CustomerServiceImpl(customerConfig);
    }

    // Initialize auth service
    const authConfig = this.getConfigForService('auth', environment, customConfigs?.auth);
    // Note: Auth service doesn't use mock - always uses real implementation
    this.services.auth = new AuthServiceImpl(authConfig);

    // TODO: Initialize other services (CRM, Payment, Notification) when implemented
  }

  private getConfigForService(
    serviceName: string,
    environment: string,
    customConfig?: Partial<ServiceConfig>
  ): ServiceConfig {
    const baseConfig = getServiceConfig(serviceName, environment);
    
    if (customConfig) {
      return { ...baseConfig, ...customConfig };
    }
    
    return baseConfig;
  }

  // Service getters
  getBookingService(): BookingService {
    if (!this.services.booking) {
      throw new Error('Booking service not initialized');
    }
    return this.services.booking;
  }

  getCustomerService(): CustomerService {
    if (!this.services.customer) {
      throw new Error('Customer service not initialized');
    }
    return this.services.customer;
  }

  getDeviceService(): DeviceService {
    if (!this.services.device) {
      throw new Error('Device service not initialized');
    }
    return this.services.device;
  }

  getAuthService(): AuthService {
    if (!this.services.auth) {
      throw new Error('Auth service not initialized');
    }
    return this.services.auth;
  }

  getCRMService(): CRMService {
    if (!this.services.crm) {
      throw new Error('CRM service not available');
    }
    return this.services.crm;
  }

  getPaymentService(): PaymentService {
    if (!this.services.payment) {
      throw new Error('Payment service not available');
    }
    return this.services.payment;
  }

  getNotificationService(): NotificationService {
    if (!this.services.notification) {
      throw new Error('Notification service not available');
    }
    return this.services.notification;
  }

  // Configuration management
  updateAuthToken(token: string): void {
    this.config.authToken = token;
    
    // Update auth for all services that require it
    if (this.services.booking && 'config' in this.services.booking) {
      (this.services.booking as any).config.auth.token = token;
    }
    if (this.services.customer && 'config' in this.services.customer) {
      (this.services.customer as any).config.auth.token = token;
    }
  }

  switchToMockServices(): void {
    this.config.useMockServices = true;
    this.initializeServices();
  }

  switchToRealServices(): void {
    this.config.useMockServices = false;
    this.initializeServices();
  }

  updateEnvironment(environment: 'development' | 'staging' | 'production'): void {
    this.config.environment = environment;
    this.initializeServices();
  }

  // Health monitoring
  async checkAllServicesHealth(): Promise<Record<string, ServiceHealthCheck>> {
    const healthChecks: Record<string, ServiceHealthCheck> = {};

    // Check booking service
    if (this.services.booking) {
      try {
        healthChecks.booking = await this.services.booking.healthCheck();
      } catch (error) {
        healthChecks.booking = {
          service: 'booking',
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Check device service
    if (this.services.device) {
      try {
        healthChecks.device = await this.services.device.healthCheck();
      } catch (error) {
        healthChecks.device = {
          service: 'device',
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Check customer service
    if (this.services.customer) {
      try {
        healthChecks.customer = await this.services.customer.healthCheck();
      } catch (error) {
        healthChecks.customer = {
          service: 'customer',
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return healthChecks;
  }

  startHealthMonitoring(intervalMs: number = 60000): void {
    this.stopHealthMonitoring();
    
    this.healthCheckInterval = setInterval(async () => {
      const healthChecks = await this.checkAllServicesHealth();
      
      // Log unhealthy services
      Object.entries(healthChecks).forEach(([serviceName, health]) => {
        if (health.status === 'unhealthy') {
          console.warn(`Service ${serviceName} is unhealthy:`, health.error);
        }
      });

      // Emit health check event (can be listened to by monitoring systems)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('service-health-check', {
          detail: healthChecks,
        }));
      }
    }, intervalMs);
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  // Utility methods
  getAllServices(): Partial<ServiceRegistry> {
    return { ...this.services };
  }

  getServiceStatus(): Record<string, boolean> {
    return {
      booking: !!this.services.booking,
      customer: !!this.services.customer,
      device: !!this.services.device,
      crm: !!this.services.crm,
      payment: !!this.services.payment,
      notification: !!this.services.notification,
    };
  }

  isUsingMockServices(): boolean {
    return this.config.useMockServices;
  }

  getCurrentEnvironment(): string {
    return this.config.environment;
  }

  // Cleanup
  destroy(): void {
    this.stopHealthMonitoring();
    this.services = {};
  }
}

// React hook for using services
export const useServices = () => {
  const factory = ServiceFactory.getInstance();
  
  return {
    booking: factory.getBookingService(),
    customer: factory.getCustomerService(),
    device: factory.getDeviceService(),
    
    // Utility methods
    checkHealth: () => factory.checkAllServicesHealth(),
    updateAuth: (token: string) => factory.updateAuthToken(token),
    switchToMock: () => factory.switchToMockServices(),
    switchToReal: () => factory.switchToRealServices(),
    isUsingMock: () => factory.isUsingMockServices(),
    getStatus: () => factory.getServiceStatus(),
  };
};

// Initialize services for the application
export const initializeServices = (config: ServiceFactoryConfig) => {
  return ServiceFactory.getInstance(config);
};

export default ServiceFactory;