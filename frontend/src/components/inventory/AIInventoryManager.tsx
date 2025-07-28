'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Zap,
  BarChart3,
  Clock,
  DollarSign,
  ShoppingCart,
  Bell,
  Filter,
  Search,
  Download,
  RefreshCw,
  Star,
  Target
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface InventoryItem {
  id: string;
  name: string;
  category: 'screen' | 'battery' | 'camera' | 'speaker' | 'charging_port' | 'motherboard' | 'tool';
  deviceCompatibility: string[];
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  averageUsage: number; // per week
  cost: number;
  supplier: string;
  leadTime: number; // days
  quality: 'oem' | 'aftermarket' | 'refurbished';
  lastRestocked: Date;
  predictedRunOut: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface PredictiveForecast {
  itemId: string;
  nextWeekDemand: number;
  nextMonthDemand: number;
  confidence: number;
  seasonalFactor: number;
  trendFactor: number;
  optimalOrderQuantity: number;
  optimalOrderDate: Date;
  costSavingOpportunity: number;
}

interface AIRecommendation {
  type: 'reorder' | 'overstock' | 'substitute' | 'price_optimization' | 'supplier_change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  itemId: string;
  title: string;
  description: string;
  impact: {
    financial: number;
    operational: string;
    timeframe: string;
  };
  action: string;
  confidence: number;
}

interface SupplierPerformance {
  id: string;
  name: string;
  reliability: number;
  qualityScore: number;
  averageDeliveryTime: number;
  priceCompetitiveness: number;
  totalOrders: number;
  onTimeDelivery: number;
  defectRate: number;
}

interface AIInventoryManagerProps {
  onInventoryUpdate?: (items: InventoryItem[]) => void;
  onRecommendationAction?: (recommendation: AIRecommendation) => void;
  showPredictiveAnalytics?: boolean;
  autoReorderEnabled?: boolean;
  className?: string;
}

export default function AIInventoryManager({
  onInventoryUpdate,
  onRecommendationAction,
  showPredictiveAnalytics = true,
  autoReorderEnabled = false,
  className = ''
}: AIInventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [forecasts, setForecasts] = useState<PredictiveForecast[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPerformance[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoReorder, setAutoReorder] = useState(autoReorderEnabled);

  // Mock inventory data
  const generateMockInventory = (): InventoryItem[] => {
    return [
      {
        id: 'inv1',
        name: 'iPhone 15 Screen Assembly',
        category: 'screen',
        deviceCompatibility: ['iPhone 15', 'iPhone 15 Plus'],
        currentStock: 8,
        minimumStock: 15,
        maximumStock: 50,
        averageUsage: 12,
        cost: 89.99,
        supplier: 'TechParts Ltd',
        leadTime: 3,
        quality: 'oem',
        lastRestocked: new Date('2025-01-10'),
        predictedRunOut: new Date('2025-01-25'),
        trend: 'increasing'
      },
      {
        id: 'inv2',
        name: 'MacBook Pro Battery (M3)',
        category: 'battery',
        deviceCompatibility: ['MacBook Pro 14"', 'MacBook Pro 16"'],
        currentStock: 12,
        minimumStock: 8,
        maximumStock: 25,
        averageUsage: 4,
        cost: 159.99,
        supplier: 'Apple Authorized',
        leadTime: 5,
        quality: 'oem',
        lastRestocked: new Date('2025-01-15'),
        predictedRunOut: new Date('2025-02-15'),
        trend: 'stable'
      },
      {
        id: 'inv3',
        name: 'Samsung Galaxy S24 Camera Module',
        category: 'camera',
        deviceCompatibility: ['Galaxy S24', 'Galaxy S24+'],
        currentStock: 3,
        minimumStock: 10,
        maximumStock: 30,
        averageUsage: 6,
        cost: 75.50,
        supplier: 'Samsung Parts Direct',
        leadTime: 7,
        quality: 'oem',
        lastRestocked: new Date('2025-01-05'),
        predictedRunOut: new Date('2025-01-22'),
        trend: 'decreasing'
      },
      {
        id: 'inv4',
        name: 'Universal Precision Screwdriver Set',
        category: 'tool',
        deviceCompatibility: ['All devices'],
        currentStock: 25,
        minimumStock: 5,
        maximumStock: 40,
        averageUsage: 1,
        cost: 45.00,
        supplier: 'ToolMaster Pro',
        leadTime: 2,
        quality: 'aftermarket',
        lastRestocked: new Date('2024-12-20'),
        predictedRunOut: new Date('2025-06-15'),
        trend: 'stable'
      }
    ];
  };

  const generatePredictiveForecasts = (items: InventoryItem[]): PredictiveForecast[] => {
    return items.map(item => ({
      itemId: item.id,
      nextWeekDemand: Math.ceil(item.averageUsage * (0.8 + Math.random() * 0.4)),
      nextMonthDemand: Math.ceil(item.averageUsage * 4 * (0.9 + Math.random() * 0.3)),
      confidence: 75 + Math.floor(Math.random() * 20),
      seasonalFactor: 0.9 + Math.random() * 0.2,
      trendFactor: item.trend === 'increasing' ? 1.2 : item.trend === 'decreasing' ? 0.8 : 1.0,
      optimalOrderQuantity: Math.ceil((item.maximumStock - item.currentStock) * 0.8),
      optimalOrderDate: new Date(Date.now() + (item.leadTime + 2) * 24 * 60 * 60 * 1000),
      costSavingOpportunity: Math.floor(Math.random() * 200) + 50
    }));
  };

  const generateAIRecommendations = (items: InventoryItem[], forecasts: PredictiveForecast[]): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];

    // Check for low stock items
    items.forEach(item => {
      if (item.currentStock <= item.minimumStock) {
        const forecast = forecasts.find(f => f.itemId === item.id);
        recommendations.push({
          type: 'reorder',
          priority: item.currentStock < item.minimumStock * 0.5 ? 'critical' : 'high',
          itemId: item.id,
          title: `Reorder Required: ${item.name}`,
          description: `Stock is critically low (${item.currentStock} units). Predicted to run out in ${Math.ceil((new Date(item.predictedRunOut).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days.`,
          impact: {
            financial: forecast?.costSavingOpportunity || 100,
            operational: 'Prevent stockout and service disruption',
            timeframe: `${item.leadTime} days delivery`
          },
          action: `Order ${forecast?.optimalOrderQuantity || item.minimumStock} units from ${item.supplier}`,
          confidence: forecast?.confidence || 85
        });
      }
    });

    // Check for overstock items
    items.forEach(item => {
      if (item.currentStock > item.maximumStock * 0.9) {
        recommendations.push({
          type: 'overstock',
          priority: 'medium',
          itemId: item.id,
          title: `Overstock Alert: ${item.name}`,
          description: `Current stock (${item.currentStock}) exceeds optimal levels. Consider reducing next order.`,
          impact: {
            financial: item.cost * (item.currentStock - item.maximumStock * 0.7),
            operational: 'Reduce storage costs and improve cash flow',
            timeframe: 'Next order cycle'
          },
          action: 'Reduce next order quantity by 30%',
          confidence: 78
        });
      }
    });

    // Price optimization opportunities
    const expensiveItems = items.filter(item => item.cost > 100 && item.quality !== 'oem');
    if (expensiveItems.length > 0) {
      const item = expensiveItems[0];
      recommendations.push({
        type: 'price_optimization',
        priority: 'medium',
        itemId: item.id,
        title: `Cost Optimization: ${item.name}`,
        description: 'Alternative suppliers found with 15-20% cost savings while maintaining quality.',
        impact: {
          financial: item.cost * 0.18 * item.averageUsage * 12, // Annual savings
          operational: 'Maintain quality while reducing costs',
          timeframe: 'Next order'
        },
        action: 'Evaluate alternative suppliers with competitive pricing',
        confidence: 82
      });
    }

    return recommendations;
  };

  const generateSupplierPerformance = (): SupplierPerformance[] => {
    return [
      {
        id: 'sup1',
        name: 'TechParts Ltd',
        reliability: 92,
        qualityScore: 89,
        averageDeliveryTime: 3.2,
        priceCompetitiveness: 85,
        totalOrders: 145,
        onTimeDelivery: 94,
        defectRate: 2.1
      },
      {
        id: 'sup2',
        name: 'Apple Authorized',
        reliability: 98,
        qualityScore: 97,
        averageDeliveryTime: 4.8,
        priceCompetitiveness: 72,
        totalOrders: 89,
        onTimeDelivery: 98,
        defectRate: 0.5
      },
      {
        id: 'sup3',
        name: 'Samsung Parts Direct',
        reliability: 87,
        qualityScore: 91,
        averageDeliveryTime: 6.1,
        priceCompetitiveness: 88,
        totalOrders: 67,
        onTimeDelivery: 89,
        defectRate: 1.8
      }
    ];
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const items = generateMockInventory();
    const predictiveForecasts = generatePredictiveForecasts(items);
    const aiRecommendations = generateAIRecommendations(items, predictiveForecasts);
    const supplierData = generateSupplierPerformance();
    
    setInventory(items);
    setForecasts(predictiveForecasts);
    setRecommendations(aiRecommendations);
    setSuppliers(supplierData);
    
    setIsAnalyzing(false);
    
    if (onInventoryUpdate) {
      onInventoryUpdate(items);
    }
  };

  const handleRecommendationAction = (recommendation: AIRecommendation) => {
    if (onRecommendationAction) {
      onRecommendationAction(recommendation);
    }
    
    // Simulate implementing the recommendation
    setRecommendations(prev => prev.filter(r => r.itemId !== recommendation.itemId));
  };

  const getStockStatus = (item: InventoryItem): { color: string; status: string } => {
    const stockRatio = item.currentStock / item.minimumStock;
    
    if (stockRatio <= 0.5) {
      return { color: 'text-red-600 bg-red-100', status: 'Critical' };
    } else if (stockRatio <= 1.0) {
      return { color: 'text-orange-600 bg-orange-100', status: 'Low' };
    } else if (stockRatio >= 2.0) {
      return { color: 'text-blue-600 bg-blue-100', status: 'High' };
    } else {
      return { color: 'text-green-600 bg-green-100', status: 'Good' };
    }
  };

  const getTrendIcon = (trend: string) => {
    const icons = {
      increasing: <TrendingUp className="w-4 h-4 text-green-500" />,
      decreasing: <TrendingDown className="w-4 h-4 text-red-500" />,
      stable: <div className="w-4 h-1 bg-gray-400 rounded" />
    };
    return icons[trend as keyof typeof icons];
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.deviceCompatibility.some(device => 
                           device.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    runAIAnalysis();
  }, []);

  useEffect(() => {
    if (autoReorder) {
      // Simulate auto-reorder logic
      const criticalItems = inventory.filter(item => item.currentStock <= item.minimumStock * 0.5);
      if (criticalItems.length > 0) {
        console.log('Auto-reorder triggered for:', criticalItems.map(item => item.name));
      }
    }
  }, [autoReorder, inventory]);

  if (isAnalyzing) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI Inventory Analysis</h3>
            <p className="text-sm text-gray-600">Processing inventory data and generating forecasts...</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">AI Inventory Manager</h2>
            <p className="text-sm text-gray-600">Predictive inventory optimization and management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto-Reorder</span>
            <button
              onClick={() => setAutoReorder(!autoReorder)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoReorder ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoReorder ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <Button variant="outline" size="sm" onClick={runAIAnalysis}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {inventory.length}
          </div>
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-xs text-green-600 mt-1">
            {inventory.filter(item => getStockStatus(item).status === 'Good').length} optimal stock
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {inventory.filter(item => item.currentStock <= item.minimumStock).length}
          </div>
          <div className="text-sm text-gray-600">Low Stock Items</div>
          <div className="text-xs text-red-600 mt-1">
            {inventory.filter(item => item.currentStock <= item.minimumStock * 0.5).length} critical
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            £{forecasts.reduce((sum, f) => sum + f.costSavingOpportunity, 0)}
          </div>
          <div className="text-sm text-gray-600">Potential Savings</div>
          <div className="text-xs text-blue-600 mt-1">
            Through optimization
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length)}%
          </div>
          <div className="text-sm text-gray-600">AI Confidence</div>
          <div className="text-xs text-purple-600 mt-1">
            Prediction accuracy
          </div>
        </Card>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Brain className="w-5 h-5 text-purple-600 mr-2" />
            AI Recommendations ({recommendations.length})
          </h3>
          
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <Card key={index} className="p-4 border-l-4 border-purple-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-800">{recommendation.title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                    <div className="text-xs text-gray-500">
                      Financial Impact: £{recommendation.impact.financial} | 
                      Confidence: {recommendation.confidence}%
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleRecommendationAction(recommendation)}
                    className="ml-4"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Apply
                  </Button>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Recommended Action:</strong> {recommendation.action}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="screen">Screens</option>
            <option value="battery">Batteries</option>
            <option value="camera">Cameras</option>
            <option value="speaker">Speakers</option>
            <option value="charging_port">Charging Ports</option>
            <option value="tool">Tools</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredInventory.length} of {inventory.length} items
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Item</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Usage/Week</th>
                <th className="pb-3">Trend</th>
                <th className="pb-3">Predicted Runout</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const forecast = forecasts.find(f => f.itemId === item.id);
                
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-800">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.deviceCompatibility.slice(0, 2).join(', ')}
                          {item.deviceCompatibility.length > 2 && ' +more'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-gray-800">{item.currentStock}</div>
                      <div className="text-xs text-gray-500">Min: {item.minimumStock}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-gray-800">{item.averageUsage}</div>
                      {forecast && (
                        <div className="text-xs text-blue-600">
                          Predicted: {forecast.nextWeekDemand}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(item.trend)}
                        <span className="text-xs capitalize">{item.trend}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-gray-800">
                        {Math.ceil((item.predictedRunOut.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.predictedRunOut.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-gray-800">£{item.cost}</div>
                      <div className="text-xs text-gray-500 capitalize">{item.quality}</div>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        {item.currentStock <= item.minimumStock && (
                          <Button size="sm" variant="primary">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Reorder
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplier Performance */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 text-green-600 mr-2" />
          Supplier Performance Analytics
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-gray-800">{supplier.name}</div>
                <div className="text-sm text-green-600">{supplier.reliability}%</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quality Score:</span>
                  <span className="font-medium">{supplier.qualityScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Delivery:</span>
                  <span className="font-medium">{supplier.averageDeliveryTime} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>On-Time:</span>
                  <span className="font-medium">{supplier.onTimeDelivery}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Defect Rate:</span>
                  <span className="font-medium">{supplier.defectRate}%</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500">
                  {supplier.totalOrders} total orders
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}