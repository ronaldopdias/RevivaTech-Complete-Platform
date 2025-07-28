'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { ShoppingBag, Laptop, Smartphone, HardDrive, Monitor, Battery, Shield, ShoppingCart, Star } from 'lucide-react';
import { productCatalog, Product, Category } from '@/lib/ecommerce/productCatalog';
import { shoppingCart } from '@/lib/ecommerce/shoppingCart';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cartCount, setCartCount] = useState(0);

  // Load products and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsResult, categoriesResult] = await Promise.all([
          productCatalog.getProducts({ featured: true, limit: 6 }),
          productCatalog.getCategories()
        ]);
        
        setProducts(productsResult.products);
        setCategories(categoriesResult);
        
        // Update cart count
        const cart = shoppingCart.getCart();
        setCartCount(cart.items.length);
      } catch (error) {
        console.error('Failed to load shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Subscribe to cart changes
  useEffect(() => {
    const unsubscribe = shoppingCart.subscribe((cart) => {
      setCartCount(cart.items.length);
    });
    
    return unsubscribe;
  }, []);

  // Add to cart handler
  const handleAddToCart = async (product: Product) => {
    try {
      await shoppingCart.addItem(product.id, 1);
      // Optional: Show success message
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Optional: Show error message
    }
  };

  // Get category icon
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'apple': return Laptop;
      case 'screens': return Monitor;
      case 'batteries': return Battery;
      case 'accessories': return Shield;
      default: return Smartphone;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-purple-50 to-pink-100">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="relative inline-block mb-6">
                <ShoppingBag className="w-16 h-16 mx-auto text-purple-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Tech Shop
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Quality accessories and replacement parts for all your devices
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#products" className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                  Browse Products
                </a>
                <a href="/contact" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Bulk Orders
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Shop Categories</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center p-4 rounded-lg border animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.id);
                  return (
                    <div 
                      key={category.id} 
                      className="text-center p-4 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-10 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => {
                  const currentPrice = product.price.sale || product.price.regular;
                  const hasDiscount = product.price.sale && product.price.sale < product.price.regular;
                  
                  return (
                    <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                        {product.images.length > 0 ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.images[0].alt}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Monitor className="w-16 h-16 text-gray-400" />
                        )}
                        {product.featured && (
                          <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                            Featured
                          </span>
                        )}
                        {!product.inventory.inStock && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="text-sm text-purple-600 font-semibold mb-2 capitalize">
                          {product.category}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {product.shortDescription || product.description}
                        </p>
                        
                        {/* Reviews */}
                        <div className="flex items-center mb-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.reviews.average)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            ({product.reviews.count} reviews)
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-purple-600">
                              £{currentPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="text-lg text-gray-500 line-through">
                                £{product.price.regular.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.inventory.inStock}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              product.inventory.inStock
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4 inline mr-2" />
                            {product.inventory.inStock ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-bold mb-2">Quality Guarantee</h3>
                <p className="text-gray-600">All products come with manufacturer warranty and our quality guarantee</p>
              </div>
              <div className="text-center">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Free delivery on orders over £50, next-day delivery available</p>
              </div>
              <div className="text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">Expert Support</h3>
                <p className="text-gray-600">Need help choosing? Our tech experts are here to assist you</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-purple-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Can't Find What You Need?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Contact us for custom orders, bulk purchases, or special requirements
            </p>
            <a href="/contact" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}