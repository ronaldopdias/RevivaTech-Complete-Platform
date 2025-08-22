/**
 * Custom Report Builder Component
 * Drag-and-drop interface for creating custom analytics reports
 * Part of Phase 8 R2.1 implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  Play, 
  Eye, 
  Settings, 
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Table,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ReportMetric {
  id: string;
  name: string;
  label: string;
  type: 'number' | 'currency' | 'percentage';
  description: string;
}

interface ReportDimension {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'date' | 'number';
  description: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string;
  label: string;
}

interface ReportConfig {
  name: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  filters: ReportFilter[];
  timeframe: string;
  chart_type: 'bar' | 'line' | 'pie' | 'area' | 'table';
  format: 'json' | 'csv' | 'pdf';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  metrics: string[];
  dimensions: string[];
  timeframe: string;
}

interface GeneratedReport {
  name: string;
  description: string;
  generated_at: string;
  timeframe: string;
  data: any[];
  summary: any;
  total_rows: number;
}

const CustomReportBuilder: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    metrics: [],
    dimensions: [],
    filters: [],
    timeframe: '30d',
    chart_type: 'bar',
    format: 'json'
  });

  const [availableMetrics] = useState<ReportMetric[]>([
    { id: 'unique_visitors', name: 'unique_visitors', label: 'Unique Visitors', type: 'number', description: 'Number of unique visitors' },
    { id: 'total_events', name: 'total_events', label: 'Total Events', type: 'number', description: 'Total number of events' },
    { id: 'page_views', name: 'page_views', label: 'Page Views', type: 'number', description: 'Total page views' },
    { id: 'bookings', name: 'bookings', label: 'Bookings', type: 'number', description: 'Number of completed bookings' },
    { id: 'revenue', name: 'revenue', label: 'Revenue', type: 'currency', description: 'Total revenue generated' },
    { id: 'avg_session_duration', name: 'avg_session_duration', label: 'Avg Session Duration', type: 'number', description: 'Average session duration in seconds' },
    { id: 'bounce_rate', name: 'bounce_rate', label: 'Bounce Rate', type: 'percentage', description: 'Percentage of single-page sessions' }
  ]);

  const [availableDimensions] = useState<ReportDimension[]>([
    { id: 'date', name: 'date', label: 'Date', type: 'date', description: 'Group by date' },
    { id: 'hour', name: 'hour', label: 'Hour', type: 'number', description: 'Group by hour of day' },
    { id: 'page_url', name: 'page_url', label: 'Page URL', type: 'string', description: 'Group by page URL' },
    { id: 'event_type', name: 'event_type', label: 'Event Type', type: 'string', description: 'Group by event type' },
    { id: 'device_type', name: 'device_type', label: 'Device Type', type: 'string', description: 'Group by device type' },
    { id: 'utm_source', name: 'utm_source', label: 'UTM Source', type: 'string', description: 'Group by traffic source' },
    { id: 'service_type', name: 'service_type', label: 'Service Type', type: 'string', description: 'Group by service type' }
  ]);

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/business-intelligence/reports/templates', {
        headers: { 'Authorization': 'Bearer admin-api-key' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;
    
    if (source.droppableId === 'available-metrics' && destination.droppableId === 'selected-metrics') {
      const metric = availableMetrics.find(m => m.id === result.draggableId);
      if (metric && !reportConfig.metrics.includes(metric.name)) {
        setReportConfig(prev => ({
          ...prev,
          metrics: [...prev.metrics, metric.name]
        }));
      }
    }
    
    if (source.droppableId === 'available-dimensions' && destination.droppableId === 'selected-dimensions') {
      const dimension = availableDimensions.find(d => d.id === result.draggableId);
      if (dimension && !reportConfig.dimensions.includes(dimension.name)) {
        setReportConfig(prev => ({
          ...prev,
          dimensions: [...prev.dimensions, dimension.name]
        }));
      }
    }
    
    if (source.droppableId === 'selected-metrics' && destination.droppableId === 'available-metrics') {
      const metricIndex = result.draggableId.split('-')[1];
      const newMetrics = [...reportConfig.metrics];
      newMetrics.splice(parseInt(metricIndex), 1);
      setReportConfig(prev => ({ ...prev, metrics: newMetrics }));
    }
    
    if (source.droppableId === 'selected-dimensions' && destination.droppableId === 'available-dimensions') {
      const dimensionIndex = result.draggableId.split('-')[1];
      const newDimensions = [...reportConfig.dimensions];
      newDimensions.splice(parseInt(dimensionIndex), 1);
      setReportConfig(prev => ({ ...prev, dimensions: newDimensions }));
    }
  };

  const removeMetric = (index: number) => {
    const newMetrics = [...reportConfig.metrics];
    newMetrics.splice(index, 1);
    setReportConfig(prev => ({ ...prev, metrics: newMetrics }));
  };

  const removeDimension = (index: number) => {
    const newDimensions = [...reportConfig.dimensions];
    newDimensions.splice(index, 1);
    setReportConfig(prev => ({ ...prev, dimensions: newDimensions }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: 'page_url',
      operator: 'contains',
      value: '',
      label: 'New Filter'
    };
    
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: string) => {
    const newFilters = [...reportConfig.filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setReportConfig(prev => ({ ...prev, filters: newFilters }));
  };

  const removeFilter = (index: number) => {
    const newFilters = [...reportConfig.filters];
    newFilters.splice(index, 1);
    setReportConfig(prev => ({ ...prev, filters: newFilters }));
  };

  const generateReport = async () => {
    if (!reportConfig.name || reportConfig.metrics.length === 0 || reportConfig.dimensions.length === 0) {
      setError('Please provide a name, select at least one metric, and one dimension');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/business-intelligence/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-api-key'
        },
        body: JSON.stringify(reportConfig)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }
      
      const data = await response.json();
      setGeneratedReport(data.data);
      
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadTemplate = (template: ReportTemplate) => {
    setReportConfig(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      metrics: template.metrics,
      dimensions: template.dimensions,
      timeframe: template.timeframe
    }));
  };

  const saveReport = async () => {
    // TODO: Implement save functionality
    console.log('Save report functionality');
  };

  const exportReport = async () => {
    if (!generatedReport) return;
    
    // TODO: Implement export functionality
    console.log('Export report functionality');
  };

  const renderChart = () => {
    if (!generatedReport || !generatedReport.data.length) return null;
    
    const data = generatedReport.data;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    switch (reportConfig.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={reportConfig.dimensions[0]} />
              <YAxis />
              <Tooltip />
              {reportConfig.metrics.map((metric, index) => (
                <Bar key={metric} dataKey={metric} fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={reportConfig.dimensions[0]} />
              <YAxis />
              <Tooltip />
              {reportConfig.metrics.map((metric, index) => (
                <Line 
                  key={metric} 
                  type="monotone" 
                  dataKey={metric} 
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={reportConfig.dimensions[0]} />
              <YAxis />
              <Tooltip />
              {reportConfig.metrics.map((metric, index) => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        const pieData = data.map(item => ({
          name: item[reportConfig.dimensions[0]],
          value: item[reportConfig.metrics[0]]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  {reportConfig.dimensions.map(dimension => (
                    <th key={dimension} className="border border-gray-300 p-2 text-left font-medium">
                      {availableDimensions.find(d => d.name === dimension)?.label || dimension}
                    </th>
                  ))}
                  {reportConfig.metrics.map(metric => (
                    <th key={metric} className="border border-gray-300 p-2 text-left font-medium">
                      {availableMetrics.find(m => m.name === metric)?.label || metric}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {reportConfig.dimensions.map(dimension => (
                      <td key={dimension} className="border border-gray-300 p-2">
                        {row[dimension]}
                      </td>
                    ))}
                    {reportConfig.metrics.map(metric => (
                      <td key={metric} className="border border-gray-300 p-2">
                        {row[metric]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Report Builder</h2>
          <p className="text-gray-600">Create custom analytics reports with drag-and-drop interface</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={saveReport} variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={generateReport} disabled={isGenerating} size="sm">
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      placeholder="Enter report name"
                      value={reportConfig.name}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="report-description">Description</Label>
                    <Textarea
                      id="report-description"
                      placeholder="Enter report description"
                      value={reportConfig.description}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeframe">Timeframe</Label>
                      <Select value={reportConfig.timeframe} onValueChange={(value) => setReportConfig(prev => ({ ...prev, timeframe: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">Last Hour</SelectItem>
                          <SelectItem value="24h">Last 24 Hours</SelectItem>
                          <SelectItem value="7d">Last 7 Days</SelectItem>
                          <SelectItem value="30d">Last 30 Days</SelectItem>
                          <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <Select value={reportConfig.chart_type} onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, chart_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select value={reportConfig.format} onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, format: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Drag and Drop Interface */}
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Available Metrics</Label>
                        <Droppable droppableId="available-metrics">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[100px] space-y-2"
                            >
                              {availableMetrics.map((metric, index) => (
                                <Draggable key={metric.id} draggableId={metric.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-blue-50 border border-blue-200 rounded p-2 cursor-move hover:bg-blue-100"
                                    >
                                      <div className="font-medium text-sm">{metric.label}</div>
                                      <div className="text-xs text-gray-600">{metric.description}</div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Selected Metrics</Label>
                        <Droppable droppableId="selected-metrics">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="border-2 border-dashed border-green-300 rounded-lg p-4 min-h-[100px] space-y-2"
                            >
                              {reportConfig.metrics.map((metric, index) => {
                                const metricDef = availableMetrics.find(m => m.name === metric);
                                return (
                                  <Draggable key={`selected-metric-${index}`} draggableId={`selected-metric-${index}`} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-green-50 border border-green-200 rounded p-2 cursor-move hover:bg-green-100 flex items-center justify-between"
                                      >
                                        <div>
                                          <div className="font-medium text-sm">{metricDef?.label || metric}</div>
                                          <div className="text-xs text-gray-600">{metricDef?.description}</div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeMetric(index)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dimensions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Dimensions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Available Dimensions</Label>
                        <Droppable droppableId="available-dimensions">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[100px] space-y-2"
                            >
                              {availableDimensions.map((dimension, index) => (
                                <Draggable key={dimension.id} draggableId={dimension.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-purple-50 border border-purple-200 rounded p-2 cursor-move hover:bg-purple-100"
                                    >
                                      <div className="font-medium text-sm">{dimension.label}</div>
                                      <div className="text-xs text-gray-600">{dimension.description}</div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Selected Dimensions</Label>
                        <Droppable droppableId="selected-dimensions">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="border-2 border-dashed border-orange-300 rounded-lg p-4 min-h-[100px] space-y-2"
                            >
                              {reportConfig.dimensions.map((dimension, index) => {
                                const dimensionDef = availableDimensions.find(d => d.name === dimension);
                                return (
                                  <Draggable key={`selected-dimension-${index}`} draggableId={`selected-dimension-${index}`} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-orange-50 border border-orange-200 rounded p-2 cursor-move hover:bg-orange-100 flex items-center justify-between"
                                      >
                                        <div>
                                          <div className="font-medium text-sm">{dimensionDef?.label || dimension}</div>
                                          <div className="text-xs text-gray-600">{dimensionDef?.description}</div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeDimension(index)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DragDropContext>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Filters</span>
                    <Button onClick={addFilter} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Filter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reportConfig.filters.map((filter, index) => (
                    <div key={filter.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Select value={filter.field} onValueChange={(value) => updateFilter(index, 'field', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDimensions.map(dimension => (
                            <SelectItem key={dimension.id} value={dimension.name}>
                              {dimension.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={filter.operator} onValueChange={(value) => updateFilter(index, 'operator', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="between">Between</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Filter value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFilter(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {reportConfig.filters.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No filters configured. Click "Add Filter" to add filtering options.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {template.metrics.length} metrics, {template.dimensions.length} dimensions
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadTemplate(template)}
                            >
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedReport ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{generatedReport.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {generatedReport.total_rows} rows
                        </Badge>
                        <Button onClick={exportReport} size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">{generatedReport.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Generated on {new Date(generatedReport.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {renderChart()}
                    
                    {generatedReport.summary && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Summary Statistics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(generatedReport.summary).map(([key, value]: [string, any]) => (
                            <div key={key} className="text-center">
                              <div className="text-lg font-bold">{value.total || value.count || 0}</div>
                              <div className="text-sm text-gray-600">{key.replace(/_/g, ' ')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Generate a report to see preview</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Report Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Metrics</span>
                  <Badge variant="outline">{reportConfig.metrics.length}</Badge>
                </div>
                <div className="space-y-1">
                  {reportConfig.metrics.map((metric) => {
                    const metricDef = availableMetrics.find(m => m.name === metric);
                    return (
                      <div key={metric} className="text-sm text-gray-600">
                        • {metricDef?.label || metric}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dimensions</span>
                  <Badge variant="outline">{reportConfig.dimensions.length}</Badge>
                </div>
                <div className="space-y-1">
                  {reportConfig.dimensions.map((dimension) => {
                    const dimensionDef = availableDimensions.find(d => d.name === dimension);
                    return (
                      <div key={dimension} className="text-sm text-gray-600">
                        • {dimensionDef?.label || dimension}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filters</span>
                  <Badge variant="outline">{reportConfig.filters.length}</Badge>
                </div>
                <div className="space-y-1">
                  {reportConfig.filters.map((filter) => (
                    <div key={filter.id} className="text-sm text-gray-600">
                      • {filter.field} {filter.operator} {filter.value}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Timeframe</div>
                    <div className="text-gray-600">{reportConfig.timeframe}</div>
                  </div>
                  <div>
                    <div className="font-medium">Chart Type</div>
                    <div className="text-gray-600">{reportConfig.chart_type}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {generatedReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Report Generated</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Data Points</div>
                  <div className="text-gray-600">{generatedReport.total_rows}</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Generated At</div>
                  <div className="text-gray-600">
                    {new Date(generatedReport.generated_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;