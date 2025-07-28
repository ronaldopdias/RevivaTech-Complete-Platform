'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Settings, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface EmailSettings {
  id?: number;
  provider: 'zoho' | 'gmail' | 'sendgrid' | 'smtp';
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password?: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  test_email?: string;
  backup_provider?: string;
  retry_attempts: number;
  queue_enabled: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface EmailLog {
  id: number;
  to_email: string;
  from_email: string;
  subject: string;
  provider: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  message_id?: string;
  sent_at?: string;
  created_at: string;
  retry_count: number;
}

interface EmailStats {
  total_emails: number;
  sent_emails: number;
  failed_emails: number;
  pending_emails: number;
  success_rate: number;
  providers_used: number;
  unique_recipients: number;
}

export default function EmailConfiguration() {
  const [settings, setSettings] = useState<EmailSettings>({
    provider: 'zoho',
    smtp_host: 'smtppro.zoho.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: 'noreply@revivatech.co.uk',
    smtp_password: '',
    from_email: 'noreply@revivatech.co.uk',
    from_name: 'RevivaTech',
    reply_to_email: '',
    test_email: 'admin@revivatech.co.uk',
    retry_attempts: 3,
    queue_enabled: true
  });

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [testEmail, setTestEmail] = useState('admin@revivatech.co.uk');
  const [testSubject, setTestSubject] = useState('Zoho Mail Configuration Test');
  const [testMessage, setTestMessage] = useState('This is a test email to verify your email configuration is working correctly.');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'stats'>('settings');

  // Get auth token from localStorage or context
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // API headers with authentication
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Load email settings on component mount
  useEffect(() => {
    loadEmailSettings();
    if (activeTab === 'logs') loadEmailLogs();
    if (activeTab === 'stats') loadEmailStats();
  }, [activeTab]);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadEmailSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-config/settings', {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            ...data.settings,
            smtp_password: '' // Don't populate password field for security
          });
        }
      } else if (response.status === 404) {
        // No existing configuration, use defaults
        showMessage('info', 'No email configuration found. Please set up your email settings.');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
      showMessage('error', 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    setSaving(true);
    try {
      // Remove empty password if not provided
      const settingsToSave = { ...settings };
      if (!settingsToSave.smtp_password || settingsToSave.smtp_password.trim() === '') {
        delete settingsToSave.smtp_password;
      }

      const response = await fetch('/api/admin/email-config/settings', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settingsToSave)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(prev => ({ ...prev, ...data.settings }));
        showMessage('success', data.message || 'Email settings saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save email settings:', error);
      showMessage('error', `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/email-config/test', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          to_email: testEmail,
          subject: testSubject,
          message: testMessage,
          smtp_password: settings.smtp_password // Include password for test
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', `Test email sent successfully to ${testEmail}`);
        // Refresh logs to show the test email
        if (activeTab === 'logs') loadEmailLogs();
      } else {
        throw new Error(data.details || data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      showMessage('error', `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const loadEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/admin/email-config/logs?limit=20', {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load email logs:', error);
      showMessage('error', 'Failed to load email logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadEmailStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/admin/email-config/stats?period=7d', {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load email stats:', error);
      showMessage('error', 'Failed to load email statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Provider Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Email Provider Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Provider
            </label>
            <select
              value={settings.provider}
              onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zoho">Zoho Mail</option>
              <option value="gmail">Gmail</option>
              <option value="sendgrid">SendGrid</option>
              <option value="smtp">Custom SMTP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={settings.smtp_host}
              onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="smtppro.zoho.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={settings.smtp_port}
              onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="587"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Username
            </label>
            <input
              type="email"
              value={settings.smtp_user}
              onChange={(e) => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="noreply@revivatech.co.uk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              value={settings.smtp_password || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your email password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Email
            </label>
            <input
              type="email"
              value={settings.from_email}
              onChange={(e) => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="noreply@revivatech.co.uk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={settings.from_name}
              onChange={(e) => setSettings(prev => ({ ...prev, from_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="RevivaTech"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply-To Email (Optional)
            </label>
            <input
              type="email"
              value={settings.reply_to_email || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, reply_to_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="support@revivatech.co.uk"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.smtp_secure}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Use SSL/TLS</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.queue_enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, queue_enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Enable email queue</span>
            </label>
          </div>

          <Button
            onClick={saveEmailSettings}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </Card>

      {/* Test Email */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Send className="w-5 h-5 mr-2" />
          Send Test Email
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@revivatech.co.uk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Test Email Subject"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Test email message..."
          />
        </div>

        <Button
          onClick={sendTestEmail}
          disabled={testing || !testEmail}
          className="flex items-center space-x-2"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{testing ? 'Sending...' : 'Send Test Email'}</span>
        </Button>
      </Card>
    </div>
  );

  const renderLogs = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Email Logs
        </h3>
        <Button
          onClick={loadEmailLogs}
          disabled={loadingLogs}
          variant="outline"
          size="sm"
        >
          {loadingLogs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {loadingLogs ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading email logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No email logs found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(log.status)}
                      <Badge className={`ml-2 ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.to_email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.sent_at ? formatDate(log.sent_at) : formatDate(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Email Statistics (Last 7 Days)
          </h3>
          <Button
            onClick={loadEmailStats}
            disabled={loadingStats}
            variant="outline"
            size="sm"
          >
            {loadingStats ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
        </div>

        {loadingStats ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">Total Emails</h4>
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.total_emails}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">Sent Successfully</h4>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.sent_emails}</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">Failed</h4>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">{stats.failed_emails}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">Success Rate</h4>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.success_rate}%</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No statistics available</p>
          </div>
        )}
      </Card>
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading email configuration...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Configuration</h1>
          <p className="text-gray-600">Manage your email settings and monitor email delivery</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Email System Active</span>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {message.type === 'error' && <XCircle className="w-5 h-5 mr-2" />}
            {message.type === 'info' && <AlertCircle className="w-5 h-5 mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'settings', label: 'Settings', icon: Settings },
            { key: 'logs', label: 'Email Logs', icon: Eye },
            { key: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'logs' && renderLogs()}
      {activeTab === 'stats' && renderStats()}
    </div>
  );
}