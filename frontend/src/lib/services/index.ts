// Main exports for the API integration system
import { initializeServices, ServiceFactory } from './serviceFactory';
import { ApiClient } from './apiClient';

// Types
export * from './types';

// API Client
export { ApiClient, ApiError } from './apiClient';

// Service Implementations
export { BookingServiceImpl, createBookingService } from './bookingService';

// Mock Services
export { MockBookingService, MockDeviceService, MockCustomerService, mockServices } from './mockServices';

// Service Factory
export { ServiceFactory, useServices, initializeServices } from './serviceFactory';
export type { ServiceRegistry, ServiceFactoryConfig } from './serviceFactory';

// Re-export initializeServices to ensure it's available
export { initializeServices as initServices } from './serviceFactory';

// Configuration - Using mock service config for now
// export { getServiceConfig } from '../../config/services/api.config';

// Default service configurations for quick setup
export const serviceConfigs = {
  development: {
    useMockServices: true,
    environment: 'development' as const,
    enableHealthMonitoring: true,
    healthCheckInterval: 30000,
  },
  staging: {
    useMockServices: false,
    environment: 'staging' as const,
    enableHealthMonitoring: true,
    healthCheckInterval: 60000,
  },
  production: {
    useMockServices: false,
    environment: 'production' as const,
    enableHealthMonitoring: true,
    healthCheckInterval: 120000,
  },
};

// Quick setup functions
export const setupDevelopmentServices = () => {
  return initializeServices(serviceConfigs.development);
};

export const setupStagingServices = () => {
  return initializeServices(serviceConfigs.staging);
};

export const setupProductionServices = () => {
  return initializeServices(serviceConfigs.production);
};

// Helper function to setup services based on environment
export const setupServices = (env?: string) => {
  const environment = env || process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return setupProductionServices();
    case 'staging':
      return setupStagingServices();
    case 'development':
    default:
      return setupDevelopmentServices();
  }
};

export default {
  // Main classes
  ApiClient,
  ServiceFactory,
  
  // Setup functions
  setupServices,
  setupDevelopmentServices,
  setupStagingServices,
  setupProductionServices,
  
  // Configurations
  serviceConfigs,
};