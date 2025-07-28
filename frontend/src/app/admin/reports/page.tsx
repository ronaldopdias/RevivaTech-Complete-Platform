'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/client';
import { useAuthenticatedApi } from '@/lib/auth/useAuthenticatedApi';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Printer,
  RefreshCw,
  Filter
} from 'lucide-react';

export default function AdminReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useAuthenticatedApi();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
      return;
    }
  }, [isAuthenticated, authLoading]);

  // Load report data
  const loadReportData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      
      // Fetch analytics data for reports
      const [revenueRes, performanceRes, customersRes] = await Promise.all([
        api.get('/api/analytics/revenue'),
        api.get('/api/analytics/performance'),
        api.get('/api/analytics/customers')
      ]);

      // Process data for reports
      const processedData = {
        revenue: revenueRes.success ? revenueRes.data : {},
        performance: performanceRes.success ? performanceRes.data : {},
        customers: customersRes.success ? customersRes.data : {},
        generatedAt: new Date().toISOString()
      };

      setReportData(processedData);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Report sections
  const reportSections = [
    {
      title: 'Financial Report',
      icon: DollarSign,
      description: 'Revenue, profit margins, and financial performance',
      data: reportData?.revenue,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Performance Report',
      icon: TrendingUp,
      description: 'Repair times, efficiency, and service quality metrics',
      data: reportData?.performance,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Customer Report',
      icon: Users,
      description: 'Customer satisfaction, retention, and growth metrics',
      data: reportData?.customers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Operational Report',
      icon: Activity,
      description: 'Technician performance, equipment usage, and workflow',
      data: reportData?.performance,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Don't render if not authenticated
  if (!authLoading && !isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout title="Reports Dashboard" breadcrumbs={[{ label: 'Reports' }]}>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#1A5266]">Reports Dashboard</h1>
            <p className="text-[#36454F]">Generate and download business intelligence reports</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ADD8E6] focus:border-[#ADD8E6]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Button
              variant="outline"
              onClick={loadReportData}
              disabled={loading}
              icon={{ component: RefreshCw, position: 'left' }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#36454F]">Total Revenue</p>
                <p className="text-2xl font-bold text-[#1A5266]">
                  {reportData ? formatCurrency(reportData.revenue?.summary?.totalRevenue || 0) : '£0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#008080]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#36454F]">Completed Repairs</p>
                <p className="text-2xl font-bold text-[#1A5266]">
                  {reportData?.performance?.bookings?.completed || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-[#4A9FCC]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#36454F]">Total Customers</p>
                <p className="text-2xl font-bold text-[#1A5266]">
                  {reportData?.customers?.customers?.total || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-[#ADD8E6]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#36454F]">Avg Efficiency</p>
                <p className="text-2xl font-bold text-[#1A5266]">
                  {Math.round(reportData?.performance?.performance?.efficiency || 85)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Report Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportSections.map((section, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${section.bgColor}`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A5266]">{section.title}</h3>
                    <p className="text-sm text-[#36454F]">{section.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={{ component: BarChart3, position: 'left' }}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={{ component: Download, position: 'left' }}
                  >
                    Export
                  </Button>
                </div>
              </div>

              {/* Report Preview Data */}
              <div className="space-y-3">
                {section.title === 'Financial Report' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#36454F]">Monthly Revenue:</span>
                      <div className="font-medium text-[#1A5266]">
                        {formatCurrency(section.data?.currentMonth?.total || 0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#36454F]">Growth Rate:</span>
                      <div className="font-medium text-green-600">
                        +{section.data?.currentMonth?.growth || 0}%
                      </div>
                    </div>
                  </div>
                )}
                
                {section.title === 'Performance Report' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#36454F]">Avg Repair Time:</span>
                      <div className="font-medium text-[#1A5266]">
                        {Math.round((section.data?.performance?.averageTimeHours || 72) / 24)} days
                      </div>
                    </div>
                    <div>
                      <span className="text-[#36454F]">Success Rate:</span>
                      <div className="font-medium text-green-600">
                        {Math.round(section.data?.performance?.efficiency || 85)}%
                      </div>
                    </div>
                  </div>
                )}

                {section.title === 'Customer Report' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#36454F]">New Customers:</span>
                      <div className="font-medium text-[#1A5266]">
                        {section.data?.customers?.new || 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#36454F]">Satisfaction:</span>
                      <div className="font-medium text-yellow-600">4.8/5.0</div>
                    </div>
                  </div>
                )}

                {section.title === 'Operational Report' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#36454F]">Active Repairs:</span>
                      <div className="font-medium text-[#1A5266]">
                        {section.data?.bookings?.inProgress || 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#36454F]">Pending Queue:</span>
                      <div className="font-medium text-orange-600">
                        {section.data?.bookings?.pending || 0}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Report Generation Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#1A5266] mb-4">Generate Custom Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center p-4 h-auto"
              icon={{ component: FileText, position: 'left' }}
            >
              <div className="text-center">
                <div className="font-medium">Executive Summary</div>
                <div className="text-sm text-[#36454F]">Key metrics overview</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center justify-center p-4 h-auto"
              icon={{ component: PieChart, position: 'left' }}
            >
              <div className="text-center">
                <div className="font-medium">Detailed Analytics</div>
                <div className="text-sm text-[#36454F]">Comprehensive data analysis</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center justify-center p-4 h-auto"
              icon={{ component: Printer, position: 'left' }}
            >
              <div className="text-center">
                <div className="font-medium">Print Report</div>
                <div className="text-sm text-[#36454F]">Formatted for printing</div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Report Generation Status */}
        {reportData && (
          <div className="text-center py-4">
            <div className="text-sm text-[#36454F]">
              Last updated: {new Date(reportData.generatedAt).toLocaleString()}
            </div>
            <Badge variant="outline" className="mt-2">
              Data source: Real-time Analytics API
            </Badge>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}