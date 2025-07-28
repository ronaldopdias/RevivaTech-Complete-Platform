/**
 * ComponentShowcase Component Tests
 * Comprehensive testing for mobile-optimized component showcase
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentShowcase } from '@/components/admin/ComponentShowcase';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Mock the mobile hook
const mockUseIsMobile = jest.fn();
jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ComponentShowcase Component', () => {
  const defaultMobileState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'desktop' as const,
  };

  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(defaultMobileState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop Rendering', () => {
    it('renders component showcase correctly', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      expect(screen.getByText(/component showcase/i)).toBeInTheDocument();
      expect(screen.getByTestId('component-showcase')).toBeInTheDocument();
    });

    it('displays components grid with correct layout', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        const grid = screen.getByTestId('components-grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('grid-cols-3'); // Desktop 3-column grid
      });
    });

    it('shows filter dropdown for categories', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox', { name: /filter by category/i })).toBeInTheDocument();
    });

    it('displays search input', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      expect(screen.getByRole('searchbox', { name: /search components/i })).toBeInTheDocument();
    });
  });

  describe('Mobile Rendering', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenSize: 'mobile' as const,
      });
    });

    it('renders mobile-optimized layout', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const showcase = screen.getByTestId('component-showcase');
      expect(showcase).toHaveClass('mobile-optimized');
    });

    it('displays mobile filter tags instead of dropdown', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      expect(screen.getByTestId('mobile-filter-tags')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('uses single column grid on mobile', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        const grid = screen.getByTestId('components-grid');
        expect(grid).toHaveClass('grid-cols-1'); // Mobile single column
      });
    });

    it('shows collapsible filters section', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const filtersToggle = screen.getByTestId('mobile-filters-toggle');
      expect(filtersToggle).toBeInTheDocument();
      expect(screen.getByText(/show filters/i)).toBeInTheDocument();
    });

    it('defaults to list view on mobile', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const listViewButton = screen.getByTestId('view-list');
      expect(listViewButton).toHaveClass('active');
    });
  });

  describe('Component Cards', () => {
    it('displays component cards with correct information', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Button')).toBeInTheDocument();
        expect(screen.getByText('Card')).toBeInTheDocument();
        expect(screen.getByText('Interactive button component with variants')).toBeInTheDocument();
      });
    });

    it('shows component variants and props', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for Button component variants
        expect(screen.getByText('primary')).toBeInTheDocument();
        expect(screen.getByText('secondary')).toBeInTheDocument();
        expect(screen.getByText('ghost')).toBeInTheDocument();
      });
    });

    it('handles card interactions correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        const buttonCard = screen.getByTestId('component-card-button');
        expect(buttonCard).toBeInTheDocument();
      });

      const buttonCard = screen.getByTestId('component-card-button');
      await user.click(buttonCard);

      // Should expand card or show details
      expect(screen.getByTestId('component-details-button')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters components based on search input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Button');

      await waitFor(() => {
        expect(screen.getByText('Button')).toBeInTheDocument();
        expect(screen.queryByText('Card')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'NonexistentComponent');

      await waitFor(() => {
        expect(screen.getByText(/no components found/i)).toBeInTheDocument();
      });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Button');

      const clearButton = screen.getByTestId('search-clear');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      await waitFor(() => {
        expect(screen.getByText('Button')).toBeInTheDocument();
        expect(screen.getByText('Card')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('filters components by category', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      // On desktop - use dropdown
      if (!mockUseIsMobile().isMobile) {
        const categoryFilter = screen.getByRole('combobox');
        await user.selectOptions(categoryFilter, 'UI');

        await waitFor(() => {
          expect(screen.getByText('Button')).toBeInTheDocument();
          expect(screen.queryByText('Card')).not.toBeInTheDocument(); // Card is Layout category
        });
      }
    });

    it('handles mobile filter tags correctly', async () => {
      mockUseIsMobile.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenSize: 'mobile' as const,
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const uiTag = screen.getByTestId('filter-tag-ui');
      await user.click(uiTag);

      expect(uiTag).toHaveClass('active');
      await waitFor(() => {
        expect(screen.getByText('Button')).toBeInTheDocument();
      });
    });

    it('allows multiple filter combinations', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      // Search + Filter combination
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Button');

      if (!mockUseIsMobile().isMobile) {
        const categoryFilter = screen.getByRole('combobox');
        await user.selectOptions(categoryFilter, 'UI');
      }

      await waitFor(() => {
        expect(screen.getByText('Button')).toBeInTheDocument();
        expect(screen.queryByText('Card')).not.toBeInTheDocument();
      });
    });
  });

  describe('View Toggle', () => {
    it('switches between grid and list views', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const listViewButton = screen.getByTestId('view-list');
      const gridViewButton = screen.getByTestId('view-grid');

      // Start in grid view
      expect(gridViewButton).toHaveClass('active');

      // Switch to list view
      await user.click(listViewButton);
      expect(listViewButton).toHaveClass('active');
      expect(gridViewButton).not.toHaveClass('active');

      // Check layout change
      const componentsContainer = screen.getByTestId('components-container');
      expect(componentsContainer).toHaveClass('list-view');
    });

    it('maintains view preference across re-renders', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      // Switch to list view
      await user.click(screen.getByTestId('view-list'));

      // Re-render component
      rerender(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      // Should maintain list view
      expect(screen.getByTestId('view-list')).toHaveClass('active');
    });
  });

  describe('Mobile Touch Interactions', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenSize: 'mobile' as const,
      });
    });

    it('handles touch events on component cards', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        const buttonCard = screen.getByTestId('component-card-button');
        
        // Simulate touch start
        fireEvent.touchStart(buttonCard, {
          touches: [{ clientX: 100, clientY: 100 }]
        });

        // Should add touch feedback class
        expect(buttonCard).toHaveClass('touch-active');

        // Simulate touch end
        fireEvent.touchEnd(buttonCard);
        
        // Should remove touch feedback class
        expect(buttonCard).not.toHaveClass('touch-active');
      });
    });

    it('supports horizontal scrolling for filter tags', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const filterTags = screen.getByTestId('mobile-filter-tags');
      
      // Should have horizontal scroll styling
      expect(filterTags).toHaveClass('overflow-x-auto');
      expect(filterTags).toHaveClass('flex');
    });

    it('handles swipe gestures for filters toggle', async () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const filtersSection = screen.getByTestId('mobile-filters-section');
      
      // Initially hidden
      expect(filtersSection).toHaveClass('hidden');

      // Simulate swipe down to show filters
      fireEvent.touchStart(filtersSection, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(filtersSection, {
        touches: [{ clientX: 100, clientY: 200 }]
      });
      
      fireEvent.touchEnd(filtersSection);

      // Should show filters
      await waitFor(() => {
        expect(filtersSection).not.toHaveClass('hidden');
      });
    });
  });

  describe('Performance', () => {
    it('virtualizes large component lists', async () => {
      // Mock a large component list
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          components: Array.from({ length: 100 }, (_, i) => ({
            id: `component-${i}`,
            name: `Component ${i}`,
            category: 'UI',
            description: `Test component ${i}`,
            variants: ['default'],
            props: ['variant'],
          })),
        }),
      });

      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not render all 100 components at once
        const visibleCards = screen.getAllByTestId(/component-card-/);
        expect(visibleCards.length).toBeLessThan(50);
      });
    });

    it('debounces search input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      
      // Type rapidly
      await user.type(searchInput, 'But', { delay: 50 });
      
      // Should not trigger search immediately
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('search=But')
      );

      // Wait for debounce
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=But')
        );
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /component showcase/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      searchInput.focus();

      // Navigate to first component card
      await user.keyboard('{Tab}');
      
      await waitFor(() => {
        const firstCard = screen.getByTestId('component-card-button');
        expect(firstCard).toHaveFocus();
      });
    });

    it('announces filter changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      if (!mockUseIsMobile().isMobile) {
        const categoryFilter = screen.getByRole('combobox');
        await user.selectOptions(categoryFilter, 'UI');

        // Should have aria-live region for announcements
        expect(screen.getByTestId('filter-announcements')).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('displays error state when component loading fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Failed to load components'));

      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading components/i)).toBeInTheDocument();
      });
    });

    it('provides retry functionality', async () => {
      const user = userEvent.setup();
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ComponentShowcase />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Mock successful retry
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ components: [] }),
      });

      await user.click(screen.getByText(/retry/i));

      await waitFor(() => {
        expect(screen.getByTestId('component-showcase')).toBeInTheDocument();
      });
    });
  });
});