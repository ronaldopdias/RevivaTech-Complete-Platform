'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { 
  Shield, 
  User, 
  Settings, 
  LogOut, 
  Home, 
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Smartphone,
  Laptop,
  HardDrive,
  Star,
  Bell,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, signOut, error } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Mock data for real dashboard
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRepairs: 47,
      activeRepairs: 12,
      completedToday: 8,
      avgRepairTime: '2.3 days',
      customerSatisfaction: 4.8,
      revenue: 3420
    },
    recentRepairs: [
      { id: 'R001', device: 'iPhone 14 Pro', issue: 'Screen replacement', status: 'in-progress', customer: 'Sarah Johnson', priority: 'high', estimatedCompletion: '2 hours' },
      { id: 'R002', device: 'MacBook Pro 16"', issue: 'Keyboard repair', status: 'completed', customer: 'Mike Chen', priority: 'medium', estimatedCompletion: 'Completed' },
      { id: 'R003', device: 'Samsung Galaxy S23', issue: 'Water damage', status: 'diagnostic', customer: 'Emma Wilson', priority: 'urgent', estimatedCompletion: '1 day' },
      { id: 'R004', device: 'iPad Air', issue: 'Battery replacement', status: 'waiting-parts', customer: 'David Brown', priority: 'low', estimatedCompletion: '3 days' },
      { id: 'R005', device: 'Dell XPS 13', issue: 'Hard drive failure', status: 'in-progress', customer: 'Lisa Garcia', priority: 'high', estimatedCompletion: '4 hours' }
    ],
    notifications: [
      { id: 1, type: 'repair', message: 'iPhone 14 Pro repair completed', time: '5 min ago' },
      { id: 2, type: 'customer', message: 'New customer registered', time: '15 min ago' },
      { id: 3, type: 'inventory', message: 'iPhone screens running low', time: '1 hour ago' },
      { id: 4, type: 'review', message: 'New 5-star review received', time: '2 hours ago' }
    ]
  });

  const handleLogout = async () => {
    if (isSigningOut) return; // Prevent double-clicks
    
    setIsSigningOut(true);
    try {
      // Better Auth signOut returns void on success, no result object
      await signOut();
      console.log('Logout successful');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'diagnostic': return 'bg-yellow-100 text-yellow-800';
      case 'waiting-parts': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute 
      requiredRole={[UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]} 
      redirectTo="/login"
    >
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold" style={{ color: '#000000' }}>RevivaTech Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5" style={{ color: '#000000' }} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {dashboardData.notifications.length}
                </span>
              </button>
              <Link href="/" className="hover:text-blue-600" style={{ color: '#000000' }}>
                <Home className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex items-center gap-2 hover:text-blue-600 disabled:opacity-50"
                style={{ color: '#000000' }}
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? 'Signing out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>
                Welcome back, {user?.firstName || 'Customer'}!
              </h2>
              <p className="text-lg" style={{ color: '#333333' }}>
                Customer Dashboard - Track your repairs and bookings
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Book Repair
              </button>
              <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg hover:bg-gray-50">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Total Repairs</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.totalRepairs}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span style={{ color: '#16A34A' }}>+12% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Active Repairs</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.activeRepairs}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span style={{ color: '#2563EB' }}>Avg: {dashboardData.stats.avgRepairTime}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Completed Today</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.completedToday}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-600" />
              <span style={{ color: '#D97706' }}>{dashboardData.stats.customerSatisfaction}/5.0 rating</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Revenue Today</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>£{dashboardData.stats.revenue}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span style={{ color: '#16A34A' }}>+8% from yesterday</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Repairs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>Your Repairs</h3>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Search className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repair ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recentRepairs.map((repair) => (
                      <tr key={repair.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium" style={{ color: '#000000' }}>{repair.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {repair.device.includes('iPhone') && <Smartphone className="w-4 h-4 text-gray-400" />}
                            {repair.device.includes('MacBook') && <Laptop className="w-4 h-4 text-gray-400" />}
                            {repair.device.includes('Dell') && <Laptop className="w-4 h-4 text-gray-400" />}
                            {repair.device.includes('iPad') && <Smartphone className="w-4 h-4 text-gray-400" />}
                            {repair.device.includes('Samsung') && <Smartphone className="w-4 h-4 text-gray-400" />}
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#000000' }}>{repair.device}</p>
                              <p className="text-xs" style={{ color: '#666666' }}>{repair.issue}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm" style={{ color: '#000000' }}>{repair.customer}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(repair.status)}`}>
                            {repair.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(repair.priority)}`}>
                            {repair.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm" style={{ color: '#000000' }}>{repair.estimatedCompletion}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>Recent Activity</h3>
              </div>
              <div className="p-4 space-y-3">
                {dashboardData.notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#000000' }}>{notification.message}</p>
                      <p className="text-xs" style={{ color: '#666666' }}>{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/book-repair" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>Book New Repair</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>My Profile</span>
                </Link>
                <Link href="/my-repairs" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <HardDrive className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>My Repair History</span>
                </Link>
                <Link href="/support" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>Contact Support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}