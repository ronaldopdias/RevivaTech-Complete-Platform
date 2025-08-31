'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ServiceFactory, ServiceFactoryConfig } from '@/lib/services/serviceFactory';
import { ServiceHealthCheck } from '@/lib/services/types';

interface ServiceContextType {
  factory: ServiceFactory;
  isInitialized: boolean;
  healthStatus: Record<string, ServiceHealthCheck>;
  isUsingMockServices: boolean;
  environment: string;
  switchToMockServices: () => void;
  switchToRealServices: () => void;
  updateAuthToken: (token: string) => void;
  refreshHealth: () => Promise<void>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export interface ServiceProviderProps {
  children: React.ReactNode;
  config?: Partial<ServiceFactoryConfig>;
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
}

export function ServiceProvider({
  children,
  config = {},
  enableHealthMonitoring = true,
  healthCheckInterval = 60000,
}: ServiceProviderProps) {
  const [factory, setFactory] = useState<ServiceFactory | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, ServiceHealthCheck>>({});
  const [isUsingMockServices, setIsUsingMockServices] = useState(false);
  const [environment, setEnvironment] = useState('development');

  // Initialize service factory
  useEffect(() => {
    const defaultConfig: ServiceFactoryConfig = {
      environment: (process.env.NODE_ENV as any) || 'development',
      useMockServices: false,  // Use REAL API services - backend routes are now mounted!
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011',
      ...config,
    };

    const serviceFactory = ServiceFactory.getInstance(defaultConfig);
    setFactory(serviceFactory);
    setIsUsingMockServices(serviceFactory.isUsingMockServices());
    setEnvironment(serviceFactory.getCurrentEnvironment());
    setIsInitialized(true);

    // Initial health check
    if (enableHealthMonitoring) {
      serviceFactory.checkAllServicesHealth().then(setHealthStatus);
    }

    return () => {
      serviceFactory.stopHealthMonitoring();
    };
  }, [config, enableHealthMonitoring]);

  // Start health monitoring
  useEffect(() => {
    if (factory && enableHealthMonitoring && healthCheckInterval > 0) {
      factory.startHealthMonitoring(healthCheckInterval);

      // Listen for health check events
      const handleHealthCheck = (event: CustomEvent) => {
        setHealthStatus(event.detail);
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('service-health-check', handleHealthCheck as EventListener);

        return () => {
          window.removeEventListener('service-health-check', handleHealthCheck as EventListener);
        };
      }
    }
  }, [factory, enableHealthMonitoring, healthCheckInterval]);

  // Service control methods
  const switchToMockServices = () => {
    if (factory) {
      factory.switchToMockServices();
      setIsUsingMockServices(true);
    }
  };

  const switchToRealServices = () => {
    if (factory) {
      factory.switchToRealServices();
      setIsUsingMockServices(false);
    }
  };

  const updateAuthToken = (token: string) => {
    if (factory) {
      factory.updateAuthToken(token);
    }
  };

  const refreshHealth = async () => {
    if (factory) {
      const health = await factory.checkAllServicesHealth();
      setHealthStatus(health);
    }
  };

  // Don't block authentication - allow children to render while services initialize
  // This prevents AuthContext from being reset during service initialization
  if (!isInitialized || !factory) {
    // Return children with a fallback factory to prevent blocking auth flows
    const fallbackValue: ServiceContextType = {
      factory: null as any, // Will be ignored by components checking isInitialized
      isInitialized: false,
      healthStatus: {},
      isUsingMockServices: false,
      environment: 'development',
      switchToMockServices: () => {},
      switchToRealServices: () => {},
      updateAuthToken: () => {},
      refreshHealth: async () => {},
    };

    return (
      <ServiceContext.Provider value={fallbackValue}>
        {children}
      </ServiceContext.Provider>
    );
  }

  const value: ServiceContextType = {
    factory,
    isInitialized,
    healthStatus,
    isUsingMockServices,
    environment,
    switchToMockServices,
    switchToRealServices,
    updateAuthToken,
    refreshHealth,
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

// Hook to use service context
export function useServiceContext() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServiceContext must be used within a ServiceProvider');
  }
  return context;
}

// Service health indicator component
export function ServiceHealthIndicator({ className }: { className?: string }) {
  const { healthStatus, refreshHealth, isUsingMockServices } = useServiceContext();
  
  const healthyServices = Object.values(healthStatus).filter(s => s.status === 'healthy').length;
  const totalServices = Object.keys(healthStatus).length;
  const allHealthy = healthyServices === totalServices && totalServices > 0;

  const getHealthColor = () => {
    if (totalServices === 0) return 'text-muted-foreground';
    if (allHealthy) return 'text-green-500';
    if (healthyServices > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthIcon = () => {
    if (totalServices === 0) return '⚪';
    if (allHealthy) return '🟢';
    if (healthyServices > 0) return '🟡';
    return '🔴';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={refreshHealth}
        className="flex items-center space-x-1 text-sm hover:opacity-75 transition-opacity"
        title="Click to refresh service health"
      >
        <span>{getHealthIcon()}</span>
        <span className={getHealthColor()}>
          {healthyServices}/{totalServices} services
        </span>
        {isUsingMockServices && (
          <span className="text-xs text-orange-500">(MOCK)</span>
        )}
      </button>
    </div>
  );
}

// Service debug panel component (for development)
export function ServiceDebugPanel({ className }: { className?: string }) {
  const {
    healthStatus,
    isUsingMockServices,
    environment,
    switchToMockServices,
    switchToRealServices,
    refreshHealth,
  } = useServiceContext();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-md ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Service Debug</h3>
        <span className="text-xs text-muted-foreground">{environment}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Mode:</span>
          <div className="flex space-x-1">
            <button
              onClick={switchToMockServices}
              className={`px-2 py-1 text-xs rounded ${
                isUsingMockServices ? 'bg-orange-500 text-white' : 'bg-muted'
              }`}
            >
              Mock
            </button>
            <button
              onClick={switchToRealServices}
              className={`px-2 py-1 text-xs rounded ${
                !isUsingMockServices ? 'bg-green-500 text-white' : 'bg-muted'
              }`}
            >
              Real
            </button>
          </div>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Services:</span>
            <button
              onClick={refreshHealth}
              className="text-primary hover:underline"
            >
              Refresh
            </button>
          </div>
          {Object.entries(healthStatus).map(([name, health]) => (
            <div key={name} className="flex justify-between items-center">
              <span>{name}:</span>
              <span className={`text-xs ${
                health.status === 'healthy' ? 'text-green-500' :
                health.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {health.status} ({health.responseTime}ms)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServiceProvider;