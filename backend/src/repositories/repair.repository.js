/**
 * Repair Repository
 * Handles repair services and pricing with configuration integration
 */

const BaseRepository = require('./base.repository');

class RepairRepository extends BaseRepository {
  constructor(knex) {
    super(knex, 'repair_types');
  }

  /**
   * Get all repair categories with repair counts
   */
  async getCategoriesWithRepairs() {
    return await this.knex('repair_categories')
      .select(
        'repair_categories.*',
        this.knex.raw('COUNT(repair_types.id) as repair_count')
      )
      .leftJoin('repair_types', function() {
        this.on('repair_categories.id', 'repair_types.category_id')
          .andOn('repair_types.is_enabled', this.knex.raw('?', [true]));
      })
      .where('repair_categories.is_active', true)
      .groupBy('repair_categories.id')
      .orderBy('repair_categories.priority', 'asc');
  }

  /**
   * Get repairs by category with full details
   */
  async getRepairsByCategory(categorySlug) {
    return await this.knex(this.tableName)
      .select(
        'repair_types.*',
        'repair_categories.name as category_name',
        'repair_categories.icon as category_icon',
        'repair_categories.color as category_color'
      )
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .where('repair_categories.slug', categorySlug)
      .where('repair_types.is_enabled', true)
      .orderBy('repair_types.popularity_rank', 'asc');
  }

  /**
   * Get compatible repairs for a specific device
   */
  async getCompatibleRepairs(deviceId, options = {}) {
    let query = this.knex(this.tableName)
      .select(
        'repair_types.*',
        'repair_categories.name as category_name',
        'repair_categories.icon as category_icon',
        'repair_categories.color as category_color',
        'repair_device_compatibility.complexity_override',
        'repair_device_compatibility.price_override',
        'repair_device_compatibility.notes as compatibility_notes'
      )
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .leftJoin('repair_device_compatibility', function() {
        this.on('repair_types.id', 'repair_device_compatibility.repair_type_id')
          .andOn('repair_device_compatibility.device_id', this.knex.raw('?', [deviceId]));
      })
      .where('repair_types.is_enabled', true);

    // Filter by compatibility
    if (options.compatibleOnly !== false) {
      query = query.where(function() {
        // Either explicitly compatible OR no explicit compatibility record
        this.where('repair_device_compatibility.is_compatible', true)
          .orWhereNull('repair_device_compatibility.id');
      });
    }

    // Filter by category
    if (options.categorySlug) {
      query = query.where('repair_categories.slug', options.categorySlug);
    }

    return await query.orderBy('repair_types.popularity_rank', 'asc');
  }

  /**
   * Get repair details with pricing and configuration
   */
  async getRepairWithDetails(repairId) {
    const repair = await this.knex(this.tableName)
      .select(
        'repair_types.*',
        'repair_categories.name as category_name',
        'repair_categories.slug as category_slug',
        'repair_categories.icon as category_icon',
        'repair_categories.color as category_color'
      )
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .where('repair_types.id', repairId)
      .first();

    if (!repair) {
      return null;
    }

    // Parse JSON fields
    repair.complexity_multipliers = JSON.parse(repair.complexity_multipliers || '{}');
    repair.urgency_multipliers = JSON.parse(repair.urgency_multipliers || '{}');
    repair.condition_multipliers = JSON.parse(repair.condition_multipliers || '{}');
    repair.compatible_device_types = JSON.parse(repair.compatible_device_types || '[]');
    repair.compatible_brands = JSON.parse(repair.compatible_brands || '[]');
    repair.excluded_models = JSON.parse(repair.excluded_models || '[]');
    repair.required_tools = JSON.parse(repair.required_tools || '[]');
    repair.required_parts = JSON.parse(repair.required_parts || '[]');
    repair.before_after_images = JSON.parse(repair.before_after_images || '[]');
    repair.process_steps = JSON.parse(repair.process_steps || '[]');
    repair.common_causes = JSON.parse(repair.common_causes || '[]');
    repair.prevention_tips = JSON.parse(repair.prevention_tips || '[]');
    repair.faq_items = JSON.parse(repair.faq_items || '[]');
    repair.seasonal_trends = JSON.parse(repair.seasonal_trends || '{}');
    repair.seasonal_availability = JSON.parse(repair.seasonal_availability || '{}');
    repair.blocked_dates = JSON.parse(repair.blocked_dates || '[]');

    return repair;
  }

  /**
   * Search repairs with advanced filtering
   */
  async searchRepairs(searchTerm, filters = {}) {
    let query = this.knex(this.tableName)
      .select(
        'repair_types.*',
        'repair_categories.name as category_name',
        'repair_categories.icon as category_icon'
      )
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .where('repair_types.is_enabled', true);

    // Apply search term
    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.trim();
      query = query.where(function() {
        this.where('repair_types.name', 'ILIKE', `%${term}%`)
          .orWhere('repair_types.short_description', 'ILIKE', `%${term}%`)
          .orWhere('repair_types.search_keywords', 'ILIKE', `%${term}%`);
      });
    }

    // Apply filters
    if (filters.categoryId) {
      query = query.where('repair_types.category_id', filters.categoryId);
    }
    if (filters.skillLevel) {
      query = query.where('repair_types.skill_level', filters.skillLevel);
    }
    if (filters.maxPrice) {
      query = query.where('repair_types.base_price', '<=', filters.maxPrice);
    }
    if (filters.minPrice) {
      query = query.where('repair_types.base_price', '>=', filters.minPrice);
    }

    // Apply ordering
    if (filters.sortBy === 'price_low') {
      query = query.orderBy('repair_types.base_price', 'asc');
    } else if (filters.sortBy === 'price_high') {
      query = query.orderBy('repair_types.base_price', 'desc');
    } else if (filters.sortBy === 'popularity') {
      query = query.orderBy('repair_types.popularity_rank', 'asc');
    } else {
      query = query.orderBy('repair_types.name', 'asc');
    }

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
   * Get popular repairs
   */
  async getPopularRepairs(limit = 12) {
    return await this.knex(this.tableName)
      .select(
        'repair_types.*',
        'repair_categories.name as category_name',
        'repair_categories.icon as category_icon',
        'repair_categories.color as category_color'
      )
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .where('repair_types.is_enabled', true)
      .orderBy('repair_types.popularity_rank', 'asc')
      .limit(limit);
  }

  /**
   * Calculate dynamic pricing for a repair
   */
  calculatePrice(repair, factors = {}) {
    const {
      complexity = 'standard',
      urgency = 'standard', 
      condition = 'excellent'
    } = factors;

    // Parse multipliers
    const complexityMult = JSON.parse(repair.complexity_multipliers || '{}');
    const urgencyMult = JSON.parse(repair.urgency_multipliers || '{}');
    const conditionMult = JSON.parse(repair.condition_multipliers || '{}');

    // Calculate multipliers
    const complexityMultiplier = complexityMult[complexity] || 1.0;
    const urgencyMultiplier = urgencyMult[urgency] || 1.0;
    const conditionMultiplier = conditionMult[condition] || 1.0;

    // Calculate costs
    const basePrice = repair.base_price;
    const laborCost = repair.labor_hours * repair.hourly_rate;
    const subtotal = basePrice + laborCost;

    // Apply multipliers
    const finalMultiplier = complexityMultiplier * urgencyMultiplier * conditionMultiplier;
    const totalPrice = subtotal * finalMultiplier;

    return {
      basePrice,
      laborCost,
      subtotal,
      totalPrice: Math.round(totalPrice * 100) / 100,
      breakdown: {
        complexityMultiplier,
        urgencyMultiplier,
        conditionMultiplier,
        finalMultiplier,
        complexityAdjustment: (complexityMultiplier - 1) * 100,
        urgencyAdjustment: (urgencyMultiplier - 1) * 100,
        conditionAdjustment: (conditionMultiplier - 1) * 100
      }
    };
  }

  /**
   * Get repair pricing tiers for display
   */
  async getRepairPricingTiers(repairId) {
    const repair = await this.getRepairWithDetails(repairId);
    if (!repair) {
      return null;
    }

    const scenarios = [
      { complexity: 'simple', urgency: 'standard', condition: 'excellent', label: 'Best Case' },
      { complexity: 'standard', urgency: 'standard', condition: 'good', label: 'Typical' },
      { complexity: 'complex', urgency: 'priority', condition: 'fair', label: 'Complex' },
      { complexity: 'extreme', urgency: 'emergency', condition: 'poor', label: 'Worst Case' }
    ];

    return scenarios.map(scenario => ({
      ...scenario,
      pricing: this.calculatePrice(repair, scenario)
    }));
  }

  /**
   * Get seasonal demand for repair
   */
  getSeasonalDemand(repair, date = new Date()) {
    const seasonalTrends = JSON.parse(repair.seasonal_trends || '{}');
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const currentMonth = monthNames[date.getMonth()];
    return seasonalTrends[currentMonth] || 1.0;
  }

  /**
   * Check repair availability for date
   */
  isRepairAvailable(repair, date) {
    const blockedDates = JSON.parse(repair.blocked_dates || '[]');
    const dateString = date.toISOString().split('T')[0];
    
    return repair.is_enabled && !blockedDates.includes(dateString);
  }

  /**
   * Get estimated completion time
   */
  getEstimatedCompletion(repair, factors = {}) {
    const { complexity = 'standard', urgency = 'standard' } = factors;
    
    let baseHours = repair.estimated_duration;
    
    // Adjust for complexity
    const complexityMultipliers = { 
      simple: 0.8, 
      standard: 1.0, 
      complex: 1.4, 
      extreme: 2.0 
    };
    baseHours *= complexityMultipliers[complexity];
    
    const hours = Math.ceil(baseHours);
    let businessDays = Math.ceil(hours / 8);
    
    // Urgency affects turnaround time
    if (urgency === 'priority') businessDays = Math.max(1, Math.ceil(businessDays / 2));
    if (urgency === 'emergency') businessDays = 1;
    
    return { hours, businessDays };
  }

  /**
   * Update repair analytics
   */
  async updateRepairAnalytics(repairId, analyticsData) {
    const updateData = {};
    
    if (analyticsData.conversionRate !== undefined) {
      updateData.conversion_rate = analyticsData.conversionRate;
    }
    if (analyticsData.customerSatisfaction !== undefined) {
      updateData.customer_satisfaction = analyticsData.customerSatisfaction;
    }
    if (analyticsData.repeatBookingRate !== undefined) {
      updateData.repeat_booking_rate = analyticsData.repeatBookingRate;
    }
    if (analyticsData.popularityRank !== undefined) {
      updateData.popularity_rank = analyticsData.popularityRank;
    }

    return await this.update(repairId, updateData);
  }

  /**
   * Get repair performance metrics
   */
  async getRepairMetrics(repairId, dateFrom, dateTo) {
    const metrics = await this.knex.raw(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
        AVG(quote_total_price) as avg_price,
        SUM(CASE WHEN booking_status = 'completed' THEN quote_total_price ELSE 0 END) as total_revenue
      FROM bookings 
      WHERE JSON_EXTRACT_PATH_TEXT(selected_repairs, '0') = ? 
      AND created_at >= ? AND created_at <= ?
    `, [repairId, dateFrom, dateTo]);

    return metrics.rows[0];
  }

  /**
   * Sync repair configurations from config files
   */
  async syncWithConfiguration(configRepairs) {
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const configRepair of configRepairs) {
      try {
        const existingRepair = await this.findBySlug(configRepair.slug);
        
        if (existingRepair) {
          await this.update(existingRepair.id, configRepair);
          results.updated++;
        } else {
          await this.create(configRepair);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          repair: configRepair.slug,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get repair recommendations for device
   */
  async getRepairRecommendations(deviceId, issueKeywords = []) {
    let query = this.knex(this.tableName)
      .select(
        'repair_types.*',
        'repair_categories.name as category_name',
        'repair_categories.icon as category_icon'
      )
      .leftJoin('repair_categories', 'repair_types.category_id', 'repair_categories.id')
      .leftJoin('repair_device_compatibility', function() {
        this.on('repair_types.id', 'repair_device_compatibility.repair_type_id')
          .andOn('repair_device_compatibility.device_id', this.knex.raw('?', [deviceId]));
      })
      .where('repair_types.is_enabled', true)
      .where(function() {
        this.where('repair_device_compatibility.is_compatible', true)
          .orWhereNull('repair_device_compatibility.id');
      });

    // Add keyword matching if provided
    if (issueKeywords.length > 0) {
      query = query.where(function() {
        issueKeywords.forEach((keyword, index) => {
          if (index === 0) {
            this.where('repair_types.name', 'ILIKE', `%${keyword}%`)
              .orWhere('repair_types.short_description', 'ILIKE', `%${keyword}%`);
          } else {
            this.orWhere('repair_types.name', 'ILIKE', `%${keyword}%`)
              .orWhere('repair_types.short_description', 'ILIKE', `%${keyword}%`);
          }
        });
      });
    }

    return await query
      .orderBy('repair_types.popularity_rank', 'asc')
      .limit(8);
  }
}

module.exports = RepairRepository;