// Device Repository
// Repository for device catalog management (categories, brands, models)

import { 
  DeviceCategory, 
  DeviceBrand, 
  DeviceModel 
} from '@/generated/prisma';
import { BaseRepository, PaginationOptions, PaginatedResult } from '../database/repository.base';

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  sortOrder?: number;
}

export interface CreateBrandData {
  categoryId: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface CreateModelData {
  brandId: string;
  name: string;
  slug: string;
  year: number;
  screenSize?: number;
  specs?: any;
  imageUrl?: string;
}

export interface DeviceSearchFilters {
  categoryId?: string;
  brandId?: string;
  yearFrom?: number;
  yearTo?: number;
  screenSizeMin?: number;
  screenSizeMax?: number;
  isActive?: boolean;
}

export class DeviceCategoryRepository extends BaseRepository<DeviceCategory> {
  protected readonly modelName = 'deviceCategory';

  async createCategory(data: CreateCategoryData): Promise<DeviceCategory> {
    return await this.create(data);
  }

  async findBySlug(slug: string): Promise<DeviceCategory | null> {
    return await this.findFirst({ slug });
  }

  async findActiveCategories(): Promise<DeviceCategory[]> {
    return await this.findMany({
      where: { isActive: true },
      orderBy: [{ field: 'sortOrder', direction: 'asc' }],
    });
  }

  async findCategoryWithBrands(id: string): Promise<DeviceCategory | null> {
    return await this.findById(id, {
      brands: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    });
  }

  async reorderCategories(categoryOrders: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await this.transaction(async (tx) => {
      for (const { id, sortOrder } of categoryOrders) {
        await tx.deviceCategory.update({
          where: { id },
          data: { sortOrder },
        });
      }
    });
  }
}

export class DeviceBrandRepository extends BaseRepository<DeviceBrand> {
  protected readonly modelName = 'deviceBrand';

  async createBrand(data: CreateBrandData): Promise<DeviceBrand> {
    return await this.create(data);
  }

  async findBySlug(categoryId: string, slug: string): Promise<DeviceBrand | null> {
    return await this.findFirst({ categoryId, slug });
  }

  async findBrandsByCategory(categoryId: string): Promise<DeviceBrand[]> {
    return await this.findMany({
      where: { categoryId, isActive: true },
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
  }

  async findBrandWithModels(id: string): Promise<DeviceBrand | null> {
    return await this.findById(id, {
      models: {
        where: { isActive: true },
        orderBy: [
          { year: 'desc' },
          { name: 'asc' },
        ],
      },
      category: true,
    });
  }

  async findPopularBrands(limit: number = 10): Promise<DeviceBrand[]> {
    return await this.rawQuery(`
      SELECT db.*, COUNT(b.id) as booking_count
      FROM device_brands db
      LEFT JOIN device_models dm ON dm.brand_id = db.id
      LEFT JOIN bookings b ON b.device_model_id = dm.id
      WHERE db.is_active = true
      GROUP BY db.id
      ORDER BY booking_count DESC
      LIMIT ?
    `, limit);
  }
}

export class DeviceModelRepository extends BaseRepository<DeviceModel> {
  protected readonly modelName = 'deviceModel';

  async createModel(data: CreateModelData): Promise<DeviceModel> {
    return await this.create(data);
  }

  async findBySlug(brandId: string, slug: string): Promise<DeviceModel | null> {
    return await this.findFirst({ brandId, slug });
  }

  async findModelsByBrand(brandId: string): Promise<DeviceModel[]> {
    return await this.findMany({
      where: { brandId, isActive: true },
      orderBy: [
        { field: 'year', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  }

  async findModelWithBrandAndCategory(id: string): Promise<DeviceModel | null> {
    return await this.findById(id, {
      brand: {
        include: {
          category: true,
        },
      },
    });
  }

  async searchModels(
    query: string,
    filters?: DeviceSearchFilters,
    pagination?: PaginationOptions
  ): Promise<DeviceModel[] | PaginatedResult<DeviceModel>> {
    const whereConditions: any = { isActive: true };

    if (filters?.categoryId) {
      whereConditions.brand = {
        categoryId: filters.categoryId,
      };
    }

    if (filters?.brandId) {
      whereConditions.brandId = filters.brandId;
    }

    if (filters?.yearFrom || filters?.yearTo) {
      whereConditions.year = {};
      if (filters.yearFrom) whereConditions.year.gte = filters.yearFrom;
      if (filters.yearTo) whereConditions.year.lte = filters.yearTo;
    }

    if (filters?.screenSizeMin || filters?.screenSizeMax) {
      whereConditions.screenSize = {};
      if (filters.screenSizeMin) whereConditions.screenSize.gte = filters.screenSizeMin;
      if (filters.screenSizeMax) whereConditions.screenSize.lte = filters.screenSizeMax;
    }

    const searchOptions = {
      where: whereConditions,
      include: {
        brand: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { field: 'year', direction: 'desc' as const },
        { field: 'name', direction: 'asc' as const },
      ],
      pagination,
    };

    return await this.search(query, ['name'], searchOptions);
  }

  async findModelsByYear(year: number): Promise<DeviceModel[]> {
    return await this.findMany({
      where: { year, isActive: true },
      include: {
        brand: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
  }

  async findModelsByYearRange(yearFrom: number, yearTo: number): Promise<DeviceModel[]> {
    return await this.findMany({
      where: {
        year: {
          gte: yearFrom,
          lte: yearTo,
        },
        isActive: true,
      },
      include: {
        brand: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { field: 'year', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  }

  async findPopularModels(limit: number = 20): Promise<DeviceModel[]> {
    return await this.rawQuery(`
      SELECT dm.*, COUNT(b.id) as booking_count,
             db.name as brand_name, dc.name as category_name
      FROM device_models dm
      LEFT JOIN bookings b ON b.device_model_id = dm.id
      JOIN device_brands db ON db.id = dm.brand_id
      JOIN device_categories dc ON dc.id = db.category_id
      WHERE dm.is_active = true
      GROUP BY dm.id, db.name, dc.name
      ORDER BY booking_count DESC
      LIMIT ?
    `, limit);
  }

  async findRecentModels(limit: number = 10): Promise<DeviceModel[]> {
    const currentYear = new Date().getFullYear();
    const threeYearsAgo = currentYear - 3;

    return await this.findMany({
      where: {
        year: {
          gte: threeYearsAgo,
        },
        isActive: true,
      },
      include: {
        brand: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { field: 'year', direction: 'desc' },
        { field: 'createdAt', direction: 'desc' },
      ],
      take: limit,
    });
  }

  async getModelStats(): Promise<{
    totalModels: number;
    modelsByYear: Record<number, number>;
    modelsByCategory: Record<string, number>;
    averageAge: number;
  }> {
    const currentYear = new Date().getFullYear();
    
    const models = await this.findMany({
      where: { isActive: true },
      include: {
        brand: {
          include: {
            category: true,
          },
        },
      },
    });

    const totalModels = models.length;
    const modelsByYear: Record<number, number> = {};
    const modelsByCategory: Record<string, number> = {};
    let totalAge = 0;

    models.forEach(model => {
      // By year
      modelsByYear[model.year] = (modelsByYear[model.year] || 0) + 1;
      
      // By category
      const categoryName = model.brand.category.name;
      modelsByCategory[categoryName] = (modelsByCategory[categoryName] || 0) + 1;
      
      // Age calculation
      totalAge += currentYear - model.year;
    });

    const averageAge = totalModels > 0 ? totalAge / totalModels : 0;

    return {
      totalModels,
      modelsByYear,
      modelsByCategory,
      averageAge,
    };
  }

  async updateModelSpecs(id: string, specs: any): Promise<DeviceModel> {
    return await this.update(id, { specs });
  }

  async bulkUpdateModelYear(brandId: string, oldYear: number, newYear: number): Promise<{ count: number }> {
    return await this.updateMany(
      { brandId, year: oldYear },
      { year: newYear }
    );
  }
}