/**
 * Booking Repository
 * Handles booking operations with configuration-driven flow management
 */

const BaseRepository = require('./base.repository');

class BookingRepository extends BaseRepository {
  constructor(knex) {
    super(knex, 'bookings');
  }

  /**
   * Create a new booking with initial flow state
   */
  async createBooking(customerData, deviceData = {}, initialStep = 'device-selection') {
    return await this.transaction(async (trx) => {
      // Create or find customer
      let customer;
      const existingCustomer = await trx('customers')
        .where('email', customerData.email)
        .first();

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        [customer] = await trx('customers')
          .insert(customerData)
          .returning('*');
      }

      // Create booking
      const bookingData = {
        customer_id: customer.id,
        current_step: initialStep,
        booking_status: 'draft',
        completion_percentage: 0,
        ...deviceData,
        session_data: JSON.stringify({}),
        auto_save_data: JSON.stringify({})
      };

      const [booking] = await trx(this.tableName)
        .insert(bookingData)
        .returning('*');

      // Track initial event
      await trx('booking_analytics').insert({
        booking_id: booking.id,
        customer_id: customer.id,
        event_type: 'flow_started',
        event_data: JSON.stringify({ initial_step: initialStep }),
        step_name: initialStep
      });

      return { booking, customer };
    });
  }

  /**
   * Update booking flow state with validation
   */
  async updateBookingStep(bookingId, stepData, targetStep) {
    return await this.transaction(async (trx) => {
      const booking = await trx(this.tableName)
        .where('id', bookingId)
        .first();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const updateData = {
        ...stepData,
        current_step: targetStep,
        auto_save_data: JSON.stringify({
          ...JSON.parse(booking.auto_save_data || '{}'),
          [booking.current_step]: stepData,
          last_updated: new Date().toISOString()
        }),
        last_activity: new Date()
      };

      // Calculate completion percentage based on step
      const stepOrder = {
        'device-selection': 16,
        'issue-description': 33,
        'service-preferences': 50,
        'quote-review': 66,
        'customer-details': 83,
        'confirmation': 100
      };
      updateData.completion_percentage = stepOrder[targetStep] || 0;

      const [updatedBooking] = await trx(this.tableName)
        .where('id', bookingId)
        .update(updateData)
        .returning('*');

      // Track state transition
      await trx('booking_state_transitions').insert({
        booking_id: bookingId,
        from_state: booking.current_step,
        to_state: targetStep,
        transition_reason: 'user_navigation'
      });

      return updatedBooking;
    });
  }

  /**
   * Get booking with full details and related data
   */
  async getBookingWithDetails(bookingId) {
    const booking = await this.knex(this.tableName)
      .select(
        'bookings.*',
        'customers.first_name',
        'customers.last_name',
        'customers.email',
        'customers.phone',
        'devices.name as device_name',
        'devices.model as device_model',
        'device_brands.name as brand_name',
        'device_categories.name as category_name'
      )
      .leftJoin('customers', 'bookings.customer_id', 'customers.id')
      .leftJoin('devices', 'bookings.device_id', 'devices.id')
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .leftJoin('device_categories', 'devices.category_id', 'device_categories.id')
      .where('bookings.id', bookingId)
      .first();

    if (!booking) {
      return null;
    }

    // Get selected repairs
    const selectedRepairs = [];
    if (booking.selected_repairs && Array.isArray(JSON.parse(booking.selected_repairs))) {
      const repairIds = JSON.parse(booking.selected_repairs);
      const repairs = await this.knex('repair_types')
        .whereIn('id', repairIds)
        .select('*');
      selectedRepairs.push(...repairs);
    }

    // Get state history
    const stateHistory = await this.knex('booking_state_transitions')
      .where('booking_id', bookingId)
      .orderBy('created_at', 'asc');

    // Get analytics events
    const analyticsEvents = await this.knex('booking_analytics')
      .where('booking_id', bookingId)
      .orderBy('created_at', 'desc')
      .limit(20);

    return {
      ...booking,
      selectedRepairs,
      stateHistory,
      analyticsEvents,
      sessionData: JSON.parse(booking.session_data || '{}'),
      autoSaveData: JSON.parse(booking.auto_save_data || '{}')
    };
  }

  /**
   * Get customer's booking history
   */
  async getCustomerBookings(customerId, options = {}) {
    let query = this.knex(this.tableName)
      .select(
        'bookings.*',
        'devices.name as device_name',
        'device_brands.name as brand_name'
      )
      .leftJoin('devices', 'bookings.device_id', 'devices.id')
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .where('bookings.customer_id', customerId);

    if (options.status) {
      query = query.where('bookings.booking_status', options.status);
    }

    return await query.orderBy('bookings.created_at', 'desc');
  }

  /**
   * Get active bookings for dashboard
   */
  async getActiveBookings(filters = {}) {
    let query = this.knex(this.tableName)
      .select(
        'bookings.*',
        'customers.first_name',
        'customers.last_name',
        'customers.email',
        'devices.name as device_name',
        'device_brands.name as brand_name'
      )
      .leftJoin('customers', 'bookings.customer_id', 'customers.id')
      .leftJoin('devices', 'bookings.device_id', 'devices.id')
      .leftJoin('device_brands', 'devices.brand_id', 'device_brands.id')
      .whereIn('bookings.booking_status', ['pending', 'confirmed', 'in_progress']);

    if (filters.urgency) {
      query = query.where('bookings.urgency_level', filters.urgency);
    }

    if (filters.dateFrom) {
      query = query.where('bookings.scheduled_date', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('bookings.scheduled_date', '<=', filters.dateTo);
    }

    return await query.orderBy('bookings.scheduled_date', 'asc');
  }

  /**
   * Get booking analytics for dashboard
   */
  async getBookingAnalytics(dateFrom, dateTo) {
    const analytics = await this.knex.raw(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN booking_status = 'draft' THEN 1 END) as abandoned_bookings,
        AVG(quote_total_price) as avg_quote_value,
        SUM(CASE WHEN booking_status = 'completed' THEN quote_total_price ELSE 0 END) as total_revenue
      FROM bookings 
      WHERE created_at >= ? AND created_at <= ?
    `, [dateFrom, dateTo]);

    const stepAnalytics = await this.knex.raw(`
      SELECT 
        current_step,
        COUNT(*) as count,
        AVG(completion_percentage) as avg_completion
      FROM bookings 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY current_step
      ORDER BY avg_completion ASC
    `, [dateFrom, dateTo]);

    return {
      summary: analytics.rows[0],
      stepBreakdown: stepAnalytics.rows
    };
  }

  /**
   * Update booking quote and pricing
   */
  async updateBookingQuote(bookingId, quoteData) {
    return await this.update(bookingId, {
      quote_base_price: quoteData.basePrice,
      quote_labor_cost: quoteData.laborCost,
      quote_total_price: quoteData.totalPrice,
      quote_valid_until: quoteData.validUntil,
      applied_factors: JSON.stringify(quoteData.appliedFactors || []),
      applied_discounts: JSON.stringify(quoteData.appliedDiscounts || []),
      pricing_breakdown: JSON.stringify(quoteData.breakdown || {})
    });
  }

  /**
   * Accept booking quote
   */
  async acceptQuote(bookingId) {
    return await this.transaction(async (trx) => {
      const [booking] = await trx(this.tableName)
        .where('id', bookingId)
        .update({
          quote_accepted: true,
          quote_accepted_at: new Date(),
          booking_status: 'pending'
        })
        .returning('*');

      // Track quote acceptance
      await trx('booking_analytics').insert({
        booking_id: bookingId,
        customer_id: booking.customer_id,
        event_type: 'quote_accepted',
        event_data: JSON.stringify({ 
          quote_value: booking.quote_total_price 
        })
      });

      return booking;
    });
  }

  /**
   * Confirm booking and schedule
   */
  async confirmBooking(bookingId, scheduleData) {
    return await this.transaction(async (trx) => {
      const [booking] = await trx(this.tableName)
        .where('id', bookingId)
        .update({
          booking_status: 'confirmed',
          scheduled_date: scheduleData.scheduledDate,
          estimated_completion: scheduleData.estimatedCompletion,
          service_type: scheduleData.serviceType,
          collection_address: JSON.stringify(scheduleData.collectionAddress || {}),
          collection_instructions: scheduleData.collectionInstructions,
          terms_accepted: true,
          terms_accepted_at: new Date()
        })
        .returning('*');

      // Track booking confirmation
      await trx('booking_analytics').insert({
        booking_id: bookingId,
        customer_id: booking.customer_id,
        event_type: 'booking_confirmed',
        event_data: JSON.stringify({
          scheduled_date: scheduleData.scheduledDate,
          service_type: scheduleData.serviceType
        })
      });

      return booking;
    });
  }

  /**
   * Get abandoned bookings for follow-up
   */
  async getAbandonedBookings(hoursAgo = 24) {
    const cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
    
    return await this.knex(this.tableName)
      .select(
        'bookings.*',
        'customers.first_name',
        'customers.email'
      )
      .leftJoin('customers', 'bookings.customer_id', 'customers.id')
      .where('bookings.booking_status', 'draft')
      .where('bookings.last_activity', '<', cutoffTime)
      .where('bookings.completion_percentage', '>', 0)
      .orderBy('bookings.last_activity', 'desc');
  }

  /**
   * Auto-save booking progress
   */
  async autoSaveProgress(bookingId, stepData) {
    const booking = await this.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const currentAutoSave = JSON.parse(booking.auto_save_data || '{}');
    const updatedAutoSave = {
      ...currentAutoSave,
      [booking.current_step]: stepData,
      last_auto_save: new Date().toISOString()
    };

    return await this.update(bookingId, {
      auto_save_data: JSON.stringify(updatedAutoSave),
      last_activity: new Date()
    });
  }

  /**
   * Get booking funnel analytics
   */
  async getBookingFunnelAnalytics(dateFrom, dateTo) {
    const funnelData = await this.knex.raw(`
      WITH step_counts AS (
        SELECT 
          current_step,
          COUNT(*) as step_count,
          COUNT(CASE WHEN booking_status != 'draft' THEN 1 END) as completed_step_count
        FROM bookings 
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY current_step
      )
      SELECT 
        current_step,
        step_count,
        completed_step_count,
        ROUND((completed_step_count::float / step_count) * 100, 2) as completion_rate
      FROM step_counts
      ORDER BY 
        CASE current_step
          WHEN 'device-selection' THEN 1
          WHEN 'issue-description' THEN 2
          WHEN 'service-preferences' THEN 3
          WHEN 'quote-review' THEN 4
          WHEN 'customer-details' THEN 5
          WHEN 'confirmation' THEN 6
          ELSE 99
        END
    `, [dateFrom, dateTo]);

    return funnelData.rows;
  }

  /**
   * Clean up old draft bookings
   */
  async cleanupOldDrafts(daysOld = 7) {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    
    const deletedCount = await this.knex(this.tableName)
      .where('booking_status', 'draft')
      .where('created_at', '<', cutoffDate)
      .del();

    return deletedCount;
  }
}

module.exports = BookingRepository;