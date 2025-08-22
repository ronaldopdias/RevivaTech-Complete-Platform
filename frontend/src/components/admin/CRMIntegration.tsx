// CRM Integration Management Component
// Comprehensive CRM integration management for admin dashboard

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  Cog6ToothIcon,
  LinkIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CRMIntegrationProps {
  className?: string;
}

interface WebhookItem {
  id: string;
  type: string;
  status: 'success' | 'failed' | 'pending' | 'processing';
  timestamp: string;
  attempts: number;
  error?: string;
}

export function CRMIntegration({ className }: CRMIntegrationProps) {
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<{ queue: WebhookItem[]; history: WebhookItem[] }>({ queue: [], history: [] });
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      
      // Load integration status, webhooks, and config in parallel
      const [statusRes, webhooksRes, configRes] = await Promise.all([
        fetch('/api/crm/integration'),
        fetch('/api/crm/webhooks'),
        fetch('/api/crm/config')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIntegrationStatus(statusData.data);
      }

      if (webhooksRes.ok) {
        const webhooksData = await webhooksRes.json();
        setWebhooks(webhooksData.data);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData.data.config);
      }
    } catch (error) {
      console.error('Failed to load CRM integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testIntegration = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/crm/integration', { method: 'POST' });
      const result = await response.json();
      
      // Reload data to show updated status
      await loadIntegrationData();
      
      // Show test results (you could add a toast notification here)
      console.log('Test results:', result);
    } catch (error) {
      console.error('Integration test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const processWebhookQueue = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/crm/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' })
      });
      
      await loadIntegrationData();
    } catch (error) {
      console.error('Failed to process webhook queue:', error);
    } finally {
      setProcessing(false);
    }
  };

  const retryFailedWebhooks = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/crm/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry' })
      });
      
      await loadIntegrationData();
    } catch (error) {
      console.error('Failed to retry failed webhooks:', error);
    } finally {
      setProcessing(false);
    }
  };

  const clearWebhookHistory = async (target: 'queue' | 'history' | 'failed') => {
    try {
      const response = await fetch(`/api/crm/webhooks?target=${target}`, {
        method: 'DELETE'
      });
      
      await loadIntegrationData();
    } catch (error) {
      console.error(`Failed to clear ${target}:`, error);
    }
  };

  const updateFeatureConfig = async (featureName: string, enabled: boolean) => {
    try {
      const updatedFeatures = {
        ...config.features,
        [featureName]: { ...config.features[featureName], enabled }
      };

      const response = await fetch('/api/crm/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'features',
          config: updatedFeatures
        })
      });

      if (response.ok) {
        setConfig({ ...config, features: updatedFeatures });
      }
    } catch (error) {
      console.error('Failed to update feature config:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="h-4 w-4" />;
      case 'failed': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'processing': return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading CRM integration data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Integration Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-2" />
                CRM Integration Status
              </CardTitle>
              <CardDescription>
                Monitor and manage CRM integration health and connectivity
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={integrationStatus?.healthy ? "default" : "destructive"}
                className="ml-2"
              >
                {integrationStatus?.healthy ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button
                onClick={testIntegration}
                disabled={testing}
                size="sm"
                variant="outline"
              >
                {testing && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                Test Connection
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {integrationStatus?.statistics?.totalNotificationsSent || 0}
              </div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {integrationStatus?.statistics?.successfulNotifications || 0}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {integrationStatus?.statistics?.failedNotifications || 0}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="webhooks">Webhook Management</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="features">Feature Settings</TabsTrigger>
        </TabsList>

        {/* Webhook Management Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Webhook Queue</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {webhooks.queue.length} queued
                    </Badge>
                    <Button
                      onClick={processWebhookQueue}
                      disabled={processing || webhooks.queue.length === 0}
                      size="sm"
                    >
                      {processing && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                      Process Queue
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {webhooks.queue.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No webhooks in queue
                    </div>
                  ) : (
                    webhooks.queue.map((webhook) => (
                      <div key={webhook.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={getStatusColor(webhook.status)}>
                            {getStatusIcon(webhook.status)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium">{webhook.type}</div>
                            <div className="text-xs text-gray-500">
                              Attempt {webhook.attempts}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(webhook.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Webhooks</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={retryFailedWebhooks}
                      disabled={processing}
                      size="sm"
                      variant="outline"
                    >
                      Retry Failed
                    </Button>
                    <Button
                      onClick={() => clearWebhookHistory('failed')}
                      size="sm"
                      variant="outline"
                    >
                      Clear Failed
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {webhooks.history.slice(0, 10).map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={getStatusColor(webhook.status)}>
                          {getStatusIcon(webhook.status)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">{webhook.type}</div>
                          {webhook.error && (
                            <div className="text-xs text-red-500 truncate max-w-48">
                              {webhook.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(webhook.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                CRM Configuration
              </CardTitle>
              <CardDescription>
                Manage CRM endpoint and connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="webhook-url">CRM Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={config.webhookUrl}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={config.apiKey}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="retry-attempts">Retry Attempts</Label>
                      <Input
                        id="retry-attempts"
                        type="number"
                        value={config.retryAttempts}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="retry-delay">Retry Delay (ms)</Label>
                      <Input
                        id="retry-delay"
                        type="number"
                        value={config.retryDelay}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Integration Features
              </CardTitle>
              <CardDescription>
                Enable or disable specific CRM integration features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config?.features && (
                <div className="space-y-4">
                  {Object.entries(config.features).map(([featureName, feature]: [string, any]) => (
                    <div key={featureName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">
                          {featureName.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Endpoint: {feature.endpoint}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={feature.enabled ? "default" : "secondary"}>
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={(enabled) => updateFeatureConfig(featureName, enabled)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}