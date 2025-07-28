'use client';

import React from 'react';
import NotificationCenter from '@/components/customer/NotificationCenter';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export default function NotificationsPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your repair status and important messages</p>
        </div>
        
        <NotificationCenter />
      </div>
    </ProtectedRoute>
  );
}