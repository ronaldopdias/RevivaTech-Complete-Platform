import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import devicesConfig from '../../../../config/devices';

const prisma = new PrismaClient();

// Helper function to seed categories from config
async function seedCategoriesFromConfig() {
  try {
    const categoryCount = await prisma.deviceCategory.count();
    if (categoryCount > 0) {
      return; // Already seeded
    }

    console.log('Seeding categories from configuration...');

    for (const category of devicesConfig.categories) {
      await prisma.deviceCategory.upsert({
        where: { slug: category.id },
        update: {},
        create: {
          id: category.id,
          name: category.name,
          slug: category.id,
          description: category.description,
          iconName: category.icon,
          isActive: true
        }
      });
    }

    console.log('Categories seeded successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
}

// GET /api/categories - Get all device categories
export async function GET(request: NextRequest) {
  try {
    // Ensure categories are seeded
    await seedCategoriesFromConfig();

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get categories from database
    const categories = await prisma.deviceCategory.findMany({
      where: { isActive: true },
      include: {
        brands: {
          where: { isActive: true },
          include: includeStats ? {
            models: {
              where: { isActive: true }
            }
          } : false
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Transform categories to match expected format
    const transformedCategories = categories.map(category => {
      const configCategory = devicesConfig.categories.find(c => c.id === category.slug);
      
      let stats = {};
      if (includeStats) {
        const totalDevices = category.brands.reduce((sum, brand) => 
          sum + (brand.models?.length || 0), 0
        );
        const brandCount = category.brands.length;
        
        stats = {
          deviceCount: totalDevices,
          brandCount,
          popularModels: configCategory?.popularModels || []
        };
      }

      return {
        id: category.slug,
        name: category.name,
        description: category.description,
        icon: category.iconName,
        brands: configCategory?.brands || category.brands.map(b => b.name),
        popularModels: configCategory?.popularModels || [],
        ...stats
      };
    });

    // If no categories in database, return config data
    if (transformedCategories.length === 0) {
      let configCategories = devicesConfig.categories;
      
      if (includeStats) {
        configCategories = devicesConfig.categories.map(category => ({
          ...category,
          ...devicesConfig.utils.getCategoryStats().find(s => s.category.id === category.id)
        }));
      }

      return NextResponse.json({
        categories: configCategories,
        source: 'config'
      });
    }

    return NextResponse.json({
      categories: transformedCategories,
      source: 'database'
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      iconName,
      sortOrder
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.deviceCategory.findFirst({
      where: {
        OR: [
          { slug },
          { name }
        ]
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.deviceCategory.create({
      data: {
        name,
        slug,
        description,
        iconName,
        sortOrder: sortOrder || 0,
        isActive: true
      }
    });

    return NextResponse.json({
      message: 'Category created successfully',
      category
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}