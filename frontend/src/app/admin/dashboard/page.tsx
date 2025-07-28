'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  BarChart3, 
  Settings, 
  Calendar,
  Package,
  MessageCircle,
  Bell,
  Search,
  CreditCard
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import RepairQueueManager from '@/components/admin/RepairQueueManager';
import BusinessAnalytics from '@/components/admin/BusinessAnalytics';
import dynamic from 'next/dynamic';

// Dynamically import the management pages to avoid SSR issues
const CustomerManagementPage = dynamic(() => import('../customers/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

const InventoryManagementPage = dynamic(() => import('../inventory/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

const ScheduleManagementPage = dynamic(() => import('../schedule/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

const MessagesPage = dynamic(() => import('../messages/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

const SettingsPage = dynamic(() => import('../settings/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

const PaymentsPage = dynamic(() => import('../payments/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

const adminSections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'queue', label: 'Repair Queue', icon: Wrench },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications] = useState(3);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'queue':
        return <RepairQueueManager />;
      case 'analytics':
        return <BusinessAnalytics />;
      case 'customers':
        return <CustomerManagementPage />;
      case 'schedule':
        return <ScheduleManagementPage />;
      case 'inventory':
        return <InventoryManagementPage />;
      case 'messages':
        return <MessagesPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome to RevivaTech Admin</h1>
              <p className="text-blue-100">Manage your repair business with comprehensive tools and insights</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">£1,240</p>
                    <p className="text-sm text-green-600">+18% vs yesterday</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Repairs</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-sm text-blue-600">+3 new today</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                    <p className="text-sm text-purple-600">+12 this week</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">4.8/5</p>
                    <p className="text-sm text-yellow-600">98% positive</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setActiveSection('queue')}
                  className="flex items-center justify-center p-4 h-auto bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  variant="outline"
                >
                  <div className="text-center">
                    <Wrench className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Repair Queue</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveSection('analytics')}
                  className="flex items-center justify-center p-4 h-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  variant="outline"
                >
                  <div className="text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Analytics</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveSection('customers')}
                  className="flex items-center justify-center p-4 h-auto bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                  variant="outline"
                >
                  <div className="text-center">
                    <Users className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Customers</span>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setActiveSection('schedule')}
                  className="flex items-center justify-center p-4 h-auto bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                  variant="outline"
                >
                  <div className="text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Schedule</span>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Repairs</h3>
                <div className="space-y-3">
                  {[
                    { id: 'REP_001', customer: 'John Smith', device: 'iPhone 14 Pro', status: 'completed' },
                    { id: 'REP_002', customer: 'Sarah Wilson', device: 'MacBook Air', status: 'in_progress' },
                    { id: 'REP_003', customer: 'Mike Johnson', device: 'Samsung S23', status: 'pending' }
                  ].map((repair) => (
                    <div key={repair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{repair.customer}</p>
                        <p className="text-xs text-gray-600">{repair.device} • {repair.id}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        repair.status === 'completed' ? 'bg-green-100 text-green-800' :
                        repair.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {repair.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Status</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Queue Processing</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      24 active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notifications</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      3 pending
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">RevivaTech Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4" />
                  {notifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* User Menu */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 space-y-2">
            {adminSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
}