/**
 * Dynamic Pricing Service with Real-Time Updates
 * 
 * Provides live pricing adjustments based on:
 * - Queue length and technician availability
 * - Peak/off-peak hours
 * - Service demand patterns
 * - Express service premiums
 * - Promotional campaigns
 * - Real-time market conditions
 * 
 * Configuration-driven architecture following Nordic design principles
 */

import { webSocketService, WebSocketEventType } from './websocket.service';
import { DeviceModel } from '@/lib/services/types';
import { pricingEngine, PriceEstimate, RepairOptions } from '@/../config/pricing/pricing.engine';

export interface DynamicPricingFactors {
  queueLength: number;
  availableTechnicians: number;
  peakHoursMultiplier: number;
  demandLevel: 'low' | 'normal' | 'high' | 'very-high';
  expressServicePremium: number;
  seasonalAdjustment: number;
  promotionalDiscount: number;
  marketConditions: 'stable' | 'volatile' | 'trending-up' | 'trending-down';
}

export interface DynamicPriceUpdate {
  basePrice: number;
  adjustedPrice: number;
  factors: DynamicPricingFactors;
  adjustmentPercentage: number;
  validUntil: number;
  confidence: number;
  recommendation: 'accept' | 'wait' | 'urgent';
  reasoning: string[];
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: PricingCondition[];
  adjustment: PricingAdjustment;
}

export interface PricingCondition {
  type: 'queue-length' | 'time-of-day' | 'day-of-week' | 'demand-level' | 'technician-availability';
  operator: 'gt' | 'lt' | 'eq' | 'between' | 'in';
  value: any;
  weight: number;
}

export interface PricingAdjustment {
  type: 'percentage' | 'fixed-amount' | 'multiplier';
  value: number;
  cap?: number; // Maximum adjustment
  floor?: number; // Minimum adjustment
}

interface DynamicPricingConfig {
  autoConnect: boolean;
  updateInterval: number; // milliseconds
  maxPriceIncrease: number; // percentage
  maxPriceDecrease: number; // percentage
  enableNotifications: boolean;
  debug: boolean;
}

type PriceUpdateCallback = (update: DynamicPriceUpdate) => void;

class DynamicPricingService {
  private config: DynamicPricingConfig;
  private currentFactors: DynamicPricingFactors | null = null;
  private pricingRules: PricingRule[] = [];
  private callbacks = new Map<string, Set<PriceUpdateCallback>>();
  private isConnected = false;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<DynamicPricingConfig>) {
    this.config = {
      autoConnect: true,
      updateInterval: 30000, // 30 seconds
      maxPriceIncrease: 50, // 50% max increase
      maxPriceDecrease: 30, // 30% max decrease
      enableNotifications: true,
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };

    this.initializePricingRules();
    this.setupWebSocketListeners();

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to real-time pricing updates
   */
  async connect(): Promise<void> {
    try {
      await webSocketService.connect();
      this.isConnected = true;
      this.startPeriodicUpdates();
      this.log('DynamicPricingService connected');
    } catch (error) {
      this.log('Failed to connect DynamicPricingService', error);
      throw error;
    }
  }

  /**
   * Disconnect from real-time pricing
   */
  disconnect(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.isConnected = false;
    this.log('DynamicPricingService disconnected');
  }

  /**
   * Subscribe to price updates for specific repair types
   */
  subscribeToPriceUpdates(
    repairTypes: string[], 
    callback: PriceUpdateCallback
  ): () => void {
    const subscriptionId = this.generateSubscriptionId();
    
    repairTypes.forEach(repairType => {
      if (!this.callbacks.has(repairType)) {
        this.callbacks.set(repairType, new Set());
      }
      this.callbacks.get(repairType)!.add(callback);
    });

    this.log('Subscribed to price updates', { subscriptionId, repairTypes });

    // Return unsubscribe function
    return () => {
      repairTypes.forEach(repairType => {
        const callbacks = this.callbacks.get(repairType);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.callbacks.delete(repairType);
          }
        }
      });
    };
  }

  /**
   * Get current dynamic pricing for device and repair
   */
  async getDynamicPrice(
    device: DeviceModel,
    repairTypeId: string,
    options: RepairOptions = {}
  ): Promise<DynamicPriceUpdate> {
    // Get base price from pricing engine
    const baseEstimate = pricingEngine.calculatePrice(device, repairTypeId, options);
    const basePrice = baseEstimate.total;

    // Get current pricing factors
    const factors = await this.getCurrentFactors();
    
    // Apply dynamic adjustments
    const adjustedPrice = this.calculateDynamicPrice(basePrice, factors);
    
    // Calculate adjustment percentage
    const adjustmentPercentage = ((adjustedPrice - basePrice) / basePrice) * 100;
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(factors, adjustmentPercentage);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(factors, adjustmentPercentage);

    const update: DynamicPriceUpdate = {
      basePrice,
      adjustedPrice,
      factors,
      adjustmentPercentage,
      validUntil: Date.now() + (15 * 60 * 1000), // Valid for 15 minutes
      confidence: this.calculateConfidence(factors),
      recommendation,
      reasoning,
    };

    this.log('Dynamic price calculated', update);
    return update;
  }

  /**
   * Get current market factors
   */
  async getCurrentFactors(): Promise<DynamicPricingFactors> {
    if (this.currentFactors) {
      return this.currentFactors;
    }

    // Fetch from API or use defaults
    try {
      const response = await fetch('/api/pricing/factors', {
        credentials: 'include'
      });
      if (response.ok) {
        this.currentFactors = await response.json();
      } else {
        this.currentFactors = this.getDefaultFactors();
      }
    } catch (error) {
      this.log('Error fetching pricing factors, using defaults', error);
      this.currentFactors = this.getDefaultFactors();
    }

    return this.currentFactors;
  }

  /**
   * Update pricing factors manually
   */
  updateFactors(factors: Partial<DynamicPricingFactors>): void {
    this.currentFactors = {
      ...this.currentFactors || this.getDefaultFactors(),
      ...factors,
    };

    this.log('Pricing factors updated', this.currentFactors);
    this.notifySubscribers();
  }

  /**
   * Get pricing recommendations for optimal booking time
   */
  async getPricingRecommendations(
    device: DeviceModel,
    repairTypeId: string,
    options: RepairOptions = {}
  ): Promise<{
    current: DynamicPriceUpdate;
    nextHour: DynamicPriceUpdate;
    tomorrow: DynamicPriceUpdate;
    optimal: { time: string; price: number; savings: number };
  }> {
    const current = await this.getDynamicPrice(device, repairTypeId, options);
    
    // Simulate future pricing (in real implementation, this would use historical data and ML)
    const nextHourFactors = this.simulateFactors(1); // 1 hour ahead
    const tomorrowFactors = this.simulateFactors(24); // 24 hours ahead
    
    const nextHour: DynamicPriceUpdate = {
      ...current,
      factors: nextHourFactors,
      adjustedPrice: this.calculateDynamicPrice(current.basePrice, nextHourFactors),
      adjustmentPercentage: 0, // Will be recalculated
    };
    nextHour.adjustmentPercentage = ((nextHour.adjustedPrice - current.basePrice) / current.basePrice) * 100;

    const tomorrow: DynamicPriceUpdate = {
      ...current,
      factors: tomorrowFactors,
      adjustedPrice: this.calculateDynamicPrice(current.basePrice, tomorrowFactors),
      adjustmentPercentage: 0, // Will be recalculated
    };
    tomorrow.adjustmentPercentage = ((tomorrow.adjustedPrice - current.basePrice) / current.basePrice) * 100;

    // Find optimal time (lowest price)
    const prices = [
      { time: 'Now', price: current.adjustedPrice },
      { time: 'Next Hour', price: nextHour.adjustedPrice },
      { time: 'Tomorrow', price: tomorrow.adjustedPrice },
    ];
    
    const optimal = prices.reduce((min, item) => 
      item.price < min.price ? item : min
    );
    
    const optimalResult = {
      time: optimal.time,
      price: optimal.price,
      savings: current.adjustedPrice - optimal.price,
    };

    return {
      current,
      nextHour,
      tomorrow,
      optimal: optimalResult,
    };
  }

  // Private methods

  private setupWebSocketListeners(): void {
    webSocketService.addEventListener('connection-state', (state) => {
      this.isConnected = state === 'connected';
      this.log('WebSocket connection state changed', state);
    });

    // Subscribe to pricing factor updates
    webSocketService.subscribe('pricing-update', (data) => {
      this.handlePricingUpdate(data);
    });

    // Subscribe to queue updates
    webSocketService.subscribe('queue-update', (data) => {
      if (data.queueLength !== undefined || data.availableTechnicians !== undefined) {
        this.updateFactors({
          queueLength: data.queueLength,
          availableTechnicians: data.availableTechnicians,
        });
      }
    });
  }

  private handlePricingUpdate(data: any): void {
    this.log('Received pricing update', data);
    
    if (data.factors) {
      this.updateFactors(data.factors);
    }
  }

  private startPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      try {
        const factors = await this.getCurrentFactors();
        this.notifySubscribers();
      } catch (error) {
        this.log('Error in periodic update', error);
      }
    }, this.config.updateInterval);
  }

  private calculateDynamicPrice(basePrice: number, factors: DynamicPricingFactors): number {
    let adjustedPrice = basePrice;

    // Apply pricing rules
    this.pricingRules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        if (this.evaluateRuleConditions(rule.conditions, factors)) {
          adjustedPrice = this.applyAdjustment(adjustedPrice, rule.adjustment);
        }
      });

    // Apply caps
    const maxIncrease = basePrice * (this.config.maxPriceIncrease / 100);
    const maxDecrease = basePrice * (this.config.maxPriceDecrease / 100);
    
    adjustedPrice = Math.min(adjustedPrice, basePrice + maxIncrease);
    adjustedPrice = Math.max(adjustedPrice, basePrice - maxDecrease);

    return Math.round(adjustedPrice * 100) / 100; // Round to 2 decimal places
  }

  private evaluateRuleConditions(conditions: PricingCondition[], factors: DynamicPricingFactors): boolean {
    return conditions.every(condition => {
      let factorValue: any;
      
      switch (condition.type) {
        case 'queue-length':
          factorValue = factors.queueLength;
          break;
        case 'demand-level':
          factorValue = factors.demandLevel;
          break;
        case 'technician-availability':
          factorValue = factors.availableTechnicians;
          break;
        case 'time-of-day':
          factorValue = new Date().getHours();
          break;
        case 'day-of-week':
          factorValue = new Date().getDay();
          break;
        default:
          return false;
      }

      switch (condition.operator) {
        case 'gt':
          return factorValue > condition.value;
        case 'lt':
          return factorValue < condition.value;
        case 'eq':
          return factorValue === condition.value;
        case 'between':
          return factorValue >= condition.value[0] && factorValue <= condition.value[1];
        case 'in':
          return condition.value.includes(factorValue);
        default:
          return false;
      }
    });
  }

  private applyAdjustment(price: number, adjustment: PricingAdjustment): number {
    let adjustedPrice = price;

    switch (adjustment.type) {
      case 'percentage':
        adjustedPrice = price * (1 + adjustment.value / 100);
        break;
      case 'fixed-amount':
        adjustedPrice = price + adjustment.value;
        break;
      case 'multiplier':
        adjustedPrice = price * adjustment.value;
        break;
    }

    // Apply caps if defined
    if (adjustment.cap !== undefined) {
      adjustedPrice = Math.min(adjustedPrice, price + adjustment.cap);
    }
    if (adjustment.floor !== undefined) {
      adjustedPrice = Math.max(adjustedPrice, price + adjustment.floor);
    }

    return adjustedPrice;
  }

  private generateRecommendation(
    factors: DynamicPricingFactors, 
    adjustmentPercentage: number
  ): 'accept' | 'wait' | 'urgent' {
    if (adjustmentPercentage > 20) {
      return 'wait'; // Prices are high, wait for better rates
    } else if (adjustmentPercentage < -10) {
      return 'urgent'; // Great deal, book now
    } else {
      return 'accept'; // Fair pricing
    }
  }

  private generateReasoning(
    factors: DynamicPricingFactors, 
    adjustmentPercentage: number
  ): string[] {
    const reasoning: string[] = [];

    if (factors.queueLength > 10) {
      reasoning.push(`High queue volume (${factors.queueLength} bookings) increasing prices`);
    }
    
    if (factors.availableTechnicians < 3) {
      reasoning.push(`Limited technician availability (${factors.availableTechnicians}) affecting pricing`);
    }
    
    if (factors.peakHoursMultiplier > 1) {
      reasoning.push(`Peak hours surcharge (${((factors.peakHoursMultiplier - 1) * 100).toFixed(0)}%)`);
    }
    
    if (factors.demandLevel === 'high' || factors.demandLevel === 'very-high') {
      reasoning.push(`High demand period affecting availability and pricing`);
    }
    
    if (factors.promotionalDiscount > 0) {
      reasoning.push(`Promotional discount applied (${factors.promotionalDiscount}% off)`);
    }
    
    if (adjustmentPercentage > 0) {
      reasoning.push(`Current market conditions favor scheduling for later`);
    } else if (adjustmentPercentage < -5) {
      reasoning.push(`Excellent timing for booking with current pricing`);
    }

    return reasoning;
  }

  private calculateConfidence(factors: DynamicPricingFactors): number {
    // Simple confidence calculation based on data freshness and completeness
    let confidence = 100;
    
    if (!factors.queueLength) confidence -= 20;
    if (!factors.availableTechnicians) confidence -= 20;
    if (factors.marketConditions === 'volatile') confidence -= 30;
    
    return Math.max(confidence, 50); // Minimum 50% confidence
  }

  private simulateFactors(hoursAhead: number): DynamicPricingFactors {
    const current = this.currentFactors || this.getDefaultFactors();
    
    // Simple simulation (in production, use ML models)
    return {
      ...current,
      queueLength: Math.max(0, current.queueLength + Math.random() * 4 - 2),
      availableTechnicians: Math.max(1, current.availableTechnicians + Math.random() * 2 - 1),
      peakHoursMultiplier: this.getPeakHoursMultiplier(hoursAhead),
      demandLevel: this.simulateDemandLevel(hoursAhead),
    };
  }

  private getPeakHoursMultiplier(hoursAhead: number): number {
    const targetHour = (new Date().getHours() + hoursAhead) % 24;
    
    // Peak hours: 9-12 and 14-17 (business hours)
    if ((targetHour >= 9 && targetHour <= 12) || (targetHour >= 14 && targetHour <= 17)) {
      return 1.2; // 20% surcharge
    }
    
    return 1.0; // No surcharge
  }

  private simulateDemandLevel(hoursAhead: number): 'low' | 'normal' | 'high' | 'very-high' {
    const dayOfWeek = new Date().getDay();
    const hour = (new Date().getHours() + hoursAhead) % 24;
    
    // Weekend has lower demand
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'low';
    }
    
    // Business hours have higher demand
    if (hour >= 9 && hour <= 17) {
      return Math.random() > 0.5 ? 'high' : 'normal';
    }
    
    return 'normal';
  }

  private notifySubscribers(): void {
    this.callbacks.forEach((callbackSet, repairType) => {
      callbackSet.forEach(callback => {
        try {
          // In a real implementation, we'd calculate the specific price update
          // For now, we just trigger the callback
          const mockUpdate: DynamicPriceUpdate = {
            basePrice: 100,
            adjustedPrice: 110,
            factors: this.currentFactors || this.getDefaultFactors(),
            adjustmentPercentage: 10,
            validUntil: Date.now() + 900000,
            confidence: 85,
            recommendation: 'accept',
            reasoning: ['Market conditions updated'],
          };
          callback(mockUpdate);
        } catch (error) {
          this.log('Error in price update callback', error);
        }
      });
    });
  }

  private getDefaultFactors(): DynamicPricingFactors {
    return {
      queueLength: 5,
      availableTechnicians: 3,
      peakHoursMultiplier: 1.0,
      demandLevel: 'normal',
      expressServicePremium: 1.5,
      seasonalAdjustment: 1.0,
      promotionalDiscount: 0,
      marketConditions: 'stable',
    };
  }

  private initializePricingRules(): void {
    this.pricingRules = [
      {
        id: 'peak-hours',
        name: 'Peak Hours Surcharge',
        description: 'Apply surcharge during business hours',
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: 'time-of-day',
            operator: 'between',
            value: [9, 17],
            weight: 1,
          },
        ],
        adjustment: {
          type: 'percentage',
          value: 20,
          cap: 50,
        },
      },
      {
        id: 'high-queue',
        name: 'High Queue Surcharge',
        description: 'Increase prices when queue is long',
        enabled: true,
        priority: 2,
        conditions: [
          {
            type: 'queue-length',
            operator: 'gt',
            value: 10,
            weight: 1,
          },
        ],
        adjustment: {
          type: 'percentage',
          value: 15,
          cap: 30,
        },
      },
      {
        id: 'low-demand-discount',
        name: 'Low Demand Discount',
        description: 'Offer discount during low demand periods',
        enabled: true,
        priority: 3,
        conditions: [
          {
            type: 'demand-level',
            operator: 'eq',
            value: 'low',
            weight: 1,
          },
        ],
        adjustment: {
          type: 'percentage',
          value: -10,
          floor: -25,
        },
      },
    ];
  }

  private generateSubscriptionId(): string {
    return `price_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[DynamicPricingService] ${message}`, data || '');
    }
  }
}

// Create singleton instance
export const dynamicPricingService = new DynamicPricingService();

export default DynamicPricingService;