'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CRMIntegrationStatusProps {
  className?: string;
}

interface IntegrationStatus {
  service: string;
  healthy: boolean;
  crmEndpoint: string;
  lastChecked: string;
  features: {
    customerRegistration: boolean;
    bookingNotifications: boolean;
    paymentNotifications: boolean;
    customerUpdates: boolean;
  };
  statistics: {
    totalNotificationsSent: number;
    successfulNotifications: number;
    failedNotifications: number;
    lastSuccessfulNotification: string | null;
    lastFailedNotification: string | null;
  };
  error?: string;
}

export const CRMIntegrationStatus: React.FC<CRMIntegrationStatusProps> = ({
  className = ''
}) => {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/integration');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      } else {
        console.error('Failed to fetch CRM integration status');
      }
    } catch (error) {
      console.error('Error fetching CRM status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runIntegrationTest = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/crm/integration/test', {
        method: 'POST',
      });
      const data = await response.json();
      setTestResults(data.data);
    } catch (error) {
      console.error('Error testing CRM integration:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusColor = (healthy: boolean) => {
    return healthy ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getFeatureIcon = (enabled: boolean) => {
    return enabled ? '✅' : '❌';
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-gray-500">Failed to load CRM integration status</p>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={fetchStatus}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">CRM Integration</h3>
            <p className="text-sm text-muted-foreground">
              Connection to external CRM system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.healthy)}`}>
              {status.healthy ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>

        {/* Connection Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">CRM Endpoint</p>
            <p className="text-xs text-muted-foreground font-mono">
              {status.crmEndpoint}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Last Checked</p>
            <p className="text-xs text-muted-foreground">
              {new Date(status.lastChecked).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 font-medium">Connection Error</p>
            <p className="text-xs text-red-500">{status.error}</p>
          </div>
        )}

        {/* Features Status */}
        <div>
          <p className="text-sm font-medium mb-2">Integration Features</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span>Customer Registration</span>
              <span>{getFeatureIcon(status.features.customerRegistration)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Booking Notifications</span>
              <span>{getFeatureIcon(status.features.bookingNotifications)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Payment Notifications</span>
              <span>{getFeatureIcon(status.features.paymentNotifications)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Customer Updates</span>
              <span>{getFeatureIcon(status.features.customerUpdates)}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <p className="text-sm font-medium mb-2">Notification Statistics</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Total Sent</p>
              <p className="font-medium">{status.statistics.totalNotificationsSent}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Successful</p>
              <p className="font-medium text-green-600">{status.statistics.successfulNotifications}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="font-medium text-red-600">{status.statistics.failedNotifications}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Success Rate</p>
              <p className="font-medium">
                {status.statistics.totalNotificationsSent > 0 
                  ? Math.round((status.statistics.successfulNotifications / status.statistics.totalNotificationsSent) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Test Results</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Health Check</span>
                <span className={testResults.results.crmHealth.success ? 'text-green-600' : 'text-red-600'}>
                  {testResults.results.crmHealth.success ? '✅ Pass' : '❌ Fail'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer Registration</span>
                <span className={testResults.results.customerRegistration.success ? 'text-green-600' : 'text-red-600'}>
                  {testResults.results.customerRegistration.success ? '✅ Pass' : '❌ Fail'}
                </span>
              </div>
              {!testResults.success && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <p className="text-red-600 font-medium">Test Failures:</p>
                  {testResults.results.crmHealth.error && (
                    <p className="text-red-500 text-xs">Health: {testResults.results.crmHealth.error}</p>
                  )}
                  {testResults.results.customerRegistration.error && (
                    <p className="text-red-500 text-xs">Registration: {testResults.results.customerRegistration.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            Refresh Status
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={runIntegrationTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Integration'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CRMIntegrationStatus;