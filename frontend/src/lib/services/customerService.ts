import { ApiClient } from './apiClient';
import {
  CustomerService,
  Customer,
  CustomerData,
  ApiResponse,
  ServiceHealthCheck,
  ServiceConfig,
  BaseService,
} from './types';

export class CustomerServiceImpl extends BaseService implements CustomerService {
  private apiClient: ApiClient;

  constructor(config: ServiceConfig) {
    super(config);
    this.apiClient = new ApiClient(config);
  }

  async createCustomer(customerData: CustomerData): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.apiClient.post<{success: boolean, customer: Customer}>('/', customerData);
      return {
        success: true,
        data: response.data.customer,
        message: 'Customer created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer'
      };
    }
  }

  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.apiClient.get<{success: boolean, customer: Customer}>(`/${customerId}`);
      return {
        success: true,
        data: response.data.customer,
        message: 'Customer retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer'
      };
    }
  }

  async updateCustomer(customerId: string, updates: Partial<CustomerData>): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.apiClient.put<{success: boolean, customer: Customer}>(`/${customerId}`, updates);
      return {
        success: true,
        data: response.data.customer,
        message: 'Customer updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer'
      };
    }
  }

  async getCustomerBookings(customerId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.apiClient.get<{success: boolean, bookings: any[]}>(`/${customerId}/bookings`);
      return {
        success: true,
        data: response.data.bookings,
        message: 'Bookings retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      };
    }
  }

  async deleteCustomer(customerId: string): Promise<ApiResponse<boolean>> {
    try {
      await this.apiClient.delete<{success: boolean}>(`/${customerId}`);
      return {
        success: true,
        data: true,
        message: 'Customer deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer'
      };
    }
  }

  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await this.apiClient.get<{success: boolean, customers: Customer[]}>(`/search?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        data: response.data.customers,
        message: 'Search completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  async healthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic endpoint access (will return auth error but confirms service is up)
      await this.apiClient.get('/', {
        timeout: 5000,
        retryAttempts: 0,
        cache: false,
      });

      return {
        service: 'customer-service',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      // If it's an auth error, service is still healthy
      if (error instanceof Error && error.message.includes('Authentication required')) {
        return {
          service: 'customer-service',
          status: 'healthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }
      return {
        service: 'customer-service',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Factory function to create customer service instance
export const createCustomerService = (config: ServiceConfig): CustomerService => {
  return new CustomerServiceImpl(config);
};

export default CustomerServiceImpl;