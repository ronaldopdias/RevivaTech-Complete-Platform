/**
 * Base Repository Class
 * Provides common database operations and configuration-driven functionality
 */

class BaseRepository {
  constructor(knex, tableName) {
    this.knex = knex;
    this.tableName = tableName;
  }

  /**
   * Create a new record
   */
  async create(data) {
    const [record] = await this.knex(this.tableName)
      .insert(data)
      .returning('*');
    return record;
  }

  /**
   * Find by ID
   */
  async findById(id) {
    return await this.knex(this.tableName)
      .where('id', id)
      .first();
  }

  /**
   * Find by slug
   */
  async findBySlug(slug) {
    return await this.knex(this.tableName)
      .where('slug', slug)
      .first();
  }

  /**
   * Find all with optional filters
   */
  async findAll(filters = {}, options = {}) {
    let query = this.knex(this.tableName);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.whereIn(key, value);
        } else {
          query = query.where(key, value);
        }
      }
    });

    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.order || 'asc');
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    const [record] = await this.knex(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    return record;
  }

  /**
   * Delete record by ID (soft delete if column exists)
   */
  async delete(id) {
    // Check if table has soft delete column
    const hasIsActive = await this.hasColumn('is_active');
    
    if (hasIsActive) {
      return await this.update(id, { is_active: false });
    } else {
      return await this.knex(this.tableName)
        .where('id', id)
        .del();
    }
  }

  /**
   * Count records with optional filters
   */
  async count(filters = {}) {
    let query = this.knex(this.tableName);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.where(key, value);
      }
    });

    const result = await query.count('* as count');
    return parseInt(result[0].count);
  }

  /**
   * Check if table has a specific column
   */
  async hasColumn(columnName) {
    const exists = await this.knex.schema.hasColumn(this.tableName, columnName);
    return exists;
  }

  /**
   * Execute raw SQL with parameters
   */
  async raw(sql, params = []) {
    return await this.knex.raw(sql, params);
  }

  /**
   * Begin transaction
   */
  async transaction(callback) {
    return await this.knex.transaction(callback);
  }

  /**
   * Search with full-text search
   */
  async search(searchTerm, searchColumns = ['name'], options = {}) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await this.findAll({}, options);
    }

    let query = this.knex(this.tableName);

    // Build search conditions
    query = query.where(function() {
      searchColumns.forEach((column, index) => {
        if (index === 0) {
          this.where(column, 'ILIKE', `%${searchTerm}%`);
        } else {
          this.orWhere(column, 'ILIKE', `%${searchTerm}%`);
        }
      });
    });

    // Apply additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(key, value);
        }
      });
    }

    // Apply ordering (relevance by default for search)
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.order || 'asc');
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Bulk insert
   */
  async bulkInsert(records) {
    if (!records || records.length === 0) {
      return [];
    }

    return await this.knex(this.tableName)
      .insert(records)
      .returning('*');
  }

  /**
   * Bulk update
   */
  async bulkUpdate(updates) {
    const results = [];
    
    for (const update of updates) {
      const { id, ...data } = update;
      const result = await this.update(id, data);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get paginated results with metadata
   */
  async paginate(filters = {}, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [records, totalCount] = await Promise.all([
      this.findAll(filters, { ...options, limit, offset }),
      this.count(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: records,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

module.exports = BaseRepository;