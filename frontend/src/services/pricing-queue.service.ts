/**
 * Dynamic Pricing Queue Service
 * 
 * Provides real-time pricing updates based on:
 * - Current repair queue status and workload
 * - Technician availability and expertise
 * - Part availability and shipping times
 * - Priority and rush order modifiers
 * - Seasonal demand fluctuations
 * - Customer loyalty and history
 * 
 * Configuration-driven architecture following Nordic design principles
 */

import { webSocketService } from './websocket.service';
import { DeviceModel } from '@/lib/services/types';

export interface QueueStatus {
  totalActiveRepairs: number;
  averageWaitTime: number; // minutes
  currentCapacity: number; // percentage
  peakHours: boolean;
  estimatedSlotAvailability: Date;
  technicianAvailability: TechnicianAvailability[];
  partAvailability: PartAvailability[];
}

export interface TechnicianAvailability {
  id: string;
  name: string;
  specialties: string[];
  currentWorkload: number; // percentage
  averageCompletionTime: number; // minutes
  qualityRating: number; // 1-5
  status: 'available' | 'busy' | 'break' | 'off-duty';
  nextAvailable?: Date;
}

export interface PartAvailability {
  partId: string;
  partName: string;
  inStock: number;
  incomingStock: number;
  estimatedDelivery?: Date;
  supplier: string;
  cost: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DynamicPricing {
  basePrice: number;
  adjustedPrice: number;
  adjustmentFactors: PricingAdjustment[];
  estimatedCompletion: Date;
  confidence: number; // 0-1
  validUntil: Date;
  rushAvailable: boolean;
  rushPrice?: number;
  rushCompletion?: Date;
}

export interface PricingAdjustment {
  factor: string;
  description: string;
  adjustment: number; // percentage
  type: 'discount' | 'surcharge';
  reason: string;
}

export interface QueueMetrics {
  hourlyThroughput: number;
  averageRepairTime: number;
  currentBacklog: number;
  peakCapacity: number;
  bottlenecks: QueueBottleneck[];
  forecasts: QueueForecast[];
}

export interface QueueBottleneck {
  type: 'technician' | 'parts' | 'equipment' | 'quality-check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedResolution?: Date;
  impact: string;
}

export interface QueueForecast {
  timeframe: string; // e.g., 'next_hour', 'today', 'this_week'
  expectedVolume: number;
  capacityUtilization: number;
  recommendedActions: string[];
}

interface PricingQueueConfig {
  enableDynamicPricing: boolean;
  priceUpdateInterval: number; // minutes
  maxPriceAdjustment: number; // percentage
  rushOrderMultiplier: number;
  loyaltyDiscountThreshold: number; // number of previous orders
  peakHourMultiplier: number;
  debug: boolean;
}

interface PricingSubscription {
  id: string;
  deviceId: string;
  repairType: string;
  callback: (pricing: DynamicPricing) => void;
  filter?: (pricing: DynamicPricing) => boolean;
}

class PricingQueueService {
  private config: PricingQueueConfig;
  private currentQueueStatus: QueueStatus | null = null;
  private subscriptions = new Map<string, PricingSubscription>();
  private pricingCache = new Map<string, DynamicPricing>();
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PricingQueueConfig>) {
    this.config = {
      enableDynamicPricing: true,
      priceUpdateInterval: 5, // 5 minutes
      maxPriceAdjustment: 25, // 25% max adjustment
      rushOrderMultiplier: 1.5,
      loyaltyDiscountThreshold: 5,
      peakHourMultiplier: 1.15,
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };

    this.initializeService();
  }

  /**
   * Get current queue status
   */
  async getQueueStatus(): Promise<QueueStatus | null> {
    try {
      const response = await fetch('/api/queue/status');
      if (!response.ok) {
        throw new Error(`Failed to fetch queue status: ${response.statusText}`);
      }

      const status: QueueStatus = await response.json();
      this.currentQueueStatus = status;
      
      this.log('Queue status updated', status);
      return status;
    } catch (error) {
      this.log('Error fetching queue status', error);
      return null;
    }
  }

  /**
   * Get dynamic pricing for a specific repair
   */
  async getDynamicPricing(
    device: DeviceModel,
    repairType: string,
    customerContext?: {
      loyaltyLevel?: number;
      previousOrders?: number;
      rushRequired?: boolean;
    }
  ): Promise<DynamicPricing | null> {
    const cacheKey = `${device.id}_${repairType}`;
    
    // Check cache first
    const cached = this.pricingCache.get(cacheKey);
    if (cached && cached.validUntil > new Date()) {
      this.log('Returning cached dynamic pricing', { cacheKey });
      return cached;
    }

    try {
      const response = await fetch('/api/pricing/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          repairType,
          customerContext,
          queueStatus: this.currentQueueStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dynamic pricing: ${response.statusText}`);
      }

      const pricing: DynamicPricing = await response.json();
      
      // Cache the pricing
      this.pricingCache.set(cacheKey, pricing);
      
      // Notify subscribers
      this.notifyPricingSubscribers(device.id, repairType, pricing);

      this.log('Dynamic pricing fetched', { cacheKey, pricing });
      return pricing;
    } catch (error) {
      this.log('Error fetching dynamic pricing', { cacheKey, error });
      return null;
    }
  }

  /**
   * Subscribe to real-time pricing updates
   */
  subscribeToPricingUpdates(
    deviceId: string,
    repairType: string,
    callback: (pricing: DynamicPricing) => void,
    filter?: (pricing: DynamicPricing) => boolean
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      deviceId,
      repairType,
      callback,
      filter,
    });

    this.log('Pricing subscription created', { subscriptionId, deviceId, repairType });
    return subscriptionId;
  }

  /**
   * Unsubscribe from pricing updates
   */
  unsubscribeFromPricingUpdates(subscriptionId: string): boolean {
    const success = this.subscriptions.delete(subscriptionId);
    if (success) {
      this.log('Pricing subscription removed', { subscriptionId });
    }
    return success;
  }

  /**
   * Get queue metrics and analytics
   */
  async getQueueMetrics(): Promise<QueueMetrics | null> {
    try {
      const response = await fetch('/api/queue/metrics');
      if (!response.ok) {
        throw new Error(`Failed to fetch queue metrics: ${response.statusText}`);
      }

      const metrics: QueueMetrics = await response.json();
      this.log('Queue metrics fetched', metrics);
      return metrics;
    } catch (error) {
      this.log('Error fetching queue metrics', error);
      return null;
    }
  }

  /**
   * Calculate pricing adjustment factors
   */
  calculatePricingAdjustments(
    basePrice: number,
    queueStatus: QueueStatus,
    customerContext?: any
  ): PricingAdjustment[] {
    const adjustments: PricingAdjustment[] = [];

    // Queue capacity adjustment
    if (queueStatus.currentCapacity > 85) {
      adjustments.push({
        factor: 'high_demand',
        description: 'High demand surcharge',
        adjustment: 15,
        type: 'surcharge',
        reason: 'Workshop operating at near capacity',
      });
    } else if (queueStatus.currentCapacity < 50) {
      adjustments.push({
        factor: 'low_demand',
        description: 'Low demand discount',
        adjustment: 10,
        type: 'discount',
        reason: 'Workshop has available capacity',
      });
    }

    // Peak hours adjustment
    if (queueStatus.peakHours) {
      adjustments.push({
        factor: 'peak_hours',
        description: 'Peak hours surcharge',
        adjustment: Math.round((this.config.peakHourMultiplier - 1) * 100),
        type: 'surcharge',
        reason: 'High demand during peak hours',
      });
    }

    // Wait time adjustment
    if (queueStatus.averageWaitTime > 480) { // More than 8 hours
      adjustments.push({
        factor: 'extended_wait',
        description: 'Extended wait discount',
        adjustment: 8,
        type: 'discount',
        reason: 'Compensation for longer than usual wait time',
      });
    }

    // Customer loyalty adjustment
    if (customerContext?.previousOrders >= this.config.loyaltyDiscountThreshold) {
      const discountPercent = Math.min(
        customerContext.previousOrders * 2,
        15 // Max 15% loyalty discount
      );
      adjustments.push({
        factor: 'loyalty_discount',
        description: 'Loyalty customer discount',
        adjustment: discountPercent,
        type: 'discount',
        reason: `${customerContext.previousOrders} previous orders`,
      });
    }

    // Technician availability adjustment
    const availableTechs = queueStatus.technicianAvailability.filter(
      t => t.status === 'available' && t.currentWorkload < 80
    );
    
    if (availableTechs.length === 0) {
      adjustments.push({
        factor: 'limited_availability',
        description: 'Limited technician availability',
        adjustment: 12,
        type: 'surcharge',
        reason: 'All senior technicians currently busy',
      });
    }

    // Parts availability adjustment
    const criticalPartsUnavailable = queueStatus.partAvailability.some(
      p => p.priority === 'high' && p.inStock === 0
    );
    
    if (criticalPartsUnavailable) {
      adjustments.push({
        factor: 'parts_delay',
        description: 'Parts procurement delay',
        adjustment: 5,
        type: 'surcharge',
        reason: 'Required parts need to be ordered',
      });
    }

    return adjustments;
  }

  /**
   * Apply pricing adjustments to base price
   */
  applyPricingAdjustments(
    basePrice: number,
    adjustments: PricingAdjustment[]
  ): number {
    let adjustedPrice = basePrice;
    let totalAdjustment = 0;

    for (const adjustment of adjustments) {
      const factor = adjustment.type === 'discount' ? -1 : 1;
      const adjustmentAmount = basePrice * (adjustment.adjustment / 100) * factor;
      
      adjustedPrice += adjustmentAmount;
      totalAdjustment += adjustment.adjustment * factor;
    }

    // Apply maximum adjustment limit
    const maxAdjustmentAmount = basePrice * (this.config.maxPriceAdjustment / 100);
    const actualAdjustmentAmount = adjustedPrice - basePrice;

    if (Math.abs(actualAdjustmentAmount) > maxAdjustmentAmount) {
      adjustedPrice = basePrice + Math.sign(actualAdjustmentAmount) * maxAdjustmentAmount;
    }

    return Math.round(adjustedPrice * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Estimate completion time based on queue status
   */
  estimateCompletionTime(
    repairType: string,
    queueStatus: QueueStatus,
    rushOrder = false
  ): Date {
    // Base repair time estimates (in minutes)
    const baseRepairTimes = {
      'screen-replacement': 60,
      'battery-replacement': 45,
      'water-damage': 180,
      'motherboard-repair': 240,
      'data-recovery': 360,
      'software-issue': 30,
      'charging-port': 90,
      'camera-repair': 75,
      'speaker-repair': 60,
      'button-repair': 45,
      'diagnostic': 30,
      'general-repair': 120,
    };

    const baseTime = baseRepairTimes[repairType as keyof typeof baseRepairTimes] || 120;
    
    // Add queue wait time
    let estimatedTime = queueStatus.averageWaitTime + baseTime;

    // Apply rush order modifier
    if (rushOrder) {
      estimatedTime = Math.min(estimatedTime * 0.3, baseTime + 30); // Rush orders skip most of the queue
    }

    // Apply capacity modifier
    const capacityMultiplier = Math.max(1, queueStatus.currentCapacity / 100);
    estimatedTime *= capacityMultiplier;

    return new Date(Date.now() + estimatedTime * 60 * 1000);
  }

  /**
   * Get pricing confidence based on queue predictability
   */
  calculatePricingConfidence(queueStatus: QueueStatus): number {
    let confidence = 1.0;

    // Reduce confidence during peak times
    if (queueStatus.peakHours) {
      confidence -= 0.1;
    }

    // Reduce confidence if capacity is very high or very low
    if (queueStatus.currentCapacity > 90 || queueStatus.currentCapacity < 20) {
      confidence -= 0.15;
    }

    // Reduce confidence if there are critical bottlenecks
    const hasBottlenecks = queueStatus.technicianAvailability.every(t => t.currentWorkload > 85);
    if (hasBottlenecks) {
      confidence -= 0.2;
    }

    return Math.max(0.5, confidence); // Minimum 50% confidence
  }

  /**
   * Clear pricing cache
   */
  clearPricingCache(): void {
    this.pricingCache.clear();
    this.log('Pricing cache cleared');
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.subscriptions.clear();
    this.clearPricingCache();
    this.log('PricingQueueService destroyed');
  }

  // Private methods

  private initializeService(): void {
    // Setup WebSocket subscriptions
    webSocketService.subscribe('queue-update', (data) => {
      this.handleQueueUpdate(data);
    });

    webSocketService.subscribe('pricing-update', (data) => {
      this.handlePricingUpdate(data);
    });

    // Start periodic updates
    this.startPeriodicUpdates();

    this.log('PricingQueueService initialized');
  }

  private handleQueueUpdate(data: any): void {
    this.currentQueueStatus = data.queueStatus;
    
    // Invalidate pricing cache when queue status changes significantly
    if (this.shouldInvalidateCache(data)) {
      this.clearPricingCache();
    }

    this.log('Queue status update received', data.queueStatus);
  }

  private handlePricingUpdate(data: any): void {
    const { deviceId, repairType, pricing } = data;
    const cacheKey = `${deviceId}_${repairType}`;
    
    // Update cache
    this.pricingCache.set(cacheKey, pricing);
    
    // Notify subscribers
    this.notifyPricingSubscribers(deviceId, repairType, pricing);

    this.log('Pricing update received', { deviceId, repairType });
  }

  private shouldInvalidateCache(data: any): boolean {
    // Invalidate cache if significant queue changes occur
    const thresholds = {
      capacityChange: 10, // 10% capacity change
      waitTimeChange: 60, // 60 minute wait time change
      technicianStatusChange: true,
    };

    // Add logic to compare with previous state
    return true; // For now, always invalidate on queue updates
  }

  private notifyPricingSubscribers(
    deviceId: string,
    repairType: string,
    pricing: DynamicPricing
  ): void {
    this.subscriptions.forEach((subscription) => {
      if (subscription.deviceId === deviceId && subscription.repairType === repairType) {
        if (!subscription.filter || subscription.filter(pricing)) {
          try {
            subscription.callback(pricing);
          } catch (error) {
            this.log('Error in pricing subscriber callback', error);
          }
        }
      }
    });
  }

  private startPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      await this.getQueueStatus();
    }, this.config.priceUpdateInterval * 60 * 1000);

    this.log('Periodic updates started', { interval: this.config.priceUpdateInterval });
  }

  private generateSubscriptionId(): string {
    return `pricing_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[PricingQueue] ${message}`, data || '');
    }
  }
}

// Create singleton instance
export const pricingQueueService = new PricingQueueService();

export default PricingQueueService;