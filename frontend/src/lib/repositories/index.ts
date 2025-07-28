// Repository Index
// Centralized export for all repository classes

export { BaseRepository } from '../database/repository.base';

// User Management
export { UserRepository } from './user.repository';

// Device Catalog
export { 
  DeviceCategoryRepository,
  DeviceBrandRepository,
  DeviceModelRepository,
} from './device.repository';

// Booking System
export { 
  BookingRepository,
  BookingStatusHistoryRepository,
} from './booking.repository';

// Notifications
export { NotificationRepository } from './notification.repository';

// Pricing
export { PricingRuleRepository } from './pricing.repository';

// Repository Factory for dependency injection
export class RepositoryFactory {
  private static instances: Map<string, any> = new Map();

  static getUserRepository(): UserRepository {
    if (!this.instances.has('user')) {
      this.instances.set('user', new UserRepository());
    }
    return this.instances.get('user');
  }

  static getDeviceCategoryRepository(): DeviceCategoryRepository {
    if (!this.instances.has('deviceCategory')) {
      this.instances.set('deviceCategory', new DeviceCategoryRepository());
    }
    return this.instances.get('deviceCategory');
  }

  static getDeviceBrandRepository(): DeviceBrandRepository {
    if (!this.instances.has('deviceBrand')) {
      this.instances.set('deviceBrand', new DeviceBrandRepository());
    }
    return this.instances.get('deviceBrand');
  }

  static getDeviceModelRepository(): DeviceModelRepository {
    if (!this.instances.has('deviceModel')) {
      this.instances.set('deviceModel', new DeviceModelRepository());
    }
    return this.instances.get('deviceModel');
  }

  static getBookingRepository(): BookingRepository {
    if (!this.instances.has('booking')) {
      this.instances.set('booking', new BookingRepository());
    }
    return this.instances.get('booking');
  }

  static getBookingStatusHistoryRepository(): BookingStatusHistoryRepository {
    if (!this.instances.has('bookingStatusHistory')) {
      this.instances.set('bookingStatusHistory', new BookingStatusHistoryRepository());
    }
    return this.instances.get('bookingStatusHistory');
  }

  static getNotificationRepository(): NotificationRepository {
    if (!this.instances.has('notification')) {
      this.instances.set('notification', new NotificationRepository());
    }
    return this.instances.get('notification');
  }

  static getPricingRuleRepository(): PricingRuleRepository {
    if (!this.instances.has('pricingRule')) {
      this.instances.set('pricingRule', new PricingRuleRepository());
    }
    return this.instances.get('pricingRule');
  }

  // Clear all instances (useful for testing)
  static clearInstances(): void {
    this.instances.clear();
  }
}