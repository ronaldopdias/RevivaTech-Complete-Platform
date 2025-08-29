const express = require('express');
const Joi = require('joi');
const { optionalAuth } = require('../lib/auth-utils');
const { prisma } = require('../lib/prisma');
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
    const categories = await prisma.deviceCategory.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconName: true,
        sortOrder: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      categories: categories
    });

  } catch (error) {
    req.logger?.error('Get categories error:', error);
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

    const brands = await prisma.deviceBrand.findMany({
      where: {
        categoryId: categoryId,
        isActive: true,
        models: {
          some: {} // Only brands that have at least one model
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      brands: brands
    });

  } catch (error) {
    req.logger?.error('Get brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch device brands',
      code: 'FETCH_BRANDS_ERROR'
    });
  }
});

// Get all brands (with category info)
router.get('/brands', optionalAuth, async (req, res) => {
  try {
    const brands = await prisma.deviceBrand.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true
        },
        models: {
          some: {} // Only brands that have at least one model
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            sortOrder: true
          }
        }
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { category: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Group brands by category
    const brandsByCategory = {};
    brands.forEach(brand => {
      const categoryKey = brand.category.id;
      if (!brandsByCategory[categoryKey]) {
        brandsByCategory[categoryKey] = {
          categoryId: brand.category.id,
          categoryName: brand.category.name,
          categorySlug: brand.category.slug,
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
    req.logger?.error('Get all brands error:', error);
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

    const whereClause = {
      brandId: brandId,
      isActive: true,
      ...(year && { year: parseInt(year) })
    };

    const models = await prisma.deviceModel.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        year: true,
        screenSize: true,
        specs: true,
        imageUrl: true,
        brand: {
          select: {
            name: true,
            slug: true,
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { name: 'asc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform to match expected structure
    const transformedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      slug: model.slug,
      year: model.year,
      screenSize: model.screenSize,
      specs: model.specs,
      imageUrl: model.imageUrl,
      brandName: model.brand.name,
      brandSlug: model.brand.slug,
      categoryName: model.brand.category.name,
      categorySlug: model.brand.category.slug
    }));

    res.json({
      success: true,
      models: transformedModels
    });

  } catch (error) {
    req.logger?.error('Get models error:', error);
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

    // Build where clause
    const whereClause = {
      isActive: true,
      brand: {
        isActive: true,
        ...(brandId && { id: brandId }),
        category: {
          isActive: true,
          ...(categoryId && { id: categoryId })
        }
      },
      ...(year && { year: year })
    };

    // Add search condition
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count
    const total = await prisma.deviceModel.count({
      where: whereClause
    });

    // Get models
    const models = await prisma.deviceModel.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        year: true,
        screenSize: true,
        specs: true,
        imageUrl: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { brand: { name: 'asc' } },
        { name: 'asc' }
      ],
      take: limit,
      skip: offset
    });

    // Transform to match expected structure
    const transformedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      slug: model.slug,
      year: model.year,
      screenSize: model.screenSize,
      specs: model.specs,
      imageUrl: model.imageUrl,
      brandId: model.brand.id,
      brandName: model.brand.name,
      brandSlug: model.brand.slug,
      categoryId: model.brand.category.id,
      categoryName: model.brand.category.name,
      categorySlug: model.brand.category.slug
    }));

    res.json({
      success: true,
      models: transformedModels,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    req.logger?.error('Search models error:', error);
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

    const model = await prisma.deviceModel.findUnique({
      where: {
        id: id,
        isActive: true
      },
      include: {
        brand: {
          include: {
            category: true
          }
        }
      }
    });

    if (!model) {
      return res.status(404).json({
        error: 'Device model not found',
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Get related models (same brand, different years or similar models)
    const relatedModels = await prisma.deviceModel.findMany({
      where: {
        brandId: model.brandId,
        id: { not: model.id },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        year: true,
        imageUrl: true
      },
      orderBy: [
        // Sort by year difference (closest years first)
        { year: model.year > 2020 ? 'desc' : 'asc' },
        { name: 'asc' }
      ],
      take: 5
    });

    // Transform current model to match expected structure
    const transformedModel = {
      ...model,
      brandId: model.brand.id,
      brandName: model.brand.name,
      brandSlug: model.brand.slug,
      brandLogoUrl: model.brand.logoUrl,
      categoryId: model.brand.category.id,
      categoryName: model.brand.category.name,
      categorySlug: model.brand.category.slug,
      categoryDescription: model.brand.category.description
    };

    res.json({
      success: true,
      model: transformedModel,
      relatedModels: relatedModels
    });

  } catch (error) {
    req.logger?.error('Get model error:', error);
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

    // Calculate date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get models with booking counts using Prisma aggregation
    const models = await prisma.deviceModel.findMany({
      where: {
        isActive: true,
        brand: {
          isActive: true,
          category: {
            isActive: true
          }
        }
      },
      include: {
        brand: {
          include: {
            category: true
          }
        },
        bookings: {
          where: {
            createdAt: {
              gte: threeMonthsAgo
            }
          },
          select: {
            id: true
          }
        }
      },
      take: parseInt(limit) * 2 // Get more than needed to sort properly
    });

    // Sort by booking count and transform
    const popularModels = models
      .map(model => ({
        id: model.id,
        name: model.name,
        slug: model.slug,
        year: model.year,
        imageUrl: model.imageUrl,
        brandName: model.brand.name,
        categoryName: model.brand.category.name,
        bookingCount: model.bookings.length
      }))
      .sort((a, b) => {
        // Sort by booking count desc, then by year desc, then by name asc
        if (b.bookingCount !== a.bookingCount) {
          return b.bookingCount - a.bookingCount;
        }
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      popularModels: popularModels
    });

  } catch (error) {
    req.logger?.error('Get popular models error:', error);
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

    const yearsResult = await prisma.deviceModel.findMany({
      where: {
        brandId: brandId,
        isActive: true
      },
      select: {
        year: true
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc'
      }
    });

    const years = yearsResult.map(result => result.year);

    res.json({
      success: true,
      years: years
    });

  } catch (error) {
    req.logger?.error('Get years error:', error);
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