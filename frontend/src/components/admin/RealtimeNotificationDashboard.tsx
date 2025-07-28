import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface NotificationStats {
  total: number;
  users: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface WebSocketStats {
  totalConnections: number;
  authenticatedUsers: number;
  connections: string[];
  users: string[];
}

interface NotificationTemplate {
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: string;
  actions?: Array<{
    id: string;
    label: string;
    type: 'button' | 'link';
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  persistent?: boolean;
}

interface RealtimeNotificationDashboardProps {
  className?: string;
}

export const RealtimeNotificationDashboard: React.FC<RealtimeNotificationDashboardProps> = ({
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'templates' | 'settings'>('overview');
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [webSocketStats, setWebSocketStats] = useState<WebSocketStats | null>(null);
  const [templates, setTemplates] = useState<Record<string, NotificationTemplate>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Send notification form state
  const [sendForm, setSendForm] = useState({
    userId: '',
    templateId: '',
    broadcast: false,
    data: {
      date: '',
      time: '',
      device: '',
      amount: '',
      custom: ''
    }
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch notification stats
      const notificationResponse = await fetch('/api/notifications?action=stats');
      const notificationData = await notificationResponse.json();

      if (notificationData.success) {
        setNotificationStats(notificationData.stats);
      }

      // Fetch WebSocket stats
      const wsResponse = await fetch('/api/websocket?action=stats');
      const wsData = await wsResponse.json();

      if (wsData.success) {
        setWebSocketStats(wsData.stats);
      }

      // Fetch templates
      const templatesResponse = await fetch('/api/notifications?action=templates');
      const templatesData = await templatesResponse.json();

      if (templatesData.success) {
        setTemplates(templatesData.templates);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch stats');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const sendNotification = async () => {
    if (!sendForm.userId && !sendForm.broadcast) {
      setError('Please specify a user ID or select broadcast');
      return;
    }

    if (!sendForm.templateId) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: sendForm.broadcast ? undefined : sendForm.userId,
          templateId: sendForm.templateId,
          data: sendForm.data
        })
      });

      const result = await response.json();

      if (result.success) {
        setSendForm({
          userId: '',
          templateId: '',
          broadcast: false,
          data: { date: '', time: '', device: '', amount: '', custom: '' }
        });
        fetchStats(); // Refresh stats
      } else {
        setError(result.error || 'Failed to send notification');
      }
    } catch (err) {
      setError('Network error while sending notification');
      console.error('Send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          userId: 'test-user',
          data: { template: templateId }
        })
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error || 'Test failed');
      }
    } catch (err) {
      setError('Test notification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStatusColor = (status: 'online' | 'offline' | 'warning') => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
    }
  };

  const getSystemStatus = (): 'online' | 'offline' | 'warning' => {
    if (!webSocketStats) return 'offline';
    if (webSocketStats.totalConnections === 0) return 'warning';
    return 'online';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'send', label: 'Send Notification', icon: '📤' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Real-time Notifications</h1>
          <p className="text-muted-foreground">
            Manage and monitor real-time notification system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(getSystemStatus()))}>
            {getSystemStatus() === 'online' ? '🟢 Online' : 
             getSystemStatus() === 'warning' ? '🟡 Warning' : '🔴 Offline'}
          </div>
          <Button variant="ghost" onClick={fetchStats} disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌</span>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2">
            Dismiss
          </Button>
        </Card>
      )}

      {/* Tab Navigation */}
      <Card className="p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔗</div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {webSocketStats ? formatNumber(webSocketStats.totalConnections) : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">👥</div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {webSocketStats ? formatNumber(webSocketStats.authenticatedUsers) : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">Authenticated Users</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📩</div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {notificationStats ? formatNumber(notificationStats.total) : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Notifications</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📬</div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {notificationStats ? formatNumber(notificationStats.unread) : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">Unread Notifications</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications by Type */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Notifications by Type</h3>
              {notificationStats?.byType ? (
                <div className="space-y-3">
                  {Object.entries(notificationStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                      <span className="font-medium">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No data available</div>
              )}
            </Card>

            {/* Notifications by Priority */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Notifications by Priority</h3>
              {notificationStats?.byPriority ? (
                <div className="space-y-3">
                  {Object.entries(notificationStats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm capitalize flex items-center gap-2">
                        {priority === 'urgent' && '🔴'}
                        {priority === 'high' && '🟡'}
                        {priority === 'normal' && '🔵'}
                        {priority === 'low' && '⚪'}
                        {priority}
                      </span>
                      <span className="font-medium">{formatNumber(count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No data available</div>
              )}
            </Card>
          </div>

          {/* System Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">WebSocket Server:</span>
                <span className="ml-2">Port 3012</span>
              </div>
              <div>
                <span className="font-medium">Last Refresh:</span>
                <span className="ml-2">{lastRefresh.toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="font-medium">API Health:</span>
                <span className="ml-2 text-green-600">✅ Operational</span>
              </div>
              <div>
                <span className="font-medium">Templates:</span>
                <span className="ml-2">{Object.keys(templates).length} available</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Send Notification</h3>
            
            <div className="space-y-4">
              {/* Recipient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">User ID</label>
                  <Input
                    placeholder="Enter user ID"
                    value={sendForm.userId}
                    onChange={(e) => setSendForm(prev => ({ ...prev, userId: e.target.value }))}
                    disabled={sendForm.broadcast}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sendForm.broadcast}
                      onChange={(e) => setSendForm(prev => ({ 
                        ...prev, 
                        broadcast: e.target.checked,
                        userId: e.target.checked ? '' : prev.userId
                      }))}
                    />
                    <span className="text-sm">Broadcast to all users</span>
                  </label>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Template</label>
                <Select
                  value={sendForm.templateId}
                  onValueChange={(value) => setSendForm(prev => ({ ...prev, templateId: value }))}
                  options={[
                    { value: '', label: 'Select a template...' },
                    ...Object.entries(templates).map(([id, template]) => ({
                      value: id,
                      label: template.title
                    }))
                  ]}
                />
              </div>

              {/* Template Data */}
              {sendForm.templateId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Date (e.g., Tomorrow)"
                    value={sendForm.data.date}
                    onChange={(e) => setSendForm(prev => ({ 
                      ...prev, 
                      data: { ...prev.data, date: e.target.value } 
                    }))}
                  />
                  <Input
                    placeholder="Time (e.g., 2:00 PM)"
                    value={sendForm.data.time}
                    onChange={(e) => setSendForm(prev => ({ 
                      ...prev, 
                      data: { ...prev.data, time: e.target.value } 
                    }))}
                  />
                  <Input
                    placeholder="Device (e.g., iPhone 14 Pro)"
                    value={sendForm.data.device}
                    onChange={(e) => setSendForm(prev => ({ 
                      ...prev, 
                      data: { ...prev.data, device: e.target.value } 
                    }))}
                  />
                  <Input
                    placeholder="Amount (e.g., $199)"
                    value={sendForm.data.amount}
                    onChange={(e) => setSendForm(prev => ({ 
                      ...prev, 
                      data: { ...prev.data, amount: e.target.value } 
                    }))}
                  />
                </div>
              )}

              {/* Send Button */}
              <div className="flex gap-2">
                <Button 
                  onClick={sendNotification} 
                  disabled={loading || (!sendForm.userId && !sendForm.broadcast) || !sendForm.templateId}
                >
                  {loading ? 'Sending...' : '📤 Send Notification'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setSendForm({
                    userId: '',
                    templateId: '',
                    broadcast: false,
                    data: { date: '', time: '', device: '', amount: '', custom: '' }
                  })}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(templates).map(([id, template]) => (
              <Card key={id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{template.title}</h4>
                    <div className={cn('px-2 py-1 rounded text-xs', {
                      'bg-red-100 text-red-800': template.priority === 'urgent',
                      'bg-yellow-100 text-yellow-800': template.priority === 'high',
                      'bg-blue-100 text-blue-800': template.priority === 'normal',
                      'bg-gray-100 text-gray-800': template.priority === 'low',
                    })}>
                      {template.priority}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{template.message}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">
                      {template.type?.replace('-', ' ')}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => sendTestNotification(id)}
                      disabled={loading}
                    >
                      🧪 Test
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">System Settings</h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">WebSocket Configuration</h4>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <div>Port: 3012</div>
                    <div>Path: /ws</div>
                    <div>Auto-reconnect: Enabled</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Notification Storage</h4>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <div>Type: In-memory (Demo)</div>
                    <div>Persistence: Session only</div>
                    <div>Max per user: 50</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">API Endpoints</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="p-2 bg-muted rounded">
                <span className="text-green-600">GET</span> /api/websocket?action=stats
              </div>
              <div className="p-2 bg-muted rounded">
                <span className="text-blue-600">POST</span> /api/websocket (send messages)
              </div>
              <div className="p-2 bg-muted rounded">
                <span className="text-green-600">GET</span> /api/notifications?userId=...
              </div>
              <div className="p-2 bg-muted rounded">
                <span className="text-blue-600">POST</span> /api/notifications (create notification)
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RealtimeNotificationDashboard;