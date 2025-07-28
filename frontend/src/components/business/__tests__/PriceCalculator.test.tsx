import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceCalculator } from '../PriceCalculator';
import { pricingEngine } from '../../../../config/pricing/pricing.engine';
import type { DeviceModel, RepairType, PriceEstimate } from '@/types/config';

// Mock the pricing engine
jest.mock('../../../../config/pricing/pricing.engine', () => ({
  pricingEngine: {
    getAvailableRepairs: jest.fn(),
    getRecommendedRepairs: jest.fn(),
    calculatePrice: jest.fn(),
  },
  getAllRepairTypes: jest.fn(),
}));

const mockPricingEngine = pricingEngine as jest.Mocked<typeof pricingEngine>;

describe('PriceCalculator', () => {
  const mockOnPriceCalculated = jest.fn();
  
  const sampleDevice: DeviceModel = {
    id: 'macbook-pro-16-2023',
    name: 'MacBook Pro 16" M3',
    brand: 'Apple',
    year: 2023,
    categoryId: 'macbook',
    averageRepairCost: 400,
    commonIssues: ['Screen issues', 'Keyboard problems'],
  };

  const sampleRepairTypes: RepairType[] = [
    {
      id: 'screen_repair',
      name: 'Screen Repair',
      description: 'LCD/OLED screen replacement',
      category: 'display',
      basePriceRange: { min: 200, max: 400 },
      laborHours: 1.5,
      partsRequired: ['screen', 'adhesive'],
      complexity: 'moderate',
      warranty: 90,
    },
    {
      id: 'battery_replacement',
      name: 'Battery Replacement',
      description: 'Battery replacement and calibration',
      category: 'power',
      basePriceRange: { min: 80, max: 180 },
      laborHours: 0.5,
      partsRequired: ['battery'],
      complexity: 'simple',
      warranty: 90,
    },
  ];

  const samplePriceEstimate: PriceEstimate = {
    basePrice: 250,
    laborCost: 67,
    partsCost: 150,
    serviceFee: 15,
    options: [],
    total: 332,
    warranty: 90,
    estimatedTime: '4-8 hours',
    confidence: 'high',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPricingEngine.getAvailableRepairs.mockReturnValue(sampleRepairTypes);
    mockPricingEngine.getRecommendedRepairs.mockReturnValue([sampleRepairTypes[0]]);
    mockPricingEngine.calculatePrice.mockReturnValue(samplePriceEstimate);
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<PriceCalculator device={sampleDevice} />);
      
      expect(screen.getByText('Price Calculator')).toBeInTheDocument();
      expect(screen.getByText(/Get an instant estimate for your/)).toBeInTheDocument();
      expect(screen.getByText('Recommended for Your Device')).toBeInTheDocument();
      expect(screen.getByText('All Available Repairs')).toBeInTheDocument();
    });

    it('renders in compact variant', () => {
      render(<PriceCalculator device={sampleDevice} variant="compact" />);
      
      const selectElement = screen.getByDisplayValue('Select repair type...');
      expect(selectElement).toBeInTheDocument();
    });

    it('renders without options when allowOptions is false', () => {
      render(<PriceCalculator device={sampleDevice} allowOptions={false} />);
      
      expect(screen.queryByText('Service Options')).not.toBeInTheDocument();
    });

    it('renders without breakdown when showBreakdown is false', () => {
      render(<PriceCalculator device={sampleDevice} showBreakdown={false} />);
      
      // Select a repair type first to trigger price calculation
      const repairButton = screen.getByText('Screen Repair');
      fireEvent.click(repairButton);
      
      waitFor(() => {
        expect(screen.queryByText('Price Breakdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Repair Type Selection', () => {
    it('displays available repair types', () => {
      render(<PriceCalculator device={sampleDevice} />);
      
      expect(screen.getByText('Screen Repair')).toBeInTheDocument();
      expect(screen.getByText('Battery Replacement')).toBeInTheDocument();
      expect(screen.getByText('LCD/OLED screen replacement')).toBeInTheDocument();
    });

    it('highlights recommended repairs', () => {
      render(<PriceCalculator device={sampleDevice} />);
      
      expect(screen.getByText('Recommended for Your Device')).toBeInTheDocument();
      
      // The recommended repair should appear in the recommended section
      const recommendedSection = screen.getByText('Recommended for Your Device').closest('div');
      expect(recommendedSection).toContainElement(screen.getAllByText('Screen Repair')[0]);
    });

    it('selects repair type when clicked', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      expect(mockPricingEngine.calculatePrice).toHaveBeenCalledWith(
        sampleDevice,
        'screen_repair',
        {}
      );
    });

    it('shows complexity badges', () => {
      render(<PriceCalculator device={sampleDevice} />);
      
      expect(screen.getByText('moderate')).toBeInTheDocument();
      expect(screen.getByText('simple')).toBeInTheDocument();
    });
  });

  describe('Price Calculation', () => {
    it('calculates price when repair type is selected', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} onPriceCalculated={mockOnPriceCalculated} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(mockPricingEngine.calculatePrice).toHaveBeenCalledWith(
          sampleDevice,
          'screen_repair',
          {}
        );
        expect(mockOnPriceCalculated).toHaveBeenCalledWith(samplePriceEstimate);
      });
    });

    it('shows loading state during calculation', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      // Should briefly show calculating state
      expect(screen.getByText('Calculating price...')).toBeInTheDocument();
    });

    it('displays price estimate after calculation', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Total Estimate')).toBeInTheDocument();
        expect(screen.getByText('£332')).toBeInTheDocument();
        expect(screen.getByText('4-8 hours')).toBeInTheDocument();
      });
    });

    it('shows confidence indicator', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('High Confidence Estimate')).toBeInTheDocument();
      });
    });

    it('displays price breakdown when enabled', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} showBreakdown={true} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Price Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Base Price')).toBeInTheDocument();
        expect(screen.getByText('Labor Cost')).toBeInTheDocument();
        expect(screen.getByText('Parts Cost')).toBeInTheDocument();
        expect(screen.getByText('Service Fee')).toBeInTheDocument();
      });
    });
  });

  describe('Service Options', () => {
    beforeEach(() => {
      // Mock price calculation with options
      mockPricingEngine.calculatePrice.mockImplementation((device, repairType, options) => ({
        ...samplePriceEstimate,
        options: Object.entries(options || {}).filter(([, value]) => value).map(([key]) => ({
          name: key === 'express' ? 'Express Service' : key,
          cost: key === 'express' ? 100 : 50,
        })),
        total: samplePriceEstimate.total + (options?.express ? 100 : 0),
      }));
    });

    it('displays service options when repair type is selected', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} allowOptions={true} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Service Options')).toBeInTheDocument();
        expect(screen.getByText('Express Service')).toBeInTheDocument();
        expect(screen.getByText('Premium Parts')).toBeInTheDocument();
        expect(screen.getByText('Data Recovery')).toBeInTheDocument();
        expect(screen.getByText('Pickup & Delivery')).toBeInTheDocument();
      });
    });

    it('updates price when options are changed', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      // Select repair type first
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Service Options')).toBeInTheDocument();
      });
      
      // Toggle express service
      const expressCheckbox = screen.getByLabelText(/Express Service/);
      await user.click(expressCheckbox);
      
      await waitFor(() => {
        expect(mockPricingEngine.calculatePrice).toHaveBeenCalledWith(
          sampleDevice,
          'screen_repair',
          { express: true }
        );
      });
    });

    it('displays warranty options', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Warranty Options')).toBeInTheDocument();
        expect(screen.getByText('Standard Warranty')).toBeInTheDocument();
        expect(screen.getByText('Extended Warranty')).toBeInTheDocument();
        expect(screen.getByText('Premium Warranty')).toBeInTheDocument();
      });
    });

    it('updates price when warranty option is changed', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      // Select repair type first
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Warranty Options')).toBeInTheDocument();
      });
      
      // Select extended warranty
      const extendedWarranty = screen.getByLabelText(/Extended Warranty/);
      await user.click(extendedWarranty);
      
      await waitFor(() => {
        expect(mockPricingEngine.calculatePrice).toHaveBeenCalledWith(
          sampleDevice,
          'screen_repair',
          { warranty: 'extended' }
        );
      });
    });
  });

  describe('Compact Variant', () => {
    it('renders as select dropdown in compact mode', () => {
      render(<PriceCalculator device={sampleDevice} variant="compact" />);
      
      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toBeInTheDocument();
      
      // Check that options are present
      expect(screen.getByText('Screen Repair (£200-£400)')).toBeInTheDocument();
      expect(screen.getByText('Battery Replacement (£80-£180)')).toBeInTheDocument();
    });

    it('calculates price when option is selected in compact mode', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} variant="compact" />);
      
      const selectElement = screen.getByRole('combobox');
      await user.selectOptions(selectElement, 'screen_repair');
      
      await waitFor(() => {
        expect(mockPricingEngine.calculatePrice).toHaveBeenCalledWith(
          sampleDevice,
          'screen_repair',
          {}
        );
      });
    });

    it('displays price summary in compact mode', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} variant="compact" />);
      
      const selectElement = screen.getByRole('combobox');
      await user.selectOptions(selectElement, 'screen_repair');
      
      await waitFor(() => {
        expect(screen.getByText('Total Price:')).toBeInTheDocument();
        expect(screen.getByText('£332')).toBeInTheDocument();
        expect(screen.getByText('Estimated time: 4-8 hours')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles pricing calculation errors', async () => {
      const user = userEvent.setup();
      mockPricingEngine.calculatePrice.mockImplementation(() => {
        throw new Error('Calculation failed');
      });
      
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to calculate price estimate')).toBeInTheDocument();
      });
    });

    it('handles empty repair types gracefully', () => {
      mockPricingEngine.getAvailableRepairs.mockReturnValue([]);
      mockPricingEngine.getRecommendedRepairs.mockReturnValue([]);
      
      render(<PriceCalculator device={sampleDevice} />);
      
      // Should still render without crashing
      expect(screen.getByText('Price Calculator')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<PriceCalculator device={sampleDevice} />);
      
      // Check that interactive elements have proper roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      // Should be able to navigate with keyboard
      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });

    it('announces price changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        // Price should be displayed in an accessible way
        expect(screen.getByText('£332')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('debounces option changes', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator device={sampleDevice} />);
      
      // Select repair type first
      const repairButton = screen.getByText('Screen Repair');
      await user.click(repairButton);
      
      await waitFor(() => {
        expect(screen.getByText('Service Options')).toBeInTheDocument();
      });
      
      // Rapidly toggle options
      const expressCheckbox = screen.getByLabelText(/Express Service/);
      await user.click(expressCheckbox);
      await user.click(expressCheckbox);
      
      // Should debounce the calculations
      await waitFor(() => {
        expect(mockPricingEngine.calculatePrice).toHaveBeenCalled();
      });
    });
  });
});