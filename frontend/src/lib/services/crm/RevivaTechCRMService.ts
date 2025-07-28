/**
 * RevivaTech CRM Service - RevivaTech-specific CRM integration
 * Handles repair booking to CRM synchronization with business logic
 */

import { CRMService, CRMServiceConfig, CRMContact, CRMDeal, CRMActivity, CRMServiceResponse } from './CRMService';
import { CRMIntegrationManager } from './CRMIntegrationManager';

// RevivaTech specific interfaces
export interface RevivaTechBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  serviceType: 'pickup' | 'postal' | 'in-store';
  estimatedCost: number;
  actualCost?: number;
  depositAmount?: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  bookingDate: Date;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  technicianNotes?: string;
  customerNotes?: string;
  partsRequired?: string[];
  partsOrdered?: boolean;
  partsArrived?: boolean;
  paymentStatus: 'pending' | 'partial' | 'completed' | 'refunded';
  paymentMethod?: 'stripe' | 'paypal' | 'cash' | 'bank_transfer';
  invoiceId?: string;
  trackingNumber?: string;
  images?: string[];
  diagnosticReport?: string;
  warrantyPeriod?: number; // in months
  followUpDate?: Date;
  satisfaction?: number; // 1-5 rating
  reviewText?: string;
  reviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevivaTechCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  preferences?: {
    contactMethod: 'email' | 'phone' | 'sms';
    notifications: boolean;
    marketing: boolean;
  };
  customerSince: Date;
  totalSpent: number;
  bookingCount: number;
  averageRating?: number;
  lastBookingDate?: Date;
  loyaltyPoints?: number;
  vipStatus?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevivaTechRepair {
  id: string;
  bookingId: string;
  customerId: string;
  deviceType: string;
  deviceModel: string;
  serialNumber?: string;
  issueDescription: string;
  diagnosisDescription?: string;
  repairDescription?: string;
  status: 'pending' | 'diagnosed' | 'waiting_parts' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTechnician?: string;
  estimatedHours?: number;
  actualHours?: number;
  partsUsed?: Array<{
    partId: string;
    partName: string;
    quantity: number;
    cost: number;
  }>;
  laborCost?: number;
  totalCost?: number;
  qualityCheckPassed?: boolean;
  warrantyPeriod?: number; // in months
  startDate?: Date;
  completionDate?: Date;
  images?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Business logic mapping configuration
export interface RevivaTechCRMConfig {
  contactMapping: {
    primaryFields: string[];
    customFields: Record<string, string>;
  };
  dealMapping: {
    primaryFields: string[];
    customFields: Record<string, string>;
    stageMapping: Record<string, string>;
  };
  activityMapping: {
    repairStages: Record<string, string>;
    notifications: string[];
  };
  automationRules: {
    createDealOnBooking: boolean;
    updateDealOnStatusChange: boolean;
    createActivityOnRepairUpdate: boolean;
    sendNotificationOnCompletion: boolean;
  };
  businessRules: {
    vipCustomerThreshold: number; // Total spent threshold for VIP status
    loyaltyPointsRate: number; // Points per £1 spent
    followUpDays: number; // Days after completion for follow-up
    warrantyPeriod: number; // Default warranty period in months
  };
}

/**
 * RevivaTech CRM Service - Business-specific CRM integration
 * Handles the synchronization of repair bookings with CRM systems
 */
export class RevivaTechCRMService {
  private integrationManager: CRMIntegrationManager;
  private config: RevivaTechCRMConfig;
  
  constructor(
    integrationManager: CRMIntegrationManager,
    config: RevivaTechCRMConfig
  ) {
    this.integrationManager = integrationManager;
    this.config = config;
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for business events
   */
  private setupEventHandlers(): void {
    // Listen for booking events
    this.integrationManager.on('booking_created', this.handleBookingCreated.bind(this));
    this.integrationManager.on('booking_updated', this.handleBookingUpdated.bind(this));
    this.integrationManager.on('repair_started', this.handleRepairStarted.bind(this));
    this.integrationManager.on('repair_completed', this.handleRepairCompleted.bind(this));
    this.integrationManager.on('payment_received', this.handlePaymentReceived.bind(this));
    this.integrationManager.on('review_submitted', this.handleReviewSubmitted.bind(this));
  }

  /**
   * Sync booking to CRM as contact and deal
   */
  async syncBookingToCRM(booking: RevivaTechBooking): Promise<{
    contact: Map<string, CRMServiceResponse<CRMContact>>;
    deal: Map<string, CRMServiceResponse<CRMDeal>>;
  }> {
    try {
      // Create or update contact
      const contact = this.mapBookingToContact(booking);
      const contactResults = await this.integrationManager.createContact(contact);
      
      // Create deal
      const deal = this.mapBookingToDeal(booking);
      const dealResults = await this.integrationManager.createDeal(deal);
      
      // Create initial activity
      if (this.config.automationRules.createActivityOnRepairUpdate) {
        const activity = this.createBookingActivity(booking);
        await this.integrationManager.createActivity(activity);
      }
      
      return {
        contact: contactResults,
        deal: dealResults
      };
    } catch (error) {
      throw new Error(`Failed to sync booking to CRM: ${error.message}`);
    }
  }

  /**
   * Sync customer to CRM
   */
  async syncCustomerToCRM(customer: RevivaTechCustomer): Promise<Map<string, CRMServiceResponse<CRMContact>>> {
    const contact = this.mapCustomerToContact(customer);
    return await this.integrationManager.createContact(contact);
  }

  /**
   * Sync repair to CRM as deal updates and activities
   */
  async syncRepairToCRM(repair: RevivaTechRepair): Promise<{
    deal: Map<string, CRMServiceResponse<CRMDeal>>;
    activity: Map<string, CRMServiceResponse<CRMActivity>>;
  }> {
    try {
      // Update deal with repair information
      const dealUpdates = this.mapRepairToDealUpdates(repair);
      const dealResults = await this.integrationManager.updateDeal(repair.bookingId, dealUpdates);
      
      // Create repair activity
      const activity = this.createRepairActivity(repair);
      const activityResults = await this.integrationManager.createActivity(activity);
      
      return {
        deal: dealResults,
        activity: activityResults
      };
    } catch (error) {
      throw new Error(`Failed to sync repair to CRM: ${error.message}`);
    }
  }

  /**
   * Update customer satisfaction and feedback
   */
  async updateCustomerSatisfaction(customerId: string, satisfaction: number, review?: string): Promise<void> {
    const contactUpdates: Partial<CRMContact> = {
      satisfaction,
      notes: review,
      lastActivityAt: new Date()
    };
    
    await this.integrationManager.updateContact(customerId, contactUpdates);
    
    // Create satisfaction activity
    const activity: CRMActivity = {
      type: 'note',
      subject: `Customer Satisfaction: ${satisfaction}/5`,
      description: review || 'Customer satisfaction rating updated',
      contactId: customerId,
      completedAt: new Date(),
      status: 'completed'
    };
    
    await this.integrationManager.createActivity(activity);
  }

  /**
   * Track customer lifecycle and VIP status
   */
  async updateCustomerLifecycle(customerId: string, customer: RevivaTechCustomer): Promise<void> {
    const isVIP = customer.totalSpent >= this.config.businessRules.vipCustomerThreshold;
    const loyaltyPoints = Math.floor(customer.totalSpent * this.config.businessRules.loyaltyPointsRate);
    
    const contactUpdates: Partial<CRMContact> = {
      totalSpent: customer.totalSpent,
      repairCount: customer.bookingCount,
      customerSince: customer.customerSince,
      customFields: {
        vip_status: isVIP,
        loyalty_points: loyaltyPoints,
        average_rating: customer.averageRating,
        last_booking_date: customer.lastBookingDate?.toISOString()
      }
    };
    
    await this.integrationManager.updateContact(customerId, contactUpdates);
    
    // Create VIP promotion activity if applicable
    if (isVIP && !customer.vipStatus) {
      const activity: CRMActivity = {
        type: 'note',
        subject: 'Customer Promoted to VIP',
        description: `Customer has been promoted to VIP status. Total spent: £${customer.totalSpent}`,
        contactId: customerId,
        completedAt: new Date(),
        status: 'completed'
      };
      
      await this.integrationManager.createActivity(activity);
    }
  }

  /**
   * Schedule follow-up activities
   */
  async scheduleFollowUp(bookingId: string, customerId: string, completionDate: Date): Promise<void> {
    const followUpDate = new Date(completionDate);
    followUpDate.setDate(followUpDate.getDate() + this.config.businessRules.followUpDays);
    
    const activity: CRMActivity = {
      type: 'task',
      subject: 'Follow-up with customer',
      description: `Follow up with customer about repair satisfaction and potential issues`,
      contactId: customerId,
      dealId: bookingId,
      dueDate: followUpDate,
      status: 'pending'
    };
    
    await this.integrationManager.createActivity(activity);
  }

  /**
   * Get customer insights from CRM
   */
  async getCustomerInsights(customerId: string): Promise<{
    profile: CRMContact;
    deals: CRMDeal[];
    activities: CRMActivity[];
    insights: {
      totalValue: number;
      averageTicket: number;
      repairFrequency: string;
      preferredServices: string[];
      riskLevel: 'low' | 'medium' | 'high';
      nextActionRecommendation: string;
    };
  }> {
    // This would be implemented to fetch and analyze customer data
    // from the CRM to provide business insights
    
    throw new Error('Customer insights not implemented yet');
  }

  // Event handlers
  private async handleBookingCreated(booking: RevivaTechBooking): Promise<void> {
    if (this.config.automationRules.createDealOnBooking) {
      await this.syncBookingToCRM(booking);
    }
  }

  private async handleBookingUpdated(booking: RevivaTechBooking): Promise<void> {
    if (this.config.automationRules.updateDealOnStatusChange) {
      const dealUpdates = this.mapBookingToDealUpdates(booking);
      await this.integrationManager.updateDeal(booking.id, dealUpdates);
    }
  }

  private async handleRepairStarted(repair: RevivaTechRepair): Promise<void> {
    await this.syncRepairToCRM(repair);
  }

  private async handleRepairCompleted(repair: RevivaTechRepair): Promise<void> {
    await this.syncRepairToCRM(repair);
    
    // Schedule follow-up
    if (repair.completionDate) {
      await this.scheduleFollowUp(repair.bookingId, repair.customerId, repair.completionDate);
    }
  }

  private async handlePaymentReceived(payment: any): Promise<void> {
    const activity: CRMActivity = {
      type: 'note',
      subject: 'Payment Received',
      description: `Payment of £${payment.amount} received via ${payment.method}`,
      contactId: payment.customerId,
      dealId: payment.bookingId,
      completedAt: new Date(),
      status: 'completed'
    };
    
    await this.integrationManager.createActivity(activity);
  }

  private async handleReviewSubmitted(review: any): Promise<void> {
    await this.updateCustomerSatisfaction(review.customerId, review.rating, review.text);
  }

  // Mapping functions
  private mapBookingToContact(booking: RevivaTechBooking): CRMContact {
    const [firstName, ...lastNameParts] = booking.customerName.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    return {
      firstName,
      lastName,
      email: booking.customerEmail,
      phone: booking.customerPhone,
      status: 'customer',
      source: 'website_booking',
      customFields: {
        booking_id: booking.id,
        device_type: booking.deviceType,
        device_model: booking.deviceModel,
        service_type: booking.serviceType,
        urgency: booking.urgency,
        estimated_cost: booking.estimatedCost,
        booking_date: booking.bookingDate.toISOString()
      },
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }

  private mapCustomerToContact(customer: RevivaTechCustomer): CRMContact {
    return {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      status: 'customer',
      source: 'website_registration',
      customerSince: customer.customerSince,
      totalSpent: customer.totalSpent,
      repairCount: customer.bookingCount,
      customFields: {
        customer_id: customer.id,
        vip_status: customer.vipStatus,
        loyalty_points: customer.loyaltyPoints,
        average_rating: customer.averageRating,
        last_booking_date: customer.lastBookingDate?.toISOString(),
        preferred_contact: customer.preferences?.contactMethod,
        marketing_consent: customer.preferences?.marketing
      },
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
  }

  private mapBookingToDeal(booking: RevivaTechBooking): CRMDeal {
    return {
      title: `${booking.deviceType} Repair - ${booking.deviceModel}`,
      value: booking.estimatedCost,
      currency: 'GBP',
      stage: this.mapBookingStatusToDealStage(booking.status),
      expectedCloseDate: booking.expectedCompletionDate,
      actualCloseDate: booking.actualCompletionDate,
      source: 'website_booking',
      customFields: {
        booking_id: booking.id,
        device_type: booking.deviceType,
        device_model: booking.deviceModel,
        issue_description: booking.issueDescription,
        service_type: booking.serviceType,
        urgency: booking.urgency,
        deposit_amount: booking.depositAmount,
        payment_status: booking.paymentStatus,
        tracking_number: booking.trackingNumber
      },
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }

  private mapBookingToDealUpdates(booking: RevivaTechBooking): Partial<CRMDeal> {
    return {
      stage: this.mapBookingStatusToDealStage(booking.status),
      value: booking.actualCost || booking.estimatedCost,
      actualCloseDate: booking.actualCompletionDate,
      customFields: {
        payment_status: booking.paymentStatus,
        tracking_number: booking.trackingNumber,
        customer_notes: booking.customerNotes,
        technician_notes: booking.technicianNotes
      },
      updatedAt: booking.updatedAt
    };
  }

  private mapRepairToDealUpdates(repair: RevivaTechRepair): Partial<CRMDeal> {
    return {
      stage: this.mapRepairStatusToDealStage(repair.status),
      value: repair.totalCost || 0,
      actualCloseDate: repair.completionDate,
      customFields: {
        repair_id: repair.id,
        diagnosis: repair.diagnosisDescription,
        repair_description: repair.repairDescription,
        assigned_technician: repair.assignedTechnician,
        quality_check_passed: repair.qualityCheckPassed,
        warranty_period: repair.warrantyPeriod,
        estimated_hours: repair.estimatedHours,
        actual_hours: repair.actualHours
      },
      updatedAt: repair.updatedAt
    };
  }

  private createBookingActivity(booking: RevivaTechBooking): CRMActivity {
    return {
      type: 'note',
      subject: `Booking Created: ${booking.deviceType} Repair`,
      description: `New repair booking created for ${booking.deviceModel}. Issue: ${booking.issueDescription}`,
      contactId: booking.customerEmail, // This would be mapped to actual contact ID
      dealId: booking.id,
      completedAt: booking.createdAt,
      status: 'completed',
      customFields: {
        booking_id: booking.id,
        service_type: booking.serviceType,
        urgency: booking.urgency
      }
    };
  }

  private createRepairActivity(repair: RevivaTechRepair): CRMActivity {
    return {
      type: 'note',
      subject: `Repair Update: ${repair.status}`,
      description: repair.repairDescription || `Repair status updated to ${repair.status}`,
      contactId: repair.customerId,
      dealId: repair.bookingId,
      completedAt: new Date(),
      status: 'completed',
      customFields: {
        repair_id: repair.id,
        assigned_technician: repair.assignedTechnician,
        priority: repair.priority
      }
    };
  }

  private mapBookingStatusToDealStage(status: string): string {
    const stageMapping = this.config.dealMapping.stageMapping;
    return stageMapping[status] || 'new';
  }

  private mapRepairStatusToDealStage(status: string): string {
    const mapping: Record<string, string> = {
      'pending': 'new',
      'diagnosed': 'qualified',
      'waiting_parts': 'proposal',
      'in_progress': 'negotiation',
      'completed': 'closed_won',
      'cancelled': 'closed_lost'
    };
    
    return mapping[status] || 'new';
  }
}

export default RevivaTechCRMService;