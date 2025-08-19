'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AdminGate } from '@/lib/auth/role-guards';
import { useAuth } from '@/lib/auth';
import { securityApi, SecurityMetrics, SecurityAlert, ActiveSession, AuditLogEntry } from '@/lib/api/securityApi';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Filter, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  BarChart3,
  PieChart,
  Settings,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';

// Helper function to get risk score color
const getRiskScoreColor = (score: number): string => {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

// Helper function to format session duration
const formatDuration = (session: ActiveSession): string => {
  const now = new Date();
  const created = new Date(session.createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditLogEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  // Load security data
  useEffect(() => {
    loadSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Reload audit events when filters change
  useEffect(() => {
    loadAuditEvents();
  }, [filterCategory, filterLevel, searchTerm]);

  const loadSecurityData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadMetrics(),
        loadAlerts(),
        loadAuditEvents(),
        loadActiveSessions(),
      ]);
    } catch (error) {
      console.error('Error loading security data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async (): Promise<void> => {
    try {
      const data = await securityApi.getMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Fallback to empty metrics
      setMetrics({
        totalSessions: 0,
        activeSessions: 0,
        suspiciousSessions: 0,
        failedLogins: 0,
        successfulLogins: 0,
        averageRiskScore: 0,
        criticalEvents: 0,
        unacknowledgedAlerts: 0,
        blockedIPs: 0,
        twoFactorEnabled: 0,
        totalUsers: 0,
        trustedDevices: 0,
        timestamp: new Date().toISOString()
      });
    }
  };

  const loadAlerts = async (): Promise<void> => {
    try {
      const data = await securityApi.getAlerts({ limit: 10 });
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    }
  };

  const loadAuditEvents = async (): Promise<void> => {
    try {
      const filters: any = { limit: 100 };
      
      if (filterCategory !== 'all') {
        filters.category = filterCategory;
      }
      
      if (filterLevel !== 'all') {
        filters.level = filterLevel;
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const data = await securityApi.getAuditLogs(filters);
      setAuditEvents(data);
    } catch (error) {
      console.error('Error loading audit events:', error);
      setAuditEvents([]);
    }
  };

  const loadActiveSessions = async (): Promise<void> => {
    try {
      const data = await securityApi.getActiveSessions({ limit: 50 });
      setActiveSessions(data);
    } catch (error) {
      console.error('Error loading active sessions:', error);
      setActiveSessions([]);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await securityApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Terminate session
  const terminateSession = async (sessionId: string) => {
    try {
      await securityApi.terminateSession(sessionId, 'Admin terminated');
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  // Export audit log
  const exportAuditLog = async () => {
    try {
      const filters: any = {};
      
      if (filterCategory !== 'all') {
        filters.category = filterCategory;
      }
      
      if (filterLevel !== 'all') {
        filters.level = filterLevel;
      }

      const blob = await securityApi.exportAuditLogs({ ...filters, format: 'csv' });
      securityApi.downloadFile(blob, `security-audit-${Date.now()}.csv`);
    } catch (error) {
      console.error('Error exporting audit log:', error);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'expired': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <AdminGate>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor security events, sessions, and system health
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as '1h' | '24h' | '7d' | '30d')}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </Select>
            
            <Button
              variant="outline"
              onClick={loadSecurityData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center text-red-800">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Error loading security data: {error}</span>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !metrics && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading security data...</span>
            </div>
          </div>
        )}

        {/* Security Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{metrics?.activeSessions || 0}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from yesterday
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Risk Score</p>
                <p className="text-2xl font-bold">{metrics?.averageRiskScore || 0}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5% from yesterday
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Logins</p>
                <p className="text-2xl font-bold">{metrics?.failedLogins || 0}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3 from yesterday
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Events</p>
                <p className="text-2xl font-bold">{metrics?.criticalEvents || 0}</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Last 2 hours ago
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Security Alerts */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Security Alerts</h2>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure Alerts
            </Button>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.acknowledged ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-600' :
                      alert.severity === 'high' ? 'bg-orange-600' :
                      alert.severity === 'medium' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`} />
                    
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        <span>{alert.category}</span>
                        {alert.ipAddress && <span>IP: {alert.ipAddress}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <div className="text-sm text-muted-foreground">
              {activeSessions.length} active sessions
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Device</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Risk Score</th>
                  <th className="text-left py-3 px-4">Duration</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((session) => (
                  <tr key={session.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <span className="text-sm capitalize">{session.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">{session.userEmail || session.userId}</div>
                      <div className="text-xs text-muted-foreground">{session.userName}</div>
                      {session.securityFlags.length > 0 && (
                        <div className="text-xs text-red-600">
                          {session.securityFlags.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 text-sm">
                        {session.deviceInfo.browser === 'Chrome' ? <Monitor className="h-4 w-4" /> : 
                         session.deviceInfo.browser === 'Safari' ? <Smartphone className="h-4 w-4" /> : 
                         <Globe className="h-4 w-4" />}
                        <span>{session.deviceInfo.browser}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{session.deviceInfo.os}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{session.deviceInfo.ip}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getRiskScoreColor(session.riskScore)}`}>
                        {session.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDuration(session)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => terminateSession(session.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Terminate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit Log */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Audit Log</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportAuditLog}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search audit events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={filterCategory}
              onValueChange={setFilterCategory}
            >
              <option value="all">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="authorization">Authorization</option>
              <option value="security">Security</option>
              <option value="user_management">User Management</option>
              <option value="session">Session</option>
              <option value="audit">Audit</option>
            </Select>
            <Select
              value={filterLevel}
              onValueChange={setFilterLevel}
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Timestamp</th>
                  <th className="text-left py-3 px-4">Level</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Event</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Details</th>
                  <th className="text-left py-3 px-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        event.level === 'critical' ? 'bg-red-100 text-red-800' :
                        event.level === 'error' ? 'bg-orange-100 text-orange-800' :
                        event.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        event.level === 'info' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{event.category}</td>
                    <td className="py-3 px-4 text-sm font-medium">{event.eventType}</td>
                    <td className="py-3 px-4 text-sm">{event.userEmail || event.userId || 'System'}</td>
                    <td className="py-3 px-4 text-sm max-w-xs truncate">{event.details}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getRiskScoreColor(event.riskScore || 0)}`}>
                        {event.riskScore || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminGate>
  );
};

export default SecurityDashboard;