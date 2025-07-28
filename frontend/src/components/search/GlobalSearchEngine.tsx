'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Clock, TrendingUp, Zap, X, MapPin, Star, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SearchableItem {
  id: string;
  type: 'device' | 'service' | 'location' | 'article' | 'repair_guide';
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  price?: number;
  rating?: number;
  location?: string;
  imageUrl?: string;
  url: string;
  searchableText: string;
  priority: number;
}

interface SearchFilters {
  type: string[];
  category: string[];
  priceRange: [number, number];
  rating: number;
  location: string;
}

interface SearchResult {
  item: SearchableItem;
  score: number;
  matchedFields: string[];
  highlightedTitle: string;
  highlightedDescription: string;
}

interface GlobalSearchEngineProps {
  onResultSelect: (item: SearchableItem) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  maxResults?: number;
}

// Mock data for comprehensive search
const SEARCHABLE_CONTENT: SearchableItem[] = [
  // Devices
  {
    id: 'iphone-15-pro',
    type: 'device',
    title: 'iPhone 15 Pro',
    subtitle: 'Apple • 2024 • Smartphone',
    description: 'Latest iPhone with titanium design, A17 Pro chip, and enhanced camera system',
    category: 'smartphone',
    tags: ['apple', 'iphone', 'premium', 'titanium', 'a17-pro'],
    price: 150,
    rating: 4.8,
    imageUrl: '/devices/iphone-15-pro.jpg',
    url: '/devices/iphone-15-pro',
    searchableText: 'iPhone 15 Pro Apple smartphone titanium A17 Pro chip camera system',
    priority: 100
  },
  {
    id: 'macbook-pro-m3',
    type: 'device',
    title: 'MacBook Pro M3',
    subtitle: 'Apple • 2024 • Laptop',
    description: 'Professional laptop with M3 chip, liquid retina display, and all-day battery',
    category: 'laptop',
    tags: ['apple', 'macbook', 'professional', 'm3-chip', 'laptop'],
    price: 280,
    rating: 4.9,
    imageUrl: '/devices/macbook-pro-m3.jpg',
    url: '/devices/macbook-pro-m3',
    searchableText: 'MacBook Pro M3 Apple laptop professional liquid retina display battery',
    priority: 95
  },
  
  // Services
  {
    id: 'screen-replacement',
    type: 'service',
    title: 'Screen Replacement',
    subtitle: 'Professional Display Repair',
    description: 'Expert screen replacement for smartphones, tablets, and laptops with premium parts',
    category: 'repair',
    tags: ['screen', 'display', 'replacement', 'repair', 'premium'],
    price: 80,
    rating: 4.7,
    url: '/services/screen-replacement',
    searchableText: 'screen replacement display repair smartphones tablets laptops premium parts',
    priority: 90
  },
  {
    id: 'data-recovery',
    type: 'service',
    title: 'Data Recovery',
    subtitle: 'Professional Data Restoration',
    description: 'Advanced data recovery from damaged devices, hard drives, and storage media',
    category: 'data',
    tags: ['data', 'recovery', 'restoration', 'hard-drive', 'storage'],
    price: 120,
    rating: 4.6,
    url: '/services/data-recovery',
    searchableText: 'data recovery restoration damaged devices hard drives storage media',
    priority: 85
  },
  
  // Locations
  {
    id: 'london-central',
    type: 'location',
    title: 'London Central Store',
    subtitle: '123 Oxford Street, London',
    description: 'Our flagship store in central London with full repair facilities',
    category: 'store',
    tags: ['london', 'central', 'flagship', 'repair', 'facility'],
    location: 'London, UK',
    rating: 4.8,
    url: '/locations/london-central',
    searchableText: 'London Central Store Oxford Street flagship repair facilities',
    priority: 70
  },
  
  // Articles & Guides
  {
    id: 'iphone-battery-guide',
    type: 'article',
    title: 'iPhone Battery Replacement Guide',
    subtitle: 'Complete Tutorial',
    description: 'Step-by-step guide to replacing iPhone batteries safely and effectively',
    category: 'tutorial',
    tags: ['iphone', 'battery', 'replacement', 'guide', 'tutorial'],
    rating: 4.5,
    url: '/guides/iphone-battery-replacement',
    searchableText: 'iPhone battery replacement guide tutorial step-by-step safely effectively',
    priority: 60
  },
  {
    id: 'macbook-troubleshooting',
    type: 'repair_guide',
    title: 'MacBook Troubleshooting',
    subtitle: 'Common Issues & Solutions',
    description: 'Comprehensive guide to diagnosing and fixing common MacBook problems',
    category: 'troubleshooting',
    tags: ['macbook', 'troubleshooting', 'problems', 'solutions', 'diagnosis'],
    rating: 4.4,
    url: '/guides/macbook-troubleshooting',
    searchableText: 'MacBook troubleshooting common issues solutions diagnosis fixing problems',
    priority: 55
  }
];

const SEARCH_CATEGORIES = [
  { id: 'all', name: 'All Results', icon: '🔍' },
  { id: 'device', name: 'Devices', icon: '📱' },
  { id: 'service', name: 'Services', icon: '🔧' },
  { id: 'location', name: 'Locations', icon: '📍' },
  { id: 'article', name: 'Articles', icon: '📝' },
  { id: 'repair_guide', name: 'Guides', icon: '📖' }
];

const QUICK_SEARCHES = [
  { term: 'iPhone repair', category: 'device', icon: '📱' },
  { term: 'Screen replacement', category: 'service', icon: '🖥️' },
  { term: 'MacBook battery', category: 'device', icon: '🔋' },
  { term: 'Data recovery', category: 'service', icon: '💾' },
  { term: 'London store', category: 'location', icon: '📍' },
  { term: 'Repair guide', category: 'article', icon: '📖' }
];

export default function GlobalSearchEngine({
  onResultSelect,
  placeholder = "Search devices, services, guides, and more...",
  className = "",
  showFilters = true,
  maxResults = 12
}: GlobalSearchEngineProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    category: [],
    priceRange: [0, 1000],
    rating: 0,
    location: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('revivatech-global-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightMatch = useCallback((text: string, query: string): string => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 font-medium">$1</mark>');
  }, []);

  const calculateSearchScore = useCallback((item: SearchableItem, query: string): number => {
    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(' ');
    let score = 0;
    const matchedFields: string[] = [];

    // Exact title match (highest priority)
    if (item.title.toLowerCase() === normalizedQuery) {
      score += 1000;
      matchedFields.push('title-exact');
    }

    // Title contains query
    if (item.title.toLowerCase().includes(normalizedQuery)) {
      score += 500;
      matchedFields.push('title');
    }

    // Subtitle match
    if (item.subtitle.toLowerCase().includes(normalizedQuery)) {
      score += 300;
      matchedFields.push('subtitle');
    }

    // Description match
    if (item.description.toLowerCase().includes(normalizedQuery)) {
      score += 200;
      matchedFields.push('description');
    }

    // Tag matches
    item.tags.forEach(tag => {
      if (tag.toLowerCase().includes(normalizedQuery)) {
        score += 150;
        matchedFields.push('tags');
      }
    });

    // Category match
    if (item.category.toLowerCase().includes(normalizedQuery)) {
      score += 100;
      matchedFields.push('category');
    }

    // Word-by-word matching
    queryWords.forEach(word => {
      if (word.length > 2) {
        const wordRegex = new RegExp(`\\b${word}`, 'i');
        if (wordRegex.test(item.searchableText)) {
          score += 50;
        }
      }
    });

    // Priority boost
    score += item.priority;

    // Rating boost
    if (item.rating) {
      score += item.rating * 10;
    }

    // Type filtering
    if (selectedCategory !== 'all' && item.type !== selectedCategory) {
      score *= 0.1; // Heavily penalize non-matching types
    }

    return score;
  }, [selectedCategory]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 200));

    const searchResults: SearchResult[] = [];
    const normalizedQuery = searchQuery.toLowerCase().trim();

    SEARCHABLE_CONTENT.forEach(item => {
      const score = calculateSearchScore(item, normalizedQuery);
      
      if (score > 50) {
        const matchedFields = ['title', 'description']; // Simplified for now
        
        searchResults.push({
          item,
          score,
          matchedFields,
          highlightedTitle: highlightMatch(item.title, searchQuery),
          highlightedDescription: highlightMatch(item.description, searchQuery)
        });
      }
    });

    // Sort by score and apply filters
    let sortedResults = searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    // Apply additional filters
    if (filters.rating > 0) {
      sortedResults = sortedResults.filter(result => 
        result.item.rating && result.item.rating >= filters.rating
      );
    }

    if (filters.priceRange[1] < 1000) {
      sortedResults = sortedResults.filter(result => 
        !result.item.price || (result.item.price >= filters.priceRange[0] && result.item.price <= filters.priceRange[1])
      );
    }

    setResults(sortedResults);
    setIsLoading(false);
  }, [calculateSearchScore, highlightMatch, maxResults, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleResultSelect = (item: SearchableItem) => {
    setQuery(item.title);
    setIsOpen(false);
    
    // Add to recent searches
    const newRecentSearches = [item.title, ...recentSearches.filter(s => s !== item.title)].slice(0, 8);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('revivatech-global-searches', JSON.stringify(newRecentSearches));
    
    onResultSelect(item);
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

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'device': return '📱';
      case 'service': return '🔧';
      case 'location': return '📍';
      case 'article': return '📝';
      case 'repair_guide': return '📖';
      default: return '🔍';
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return `£${price}`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-gray-600">{rating}</span>
      </div>
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
          onFocus={() => setIsOpen(true)}
          className="pl-12 pr-20 h-14 text-lg border-2 focus:border-blue-500 transition-colors"
        />
        <div className="absolute right-2 top-2 flex items-center space-x-2">
          {showFilters && (
            <Button
              variant={showAdvancedFilters ? "primary" : "ghost"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-10"
            >
              <Filter className="w-4 h-4" />
            </Button>
          )}
          {query && (
            <button
              onClick={clearSearch}
              className="w-10 h-10 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {isLoading && (
          <div className="absolute right-24 top-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card className="mt-2 p-4 border-2 border-gray-200">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SEARCH_CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-sm"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Minimum Rating
                </label>
                <select 
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Price
                </label>
                <select 
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [prev.priceRange[0], Number(e.target.value)] 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1000}>Any Price</option>
                  <option value={50}>Under £50</option>
                  <option value={100}>Under £100</option>
                  <option value={200}>Under £200</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Location
                </label>
                <select 
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Any Location</option>
                  <option value="london">London</option>
                  <option value="manchester">Manchester</option>
                  <option value="birmingham">Birmingham</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-16 left-0 right-0 z-50 shadow-2xl border-2 border-gray-200 max-h-[70vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Quick Categories (when no query) */}
            {!query && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-blue-500" />
                  Quick Search
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {QUICK_SEARCHES.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(item.term)}
                      className="flex items-center space-x-2 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{item.term}</span>
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
                  {recentSearches.slice(0, 6).map((search, index) => (
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

            {/* Search Results */}
            {query && results.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Search Results ({results.length})
                </div>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultSelect(result.item)}
                      className="flex items-start justify-between p-4 w-full text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-100 hover:border-blue-200 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getItemIcon(result.item.type)}</span>
                          <div 
                            className="text-sm font-medium text-gray-900 truncate"
                            dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
                          />
                          {result.item.rating && renderStars(result.item.rating)}
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-1">
                          {result.item.subtitle}
                        </div>
                        
                        <div 
                          className="text-xs text-gray-600 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: result.highlightedDescription }}
                        />
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-blue-600 capitalize">
                            {result.item.type.replace('_', ' ')}
                          </div>
                          {result.item.location && (
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mr-1" />
                              {result.item.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end ml-4">
                        {result.item.price && (
                          <div className="text-sm font-semibold text-green-600 mb-1">
                            {formatPrice(result.item.price)}
                          </div>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
                  No results found for "{query}"
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Try adjusting your search terms or filters
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-sm text-gray-500">Searching...</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}