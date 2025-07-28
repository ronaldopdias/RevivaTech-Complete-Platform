// Device search API endpoint for RevivaTech booking system
// Provides intelligent device search with fallback to local configuration

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Import configuration data
import { appleDevices } from '../../../../../config/devices/apple.devices';
import { androidDevices } from '../../../../../config/devices/android.devices';
import { pcDevices } from '../../../../../config/devices/pc.devices';
import { gamingDevices } from '../../../../../config/devices/gaming.devices';

// Device search parameters schema
const DeviceSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  brand: z.string().optional(),
  category: z.string().optional(),
  year: z.number().optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['popularity', 'alphabetical', 'newest', 'price']).default('popularity'),
  filters: z.object({
    available: z.boolean().optional(),
    supported: z.boolean().optional(),
    inStock: z.boolean().optional(),
  }).optional()
});

export interface DeviceSearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  year: number;
  image?: string;
  specifications?: Record<string, any>;
  popularity: number;
  supportedRepairs: string[];
  basePrice?: number;
  availability: {
    inStock: boolean;
    leadTime: string;
    supportLevel: 'full' | 'limited' | 'legacy';
  };
}

// Combine all device configurations
function getAllDevices(): DeviceSearchResult[] {
  const allDevices: DeviceSearchResult[] = [];
  
  // Apple devices
  Object.entries(appleDevices).forEach(([category, devices]) => {
    Object.entries(devices).forEach(([year, yearDevices]) => {
      Object.entries(yearDevices).forEach(([modelKey, device]) => {
        allDevices.push({
          id: `apple_${category}_${year}_${modelKey}`,
          name: device.name,
          brand: 'Apple',
          category: category,
          year: parseInt(year),
          image: device.image,
          specifications: device.specifications,
          popularity: calculatePopularity('apple', category, parseInt(year)),
          supportedRepairs: getSupportedRepairs('apple', category),
          basePrice: device.repairPricing?.screen || 89,
          availability: {
            inStock: parseInt(year) >= 2020,
            leadTime: parseInt(year) >= 2020 ? 'Same day' : '1-3 days',
            supportLevel: parseInt(year) >= 2018 ? 'full' : parseInt(year) >= 2016 ? 'limited' : 'legacy'
          }
        });
      });
    });
  });
  
  // Android devices
  Object.entries(androidDevices).forEach(([brand, brandDevices]) => {
    Object.entries(brandDevices).forEach(([category, devices]) => {
      Object.entries(devices).forEach(([year, yearDevices]) => {
        Object.entries(yearDevices).forEach(([modelKey, device]) => {
          allDevices.push({
            id: `android_${brand}_${category}_${year}_${modelKey}`,
            name: device.name,
            brand: brand.charAt(0).toUpperCase() + brand.slice(1),
            category: category,
            year: parseInt(year),
            image: device.image,
            specifications: device.specifications,
            popularity: calculatePopularity(brand, category, parseInt(year)),
            supportedRepairs: getSupportedRepairs(brand, category),
            basePrice: device.repairPricing?.screen || 75,
            availability: {
              inStock: parseInt(year) >= 2021,
              leadTime: parseInt(year) >= 2021 ? '1-2 days' : '3-7 days',
              supportLevel: parseInt(year) >= 2019 ? 'full' : parseInt(year) >= 2017 ? 'limited' : 'legacy'
            }
          });
        });
      });
    });
  });
  
  // PC devices
  Object.entries(pcDevices).forEach(([brand, brandDevices]) => {
    Object.entries(brandDevices).forEach(([category, devices]) => {
      Object.entries(devices).forEach(([year, yearDevices]) => {
        Object.entries(yearDevices).forEach(([modelKey, device]) => {
          allDevices.push({
            id: `pc_${brand}_${category}_${year}_${modelKey}`,
            name: device.name,
            brand: brand.charAt(0).toUpperCase() + brand.slice(1),
            category: category,
            year: parseInt(year),
            image: device.image,
            specifications: device.specifications,
            popularity: calculatePopularity(brand, category, parseInt(year)),
            supportedRepairs: getSupportedRepairs(brand, category),
            basePrice: device.repairPricing?.screen || 120,
            availability: {
              inStock: parseInt(year) >= 2020,
              leadTime: parseInt(year) >= 2020 ? '2-3 days' : '5-10 days',
              supportLevel: parseInt(year) >= 2018 ? 'full' : parseInt(year) >= 2016 ? 'limited' : 'legacy'
            }
          });
        });
      });
    });
  });
  
  // Gaming devices
  Object.entries(gamingDevices).forEach(([brand, brandDevices]) => {
    Object.entries(brandDevices).forEach(([category, devices]) => {
      Object.entries(devices).forEach(([year, yearDevices]) => {
        Object.entries(yearDevices).forEach(([modelKey, device]) => {
          allDevices.push({
            id: `gaming_${brand}_${category}_${year}_${modelKey}`,
            name: device.name,
            brand: brand.charAt(0).toUpperCase() + brand.slice(1),
            category: category,
            year: parseInt(year),
            image: device.image,
            specifications: device.specifications,
            popularity: calculatePopularity(brand, category, parseInt(year)),
            supportedRepairs: getSupportedRepairs(brand, category),
            basePrice: device.repairPricing?.general || 95,
            availability: {
              inStock: parseInt(year) >= 2019,
              leadTime: parseInt(year) >= 2019 ? '3-5 days' : '1-2 weeks',
              supportLevel: parseInt(year) >= 2017 ? 'full' : 'limited'
            }
          });
        });
      });
    });
  });
  
  return allDevices;
}

// Calculate device popularity score (0-100)
function calculatePopularity(brand: string, category: string, year: number): number {
  let score = 50; // Base score
  
  // Brand popularity
  const brandScores: Record<string, number> = {
    'apple': 20,
    'samsung': 15,
    'google': 10,
    'huawei': 8,
    'sony': 10,
    'microsoft': 12,
    'nintendo': 15
  };
  score += brandScores[brand.toLowerCase()] || 5;
  
  // Category popularity
  const categoryScores: Record<string, number> = {
    'smartphone': 20,
    'tablet': 10,
    'laptop': 15,
    'desktop': 8,
    'console': 12
  };
  score += categoryScores[category.toLowerCase()] || 5;
  
  // Year recency (newer devices are more popular)
  const currentYear = new Date().getFullYear();
  const ageBonus = Math.max(0, 15 - (currentYear - year) * 3);
  score += ageBonus;
  
  return Math.min(100, Math.max(0, score));
}

// Get supported repair types for device
function getSupportedRepairs(brand: string, category: string): string[] {
  const baseRepairs = ['screen-replacement-basic', 'battery-replacement-phone'];
  
  if (brand.toLowerCase() === 'apple') {
    baseRepairs.push('motherboard-repair');
  }
  
  if (category === 'smartphone' || category === 'tablet') {
    baseRepairs.push('water-damage-assessment');
  }
  
  if (category === 'laptop' || category === 'desktop') {
    baseRepairs.push('hardware-repair', 'software-repair');
  }
  
  return baseRepairs;
}

// Search function with fuzzy matching
function searchDevices(
  devices: DeviceSearchResult[], 
  query: string, 
  filters: any = {}
): DeviceSearchResult[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  
  return devices.filter(device => {
    // Text matching
    const searchableText = [
      device.name,
      device.brand,
      device.category,
      device.year.toString(),
      ...(device.specifications ? Object.values(device.specifications).map(String) : [])
    ].join(' ').toLowerCase();
    
    // Check if all query words are found
    const textMatch = queryWords.every(word => 
      searchableText.includes(word) || 
      // Fuzzy matching for common misspellings
      searchableText.includes(word.replace(/ph/g, 'f').replace(/f/g, 'ph'))
    );
    
    if (!textMatch) return false;
    
    // Apply filters
    if (filters.brand && device.brand.toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }
    
    if (filters.category && device.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    
    if (filters.year && device.year !== filters.year) {
      return false;
    }
    
    if (filters.available !== undefined && !filters.available && device.availability.inStock) {
      return false;
    }
    
    if (filters.supported !== undefined && filters.supported && device.availability.supportLevel === 'legacy') {
      return false;
    }
    
    return true;
  });
}

// Sort devices based on criteria
function sortDevices(devices: DeviceSearchResult[], sortBy: string): DeviceSearchResult[] {
  const sorted = [...devices];
  
  switch (sortBy) {
    case 'popularity':
      return sorted.sort((a, b) => b.popularity - a.popularity);
    
    case 'alphabetical':
      return sorted.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
    
    case 'newest':
      return sorted.sort((a, b) => b.year - a.year);
    
    case 'price':
      return sorted.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    
    default:
      return sorted;
  }
}

// Rate limiting (simple in-memory store)
const searchLimits = new Map<string, { count: number; resetTime: number }>();

function checkSearchRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = searchLimits.get(ip);
  
  if (!limit || now > limit.resetTime) {
    searchLimits.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 30) { // 30 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// GET /api/devices/search
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkSearchRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get('q') || '',
      brand: searchParams.get('brand') || undefined,
      category: searchParams.get('category') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || 'popularity',
      filters: {
        available: searchParams.get('available') === 'true',
        supported: searchParams.get('supported') === 'true',
        inStock: searchParams.get('inStock') === 'true',
      }
    };
    
    const validation = DeviceSearchSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid search parameters',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }
    
    const { q, brand, category, year, limit, offset, sortBy, filters } = validation.data;
    
    // Get all devices from configuration
    const allDevices = getAllDevices();
    
    // Search devices
    let results = searchDevices(allDevices, q, { brand, category, year, ...filters });
    
    // Sort results
    results = sortDevices(results, sortBy);
    
    // Apply pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);
    
    // Add search metadata
    const responseData = {
      devices: paginatedResults,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrevious: offset > 0
      },
      search: {
        query: q,
        filters: { brand, category, year, ...filters },
        sortBy,
        resultCount: total,
        searchTime: new Date().toISOString()
      },
      suggestions: total === 0 ? generateSearchSuggestions(q, allDevices) : []
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Device search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Generate search suggestions when no results found
function generateSearchSuggestions(query: string, allDevices: DeviceSearchResult[]): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Get unique brands and popular models
  const brands = [...new Set(allDevices.map(d => d.brand))];
  const popularModels = allDevices
    .filter(d => d.popularity > 70)
    .map(d => d.name)
    .slice(0, 5);
  
  // Suggest similar brands
  brands.forEach(brand => {
    if (brand.toLowerCase().includes(queryLower) || queryLower.includes(brand.toLowerCase())) {
      suggestions.push(`Try searching for "${brand}"`);
    }
  });
  
  // Suggest popular models
  popularModels.forEach(model => {
    if (model.toLowerCase().includes(queryLower)) {
      suggestions.push(`Did you mean "${model}"?`);
    }
  });
  
  // Generic suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      'Try searching with just the brand name (e.g., "Apple", "Samsung")',
      'Include the model year (e.g., "iPhone 2023")',
      'Use broader terms (e.g., "smartphone", "laptop")'
    );
  }
  
  return suggestions.slice(0, 3);
}

// POST /api/devices/search (for complex search with body)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const searchRequest = z.object({
      query: z.string().min(1),
      filters: z.object({
        brands: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        yearRange: z.object({
          min: z.number(),
          max: z.number()
        }).optional(),
        specifications: z.record(z.any()).optional(),
        priceRange: z.object({
          min: z.number(),
          max: z.number()
        }).optional()
      }).optional(),
      sorting: z.object({
        field: z.enum(['popularity', 'alphabetical', 'newest', 'price']),
        direction: z.enum(['asc', 'desc'])
      }).optional(),
      pagination: z.object({
        page: z.number().min(1),
        limit: z.number().min(1).max(100)
      }).optional()
    }).parse(body);
    
    // Perform advanced search
    const allDevices = getAllDevices();
    let results = searchDevices(allDevices, searchRequest.query, searchRequest.filters);
    
    // Apply advanced filtering
    if (searchRequest.filters?.yearRange) {
      const { min, max } = searchRequest.filters.yearRange;
      results = results.filter(d => d.year >= min && d.year <= max);
    }
    
    if (searchRequest.filters?.priceRange) {
      const { min, max } = searchRequest.filters.priceRange;
      results = results.filter(d => (d.basePrice || 0) >= min && (d.basePrice || 0) <= max);
    }
    
    // Apply sorting
    if (searchRequest.sorting) {
      results = sortDevices(results, searchRequest.sorting.field);
      if (searchRequest.sorting.direction === 'desc') {
        results.reverse();
      }
    }
    
    // Apply pagination
    const pagination = searchRequest.pagination || { page: 1, limit: 20 };
    const offset = (pagination.page - 1) * pagination.limit;
    const paginatedResults = results.slice(offset, offset + pagination.limit);
    
    return NextResponse.json({
      devices: paginatedResults,
      pagination: {
        total: results.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(results.length / pagination.limit)
      },
      search: searchRequest
    });
    
  } catch (error) {
    console.error('Advanced device search error:', error);
    
    return NextResponse.json(
      { error: 'Advanced search failed', message: error.message },
      { status: 400 }
    );
  }
}