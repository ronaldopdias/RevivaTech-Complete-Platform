'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bug, 
  Monitor, 
  Network, 
  Terminal, 
  Activity, 
  Database, 
  Download, 
  Search, 
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
} from 'lucide-react';

// Import existing systems
import { ErrorMonitoringDashboard } from '@/components/auth/ErrorMonitoringDashboard';
import { consoleManager, type ConsoleEntry } from '@/lib/console/console-manager';
import { networkInterceptor, type NetworkRequest } from '@/lib/network/network-interceptor';

interface UnifiedDebugDashboardProps {
  className?: string;
  defaultTab?: 'auth' | 'console' | 'network' | 'performance' | 'storage' | 'settings';
}

type TabType = 'auth' | 'console' | 'network' | 'performance' | 'storage' | 'settings';

export const UnifiedDebugDashboard: React.FC<UnifiedDebugDashboardProps> = ({
  className,
  defaultTab = 'auth',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  const [filters, setFilters] = useState({
    console: {
      level: 'all' as 'all' | ConsoleEntry['level'],
      search: '',
      component: 'all',
    },
    network: {
      method: 'all' as 'all' | string,
      status: 'all' as 'all' | string,
      search: '',
      onlyErrors: false,
    },
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Don't show in production unless debug mode is enabled
  useEffect(() => {
    const debugMode = localStorage.getItem('revivatech_debug_mode') === 'true';
    if (process.env.NODE_ENV === 'production' && !debugMode) {
      return;
    }
  }, []);

  // Subscribe to console logs
  useEffect(() => {
    const updateConsoleLogs = () => {
      setConsoleLogs(consoleManager.getEntries(200));
    };

    updateConsoleLogs();
    const unsubscribe = consoleManager.subscribe(updateConsoleLogs);

    return unsubscribe;
  }, []);

  // Subscribe to network requests
  useEffect(() => {
    const updateNetworkRequests = () => {
      setNetworkRequests(networkInterceptor.getRequests(100));
    };

    updateNetworkRequests();
    const unsubscribe = networkInterceptor.subscribe(updateNetworkRequests);

    return unsubscribe;
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const clearData = useCallback((type: 'console' | 'network' | 'all') => {
    switch (type) {
      case 'console':
        consoleManager.clear();
        setConsoleLogs([]);
        break;
      case 'network':
        networkInterceptor.clear();
        setNetworkRequests([]);
        break;
      case 'all':
        consoleManager.clear();
        networkInterceptor.clear();
        setConsoleLogs([]);
        setNetworkRequests([]);
        break;
    }
  }, []);

  const exportData = useCallback((type: 'console' | 'network' | 'all') => {
    let data = '';
    let filename = '';

    switch (type) {
      case 'console':
        data = consoleManager.export();
        filename = `console-logs-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'network':
        data = networkInterceptor.export();
        filename = `network-requests-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'all':
        data = JSON.stringify({
          console: JSON.parse(consoleManager.export()),
          network: JSON.parse(networkInterceptor.export()),
          exportedAt: new Date().toISOString(),
        }, null, 2);
        filename = `debug-data-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Filter console logs
  const filteredConsoleLogs = consoleLogs.filter(log => {
    if (filters.console.level !== 'all' && log.level !== filters.console.level) {
      return false;
    }
    if (filters.console.search && !log.message.toLowerCase().includes(filters.console.search.toLowerCase())) {
      return false;
    }
    if (filters.console.component !== 'all' && log.context?.component !== filters.console.component) {
      return false;
    }
    return true;
  });

  // Filter network requests
  const filteredNetworkRequests = networkRequests.filter(req => {
    if (filters.network.method !== 'all' && req.method !== filters.network.method) {
      return false;
    }
    if (filters.network.status !== 'all') {
      const statusCategory = req.status ? `${Math.floor(req.status / 100)}xx` : 'error';
      if (statusCategory !== filters.network.status) {
        return false;
      }
    }
    if (filters.network.search && !req.url.toLowerCase().includes(filters.network.search.toLowerCase())) {
      return false;
    }
    if (filters.network.onlyErrors && req.status && req.status < 400 && !req.error) {
      return false;
    }
    return true;
  });

  // Get unique components for filtering
  const uniqueComponents = Array.from(new Set(
    consoleLogs
      .map(log => log.context?.component)
      .filter(Boolean)
  )).sort();

  // Get unique methods for filtering
  const uniqueMethods = Array.from(new Set(
    networkRequests.map(req => req.method)
  )).sort();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return duration < 1000 ? `${Math.round(duration)}ms` : `${(duration / 1000).toFixed(2)}s`;
  };

  const formatSize = (size?: { request: number; response: number }) => {
    if (!size) return 'N/A';
    const total = size.request + size.response;
    if (total < 1024) return `${total}B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)}KB`;
    return `${(total / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getStatusIcon = (status?: number) => {
    if (!status) return <XCircle className="w-4 h-4 text-red-500" />;
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status >= 300 && status < 400) return <Activity className="w-4 h-4 text-blue-500" />;
    if (status >= 400 && status < 500) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getLevelColor = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'trace':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (process.env.NODE_ENV === 'production' && localStorage.getItem('revivatech_debug_mode') !== 'true') {
    return null;
  }

  return (
    <>
      {/* Enhanced Toggle Button */}
      <button
        onClick={toggleVisibility}
        className={cn(
          'fixed bottom-4 left-4 z-50 bg-gray-800 hover:bg-gray-700 text-white shadow-lg transition-all duration-200',
          'px-4 py-3 rounded-lg font-mono text-sm flex items-center gap-2',
          isVisible && 'bg-blue-600 hover:bg-blue-700',
          className
        )}
        title="Toggle Enhanced Debug Dashboard"
      >
        <Bug className="w-4 h-4" />
        Debug
        {(consoleLogs.filter(log => log.level === 'error').length > 0 || 
          networkRequests.filter(req => req.error || (req.status && req.status >= 400)).length > 0) && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Enhanced Dashboard Modal */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Enhanced Header */}
            <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <Bug className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Enhanced Debug Dashboard</h2>
                <span className="text-sm text-gray-300">
                  {consoleLogs.length} logs • {networkRequests.length} requests
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportData('all')}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                  title="Export all data"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
                <button
                  onClick={() => clearData('all')}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                  title="Clear all data"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  onClick={toggleVisibility}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <nav className="flex space-x-0 px-6">
                {[
                  { key: 'auth', label: 'Auth & Errors', icon: Bug, count: null },
                  { key: 'console', label: 'Console', icon: Terminal, count: filteredConsoleLogs.length },
                  { key: 'network', label: 'Network', icon: Network, count: filteredNetworkRequests.length },
                  { key: 'performance', label: 'Performance', icon: Activity, count: null },
                  { key: 'storage', label: 'Storage', icon: Database, count: null },
                  { key: 'settings', label: 'Settings', icon: Settings, count: null },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key as TabType)}
                      className={cn(
                        'py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                      {tab.count !== null && (
                        <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {/* Auth Tab - Use existing ErrorMonitoringDashboard */}
              {activeTab === 'auth' && (
                <div className="h-full overflow-y-auto p-6">
                  <ErrorMonitoringDashboard showInProduction={true} />
                </div>
              )}

              {/* Console Tab */}
              {activeTab === 'console' && (
                <div className="h-full flex flex-col">
                  {/* Console Controls */}
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                          value={filters.console.level}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            console: { ...prev.console, level: e.target.value as any }
                          }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="all">All Levels</option>
                          <option value="error">Errors</option>
                          <option value="warn">Warnings</option>
                          <option value="info">Info</option>
                          <option value="log">Logs</option>
                          <option value="debug">Debug</option>
                          <option value="trace">Trace</option>
                        </select>
                      </div>
                      
                      {uniqueComponents.length > 0 && (
                        <select
                          value={filters.console.component}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            console: { ...prev.console, component: e.target.value }
                          }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="all">All Components</option>
                          {uniqueComponents.map(component => (
                            <option key={component} value={component}>{component}</option>
                          ))}
                        </select>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search logs..."
                          value={filters.console.search}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            console: { ...prev.console, search: e.target.value }
                          }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportData('console')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={() => clearData('console')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Console Logs */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {filteredConsoleLogs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No console logs found</p>
                        </div>
                      ) : (
                        filteredConsoleLogs.map((log) => (
                          <div
                            key={log.id}
                            className={cn(
                              'p-3 rounded-lg border text-sm font-mono',
                              getLevelColor(log.level)
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs opacity-75 flex-shrink-0">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-bold uppercase flex-shrink-0',
                                  log.level === 'error' ? 'bg-red-200 text-red-800' :
                                  log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' :
                                  log.level === 'info' ? 'bg-blue-200 text-blue-800' :
                                  'bg-gray-200 text-gray-800'
                                )}>
                                  {log.level}
                                </span>
                                {log.context?.component && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    {log.context.component}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm mb-2 break-words">
                              {log.message}
                            </div>

                            {(log.stack || log.context || log.metadata) && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                                  Additional Details
                                </summary>
                                <div className="mt-2 text-xs bg-black bg-opacity-5 p-2 rounded overflow-auto max-h-32">
                                  {log.stack && (
                                    <div className="mb-2">
                                      <strong>Stack Trace:</strong>
                                      <pre className="whitespace-pre-wrap mt-1">{log.stack}</pre>
                                    </div>
                                  )}
                                  {log.context && (
                                    <div className="mb-2">
                                      <strong>Context:</strong>
                                      <pre className="whitespace-pre-wrap mt-1">
                                        {JSON.stringify(log.context, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.metadata && (
                                    <div>
                                      <strong>Metadata:</strong>
                                      <pre className="whitespace-pre-wrap mt-1">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Network Tab */}
              {activeTab === 'network' && (
                <div className="h-full flex flex-col">
                  {/* Network Controls */}
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                          value={filters.network.method}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            network: { ...prev.network, method: e.target.value }
                          }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="all">All Methods</option>
                          {uniqueMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>
                      
                      <select
                        value={filters.network.status}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          network: { ...prev.network, status: e.target.value }
                        }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="2xx">Success (2xx)</option>
                        <option value="3xx">Redirect (3xx)</option>
                        <option value="4xx">Client Error (4xx)</option>
                        <option value="5xx">Server Error (5xx)</option>
                        <option value="error">Network Error</option>
                      </select>
                      
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.network.onlyErrors}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            network: { ...prev.network, onlyErrors: e.target.checked }
                          }))}
                          className="rounded"
                        />
                        Errors only
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search URLs..."
                          value={filters.network.search}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            network: { ...prev.network, search: e.target.value }
                          }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportData('network')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={() => clearData('network')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Network Requests */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredNetworkRequests.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No network requests found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredNetworkRequests.map((request) => (
                          <div key={request.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {getStatusIcon(request.status)}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                      'px-2 py-1 rounded text-xs font-bold',
                                      request.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                      request.method === 'POST' ? 'bg-green-100 text-green-800' :
                                      request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                      request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    )}>
                                      {request.method}
                                    </span>
                                    <span className={cn(
                                      'px-2 py-1 rounded text-xs font-mono',
                                      !request.status || request.status >= 400 
                                        ? 'bg-red-100 text-red-800'
                                        : request.status >= 300
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    )}>
                                      {request.status || 'ERR'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(request.timestamp)}
                                    </span>
                                  </div>
                                  
                                  <div className="text-sm font-mono truncate" title={request.url}>
                                    {request.url}
                                  </div>
                                  
                                  {request.error && (
                                    <div className="text-xs text-red-600 mt-1">
                                      Error: {request.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(request.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {formatSize(request.size)}
                                </div>
                              </div>
                            </div>

                            {/* Request Details */}
                            {(request.requestBody || request.responseBody || request.timing) && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                  Request Details
                                </summary>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {request.requestBody && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Request Body</h5>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 border">
                                        {typeof request.requestBody === 'string' 
                                          ? request.requestBody 
                                          : JSON.stringify(request.requestBody, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {request.responseBody && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Response Body</h5>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 border">
                                        {typeof request.responseBody === 'string' 
                                          ? request.responseBody 
                                          : JSON.stringify(request.responseBody, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {request.timing && (
                                    <div className="md:col-span-2">
                                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Timing Breakdown</h5>
                                      <div className="flex gap-4 text-xs">
                                        {request.timing.dns && (
                                          <span>DNS: {Math.round(request.timing.dns)}ms</span>
                                        )}
                                        {request.timing.tcp && (
                                          <span>TCP: {Math.round(request.timing.tcp)}ms</span>
                                        )}
                                        {request.timing.tls && (
                                          <span>TLS: {Math.round(request.timing.tls)}ms</span>
                                        )}
                                        <span>Request: {Math.round(request.timing.request)}ms</span>
                                        <span>Response: {Math.round(request.timing.response)}ms</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="p-6">
                  <div className="text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Performance Monitoring</h3>
                    <p>Performance profiling features coming soon...</p>
                  </div>
                </div>
              )}

              {/* Storage Tab */}
              {activeTab === 'storage' && (
                <div className="p-6">
                  <div className="text-center text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Storage Inspector</h3>
                    <p>Storage inspection features coming soon...</p>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium mb-4">Debug Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Console Manager</h4>
                        <div className="space-y-2 text-sm">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            Enable console interception
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            Track stack traces
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            Enable performance metrics
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Network Monitor</h4>
                        <div className="space-y-2 text-sm">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            Track request/response bodies
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            Track only failed requests
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            Enable timing analysis
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <button
                        onClick={() => {
                          localStorage.setItem('revivatech_debug_mode', 'false');
                          setIsVisible(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Disable Debug Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedDebugDashboard;