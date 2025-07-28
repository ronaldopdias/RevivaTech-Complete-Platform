/**
 * E-commerce Product Catalog System
 * Advanced product management for RevivaTech shop
 * 
 * Features:
 * - Product catalog with advanced filtering
 * - Inventory management integration
 * - Price management and discounts
 * - Product variants and options
 * - Search and categorization
 * - Reviews and ratings
 */

import { z } from 'zod';

// Product Schema
export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'inactive', 'discontinued']).default('draft'),
  
  // Pricing
  price: z.object({
    regular: z.number(),
    sale: z.number().optional(),
    currency: z.string().default('GBP'),
    priceType: z.enum(['fixed', 'variable', 'quote']).default('fixed')
  }),
  
  // Inventory
  inventory: z.object({
    sku: z.string(),
    quantity: z.number(),
    inStock: z.boolean(),
    lowStockThreshold: z.number().default(5),
    trackQuantity: z.boolean().default(true),
    allowBackorder: z.boolean().default(false),
    weight: z.number().optional(),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
      unit: z.string().default('cm')
    }).optional()
  }),
  
  // Media
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    alt: z.string(),
    primary: z.boolean().default(false),
    order: z.number().default(0)
  })).default([]),
  
  // Variants
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    options: z.record(z.string()), // color: "red", size: "large"
    price: z.number().optional(),
    sku: z.string(),
    inventory: z.object({
      quantity: z.number(),
      inStock: z.boolean()
    }),
    image: z.string().optional()
  })).default([]),
  
  // Attributes
  attributes: z.record(z.any()).default({}),
  
  // SEO
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).default([])
  }).optional(),
  
  // Reviews
  reviews: z.object({
    average: z.number().default(0),
    count: z.number().default(0),
    enabled: z.boolean().default(true)
  }).default({
    average: 0,
    count: 0,
    enabled: true
  }),
  
  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string().optional(),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false)
});

export type Product = z.infer<typeof ProductSchema>;

// Category Schema
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parent: z.string().optional(),
  image: z.string().optional(),
  order: z.number().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).optional()
});

export type Category = z.infer<typeof CategorySchema>;

// Filter Schema
export const ProductFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  rating: z.number().optional(),
  sortBy: z.enum(['name', 'price', 'rating', 'popularity', 'newest']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().default(1),
  limit: z.number().default(20)
});

export type ProductFilter = z.infer<typeof ProductFilterSchema>;

// Product Catalog Service
export class ProductCatalog {
  private products: Product[] = [];
  private categories: Category[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data
    this.categories = [
      {
        id: 'apple',
        name: 'Apple Products',
        slug: 'apple',
        description: 'Genuine Apple parts and accessories',
        order: 1,
        status: 'active'
      },
      {
        id: 'screens',
        name: 'Screens & Displays',
        slug: 'screens',
        description: 'Replacement screens for all devices',
        order: 2,
        status: 'active'
      },
      {
        id: 'batteries',
        name: 'Batteries',
        slug: 'batteries',
        description: 'Replacement batteries for smartphones and laptops',
        order: 3,
        status: 'active'
      },
      {
        id: 'accessories',
        name: 'Accessories',
        slug: 'accessories',
        description: 'Cases, chargers, and accessories',
        order: 4,
        status: 'active'
      }
    ];

    this.products = [
      {
        id: 'iphone-14-screen',
        sku: 'IP14-SCR-001',
        name: 'iPhone 14 OLED Screen Assembly',
        slug: 'iphone-14-screen-assembly',
        description: 'High-quality OLED replacement screen for iPhone 14. Includes digitizer and frame.',
        shortDescription: 'OLED replacement screen for iPhone 14',
        category: 'apple',
        subcategory: 'screens',
        brand: 'Apple',
        tags: ['iphone', 'screen', 'oled', 'genuine'],
        status: 'active',
        
        price: {
          regular: 189.99,
          sale: 169.99,
          currency: 'GBP',
          priceType: 'fixed'
        },
        
        inventory: {
          sku: 'IP14-SCR-001',
          quantity: 25,
          inStock: true,
          lowStockThreshold: 5,
          trackQuantity: true,
          allowBackorder: false
        },
        
        images: [
          {
            id: 'img1',
            url: '/images/products/iphone-14-screen-1.jpg',
            alt: 'iPhone 14 Screen Assembly',
            primary: true,
            order: 0
          }
        ],
        
        variants: [
          {
            id: 'black',
            name: 'Black',
            options: { color: 'black' },
            sku: 'IP14-SCR-001-BLK',
            inventory: { quantity: 15, inStock: true }
          },
          {
            id: 'white',
            name: 'White',
            options: { color: 'white' },
            sku: 'IP14-SCR-001-WHT',
            inventory: { quantity: 10, inStock: true }
          }
        ],
        
        attributes: {
          compatibility: ['iPhone 14'],
          warranty: '12 months',
          installation: 'Professional recommended'
        },
        
        reviews: {
          average: 4.8,
          count: 24,
          enabled: true
        },
        
        featured: true,
        popular: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      
      {
        id: 'macbook-battery',
        sku: 'MBP-BAT-001',
        name: 'MacBook Pro 13" Battery (2020-2022)',
        slug: 'macbook-pro-13-battery',
        description: 'Original capacity replacement battery for MacBook Pro 13" models from 2020-2022.',
        shortDescription: 'Replacement battery for MacBook Pro 13"',
        category: 'apple',
        subcategory: 'batteries',
        brand: 'Apple',
        tags: ['macbook', 'battery', 'pro', 'genuine'],
        status: 'active',
        
        price: {
          regular: 129.99,
          currency: 'GBP',
          priceType: 'fixed'
        },
        
        inventory: {
          sku: 'MBP-BAT-001',
          quantity: 12,
          inStock: true,
          lowStockThreshold: 3,
          trackQuantity: true,
          allowBackorder: true
        },
        
        images: [
          {
            id: 'img1',
            url: '/images/products/macbook-battery-1.jpg',
            alt: 'MacBook Pro Battery',
            primary: true,
            order: 0
          }
        ],
        
        attributes: {
          compatibility: ['MacBook Pro 13" 2020', 'MacBook Pro 13" 2021', 'MacBook Pro 13" 2022'],
          capacity: '58.2Wh',
          warranty: '6 months',
          installation: 'Professional required'
        },
        
        reviews: {
          average: 4.6,
          count: 18,
          enabled: true
        },
        
        featured: false,
        popular: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date()
      }
    ];
  }

  // Get all products with filters
  async getProducts(filters: Partial<ProductFilter> = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const validatedFilters = ProductFilterSchema.parse(filters);
    let filteredProducts = [...this.products];

    // Apply filters
    if (validatedFilters.search) {
      const search = validatedFilters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (validatedFilters.category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category === validatedFilters.category
      );
    }

    if (validatedFilters.subcategory) {
      filteredProducts = filteredProducts.filter(product =>
        product.subcategory === validatedFilters.subcategory
      );
    }

    if (validatedFilters.brand) {
      filteredProducts = filteredProducts.filter(product =>
        product.brand === validatedFilters.brand
      );
    }

    if (validatedFilters.priceMin !== undefined) {
      filteredProducts = filteredProducts.filter(product =>
        product.price.regular >= validatedFilters.priceMin!
      );
    }

    if (validatedFilters.priceMax !== undefined) {
      filteredProducts = filteredProducts.filter(product =>
        product.price.regular <= validatedFilters.priceMax!
      );
    }

    if (validatedFilters.inStock) {
      filteredProducts = filteredProducts.filter(product =>
        product.inventory.inStock
      );
    }

    if (validatedFilters.featured) {
      filteredProducts = filteredProducts.filter(product =>
        product.featured
      );
    }

    if (validatedFilters.rating) {
      filteredProducts = filteredProducts.filter(product =>
        product.reviews.average >= validatedFilters.rating!
      );
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let comparison = 0;
      
      switch (validatedFilters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price.regular - b.price.regular;
          break;
        case 'rating':
          comparison = a.reviews.average - b.reviews.average;
          break;
        case 'popularity':
          comparison = (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
          break;
        case 'newest':
          comparison = b.createdAt.getTime() - a.createdAt.getTime();
          break;
      }
      
      return validatedFilters.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / validatedFilters.limit);
    const startIndex = (validatedFilters.page - 1) * validatedFilters.limit;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + validatedFilters.limit);

    return {
      products: paginatedProducts,
      total,
      page: validatedFilters.page,
      totalPages
    };
  }

  // Get single product
  async getProduct(id: string): Promise<Product | null> {
    return this.products.find(product => product.id === id) || null;
  }

  // Get product by slug
  async getProductBySlug(slug: string): Promise<Product | null> {
    return this.products.find(product => product.slug === slug) || null;
  }

  // Get categories
  async getCategories(): Promise<Category[]> {
    return this.categories.filter(category => category.status === 'active');
  }

  // Add product
  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      ...productData,
      id: `product_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validatedProduct = ProductSchema.parse(product);
    this.products.push(validatedProduct);
    return validatedProduct;
  }

  // Update product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) return null;

    const updatedProduct = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date()
    };

    const validatedProduct = ProductSchema.parse(updatedProduct);
    this.products[index] = validatedProduct;
    return validatedProduct;
  }

  // Delete product
  async deleteProduct(id: string): Promise<boolean> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) return false;

    this.products.splice(index, 1);
    return true;
  }

  // Search suggestions
  async getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    this.products.forEach(product => {
      if (product.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(product.name);
      }
      
      product.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Get related products
  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    const product = await this.getProduct(productId);
    if (!product) return [];

    const related = this.products
      .filter(p => 
        p.id !== productId && 
        (p.category === product.category || 
         p.tags.some(tag => product.tags.includes(tag)))
      )
      .slice(0, limit);

    return related;
  }
}

// Global product catalog instance
export const productCatalog = new ProductCatalog();