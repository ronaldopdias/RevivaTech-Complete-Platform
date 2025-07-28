const express = require('express');
const Joi = require('joi');
const { optionalAuth } = require('../middleware/authentication');
const router = express.Router();

// Validation schemas
const searchSchema = Joi.object({
  search: Joi.string().min(2).max(100).optional(),
  categoryId: Joi.string().optional(),
  brandId: Joi.string().optional(),
  year: Joi.number().integer().min(2010).max(2030).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

// Get all device categories
router.get('/categories', optionalAuth, async (req, res) => {
  try {
    const categoriesQuery = `
      SELECT 
        id, 
        name, 
        slug, 
        description, 
        "iconName", 
        "sortOrder"
      FROM device_categories 
      WHERE "isActive" = true 
      ORDER BY "sortOrder" ASC, name ASC
    `;

    const result = await req.pool.query(categoriesQuery);

    res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    req.logger.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch device categories',
      code: 'FETCH_CATEGORIES_ERROR'
    });
  }
});

// Get brands for a specific category
router.get('/categories/:categoryId/brands', optionalAuth, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const brandsQuery = `
      SELECT 
        id, 
        name, 
        slug, 
        "logoUrl"
      FROM device_brands 
      WHERE "categoryId" = $1 AND "isActive" = true 
      ORDER BY name ASC
    `;

    const result = await req.pool.query(brandsQuery, [categoryId]);

    res.json({
      success: true,
      brands: result.rows
    });

  } catch (error) {
    req.logger.error('Get brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch device brands',
      code: 'FETCH_BRANDS_ERROR'
    });
  }
});

// Get all brands (with category info)
router.get('/brands', optionalAuth, async (req, res) => {
  try {
    const brandsQuery = `
      SELECT 
        b.id,
        b.name,
        b.slug,
        b."logoUrl",
        b."categoryId",
        c.name as "categoryName",
        c.slug as "categorySlug"
      FROM device_brands b
      JOIN device_categories c ON b."categoryId" = c.id
      WHERE b."isActive" = true AND c."isActive" = true
      ORDER BY c."sortOrder" ASC, c.name ASC, b.name ASC
    `;

    const result = await req.pool.query(brandsQuery);

    // Group brands by category
    const brandsByCategory = {};
    result.rows.forEach(brand => {
      const categoryKey = brand.categoryId;
      if (!brandsByCategory[categoryKey]) {
        brandsByCategory[categoryKey] = {
          categoryId: brand.categoryId,
          categoryName: brand.categoryName,
          categorySlug: brand.categorySlug,
          brands: []
        };
      }
      brandsByCategory[categoryKey].brands.push({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl
      });
    });

    res.json({
      success: true,
      brandsByCategory: Object.values(brandsByCategory)
    });

  } catch (error) {
    req.logger.error('Get all brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch brands',
      code: 'FETCH_ALL_BRANDS_ERROR'
    });
  }
});

// Get device models for a specific brand
router.get('/brands/:brandId/models', optionalAuth, async (req, res) => {
  try {
    const { brandId } = req.params;
    const { year, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE dm."brandId" = $1 AND dm."isActive" = true';
    const queryParams = [brandId];
    let paramIndex = 2;

    if (year) {
      whereClause += ` AND dm.year = $${paramIndex}`;
      queryParams.push(parseInt(year));
      paramIndex++;
    }

    const modelsQuery = `
      SELECT 
        dm.id,
        dm.name,
        dm.slug,
        dm.year,
        dm."screenSize",
        dm.specs,
        dm."imageUrl",
        b.name as "brandName",
        b.slug as "brandSlug",
        c.name as "categoryName",
        c.slug as "categorySlug"
      FROM device_models dm
      JOIN device_brands b ON dm."brandId" = b.id
      JOIN device_categories c ON b."categoryId" = c.id
      ${whereClause}
      ORDER BY dm.year DESC, dm.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const result = await req.pool.query(modelsQuery, queryParams);

    res.json({
      success: true,
      models: result.rows
    });

  } catch (error) {
    req.logger.error('Get models error:', error);
    res.status(500).json({
      error: 'Failed to fetch device models',
      code: 'FETCH_MODELS_ERROR'
    });
  }
});

// Search device models
router.get('/models/search', optionalAuth, async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Invalid search parameters',
        details: error.details.map(detail => detail.message)
      });
    }

    const { search, categoryId, brandId, year, limit, offset } = value;

    let whereClause = 'WHERE dm."isActive" = true AND b."isActive" = true AND c."isActive" = true';
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (dm.name ILIKE $${paramIndex} OR b.name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (categoryId) {
      whereClause += ` AND c.id = $${paramIndex}`;
      queryParams.push(categoryId);
      paramIndex++;
    }

    if (brandId) {
      whereClause += ` AND b.id = $${paramIndex}`;
      queryParams.push(brandId);
      paramIndex++;
    }

    if (year) {
      whereClause += ` AND dm.year = $${paramIndex}`;
      queryParams.push(year);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*)
      FROM device_models dm
      JOIN device_brands b ON dm."brandId" = b.id
      JOIN device_categories c ON b."categoryId" = c.id
      ${whereClause}
    `;

    const countResult = await req.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get models
    const modelsQuery = `
      SELECT 
        dm.id,
        dm.name,
        dm.slug,
        dm.year,
        dm."screenSize",
        dm.specs,
        dm."imageUrl",
        b.id as "brandId",
        b.name as "brandName",
        b.slug as "brandSlug",
        c.id as "categoryId",
        c.name as "categoryName",
        c.slug as "categorySlug"
      FROM device_models dm
      JOIN device_brands b ON dm."brandId" = b.id
      JOIN device_categories c ON b."categoryId" = c.id
      ${whereClause}
      ORDER BY dm.year DESC, b.name ASC, dm.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const modelsResult = await req.pool.query(modelsQuery, queryParams);

    res.json({
      success: true,
      models: modelsResult.rows,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    req.logger.error('Search models error:', error);
    res.status(500).json({
      error: 'Failed to search device models',
      code: 'SEARCH_MODELS_ERROR'
    });
  }
});

// Get single device model by ID
router.get('/models/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const modelQuery = `
      SELECT 
        dm.*,
        b.id as "brandId",
        b.name as "brandName",
        b.slug as "brandSlug",
        b."logoUrl" as "brandLogoUrl",
        c.id as "categoryId",
        c.name as "categoryName",
        c.slug as "categorySlug",
        c.description as "categoryDescription"
      FROM device_models dm
      JOIN device_brands b ON dm."brandId" = b.id
      JOIN device_categories c ON b."categoryId" = c.id
      WHERE dm.id = $1 AND dm."isActive" = true
    `;

    const result = await req.pool.query(modelQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Device model not found',
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Get related models (same brand, different years or similar models)
    const relatedQuery = `
      SELECT 
        dm.id,
        dm.name,
        dm.slug,
        dm.year,
        dm."imageUrl"
      FROM device_models dm
      WHERE dm."brandId" = $1 
        AND dm.id != $2 
        AND dm."isActive" = true
      ORDER BY ABS(dm.year - $3) ASC, dm.name ASC
      LIMIT 5
    `;

    const currentModel = result.rows[0];
    const relatedResult = await req.pool.query(relatedQuery, [
      currentModel.brandId,
      currentModel.id,
      currentModel.year
    ]);

    res.json({
      success: true,
      model: currentModel,
      relatedModels: relatedResult.rows
    });

  } catch (error) {
    req.logger.error('Get model error:', error);
    res.status(500).json({
      error: 'Failed to fetch device model',
      code: 'FETCH_MODEL_ERROR'
    });
  }
});

// Get popular/featured device models
router.get('/models/featured/popular', optionalAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get most booked device models in the last 3 months
    const popularQuery = `
      SELECT 
        dm.id,
        dm.name,
        dm.slug,
        dm.year,
        dm."imageUrl",
        b.name as "brandName",
        c.name as "categoryName",
        COUNT(bo.id) as booking_count
      FROM device_models dm
      JOIN device_brands b ON dm."brandId" = b.id
      JOIN device_categories c ON b."categoryId" = c.id
      LEFT JOIN bookings bo ON dm.id = bo."deviceModelId" 
        AND bo."createdAt" >= NOW() - INTERVAL '3 months'
      WHERE dm."isActive" = true AND b."isActive" = true AND c."isActive" = true
      GROUP BY dm.id, dm.name, dm.slug, dm.year, dm."imageUrl", b.name, c.name
      ORDER BY booking_count DESC, dm.year DESC, dm.name ASC
      LIMIT $1
    `;

    const result = await req.pool.query(popularQuery, [parseInt(limit)]);

    res.json({
      success: true,
      popularModels: result.rows.map(model => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        year: model.year,
        imageUrl: model.imageUrl,
        brandName: model.brandName,
        categoryName: model.categoryName,
        bookingCount: parseInt(model.booking_count)
      }))
    });

  } catch (error) {
    req.logger.error('Get popular models error:', error);
    res.status(500).json({
      error: 'Failed to fetch popular device models',
      code: 'FETCH_POPULAR_MODELS_ERROR'
    });
  }
});

// Get device years for a brand (for filtering)
router.get('/brands/:brandId/years', optionalAuth, async (req, res) => {
  try {
    const { brandId } = req.params;

    const yearsQuery = `
      SELECT DISTINCT year
      FROM device_models
      WHERE "brandId" = $1 AND "isActive" = true
      ORDER BY year DESC
    `;

    const result = await req.pool.query(yearsQuery, [brandId]);

    res.json({
      success: true,
      years: result.rows.map(row => row.year)
    });

  } catch (error) {
    req.logger.error('Get years error:', error);
    res.status(500).json({
      error: 'Failed to fetch device years',
      code: 'FETCH_YEARS_ERROR'
    });
  }
});

// Health check for devices API
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'devices-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;