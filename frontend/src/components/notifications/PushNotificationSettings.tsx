'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Send,
  Activity,
  Shield,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePushNotifications } from '@/lib/notifications/pushService';

interface PushNotificationSettingsProps {
  userId?: string;
  showTestButton?: boolean;
  showStats?: boolean;
  className?: string;
}

export function PushNotificationSettings({ 
  userId,
  showTestButton = true,
  showStats = false,
  className = ''
}: PushNotificationSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTest,
    service
  } = usePushNotifications();

  const [isToggling, setIsToggling] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (showStats && isSubscribed) {
      loadStats();
    }
  }, [showStats, isSubscribed]);

  const loadStats = async () => {
    const data = await service.getStats();
    setStats(data);
  };

  const handleToggleNotifications = async () => {
    setIsToggling(true);
    
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        if (permission === 'default') {
          await requestPermission();
        } else {
          await subscribe(userId);
        }
      }
    } catch (error) {
      console.error('Toggle notifications error:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendTest = async () => {
    try {
      await sendTest();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error('Test notification error:', error);
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    if (permission === 'denied') return <BellOff className="w-5 h-5 text-red-500" />;
    if (isSubscribed) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (permission === 'denied') return 'Blocked';
    if (isSubscribed) return 'Active';
    return 'Available';
  };

  const getStatusColor = () => {
    if (!isSupported || permission === 'denied') return 'text-red-600 bg-red-50';
    if (isSubscribed) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Settings className="w-5 h-5 text-blue-500" />
          </motion.div>
          <span className="text-gray-600">Loading notification settings...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Push Notifications
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Stay updated on your repair progress
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Not Supported Message */}
      {!isSupported && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Not Available</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Push notifications are not supported on this device or browser. 
                Try using a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Message */}
      {isSupported && permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Notifications Blocked</h4>
              <p className="text-sm text-red-700 mt-1">
                You've blocked notifications for this site. To enable them, click the 
                lock icon in your browser's address bar and allow notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      {isSupported && permission !== 'denied' && (
        <div className="space-y-4">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Notifications</h4>
              <p className="text-sm text-gray-600">
                Get instant updates about your repairs
              </p>
            </div>
            <Button
              onClick={handleToggleNotifications}
              disabled={isToggling}
              variant={isSubscribed ? 'default' : 'outline'}
              size="sm"
              className="min-w-[100px]"
            >
              {isToggling ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Settings className="w-4 h-4" />
                </motion.div>
              ) : isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          </div>

          {/* Notification Types */}
          {isSubscribed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">You'll receive notifications for:</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Booking confirmations and updates
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Repair progress and completion
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Quote approvals and payment reminders
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Device ready for pickup notifications
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Special offers and promotions
                </div>
              </div>
            </div>
          )}

          {/* Test Notification */}
          {showTestButton && isSubscribed && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Test Notification</h4>
                  <p className="text-sm text-gray-600">
                    Send a test notification to verify everything works
                  </p>
                </div>
                <Button
                  onClick={handleSendTest}
                  variant="outline"
                  size="sm"
                  disabled={testSent}
                >
                  {testSent ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Sent!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Device Information</h4>
                <p className="text-sm text-gray-600">
                  Device type: {service.detectDeviceType()}
                  {service.getSubscriptionId() && (
                    <> • ID: {service.getSubscriptionId()?.slice(0, 8)}...</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          {showStats && stats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Notification Stats</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Subscriptions:</span>
                  <div className="font-medium">{stats.total}</div>
                </div>
                <div>
                  <span className="text-gray-600">Active Devices:</span>
                  <div className="font-medium">{stats.active}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
        <div className="flex items-start gap-2">
          <Shield className="w-3 h-3 mt-0.5" />
          <div>
            <strong>Privacy:</strong> We only send notifications about your repairs and important 
            updates. You can disable notifications at any time. Your notification preferences 
            are stored securely and never shared with third parties.
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PushNotificationSettings;