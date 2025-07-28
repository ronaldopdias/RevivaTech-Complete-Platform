/**
 * Admin Inventory API - Parts and Components Management
 * Provides CRUD operations for inventory management
 */

import { NextRequest, NextResponse } from 'next/server';

// Inventory item interface matching frontend
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  cost: number;
  price: number;
  supplier: string;
  lastOrdered: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  location: string;
  description?: string;
  warranty?: string;
  notes?: string;
}

// Mock inventory data for development
const mockInventory: InventoryItem[] = [
  {
    id: 'INV-001',
    name: 'iPhone 15 Pro Screen Assembly',
    category: 'Screens',
    sku: 'IP15P-SCR-BLK',
    quantity: 25,
    minQuantity: 10,
    cost: 180,
    price: 299,
    supplier: 'Premium Parts Ltd',
    lastOrdered: '2025-07-01',
    status: 'In Stock',
    location: 'A-1-5',
    description: 'Original quality OLED screen assembly with touch digitizer',
    warranty: '90 days',
    notes: 'High-demand item, monitor closely'
  },
  {
    id: 'INV-002',
    name: 'MacBook Pro 16" Logic Board',
    category: 'Logic Boards',
    sku: 'MBP16-LB-2023',
    quantity: 3,
    minQuantity: 5,
    cost: 850,
    price: 1299,
    supplier: 'Apple Authorized',
    lastOrdered: '2025-06-15',
    status: 'Low Stock',
    location: 'B-2-1',
    description: 'Apple genuine logic board for MacBook Pro 16-inch 2023',
    warranty: '1 year',
    notes: 'Expensive item - requires pre-approval for orders'
  },
  {
    id: 'INV-003',
    name: 'Samsung Galaxy S24 Battery',
    category: 'Batteries',
    sku: 'SGS24-BAT-4000',
    quantity: 0,
    minQuantity: 15,
    cost: 45,
    price: 89,
    supplier: 'Mobile Parts Direct',
    lastOrdered: '2025-05-20',
    status: 'Out of Stock',
    location: 'C-1-3',
    description: '4000mAh Li-ion battery for Samsung Galaxy S24',
    warranty: '6 months',
    notes: 'URGENT: Customer waiting for repair - expedite order'
  },
  {
    id: 'INV-004',
    name: 'iPad Air 5 Charging Port',
    category: 'Charging Ports',
    sku: 'IPA5-CP-USBC',
    quantity: 18,
    minQuantity: 8,
    cost: 25,
    price: 59,
    supplier: 'Tech Components Co',
    lastOrdered: '2025-07-05',
    status: 'In Stock',
    location: 'A-3-2',
    description: 'USB-C charging port assembly for iPad Air 5th generation',
    warranty: '90 days',
    notes: 'Good quality replacement part'
  },
  {
    id: 'INV-005',
    name: 'iPhone 12 Camera Module',
    category: 'Cameras',
    sku: 'IP12-CAM-12MP',
    quantity: 12,
    minQuantity: 10,
    cost: 120,
    price: 199,
    supplier: 'Optics Plus',
    lastOrdered: '2025-06-28',
    status: 'In Stock',
    location: 'D-1-4',
    description: '12MP rear camera module for iPhone 12 series',
    warranty: '6 months',
    notes: 'Compatible with iPhone 12, 12 mini'
  },
  {
    id: 'INV-006',
    name: 'MacBook Air M2 SSD 512GB',
    category: 'Storage',
    sku: 'MBA-M2-SSD-512',
    quantity: 8,
    minQuantity: 5,
    cost: 200,
    price: 349,
    supplier: 'Storage Solutions Inc',
    lastOrdered: '2025-07-10',
    status: 'In Stock',
    location: 'B-1-2',
    description: '512GB NVMe SSD for MacBook Air M2',
    warranty: '3 years',
    notes: 'Performance upgrade popular with customers'
  },
  {
    id: 'INV-007',
    name: 'Generic Phone Repair Tools Kit',
    category: 'Tools',
    sku: 'TOOL-KIT-PHONE',
    quantity: 5,
    minQuantity: 3,
    cost: 35,
    price: 0, // Internal use only
    supplier: 'Tool Supply Co',
    lastOrdered: '2025-06-20',
    status: 'In Stock',
    location: 'TOOLS-1',
    description: 'Complete screwdriver and prying tool kit for phone repairs',
    warranty: '1 year',
    notes: 'For technician use - not for sale'
  },
  {
    id: 'INV-008',
    name: 'Samsung S23 Screen Protector',
    category: 'Accessories',
    sku: 'SGS23-SP-GLASS',
    quantity: 50,
    minQuantity: 20,
    cost: 3,
    price: 15,
    supplier: 'Protection Plus',
    lastOrdered: '2025-07-12',
    status: 'In Stock',
    location: 'ACC-1-1',
    description: 'Tempered glass screen protector for Samsung Galaxy S23',
    warranty: '30 days',
    notes: 'High margin item - promote to customers'
  }
];

// Rate limiting for admin inventory API
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const INVENTORY_RATE_LIMIT = 150;
const RATE_LIMIT_WINDOW = 3600000;

function checkInventoryRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `inventory_${identifier}`;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = rateLimitMap.get(key)!;

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }

  if (limit.count >= INVENTORY_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

// GET /api/admin/inventory - Get all inventory items with filtering
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkInventoryRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category')?.toLowerCase();
    const status = searchParams.get('status');
    const supplier = searchParams.get('supplier')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter inventory
    let filteredInventory = [...mockInventory];

    if (search) {
      filteredInventory = filteredInventory.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.supplier.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
      );
    }

    if (category && category !== 'all') {
      filteredInventory = filteredInventory.filter(item => 
        item.category.toLowerCase() === category
      );
    }

    if (status && status !== 'all') {
      filteredInventory = filteredInventory.filter(item => 
        item.status === status
      );
    }

    if (supplier && supplier !== 'all') {
      filteredInventory = filteredInventory.filter(item => 
        item.supplier.toLowerCase() === supplier
      );
    }

    // Apply pagination
    const totalItems = filteredInventory.length;
    const paginatedItems = filteredInventory.slice(offset, offset + limit);

    // Calculate inventory statistics
    const inStock = filteredInventory.filter(item => item.status === 'In Stock').length;
    const lowStock = filteredInventory.filter(item => item.status === 'Low Stock').length;
    const outOfStock = filteredInventory.filter(item => item.status === 'Out of Stock').length;
    const discontinued = filteredInventory.filter(item => item.status === 'Discontinued').length;

    const totalValue = filteredInventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const totalPotentialRevenue = filteredInventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get unique categories and suppliers for filtering
    const categories = [...new Set(mockInventory.map(item => item.category))];
    const suppliers = [...new Set(mockInventory.map(item => item.supplier))];

    return NextResponse.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total: totalItems,
        offset,
        limit,
        hasMore: offset + limit < totalItems
      },
      statistics: {
        totalItems,
        inStock,
        lowStock,
        outOfStock,
        discontinued,
        totalValue: Math.round(totalValue),
        totalPotentialRevenue: Math.round(totalPotentialRevenue),
        averageItemValue: totalItems > 0 ? Math.round(totalValue / totalItems) : 0
      },
      filters: {
        categories,
        suppliers,
        statuses: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued']
      },
      alerts: {
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        reorderRequired: filteredInventory.filter(item => 
          item.quantity <= item.minQuantity && item.status !== 'Discontinued'
        ).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory - Add new inventory item
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkInventoryRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'category', 'sku', 'quantity', 'minQuantity', 'cost', 'price', 'supplier'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if SKU already exists
    const existingSku = mockInventory.find(item => item.sku === body.sku);
    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      );
    }

    // Determine status based on quantity
    let status: InventoryItem['status'] = 'In Stock';
    if (body.quantity === 0) {
      status = 'Out of Stock';
    } else if (body.quantity <= body.minQuantity) {
      status = 'Low Stock';
    }

    // Create new inventory item
    const newItem: InventoryItem = {
      id: `INV-${String(mockInventory.length + 1).padStart(3, '0')}`,
      name: body.name,
      category: body.category,
      sku: body.sku,
      quantity: parseInt(body.quantity),
      minQuantity: parseInt(body.minQuantity),
      cost: parseFloat(body.cost),
      price: parseFloat(body.price),
      supplier: body.supplier,
      lastOrdered: new Date().toISOString().split('T')[0],
      status,
      location: body.location || 'PENDING',
      description: body.description || '',
      warranty: body.warranty || '',
      notes: body.notes || ''
    };

    // In production, this would save to database
    mockInventory.push(newItem);

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Inventory item created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create inventory item error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/inventory/[id] - Update inventory quantities (bulk update endpoint)
export async function PATCH(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkInventoryRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const updates = body.updates || [];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const updatedItems = [];
    const errors = [];

    for (const update of updates) {
      const { id, quantity } = update;
      
      if (!id || quantity === undefined) {
        errors.push({ id, error: 'Missing id or quantity' });
        continue;
      }

      const itemIndex = mockInventory.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        errors.push({ id, error: 'Item not found' });
        continue;
      }

      // Update quantity and status
      mockInventory[itemIndex].quantity = parseInt(quantity);
      
      // Update status based on new quantity
      if (mockInventory[itemIndex].quantity === 0) {
        mockInventory[itemIndex].status = 'Out of Stock';
      } else if (mockInventory[itemIndex].quantity <= mockInventory[itemIndex].minQuantity) {
        mockInventory[itemIndex].status = 'Low Stock';
      } else {
        mockInventory[itemIndex].status = 'In Stock';
      }

      updatedItems.push(mockInventory[itemIndex]);
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: updatedItems,
        errors: errors
      },
      message: `${updatedItems.length} items updated successfully`
    });

  } catch (error) {
    console.error('Bulk update inventory error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update inventory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}