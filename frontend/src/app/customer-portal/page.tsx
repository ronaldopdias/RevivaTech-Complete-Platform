'use client';

/**
 * Customer Portal Page
 * 
 * Comprehensive customer experience with:
 * - Enhanced authentication integration
 * - Real-time repair tracking
 * - Advanced customer dashboard
 * - WebSocket-powered live updates
 * - Communication center
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import MainLayout from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import AdvancedCustomerDashboard from '@/components/customer/AdvancedCustomerDashboard';
import UnifiedCustomerDashboard from '@/components/customer/UnifiedCustomerDashboard';
import FeatureDiscoverySystem from '@/components/features/FeatureDiscoverySystem';
import CustomerAnalyticsWidgets from '@/components/customer/CustomerAnalyticsWidgets';
import { PageAnalyticsWrapper } from '@/components/analytics/PageAnalyticsWrapper';
import ChatwootWidget from '@/components/chat/ChatwootWidget';

interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function CustomerPortalTabs({ activeTab, onTabChange }: TabProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'repairs', label: 'My Repairs', icon: '🔧' },
    { id: 'bookings', label: 'Book Repair', icon: '📅' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function QuickBookingSection() {
  const [deviceType, setDeviceType] = useState('');
  const [issueType, setIssueType] = useState('');

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Booking</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device Type
          </label>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select device type</option>
            <option value="macbook">MacBook</option>
            <option value="iphone">iPhone</option>
            <option value="ipad">iPad</option>
            <option value="android">Android Phone</option>
            <option value="laptop">Windows Laptop</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Type
          </label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select issue type</option>
            <option value="screen">Screen Repair</option>
            <option value="battery">Battery Replacement</option>
            <option value="water">Water Damage</option>
            <option value="data">Data Recovery</option>
            <option value="software">Software Issues</option>
          </select>
        </div>
        <Button className="w-full" disabled={!deviceType || !issueType}>
          Get Instant Quote
        </Button>
      </div>
    </Card>
  );
}

function MessagesSection() {
  const [newMessage, setNewMessage] = useState('');
  const [messages] = useState([
    {
      id: 1,
      from: 'technician',
      name: 'Sarah Johnson',
      message: 'Your MacBook repair is complete! Ready for pickup.',
      timestamp: '2025-07-13T14:30:00Z',
      read: false,
    },
    {
      id: 2,
      from: 'system',
      name: 'System',
      message: 'Your repair status has been updated to "Completed"',
      timestamp: '2025-07-13T14:25:00Z',
      read: true,
    },
    {
      id: 3,
      from: 'technician',
      name: 'Mike Chen',
      message: 'iPhone battery has arrived, starting replacement now.',
      timestamp: '2025-07-13T10:15:00Z',
      read: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border ${
                !message.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{message.name}</span>
                  <Badge variant={message.from === 'technician' ? 'info' : 'secondary'}>
                    {message.from}
                  </Badge>
                  {!message.read && (
                    <Badge variant="warning" size="sm">
                      New
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{message.message}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Send Message</h3>
        <div className="flex space-x-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ProfileSection() {
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+44 7700 900123',
    address: '123 High Street, London, SW1A 1AA',
    notifications: {
      email: true,
      sms: true,
      push: false,
    },
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <Input
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <Input
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <Input
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <Input
              value={profileData.address}
              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-6">
          <Button>Update Profile</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email notifications</span>
            <input
              type="checkbox"
              checked={profileData.notifications.email}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                notifications: { ...prev.notifications, email: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>SMS notifications</span>
            <input
              type="checkbox"
              checked={profileData.notifications.sms}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                notifications: { ...prev.notifications, sms: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Push notifications</span>
            <input
              type="checkbox"
              checked={profileData.notifications.push}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                notifications: { ...prev.notifications, push: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button>Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
}

export default function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <UnifiedCustomerDashboard />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CustomerAnalyticsWidgets />
              </div>
              <div>
                <FeatureDiscoverySystem
                  userRole="customer"
                  displayMode="sidebar"
                  showTutorials={true}
                />
              </div>
            </div>
          </div>
        );
      case 'repairs':
        return <AdvancedCustomerDashboard />;
      case 'bookings':
        return <QuickBookingSection />;
      case 'messages':
        return <MessagesSection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <AdvancedCustomerDashboard />;
    }
  };

  return (
    <ProtectedRoute 
      requiredRole={[UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]} 
      redirectTo="/login"
    >
      <PageAnalyticsWrapper
        pageId="customer-portal"
        pageName="Customer Portal"
        pageType="customer"
        customDimensions={{
          pageCategory: 'customer',
          userRole: 'customer',
          portalType: 'main'
        }}
      >
      <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Portal</h1>
          <p className="text-gray-600">
            Manage your repairs, track progress, and communicate with our technicians in real-time.
          </p>
        </div>

        {/* Connection Status Banner */}
        <Card className="p-4 mb-6 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">
              Live Updates Active - You'll receive real-time notifications
            </span>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <CustomerPortalTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="min-h-96">
          {renderTabContent()}
        </div>

        {/* Footer Actions */}
        <Card className="p-6 mt-8 bg-blue-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is available 24/7 to assist you with any questions.
            </p>
            <div className="flex justify-center space-x-4">
              <Button>Live Chat</Button>
              <Button variant="outline">Call Support</Button>
              <Button variant="outline">Email Support</Button>
            </div>
          </div>
        </Card>

        {/* Chat Widget */}
        <ChatwootWidget
          customerId="customer-123"
          customerInfo={{
            name: "John Smith",
            email: "john.smith@example.com",
            repairId: "repair-001"
          }}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      </div>
      </MainLayout>
    </PageAnalyticsWrapper>
    </ProtectedRoute>
  );
}