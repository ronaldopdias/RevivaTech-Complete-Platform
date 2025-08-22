/**
 * Customer Analytics Page
 * Phase 7.3 - Customer-facing analytics portal
 */

import React from 'react';
import { Metadata } from 'next';
import CustomerAnalyticsDashboard from '@/components/customer/CustomerAnalyticsDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export const metadata: Metadata = {
  title: 'Your Service Analytics | RevivaTech Customer Portal',
  description: 'View your repair history, service quality metrics, and environmental impact with RevivaTech',
};

export default function CustomerAnalyticsPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <CustomerAnalyticsDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}