'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SMTPConfiguration from '@/components/admin/SMTPConfiguration';
import EmailConfiguration from '@/components/admin/EmailConfiguration';
import EmailAccountsManager from '@/components/admin/EmailAccountsManager';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import AnalyticsShortcuts from '@/components/admin/AnalyticsShortcuts';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettingsPage() {
  // FIXED: Removed double ProtectedRoute - admin layout already handles protection
  return (
    <AdminLayout title="System Settings">
        <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure system settings and preferences</p>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="accounts">Email Accounts</TabsTrigger>
            <TabsTrigger value="email">Email Settings</TabsTrigger>
            <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounts" className="mt-6">
            <EmailAccountsManager />
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Email Configuration</h3>
              <EmailConfiguration />
            </Card>
          </TabsContent>
          
          <TabsContent value="smtp" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">SMTP Settings</h3>
              <SMTPConfiguration />
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Health Monitoring</h3>
              <SystemHealthDashboard />
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsShortcuts 
              variant="grid"
              showQuickStats={true}
              showActions={true}
              showAlerts={true}
              className=""
            />
          </TabsContent>
          
          <TabsContent value="general" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="RevivaTech Computer Repair"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="123 High Street, London, SW1A 1AA, United Kingdom"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="+44 20 7123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="hello@revivatech.co.uk"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Business Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Monday - Friday</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue="9:00 AM - 6:00 PM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Saturday</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue="10:00 AM - 4:00 PM"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Pricing Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Diagnostic Fee</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Express Service Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue="1.5"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </AdminLayout>
  );
}