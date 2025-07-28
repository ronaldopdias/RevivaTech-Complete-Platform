/**
 * Device Repository
 * Handles device catalog operations with configuration integration
 */

const BaseRepository = require('./base.repository');

class DeviceRepository extends BaseRepository {
  constructor(knex) {
    super(knex, 'devices');
  }

  /**
   * Search devices with advanced filtering and configuration support
   */
  async searchDevices(searchTerm, filters = {}) {
    let query = this.knex(this.tableName)
      .select(
        'devices.*',
        'device_brands.name as brand_name',
        'device_brands.slug as brand_slug',
        'device_categories.name as category_name',
        'device_categories.slug as category_slug',
        'device_categories.icon as category_icon',
        'device_categories.color as category_color'
      )
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('devices.is_active', true);

    // Apply search term
    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.trim();
      query = query.where(function() {
        this.where('devices.name', 'ILIKE', `%${term}%`)
          .orWhere('devices.model', 'ILIKE', `%${term}%`)
          .orWhere('devices.search_keywords', 'ILIKE', `%${term}%`)
          .orWhere('device_brands.name', 'ILIKE', `%${term}%`);
      });
    }

    // Apply filters
    if (filters.brandId) {
      query = query.where('devices.brand_id', filters.brandId);
    }
    if (filters.categoryId) {
      query = query.where('devices.category_id', filters.categoryId);
    }
    if (filters.year) {
      query = query.where('devices.release_year', filters.year);
    }
    if (filters.minYear) {
      query = query.where('devices.release_year', '>=', filters.minYear);
    }
    if (filters.maxYear) {
      query = query.where('devices.release_year', '<=', filters.maxYear);
    }
    if (filters.isRepairable !== undefined) {
      query = query.where('devices.is_repairable', filters.isRepairable);
    }
    if (filters.partsAvailability) {
      query = query.where('devices.parts_availability', filters.partsAvailability);
    }

    // Default ordering by popularity and relevance
    query = query.orderBy('devices.is_featured', 'desc')
      .orderBy('devices.popularity_score', 'desc')
      .orderBy('devices.name', 'asc');

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  /**
   * Get device with variants and compatibility info
   */
  async getDeviceWithDetails(deviceId) {
    const device = await this.knex(this.tableName)
      .select(
        'devices.*',
        'device_brands.name as brand_name',
        'device_brands.slug as brand_slug',
        'device_categories.name as category_name',
        'device_categories.slug as category_slug'
      )
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('devices.id', deviceId)
      .first();

    if (!device) {
      return null;
    }

    // Get variants
    const variants = await this.knex('device_variants')
      .where('device_id', deviceId)
      .where('is_active', true)
      .orderBy('storage_gb', 'asc')
      .orderBy('color', 'asc');

    // Get compatible repairs
    const compatibleRepairs = await this.knex('repair_device_compatibility')
      .select(
        'repair_types.id',
        'repair_types.name',
        'repair_types.slug',
        'repair_types.short_description',
        'repair_types.base_price',
        'repair_categories.name as category_name',
        'repair_categories.icon as category_icon',
        'repair_device_compatibility.complexity_override',
        'repair_device_compatibility.price_override'
      )
      .leftJoin('repair_types', 'repair_device_compatibility.repair_type_id', 'repair_types.id')
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .where('repair_device_compatibility.device_id', deviceId)
      .where('repair_device_compatibility.is_compatible', true)
      .where('repair_types.is_enabled', true)
      .orderBy('repair_types.popularity_rank', 'asc');

    return {
      ...device,
      variants,
      compatibleRepairs
    };
  }

  /**
   * Get devices by brand with configuration support
   */
  async getDevicesByBrand(brandSlug, options = {}) {
    const query = this.knex(this.tableName)
      .select(
        'devices.*',
        'device_brands.name as brand_name',
        'device_categories.name as category_name'
      )
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('device_brands.slug', brandSlug)
      .where('devices.is_active', true);

    if (options.categorySlug) {
      query.where('device_categories.slug', options.categorySlug);
    }

    return await query.orderBy('devices.popularity_score', 'desc');
  }

  /**
   * Get devices by category
   */
  async getDevicesByCategory(categorySlug, options = {}) {
    const query = this.knex(this.tableName)
      .select(
        'devices.*',
        'device_brands.name as brand_name',
        'device_categories.name as category_name'
      )
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('device_categories.slug', categorySlug)
      .where('devices.is_active', true);

    if (options.brandSlug) {
      query.where('device_brands.slug', options.brandSlug);
    }

    return await query.orderBy('devices.popularity_score', 'desc');
  }

  /**
   * Get featured devices for homepage
   */
  async getFeaturedDevices(limit = 12) {
    return await this.knex(this.tableName)
      .select(
        'devices.*',
        'device_brands.name as brand_name',
        'device_brands.slug as brand_slug',
        'device_categories.name as category_name',
        'device_categories.slug as category_slug'
      )
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('devices.is_active', true)
      .where('devices.is_featured', true)
      .orderBy('devices.popularity_score', 'desc')
      .limit(limit);
  }

  /**
   * Get popular devices by category
   */
  async getPopularDevicesByCategory(categorySlug, limit = 8) {
    return await this.knex(this.tableName)
      .select(
        'devices.*',
        'device_brands.name as brand_name',
        'device_categories.name as category_name'
      )
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('device_categories.slug', categorySlug)
      .where('devices.is_active', true)
      .orderBy('devices.popularity_score', 'desc')
      .limit(limit);
  }

  /**
   * Get device brands with device counts
   */
  async getBrandsWithCounts() {
    return await this.knex('device_brands')
      .select(
        'device_brands.*',
        this.knex.raw('COUNT(devices.id) as device_count')
      )
      .leftJoin('devices', function() {
        this.on('device_brands.id', 'devices.brand_id')
          .andOn('devices.is_active', this.knex.raw('?', [true]));
      })
      .where('device_brands.is_active', true)
      .groupBy('device_brands.id')
      .orderBy('device_brands.display_order', 'asc');
  }

  /**
   * Get device categories with device counts
   */
  async getCategoriesWithCounts() {
    return await this.knex('device_categories')
      .select(
        'device_categories.*',
        this.knex.raw('COUNT(devices.id) as device_count')
      )
      .leftJoin('devices', function() {
        this.on('device_categories.id', 'devices.category_id')
          .andOn('devices.is_active', this.knex.raw('?', [true]));
      })
      .where('device_categories.is_active', true)
      .groupBy('device_categories.id')
      .orderBy('device_categories.display_order', 'asc');
  }

  /**
   * Update device popularity score
   */
  async updatePopularityScore(deviceId, increment = 1) {
    return await this.knex(this.tableName)
      .where('id', deviceId)
      .increment('popularity_score', increment)
      .returning('*');
  }

  /**
   * Get device repair statistics
   */
  async getDeviceRepairStats(deviceId) {
    const stats = await this.knex('bookings')
      .select(
        this.knex.raw('COUNT(*) as total_bookings'),
        this.knex.raw('AVG(quote_total_price) as avg_repair_cost'),
        this.knex.raw('COUNT(CASE WHEN booking_status = \'completed\' THEN 1 END) as completed_repairs')
      )
      .where('device_id', deviceId)
      .first();

    return {
      totalBookings: parseInt(stats.total_bookings) || 0,
      avgRepairCost: parseFloat(stats.avg_repair_cost) || 0,
      completedRepairs: parseInt(stats.completed_repairs) || 0,
      completionRate: stats.total_bookings > 0 
        ? Math.round((stats.completed_repairs / stats.total_bookings) * 100) 
        : 0
    };
  }

  /**
   * Bulk update device configurations from config files
   */
  async syncWithConfiguration(configDevices) {
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const configDevice of configDevices) {
      try {
        const existingDevice = await this.findBySlug(configDevice.slug);
        
        if (existingDevice) {
          await this.update(existingDevice.id, configDevice);
          results.updated++;
        } else {
          await this.create(configDevice);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          device: configDevice.slug,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = DeviceRepository;