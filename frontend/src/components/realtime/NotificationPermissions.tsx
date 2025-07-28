'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const getStatusColor = () => {
    switch (permission) {
      case 'granted': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Notification Permissions</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span>Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${getStatusColor()}`}>
            {permission}
          </span>
        </div>

        {permission === 'default' && (
          <div>
            <p className="text-muted-foreground mb-3">
              Enable notifications to receive real-time updates about your repairs.
            </p>
            <Button onClick={requestPermission}>
              Enable Notifications
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <p className="text-muted-foreground">
            Notifications are disabled. You can enable them in your browser settings.
          </p>
        )}

        {permission === 'granted' && (
          <p className="text-muted-foreground text-green-700">
            ✅ Notifications are enabled! You'll receive updates about your repairs.
          </p>
        )}
      </div>
    </Card>
  );
}