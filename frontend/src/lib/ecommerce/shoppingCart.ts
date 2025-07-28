/**
 * Shopping Cart System
 * Advanced cart management with persistence and checkout
 * 
 * Features:
 * - Cart state management
 * - Product variants and quantities
 * - Pricing calculations with discounts
 * - Persistent cart storage
 * - Cart validation and error handling
 * - Checkout preparation
 */

import { z } from 'zod';
import { Product } from './productCatalog';

// Cart Item Schema
export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().min(1),
  price: z.number(),
  total: z.number(),
  selectedOptions: z.record(z.string()).optional(),
  addedAt: z.date().default(() => new Date())
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Cart Schema
export const CartSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  items: z.array(CartItemSchema).default([]),
  totals: z.object({
    subtotal: z.number().default(0),
    tax: z.number().default(0),
    shipping: z.number().default(0),
    discount: z.number().default(0),
    total: z.number().default(0)
  }),
  discounts: z.array(z.object({
    code: z.string(),
    amount: z.number(),
    type: z.enum(['percentage', 'fixed']),
    applied: z.boolean().default(true)
  })).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional()
});

export type Cart = z.infer<typeof CartSchema>;

// Shipping Option Schema
export const ShippingOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  estimatedDays: z.object({
    min: z.number(),
    max: z.number()
  }),
  available: z.boolean().default(true)
});

export type ShippingOption = z.infer<typeof ShippingOptionSchema>;

// Discount Code Schema
export const DiscountCodeSchema = z.object({
  code: z.string(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number(),
  minOrderValue: z.number().optional(),
  maxDiscount: z.number().optional(),
  validFrom: z.date(),
  validTo: z.date(),
  usageLimit: z.number().optional(),
  usedCount: z.number().default(0),
  active: z.boolean().default(true)
});

export type DiscountCode = z.infer<typeof DiscountCodeSchema>;

// Shopping Cart Service
export class ShoppingCartService {
  private cart: Cart | null = null;
  private taxRate = 0.20; // 20% VAT
  private listeners: Array<(cart: Cart) => void> = [];

  constructor() {
    this.loadCart();
  }

  // Subscribe to cart changes
  subscribe(listener: (cart: Cart) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of cart changes
  private notifyListeners(): void {
    if (this.cart) {
      this.listeners.forEach(listener => listener(this.cart!));
    }
  }

  // Load cart from storage
  private loadCart(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('revivatech_cart');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          parsed.createdAt = new Date(parsed.createdAt);
          parsed.updatedAt = new Date(parsed.updatedAt);
          if (parsed.expiresAt) {
            parsed.expiresAt = new Date(parsed.expiresAt);
          }
          parsed.items.forEach((item: any) => {
            item.addedAt = new Date(item.addedAt);
          });
          
          this.cart = CartSchema.parse(parsed);
          
          // Check if cart has expired
          if (this.cart.expiresAt && this.cart.expiresAt < new Date()) {
            this.clearCart();
          }
        } catch (error) {
          console.error('Failed to load cart:', error);
          this.createNewCart();
        }
      } else {
        this.createNewCart();
      }
    } else {
      this.createNewCart();
    }
  }

  // Save cart to storage
  private saveCart(): void {
    if (this.cart && typeof window !== 'undefined') {
      localStorage.setItem('revivatech_cart', JSON.stringify(this.cart));
    }
  }

  // Create new cart
  private createNewCart(): void {
    this.cart = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.getSessionId(),
      items: [],
      totals: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      },
      discounts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    this.saveCart();
  }

  // Get session ID
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('revivatech_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('revivatech_session_id', sessionId);
      }
      return sessionId;
    }
    return `sess_${Date.now()}_server`;
  }

  // Get current cart
  getCart(): Cart {
    if (!this.cart) {
      this.createNewCart();
    }
    return this.cart!;
  }

  // Add item to cart
  async addItem(
    product: Product, 
    quantity: number = 1, 
    variantId?: string, 
    selectedOptions?: Record<string, string>
  ): Promise<CartItem> {
    if (!this.cart) {
      this.createNewCart();
    }

    // Get product price (considering variant)
    let price = product.price.sale || product.price.regular;
    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant && variant.price) {
        price = variant.price;
      }
    }

    // Check if item already exists in cart
    const existingItemIndex = this.cart!.items.findIndex(item => 
      item.productId === product.id && 
      item.variantId === variantId &&
      JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );

    let cartItem: CartItem;

    if (existingItemIndex > -1) {
      // Update existing item
      const existingItem = this.cart!.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      cartItem = {
        ...existingItem,
        quantity: newQuantity,
        total: price * newQuantity
      };
      
      this.cart!.items[existingItemIndex] = cartItem;
    } else {
      // Add new item
      cartItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        variantId,
        quantity,
        price,
        total: price * quantity,
        selectedOptions,
        addedAt: new Date()
      };
      
      this.cart!.items.push(cartItem);
    }

    this.updateTotals();
    this.saveCart();
    this.notifyListeners();

    return cartItem;
  }

  // Update item quantity
  async updateItemQuantity(itemId: string, quantity: number): Promise<boolean> {
    if (!this.cart) return false;

    const itemIndex = this.cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const item = this.cart.items[itemIndex];
    item.quantity = quantity;
    item.total = item.price * quantity;

    this.updateTotals();
    this.saveCart();
    this.notifyListeners();

    return true;
  }

  // Remove item from cart
  async removeItem(itemId: string): Promise<boolean> {
    if (!this.cart) return false;

    const itemIndex = this.cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    this.cart.items.splice(itemIndex, 1);
    this.updateTotals();
    this.saveCart();
    this.notifyListeners();

    return true;
  }

  // Clear cart
  clearCart(): void {
    this.createNewCart();
    this.notifyListeners();
  }

  // Apply discount code
  async applyDiscountCode(code: string): Promise<{ success: boolean; message: string; discount?: any }> {
    if (!this.cart) return { success: false, message: 'Cart not found' };

    // Mock discount codes (in production, this would validate against database)
    const discountCodes: DiscountCode[] = [
      {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        active: true,
        usedCount: 0
      },
      {
        code: 'WELCOME20',
        type: 'fixed',
        value: 20,
        minOrderValue: 100,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        active: true,
        usedCount: 0
      }
    ];

    const discountCode = discountCodes.find(dc => dc.code === code.toUpperCase());
    if (!discountCode) {
      return { success: false, message: 'Invalid discount code' };
    }

    if (!discountCode.active) {
      return { success: false, message: 'Discount code is no longer active' };
    }

    const now = new Date();
    if (now < discountCode.validFrom || now > discountCode.validTo) {
      return { success: false, message: 'Discount code has expired' };
    }

    if (discountCode.minOrderValue && this.cart.totals.subtotal < discountCode.minOrderValue) {
      return { 
        success: false, 
        message: `Minimum order value of £${discountCode.minOrderValue} required` 
      };
    }

    // Check if already applied
    if (this.cart.discounts.some(d => d.code === code.toUpperCase())) {
      return { success: false, message: 'Discount code already applied' };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.type === 'percentage') {
      discountAmount = (this.cart.totals.subtotal * discountCode.value) / 100;
      if (discountCode.maxDiscount) {
        discountAmount = Math.min(discountAmount, discountCode.maxDiscount);
      }
    } else {
      discountAmount = discountCode.value;
    }

    // Apply discount
    this.cart.discounts.push({
      code: code.toUpperCase(),
      amount: discountAmount,
      type: discountCode.type,
      applied: true
    });

    this.updateTotals();
    this.saveCart();
    this.notifyListeners();

    return { 
      success: true, 
      message: `Discount of £${discountAmount.toFixed(2)} applied`,
      discount: { code: code.toUpperCase(), amount: discountAmount }
    };
  }

  // Remove discount
  removeDiscount(code: string): boolean {
    if (!this.cart) return false;

    const index = this.cart.discounts.findIndex(d => d.code === code);
    if (index === -1) return false;

    this.cart.discounts.splice(index, 1);
    this.updateTotals();
    this.saveCart();
    this.notifyListeners();

    return true;
  }

  // Get available shipping options
  getShippingOptions(): ShippingOption[] {
    return [
      {
        id: 'standard',
        name: 'Standard Delivery',
        description: 'Delivery within 3-5 business days',
        price: 4.99,
        estimatedDays: { min: 3, max: 5 },
        available: true
      },
      {
        id: 'express',
        name: 'Express Delivery',
        description: 'Next working day delivery',
        price: 9.99,
        estimatedDays: { min: 1, max: 1 },
        available: true
      },
      {
        id: 'collection',
        name: 'Store Collection',
        description: 'Collect from our Bournemouth store',
        price: 0,
        estimatedDays: { min: 0, max: 0 },
        available: true
      }
    ];
  }

  // Set shipping option
  setShippingOption(shippingOptionId: string): boolean {
    if (!this.cart) return false;

    const shippingOptions = this.getShippingOptions();
    const option = shippingOptions.find(opt => opt.id === shippingOptionId);
    
    if (!option || !option.available) return false;

    this.cart.totals.shipping = option.price;
    this.updateTotals();
    this.saveCart();
    this.notifyListeners();

    return true;
  }

  // Update cart totals
  private updateTotals(): void {
    if (!this.cart) return;

    // Calculate subtotal
    this.cart.totals.subtotal = this.cart.items.reduce((sum, item) => sum + item.total, 0);

    // Calculate total discount
    this.cart.totals.discount = this.cart.discounts.reduce((sum, discount) => sum + discount.amount, 0);

    // Calculate tax (applied after discount)
    const taxableAmount = Math.max(0, this.cart.totals.subtotal - this.cart.totals.discount);
    this.cart.totals.tax = taxableAmount * this.taxRate;

    // Calculate final total
    this.cart.totals.total = this.cart.totals.subtotal + this.cart.totals.tax + this.cart.totals.shipping - this.cart.totals.discount;

    // Ensure total is not negative
    this.cart.totals.total = Math.max(0, this.cart.totals.total);

    this.cart.updatedAt = new Date();
  }

  // Get cart summary
  getCartSummary(): {
    itemCount: number;
    totalQuantity: number;
    subtotal: number;
    total: number;
    hasItems: boolean;
  } {
    const cart = this.getCart();
    
    return {
      itemCount: cart.items.length,
      totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.totals.subtotal,
      total: cart.totals.total,
      hasItems: cart.items.length > 0
    };
  }

  // Validate cart for checkout
  validateCart(): { valid: boolean; errors: string[] } {
    const cart = this.getCart();
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
    }

    // Check item availability (mock check)
    cart.items.forEach(item => {
      if (item.quantity > 10) { // Mock stock limit
        errors.push(`Insufficient stock for item ${item.productId}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Global shopping cart instance
export const shoppingCart = new ShoppingCartService();