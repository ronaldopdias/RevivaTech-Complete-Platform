'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useWebSocket, useWebSocketSubscription } from '@/hooks/useWebSocket';
import { 
  pricingEngine, 
  RepairOptions, 
  RepairType, 
  PriceEstimate 
} from '@/../config/pricing/pricing.engine';

interface RealtimePricingCalculatorProps {
  device: DeviceModel | null;
  selectedIssues: RepairType[];
  serviceOptions: ServiceOptions;
  onPriceUpdate?: (price: number, breakdown: PriceBreakdown) => void;
  className?: string;
  sessionId?: string;
}

interface ServiceOptions {
  service_type: 'postal' | 'pickup' | 'in_store';
  priority: 'standard' | 'priority' | 'emergency';
  customer_type: 'individual' | 'business' | 'education';
  express?: boolean;
  premium_parts?: boolean;
  data_recovery?: boolean;
  warranty?: 'standard' | 'extended' | 'premium';
  pickup_delivery?: boolean;
}

interface PriceBreakdown {
  basePrice: number;
  repairCosts: RepairCostItem[];
  serviceModifiers: ServiceModifier[];
  warranty: WarrantyOption;
  total: number;
  estimatedTime: number;
  priceAnalysis: PriceAnalysis;
}

interface RepairCostItem {
  id: string;
  name: string;
  category: string;
  baseCost: number;
  laborCost: number;
  partsCost: number;
  total: number;
  estimatedTime: number;
}

interface ServiceModifier {
  type: string;
  name: string;
  multiplier: number;
  cost: number;
}

interface WarrantyOption {
  type: string;
  duration: string;
  cost: number;
  coverage: string;
}

interface PriceAnalysis {
  competitiveRating: 'low' | 'competitive' | 'premium';
  marketComparison: string;
  valueScore: number;
  recommendations: string[];
}

interface RealTimePriceData {
  sessionId: string;
  estimatedCost: number;
  breakdown: PriceBreakdown;
  timestamp: string;
  marketData?: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    competitorCount: number;
  };
}

const categoryIcons: Record<string, string> = {
  display: '📱',
  power: '🔋',
  input: '⌨️',
  motherboard: '🔧',
  ports: '🔌',
  data: '💾',
  software: '💻',
  audio: '🔊',
  camera: '📷',
  network: '📶',
};

const categoryNames: Record<string, string> = {
  display: 'Screen & Display',
  power: 'Battery & Power',
  input: 'Keyboard & Input',
  motherboard: 'Logic Board',
  ports: 'Ports & Connectivity',
  data: 'Data Recovery',
  software: 'Software Issues',
  audio: 'Audio & Speakers',
  camera: 'Camera Systems',
  network: 'Network & WiFi',
};

export default function RealtimePricingCalculator({
  device,
  selectedIssues,
  serviceOptions,
  onPriceUpdate,
  className,
  sessionId: providedSessionId
}: RealtimePricingCalculatorProps) {
  const [realTimePricing, setRealTimePricing] = useState<RealTimePriceData | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: string; price: number }>>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { isConnected, sendMessage, connectionStatus } = useWebSocket();

  // Generate session ID if not provided
  const sessionId = useMemo(() => {
    if (providedSessionId) return providedSessionId;
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('pricing_session_id');
      if (!id) {
        id = `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('pricing_session_id', id);
      }
      return id;
    }
    return `pricing_${Date.now()}`;
  }, [providedSessionId]);

  // Real-time price updates
  useWebSocketSubscription('price_update', (data: RealTimePriceData) => {
    if (data.sessionId === sessionId) {
      setRealTimePricing(data);
      setPriceBreakdown(data.breakdown);
      setLoading(false);
      setError(null);
      
      // Add to price history for trend analysis
      setPriceHistory(prev => [
        ...prev.slice(-9), // Keep last 10 entries
        { timestamp: data.timestamp, price: data.estimatedCost }
      ]);

      // Notify parent component
      if (onPriceUpdate) {
        onPriceUpdate(data.estimatedCost, data.breakdown);
      }
    }
  });

  // Real-time market data updates
  useWebSocketSubscription('market_data_update', (data) => {
    if (data.sessionId === sessionId) {
      setRealTimePricing(prev => prev ? { ...prev, marketData: data.marketData } : null);
    }
  });

  // Error handling for pricing failures
  useWebSocketSubscription('price_calculation_error', (data) => {
    if (data.sessionId === sessionId) {
      setError(data.error);
      setLoading(false);
    }
  });

  // Request real-time price calculation
  const requestRealTimePrice = useCallback(() => {
    if (!device || selectedIssues.length === 0 || !isConnected) {
      return;
    }

    setLoading(true);
    setError(null);

    sendMessage({
      type: 'price_calculation_request',
      payload: {
        sessionId,
        device_id: device.id,
        device_category: device.category,
        device_brand: device.brand,
        device_year: device.year,
        issues: selectedIssues.map(issue => ({
          id: issue.id,
          category: issue.category,
          severity: issue.severity || 'medium',
          estimated_time: issue.repair_time_minutes || 60
        })),
        service_type: serviceOptions.service_type,
        priority: serviceOptions.priority,
        customer_type: serviceOptions.customer_type,
        options: {
          express: serviceOptions.express || false,
          premium_parts: serviceOptions.premium_parts || false,
          data_recovery: serviceOptions.data_recovery || false,
          warranty: serviceOptions.warranty || 'standard',
          pickup_delivery: serviceOptions.pickup_delivery || false,
        }
      },
      timestamp: new Date().toISOString()
    });
  }, [device, selectedIssues, serviceOptions, isConnected, sendMessage, sessionId]);

  // Trigger real-time price updates when relevant data changes
  useEffect(() => {
    if (device && selectedIssues.length > 0 && isConnected) {
      const debounceTimer = setTimeout(() => {
        requestRealTimePrice();
      }, 300); // Reduced debounce for better real-time experience
      
      return () => clearTimeout(debounceTimer);
    }
  }, [device, selectedIssues, serviceOptions, requestRealTimePrice]);

  // Calculate local fallback pricing if WebSocket is unavailable
  const fallbackPricing = useMemo(() => {
    if (!device || selectedIssues.length === 0) return null;

    try {
      const repairs = selectedIssues.map(issue => ({
        type: issue.category,
        severity: issue.severity || 'medium',
        parts_required: issue.parts_required || false,
      }));

      const estimate = pricingEngine.calculateRepairCost(device, repairs, {
        service_type: serviceOptions.service_type,
        priority: serviceOptions.priority,
        customer_type: serviceOptions.customer_type,
      });

      return estimate;
    } catch (error) {
      console.error('Fallback pricing calculation failed:', error);
      return null;
    }
  }, [device, selectedIssues, serviceOptions]);

  // Use real-time pricing if available, otherwise fall back to local calculation
  const currentPricing = realTimePricing || (fallbackPricing ? {
    sessionId,
    estimatedCost: fallbackPricing.total_cost,
    breakdown: {
      basePrice: fallbackPricing.base_cost,
      repairCosts: selectedIssues.map(issue => ({
        id: issue.id,
        name: issue.name,
        category: issue.category,
        baseCost: issue.base_cost || 50,
        laborCost: issue.labor_cost || 30,
        partsCost: issue.parts_cost || 20,
        total: issue.base_cost || 50,
        estimatedTime: issue.repair_time_minutes || 60,
      })),
      serviceModifiers: [],
      warranty: { type: 'standard', duration: '90 days', cost: 0, coverage: 'Parts & Labor' },
      total: fallbackPricing.total_cost,
      estimatedTime: fallbackPricing.estimated_time,
      priceAnalysis: {
        competitiveRating: 'competitive' as const,
        marketComparison: 'Based on local estimates',
        valueScore: 85,
        recommendations: ['Consider priority service for faster completion'],
      },
    },
    timestamp: new Date().toISOString(),
  } : null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getPriceChangeIndicator = () => {
    if (priceHistory.length < 2) return null;
    const current = priceHistory[priceHistory.length - 1].price;
    const previous = priceHistory[priceHistory.length - 2].price;
    const change = current - previous;
    const percentage = (change / previous) * 100;

    if (Math.abs(percentage) < 1) return null;

    return (
      <span className={cn(
        "text-xs font-medium",
        change > 0 ? "text-red-600" : "text-green-600"
      )}>
        {change > 0 ? '↗' : '↘'} {Math.abs(percentage).toFixed(1)}%
      </span>
    );
  };

  const getCompetitiveRatingColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'competitive': return 'text-blue-600 bg-blue-50';
      case 'premium': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!device || selectedIssues.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-lg font-medium">Select a device and issues to see pricing</p>
          <p className="text-sm mt-2">Real-time pricing will update automatically</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-gray-600">
            {isConnected ? 'Real-time pricing active' : 'Using offline estimates'}
          </span>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Calculating...</span>
          </div>
        )}
      </div>

      {/* Main Pricing Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Repair Estimate</h3>
            <p className="text-gray-600">
              {device.brand} {device.model} ({device.year})
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-gray-900">
                {currentPricing ? formatCurrency(currentPricing.estimatedCost) : '---'}
              </div>
              {getPriceChangeIndicator()}
            </div>
            {currentPricing && (
              <div className="text-sm text-gray-600">
                Estimated time: {formatTime(currentPricing.breakdown.estimatedTime)}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {currentPricing && (
          <>
            {/* Repair Items Breakdown */}
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">Repair Items</h4>
              {currentPricing.breakdown.repairCosts.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {categoryIcons[repair.category] || '🔧'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">{repair.name}</div>
                      <div className="text-sm text-gray-600">
                        {categoryNames[repair.category]} • {formatTime(repair.estimatedTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(repair.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Parts: {formatCurrency(repair.partsCost)} + Labor: {formatCurrency(repair.laborCost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Modifiers */}
            {currentPricing.breakdown.serviceModifiers.length > 0 && (
              <div className="space-y-2 mb-6">
                <h4 className="font-medium text-gray-900">Service Options</h4>
                {currentPricing.breakdown.serviceModifiers.map((modifier, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{modifier.name}</span>
                    <span className="text-gray-900">
                      {modifier.cost > 0 ? `+${formatCurrency(modifier.cost)}` : 'Included'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Price Analysis */}
            {showAnalysis && currentPricing.breakdown.priceAnalysis && (
              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Price Analysis</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Market Position</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getCompetitiveRatingColor(currentPricing.breakdown.priceAnalysis.competitiveRating)
                    )}>
                      {currentPricing.breakdown.priceAnalysis.competitiveRating}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Value Score</span>
                    <span className="font-medium">
                      {currentPricing.breakdown.priceAnalysis.valueScore}/100
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentPricing.breakdown.priceAnalysis.marketComparison}
                  </div>
                  {currentPricing.breakdown.priceAnalysis.recommendations.length > 0 && (
                    <div className="text-sm">
                      <strong className="text-gray-900">Recommendations:</strong>
                      <ul className="list-disc list-inside text-gray-600 mt-1">
                        {currentPricing.breakdown.priceAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Market Data */}
            {realTimePricing?.marketData && (
              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Market Comparison</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(realTimePricing.marketData.averagePrice)}
                    </div>
                    <div className="text-gray-600">Average Price</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(realTimePricing.marketData.priceRange.min)} - {formatCurrency(realTimePricing.marketData.priceRange.max)}
                    </div>
                    <div className="text-gray-600">Price Range</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {realTimePricing.marketData.competitorCount}
                    </div>
                    <div className="text-gray-600">Competitors</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="flex-1"
              >
                {showAnalysis ? 'Hide' : 'Show'} Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestRealTimePrice}
                disabled={!isConnected || loading}
                className="flex-1"
              >
                {loading ? 'Updating...' : 'Refresh Price'}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Price Trend (if available) */}
      {priceHistory.length > 1 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Price Trend</h4>
          <div className="flex items-end gap-1 h-16">
            {priceHistory.slice(-10).map((entry, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-200 rounded-t"
                style={{
                  height: `${(entry.price / Math.max(...priceHistory.map(h => h.price))) * 100}%`,
                  minHeight: '4px',
                }}
                title={`${new Date(entry.timestamp).toLocaleTimeString()}: ${formatCurrency(entry.price)}`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Price changes over time
          </div>
        </Card>
      )}
    </div>
  );
}