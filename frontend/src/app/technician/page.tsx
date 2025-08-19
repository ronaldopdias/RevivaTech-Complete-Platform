'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { 
  Wrench, 
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
  RefreshCw,
  Tool
} from 'lucide-react';
import Link from 'next/link';

export default function TechnicianDashboardPage() {
  const { user, isAuthenticated, isLoading, signOut, error } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Mock data for technician dashboard
  const [dashboardData, setDashboardData] = useState({
    stats: {
      assignedRepairs: 8,
      completedToday: 3,
      inProgress: 5,
      avgCompletionTime: '1.8 hours',
      customerRating: 4.9,
      totalCompleted: 127
    },
    assignedRepairs: [
      { id: 'R001', device: 'iPhone 14 Pro', issue: 'Screen replacement', status: 'in-progress', customer: 'Sarah Johnson', priority: 'high', estimatedCompletion: '2 hours', assignedTime: '09:30 AM' },
      { id: 'R003', device: 'Samsung Galaxy S23', issue: 'Water damage', status: 'diagnostic', customer: 'Emma Wilson', priority: 'urgent', estimatedCompletion: '1 day', assignedTime: '10:15 AM' },
      { id: 'R005', device: 'Dell XPS 13', issue: 'Hard drive failure', status: 'parts-ordered', customer: 'Lisa Garcia', priority: 'medium', estimatedCompletion: '3 days', assignedTime: '11:00 AM' },
      { id: 'R007', device: 'MacBook Air M2', issue: 'Keyboard repair', status: 'waiting-approval', customer: 'John Smith', priority: 'low', estimatedCompletion: '2 days', assignedTime: '2:30 PM' },
      { id: 'R009', device: 'iPad Pro', issue: 'Battery replacement', status: 'ready-to-start', customer: 'Maria Rodriguez', priority: 'medium', estimatedCompletion: '4 hours', assignedTime: '3:15 PM' }
    ],
    recentActivity: [
      { id: 1, type: 'completion', message: 'MacBook Pro repair completed for Mike Chen', time: '5 min ago', icon: '✅' },
      { id: 2, type: 'assignment', message: 'New repair assigned: iPhone 14 Pro screen', time: '15 min ago', icon: '📱' },
      { id: 3, type: 'update', message: 'Customer approved Dell XPS repair quote', time: '25 min ago', icon: '💰' },
      { id: 4, type: 'completion', message: 'Samsung Galaxy water damage assessment completed', time: '45 min ago', icon: '🔍' }
    ]
  });

  const handleLogout = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      console.log('[Technician] Starting logout process...');
      await signOut();
      console.log('[Technician] Logout successful, redirecting to home');
      
      // Small delay to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/');
    } catch (error) {
      console.error('[Technician] Logout error:', error);
      
      // Force redirect even on error to prevent stuck state
      router.push('/');
    } finally {
      setIsSigningOut(false);
    }
  };
  
  // Enhanced error boundary for dashboard data
  const [dashboardError, setDashboardError] = useState(null);
  
  // Error recovery function
  const handleDashboardError = (error) => {
    console.error('[Technician] Dashboard error:', error);
    setDashboardError(error.message || 'An unexpected error occurred');
  };
  
  // Enhanced loading state handling
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading technician dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Enhanced error state handling
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error.message || 'Unable to authenticate. Please try logging in again.'}</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Dashboard error state
  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{dashboardError}</p>
          <div className="space-x-4">
            <button 
              onClick={() => {
                setDashboardError(null);
                window.location.reload();
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'diagnostic': return 'bg-yellow-100 text-yellow-800';
      case 'parts-ordered': return 'bg-orange-100 text-orange-800';
      case 'waiting-approval': return 'bg-purple-100 text-purple-800';
      case 'ready-to-start': return 'bg-green-100 text-green-800';
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
      requiredRole={[UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN]} 
      redirectTo="/login"
      onError={handleDashboardError}
    >
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Tool className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold" style={{ color: '#000000' }}>Technician Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5" style={{ color: '#000000' }} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {dashboardData.recentActivity.length}
                </span>
              </button>
              <Link href="/" className="hover:text-green-600" style={{ color: '#000000' }}>
                <Home className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex items-center gap-2 hover:text-green-600 disabled:opacity-50"
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
                Welcome back, {user?.firstName || 'Technician'}!
              </h2>
              <p className="text-lg" style={{ color: '#333333' }}>
                Technician Workspace - Manage your assigned repairs and track progress
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4" />
                Add Update
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Assigned Repairs</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.assignedRepairs}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Activity className="w-4 h-4 text-blue-600" />
              <span style={{ color: '#2563EB' }}>Active workload</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Completed Today</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.completedToday}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span style={{ color: '#16A34A' }}>Great progress!</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Avg Completion</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.avgCompletionTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-orange-600" />
              <span style={{ color: '#D97706' }}>Efficient timing</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#666666' }}>Customer Rating</h3>
                <p className="text-2xl font-bold" style={{ color: '#000000' }}>{dashboardData.stats.customerRating}/5.0</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-purple-600" />
              <span style={{ color: '#7C3AED' }}>Excellent service</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Repairs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>Your Assigned Repairs</h3>
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
                    {dashboardData.assignedRepairs.map((repair) => {
                      try {
                        return (
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
                            <button className="p-1 hover:bg-gray-100 rounded text-blue-600" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-green-600" title="Update Status">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-600" title="More Actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                          </tr>
                        );
                      } catch (error) {
                        console.error('[Technician] Error rendering repair row:', error, repair);
                        return (
                          <tr key={repair.id || Math.random()} className="hover:bg-gray-50">
                            <td colSpan={7} className="px-6 py-4 text-center text-red-600">
                              Error loading repair data
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>Recent Activity</h3>
              </div>
              <div className="p-4 space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="text-lg">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#000000' }}>{activity.message}</p>
                      <p className="text-xs" style={{ color: '#666666' }}>{activity.time}</p>
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
                <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-left">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>Mark Repair Complete</span>
                </button>
                <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-left">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>Update Time Estimate</span>
                </button>
                <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-left">
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>Contact Customer</span>
                </button>
                <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-left">
                  <Upload className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>Upload Progress Photos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}