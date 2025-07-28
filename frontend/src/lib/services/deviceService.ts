import {
  DeviceService,
  DeviceCategory,
  DeviceModel,
  RepairType,
  RepairPricing,
  ApiResponse,
  ServiceHealthCheck,
  ServiceConfig,
  BaseService,
} from './types';
import { ApiClient } from './apiClient';

export class DeviceServiceImpl extends BaseService implements DeviceService {
  private apiClient: ApiClient;

  constructor(config: ServiceConfig) {
    super(config);
    this.apiClient = new ApiClient(config);
  }

  async getCategories(): Promise<ApiResponse<DeviceCategory[]>> {
    try {
      const response = await this.apiClient.get<{success: boolean, categories: DeviceCategory[]}>('/categories');
      return {
        success: true,
        data: response.data.categories,
        message: 'Categories retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }

  async getDeviceModels(params?: {
    category?: string;
    categoryId?: string;
    brand?: string;
    brandId?: string;
    year?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<DeviceModel[]>> {
    try {
      const queryParams = new URLSearchParams();
      // Support both category (slug) and categoryId - prefer categoryId for backend compatibility
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
      else if (params?.category) queryParams.append('categoryId', params.category);
      // Support both brand (slug) and brandId - prefer brandId for backend compatibility  
      if (params?.brandId) queryParams.append('brandId', params.brandId);
      else if (params?.brand) queryParams.append('brandId', params.brand);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const url = `/models/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.apiClient.get<{ success: boolean, models: DeviceModel[], pagination: any }>(url);
      
      return {
        success: true,
        data: response.data.models,
        message: 'Device models retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch device models'
      };
    }
  }

  async getDeviceDetails(deviceId: string): Promise<ApiResponse<DeviceModel>> {
    try {
      const response = await this.apiClient.get<{ device: DeviceModel }>(`/api/devices/${deviceId}`);
      return {
        success: true,
        data: response.data.device,
        message: 'Device details retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch device details'
      };
    }
  }

  async getRepairTypes(deviceId: string): Promise<ApiResponse<RepairType[]>> {
    try {
      // For now, return common repair types
      // TODO: Implement backend endpoint for device-specific repair types
      const commonRepairTypes: RepairType[] = [
        {
          id: 'screen_crack',
          name: 'Screen Replacement',
          description: 'Replace cracked or damaged screen',
          category: 'display',
          difficulty: 'medium',
          estimatedTime: '2-3 hours',
          partsRequired: ['screen', 'adhesive'],
          toolsRequired: ['screwdriver', 'suction_cup'],
          basePrice: 200
        },
        {
          id: 'battery_replacement',
          name: 'Battery Replacement',
          description: 'Replace degraded battery',
          category: 'power',
          difficulty: 'easy',
          estimatedTime: '1-2 hours',
          partsRequired: ['battery'],
          toolsRequired: ['screwdriver'],
          basePrice: 80
        },
        {
          id: 'keyboard_repair',
          name: 'Keyboard Repair',
          description: 'Fix or replace keyboard keys',
          category: 'input',
          difficulty: 'medium',
          estimatedTime: '1-2 hours',
          partsRequired: ['keyboard'],
          toolsRequired: ['screwdriver'],
          basePrice: 150
        }
      ];

      return {
        success: true,
        data: commonRepairTypes,
        message: 'Repair types retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair types'
      };
    }
  }

  async calculateRepairPricing(request: {
    deviceId: string;
    repairTypes: string[];
    urgency?: 'standard' | 'express' | 'same_day';
    serviceType?: 'drop_off' | 'pickup' | 'mail_in';
  }): Promise<ApiResponse<RepairPricing>> {
    try {
      const pricingRequest = {
        device_id: request.deviceId,
        issues: request.repairTypes.map(type => ({
          id: type,
          description: `${type} repair`
        })),
        service_type: request.urgency || 'standard',
        priority: 'medium'
      };

      const response = await this.apiClient.post<{
        quote_id: string;
        pricing: {
          final_cost: number;
          base_cost: number;
          adjustments: any[];
        };
        timing: {
          estimated_hours: number;
          estimated_completion: string;
        };
        terms: {
          deposit_required: number;
          warranty_months: number;
        };
      }>('/api/pricing/calculate', pricingRequest);

      const pricing: RepairPricing = {
        total: response.data.pricing.final_cost,
        basePrice: response.data.pricing.base_cost,
        parts: response.data.pricing.adjustments
          .filter(adj => adj.type === 'parts')
          .reduce((sum, adj) => sum + adj.adjustment, 0),
        labor: response.data.pricing.adjustments
          .filter(adj => adj.type === 'labor')
          .reduce((sum, adj) => sum + adj.adjustment, 0),
        urgencyFee: request.urgency === 'express' ? 50 : request.urgency === 'same_day' ? 100 : 0,
        serviceFee: request.serviceType === 'pickup' ? 25 : request.serviceType === 'mail_in' ? 15 : 0,
        estimatedTime: `${response.data.timing.estimated_hours} hours`,
        warranty: `${response.data.terms.warranty_months} months`,
        quoteId: response.data.quote_id
      };

      return {
        success: true,
        data: pricing,
        message: 'Pricing calculated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate pricing'
      };
    }
  }

  async searchDevices(query: string, filters?: {
    category?: string;
    brand?: string;
    yearRange?: [number, number];
    priceRange?: [number, number];
  }): Promise<ApiResponse<DeviceModel[]>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('search', query);
      
      if (filters?.category) queryParams.append('category', filters.category);
      if (filters?.brand) queryParams.append('brand', filters.brand);
      if (filters?.yearRange) {
        queryParams.append('year_min', filters.yearRange[0].toString());
        queryParams.append('year_max', filters.yearRange[1].toString());
      }

      const response = await this.apiClient.get<{ success: boolean, models: DeviceModel[] }>(`/models/search?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data.models,
        message: 'Search completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  async getPopularDevices(category?: string, limit?: number): Promise<ApiResponse<DeviceModel[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append('category', category);
      if (limit) queryParams.append('limit', limit.toString());

      const response = await this.apiClient.get<DeviceModel[]>(`/api/devices/meta/popular?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Popular devices retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch popular devices'
      };
    }
  }

  async healthCheck(): Promise<ServiceHealthCheck> {
    try {
      const response = await this.apiClient.get<any>('/categories');
      return {
        serviceName: 'DeviceService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: response.responseTime || 0,
        message: 'Service is operational'
      };
    } catch (error) {
      return {
        serviceName: 'DeviceService',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: 0,
        message: error instanceof Error ? error.message : 'Service unavailable'
      };
    }
  }
}