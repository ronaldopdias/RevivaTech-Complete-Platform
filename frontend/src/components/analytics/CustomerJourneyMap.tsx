/**
 * Customer Journey Map Component
 * Visualizes customer journey stages, touchpoints, and conversion paths
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  Area,
  AreaChart,
  ReferenceLine,
  Brush
} from 'recharts';
import { 
  journeyAnalytics, 
  CustomerJourneyMap, 
  JourneyEvent, 
  JOURNEY_STAGES 
} from '../../services/journeyAnalytics';

interface JourneyVisualizationProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  selectedJourney?: CustomerJourneyMap;
  onJourneySelect?: (journey: CustomerJourneyMap) => void;
}

interface StageMetrics {
  stageId: string;
  stageName: string;
  entries: number;
  completions: number;
  averageTime: number;
  dropOffRate: number;
  conversionRate: number;
}

interface TouchpointData {
  timestamp: number;
  stageId: string;
  stageName: string;
  eventType: string;
  deviceType: string;
  duration: number;
  converted: boolean;
}

const STAGE_COLORS = {
  awareness: '#3B82F6',
  interest: '#10B981',
  consideration: '#F59E0B',
  intent: '#EF4444',
  conversion: '#8B5CF6',
  retention: '#06B6D4'
};

const CustomerJourneyMapComponent: React.FC<JourneyVisualizationProps> = ({
  dateRange,
  selectedJourney,
  onJourneySelect
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'individual' | 'touchpoints' | 'flow'>('overview');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<CustomerJourneyMap[]>([]);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch journey analytics data
  useEffect(() => {
    const fetchJourneyData = async () => {
      try {
        setIsLoading(true);
        const data = await journeyAnalytics.getJourneyAnalytics(dateRange.startDate, dateRange.endDate);
        setJourneyData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load journey data');
        console.error('Journey data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneyData();
    const interval = setInterval(fetchJourneyData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dateRange.startDate, dateRange.endDate]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = journeyAnalytics.subscribeToJourneyUpdates((journey) => {
      setRealTimeUpdates(prev => [journey, ...prev.slice(0, 9)]); // Keep last 10 updates
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const renderStageFlow = () => {
    if (!journeyData?.stageAnalysis) return null;

    const maxEntries = Math.max(...journeyData.stageAnalysis.map((s: any) => s.entries));

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Customer Journey Flow</h3>
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            {journeyData.stageAnalysis.map((stage: any, index: number) => (
              <div
                key={stage.stageId}
                className={`relative flex-1 ${index < journeyData.stageAnalysis.length - 1 ? 'mr-4' : ''}`}
              >
                {/* Stage Connection Line */}
                {index < journeyData.stageAnalysis.length - 1 && (
                  <div className="absolute top-1/2 left-full w-4 h-0.5 bg-gray-300 transform -translate-y-1/2 z-0"></div>
                )}
                
                {/* Stage Circle */}
                <div 
                  className={`relative w-16 h-16 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                    selectedStage === stage.stageId 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-300 bg-white hover:shadow-md'
                  }`}
                  style={{
                    borderColor: STAGE_COLORS[stage.stageId as keyof typeof STAGE_COLORS] || '#6B7280',
                    backgroundColor: selectedStage === stage.stageId 
                      ? `${STAGE_COLORS[stage.stageId as keyof typeof STAGE_COLORS]}20` 
                      : 'white'
                  }}
                  onClick={() => setSelectedStage(selectedStage === stage.stageId ? null : stage.stageId)}
                >
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600">{stage.entries}</div>
                    <div className="text-xs text-gray-500">users</div>
                  </div>
                </div>

                {/* Stage Label */}
                <div className="text-center mt-2">
                  <div className="text-sm font-medium text-gray-900">{stage.stageName}</div>
                  <div className="text-xs text-gray-500">
                    {stage.conversionRate?.toFixed(1)}% conversion
                  </div>
                  <div className="text-xs text-red-500">
                    {stage.dropOffRate?.toFixed(1)}% drop-off
                  </div>
                </div>

                {/* Stage Metrics Bar */}
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(stage.entries / maxEntries) * 100}%`,
                      backgroundColor: STAGE_COLORS[stage.stageId as keyof typeof STAGE_COLORS] || '#6B7280'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Drop-off Analysis */}
          {journeyData.topDropOffStages && journeyData.topDropOffStages.length > 0 && (
            <div className="mt-8 p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Top Drop-off Stages</h4>
              <div className="space-y-2">
                {journeyData.topDropOffStages.map((dropOff: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-red-700">{dropOff.stage}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-900 font-medium">{dropOff.count} users</span>
                      <span className="text-red-600">({dropOff.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTouchpointAnalysis = () => {
    if (!journeyData?.stageAnalysis) return null;

    const touchpointData = journeyData.stageAnalysis.map((stage: any) => ({
      stage: stage.stageName,
      averageTime: stage.averageTime,
      entries: stage.entries,
      completions: stage.completions,
      dropOffs: stage.entries - stage.completions
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Touchpoint Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={touchpointData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="averageTime" 
              name="Average Time (min)"
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              dataKey="entries" 
              name="Entries"
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded shadow">
                      <p className="font-semibold">{data.stage}</p>
                      <p className="text-sm text-blue-600">Entries: {data.entries}</p>
                      <p className="text-sm text-green-600">Completions: {data.completions}</p>
                      <p className="text-sm text-red-600">Drop-offs: {data.dropOffs}</p>
                      <p className="text-sm text-gray-600">Avg Time: {data.averageTime?.toFixed(1)} min</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              dataKey="entries" 
              fill="#8B5CF6"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderJourneyTimeline = () => {
    if (!selectedJourney) return null;

    const timelineData = selectedJourney.events.map(event => ({
      timestamp: event.timestamp.getTime(),
      stage: event.stageId,
      eventType: event.eventType,
      duration: event.duration || 0,
      deviceType: event.deviceType
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Individual Journey Timeline
          <span className="ml-2 text-sm text-gray-500">
            ({selectedJourney.touchpoints} touchpoints)
          </span>
        </h3>
        
        <div className="mb-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Page Views</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Interactions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Conversions</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis hide />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="font-semibold">{new Date(label).toLocaleString()}</p>
                          <p className="text-sm text-blue-600">Stage: {data.stage}</p>
                          <p className="text-sm text-green-600">Event: {data.eventType}</p>
                          <p className="text-sm text-gray-600">Device: {data.deviceType}</p>
                          {data.duration > 0 && (
                            <p className="text-sm text-purple-600">Duration: {data.duration}ms</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderRealTimeUpdates = () => {
    if (realTimeUpdates.length === 0) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Real-time Journey Updates
          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Live
          </span>
        </h3>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {realTimeUpdates.map((journey, index) => (
            <div 
              key={journey.journeyId}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedJourney?.journeyId === journey.journeyId 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => onJourneySelect?.(journey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STAGE_COLORS[journey.currentStage as keyof typeof STAGE_COLORS] || '#6B7280' }}
                  ></div>
                  <div>
                    <div className="text-sm font-medium">
                      {journey.currentStage} stage
                    </div>
                    <div className="text-xs text-gray-500">
                      {journey.touchpoints} touchpoints • {(journey.totalDuration / 1000 / 60).toFixed(1)} min
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    journey.conversionAchieved ? 'text-green-600' : 
                    journey.droppedAtStage ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {journey.conversionAchieved ? 'Converted' : 
                     journey.droppedAtStage ? 'Dropped' : 'Active'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(journey.startTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOverviewMetrics = () => {
    if (!journeyData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Journeys</div>
          <div className="text-2xl font-bold text-gray-900">{journeyData.totalJourneys}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Completed Journeys</div>
          <div className="text-2xl font-bold text-green-600">{journeyData.completedJourneys}</div>
          <div className="text-xs text-gray-500">
            {((journeyData.completedJourneys / journeyData.totalJourneys) * 100).toFixed(1)}% completion rate
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Avg Journey Duration</div>
          <div className="text-2xl font-bold text-blue-600">
            {(journeyData.averageJourneyDuration / 1000 / 60).toFixed(1)} min
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Mobile Conversions</div>
          <div className="text-2xl font-bold text-purple-600">
            {journeyData.conversionsByDevice?.mobile || 0}
          </div>
          <div className="text-xs text-gray-500">
            vs {journeyData.conversionsByDevice?.desktop || 0} desktop
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Journey Map</h1>
          <div className="flex space-x-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'flow', label: 'Journey Flow' },
              { key: 'touchpoints', label: 'Touchpoints' },
              { key: 'individual', label: 'Individual' }
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
      </div>

      {/* Overview Metrics */}
      {activeView === 'overview' && renderOverviewMetrics()}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeView === 'overview' && renderStageFlow()}
          {activeView === 'flow' && renderStageFlow()}
          {activeView === 'touchpoints' && renderTouchpointAnalysis()}
          {activeView === 'individual' && renderJourneyTimeline()}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {renderRealTimeUpdates()}
          
          {/* Selected Stage Details */}
          {selectedStage && journeyData && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                {selectedStage.charAt(0).toUpperCase() + selectedStage.slice(1)} Stage Details
              </h3>
              {journeyData.stageAnalysis
                .filter((stage: any) => stage.stageId === selectedStage)
                .map((stage: any) => (
                  <div key={stage.stageId} className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Entries:</span>
                      <span className="text-sm font-medium">{stage.entries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completions:</span>
                      <span className="text-sm font-medium text-green-600">{stage.completions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Time:</span>
                      <span className="text-sm font-medium">{stage.averageTime?.toFixed(1)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Drop-off Rate:</span>
                      <span className="text-sm font-medium text-red-600">{stage.dropOffRate?.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerJourneyMapComponent;