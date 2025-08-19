'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { authLogger, type AuthLogEntry } from '@/lib/auth/logger';
import { AuthErrorHandler, type AuthError } from '@/lib/auth/error-handler';
import { debugIntegration } from '@/lib/debug/debug-integration';
import { consoleManager } from '@/lib/console/console-manager';
import { networkInterceptor } from '@/lib/network/network-interceptor';
import { memoryProfiler } from '@/lib/performance/memory-profiler';

interface ErrorMonitoringDashboardProps {
  className?: string;
  showInProduction?: boolean;
  enableUnifiedView?: boolean; // New prop to enable unified debug features
}

/**
 * Error Monitoring Dashboard for debugging authentication issues
 * Implements Requirement 6.4 for comprehensive error logging and debugging
 */
export const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({
  className,
  showInProduction = false,
  enableUnifiedView = true, // Enable unified view by default
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [metrics, setMetrics] = useState(authLogger.getMetrics());
  const [activeTab, setActiveTab] = useState<'logs' | 'errors' | 'metrics' | 'security' | 'unified'>('logs');
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  
  // Unified debug system state
  const [unifiedStats, setUnifiedStats] = useState<{
    console: any;
    network: any;
    memory: any;
    correlations: number;
    totalEvents: number;
  } | null>(null);

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  useEffect(() => {
    const updateData = () => {
      setLogs(authLogger.getLogs(50)); // Get last 50 logs
      setMetrics(authLogger.getMetrics());
      
      // Update unified stats if enabled
      if (enableUnifiedView) {
        const consoleStats = consoleManager.getStats();
        const networkStats = networkInterceptor.getStats();
        const memoryStats = memoryProfiler.getSummary();
        const correlations = debugIntegration.getCorrelations();
        const totalEvents = debugIntegration.getEvents().length;
        
        setUnifiedStats({
          console: consoleStats,
          network: networkStats,
          memory: memoryStats,
          correlations: correlations.length,
          totalEvents,
        });
      }
    };

    updateData();
    const interval = setInterval(updateData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [enableUnifiedView]);

  const filteredLogs = filterLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === filterLevel);

  const errorLogs = logs.filter(log => log.level === 'error');
  const securityEvents = authLogger.getLogsByEvent('LOGIN_FAILED')
    .concat(authLogger.getLogsByEvent('POTENTIAL_BRUTE_FORCE'));

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const clearLogs = () => {
    authLogger.clearLogs();
    setLogs([]);
    setMetrics(authLogger.getMetrics());
  };

  const exportLogs = () => {
    const logData = authLogger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: AuthLogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className={cn(
          'fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors',
          'text-xs font-mono flex items-center gap-2',
          className
        )}
        title={enableUnifiedView ? "Toggle Unified Debug Dashboard" : "Toggle Auth Error Monitoring Dashboard"}
      >
        🔍 Debug
        {enableUnifiedView && unifiedStats && (
          <>
            {/* Show indicators for active issues */}
            {(unifiedStats.console.byLevel?.error > 0 || 
              unifiedStats.network.failureRate > 10 || 
              unifiedStats.memory.alerts.critical > 0) && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            <span className="text-xs opacity-75">
              ({unifiedStats.totalEvents})
            </span>
          </>
        )}
      </button>

      {/* Dashboard Modal */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                  {enableUnifiedView ? 'Unified Debug Dashboard' : 'Authentication Error Monitoring'}
                </h2>
                {enableUnifiedView && unifiedStats && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{unifiedStats.console.total} logs</span>
                    <span>•</span>
                    <span>{unifiedStats.network.total} requests</span>
                    <span>•</span>
                    <span>{unifiedStats.correlations} correlations</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportLogs}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Export
                </button>
                <button
                  onClick={clearLogs}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={toggleVisibility}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'logs', label: 'Auth Logs', count: logs.length },
                  { key: 'errors', label: 'Auth Errors', count: errorLogs.length },
                  { key: 'metrics', label: 'Auth Metrics', count: null },
                  { key: 'security', label: 'Security', count: securityEvents.length },
                  ...(enableUnifiedView ? [{ key: 'unified', label: 'System Overview', count: unifiedStats?.totalEvents || 0 }] : []),
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      'py-4 px-1 border-b-2 font-medium text-sm',
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  {/* Filter */}
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Filter by level:</label>
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as any)}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>

                  {/* Logs List */}
                  <div className="space-y-2">
                    {filteredLogs.map((log, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg border text-sm',
                          getLevelColor(log.level)
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium uppercase',
                              log.level === 'error' ? 'bg-red-100 text-red-800' :
                              log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                              log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {log.level}
                            </span>
                            <span className="font-medium">{log.event}</span>
                          </div>
                          {log.email && (
                            <span className="text-xs text-gray-500">{log.email}</span>
                          )}
                        </div>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-600">
                              Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'errors' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Errors</h3>
                  {errorLogs.length === 0 ? (
                    <p className="text-gray-500">No errors logged</p>
                  ) : (
                    <div className="space-y-2">
                      {errorLogs.map((log, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-red-800">{log.event}</span>
                            <span className="text-xs text-red-600">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          {log.details && (
                            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Authentication Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.loginAttempts}
                      </div>
                      <div className="text-sm text-blue-800">Total Attempts</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.successfulLogins}
                      </div>
                      <div className="text-sm text-green-800">Successful</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {metrics.failedLogins}
                      </div>
                      <div className="text-sm text-red-800">Failed</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {metrics.errors}
                      </div>
                      <div className="text-sm text-yellow-800">Errors</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Last Activity</div>
                    <div className="font-medium">{new Date(metrics.lastActivity).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security Events</h3>
                  {securityEvents.length === 0 ? (
                    <p className="text-gray-500">No security events</p>
                  ) : (
                    <div className="space-y-2">
                      {securityEvents.map((log, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-yellow-800">{log.event}</span>
                            <span className="text-xs text-yellow-600">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          {log.email && (
                            <div className="text-sm text-yellow-700 mb-2">
                              Email: {log.email}
                            </div>
                          )}
                          {log.details && (
                            <pre className="text-xs bg-yellow-100 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unified System Overview Tab */}
              {activeTab === 'unified' && enableUnifiedView && unifiedStats && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">System Debug Overview</h3>
                  
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {unifiedStats.console.total}
                      </div>
                      <div className="text-sm text-blue-800">Console Logs</div>
                      {unifiedStats.console.byLevel?.error > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {unifiedStats.console.byLevel.error} errors
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {unifiedStats.network.total}
                      </div>
                      <div className="text-sm text-green-800">Network Requests</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {unifiedStats.network.averageResponseTime}ms avg
                      </div>
                    </div>
                    
                    <div className={cn(
                      "p-4 rounded-lg",
                      unifiedStats.memory.memory.current > 80 ? "bg-red-50" : "bg-yellow-50"
                    )}>
                      <div className={cn(
                        "text-2xl font-bold",
                        unifiedStats.memory.memory.current > 80 ? "text-red-600" : "text-yellow-600"
                      )}>
                        {unifiedStats.memory.memory.current.toFixed(1)}%
                      </div>
                      <div className={cn(
                        "text-sm",
                        unifiedStats.memory.memory.current > 80 ? "text-red-800" : "text-yellow-800"
                      )}>Memory Usage</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Peak: {unifiedStats.memory.memory.peak.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {unifiedStats.correlations}
                      </div>
                      <div className="text-sm text-purple-800">Correlations</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Cross-system patterns
                      </div>
                    </div>
                  </div>
                  
                  {/* System Health Indicators */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium mb-3">System Health</h4>
                    <div className="space-y-2">
                      {/* Console Health */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Console System</span>
                        <div className="flex items-center gap-2">
                          {unifiedStats.console.byLevel?.error > 5 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              {unifiedStats.console.byLevel.error} errors
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Healthy
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Network Health */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Network System</span>
                        <div className="flex items-center gap-2">
                          {unifiedStats.network.failureRate > 10 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              {unifiedStats.network.failureRate.toFixed(1)}% failure rate
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {unifiedStats.network.failureRate.toFixed(1)}% failure rate
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Memory Health */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Memory System</span>
                        <div className="flex items-center gap-2">
                          {unifiedStats.memory.memory.current > 80 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              High usage: {unifiedStats.memory.memory.current.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {unifiedStats.memory.memory.current.toFixed(1)}% usage
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Component Health */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Component Tracking</span>
                        <div className="flex items-center gap-2">
                          {unifiedStats.memory.components.suspicious > 0 ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              {unifiedStats.memory.components.suspicious} suspicious components
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {unifiedStats.memory.components.total} components tracked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium mb-3">Quick Actions</h4>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const allData = debugIntegration.export();
                          const blob = new Blob([allData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `debug-export-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Export All Debug Data
                      </button>
                      
                      <button
                        onClick={() => {
                          debugIntegration.clear();
                          consoleManager.clear();
                          networkInterceptor.clear();
                          memoryProfiler.clear();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Clear All Debug Data
                      </button>
                      
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.open('/api/debug/unified-dashboard', '_blank');
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Open Full Dashboard
                      </button>
                    </div>
                  </div>
                  
                  {/* Recent Correlations */}
                  {unifiedStats.correlations > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium mb-3">Recent System Correlations</h4>
                      <div className="space-y-2">
                        {debugIntegration.getCorrelations(5).map((correlation, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                correlation.impact === 'high' ? 'bg-red-100 text-red-800' :
                                correlation.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              )}>
                                {correlation.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(correlation.probability * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{correlation.description}</p>
                            {correlation.recommendations.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                Recommendation: {correlation.recommendations[0]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ErrorMonitoringDashboard;