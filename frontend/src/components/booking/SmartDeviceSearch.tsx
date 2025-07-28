'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, TrendingUp, X, Zap } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import appleDevices from '@/config/devices/apple.devices';

interface DeviceModel {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: any;
  averageRepairCost: number;
  commonIssues: string[];
  screenSize?: number;
}

interface SearchResult {
  device: DeviceModel;
  matchType: 'name' | 'brand' | 'category' | 'year';
  score: number;
}

interface SmartDeviceSearchProps {
  onDeviceSelect: (device: DeviceModel) => void;
  placeholder?: string;
  className?: string;
}

// Popular search terms and quick suggestions
const POPULAR_SEARCHES = [
  { term: 'iPhone 15', category: 'smartphone', brand: 'Apple' },
  { term: 'MacBook Pro', category: 'laptop', brand: 'Apple' },
  { term: 'iPad Pro', category: 'tablet', brand: 'Apple' },
  { term: 'iPhone 14', category: 'smartphone', brand: 'Apple' },
  { term: 'MacBook Air', category: 'laptop', brand: 'Apple' },
  { term: 'Samsung Galaxy', category: 'smartphone', brand: 'Samsung' },
];

const QUICK_CATEGORIES = [
  { name: 'Smartphones', icon: '📱', query: 'iPhone' },
  { name: 'Laptops', icon: '💻', query: 'MacBook' },
  { name: 'Tablets', icon: '📱', query: 'iPad' },
  { name: 'Desktops', icon: '🖥️', query: 'iMac' },
];

export default function SmartDeviceSearch({ 
  onDeviceSelect, 
  placeholder = "Search for your device...",
  className = "" 
}: SmartDeviceSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('revivatech-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search with intelligent scoring
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay for realistic UX
    setTimeout(() => {
      const searchResults: SearchResult[] = [];
      const normalizedQuery = searchQuery.toLowerCase().trim();

      // Search through all available devices
      appleDevices.devices.forEach(device => {
        let score = 0;
        let matchType: 'name' | 'brand' | 'category' | 'year' = 'name';

        // Device name match (highest priority)
        if (device.name.toLowerCase().includes(normalizedQuery)) {
          score += 100;
          matchType = 'name';
        }

        // Brand match
        if (device.brand.toLowerCase().includes(normalizedQuery)) {
          score += 80;
          matchType = 'brand';
        }

        // Category match
        if (device.categoryId.toLowerCase().includes(normalizedQuery)) {
          score += 60;
          matchType = 'category';
        }

        // Year match
        if (device.year.toString().includes(normalizedQuery)) {
          score += 40;
          matchType = 'year';
        }

        // Exact match bonus
        if (device.name.toLowerCase() === normalizedQuery) {
          score += 200;
        }

        // Partial word match bonus
        const queryWords = normalizedQuery.split(' ');
        const deviceWords = device.name.toLowerCase().split(' ');
        
        queryWords.forEach(queryWord => {
          deviceWords.forEach(deviceWord => {
            if (deviceWord.startsWith(queryWord)) {
              score += 30;
            }
          });
        });

        // Popularity bonus (newer devices ranked higher)
        if (device.year >= 2023) score += 20;
        if (device.year >= 2024) score += 10;

        // Add to results if score is significant
        if (score > 20) {
          searchResults.push({ device, matchType, score });
        }
      });

      // Sort by score and limit results
      const sortedResults = searchResults
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      setResults(sortedResults);
      setIsLoading(false);
    }, 150);
  };

  // Handle input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleDeviceSelect = (device: DeviceModel) => {
    setQuery(device.name);
    setIsOpen(false);
    
    // Add to recent searches
    const newRecentSearches = [device.name, ...recentSearches.filter(s => s !== device.name)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('revivatech-recent-searches', JSON.stringify(newRecentSearches));
    
    onDeviceSelect(device);
  };

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'name': return 'Name match';
      case 'brand': return 'Brand match';
      case 'category': return 'Category match';
      case 'year': return 'Year match';
      default: return '';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-900 font-medium">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="pl-12 pr-12 h-14 text-lg border-2 focus:border-blue-500 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-4 w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-12 top-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-16 left-0 right-0 z-50 shadow-2xl border-2 border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Quick Categories (when no query) */}
            {!query && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-blue-500" />
                  Quick Search
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => handleQuickSearch(category.query)}
                      className="flex items-center space-x-2 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  Recent Searches
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(search)}
                      className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {!query && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  Popular Searches
                </div>
                <div className="space-y-1">
                  {POPULAR_SEARCHES.slice(0, 4).map((popular, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(popular.term)}
                      className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-sm text-gray-700">{popular.term}</div>
                        <div className="text-xs text-gray-500">{popular.brand} • {popular.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {query && results.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Search Results ({results.length})
                </div>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleDeviceSelect(result.device)}
                      className="flex items-center justify-between p-3 w-full text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 hover:border-blue-200"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {highlightMatch(result.device.name, query)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.device.brand} • {result.device.year} • {result.device.categoryId.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {getMatchTypeLabel(result.matchType)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          £{result.device.averageRepairCost}
                        </div>
                        <div className="text-xs text-gray-400">
                          from
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <div className="text-sm text-gray-500">
                  No devices found for "{query}"
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Try searching by device name, brand, or model number
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-sm text-gray-500">Searching devices...</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}