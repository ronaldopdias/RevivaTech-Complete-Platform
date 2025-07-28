/**
 * Simple Device API Routes
 * Works with the existing database schema
 */

const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        slug,
        description,
        "iconName" as icon,
        "sortOrder" as sort_order,
        "isActive" as is_active
      FROM device_categories
      WHERE "isActive" = true
      ORDER BY "sortOrder", name
    `;

    const result = await req.pool.query(query);
    res.json(result.rows);

  } catch (error) {
    req.logger.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all brands
router.get('/brands', async (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT 
        b.id,
        b.name,
        b.slug,
        b."logoUrl" as logo_url,
        b.website,
        b."isActive" as is_active,
        COUNT(d.id) as device_count
      FROM device_brands b
      LEFT JOIN device_models d ON b.id = d."brandId" AND d."isActive" = true
    `;

    const params = [];
    if (category) {
      query += `
        LEFT JOIN device_categories c ON b."categoryId" = c.id
        WHERE b."isActive" = true AND c.slug = $1
      `;
      params.push(category);
    } else {
      query += ` WHERE b."isActive" = true`;
    }

    query += `
      GROUP BY b.id
      HAVING COUNT(d.id) > 0
      ORDER BY b.name
    `;

    const result = await req.pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    req.logger.error('Brands fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search devices
router.get('/search', [
  query('q').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('category').optional().isString().trim(),
  query('brand').optional().isString().trim(),
  query('year_min').optional().isInt({ min: 2016, max: 2025 }),
  query('year_max').optional().isInt({ min: 2016, max: 2025 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sort').optional().isIn(['popularity', 'year', 'name'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q = '',
      category = '',
      brand = '',
      year_min = 2016,
      year_max = 2025,
      page = 1,
      limit = 20,
      sort = 'year'
    } = req.query;

    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        d.id,
        d.name,
        d.slug,
        d.year,
        d."screenSize" as screen_size,
        d.specs,
        d."imageUrl" as image_url,
        d."isActive" as is_active,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM device_models d
      LEFT JOIN device_brands b ON d."brandId" = b.id
      LEFT JOIN device_categories c ON b."categoryId" = c.id
      WHERE d."isActive" = true
    `;

    const params = [];
    let paramIndex = 1;

    // Add search conditions
    if (q) {
      baseQuery += ` AND (
        LOWER(d.name) LIKE LOWER($${paramIndex}) OR
        LOWER(b.name) LIKE LOWER($${paramIndex}) OR
        LOWER(c.name) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      baseQuery += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (brand) {
      baseQuery += ` AND b.slug = $${paramIndex}`;
      params.push(brand);
      paramIndex++;
    }

    if (year_min) {
      baseQuery += ` AND d.year >= $${paramIndex}`;
      params.push(year_min);
      paramIndex++;
    }

    if (year_max) {
      baseQuery += ` AND d.year <= $${paramIndex}`;
      params.push(year_max);
      paramIndex++;
    }

    // Add sorting
    const sortMap = {
      year: 'd.year DESC, d.name ASC',
      name: 'd.name ASC',
      popularity: 'd.year DESC, d.name ASC' // fallback to year since we don't have popularity
    };

    baseQuery += ` ORDER BY ${sortMap[sort] || sortMap.year}`;

    // Add pagination
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await req.pool.query(baseQuery, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM device_models d
      LEFT JOIN device_brands b ON d."brandId" = b.id
      LEFT JOIN device_categories c ON b."categoryId" = c.id
      WHERE d."isActive" = true
    `;

    const countParams = [];
    let countParamIndex = 1;

    if (q) {
      countQuery += ` AND (
        LOWER(d.name) LIKE LOWER($${countParamIndex}) OR
        LOWER(b.name) LIKE LOWER($${countParamIndex}) OR
        LOWER(c.name) LIKE LOWER($${countParamIndex})
      )`;
      countParams.push(`%${q}%`);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND c.slug = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (brand) {
      countQuery += ` AND b.slug = $${countParamIndex}`;
      countParams.push(brand);
      countParamIndex++;
    }

    if (year_min) {
      countQuery += ` AND d.year >= $${countParamIndex}`;
      countParams.push(year_min);
      countParamIndex++;
    }

    if (year_max) {
      countQuery += ` AND d.year <= $${countParamIndex}`;
      countParams.push(year_max);
      countParamIndex++;
    }

    const countResult = await req.pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      devices: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        query: q,
        category,
        brand,
        year_range: [year_min, year_max],
        sort
      }
    });

  } catch (error) {
    req.logger.error('Device search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device details by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const query = `
      SELECT 
        d.*,
        c.name as category_name,
        c.slug as category_slug,
        c.description as category_description,
        b.name as brand_name,
        b.slug as brand_slug,
        b."logoUrl" as brand_logo,
        b.website as brand_website
      FROM device_models d
      LEFT JOIN device_brands b ON d."brandId" = b.id
      LEFT JOIN device_categories c ON b."categoryId" = c.id
      WHERE d."isActive" = true AND (d.id = $1 OR d.slug = $1)
    `;

    const result = await req.pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = result.rows[0];

    res.json({
      device,
      repair_info: {
        repairability_score: device.specs?.repairability_score || 5.0,
        average_repair_cost: device.specs?.average_repair_cost || 200,
        warranty_void_on_repair: device.specs?.warranty_void_on_repair !== false
      }
    });

  } catch (error) {
    req.logger.error('Device details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular devices
router.get('/meta/popular', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    let query = `
      SELECT 
        d.id,
        d.name,
        d.slug,
        d.year,
        d."imageUrl" as image_url,
        d."screenSize" as screen_size,
        c.name as category_name,
        b.name as brand_name
      FROM device_models d
      LEFT JOIN device_brands b ON d."brandId" = b.id
      LEFT JOIN device_categories c ON b."categoryId" = c.id
      WHERE d."isActive" = true
    `;

    const params = [];
    if (category) {
      query += ` AND c.slug = $1`;
      params.push(category);
    }

    query += `
      ORDER BY d.year DESC, d.name ASC
      LIMIT $${params.length + 1}
    `;

    params.push(limit);

    const result = await req.pool.query(query, params);
    res.json(result.rows);

  } catch (error) {
    req.logger.error('Popular devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;