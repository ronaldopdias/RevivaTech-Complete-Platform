/**
 * Analytics Integration for Business Components
 * Phase 4 - Business Components Analytics
 * 
 * Provides seamless analytics tracking for DeviceSelector, PriceCalculator, and PaymentGateway components
 */

import { advancedAnalyticsTracker } from '../../services/AdvancedAnalyticsTracker';
import type { DeviceModel, RepairType, PriceEstimate } from '@/types/config';
import type { PaymentMethod, PaymentResult } from './PaymentGateway';

/**
 * Analytics event types for business components
 */
export enum BusinessAnalyticsEventType {
  DEVICE_SELECTOR_SEARCH = 'device_selector_search',
  DEVICE_SELECTOR_CATEGORY_CLICK = 'device_selector_category_click',
  DEVICE_SELECTOR_DEVICE_SELECT = 'device_selector_device_select',
  DEVICE_SELECTOR_POPULAR_VIEW = 'device_selector_popular_view',
  
  PRICE_CALCULATOR_REPAIR_SELECT = 'price_calculator_repair_select',
  PRICE_CALCULATOR_OPTION_TOGGLE = 'price_calculator_option_toggle',
  PRICE_CALCULATOR_ESTIMATE_VIEW = 'price_calculator_estimate_view',
  PRICE_CALCULATOR_BREAKDOWN_VIEW = 'price_calculator_breakdown_view',
  
  PAYMENT_GATEWAY_METHOD_SELECT = 'payment_gateway_method_select',
  PAYMENT_GATEWAY_FORM_START = 'payment_gateway_form_start',
  PAYMENT_GATEWAY_VALIDATION_ERROR = 'payment_gateway_validation_error',
  PAYMENT_GATEWAY_PAYMENT_START = 'payment_gateway_payment_start',
  PAYMENT_GATEWAY_PAYMENT_SUCCESS = 'payment_gateway_payment_success',
  PAYMENT_GATEWAY_PAYMENT_ERROR = 'payment_gateway_payment_error',
  
  BUSINESS_FLOW_FUNNEL_START = 'business_flow_funnel_start',
  BUSINESS_FLOW_FUNNEL_STEP = 'business_flow_funnel_step',
  BUSINESS_FLOW_FUNNEL_COMPLETE = 'business_flow_funnel_complete',
  BUSINESS_FLOW_FUNNEL_ABANDON = 'business_flow_funnel_abandon',
}

/**
 * Device Selector Analytics
 */
export class DeviceSelectorAnalytics {
  /**
   * Track device search
   */
  static trackSearch(query: string, resultsCount: number, searchDuration?: number): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.DEVICE_SELECTOR_SEARCH, {
      query: query.toLowerCase(), // Normalize for privacy
      queryLength: query.length,
      resultsCount,
      searchDuration,
      timestamp: Date.now(),
      hasResults: resultsCount > 0,
      isPopularTerm: query.toLowerCase().includes('macbook') || 
                     query.toLowerCase().includes('iphone') ||
                     query.toLowerCase().includes('ipad'),
    });
  }

  /**
   * Track category selection
   */
  static trackCategoryClick(categoryId: string, categoryName: string, deviceCount: number): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.DEVICE_SELECTOR_CATEGORY_CLICK, {
      categoryId,
      categoryName,
      deviceCount,
      timestamp: Date.now(),
    });
  }

  /**
   * Track device selection
   */
  static trackDeviceSelect(device: DeviceModel, selectionContext: 'search' | 'category' | 'popular'): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.DEVICE_SELECTOR_DEVICE_SELECT, {
      deviceId: device.id,
      deviceName: device.name,
      deviceBrand: device.brand,
      deviceYear: device.year,
      deviceCategory: device.categoryId,
      averageRepairCost: device.averageRepairCost,
      selectionContext,
      commonIssuesCount: device.commonIssues?.length || 0,
      timestamp: Date.now(),
    });
  }

  /**
   * Track popular devices view
   */
  static trackPopularView(popularDevices: DeviceModel[]): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.DEVICE_SELECTOR_POPULAR_VIEW, {
      popularDevicesCount: popularDevices.length,
      popularBrands: [...new Set(popularDevices.map(d => d.brand))],
      averageCost: Math.round(popularDevices.reduce((sum, d) => sum + d.averageRepairCost, 0) / popularDevices.length),
      timestamp: Date.now(),
    });
  }
}

/**
 * Price Calculator Analytics
 */
export class PriceCalculatorAnalytics {
  /**
   * Track repair type selection
   */
  static trackRepairSelect(device: DeviceModel, repairType: RepairType, isRecommended: boolean): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PRICE_CALCULATOR_REPAIR_SELECT, {
      deviceId: device.id,
      deviceBrand: device.brand,
      deviceYear: device.year,
      repairTypeId: repairType.id,
      repairTypeName: repairType.name,
      repairCategory: repairType.category,
      repairComplexity: repairType.complexity,
      basePriceMin: repairType.basePriceRange.min,
      basePriceMax: repairType.basePriceRange.max,
      laborHours: repairType.laborHours,
      warranty: repairType.warranty,
      isRecommended,
      timestamp: Date.now(),
    });
  }

  /**
   * Track service option toggle
   */
  static trackOptionToggle(option: string, enabled: boolean, costImpact: number): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PRICE_CALCULATOR_OPTION_TOGGLE, {
      option,
      enabled,
      costImpact,
      timestamp: Date.now(),
    });
  }

  /**
   * Track price estimate view
   */
  static trackEstimateView(estimate: PriceEstimate, device: DeviceModel, repairTypeId: string): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PRICE_CALCULATOR_ESTIMATE_VIEW, {
      deviceId: device.id,
      deviceBrand: device.brand,
      repairTypeId,
      basePrice: estimate.basePrice,
      laborCost: estimate.laborCost,
      partsCost: estimate.partsCost,
      serviceFee: estimate.serviceFee,
      totalPrice: estimate.total,
      warranty: estimate.warranty,
      estimatedTime: estimate.estimatedTime,
      confidence: estimate.confidence,
      optionsCount: estimate.options.length,
      optionsCost: estimate.options.reduce((sum, opt) => sum + opt.cost, 0),
      timestamp: Date.now(),
    });
  }

  /**
   * Track price breakdown view
   */
  static trackBreakdownView(estimate: PriceEstimate): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PRICE_CALCULATOR_BREAKDOWN_VIEW, {
      totalPrice: estimate.total,
      breakdownItemsCount: 4 + estimate.options.length, // base, labor, parts, service + options
      confidence: estimate.confidence,
      timestamp: Date.now(),
    });
  }
}

/**
 * Payment Gateway Analytics
 */
export class PaymentGatewayAnalytics {
  /**
   * Track payment method selection
   */
  static trackMethodSelect(method: PaymentMethod, previousMethod?: PaymentMethod): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PAYMENT_GATEWAY_METHOD_SELECT, {
      selectedMethod: method,
      previousMethod,
      timestamp: Date.now(),
    });
  }

  /**
   * Track payment form start
   */
  static trackFormStart(amount: number, currency: string, hasEstimate: boolean): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PAYMENT_GATEWAY_FORM_START, {
      amount,
      currency,
      hasEstimate,
      timestamp: Date.now(),
    });
  }

  /**
   * Track validation errors
   */
  static trackValidationError(field: string, errorType: string): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PAYMENT_GATEWAY_VALIDATION_ERROR, {
      field,
      errorType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track payment start
   */
  static trackPaymentStart(amount: number, method: PaymentMethod): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PAYMENT_GATEWAY_PAYMENT_START, {
      amount,
      method,
      timestamp: Date.now(),
    });
  }

  /**
   * Track payment success
   */
  static trackPaymentSuccess(result: PaymentResult, amount: number, method: PaymentMethod, duration: number): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PAYMENT_GATEWAY_PAYMENT_SUCCESS, {
      amount,
      method,
      paymentIntentId: result.paymentIntentId,
      transactionId: result.transactionId,
      processingDuration: duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Track payment error
   */
  static trackPaymentError(error: string, amount: number, method: PaymentMethod, duration: number): void {
    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.PAYMENT_GATEWAY_PAYMENT_ERROR, {
      amount,
      method,
      error: error.substring(0, 100), // Limit error message length
      processingDuration: duration,
      timestamp: Date.now(),
    });
  }
}

/**
 * Business Flow Funnel Analytics
 */
export class BusinessFlowAnalytics {
  private static funnelData: {
    sessionId: string;
    startTime: number;
    steps: Array<{
      step: string;
      timestamp: number;
      data?: any;
    }>;
  } | null = null;

  /**
   * Start business flow funnel tracking
   */
  static startFunnel(flowType: 'device_to_payment' | 'repair_booking' | 'quote_request'): void {
    this.funnelData = {
      sessionId: `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      steps: [],
    };

    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.BUSINESS_FLOW_FUNNEL_START, {
      funnelSessionId: this.funnelData.sessionId,
      flowType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track funnel step
   */
  static trackStep(stepName: string, stepData?: any): void {
    if (!this.funnelData) return;

    const step = {
      step: stepName,
      timestamp: Date.now(),
      data: stepData,
    };

    this.funnelData.steps.push(step);

    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.BUSINESS_FLOW_FUNNEL_STEP, {
      funnelSessionId: this.funnelData.sessionId,
      stepName,
      stepIndex: this.funnelData.steps.length - 1,
      timeFromStart: Date.now() - this.funnelData.startTime,
      stepData,
      timestamp: Date.now(),
    });
  }

  /**
   * Complete funnel
   */
  static completeFunnel(finalValue?: number): void {
    if (!this.funnelData) return;

    const duration = Date.now() - this.funnelData.startTime;

    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.BUSINESS_FLOW_FUNNEL_COMPLETE, {
      funnelSessionId: this.funnelData.sessionId,
      totalSteps: this.funnelData.steps.length,
      totalDuration: duration,
      finalValue,
      averageStepTime: duration / this.funnelData.steps.length,
      timestamp: Date.now(),
    });

    this.funnelData = null;
  }

  /**
   * Abandon funnel
   */
  static abandonFunnel(exitStep: string, exitReason?: string): void {
    if (!this.funnelData) return;

    const duration = Date.now() - this.funnelData.startTime;

    advancedAnalyticsTracker.trackCustom(BusinessAnalyticsEventType.BUSINESS_FLOW_FUNNEL_ABANDON, {
      funnelSessionId: this.funnelData.sessionId,
      exitStep,
      exitReason,
      stepsCompleted: this.funnelData.steps.length,
      timeToAbandon: duration,
      timestamp: Date.now(),
    });

    this.funnelData = null;
  }

  /**
   * Get current funnel data
   */
  static getCurrentFunnel() {
    return this.funnelData ? { ...this.funnelData } : null;
  }
}

/**
 * Utility functions for analytics integration
 */
export class BusinessAnalyticsUtils {
  /**
   * Initialize business components analytics
   */
  static initialize(): void {
    // Track page visibility for funnel abandonment
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && BusinessFlowAnalytics.getCurrentFunnel()) {
        BusinessFlowAnalytics.abandonFunnel('page_hidden', 'visibility_change');
      }
    });

    // Track page unload for funnel abandonment
    window.addEventListener('beforeunload', () => {
      if (BusinessFlowAnalytics.getCurrentFunnel()) {
        BusinessFlowAnalytics.abandonFunnel('page_unload', 'navigation');
      }
    });
  }

  /**
   * Get analytics summary for business components
   */
  static getAnalyticsSummary(): {
    isEnabled: boolean;
    queueSize: number;
    isHealthy: boolean;
    activeFunnel: boolean;
  } {
    return {
      isEnabled: advancedAnalyticsTracker.isHealthy(),
      queueSize: advancedAnalyticsTracker.getQueueSize(),
      isHealthy: advancedAnalyticsTracker.isHealthy(),
      activeFunnel: BusinessFlowAnalytics.getCurrentFunnel() !== null,
    };
  }

  /**
   * Generate analytics report for business components
   */
  static generateReport(): {
    timestamp: number;
    trackerHealth: any;
    funnelStatus: any;
    stats: any;
  } {
    return {
      timestamp: Date.now(),
      trackerHealth: advancedAnalyticsTracker.getHealthStatus(),
      funnelStatus: BusinessFlowAnalytics.getCurrentFunnel(),
      stats: advancedAnalyticsTracker.getStats(),
    };
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  BusinessAnalyticsUtils.initialize();
}

export {
  DeviceSelectorAnalytics,
  PriceCalculatorAnalytics,
  PaymentGatewayAnalytics,
  BusinessFlowAnalytics,
  BusinessAnalyticsUtils,
};