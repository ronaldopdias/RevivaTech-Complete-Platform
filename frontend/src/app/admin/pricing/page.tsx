'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import PricingRuleForm from '@/components/admin/pricing/PricingRuleForm';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, CalculatorIcon, RefreshCwIcon, FilterIcon, DownloadIcon, SlidersHorizontalIcon, CheckIcon, XIcon, TrendingUpIcon, CopyIcon, SettingsIcon, ChevronDownIcon } from 'lucide-react';

// Types based on Prisma schema
interface PricingRule {
  id: string;
  deviceModelId?: string;
  repairType: string;
  basePrice: number;
  urgencyMultiplier: number;
  complexityMultiplier: number;
  marketDemand: number;
  seasonalFactor: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  deviceModel?: {
    id: string;
    name: string;
    brand: {
      name: string;
      category: {
        name: string;
      };
    };
  };
}

interface PaginatedResponse {
  rules: PricingRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const REPAIR_TYPES = [
  'SCREEN_REPAIR',
  'BATTERY_REPLACEMENT', 
  'WATER_DAMAGE',
  'DATA_RECOVERY',
  'SOFTWARE_ISSUE',
  'HARDWARE_DIAGNOSTIC',
  'MOTHERBOARD_REPAIR',
  'CAMERA_REPAIR',
  'SPEAKER_REPAIR',
  'CHARGING_PORT',
  'BUTTON_REPAIR',
  'CUSTOM_REPAIR'
] as const;

export default function AdminPricingPage() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepairType, setSelectedRepairType] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse['pagination'] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch pricing rules
  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        query: searchQuery,
        ...(selectedRepairType && { repairType: selectedRepairType }),
        ...(activeFilter !== 'all' && { isActive: activeFilter }),
        ...(selectedBrand && { brand: selectedBrand }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/pricing/simple?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse = await response.json();
      setPricingRules(data.rules);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      setError('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh on filter changes
  useEffect(() => {
    fetchPricingRules();
  }, [currentPage, searchQuery, selectedRepairType, activeFilter, selectedBrand, selectedCategory, priceRange, sortBy, sortOrder]);

  // Close bulk actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBulkActions && !(event.target as Element).closest('.bulk-actions-dropdown')) {
        setShowBulkActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBulkActions]);

  // Format repair type for display
  const formatRepairType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Calculate final price with all multipliers
  const calculateFinalPrice = (rule: PricingRule) => {
    const finalPrice = rule.basePrice * 
      rule.urgencyMultiplier * 
      rule.complexityMultiplier * 
      rule.marketDemand * 
      rule.seasonalFactor;
    return Math.round(finalPrice * 100) / 100;
  };

  // Handle search with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedRules.size === pricingRules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(pricingRules.map(rule => rule.id)));
    }
  };

  const handleSelectRule = (ruleId: string) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedRepairType('');
    setActiveFilter('all');
    setSelectedBrand('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Export pricing rules
  const handleExport = async () => {
    try {
      const exportParams = new URLSearchParams({
        export: 'true',
        query: searchQuery,
        ...(selectedRepairType && { repairType: selectedRepairType }),
        ...(activeFilter !== 'all' && { isActive: activeFilter }),
        ...(selectedBrand && { brand: selectedBrand }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
      });

      const response = await fetch(`/api/pricing/simple?${exportParams}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-rules-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export pricing rules');
    }
  };

  // Advanced bulk operations
  const handleBulkActivate = async () => {
    if (selectedRules.size === 0) return;
    
    try {
      const response = await fetch('/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleIds: Array.from(selectedRules),
          action: 'activate'
        }),
      });

      if (!response.ok) throw new Error('Bulk activation failed');
      
      setSelectedRules(new Set());
      await fetchPricingRules();
      console.log('Bulk activation successful');
    } catch (error) {
      console.error('Bulk activation error:', error);
      setError('Failed to activate selected rules');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedRules.size === 0) return;
    
    try {
      const response = await fetch('/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleIds: Array.from(selectedRules),
          action: 'deactivate'
        }),
      });

      if (!response.ok) throw new Error('Bulk deactivation failed');
      
      setSelectedRules(new Set());
      await fetchPricingRules();
      console.log('Bulk deactivation successful');
    } catch (error) {
      console.error('Bulk deactivation error:', error);
      setError('Failed to deactivate selected rules');
    }
  };

  // Bulk price adjustment
  const handleBulkPriceAdjustment = async () => {
    if (selectedRules.size === 0) return;
    
    const adjustmentType = prompt('Price adjustment type:\n1. Percentage (e.g., +10 or -5)\n2. Fixed amount (e.g., +50 or -25)\n\nEnter your choice:');
    if (!adjustmentType) return;
    
    const isPercentage = adjustmentType.includes('%') || !adjustmentType.includes('£');
    const value = parseFloat(adjustmentType.replace(/[%£\s]/g, ''));
    
    if (isNaN(value)) {
      alert('Invalid adjustment value');
      return;
    }
    
    try {
      const response = await fetch('/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleIds: Array.from(selectedRules),
          action: 'price-adjustment',
          adjustmentType: isPercentage ? 'percentage' : 'fixed',
          adjustmentValue: value
        }),
      });

      if (!response.ok) throw new Error('Bulk price adjustment failed');
      
      setSelectedRules(new Set());
      await fetchPricingRules();
      console.log('Bulk price adjustment successful');
    } catch (error) {
      console.error('Bulk price adjustment error:', error);
      setError('Failed to adjust prices for selected rules');
    }
  };

  // Bulk multiplier update
  const handleBulkMultiplierUpdate = async () => {
    if (selectedRules.size === 0) return;
    
    const multiplierType = prompt('Which multiplier to update?\n1. urgency\n2. complexity\n3. marketDemand\n4. seasonal\n\nEnter choice:');
    if (!multiplierType || !['urgency', 'complexity', 'marketDemand', 'seasonal'].includes(multiplierType)) {
      alert('Invalid multiplier type');
      return;
    }
    
    const newValue = prompt(`Enter new ${multiplierType} multiplier (e.g., 1.2):`);
    const value = parseFloat(newValue || '');
    
    if (isNaN(value) || value <= 0) {
      alert('Invalid multiplier value');
      return;
    }
    
    try {
      const response = await fetch('/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleIds: Array.from(selectedRules),
          action: 'multiplier-update',
          multiplierType,
          multiplierValue: value
        }),
      });

      if (!response.ok) throw new Error('Bulk multiplier update failed');
      
      setSelectedRules(new Set());
      await fetchPricingRules();
      console.log('Bulk multiplier update successful');
    } catch (error) {
      console.error('Bulk multiplier update error:', error);
      setError('Failed to update multipliers for selected rules');
    }
  };

  // Bulk clone rules
  const handleBulkClone = async () => {
    if (selectedRules.size === 0) return;
    
    const newRepairType = prompt(`Clone ${selectedRules.size} rules for which repair type?\nAvailable types:\n${REPAIR_TYPES.map(type => formatRepairType(type)).join('\n')}\n\nEnter repair type:`);
    if (!newRepairType) return;
    
    const matchingType = REPAIR_TYPES.find(type => formatRepairType(type).toLowerCase() === newRepairType.toLowerCase());
    if (!matchingType) {
      alert('Invalid repair type');
      return;
    }
    
    try {
      const response = await fetch('/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleIds: Array.from(selectedRules),
          action: 'clone',
          targetRepairType: matchingType
        }),
      });

      if (!response.ok) throw new Error('Bulk clone failed');
      
      setSelectedRules(new Set());
      await fetchPricingRules();
      console.log('Bulk clone successful');
    } catch (error) {
      console.error('Bulk clone error:', error);
      setError('Failed to clone selected rules');
    }
  };

  // Bulk delete/deactivate
  const handleBulkDelete = async () => {
    if (selectedRules.size === 0) return;
    
    if (!confirm(`Are you sure you want to deactivate ${selectedRules.size} selected pricing rules?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleIds: Array.from(selectedRules),
          action: 'delete'
        }),
      });

      if (!response.ok) throw new Error('Bulk delete failed');
      
      setSelectedRules(new Set());
      await fetchPricingRules();
      console.log('Bulk delete successful');
    } catch (error) {
      console.error('Bulk delete error:', error);
      setError('Failed to deactivate selected rules');
    }
  };

  // Handle saving pricing rule (create or edit)
  const handleSavePricingRule = async (ruleData: any) => {
    try {
      // Refresh the pricing rules list
      await fetchPricingRules();
      
      // Show success message (you could add a toast notification here)
      console.log('Pricing rule saved successfully');
    } catch (error) {
      console.error('Error after saving pricing rule:', error);
      setError('Failed to refresh pricing rules');
    }
  };

  // Handle deleting/deactivating pricing rule
  const handleDeletePricingRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to deactivate this pricing rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing/simple/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate pricing rule');
      }

      // Refresh the list
      await fetchPricingRules();
      console.log('Pricing rule deactivated successfully');
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      setError('Failed to deactivate pricing rule');
    }
  };

  // Handle calculating price preview
  const handleCalculatePrice = async (rule: PricingRule) => {
    if (!rule.deviceModelId) {
      alert('Cannot calculate price for generic rules. Please select a specific device.');
      return;
    }

    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceModelId: rule.deviceModelId,
          repairType: rule.repairType,
          urgencyLevel: 'STANDARD',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate price');
      }

      const priceData = await response.json();
      alert(`Calculated price: ${formatCurrency(priceData.pricing.finalPrice)}`);
    } catch (error) {
      console.error('Error calculating price:', error);
      alert('Failed to calculate price');
    }
  };

  if (loading && pricingRules.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pricing Management</h1>
          <p className="text-neutral-600 mt-2">
            Manage dynamic pricing rules for repair services across all device categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchPricingRules}
            disabled={loading}
            title="Refresh pricing rules"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Toggle advanced filters"
          >
            <SlidersHorizontalIcon className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            title="Export pricing rules"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-trust-500 hover:bg-trust-700 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Pricing Rule
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 space-y-4">
        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search by device or repair type..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedRepairType}
            onValueChange={setSelectedRepairType}
            placeholder="Filter by repair type"
          >
            <option value="">All repair types</option>
            {REPAIR_TYPES.map(type => (
              <option key={type} value={type}>
                {formatRepairType(type)}
              </option>
            ))}
          </Select>

          <Select
            value={activeFilter}
            onValueChange={setActiveFilter}
            placeholder="Filter by status"
          >
            <option value="all">All rules</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </Select>

          <Button 
            variant="outline"
            onClick={clearAllFilters}
          >
            Clear All Filters
          </Button>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Brand Filter */}
              <Select
                value={selectedBrand}
                onValueChange={setSelectedBrand}
                placeholder="Filter by brand"
              >
                <option value="">All brands</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Google">Google</option>
                <option value="OnePlus">OnePlus</option>
                <option value="Sony">Sony</option>
                <option value="Huawei">Huawei</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="Dell">Dell</option>
                <option value="HP">HP</option>
                <option value="Lenovo">Lenovo</option>
              </Select>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Filter by category"
              >
                <option value="">All categories</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Tablets">Tablets</option>
                <option value="Laptops">Laptops</option>
                <option value="Desktops">Desktops</option>
                <option value="Gaming Consoles">Gaming Consoles</option>
                <option value="Wearables">Wearables</option>
              </Select>

              {/* Price Range */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min £"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Max £"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20"
                />
              </div>

              {/* Sort Options */}
              <Select
                value={sortBy}
                onValueChange={setSortBy}
                placeholder="Sort by"
              >
                <option value="createdAt">Date Created</option>
                <option value="basePrice">Base Price</option>
                <option value="repairType">Repair Type</option>
                <option value="deviceModel">Device Model</option>
                <option value="isActive">Status</option>
              </Select>

              {/* Sort Order */}
              <Select
                value={sortOrder}
                onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
                placeholder="Sort order"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Enhanced Bulk Operations Bar */}
      {selectedRules.size > 0 && (
        <Card className="p-4 bg-gradient-to-r from-trust-50 to-professional-50 border-trust-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-trust-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-trust-700">
                  {selectedRules.size} rule{selectedRules.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkActivate}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                >
                  <CheckIcon className="w-3 h-3 mr-1" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeactivate}
                  className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                >
                  <XIcon className="w-3 h-3 mr-1" />
                  Deactivate
                </Button>
                
                {/* Advanced Actions Dropdown */}
                <div className="relative bulk-actions-dropdown">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="text-professional-600 hover:text-professional-800 hover:bg-professional-50"
                  >
                    <SettingsIcon className="w-3 h-3 mr-1" />
                    Advanced
                    <ChevronDownIcon className="w-3 h-3 ml-1" />
                  </Button>
                  
                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 min-w-48">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-neutral-500 px-2 py-1 mb-1">
                          PRICING OPERATIONS
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleBulkPriceAdjustment();
                            setShowBulkActions(false);
                          }}
                          className="w-full justify-start text-xs hover:bg-trust-50"
                        >
                          <TrendingUpIcon className="w-3 h-3 mr-2" />
                          Adjust Prices
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleBulkMultiplierUpdate();
                            setShowBulkActions(false);
                          }}
                          className="w-full justify-start text-xs hover:bg-professional-50"
                        >
                          <CalculatorIcon className="w-3 h-3 mr-2" />
                          Update Multipliers
                        </Button>
                        
                        <div className="border-t border-neutral-100 my-1"></div>
                        <div className="text-xs font-semibold text-neutral-500 px-2 py-1 mb-1">
                          RULE OPERATIONS
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleBulkClone();
                            setShowBulkActions(false);
                          }}
                          className="w-full justify-start text-xs hover:bg-blue-50"
                        >
                          <CopyIcon className="w-3 h-3 mr-2" />
                          Clone Rules
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleBulkDelete();
                            setShowBulkActions(false);
                          }}
                          className="w-full justify-start text-xs hover:bg-red-50 text-red-600"
                        >
                          <TrashIcon className="w-3 h-3 mr-2" />
                          Delete Rules
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-professional-600 hover:text-professional-800"
              >
                <DownloadIcon className="w-3 h-3 mr-1" />
                Export Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRules(new Set());
                  setShowBulkActions(false);
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Clear Selection
              </Button>
            </div>
          </div>
          
          {/* Bulk Operations Summary */}
          <div className="mt-3 pt-3 border-t border-trust-200">
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <span>Selected rules span {new Set(pricingRules.filter(rule => selectedRules.has(rule.id)).map(rule => rule.repairType)).size} repair types</span>
              <span>•</span>
              <span>Total base value: {formatCurrency(pricingRules.filter(rule => selectedRules.has(rule.id)).reduce((sum, rule) => sum + rule.basePrice, 0))}</span>
              <span>•</span>
              <span>{pricingRules.filter(rule => selectedRules.has(rule.id) && rule.isActive).length} active, {pricingRules.filter(rule => selectedRules.has(rule.id) && !rule.isActive).length} inactive</span>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchPricingRules}
            className="mt-2"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Pricing Rules Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedRules.size === pricingRules.length && pricingRules.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-neutral-300 text-trust-500 focus:ring-trust-500"
                  />
                </th>
                <th className="text-left p-4 font-semibold text-neutral-700">Device & Repair</th>
                <th className="text-left p-4 font-semibold text-neutral-700">Base Price</th>
                <th className="text-left p-4 font-semibold text-neutral-700">Final Price</th>
                <th className="text-left p-4 font-semibold text-neutral-700">Multipliers</th>
                <th className="text-left p-4 font-semibold text-neutral-700">Validity</th>
                <th className="text-left p-4 font-semibold text-neutral-700">Status</th>
                <th className="text-left p-4 font-semibold text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pricingRules.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-neutral-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRules.has(rule.id)}
                      onChange={() => handleSelectRule(rule.id)}
                      className="rounded border-neutral-300 text-trust-500 focus:ring-trust-500"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {rule.deviceModel 
                          ? `${rule.deviceModel.brand.name} ${rule.deviceModel.name}`
                          : 'Generic Rule'
                        }
                      </div>
                      <div className="text-sm text-neutral-600">
                        {formatRepairType(rule.repairType)}
                      </div>
                      {rule.deviceModel && (
                        <div className="text-xs text-neutral-500">
                          {rule.deviceModel.brand.category.name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-neutral-900">
                      {formatCurrency(rule.basePrice)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-trust-700">
                      {formatCurrency(calculateFinalPrice(rule))}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-xs">
                      <div>Urgency: {rule.urgencyMultiplier}x</div>
                      <div>Complexity: {rule.complexityMultiplier}x</div>
                      <div>Market: {rule.marketDemand}x</div>
                      <div>Seasonal: {rule.seasonalFactor}x</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div>From: {new Date(rule.validFrom).toLocaleDateString()}</div>
                      {rule.validUntil && (
                        <div>Until: {new Date(rule.validUntil).toLocaleDateString()}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge 
                      variant={rule.isActive ? 'success' : 'secondary'}
                      className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRule(rule)}
                        title="Edit pricing rule"
                      >
                        <EditIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalculatePrice(rule)}
                        className="text-professional-700 hover:text-professional-900"
                        title="Calculate price preview"
                        disabled={!rule.deviceModelId}
                      >
                        <CalculatorIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePricingRule(rule.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Deactivate pricing rule"
                        disabled={!rule.isActive}
                      >
                        <TrashIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-neutral-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} pricing rules
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {!loading && pricingRules.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-neutral-400 mb-4">
            <CalculatorIcon className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">
            No pricing rules found
          </h3>
          <p className="text-neutral-600 mb-4">
            {searchQuery || selectedRepairType || activeFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first pricing rule.'
            }
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-trust-500 hover:bg-trust-700 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create First Pricing Rule
          </Button>
        </Card>
      )}

      {/* Pricing Rule Form Modal */}
      <PricingRuleForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSave={handleSavePricingRule}
        mode="create"
      />

      <PricingRuleForm
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        onSave={handleSavePricingRule}
        editingRule={editingRule}
        mode="edit"
      />
    </div>
  );
}