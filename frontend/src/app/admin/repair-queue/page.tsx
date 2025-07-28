'use client';

import React from 'react';
import RepairQueue from '@/components/admin/RepairQueue';
import AnalyticsWidget from '@/components/admin/AnalyticsWidget';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export default function AdminRepairQueuePage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Repair Queue</h1>
          <p className="text-gray-600">Manage and track all active repairs</p>
        </div>
        
        {/* Queue Analytics */}
        <div className="mb-8">
          <AnalyticsWidget 
            variant="minimal"
            categories={['repairs', 'performance']}
            maxItems={4}
            showRefresh={true}
            showViewAll={false}
            className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
          />
        </div>
        
        <RepairQueue />
      </div>
    </ProtectedRoute>
  );
}