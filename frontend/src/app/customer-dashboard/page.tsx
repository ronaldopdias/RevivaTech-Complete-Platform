'use client';

/**
 * Real-Time Customer Dashboard Page
 * 
 * Showcases the new customer dashboard with live updates
 */

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import RealTimeCustomerDashboard from '@/components/customer/RealTimeCustomerDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute 
      requiredRole={[UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]} 
      redirectTo="/login"
    >
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <RealTimeCustomerDashboard />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}