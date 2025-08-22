'use client';

/**
 * Real-Time Customer Dashboard
 * 
 * Features:
 * - Live booking status updates
 * - Real-time repair tracking
 * - Connected to actual APIs
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar,
  Wrench,
  CheckCircle,
  CreditCard,
  Star,
  Plus,
  Search,
  BarChart3
} from 'lucide-react';

interface CustomerBooking {
  id: string;
  deviceModel: string;
  deviceBrand: string;
  repairType: string;
  status: string;
  problemDescription: string;
  basePrice?: number;
  finalPrice?: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalBookings: number;
  activeRepairs: number;
  completedRepairs: number;
  totalSpent: number;
  averageRating: number;
  lastBookingDate?: string;
}

export default function RealTimeCustomerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer dashboard data from real API
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard statistics
        const statsResponse = await fetch('/api/customers/dashboard-stats', {
          credentials: 'include' // Include cookies for auth
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardData({
            totalBookings: statsData.data.totalBookings || 0,
            activeRepairs: statsData.data.activeBookings || 0,
            completedRepairs: statsData.data.completedBookings || 0,
            totalSpent: statsData.data.totalSpent || 0,
            averageRating: statsData.data.averageRating || 0,
            lastBookingDate: statsData.data.lastBookingDate
          });
        }

        // Fetch customer bookings
        const bookingsResponse = await fetch('/api/customers/my-bookings', {
          credentials: 'include'
        });
        
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData.data || []);
        }

        // Fetch recent activity
        const activityResponse = await fetch('/api/customers/recent-activity', {
          credentials: 'include'
        });
        
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.data || []);
        }

        setIsConnected(true);
        setError(null);
        
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
        setError('Failed to load dashboard data');
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately and set up periodic refresh
    fetchCustomerData();
    const interval = setInterval(fetchCustomerData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with connection status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your repair activity overview</p>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total Bookings"
          value={dashboardData?.totalBookings || 0}
          icon={<Calendar className="w-5 h-5" />}
          trend="+2 this month"
        />
        <StatsCard
          title="Active Repairs"
          value={dashboardData?.activeRepairs || 0}
          icon={<Wrench className="w-5 h-5" />}
          trend="In progress"
        />
        <StatsCard
          title="Completed"
          value={dashboardData?.completedRepairs || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          trend="All time"
        />
        <StatsCard
          title="Total Spent"
          value={`£${dashboardData?.totalSpent?.toFixed(2) || '0.00'}`}
          icon={<CreditCard className="w-5 h-5" />}
          trend="This year"
        />
        <StatsCard
          title="Avg Rating"
          value={`${dashboardData?.averageRating?.toFixed(1) || '0.0'}/5`}
          icon={<Star className="w-5 h-5" />}
          trend="Based on reviews"
        />
      </div>

      {/* My Bookings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Recent Bookings</h3>
            <Badge variant="outline">{bookings.length} total</Badge>
          </div>
          
          <div className="space-y-4">
            {bookings.length > 0 ? (
              bookings.slice(0, 3).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No bookings yet</p>
                <p className="text-sm text-gray-400">Start by booking a repair service</p>
              </div>
            )}
          </div>
          
          {bookings.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Bookings ({bookings.length})
              </Button>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <RecentActivity activities={recentActivity} />
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Book New Repair</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Track Repair</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>View History</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Helper Components
function StatsCard({ title, value, icon, trend }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend: string; 
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{trend}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </Card>
  );
}

function BookingCard({ booking }: { booking: CustomerBooking }) {
  const statusConfig = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
    IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
    READY_FOR_PICKUP: { color: 'bg-green-100 text-green-800', label: 'Ready for Pickup' },
    COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
    CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
  };

  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">
            {booking.deviceBrand} {booking.deviceModel}
          </p>
          <p className="text-sm text-gray-600">{booking.repairType}</p>
        </div>
        <Badge className={status.color}>
          {status.label}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">
        {booking.problemDescription}
      </p>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          Created: {new Date(booking.createdAt).toLocaleDateString()}
        </span>
        <span className="font-medium">
          £{booking.finalPrice?.toFixed(2) || booking.basePrice?.toFixed(2) || '0.00'}
        </span>
      </div>
    </div>
  );
}

function RecentActivity({ activities }: { activities: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}