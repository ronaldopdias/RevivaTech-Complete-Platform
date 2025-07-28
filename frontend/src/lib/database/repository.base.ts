// Base Repository Pattern
// Generic repository with common CRUD operations and query building

import { PrismaClient } from '@/generated/prisma';
import { db } from './client';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected readonly db: PrismaClient;
  protected abstract readonly modelName: string;

  constructor() {
    this.db = db;
  }

  // Create operations
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const model = this.getModel();
    return await model.create({ data }) as T;
  }

  async createMany(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ count: number }> {
    const model = this.getModel();
    return await model.createMany({ data });
  }

  // Read operations
  async findById(id: string, include?: any): Promise<T | null> {
    const model = this.getModel();
    return await model.findUnique({
      where: { id },
      include,
    }) as T | null;
  }

  async findMany(options?: {
    where?: FilterOptions;
    include?: any;
    orderBy?: SortOptions[];
    skip?: number;
    take?: number;
  }): Promise<T[]> {
    const model = this.getModel();
    return await model.findMany({
      where: options?.where,
      include: options?.include,
      orderBy: options?.orderBy?.map(sort => ({
        [sort.field]: sort.direction,
      })),
      skip: options?.skip,
      take: options?.take,
    }) as T[];
  }

  async findFirst(where: FilterOptions, include?: any): Promise<T | null> {
    const model = this.getModel();
    return await model.findFirst({
      where,
      include,
    }) as T | null;
  }

  async findPaginated(
    pagination: PaginationOptions,
    options?: {
      where?: FilterOptions;
      include?: any;
      orderBy?: SortOptions[];
    }
  ): Promise<PaginatedResult<T>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const model = this.getModel();
    
    const [data, total] = await Promise.all([
      model.findMany({
        where: options?.where,
        include: options?.include,
        orderBy: options?.orderBy?.map(sort => ({
          [sort.field]: sort.direction,
        })),
        skip,
        take: limit,
      }) as Promise<T[]>,
      model.count({ where: options?.where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Update operations
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const model = this.getModel();
    return await model.update({
      where: { id },
      data,
    }) as T;
  }

  async updateMany(where: FilterOptions, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ count: number }> {
    const model = this.getModel();
    return await model.updateMany({
      where,
      data,
    });
  }

  // Delete operations
  async delete(id: string): Promise<T> {
    const model = this.getModel();
    return await model.delete({
      where: { id },
    }) as T;
  }

  async deleteMany(where: FilterOptions): Promise<{ count: number }> {
    const model = this.getModel();
    return await model.deleteMany({ where });
  }

  // Count operations
  async count(where?: FilterOptions): Promise<number> {
    const model = this.getModel();
    return await model.count({ where });
  }

  // Existence check
  async exists(where: FilterOptions): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  // Batch operations
  async batchUpdate(operations: Array<{
    id: string;
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
  }>): Promise<T[]> {
    return await this.db.$transaction(
      operations.map(op => 
        this.getModel().update({
          where: { id: op.id },
          data: op.data,
        })
      )
    ) as T[];
  }

  // Soft delete support (if entity has isActive field)
  async softDelete(id: string): Promise<T> {
    return await this.update(id, { isActive: false } as any);
  }

  async restore(id: string): Promise<T> {
    return await this.update(id, { isActive: true } as any);
  }

  // Search functionality
  async search(query: string, fields: string[], options?: {
    where?: FilterOptions;
    include?: any;
    orderBy?: SortOptions[];
    pagination?: PaginationOptions;
  }): Promise<T[] | PaginatedResult<T>> {
    const searchConditions = fields.map(field => ({
      [field]: {
        contains: query,
        mode: 'insensitive' as const,
      },
    }));

    const where = {
      AND: [
        { OR: searchConditions },
        ...(options?.where ? [options.where] : []),
      ],
    };

    if (options?.pagination) {
      return await this.findPaginated(options.pagination, {
        where,
        include: options.include,
        orderBy: options.orderBy,
      });
    }

    return await this.findMany({
      where,
      include: options?.include,
      orderBy: options?.orderBy,
    });
  }

  // Protected method to get the Prisma model
  protected getModel(): any {
    return (this.db as any)[this.modelName];
  }

  // Raw query support for complex operations
  protected async rawQuery<T = any>(query: string, ...params: any[]): Promise<T[]> {
    return await this.db.$queryRawUnsafe(query, ...params);
  }

  // Transaction support
  protected async transaction<R>(
    callback: (tx: PrismaClient) => Promise<R>
  ): Promise<R> {
    return await this.db.$transaction(callback);
  }
}