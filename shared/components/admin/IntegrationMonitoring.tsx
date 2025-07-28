'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Globe,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';

interface IntegrationStatus {
  id: string;
  name: string;
  type: 'crm' | 'payment' | 'email' | 'sms' | 'webhook' | 'api' | 'database';
  status: 'healthy' | 'warning' | 'error' | 'offline';
  lastCheck: string;
  nextCheck: string;
  responseTime: number; // milliseconds
  uptime: number; // percentage
  errorRate: number; // percentage
  throughput: number; // requests per minute
  config: {
    endpoint?: string;
    method?: string;
    timeout?: number;
    retries?: number;
    healthCheckUrl?: string;
  };
  metrics: {
    availability: number;
    latency: number[];
    errors: number;
    successRate: number;
  };
  recentErrors: {
    timestamp: string;
    error: string;
    statusCode?: number;
  }[];
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'outage';
  integrations: IntegrationStatus[];
  summary: {
    totalIntegrations: number;
    healthyCount: number;
    warningCount: number;
    errorCount: number;
    offlineCount: number;
    averageResponseTime: number;
    overallUptime: number;
  };
}

const mockIntegrations: IntegrationStatus[] = [
  {
    id: 'hubspot-crm',
    name: 'HubSpot CRM',
    type: 'crm',
    status: 'healthy',
    lastCheck: new Date(Date.now() - 30000).toISOString(),
    nextCheck: new Date(Date.now() + 270000).toISOString(),
    responseTime: 245,
    uptime: 99.8,
    errorRate: 0.2,
    throughput: 45,
    config: {
      endpoint: 'https://api.hubapi.com',
      healthCheckUrl: '/crm/v3/objects/contacts?limit=1',
      timeout: 5000,
      retries: 3
    },
    metrics: {
      availability: 99.8,
      latency: [220, 245, 189, 267, 201],
      errors: 2,
      successRate: 99.8
    },
    recentErrors: []
  },
  {
    id: 'stripe-payment',
    name: 'Stripe Payments',
    type: 'payment',
    status: 'healthy',
    lastCheck: new Date(Date.now() - 45000).toISOString(),
    nextCheck: new Date(Date.now() + 255000).toISOString(),
    responseTime: 156,
    uptime: 99.9,
    errorRate: 0.1,
    throughput: 12,
    config: {
      endpoint: 'https://api.stripe.com',
      healthCheckUrl: '/v1/charges?limit=1',
      timeout: 5000,
      retries: 3
    },
    metrics: {
      availability: 99.9,
      latency: [134, 156, 142, 178, 149],
      errors: 1,
      successRate: 99.9
    },
    recentErrors: []
  },
  {
    id: 'chatwoot-chat',
    name: 'Chatwoot Chat',
    type: 'api',
    status: 'warning',
    lastCheck: new Date(Date.now() - 60000).toISOString(),
    nextCheck: new Date(Date.now() + 240000).toISOString(),
    responseTime: 1245,
    uptime: 98.5,
    errorRate: 1.5,
    throughput: 28,
    config: {
      endpoint: 'https://app.chatwoot.com',
      healthCheckUrl: '/api/v1/accounts',
      timeout: 5000,
      retries: 3
    },
    metrics: {
      availability: 98.5,
      latency: [1156, 1245, 987, 1434, 1089],
      errors: 15,
      successRate: 98.5
    },
    recentErrors: [
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        error: 'Timeout after 5000ms',
        statusCode: 408
      }
    ]
  },
  {
    id: 'websocket-realtime',
    name: 'WebSocket Server',
    type: 'api',
    status: 'error',
    lastCheck: new Date(Date.now() - 90000).toISOString(),
    nextCheck: new Date(Date.now() + 210000).toISOString(),
    responseTime: 0,
    uptime: 95.2,
    errorRate: 4.8,
    throughput: 0,
    config: {
      endpoint: 'wss://localhost:8080',
      timeout: 3000,
      retries: 5
    },
    metrics: {
      availability: 95.2,
      latency: [0, 0, 89, 156, 0],
      errors: 48,
      successRate: 95.2
    },
    recentErrors: [
      {
        timestamp: new Date(Date.now() - 90000).toISOString(),
        error: 'Connection refused',
        statusCode: 0
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        error: 'WebSocket closed unexpectedly'
      }
    ]
  }
];

export const IntegrationMonitoring: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemHealth();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        loadSystemHealth();
      }, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const integrations = [...mockIntegrations];
      const healthyCount = integrations.filter(i => i.status === 'healthy').length;
      const warningCount = integrations.filter(i => i.status === 'warning').length;
      const errorCount = integrations.filter(i => i.status === 'error').length;
      const offlineCount = integrations.filter(i => i.status === 'offline').length;
      
      const averageResponseTime = integrations.reduce((sum, i) => sum + i.responseTime, 0) / integrations.length;
      const overallUptime = integrations.reduce((sum, i) => sum + i.uptime, 0) / integrations.length;
      
      let overall: 'healthy' | 'degraded' | 'outage' = 'healthy';
      if (errorCount > 0 || offlineCount > 0) {
        overall = errorCount + offlineCount > integrations.length / 2 ? 'outage' : 'degraded';
      } else if (warningCount > 0) {
        overall = 'degraded';
      }

      setSystemHealth({
        overall,
        integrations,
        summary: {
          totalIntegrations: integrations.length,
          healthyCount,
          warningCount,
          errorCount,
          offlineCount,
          averageResponseTime,
          overallUptime
        }
      });
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async (integrationId: string) => {
    const integration = systemHealth?.integrations.find(i => i.id === integrationId);
    if (!integration) return;

    integration.status = 'healthy'; // Simulate check
    integration.lastCheck = new Date().toISOString();
    integration.nextCheck = new Date(Date.now() + 300000).toISOString();
    integration.responseTime = Math.floor(Math.random() * 500) + 100;
    
    setSystemHealth(prev => prev ? { ...prev } : null);
  };

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: IntegrationStatus['type']) => {
    switch (type) {
      case 'crm':
        return <Database className="h-4 w-4" />;
      case 'payment':
        return <Zap className="h-4 w-4" />;
      case 'email':
      case 'sms':
        return <Globe className="h-4 w-4" />;
      case 'webhook':
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'offline':
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (ms: number) => {
    return `${ms}ms`;
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integration Monitoring</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor the health and performance of all system integrations.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
          </select>
          
          <button
            onClick={loadSystemHealth}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border-l-4 ${
          systemHealth.overall === 'healthy' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
          systemHealth.overall === 'degraded' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
          'border-red-500 bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {systemHealth.overall === 'healthy' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : systemHealth.overall === 'degraded' ? (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                System Status
              </h3>
              <p className="text-sm capitalize text-gray-600 dark:text-gray-400">
                {systemHealth.overall}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {systemHealth.summary.totalIntegrations}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Integrations</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {formatUptime(systemHealth.summary.overallUptime)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Uptime</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {formatResponseTime(systemHealth.summary.averageResponseTime)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Integration Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{systemHealth.summary.healthyCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{systemHealth.summary.warningCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{systemHealth.summary.errorCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Error</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{systemHealth.summary.offlineCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Offline</div>
          </div>
        </div>
      </div>

      {/* Integrations List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Integration Details</h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {systemHealth.integrations.map((integration) => (
            <div
              key={integration.id}
              className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 ${getStatusColor(integration.status)}`}
              onClick={() => setSelectedIntegration(integration)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(integration.status)}
                    {getTypeIcon(integration.type)}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {integration.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {integration.type} integration
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {formatUptime(integration.uptime)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Uptime</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {formatResponseTime(integration.responseTime)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Response</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {integration.throughput}/min
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Requests</div>
                  </div>

                  <div className="text-center">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {integration.errorRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Error Rate</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runHealthCheck(integration.id);
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    Test Now
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                Last checked: {new Date(integration.lastCheck).toLocaleString()}
                <span className="mx-2">•</span>
                Next check: {new Date(integration.nextCheck).toLocaleString()}
              </div>

              {integration.recentErrors.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Recent error: {integration.recentErrors[0].error}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedIntegration(null)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedIntegration.name} - Integration Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Endpoint:</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {selectedIntegration.config.endpoint}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Timeout:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedIntegration.config.timeout}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Retries:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedIntegration.config.retries}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedIntegration.metrics.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Total Errors:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedIntegration.metrics.errors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Avg Latency:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedIntegration.metrics.latency.reduce((a, b) => a + b, 0) / selectedIntegration.metrics.latency.length}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedIntegration.recentErrors.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Errors</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {selectedIntegration.recentErrors.map((error, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-600 dark:text-red-400">{error.error}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {error.statusCode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Status Code: {error.statusCode}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => runHealthCheck(selectedIntegration.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Run Health Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationMonitoring;