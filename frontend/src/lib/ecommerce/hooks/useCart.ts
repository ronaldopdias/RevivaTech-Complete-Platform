'use client';

/**
 * Shopping Cart Hooks
 * React hooks for cart management and e-commerce functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { shoppingCart, Cart, CartItem, ShippingOption } from '../shoppingCart';
import { Product } from '../productCatalog';

// Cart hook
export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize cart
    const currentCart = shoppingCart.getCart();
    setCart(currentCart);
    setLoading(false);

    // Subscribe to cart changes
    const unsubscribe = shoppingCart.subscribe((updatedCart) => {
      setCart(updatedCart);
    });

    return unsubscribe;
  }, []);

  const addItem = useCallback(async (
    product: Product,
    quantity: number = 1,
    variantId?: string,
    selectedOptions?: Record<string, string>
  ) => {
    try {
      await shoppingCart.addItem(product, quantity, variantId, selectedOptions);
      return true;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      return false;
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    return await shoppingCart.updateItemQuantity(itemId, quantity);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    return await shoppingCart.removeItem(itemId);
  }, []);

  const clearCart = useCallback(() => {
    shoppingCart.clearCart();
  }, []);

  const applyDiscount = useCallback(async (code: string) => {
    return await shoppingCart.applyDiscountCode(code);
  }, []);

  const removeDiscount = useCallback((code: string) => {
    return shoppingCart.removeDiscount(code);
  }, []);

  const setShipping = useCallback((shippingOptionId: string) => {
    return shoppingCart.setShippingOption(shippingOptionId);
  }, []);

  const getShippingOptions = useCallback((): ShippingOption[] => {
    return shoppingCart.getShippingOptions();
  }, []);

  const validateCart = useCallback(() => {
    return shoppingCart.validateCart();
  }, []);

  const summary = cart ? shoppingCart.getCartSummary() : {
    itemCount: 0,
    totalQuantity: 0,
    subtotal: 0,
    total: 0,
    hasItems: false
  };

  return {
    cart,
    loading,
    summary,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    removeDiscount,
    setShipping,
    getShippingOptions,
    validateCart
  };
}

// Product catalog hook
export function useProducts(filters?: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?' + new URLSearchParams(filters));
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
        setPagination({
          page: data.page,
          totalPages: data.totalPages,
          total: data.total
        });
        setError(null);
      } else {
        setError(data.error || 'Failed to load products');
      }
    } catch (err) {
      setError('Failed to load products');
      console.error('Products loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    reload: loadProducts
  };
}

// Single product hook
export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        
        if (response.ok) {
          setProduct(data);
          setError(null);
        } else {
          setError(data.error || 'Product not found');
        }
      } catch (err) {
        setError('Failed to load product');
        console.error('Product loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  return { product, loading, error };
}

// Wishlist hook (for future implementation)
export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  useEffect(() => {
    // Load wishlist from localStorage
    const stored = localStorage.getItem('revivatech_wishlist');
    if (stored) {
      try {
        setWishlistItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      }
    }
  }, []);

  const addToWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => {
      const updated = prev.includes(productId) ? prev : [...prev, productId];
      localStorage.setItem('revivatech_wishlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => {
      const updated = prev.filter(id => id !== productId);
      localStorage.setItem('revivatech_wishlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  };
}