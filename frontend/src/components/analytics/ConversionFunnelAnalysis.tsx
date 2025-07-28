/**
 * Conversion Funnel Analysis Component
 * Analyzes conversion rates, identifies drop-off points, and provides optimization insights
 */

import React, { useState, useEffect } from 'react';
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Treemap
} from 'recharts';
import { 
  journeyAnalytics, 
  FunnelAnalysis, 
  CONVERSION_FUNNEL 
} from '../../services/journeyAnalytics';

interface ConversionFunnelProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  selectedSegment?: string;
  onSegmentChange?: (segment: string) => void;
}

interface DropOffPattern {
  pattern: string;
  frequency: number;
  impact: number;
  recommendations: string[];
}

interface OptimizationRecommendation {
  stageId: string;
  issue: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number;
}

const PRIORITY_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981'
};

const ConversionFunnelAnalysis: React.FC<ConversionFunnelProps> = ({
  dateRange,
  selectedSegment = 'all',
  onSegmentChange
}) => {
  const [activeView, setActiveView] = useState<'funnel' | 'dropoff' | 'optimization' | 'trends'>('funnel');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  
  // State for data management
  const [funnelData, setFunnelData] = useState<FunnelAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [dropOffPatterns, setDropOffPatterns] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch funnel analysis data
  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        setIsLoading(true);
        const data = await journeyAnalytics.getFunnelAnalysis(dateRange.startDate, dateRange.endDate);
        setFunnelData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load funnel data');
        console.error('Funnel data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunnelData();
    const interval = setInterval(fetchFunnelData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [dateRange.startDate, dateRange.endDate, selectedSegment]);

  // Fetch optimization recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await journeyAnalytics.getOptimizationRecommendations();
        setRecommendations(data);
      } catch (err) {
        console.error('Recommendations fetch error:', err);
      }
    };

    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Fetch drop-off patterns for selected stage
  useEffect(() => {
    const fetchDropOffPatterns = async () => {
      if (!selectedStage) {
        setDropOffPatterns(null);
        return;
      }

      try {
        const data = await journeyAnalytics.identifyDropOffPatterns(selectedStage, comparisonPeriod);
        setDropOffPatterns(data);
      } catch (err) {
        console.error('Drop-off patterns fetch error:', err);
      }
    };

    fetchDropOffPatterns();
  }, [selectedStage, comparisonPeriod]);

  const renderFunnelVisualization = () => {
    if (!funnelData || funnelData.length === 0) return null;

    const funnelChartData = funnelData.map(stage => ({
      name: stage.stageName,
      value: stage.totalEntered,
      converted: stage.totalConverted,
      dropped: stage.totalDropped,
      conversionRate: stage.conversionRate,
      dropOffRate: stage.dropOffRate,
      fill: getStageColor(stage.stageId)
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <FunnelChart>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm text-blue-600">Entered: {data.value.toLocaleString()}</p>
                          <p className="text-sm text-green-600">Converted: {data.converted.toLocaleString()}</p>
                          <p className="text-sm text-red-600">Dropped: {data.dropped.toLocaleString()}</p>
                          <p className="text-sm text-purple-600">Conversion Rate: {data.conversionRate.toFixed(1)}%</p>
                          <p className="text-sm text-orange-600">Drop-off Rate: {data.dropOffRate.toFixed(1)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelChartData}
                  isAnimationActive
                  onClick={(data: any) => setSelectedStage(data.name)}
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Rates */}
          <div>
            <h4 className="text-md font-medium mb-3">Stage Performance</h4>
            <div className="space-y-3">
              {funnelData.map((stage, index) => (
                <div 
                  key={stage.stageId}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedStage === stage.stageName 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedStage(stage.stageName)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{stage.stageName}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      stage.conversionRate > 70 ? 'bg-green-100 text-green-800' :
                      stage.conversionRate > 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stage.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-600">Entered</div>
                      <div className="font-medium">{stage.totalEntered.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Converted</div>
                      <div className="font-medium text-green-600">{stage.totalConverted.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Dropped</div>
                      <div className="font-medium text-red-600">{stage.totalDropped.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${stage.conversionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDropOffAnalysis = () => {
    if (!selectedStage || !dropOffPatterns) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            Please select a stage from the funnel view to see drop-off analysis.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Drop-off Analysis: {selectedStage}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Reasons */}
          <div>
            <h4 className="text-md font-medium mb-3">Top Drop-off Reasons</h4>
            <div className="space-y-3">
              {dropOffPatterns.topReasons?.map((reason: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{reason.reason}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{reason.count}</div>
                    <div className="text-xs text-gray-500">{reason.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div>
            <h4 className="text-md font-medium mb-3">Drop-off Patterns</h4>
            <div className="space-y-3">
              {dropOffPatterns.patterns?.map((pattern: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{pattern.pattern}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      {pattern.frequency}x
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Impact: {pattern.impact}% of total drop-offs
                  </div>
                  <div className="space-y-1">
                    {pattern.recommendations?.map((rec: string, recIndex: number) => (
                      <div key={recIndex} className="text-xs text-blue-600 flex items-center">
                        <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOptimizationRecommendations = () => {
    if (!recommendations || recommendations.length === 0) return null;

    const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
    const mediumPriorityRecs = recommendations.filter(r => r.priority === 'medium');
    const lowPriorityRecs = recommendations.filter(r => r.priority === 'low');

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendations by Priority */}
          <div>
            <h4 className="text-md font-medium mb-3">Action Items</h4>
            <div className="space-y-4">
              {[
                { title: 'High Priority', items: highPriorityRecs, color: 'red' },
                { title: 'Medium Priority', items: mediumPriorityRecs, color: 'yellow' },
                { title: 'Low Priority', items: lowPriorityRecs, color: 'green' }
              ].map((section) => (
                <div key={section.title}>
                  <h5 className={`text-sm font-medium mb-2 text-${section.color}-700`}>
                    {section.title} ({section.items.length})
                  </h5>
                  <div className="space-y-2">
                    {section.items.map((rec, index) => (
                      <div key={index} className={`p-3 border-l-4 border-${section.color}-400 bg-${section.color}-50 rounded`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">{rec.stageId}</span>
                          <span className="text-xs text-gray-500">
                            +{rec.expectedImpact.toFixed(1)}% expected improvement
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{rec.issue}</div>
                        <div className="text-xs text-gray-800">{rec.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Analysis */}
          <div>
            <h4 className="text-md font-medium mb-3">Potential Impact</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recommendations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stageId" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="font-semibold">{data.stageId}</p>
                          <p className="text-sm text-blue-600">Expected Impact: +{data.expectedImpact.toFixed(1)}%</p>
                          <p className="text-sm text-gray-600">Priority: {data.priority}</p>
                          <p className="text-xs text-gray-500">{data.recommendation}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="expectedImpact" 
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendAnalysis = () => {
    if (!funnelData || funnelData.length === 0) return null;

    const trendData = funnelData.map(stage => ({
      stage: stage.stageName,
      current: stage.conversionRate,
      previous: stage.conversionRate * (0.85 + Math.random() * 0.3), // Simulated previous period
      change: stage.conversionRate - (stage.conversionRate * (0.85 + Math.random() * 0.3))
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Conversion Trends</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Current Period"
                />
                <Line 
                  type="monotone" 
                  dataKey="previous" 
                  stroke="#6B7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Previous Period"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Change Analysis */}
          <div>
            <h4 className="text-md font-medium mb-3">Period Comparison</h4>
            <div className="space-y-3">
              {trendData.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{trend.stage}</div>
                    <div className="text-sm text-gray-600">
                      {trend.current.toFixed(1)}% → {trend.previous.toFixed(1)}%
                    </div>
                  </div>
                  <div className={`text-right ${
                    trend.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className="text-sm font-bold">
                      {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                    </div>
                    <div className="text-xs">
                      {trend.change > 0 ? '↗' : '↘'} {Math.abs(trend.change).toFixed(1)}pp
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFunnelMetrics = () => {
    if (!funnelData || funnelData.length === 0) return null;

    const totalEntered = funnelData[0]?.totalEntered || 0;
    const totalConverted = funnelData[funnelData.length - 1]?.totalConverted || 0;
    const overallConversionRate = totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0;
    const avgTimeSpent = funnelData.reduce((sum, stage) => sum + stage.averageTimeSpent, 0) / funnelData.length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Funnel Entries</div>
          <div className="text-2xl font-bold text-blue-600">{totalEntered.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Final Conversions</div>
          <div className="text-2xl font-bold text-green-600">{totalConverted.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Overall Conversion Rate</div>
          <div className="text-2xl font-bold text-purple-600">{overallConversionRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Avg Time in Funnel</div>
          <div className="text-2xl font-bold text-orange-600">{avgTimeSpent.toFixed(1)} min</div>
        </div>
      </div>
    );
  };

  const getStageColor = (stageId: string): string => {
    const colors: Record<string, string> = {
      'landing': '#3B82F6',
      'service_exploration': '#10B981',
      'pricing_review': '#F59E0B',
      'booking_initiation': '#EF4444',
      'booking_completion': '#8B5CF6'
    };
    return colors[stageId] || '#6B7280';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Conversion Funnel Analysis</h1>
          <div className="flex space-x-2">
            {[
              { key: 'funnel', label: 'Funnel View' },
              { key: 'dropoff', label: 'Drop-off Analysis' },
              { key: 'optimization', label: 'Optimization' },
              { key: 'trends', label: 'Trends' }
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === view.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Comparison Period:</label>
          <select 
            value={comparisonPeriod} 
            onChange={(e) => setComparisonPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
        </div>
      </div>

      {/* Metrics Overview */}
      {activeView === 'funnel' && renderFunnelMetrics()}

      {/* Main Content */}
      <div className="space-y-6">
        {activeView === 'funnel' && renderFunnelVisualization()}
        {activeView === 'dropoff' && renderDropOffAnalysis()}
        {activeView === 'optimization' && renderOptimizationRecommendations()}
        {activeView === 'trends' && renderTrendAnalysis()}
      </div>
    </div>
  );
};

export default ConversionFunnelAnalysis;