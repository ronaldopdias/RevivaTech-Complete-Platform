/**
 * Customer Analytics Dashboard
 * Phase 7.3 - Customer-facing analytics for transparency and trust
 * 
 * Features:
 * - Repair history analytics
 * - Service quality metrics
 * - Transparent pricing insights
 * - Performance guarantees tracking
 * - Trust-building visualizations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { 
  Star,
  Clock,
  CheckCircle,
  TrendingUp,
  Shield,
  Award,
  BarChart3,
  Calendar,
  DollarSign,
  Wrench
} from 'lucide-react';

interface CustomerMetrics {
  totalRepairs: number;
  successRate: number;
  avgRepairTime: number;
  totalSaved: number;
  satisfactionScore: number;
  onTimeDelivery: number;
  warrantyActive: boolean;
  nextService?: Date;
}

interface RepairHistory {
  id: string;
  device: string;
  service: string;
  date: Date;
  status: 'completed' | 'in_progress' | 'pending';
  cost: number;
  rating?: number;
  onTime: boolean;
}

interface CustomerAnalyticsDashboardProps {
  customerId?: string;
  className?: string;
}

export const CustomerAnalyticsDashboard: React.FC<CustomerAnalyticsDashboardProps> = ({
  customerId,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerAnalytics();
  }, [customerId]);

  const loadCustomerAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - in production, fetch from API
      const mockMetrics: CustomerMetrics = {
        totalRepairs: 8,
        successRate: 100,
        avgRepairTime: 18.5,
        totalSaved: 2450,
        satisfactionScore: 4.8,
        onTimeDelivery: 95,
        warrantyActive: true,
        nextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      };

      const mockHistory: RepairHistory[] = [
        {
          id: 'REP-001',
          device: 'iPhone 15 Pro',
          service: 'Screen Replacement',
          date: new Date('2024-11-15'),
          status: 'completed',
          cost: 280,
          rating: 5,
          onTime: true
        },
        {
          id: 'REP-002',
          device: 'MacBook Air M2',
          service: 'Battery Replacement',
          date: new Date('2024-10-22'),
          status: 'completed',
          cost: 220,
          rating: 5,
          onTime: true
        },
        {
          id: 'REP-003',
          device: 'iPad Pro',
          service: 'Camera Repair',
          date: new Date('2024-09-08'),
          status: 'completed',
          cost: 150,
          rating: 4,
          onTime: false
        }
      ];

      setMetrics(mockMetrics);
      setRepairHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load customer analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 animate-pulse text-[#ADD8E6]" />
          <span>Loading your analytics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#ADD8E6]" />
          Your Service Analytics
        </h2>
        <p className="text-gray-600 mt-1">
          Transparent insights into your repair history and service quality
        </p>
      </div>

      {/* Trust Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#ADD8E6]/20 bg-gradient-to-br from-[#ADD8E6]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
            <Shield className="h-4 w-4 text-[#008080]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A5266]">
              {metrics.successRate}%
            </div>
            <p className="text-xs text-[#008080] mt-1">
              All repairs completed successfully
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#008080]/20 bg-gradient-to-br from-[#008080]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Repair Time
            </CardTitle>
            <Clock className="h-4 w-4 text-[#ADD8E6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A5266]">
              {metrics.avgRepairTime}h
            </div>
            <p className="text-xs text-[#4A9FCC] mt-1">
              20% faster than industry average
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#4A9FCC]/20 bg-gradient-to-br from-[#4A9FCC]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Saved
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#008080]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A5266]">
              £{metrics.totalSaved.toLocaleString()}
            </div>
            <p className="text-xs text-[#008080] mt-1">
              vs buying new devices
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#ADD8E6]/20 bg-gradient-to-br from-[#ADD8E6]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Satisfaction
            </CardTitle>
            <Star className="h-4 w-4 text-[#4A9FCC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A5266] flex items-center gap-1">
              {metrics.satisfactionScore}
              <Star className="h-4 w-4 fill-[#4A9FCC] text-[#4A9FCC]" />
            </div>
            <p className="text-xs text-[#4A9FCC] mt-1">
              Based on your reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Quality & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Guarantees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#008080]" />
              Performance Guarantees
            </CardTitle>
            <CardDescription>
              Our commitments to you and how we're performing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>On-Time Delivery</span>
                <span className="font-semibold">{metrics.onTimeDelivery}%</span>
              </div>
              <Progress 
                value={metrics.onTimeDelivery} 
                className="h-2"
                style={{
                  background: '#E5E7EB'
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Target: 95% • Your experience: {metrics.onTimeDelivery}%
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Quality Guarantee</span>
                <span className="font-semibold">{metrics.successRate}%</span>
              </div>
              <Progress 
                value={metrics.successRate} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Target: 99% • Your experience: {metrics.successRate}%
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#008080]/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#008080]" />
                <span className="text-sm font-medium">Warranty Status</span>
              </div>
              <Badge 
                variant={metrics.warrantyActive ? "default" : "secondary"}
                className={metrics.warrantyActive ? "bg-[#008080] hover:bg-[#008080]/90" : ""}
              >
                {metrics.warrantyActive ? 'Active' : 'Expired'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Repair History Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4A9FCC]" />
              Repair History
            </CardTitle>
            <CardDescription>
              Your device maintenance timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repairHistory.slice(0, 3).map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      repair.status === 'completed' ? 'bg-[#008080]' : 
                      repair.status === 'in_progress' ? 'bg-[#4A9FCC]' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {repair.device}
                      </p>
                      <p className="text-xs text-gray-500">
                        {repair.service} • {repair.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      £{repair.cost}
                    </p>
                    <div className="flex items-center gap-1">
                      {repair.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: repair.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#4A9FCC] text-[#4A9FCC]" />
                          ))}
                        </div>
                      )}
                      {repair.onTime ? (
                        <CheckCircle className="h-3 w-3 text-[#008080]" />
                      ) : (
                        <Clock className="h-3 w-3 text-[#4A9FCC]" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {repairHistory.length > 3 && (
              <Button variant="outline" className="w-full mt-4">
                View All Repairs ({repairHistory.length})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact & Recommendations */}
      <Card className="border-[#008080]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#008080]" />
            Environmental Impact & Recommendations
          </CardTitle>
          <CardDescription>
            Your contribution to sustainability through device repair
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#008080]/5 rounded-lg">
              <h4 className="text-lg font-semibold text-[#1A5266] mb-2">
                CO₂ Saved
              </h4>
              <p className="text-2xl font-bold text-[#008080]">124 kg</p>
              <p className="text-xs text-gray-600 mt-1">
                vs manufacturing new devices
              </p>
            </div>
            
            <div className="text-center p-4 bg-[#4A9FCC]/5 rounded-lg">
              <h4 className="text-lg font-semibold text-[#1A5266] mb-2">
                E-Waste Prevented
              </h4>
              <p className="text-2xl font-bold text-[#4A9FCC]">2.8 kg</p>
              <p className="text-xs text-gray-600 mt-1">
                electronic waste diverted
              </p>
            </div>
            
            <div className="text-center p-4 bg-[#ADD8E6]/5 rounded-lg">
              <h4 className="text-lg font-semibold text-[#1A5266] mb-2">
                Next Service
              </h4>
              <p className="text-sm font-semibold text-[#1A5266]">
                {metrics.nextService?.toLocaleDateString() || 'Not scheduled'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                preventive maintenance
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gradient-to-r from-[#ADD8E6]/10 to-[#008080]/10 rounded-lg">
            <h5 className="font-semibold text-[#1A5266] mb-2">💡 Personalized Recommendation</h5>
            <p className="text-sm text-gray-700">
              Based on your usage patterns, we recommend scheduling a preventive check-up for your MacBook Air M2 
              in the next 60 days to maintain optimal performance and extend its lifespan.
            </p>
            <Button size="sm" className="mt-2 bg-[#008080] hover:bg-[#008080]/90">
              Schedule Check-up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAnalyticsDashboard;