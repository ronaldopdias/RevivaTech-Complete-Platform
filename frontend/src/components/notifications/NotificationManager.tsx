'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Smartphone,
  Mail,
  MessageSquare,
  Zap
} from 'lucide-react';

interface NotificationPreferences {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  types: {
    bookingUpdates: boolean;
    paymentConfirmations: boolean;
    repairStatusUpdates: boolean;
    promotionalOffers: boolean;
    securityAlerts: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

interface NotificationManagerProps {
  userId?: string;
  onPreferencesChanged?: (preferences: NotificationPreferences) => void;
  className?: string;
}

export function NotificationManager({ 
  userId, 
  onPreferencesChanged, 
  className = '' 
}: NotificationManagerProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    channels: {
      push: false,
      email: true,
      sms: false
    },
    types: {
      bookingUpdates: true,
      paymentConfirmations: true,
      repairStatusUpdates: true,
      promotionalOffers: false,
      securityAlerts: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: {
      maxPerHour: 5,
      maxPerDay: 20
    }
  });

  const [pushSupported, setPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'none' | 'subscribed' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPushSupport();
    loadPreferences();
  }, [userId]);

  const checkPushSupport = async () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    
    if (supported) {
      setPermissionStatus(Notification.permission);
      await checkSubscriptionStatus();
    }
  };

  const loadPreferences = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/notifications/preferences?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscriptionStatus(subscription ? 'subscribed' : 'none');
    } catch (error) {
      setSubscriptionStatus('error');
      console.error('Failed to check subscription status:', error);
    }
  };

  const requestPermission = async () => {
    if (!pushSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        await subscribeToPush();
      } else {
        setError('Push notification permission denied');
      }
    } catch (error) {
      setError('Failed to request notification permission');
      console.error('Permission request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          userId
        })
      });

      if (response.ok) {
        setSubscriptionStatus('subscribed');
        updatePreferences({ 
          ...preferences, 
          enabled: true, 
          channels: { ...preferences.channels, push: true } 
        });
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      setSubscriptionStatus('error');
      setError('Failed to subscribe to push notifications');
      console.error('Push subscription failed:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
      }

      setSubscriptionStatus('none');
      updatePreferences({ 
        ...preferences, 
        enabled: false, 
        channels: { ...preferences.channels, push: false } 
      });
    } catch (error) {
      setError('Failed to unsubscribe from push notifications');
      console.error('Push unsubscribe failed:', error);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    onPreferencesChanged?.(newPreferences);

    if (!userId) return;

    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          preferences: newPreferences
        })
      });
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  const sendTestNotification = async () => {
    if (subscriptionStatus !== 'subscribed') return;

    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      setError('Failed to send test notification');
      console.error('Test notification failed:', error);
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const notificationTypes = [
    {
      key: 'bookingUpdates' as const,
      name: 'Booking Updates',
      description: 'New bookings and appointment changes',
      icon: <Bell className="h-4 w-4" />
    },
    {
      key: 'paymentConfirmations' as const,
      name: 'Payment Confirmations',
      description: 'Payment receipts and billing updates',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      key: 'repairStatusUpdates' as const,
      name: 'Repair Status',
      description: 'Progress updates and completion notices',
      icon: <Settings className="h-4 w-4" />
    },
    {
      key: 'promotionalOffers' as const,
      name: 'Promotional Offers',
      description: 'Special deals and discounts',
      icon: <Zap className="h-4 w-4" />
    },
    {
      key: 'securityAlerts' as const,
      name: 'Security Alerts',
      description: 'Account security and login notifications',
      icon: <AlertCircle className="h-4 w-4" />
    }
  ];

  const channels = [
    {
      key: 'push' as const,
      name: 'Push Notifications',
      description: 'Browser notifications',
      icon: <Smartphone className="h-4 w-4" />,
      available: pushSupported
    },
    {
      key: 'email' as const,
      name: 'Email',
      description: 'Email notifications',
      icon: <Mail className="h-4 w-4" />,
      available: true
    },
    {
      key: 'sms' as const,
      name: 'SMS',
      description: 'Text message notifications',
      icon: <MessageSquare className="h-4 w-4" />,
      available: false // Can be enabled later
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Push Notification Setup */}
      {pushSupported && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get instant notifications about your repairs and bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Browser Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Status: {' '}
                  <Badge variant={
                    subscriptionStatus === 'subscribed' ? 'default' :
                    subscriptionStatus === 'error' ? 'destructive' : 'secondary'
                  }>
                    {subscriptionStatus === 'subscribed' ? 'Active' :
                     subscriptionStatus === 'error' ? 'Error' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                {subscriptionStatus === 'subscribed' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendTestNotification}
                    >
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={unsubscribeFromPush}
                    >
                      <BellOff className="h-4 w-4 mr-2" />
                      Disable
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={requestPermission}
                    disabled={isLoading || permissionStatus === 'denied'}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Enable Notifications
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {permissionStatus === 'denied' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Notifications are blocked. Please enable them in your browser settings.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.key}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                !channel.available ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {channel.icon}
                <div>
                  <div className="font-medium">{channel.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {channel.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.channels[channel.key]}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    ...preferences,
                    channels: { ...preferences.channels, [channel.key]: checked }
                  })
                }
                disabled={!channel.available}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Customize which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {type.icon}
                <div>
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {type.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.types[type.key]}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    ...preferences,
                    types: { ...preferences.types, [type.key]: checked }
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours">Enable quiet hours</Label>
            <Switch
              id="quiet-hours"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) =>
                updatePreferences({
                  ...preferences,
                  quietHours: { ...preferences.quietHours, enabled: checked }
                })
              }
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start time</Label>
                <input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) =>
                    updatePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, start: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End time</Label>
                <input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) =>
                    updatePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, end: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}