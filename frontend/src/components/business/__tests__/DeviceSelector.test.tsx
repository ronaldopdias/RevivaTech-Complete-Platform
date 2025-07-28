import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceSelector } from '../DeviceSelector';
import { allDevices, allCategories } from '../../../../config/devices';
import type { DeviceModel } from '@/types/config';

// Mock the config modules
jest.mock('../../../../config/devices', () => ({
  allDevices: [
    {
      id: 'macbook-pro-16-2023',
      name: 'MacBook Pro 16" M3',
      brand: 'Apple',
      year: 2023,
      categoryId: 'macbook',
      averageRepairCost: 400,
      commonIssues: ['Screen issues', 'Keyboard problems', 'Battery drain'],
    },
    {
      id: 'iphone-15-pro',
      name: 'iPhone 15 Pro',
      brand: 'Apple',
      year: 2023,
      categoryId: 'iphone',
      averageRepairCost: 300,
      commonIssues: ['Screen cracks', 'Battery issues', 'Camera problems'],
    },
    {
      id: 'macbook-air-m2',
      name: 'MacBook Air M2',
      brand: 'Apple',
      year: 2022,
      categoryId: 'macbook',
      averageRepairCost: 250,
      commonIssues: ['Keyboard issues', 'Screen problems'],
    },
  ],
  allCategories: [
    {
      id: 'macbook',
      name: 'MacBook',
      description: 'Apple laptops',
    },
    {
      id: 'iphone',
      name: 'iPhone',
      description: 'Apple smartphones',
    },
  ],
  searchDevices: jest.fn(),
  getDevicesByCategory: jest.fn(),
  getPopularDevices: jest.fn(),
  getCategoryStats: jest.fn(),
}));

const mockSearchDevices = require('../../../../config/devices').searchDevices;
const mockGetDevicesByCategory = require('../../../../config/devices').getDevicesByCategory;
const mockGetPopularDevices = require('../../../../config/devices').getPopularDevices;
const mockGetCategoryStats = require('../../../../config/devices').getCategoryStats;

describe('DeviceSelector', () => {
  const mockOnDeviceSelect = jest.fn();
  const sampleDevice: DeviceModel = allDevices[0];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockSearchDevices.mockImplementation((query: string) => 
      allDevices.filter(device => 
        device.name.toLowerCase().includes(query.toLowerCase()) ||
        device.brand.toLowerCase().includes(query.toLowerCase())
      )
    );
    
    mockGetDevicesByCategory.mockImplementation((categoryId: string) =>
      allDevices.filter(device => device.categoryId === categoryId)
    );
    
    mockGetPopularDevices.mockReturnValue(allDevices.slice(0, 2));
    
    mockGetCategoryStats.mockReturnValue([
      {
        category: allCategories[0],
        deviceCount: 2,
        brands: 1,
        avgRepairCost: 325,
        yearRange: { min: 2022, max: 2023 },
        mostCommonIssues: ['Screen issues', 'Keyboard problems'],
      },
    ]);
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      expect(screen.getByPlaceholderText('Search for your device...')).toBeInTheDocument();
      expect(screen.getByText('Popular Devices')).toBeInTheDocument();
      expect(screen.getByText('Browse by Category')).toBeInTheDocument();
    });

    it('renders in compact variant', () => {
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          variant="compact" 
        />
      );
      
      expect(screen.getByPlaceholderText('Search for your device...')).toBeInTheDocument();
      expect(screen.queryByText('Popular Devices')).not.toBeInTheDocument();
    });

    it('renders without search when showSearch is false', () => {
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          showSearch={false} 
        />
      );
      
      expect(screen.queryByPlaceholderText('Search for your device...')).not.toBeInTheDocument();
    });

    it('renders without popular devices when showPopular is false', () => {
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          showPopular={false} 
        />
      );
      
      expect(screen.queryByText('Popular Devices')).not.toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      const customPlaceholder = 'Find your device...';
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          placeholder={customPlaceholder} 
        />
      );
      
      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('performs search when user types', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      await user.type(searchInput, 'MacBook');
      
      await waitFor(() => {
        expect(mockSearchDevices).toHaveBeenCalledWith('MacBook');
      });
    });

    it('displays search results', async () => {
      const user = userEvent.setup();
      mockSearchDevices.mockReturnValue([allDevices[0]]);
      
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      await user.type(searchInput, 'MacBook');
      
      await waitFor(() => {
        expect(screen.getByText('MacBook Pro 16" M3')).toBeInTheDocument();
      });
    });

    it('shows no results message when search returns empty', async () => {
      const user = userEvent.setup();
      mockSearchDevices.mockReturnValue([]);
      
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      await user.type(searchInput, 'NonexistentDevice');
      
      await waitFor(() => {
        expect(screen.getByText('No devices found')).toBeInTheDocument();
      });
    });

    it('shows loading state during search', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      await user.type(searchInput, 'MacBook');
      
      // Should show searching state briefly
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('clears search results when search query is empty', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      
      // Type and then clear
      await user.type(searchInput, 'MacBook');
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.queryByText('MacBook Pro 16" M3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    it('displays categories', () => {
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      expect(screen.getByText('MacBook')).toBeInTheDocument();
      expect(screen.getByText('iPhone')).toBeInTheDocument();
    });

    it('filters devices by category when clicked', async () => {
      const user = userEvent.setup();
      mockGetDevicesByCategory.mockReturnValue([allDevices[0]]);
      
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const macbookCategory = screen.getByText('MacBook');
      await user.click(macbookCategory);
      
      expect(mockGetDevicesByCategory).toHaveBeenCalledWith('macbook');
    });

    it('shows category devices when category is selected', async () => {
      const user = userEvent.setup();
      mockGetDevicesByCategory.mockReturnValue([allDevices[0]]);
      
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const macbookCategory = screen.getByText('MacBook');
      await user.click(macbookCategory);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Device')).toBeInTheDocument();
      });
    });

    it('toggles category selection when clicked twice', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const macbookCategory = screen.getByText('MacBook');
      
      // Click once to select
      await user.click(macbookCategory);
      expect(mockGetDevicesByCategory).toHaveBeenCalledWith('macbook');
      
      // Click again to deselect
      await user.click(macbookCategory);
      expect(screen.queryByText('Select Your Device')).not.toBeInTheDocument();
    });
  });

  describe('Device Selection', () => {
    it('calls onDeviceSelect when device is clicked', async () => {
      const user = userEvent.setup();
      mockSearchDevices.mockReturnValue([allDevices[0]]);
      
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      await user.type(searchInput, 'MacBook');
      
      await waitFor(() => {
        const deviceButton = screen.getByText('MacBook Pro 16" M3');
        return user.click(deviceButton);
      });
      
      expect(mockOnDeviceSelect).toHaveBeenCalledWith(allDevices[0]);
    });

    it('highlights selected device', () => {
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          selectedDevice={sampleDevice}
        />
      );
      
      expect(screen.getByText('Selected Device')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro 16" M3 (2023)')).toBeInTheDocument();
    });
  });

  describe('Popular Devices', () => {
    it('displays popular devices', () => {
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      expect(screen.getByText('Popular Devices')).toBeInTheDocument();
      mockGetPopularDevices().forEach((device: DeviceModel) => {
        expect(screen.getByText(device.name)).toBeInTheDocument();
      });
    });

    it('allows selection of popular devices', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const popularDevice = screen.getByText(allDevices[0].name);
      await user.click(popularDevice);
      
      expect(mockOnDeviceSelect).toHaveBeenCalledWith(allDevices[0]);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      // Check that buttons are properly labeled
      const categoryButtons = screen.getAllByRole('button');
      expect(categoryButtons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      
      // Focus should work with keyboard
      await user.tab();
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Variants', () => {
    it('renders detailed variant with extended information', () => {
      mockSearchDevices.mockReturnValue([allDevices[0]]);
      
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          variant="detailed"
        />
      );
      
      // Should show more detailed information in detailed variant
      expect(screen.getByText('Popular Devices')).toBeInTheDocument();
    });

    it('renders compact variant with minimal interface', () => {
      render(
        <DeviceSelector 
          onDeviceSelect={mockOnDeviceSelect} 
          variant="compact"
        />
      );
      
      // Compact variant should not show popular devices by default
      expect(screen.queryByText('Popular Devices')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles search errors gracefully', async () => {
      const user = userEvent.setup();
      mockSearchDevices.mockImplementation(() => {
        throw new Error('Search failed');
      });
      
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      await user.type(searchInput, 'MacBook');
      
      // Should not crash and should handle error gracefully
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('debounces search input', async () => {
      const user = userEvent.setup();
      render(<DeviceSelector onDeviceSelect={mockOnDeviceSelect} />);
      
      const searchInput = screen.getByPlaceholderText('Search for your device...');
      
      // Type quickly
      await user.type(searchInput, 'Mac');
      
      // Search should be debounced
      expect(mockSearchDevices).not.toHaveBeenCalled();
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockSearchDevices).toHaveBeenCalledWith('Mac');
      });
    });
  });
});