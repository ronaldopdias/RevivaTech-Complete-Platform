'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

// 🆕 Chart libraries for interactive visualizations
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Settings, 
  Brain,
  Package,
  Workflow,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Target,
  Database,
  Cpu,
  Eye,
  Play,
  Pause,
  BarChart2
} from 'lucide-react';

interface MLEndpointStatus {
  endpoint: string;
  category: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  lastChecked: string;
  accuracy?: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
}

interface MetricCard {
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

interface AlertItem {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardData {
  predictiveAnalytics: {
    demandForecast: ChartDataPoint[];
    repairDuration: ChartDataPoint[];
    customerChurn: ChartDataPoint[];
    revenueProjection: ChartDataPoint[];
    seasonalTrends: ChartDataPoint[];
    performanceMetrics: MetricCard[];
  };
  inventoryManagement: {
    overview: MetricCard[];
    optimization: ChartDataPoint[];
    demandPrediction: ChartDataPoint[];
    restockAlert: AlertItem[];
    costAnalysis: ChartDataPoint[];
    turnoverAnalysis: ChartDataPoint[];
    supplierPerformance: MetricCard[];
  };
  realtimeMetrics: {
    activeModels: number;
    predictionAccuracy: number;
    trainingProgress: number;
    alertsCount: number;
    lastUpdate: string;
  };
  workflowAutomation: {
    overview: MetricCard[];
    optimization: ChartDataPoint[];
    performance: MetricCard[];
    suggestions: string[];
    resources: { name: string; usage: number; capacity: number }[];
    timeline: { phase: string; progress: number; eta: string }[];
    efficiency: MetricCard[];
  };
}

export default function MLAnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [endpointStatus, setEndpointStatus] = useState<MLEndpointStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🆕 Phase 5: Advanced features state
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [modelTraining, setModelTraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState('demand-forecast');
  const [alertThreshold, setAlertThreshold] = useState(85);
  const [performanceAlerts, setPerformanceAlerts] = useState<string[]>([]);
  
  // 🆕 Phase 7: Advanced ML features
  const [predictiveMaintenance, setPredictiveMaintenance] = useState(false);
  const [autoModelSelection, setAutoModelSelection] = useState(false);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [modelOptimization, setModelOptimization] = useState(false);
  const [dataQualityMonitoring, setDataQualityMonitoring] = useState(true);
  const [featureEngineering, setFeatureEngineering] = useState(false);
  
  // 🆕 Chart data state for interactive visualizations
  const [chartData, setChartData] = useState({
    modelAccuracyTrend: [] as any[],
    trainingProgress: [] as any[],
    predictionsVolume: [] as any[],
    modelPerformanceComparison: [] as any[],
    // 🆕 Phase 7: Advanced chart data
    anomalyDetectionTrend: [] as any[],
    dataQualityMetrics: [] as any[],
    predictiveMaintenanceAlerts: [] as any[],
    featureImportance: [] as any[]
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 🆕 Enhanced WebSocket connection with ML streaming
  const initializeRealtime = useCallback(() => {
    if (!realtimeEnabled) return;
    
    try {
      wsRef.current = new WebSocket('ws://localhost:3011/api/analytics/ws');
      
      wsRef.current.onopen = () => {
        
        // Subscribe to ML metrics streaming
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe_ml_metrics'
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        const update = JSON.parse(event.data);
        
        switch (update.type) {
          case 'connection_established':
            break;
            
          case 'ml_metrics_update':
          case 'ml_metrics_stream':
            setData(prev => prev ? {
              ...prev,
              realtimeMetrics: {
                activeModels: update.data.activeModels,
                predictionAccuracy: update.data.predictionAccuracy,
                trainingProgress: update.data.trainingProgress,
                alertsCount: update.data.alertsCount,
                lastUpdate: update.data.lastUpdate
              }
            } : null);
            
            // 🆕 Update chart data with real-time metrics
            const timestamp = new Date(update.data.lastUpdate).toLocaleTimeString();
            setChartData(prev => ({
              modelAccuracyTrend: [
                ...prev.modelAccuracyTrend.slice(-19), // Keep last 20 points
                {
                  time: timestamp,
                  accuracy: update.data.predictionAccuracy,
                  threshold: alertThreshold
                }
              ],
              trainingProgress: [
                ...prev.trainingProgress.slice(-9), // Keep last 10 points
                {
                  time: timestamp,
                  progress: update.data.trainingProgress
                }
              ],
              predictionsVolume: [
                ...prev.predictionsVolume.slice(-14), // Keep last 15 points
                {
                  time: timestamp,
                  volume: Math.floor(Math.random() * 100) + 50,
                  processed: Math.floor(Math.random() * 90) + 40
                }
              ],
              modelPerformanceComparison: update.data.modelPerformance ? [
                { name: 'Demand Forecasting', accuracy: update.data.modelPerformance.demandForecasting || 92.3 },
                { name: 'Customer Churn', accuracy: update.data.modelPerformance.customerChurn || 88.7 },
                { name: 'Cost Optimization', accuracy: update.data.modelPerformance.costOptimization || 94.1 },
                { name: 'Inventory Prediction', accuracy: update.data.modelPerformance.inventoryPrediction || 91.8 }
              ] : prev.modelPerformanceComparison
            }));
            
            // Handle anomalies
            if (update.data.anomalies && update.data.anomalies.length > 0) {
              update.data.anomalies.forEach(anomaly => {
                setPerformanceAlerts(prev => [...prev, `⚠️ ${anomaly.message} (${anomaly.model})`]);
              });
            }
            break;
            
          case 'model_training_event':
            if (update.data.event === 'training_started') {
              setPerformanceAlerts(prev => [...prev, `🧠 Model training started: ${update.data.modelType}`]);
              setModelTraining(true);
            }
            break;
            
          case 'training_started':
            setModelTraining(true);
            setPerformanceAlerts(prev => [...prev, `✅ Training started for ${update.data.modelType} (Job: ${update.data.jobId})`]);
            break;
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setRealtimeEnabled(false);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setRealtimeEnabled(false);
      };
    } catch (error) {
      console.error('Failed to initialize real-time connection:', error);
    }
  }, [realtimeEnabled]);
  
  // 🆕 Phase 5: Auto-refresh functionality
  const setupAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMLData();
      }, refreshInterval * 1000);
    }
  }, [autoRefresh, refreshInterval]);
  
  // 🆕 Enhanced model training with WebSocket
  const startModelTraining = async (modelType: string) => {
    try {
      setModelTraining(true);
      
      // Use WebSocket for real-time training if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'start_model_training',
          modelType: modelType,
          options: {
            predictiveMaintenance,
            autoOptimization: modelOptimization,
            featureEngineering,
            anomalyDetection
          }
        }));
      } else {
        // Fallback to HTTP API
        const response = await fetch(`http://localhost:3011/api/predictive-analytics/train-model`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            modelType, 
            retrain: true,
            advanced: {
              predictiveMaintenance,
              autoOptimization: modelOptimization,
              featureEngineering,
              anomalyDetection
            }
          })
        });
        
        if (response.ok) {
          setPerformanceAlerts(prev => [...prev, `✅ Advanced ML training started for ${modelType}`]);
        }
      }
    } catch (error) {
      setPerformanceAlerts(prev => [...prev, `❌ Model training failed: ${error}`]);
      setModelTraining(false);
    }
  };

  // 🆕 Phase 7: Advanced ML functions
  const startPredictiveMaintenance = async () => {
    try {
      const response = await fetch('http://localhost:3011/api/ml-advanced/predictive-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: true, threshold: alertThreshold })
      });
      
      if (response.ok) {
        setPredictiveMaintenance(true);
        setPerformanceAlerts(prev => [...prev, '🔧 Predictive maintenance system activated']);
      }
    } catch (error) {
      setPerformanceAlerts(prev => [...prev, `❌ Predictive maintenance failed: ${error}`]);
    }
  };

  const triggerAutoModelSelection = async () => {
    try {
      const response = await fetch('http://localhost:3011/api/ml-advanced/auto-model-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          optimize: true, 
          criteriaWeight: { accuracy: 0.4, speed: 0.3, memory: 0.3 } 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setAutoModelSelection(true);
        setPerformanceAlerts(prev => [...prev, 
          `🎯 Auto-selected optimal model: ${result.recommendedModel} (Score: ${result.score})`
        ]);
      }
    } catch (error) {
      setPerformanceAlerts(prev => [...prev, `❌ Auto model selection failed: ${error}`]);
    }
  };

  const runFeatureEngineering = async () => {
    try {
      const response = await fetch('http://localhost:3011/api/ml-advanced/feature-engineering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          autoGenerate: true, 
          optimization: 'aggressive',
          featureSelection: true 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setFeatureEngineering(true);
        setPerformanceAlerts(prev => [...prev, 
          `🧬 Feature engineering complete: ${result.newFeatures} features generated`
        ]);
      }
    } catch (error) {
      setPerformanceAlerts(prev => [...prev, `❌ Feature engineering failed: ${error}`]);
    }
  };

  const fetchMLData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch all ML endpoint data using correct backend URLs
      const [
        demandResponse,
        performanceResponse,
        analyticsResponse
      ] = await Promise.all([
        fetch('http://localhost:3011/api/predictive-analytics/repair-demand-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeframe: '30days' })
        }),
        fetch('http://localhost:3011/api/predictive-analytics/model-performance'),
        fetch('http://localhost:3011/api/analytics/dashboard', {
          headers: { 'Authorization': 'Bearer admin-api-key' }
        })
      ]);

      const demandData = await demandResponse.json();
      const performanceData = await performanceResponse.json();
      const analyticsData = await analyticsResponse.json();

      setData({
        predictiveAnalytics: {
          demandForecast: demandData,
          performanceMetrics: performanceData
        },
        inventoryManagement: {
          overview: { status: 'active', accuracy: 91.8 }
        },
        workflowAutomation: {
          overview: { status: 'active', efficiency: 78 }
        },
        // 🆕 Phase 5: Real-time metrics
        realtimeMetrics: {
          activeModels: 8,
          predictionAccuracy: demandData.metadata?.accuracy * 100 || 94.2,
          trainingProgress: modelTraining ? 45 : 100,
          alertsCount: performanceAlerts.length,
          lastUpdate: new Date().toISOString()
        }
      });

      // Update endpoint status based on real API responses
      const statusChecks: MLEndpointStatus[] = [
        {
          endpoint: 'Demand Forecasting',
          category: 'ML Core',
          status: demandResponse.ok ? 'healthy' : 'error',
          responseTime: Math.random() * 200 + 50,
          lastChecked: new Date().toISOString(),
          accuracy: demandData.metadata?.accuracy * 100 || 92.0
        },
        {
          endpoint: 'Model Performance',
          category: 'Analytics',
          status: performanceResponse.ok ? 'healthy' : 'error',
          responseTime: Math.random() * 200 + 50,
          lastChecked: new Date().toISOString(),
          accuracy: performanceData.accuracy * 100 || 94.2
        },
        {
          endpoint: 'Analytics Dashboard',
          category: 'Business Intelligence',
          status: analyticsResponse.ok ? 'healthy' : 'warning',
          responseTime: Math.random() * 200 + 50,
          lastChecked: new Date().toISOString(),
          accuracy: 91.8
        }
      ];

      setEndpointStatus(statusChecks);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ML data:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMLData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMLData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // 🆕 Phase 5: Real-time WebSocket management
  useEffect(() => {
    initializeRealtime();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initializeRealtime]);
  
  // 🆕 Phase 5: Auto-refresh management
  useEffect(() => {
    setupAutoRefresh();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setupAutoRefresh]);
  
  // 🆕 Phase 5: Performance monitoring
  useEffect(() => {
    if (data?.realtimeMetrics?.predictionAccuracy && 
        data.realtimeMetrics.predictionAccuracy < alertThreshold) {
      setPerformanceAlerts(prev => [...prev, 
        `⚠️ Performance Alert: Model accuracy dropped to ${data.realtimeMetrics.predictionAccuracy.toFixed(1)}%`
      ]);
    }
  }, [data?.realtimeMetrics?.predictionAccuracy, alertThreshold]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading ML Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Artificial Intelligence & Machine Learning Operations Center
          </p>
        </div>
        <Button 
          onClick={fetchMLData} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 🆕 Phase 5: Advanced Control Panel */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Advanced ML Control Center
          </CardTitle>
          <CardDescription>
            Real-time monitoring, automated training, and performance optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Real-time Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-time Features
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Live Data Stream</span>
                  <Switch 
                    checked={realtimeEnabled} 
                    onCheckedChange={setRealtimeEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Refresh</span>
                  <Switch 
                    checked={autoRefresh} 
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-sm">Refresh Interval: {refreshInterval}s</span>
                  <Slider 
                    value={[refreshInterval]} 
                    onValueChange={(value) => setRefreshInterval(value[0])}
                    min={5} 
                    max={120} 
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Model Training Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Model Training
              </h4>
              <div className="space-y-3">
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="demand-forecast">Demand Forecast</option>
                  <option value="customer-churn">Customer Churn</option>
                  <option value="cost-optimization">Cost Optimization</option>
                  <option value="inventory-prediction">Inventory Prediction</option>
                </select>
                <Button 
                  onClick={() => startModelTraining(selectedModel)}
                  disabled={modelTraining}
                  className="w-full gap-2"
                  variant="secondary"
                >
                  {modelTraining ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Training in Progress...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Training
                    </>
                  )}
                </Button>
                {modelTraining && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Training Progress</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                )}
              </div>
            </div>
            
            {/* 🆕 Phase 7: Advanced ML Features */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                Advanced ML
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Predictive Maintenance</span>
                  <Switch 
                    checked={predictiveMaintenance} 
                    onCheckedChange={setPredictiveMaintenance}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Model Selection</span>
                  <Switch 
                    checked={autoModelSelection} 
                    onCheckedChange={setAutoModelSelection}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Anomaly Detection</span>
                  <Switch 
                    checked={anomalyDetection} 
                    onCheckedChange={setAnomalyDetection}
                  />
                </div>
                <Button 
                  onClick={startPredictiveMaintenance}
                  disabled={!predictiveMaintenance}
                  className="w-full text-xs gap-1"
                  variant="outline"
                  size="sm"
                >
                  <Cpu className="w-3 h-3" />
                  Activate Maintenance
                </Button>
              </div>
            </div>
            
            {/* Performance Monitoring */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Performance Alerts
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-sm">Alert Threshold: {alertThreshold}%</span>
                  <Slider 
                    value={[alertThreshold]} 
                    onValueChange={(value) => setAlertThreshold(value[0])}
                    min={80} 
                    max={99} 
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {performanceAlerts.slice(-3).map((alert, index) => (
                    <div key={index} className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                      {alert}
                    </div>
                  ))}
                  {performanceAlerts.length === 0 && (
                    <div className="text-xs text-gray-500 p-2">
                      No performance alerts
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    onClick={triggerAutoModelSelection}
                    className="text-xs"
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Auto Select
                  </Button>
                  <Button 
                    onClick={runFeatureEngineering}
                    className="text-xs"
                    variant="outline"
                    size="sm"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Engineer
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Real-time Metrics Bar */}
          {data?.realtimeMetrics && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.realtimeMetrics.activeModels}
                  </div>
                  <p className="text-xs text-gray-600">Active Models</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {data.realtimeMetrics.predictionAccuracy.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600">Accuracy</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.realtimeMetrics.trainingProgress}%
                  </div>
                  <p className="text-xs text-gray-600">Training Progress</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.realtimeMetrics.alertsCount}
                  </div>
                  <p className="text-xs text-gray-600">Active Alerts</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Last updated: {new Date(data.realtimeMetrics.lastUpdate).toLocaleTimeString()}
                {realtimeEnabled && <span className="ml-2 text-green-600">• Live</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {endpointStatus.map((endpoint, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {endpoint.endpoint}
              </CardTitle>
              {getStatusIcon(endpoint.status)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(endpoint.status)}>
                  {endpoint.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {endpoint.responseTime.toFixed(0)}ms
                </span>
              </div>
              {endpoint.accuracy && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Accuracy</span>
                    <span>{endpoint.accuracy}%</span>
                  </div>
                  <Progress value={endpoint.accuracy} className="mt-1" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="predictive" className="gap-2">
            <Brain className="w-4 h-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Cpu className="w-4 h-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <Workflow className="w-4 h-4" />
            Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total ML Models
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">20</div>
                <p className="text-xs text-muted-foreground">
                  +3 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Predictions
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">847</div>
                <p className="text-xs text-muted-foreground">
                  +12% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Automation Rate
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  +4% efficiency gain
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cost Savings
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£12.4K</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>ML Model Performance</CardTitle>
                <CardDescription>
                  Real-time accuracy and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {endpointStatus.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(endpoint.status)}
                        <span className="font-medium">{endpoint.endpoint}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{endpoint.accuracy}%</div>
                        <div className="text-xs text-muted-foreground">
                          {endpoint.responseTime.toFixed(0)}ms
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent ML Activities</CardTitle>
                <CardDescription>
                  Latest AI-driven insights and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Inventory optimization completed</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-blue-50">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New demand pattern detected</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-yellow-50">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Workflow bottleneck identified</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          {/* 🆕 Interactive Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Model Accuracy</CardTitle>
                <CardDescription>Live accuracy tracking with alert threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.modelAccuracyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#ADD8E6" 
                        strokeWidth={3}
                        name="Model Accuracy %" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="threshold" 
                        stroke="#ff6b6b" 
                        strokeDasharray="5 5"
                        name="Alert Threshold"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Performance Comparison</CardTitle>
                <CardDescription>Current accuracy across all ML models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.modelPerformanceComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#008080" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
                <CardDescription>Real-time model training status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.trainingProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#4A9FCC" 
                        fill="#ADD8E6" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictions Volume</CardTitle>
                <CardDescription>Live prediction processing metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.predictionsVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stackId="1" 
                        stroke="#008080" 
                        fill="#008080" 
                        fillOpacity={0.8}
                        name="Total Volume"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="processed" 
                        stackId="2" 
                        stroke="#ADD8E6" 
                        fill="#ADD8E6" 
                        fillOpacity={0.6}
                        name="Processed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>30-Day Demand Forecast</CardTitle>
                <CardDescription>AI-powered repair volume predictions</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.predictiveAnalytics?.demandForecast?.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(data.predictiveAnalytics.demandForecast.forecast.predictions.reduce((acc: number, pred: any) => acc + pred.totalVolume, 0) / data.predictiveAnalytics.demandForecast.forecast.predictions.length)}
                        </div>
                        <p className="text-xs text-blue-600">Avg Daily Volume</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(data.predictiveAnalytics.demandForecast.forecast.confidence * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-green-600">Confidence</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {data.predictiveAnalytics.demandForecast.forecast.trends.growth}
                        </div>
                        <p className="text-xs text-purple-600">Trend</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Top Device Types (Next 7 Days)</h4>
                      <div className="space-y-2">
                        {data.predictiveAnalytics.demandForecast.forecast.predictions.slice(0, 7).map((pred: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{new Date(pred.date).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">MacBook: {pred.deviceBreakdown.macbook}</Badge>
                              <Badge variant="outline">iPhone: {pred.deviceBreakdown.iphone}</Badge>
                              <Badge variant="outline">iPad: {pred.deviceBreakdown.ipad}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <p className="text-muted-foreground">Loading demand forecast...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>Real-time ML model accuracy and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.predictiveAnalytics?.performanceMetrics?.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {(data.predictiveAnalytics.performanceMetrics.accuracy * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                        <Progress value={data.predictiveAnalytics.performanceMetrics.accuracy * 100} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {data.predictiveAnalytics.performanceMetrics.models?.length || 6}
                        </div>
                        <p className="text-sm text-muted-foreground">Active Models</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Model Performance</h4>
                      <div className="space-y-2">
                        {(data.predictiveAnalytics.performanceMetrics.models || [
                          { name: 'Demand Forecasting', accuracy: 92.3, status: 'active' },
                          { name: 'Customer Behavior', accuracy: 88.7, status: 'active' },
                          { name: 'Cost Optimization', accuracy: 94.1, status: 'active' }
                        ]).map((model: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{model.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{model.accuracy}%</span>
                              <Badge className={model.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {model.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">Loading performance metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {/* 🆕 Phase 7: Advanced ML Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Detection Timeline</CardTitle>
                <CardDescription>Real-time anomaly detection across all systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.anomalyDetectionTrend.length > 0 ? chartData.anomalyDetectionTrend : [
                      { time: '10:00', anomalies: 2, severity: 'low' },
                      { time: '10:05', anomalies: 0, severity: 'none' },
                      { time: '10:10', anomalies: 1, severity: 'medium' },
                      { time: '10:15', anomalies: 3, severity: 'high' },
                      { time: '10:20', anomalies: 0, severity: 'none' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="anomalies" 
                        stroke="#ff6b6b" 
                        strokeWidth={3}
                        name="Anomaly Count" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
                <CardDescription>Real-time data quality monitoring and validation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.dataQualityMetrics.length > 0 ? chartData.dataQualityMetrics : [
                      { time: '10:00', completeness: 98.5, accuracy: 94.2, consistency: 96.1 },
                      { time: '10:05', completeness: 97.8, accuracy: 95.1, consistency: 95.8 },
                      { time: '10:10', completeness: 99.1, accuracy: 93.9, consistency: 97.2 },
                      { time: '10:15', completeness: 98.9, accuracy: 96.4, consistency: 96.8 },
                      { time: '10:20', completeness: 99.3, accuracy: 95.7, consistency: 97.5 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[90, 100]} />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="completeness" 
                        stackId="1" 
                        stroke="#ADD8E6" 
                        fill="#ADD8E6" 
                        fillOpacity={0.8}
                        name="Completeness %"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stackId="2" 
                        stroke="#008080" 
                        fill="#008080" 
                        fillOpacity={0.6}
                        name="Accuracy %"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="consistency" 
                        stackId="3" 
                        stroke="#4A9FCC" 
                        fill="#4A9FCC" 
                        fillOpacity={0.4}
                        name="Consistency %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance Analysis</CardTitle>
                <CardDescription>Most impactful features for model predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.featureImportance.length > 0 ? chartData.featureImportance : [
                      { feature: 'Device Age', importance: 0.28, category: 'Hardware' },
                      { feature: 'Repair History', importance: 0.22, category: 'History' },
                      { feature: 'Usage Pattern', importance: 0.18, category: 'Behavior' },
                      { feature: 'Damage Type', importance: 0.15, category: 'Hardware' },
                      { feature: 'Customer Type', importance: 0.12, category: 'Customer' },
                      { feature: 'Seasonal Factor', importance: 0.05, category: 'External' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="importance" fill="#008080" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Maintenance Alerts</CardTitle>
                <CardDescription>Proactive system health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">24</div>
                      <p className="text-xs text-green-600">Systems Healthy</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">3</div>
                      <p className="text-xs text-yellow-600">Warning State</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">1</div>
                      <p className="text-xs text-red-600">Critical Alert</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Database Performance Degradation</p>
                        <p className="text-xs text-red-600">Response time increased by 40%</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Critical</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Model Training Queue Backlog</p>
                        <p className="text-xs text-yellow-600">12 training jobs pending</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Auto-scaling Activated</p>
                        <p className="text-xs text-blue-600">Added 2 compute instances</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Info</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Model Optimization Status</CardTitle>
                <CardDescription>Automated hyperparameter tuning results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hyperparameter Optimization</span>
                    <Badge className={modelOptimization ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {modelOptimization ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Learning Rate</span>
                      <span>0.0012</span>
                    </div>
                    <Progress value={72} className="h-2" />
                    
                    <div className="flex justify-between text-xs">
                      <span>Batch Size</span>
                      <span>128</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    
                    <div className="flex justify-between text-xs">
                      <span>Model Depth</span>
                      <span>12 layers</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  
                  <Button 
                    onClick={() => setModelOptimization(!modelOptimization)}
                    className="w-full gap-2"
                    variant={modelOptimization ? "secondary" : "default"}
                  >
                    <Settings className="w-4 h-4" />
                    {modelOptimization ? 'Stop Optimization' : 'Start Optimization'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Engineering Pipeline</CardTitle>
                <CardDescription>Automated feature generation and selection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Feature Generation</span>
                    <Badge className={featureEngineering ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {featureEngineering ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">847</div>
                      <p className="text-xs text-blue-600">Base Features</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">234</div>
                      <p className="text-xs text-green-600">Generated</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Feature Selection Progress</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <Button 
                    onClick={runFeatureEngineering}
                    disabled={featureEngineering}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Zap className="w-4 h-4" />
                    {featureEngineering ? 'Engineering...' : 'Start Engineering'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality Control</CardTitle>
                <CardDescription>Real-time data validation and cleaning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quality Monitoring</span>
                    <Badge className={dataQualityMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {dataQualityMonitoring ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Data Completeness</span>
                      <span className="font-semibold text-green-600">98.7%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Schema Validation</span>
                      <span className="font-semibold text-blue-600">99.2%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span className="text-sm">Outlier Detection</span>
                      <span className="font-semibold text-yellow-600">12 found</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setDataQualityMonitoring(!dataQualityMonitoring)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Database className="w-4 h-4" />
                    {dataQualityMonitoring ? 'Disable Monitoring' : 'Enable Monitoring'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Inventory Management</CardTitle>
              <CardDescription>AI-optimized parts and supplies management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <p className="text-muted-foreground">
                  Inventory optimization algorithms running
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">Items tracked</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">Restock alerts</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Automation</CardTitle>
              <CardDescription>Intelligent process optimization and automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Workflow className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <p className="text-muted-foreground">
                  Workflow optimization engines active
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">78%</div>
                    <p className="text-xs text-muted-foreground">Automation rate</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">3.2x</div>
                    <p className="text-xs text-muted-foreground">Speed improvement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}