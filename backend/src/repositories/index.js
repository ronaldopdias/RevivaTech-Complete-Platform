/**
 * Repository Index
 * Centralized repository management with dependency injection
 */

const BaseRepository = require('./base.repository');
const DeviceRepository = require('./device.repository');
const BookingRepository = require('./booking.repository');
const RepairRepository = require('./repair.repository');

/**
 * Repository Factory
 * Creates and manages repository instances with shared database connection
 */
class RepositoryFactory {
  constructor(knex) {
    this.knex = knex;
    this.repositories = new Map();
  }

  /**
   * Get or create a repository instance
   */
  get(repositoryName) {
    if (this.repositories.has(repositoryName)) {
      return this.repositories.get(repositoryName);
    }

    let repository;
    switch (repositoryName) {
      case 'device':
        repository = new DeviceRepository(this.knex);
        break;
      case 'booking':
        repository = new BookingRepository(this.knex);
        break;
      case 'repair':
        repository = new RepairRepository(this.knex);
        break;
      case 'customer':
        repository = new BaseRepository(this.knex, 'customers');
        break;
      case 'pricing_factor':
        repository = new BaseRepository(this.knex, 'pricing_factors');
        break;
      case 'pricing_rule':
        repository = new BaseRepository(this.knex, 'pricing_rules');
        break;
      case 'notification':
        repository = new BaseRepository(this.knex, 'notifications');
        break;
      case 'analytics':
        repository = new BaseRepository(this.knex, 'booking_analytics');
        break;
      default:
        throw new Error(`Unknown repository: ${repositoryName}`);
    }

    this.repositories.set(repositoryName, repository);
    return repository;
  }

  /**
   * Get device repository
   */
  get device() {
    return this.get('device');
  }

  /**
   * Get booking repository
   */
  get booking() {
    return this.get('booking');
  }

  /**
   * Get repair repository
   */
  get repair() {
    return this.get('repair');
  }

  /**
   * Get customer repository
   */
  get customer() {
    return this.get('customer');
  }

  /**
   * Get pricing factor repository
   */
  get pricingFactor() {
    return this.get('pricing_factor');
  }

  /**
   * Get pricing rule repository
   */
  get pricingRule() {
    return this.get('pricing_rule');
  }

  /**
   * Get notification repository
   */
  get notification() {
    return this.get('notification');
  }

  /**
   * Get analytics repository
   */
  get analytics() {
    return this.get('analytics');
  }

  /**
   * Close all repository connections
   */
  async close() {
    await this.knex.destroy();
    this.repositories.clear();
  }

  /**
   * Health check - test database connection
   */
  async healthCheck() {
    try {
      await this.knex.raw('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Execute transaction across multiple repositories
   */
  async transaction(callback) {
    return await this.knex.transaction(async (trx) => {
      // Create temporary factory with transaction knex
      const transactionFactory = new RepositoryFactory(trx);
      return await callback(transactionFactory);
    });
  }
}

/**
 * Create repository factory instance
 */
function createRepositoryFactory(knex) {
  return new RepositoryFactory(knex);
}

module.exports = {
  BaseRepository,
  DeviceRepository,
  BookingRepository,
  RepairRepository,
  RepositoryFactory,
  createRepositoryFactory
};