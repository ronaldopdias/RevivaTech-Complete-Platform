'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Users,
  Clock,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  User,
  UserCheck,
  BookOpen,
  PlayCircle,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MousePointer,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface TrainingMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'poor';
  description: string;
}

interface UserJourneyMetrics {
  totalUsers: number;
  completionRates: {
    overall: number;
    byRole: Record<string, number>;
    byExperience: Record<string, number>;
  };
  dropOffPoints: Array<{
    step: string;
    dropOffRate: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  timeToComplete: {
    average: number;
    median: number;
    byRole: Record<string, number>;
  };
  userSatisfaction: {
    score: number;
    responses: number;
    breakdown: Record<string, number>;
  };
}

interface TrainingEffectiveness {
  moduleCompletionRates: Record<string, number>;
  assessmentScores: {
    average: number;
    distribution: Record<string, number>;
    passRate: number;
  };
  knowledgeRetention: {
    immediate: number;
    after7Days: number;
    after30Days: number;
  };
  featureAdoption: Record<string, {
    adoptionRate: number;
    timeToFirstUse: number;
    usageFrequency: number;
  }>;
}

interface LaunchMetrics {
  userJourney: UserJourneyMetrics;
  trainingEffectiveness: TrainingEffectiveness;
  systemPerformance: {
    pageLoadTimes: Record<string, number>;
    errorRates: Record<string, number>;
    uptime: number;
  };
  businessImpact: {
    supportTicketReduction: number;
    userActivation: number;
    featureDiscovery: number;
    timeToValue: number;
  };
}

interface LaunchMetricsDashboardProps {
  dateRange?: { start: Date; end: Date };
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  showExportOptions?: boolean;
  className?: string;
}

// Sample data generator
const generateSampleMetrics = (): LaunchMetrics => {
  return {
    userJourney: {
      totalUsers: 1247,
      completionRates: {
        overall: 87.3,
        byRole: {
          customer: 92.1,
          admin: 95.8,
          technician: 89.2,
          business: 94.5
        },
        byExperience: {
          beginner: 85.2,
          intermediate: 91.7,
          advanced: 93.4
        }
      },
      dropOffPoints: [
        { step: 'Video Tutorials', dropOffRate: 15.2, impact: 'medium' },
        { step: 'Assessment', dropOffRate: 8.7, impact: 'low' },
        { step: 'Profile Setup', dropOffRate: 6.1, impact: 'high' }
      ],
      timeToComplete: {
        average: 18.5,
        median: 15.2,
        byRole: {
          customer: 12.8,
          admin: 28.3,
          technician: 22.1,
          business: 31.7
        }
      },
      userSatisfaction: {
        score: 4.6,
        responses: 892,
        breakdown: {
          'Excellent': 68.2,
          'Good': 24.8,
          'Average': 5.1,
          'Poor': 1.2,
          'Very Poor': 0.7
        }
      }
    },
    trainingEffectiveness: {
      moduleCompletionRates: {
        'Basic Navigation': 98.5,
        'Booking Process': 94.2,
        'Customer Portal': 89.7,
        'Admin Features': 91.3,
        'Advanced Features': 78.9
      },
      assessmentScores: {
        average: 86.4,
        distribution: {
          '90-100': 45.2,
          '80-89': 38.7,
          '70-79': 12.8,
          '60-69': 2.9,
          'Below 60': 0.4
        },
        passRate: 96.8
      },
      knowledgeRetention: {
        immediate: 94.2,
        after7Days: 87.6,
        after30Days: 82.1
      },
      featureAdoption: {
        'Booking System': { adoptionRate: 96.2, timeToFirstUse: 2.3, usageFrequency: 8.7 },
        'Customer Portal': { adoptionRate: 78.9, timeToFirstUse: 5.1, usageFrequency: 12.4 },
        'Notifications': { adoptionRate: 89.3, timeToFirstUse: 1.8, usageFrequency: 15.2 },
        'Advanced Search': { adoptionRate: 45.7, timeToFirstUse: 8.9, usageFrequency: 3.2 }
      }
    },
    systemPerformance: {
      pageLoadTimes: {
        'Onboarding Flow': 1.8,
        'Video Player': 2.3,
        'Assessment': 1.2,
        'Dashboard': 1.9
      },
      errorRates: {
        'Onboarding Flow': 0.8,
        'Video Streaming': 2.1,
        'Assessment Submission': 0.4,
        'Profile Save': 1.2
      },
      uptime: 99.7
    },
    businessImpact: {
      supportTicketReduction: 34.2,
      userActivation: 91.8,
      featureDiscovery: 78.5,
      timeToValue: 6.2
    }
  };
};

// Key Metrics Overview Component
const MetricsOverview = ({ metrics }: { metrics: LaunchMetrics }) => {
  const keyMetrics: TrainingMetric[] = [
    {
      id: 'completion_rate',
      name: 'Overall Completion Rate',
      value: metrics.userJourney.completionRates.overall,
      target: 90,
      unit: '%',
      trend: 'up',
      status: metrics.userJourney.completionRates.overall >= 90 ? 'excellent' : 
             metrics.userJourney.completionRates.overall >= 80 ? 'good' : 
             metrics.userJourney.completionRates.overall >= 70 ? 'warning' : 'poor',
      description: 'Percentage of users who complete the entire onboarding flow'
    },
    {
      id: 'user_satisfaction',
      name: 'User Satisfaction',
      value: metrics.userJourney.userSatisfaction.score,
      target: 4.5,
      unit: '/5',
      trend: 'up',
      status: metrics.userJourney.userSatisfaction.score >= 4.5 ? 'excellent' : 
             metrics.userJourney.userSatisfaction.score >= 4.0 ? 'good' : 
             metrics.userJourney.userSatisfaction.score >= 3.5 ? 'warning' : 'poor',
      description: 'Average satisfaction rating from onboarding survey'
    },
    {
      id: 'time_to_complete',
      name: 'Avg. Time to Complete',
      value: metrics.userJourney.timeToComplete.average,
      target: 20,
      unit: ' min',
      trend: 'down',
      status: metrics.userJourney.timeToComplete.average <= 15 ? 'excellent' : 
             metrics.userJourney.timeToComplete.average <= 20 ? 'good' : 
             metrics.userJourney.timeToComplete.average <= 25 ? 'warning' : 'poor',
      description: 'Average time users spend completing onboarding'
    },
    {
      id: 'feature_adoption',
      name: 'Feature Adoption',
      value: Object.values(metrics.trainingEffectiveness.featureAdoption)
        .reduce((sum, feature) => sum + feature.adoptionRate, 0) / 
        Object.keys(metrics.trainingEffectiveness.featureAdoption).length,
      target: 80,
      unit: '%',
      trend: 'up',
      status: 'good',
      description: 'Average adoption rate of key features after onboarding'
    },
    {
      id: 'assessment_pass_rate',
      name: 'Assessment Pass Rate',
      value: metrics.trainingEffectiveness.assessmentScores.passRate,
      target: 95,
      unit: '%',
      trend: 'stable',
      status: metrics.trainingEffectiveness.assessmentScores.passRate >= 95 ? 'excellent' : 
             metrics.trainingEffectiveness.assessmentScores.passRate >= 90 ? 'good' : 
             metrics.trainingEffectiveness.assessmentScores.passRate >= 85 ? 'warning' : 'poor',
      description: 'Percentage of users who pass competency assessments'
    },
    {
      id: 'support_reduction',
      name: 'Support Ticket Reduction',
      value: metrics.businessImpact.supportTicketReduction,
      target: 30,
      unit: '%',
      trend: 'up',
      status: metrics.businessImpact.supportTicketReduction >= 30 ? 'excellent' : 
             metrics.businessImpact.supportTicketReduction >= 20 ? 'good' : 
             metrics.businessImpact.supportTicketReduction >= 10 ? 'warning' : 'poor',
      description: 'Reduction in support tickets after implementing training'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {keyMetrics.map(metric => (
        <Card key={metric.id} className={`p-4 border-2 ${getStatusColor(metric.status)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{metric.name}</h3>
              <p className="text-xs opacity-70 mt-1">{metric.description}</p>
            </div>
            {getTrendIcon(metric.trend)}
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">
                {metric.value.toFixed(1)}{metric.unit}
              </div>
              {metric.target && (
                <div className="text-xs opacity-70">
                  Target: {metric.target}{metric.unit}
                </div>
              )}
            </div>
            
            <Badge className={`${getStatusColor(metric.status)} border`}>
              {metric.status}
            </Badge>
          </div>
          
          {metric.target && (
            <Progress 
              value={(metric.value / metric.target) * 100} 
              className="mt-2 h-1" 
            />
          )}
        </Card>
      ))}
    </div>
  );
};

// User Journey Analysis Component
const UserJourneyAnalysis = ({ metrics }: { metrics: UserJourneyMetrics }) => {
  return (
    <div className="space-y-6">
      {/* Completion Rates by Role */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Completion Rates by Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(metrics.completionRates.byRole).map(([role, rate]) => (
            <div key={role} className="text-center">
              <div className="w-16 h-16 bg-professional-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-8 h-8 text-professional-600" />
              </div>
              <h4 className="font-semibold text-neutral-700 capitalize">{role}</h4>
              <div className="text-2xl font-bold text-professional-600">{rate.toFixed(1)}%</div>
              <Progress value={rate} className="mt-2 h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Drop-off Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Drop-off Point Analysis</h3>
        <div className="space-y-3">
          {metrics.dropOffPoints.map((point, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className={`w-5 h-5 ${
                  point.impact === 'high' ? 'text-red-500' :
                  point.impact === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div>
                  <h4 className="font-medium text-neutral-700">{point.step}</h4>
                  <p className="text-sm text-neutral-600">
                    {point.dropOffRate.toFixed(1)}% drop-off rate
                  </p>
                </div>
              </div>
              <Badge 
                variant={point.impact === 'high' ? 'destructive' : 
                        point.impact === 'medium' ? 'default' : 'secondary'}
              >
                {point.impact} impact
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Time Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Time to Complete Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-700">{metrics.timeToComplete.average.toFixed(1)} min</div>
            <div className="text-sm text-neutral-600">Average Time</div>
          </div>
          <div className="text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-700">{metrics.timeToComplete.median.toFixed(1)} min</div>
            <div className="text-sm text-neutral-600">Median Time</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-700">{metrics.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-neutral-600">Total Users</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-neutral-700 mb-3">Time by Role</h4>
          <div className="space-y-2">
            {Object.entries(metrics.timeToComplete.byRole).map(([role, time]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="capitalize text-neutral-600">{role}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-professional-500 h-2 rounded-full" 
                      style={{ width: `${(time / 35) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{time.toFixed(1)} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* User Satisfaction */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">User Satisfaction</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-professional-600">
              {metrics.userSatisfaction.score.toFixed(1)}/5.0
            </div>
            <div className="text-sm text-neutral-600">
              Based on {metrics.userSatisfaction.responses} responses
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star}
                className={`w-6 h-6 ${
                  star <= Math.round(metrics.userSatisfaction.score) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-neutral-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(metrics.userSatisfaction.breakdown).map(([rating, percentage]) => (
            <div key={rating} className="flex items-center space-x-3">
              <div className="w-20 text-sm text-neutral-600">{rating}</div>
              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-professional-500 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-sm font-medium text-neutral-700">
                {percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Training Effectiveness Component
const TrainingEffectivenessAnalysis = ({ metrics }: { metrics: TrainingEffectiveness }) => {
  return (
    <div className="space-y-6">
      {/* Module Completion Rates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Training Module Completion Rates</h3>
        <div className="space-y-3">
          {Object.entries(metrics.moduleCompletionRates).map(([module, rate]) => (
            <div key={module} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-professional-600" />
                <span className="text-neutral-700">{module}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-professional-500 h-2 rounded-full" 
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-neutral-700 w-12">
                  {rate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assessment Results */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Assessment Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-700">
              {metrics.assessmentScores.average.toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-600">Average Score</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-700">
              {metrics.assessmentScores.passRate.toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-600">Pass Rate</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-700">
              {metrics.assessmentScores.distribution['90-100'].toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-600">Excellence Rate</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-neutral-700 mb-3">Score Distribution</h4>
          <div className="space-y-2">
            {Object.entries(metrics.assessmentScores.distribution).map(([range, percentage]) => (
              <div key={range} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-neutral-600">{range}</div>
                <div className="flex-1 bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-professional-500 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-neutral-700">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Knowledge Retention */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Knowledge Retention Over Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {metrics.knowledgeRetention.immediate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-700">Immediately After</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {metrics.knowledgeRetention.after7Days.toFixed(1)}%
            </div>
            <div className="text-sm text-yellow-700">After 7 Days</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.knowledgeRetention.after30Days.toFixed(1)}%
            </div>
            <div className="text-sm text-orange-700">After 30 Days</div>
          </div>
        </div>
      </Card>

      {/* Feature Adoption */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Post-Training Feature Adoption</h3>
        <div className="space-y-4">
          {Object.entries(metrics.featureAdoption).map(([feature, data]) => (
            <div key={feature} className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-neutral-700">{feature}</h4>
                <Badge variant="secondary">{data.adoptionRate.toFixed(1)}% adoption</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-neutral-600">Time to First Use</div>
                  <div className="font-medium text-neutral-700">{data.timeToFirstUse.toFixed(1)} days</div>
                </div>
                <div>
                  <div className="text-neutral-600">Usage Frequency</div>
                  <div className="font-medium text-neutral-700">{data.usageFrequency.toFixed(1)}/month</div>
                </div>
                <div>
                  <div className="text-neutral-600">Adoption Rate</div>
                  <Progress value={data.adoptionRate} className="mt-1 h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Main Dashboard Component
const LaunchMetricsDashboard = ({
  dateRange,
  autoRefresh = false,
  refreshInterval = 300,
  showExportOptions = true,
  className = ""
}: LaunchMetricsDashboardProps) => {
  const [metrics, setMetrics] = useState<LaunchMetrics>(generateSampleMetrics());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMetrics(generateSampleMetrics());
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const exportReport = (format: 'pdf' | 'csv' | 'json') => {
    // Implementation would depend on your export requirements
    console.log(`Exporting report as ${format}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-700">Launch Metrics Dashboard</h2>
          <p className="text-neutral-600">Training effectiveness and user onboarding analytics</p>
          <p className="text-sm text-neutral-500">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {showExportOptions && (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportReport('pdf')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportReport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
          
          <Button 
            onClick={refreshData} 
            disabled={isLoading}
            variant="secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user_journey">User Journey</TabsTrigger>
          <TabsTrigger value="training_effectiveness">Training Effectiveness</TabsTrigger>
          <TabsTrigger value="business_impact">Business Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview metrics={metrics} />
          
          {/* Quick Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-700 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Strengths</h4>
                </div>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• High completion rate among admin users (95.8%)</li>
                  <li>• Excellent user satisfaction score (4.6/5)</li>
                  <li>• Strong knowledge retention after 30 days</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Areas for Improvement</h4>
                </div>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Video tutorial drop-off rate needs attention</li>
                  <li>• Advanced features adoption could be higher</li>
                  <li>• Consider mobile optimization improvements</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="user_journey">
          <UserJourneyAnalysis metrics={metrics.userJourney} />
        </TabsContent>

        <TabsContent value="training_effectiveness">
          <TrainingEffectivenessAnalysis metrics={metrics.trainingEffectiveness} />
        </TabsContent>

        <TabsContent value="business_impact" className="space-y-6">
          {/* Business Impact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <TrendingDown className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-700">
                {metrics.businessImpact.supportTicketReduction.toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-600">Support Ticket Reduction</div>
            </Card>
            
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-700">
                {metrics.businessImpact.userActivation.toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-600">User Activation Rate</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-700">
                {metrics.businessImpact.featureDiscovery.toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-600">Feature Discovery</div>
            </Card>
            
            <Card className="p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-700">
                {metrics.businessImpact.timeToValue.toFixed(1)} days
              </div>
              <div className="text-sm text-neutral-600">Time to Value</div>
            </Card>
          </div>

          {/* ROI Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-700 mb-4">Training ROI Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-neutral-700 mb-3">Cost Savings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Reduced support costs</span>
                    <span className="font-medium text-green-600">$12,450/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Faster user onboarding</span>
                    <span className="font-medium text-green-600">$8,200/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Improved retention</span>
                    <span className="font-medium text-green-600">$15,300/month</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Monthly Savings</span>
                    <span className="text-green-600">$35,950</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neutral-700 mb-3">Investment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Training development</span>
                    <span className="font-medium text-neutral-700">$45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Platform maintenance</span>
                    <span className="font-medium text-neutral-700">$2,500/month</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">ROI: 847%</div>
                      <div className="text-sm text-green-700">Payback period: 1.3 months</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LaunchMetricsDashboard;
export { type LaunchMetrics, type TrainingMetric, type UserJourneyMetrics };