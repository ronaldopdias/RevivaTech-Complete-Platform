import React, { useState, useEffect } from 'react';
import { usePermissions } from '../auth/usePermissions';
import { PermissionGuard } from '../auth/RBACProvider';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

/**
 * Enhanced Security Dashboard
 * Comprehensive security monitoring and audit logging interface
 */

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  user_id?: string;
  ip_address: string;
  is_resolved: boolean;
  metadata?: any;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  attempt_type: string;
  status: 'success' | 'failed';
  timestamp: string;
  location_country: string;
  location_city: string;
  is_suspicious: boolean;
  failure_reason?: string;
}

interface SecurityStats {
  total_events: number;
  unresolved_events: number;
  failed_logins_24h: number;
  suspicious_activities: number;
  mfa_adoption_rate: number;
  active_sessions: number;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  severity: string;
  status: string;
  ip_address: string;
  user_name: string;
  user_email: string;
}

export const SecurityDashboard: React.FC = () => {
  const { canViewAuditLogs, canAccessSystem } = usePermissions();
  
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    total_events: 0,
    unresolved_events: 0,
    failed_logins_24h: 0,
    suspicious_activities: 0,
    mfa_adoption_rate: 0,
    active_sessions: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'logins' | 'audit'>('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    event_type: 'all'
  });

  // Fetch security data
  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [
        statsResponse,
        eventsResponse,
        loginsResponse,
        auditResponse
      ] = await Promise.all([
        fetch(`/api/security/stats?timeRange=${timeRange}`),
        fetch(`/api/security/events?timeRange=${timeRange}&${new URLSearchParams(filters)}`),
        fetch(`/api/security/login-attempts?timeRange=${timeRange}`),
        fetch(`/api/security/audit-logs?timeRange=${timeRange}&limit=50`)
      ]);

      if (!statsResponse.ok || !eventsResponse.ok || !loginsResponse.ok || !auditResponse.ok) {
        throw new Error('Failed to fetch security data');
      }

      const [
        statsData,
        eventsData,
        loginsData,
        auditData
      ] = await Promise.all([
        statsResponse.json(),
        eventsResponse.json(),
        loginsResponse.json(),
        auditResponse.json()
      ]);

      setStats(statsData);
      setSecurityEvents(eventsData.events);
      setLoginAttempts(loginsData.attempts);
      setAuditLogs(auditData.logs);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAuditLogs) {
      fetchSecurityData();
    }
  }, [canViewAuditLogs, timeRange, filters]);

  // Handle security event actions
  const handleResolveEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/security/events/${eventId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to resolve event');

      toast.success('Security event resolved');
      fetchSecurityData();
    } catch (error) {
      console.error('Error resolving event:', error);
      toast.error('Failed to resolve event');
    }
  };

  const handleBlockIP = async (ipAddress: string) => {
    try {
      const response = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_address: ipAddress })
      });

      if (!response.ok) throw new Error('Failed to block IP');

      toast.success(`IP ${ipAddress} blocked successfully`);
      fetchSecurityData();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast.error('Failed to block IP');
    }
  };

  const handleExportAuditLog = async () => {
    try {
      const response = await fetch('/api/security/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, filters })
      });

      if (!response.ok) throw new Error('Failed to export audit log');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Audit log exported successfully');
    } catch (error) {
      console.error('Error exporting audit log:', error);
      toast.error('Failed to export audit log');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canViewAuditLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view security data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3" />
            Security Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor security events, audit logs, and system access
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <PermissionGuard action="export" resource="audit">
            <button
              onClick={handleExportAuditLog}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Security Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_events}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unresolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unresolved_events}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed Logins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed_logins_24h}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Suspicious</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspicious_activities}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">MFA Adoption</p>
              <p className="text-2xl font-bold text-gray-900">{stats.mfa_adoption_rate}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_sessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'events', name: 'Security Events', icon: ExclamationTriangleIcon },
            { id: 'logins', name: 'Login Attempts', icon: EyeIcon },
            { id: 'audit', name: 'Audit Logs', icon: DocumentTextIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Security Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Security Events */}
              <div>
                <h4 className="text-md font-medium mb-3">Recent Security Events</h4>
                <div className="space-y-3">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                              {event.severity}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <h5 className="font-medium mt-1">{event.title}</h5>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                        {!event.is_resolved && (
                          <button
                            onClick={() => handleResolveEvent(event.id)}
                            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Failed Logins */}
              <div>
                <h4 className="text-md font-medium mb-3">Recent Failed Logins</h4>
                <div className="space-y-3">
                  {loginAttempts.filter(a => a.status === 'failed').slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{attempt.email}</span>
                            {attempt.is_suspicious && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Suspicious
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>{attempt.ip_address}</span>
                            {attempt.location_city && (
                              <span> • {attempt.location_city}, {attempt.location_country}</span>
                            )}
                            <span> • {new Date(attempt.timestamp).toLocaleString()}</span>
                          </div>
                          {attempt.failure_reason && (
                            <p className="text-sm text-red-600 mt-1">{attempt.failure_reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleBlockIP(attempt.ip_address)}
                          className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Block IP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Security Events</h3>
              <div className="flex space-x-2">
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="resolved">Resolved</option>
                  <option value="unresolved">Unresolved</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {securityEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.is_resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {event.is_resolved ? 'Resolved' : 'Unresolved'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!event.is_resolved && (
                          <button
                            onClick={() => handleResolveEvent(event.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logins' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Login Attempts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{attempt.email}</div>
                            {attempt.is_suspicious && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Suspicious
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {attempt.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {attempt.location_city}, {attempt.location_country}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attempt.status)}`}>
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {attempt.status === 'failed' && (
                          <button
                            onClick={() => handleBlockIP(attempt.ip_address)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Block IP
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Audit Logs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{log.resource_type}</div>
                          <div className="text-sm text-gray-500">{log.resource_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;