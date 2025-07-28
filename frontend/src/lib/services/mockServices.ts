import {
  BookingService,
  CustomerService,
  DeviceService,
  BookingSubmission,
  BookingResponse,
  Booking,
  BookingStatus,
  TimeSlot,
  Customer,
  CustomerData,
  DeviceCategory,
  DeviceModel,
  RepairType,
  RepairPricing,
  ApiResponse,
  ServiceHealthCheck,
  DeviceSpecs,
  ServiceConfig,
  BaseService,
} from './types';

// Mock data generators
const mockBookingResponse = (submission: BookingSubmission): BookingResponse => ({
  bookingId: `BK-${Date.now()}`,
  referenceNumber: `REV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
  status: 'pending',
  estimatedCost: Math.floor(Math.random() * 300) + 50,
  estimatedDuration: '2-3 business days',
  scheduledDate: submission.preferredDate,
  scheduledTime: submission.preferredTime,
  confirmation: {
    email: true,
    sms: true,
  },
});

const mockBooking = (id: string): Booking => ({
  id,
  referenceNumber: `REV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
  status: 'in-progress',
  deviceCategory: 'macbook',
  deviceModel: 'MacBook Pro 16" 2023',
  repairType: 'screen-replacement',
  urgency: 'standard',
  serviceType: 'drop-off',
  problemDescription: 'Screen has cracks in the bottom right corner',
  customer: mockCustomer('CUST-123'),
  pricing: {
    estimated: 280,
    actual: 275,
    breakdown: [
      { type: 'diagnostic', description: 'Initial diagnosis', amount: 25 },
      { type: 'parts', description: 'LCD screen replacement', amount: 200 },
      { type: 'labor', description: 'Installation labor', amount: 50 },
    ],
  },
  timeline: {
    created: new Date('2024-01-15T10:00:00Z'),
    scheduled: new Date('2024-01-16T14:00:00Z'),
    started: new Date('2024-01-16T14:30:00Z'),
    diagnosed: new Date('2024-01-16T15:00:00Z'),
    repaired: new Date('2024-01-17T16:00:00Z'),
  },
  notes: [
    {
      id: 'NOTE-1',
      author: 'John Smith',
      authorType: 'technician',
      content: 'Screen replacement completed successfully. All tests passed.',
      timestamp: new Date('2024-01-17T16:30:00Z'),
      isPrivate: false,
    },
  ],
  attachments: [
    {
      id: 'ATT-1',
      filename: 'before_repair.jpg',
      url: '/uploads/before_repair.jpg',
      type: 'image',
      uploadedBy: 'customer',
      uploadedAt: new Date('2024-01-15T10:15:00Z'),
      description: 'Photo showing screen damage',
    },
  ],
});

const mockCustomer = (id: string): Customer => ({
  id,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+44 7700 900123',
  address: {
    street: '8 GodsHill Close',
    city: 'Bournemouth',
    state: 'England',
    postalCode: 'BH8 0EJ',
    country: 'United Kingdom',
  },
  preferences: {
    communication: 'both',
    language: 'en',
    marketing: true,
  },
  createdAt: new Date('2023-12-01T00:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  totalBookings: 3,
  loyaltyPoints: 150,
  notes: ['Preferred customer', 'Always pays on time'],
});

// Import device database
import deviceDatabase from '../../../config/devices';

const mockDeviceCategories: DeviceCategory[] = deviceDatabase.categories;

const mockDeviceModels: DeviceModel[] = deviceDatabase.devices;

const mockRepairTypes: RepairType[] = [
  {
    id: 'screen-replacement',
    name: 'Screen Replacement',
    description: 'Complete LCD/OLED screen replacement',
    category: 'hardware',
    estimatedTime: '2-3 hours',
    difficulty: 'medium',
    warrantyCovered: true,
    requiredParts: ['LCD screen', 'Adhesive strips', 'Screws'],
  },
  {
    id: 'battery-replacement',
    name: 'Battery Replacement',
    description: 'Replace worn-out battery',
    category: 'hardware',
    estimatedTime: '1-2 hours',
    difficulty: 'easy',
    warrantyCovered: true,
    requiredParts: ['Battery', 'Adhesive strips'],
  },
  {
    id: 'logic-board-repair',
    name: 'Logic Board Repair',
    description: 'Micro-soldering and component repair',
    category: 'hardware',
    estimatedTime: '1-2 days',
    difficulty: 'hard',
    warrantyCovered: true,
    requiredParts: ['Various components'],
  },
];

const mockTimeSlots: TimeSlot[] = [
  { date: '2024-01-20', time: '09:00', available: true, technicianId: 'TECH-1', technicianName: 'John Smith' },
  { date: '2024-01-20', time: '10:00', available: false },
  { date: '2024-01-20', time: '11:00', available: true, technicianId: 'TECH-2', technicianName: 'Sarah Johnson' },
  { date: '2024-01-20', time: '14:00', available: true, technicianId: 'TECH-1', technicianName: 'John Smith' },
  { date: '2024-01-20', time: '15:00', available: true, technicianId: 'TECH-1', technicianName: 'John Smith' },
  { date: '2024-01-21', time: '09:00', available: true, technicianId: 'TECH-2', technicianName: 'Sarah Johnson' },
  { date: '2024-01-21', time: '10:00', available: true, technicianId: 'TECH-2', technicianName: 'Sarah Johnson' },
];

// Mock delay utility
const mockDelay = (ms: number = 500): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock Booking Service
export class MockBookingService extends BaseService {

  constructor(config: ServiceConfig) {
    super(config);
  }

  async submitBooking(bookingData: BookingSubmission): Promise<ApiResponse<BookingResponse>> {
    await mockDelay(1000); // Simulate processing time
    
    const response: BookingResponse = mockBookingResponse(bookingData);
    
    return {
      data: response,
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' },
      config: { url: '/submit', method: 'POST', data: bookingData },
    };
  }

  async getBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    await mockDelay(300);
    
    return {
      data: mockBooking(bookingId),
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${bookingId}`, method: 'GET' },
    };
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<ApiResponse<Booking>> {
    await mockDelay(400);
    
    const booking = mockBooking(bookingId);
    booking.status = status;
    
    return {
      data: booking,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${bookingId}/status`, method: 'PATCH', data: { status } },
    };
  }

  async getBookingHistory(customerId: string): Promise<ApiResponse<Booking[]>> {
    await mockDelay(500);
    
    const bookings = [
      mockBooking('BK-1'),
      mockBooking('BK-2'),
      mockBooking('BK-3'),
    ];
    
    return {
      data: bookings,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/customer/${customerId}/history`, method: 'GET' },
    };
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<boolean>> {
    await mockDelay(600);
    
    return {
      data: true,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${bookingId}`, method: 'DELETE' },
    };
  }

  async getAvailableSlots(date: string, serviceType: string): Promise<ApiResponse<TimeSlot[]>> {
    await mockDelay(400);
    
    // Filter slots by date
    const filteredSlots = mockTimeSlots.filter(slot => slot.date === date);
    
    return {
      data: filteredSlots,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: '/availability', method: 'GET', params: { date, serviceType } },
    };
  }

  async healthCheck(): Promise<ServiceHealthCheck> {
    await mockDelay(100);
    
    return {
      service: 'mock-booking-service',
      status: 'healthy',
      responseTime: 100,
      timestamp: new Date(),
      metadata: { mock: true },
    };
  }

  async request<T>(config: any): Promise<ApiResponse<T>> {
    throw new Error('Method not implemented in mock service');
  }
}

// Mock Device Service
export class MockDeviceService extends BaseService {

  constructor(config: ServiceConfig) {
    super(config);
  }

  async getDeviceCategories(): Promise<ApiResponse<DeviceCategory[]>> {
    await mockDelay(300);
    
    return {
      data: mockDeviceCategories,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: '/categories', method: 'GET' },
    };
  }

  async getDeviceModels(categoryId: string): Promise<ApiResponse<DeviceModel[]>> {
    await mockDelay(400);
    
    const models = mockDeviceModels.filter(model => model.categoryId === categoryId);
    
    return {
      data: models,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/categories/${categoryId}/models`, method: 'GET' },
    };
  }

  async getDeviceSpecs(modelId: string): Promise<ApiResponse<DeviceSpecs>> {
    await mockDelay(200);
    
    const model = mockDeviceModels.find(m => m.id === modelId);
    
    return {
      data: model?.specifications || {},
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/models/${modelId}/specs`, method: 'GET' },
    };
  }

  async getRepairTypes(modelId: string): Promise<ApiResponse<RepairType[]>> {
    await mockDelay(300);
    
    return {
      data: mockRepairTypes,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/models/${modelId}/repairs`, method: 'GET' },
    };
  }

  async getRepairPricing(modelId: string, repairTypeId: string): Promise<ApiResponse<RepairPricing>> {
    await mockDelay(250);
    
    const pricing: RepairPricing = {
      basePrice: 50,
      laborCost: 80,
      partsCost: 150,
      urgencyMultiplier: {
        standard: 1,
        priority: 1.5,
        emergency: 2,
      },
      warranty: {
        duration: '90 days',
        coverage: ['Parts', 'Labor'],
      },
    };
    
    return {
      data: pricing,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/models/${modelId}/repairs/${repairTypeId}/pricing`, method: 'GET' },
    };
  }

  async searchDevices(query: string): Promise<ApiResponse<DeviceModel[]>> {
    await mockDelay(350);
    
    const results = mockDeviceModels.filter(model => 
      model.name.toLowerCase().includes(query.toLowerCase()) ||
      model.brand.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      data: results,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: '/search', method: 'GET', params: { query } },
    };
  }

  async healthCheck(): Promise<ServiceHealthCheck> {
    await mockDelay(50);
    
    return {
      service: 'mock-device-service',
      status: 'healthy',
      responseTime: 50,
      timestamp: new Date(),
      metadata: { mock: true },
    };
  }

  async request<T>(config: any): Promise<ApiResponse<T>> {
    throw new Error('Method not implemented in mock service');
  }
}

// Mock Customer Service
export class MockCustomerService extends BaseService {

  constructor(config: ServiceConfig) {
    super(config);
  }

  async createCustomer(customerData: CustomerData): Promise<ApiResponse<Customer>> {
    await mockDelay(600);
    
    const customer: Customer = {
      ...customerData,
      id: `CUST-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalBookings: 0,
      loyaltyPoints: 0,
      notes: [],
    };
    
    return {
      data: customer,
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' },
      config: { url: '/create', method: 'POST', data: customerData },
    };
  }

  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    await mockDelay(250);
    
    return {
      data: mockCustomer(customerId),
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${customerId}`, method: 'GET' },
    };
  }

  async updateCustomer(customerId: string, updates: Partial<CustomerData>): Promise<ApiResponse<Customer>> {
    await mockDelay(400);
    
    const customer = mockCustomer(customerId);
    Object.assign(customer, updates);
    customer.updatedAt = new Date();
    
    return {
      data: customer,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${customerId}`, method: 'PUT', data: updates },
    };
  }

  async getCustomerBookings(customerId: string): Promise<ApiResponse<Booking[]>> {
    await mockDelay(350);
    
    const bookings = [mockBooking('BK-1'), mockBooking('BK-2')];
    
    return {
      data: bookings,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${customerId}/bookings`, method: 'GET' },
    };
  }

  async deleteCustomer(customerId: string): Promise<ApiResponse<boolean>> {
    await mockDelay(500);
    
    return {
      data: true,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: `/${customerId}`, method: 'DELETE' },
    };
  }

  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    await mockDelay(300);
    
    const customers = [mockCustomer('CUST-1'), mockCustomer('CUST-2')];
    
    return {
      data: customers,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: { url: '/search', method: 'GET', params: { query } },
    };
  }

  async healthCheck(): Promise<ServiceHealthCheck> {
    await mockDelay(75);
    
    return {
      service: 'mock-customer-service',
      status: 'healthy',
      responseTime: 75,
      timestamp: new Date(),
      metadata: { mock: true },
    };
  }

  async request<T>(config: any): Promise<ApiResponse<T>> {
    throw new Error('Method not implemented in mock service');
  }
}

export const mockServices = {
  booking: MockBookingService,
  device: MockDeviceService,
  customer: MockCustomerService,
};