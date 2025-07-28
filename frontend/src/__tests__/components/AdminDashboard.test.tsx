/**
 * AdminDashboard Component Tests
 * Comprehensive testing for mobile-optimized admin dashboard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Mock the mobile hook
const mockUseIsMobile = jest.fn();
jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

// Mock WebSocket hook
const mockUseWebSocket = jest.fn();
jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => mockUseWebSocket(),
}));

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('AdminDashboard Component', () => {
  const defaultMobileState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'desktop' as const,
  };

  const defaultWebSocketState = {
    connected: true,
    lastMessage: null,
    sendMessage: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(defaultMobileState);
    mockUseWebSocket.mockReturnValue(defaultWebSocketState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop Rendering', () => {
    it('renders desktop admin dashboard correctly', async () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Check for main dashboard elements
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/total bookings/i)).toBeInTheDocument();
      expect(screen.getByText(/pending repairs/i)).toBeInTheDocument();
      expect(screen.getByText(/completed today/i)).toBeInTheDocument();
    });

    it('displays stats cards with correct data', async () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('156')).toBeInTheDocument(); // Total bookings
        expect(screen.getByText('23')).toBeInTheDocument(); // Pending repairs
        expect(screen.getByText('8')).toBeInTheDocument(); // Completed today
      });
    });

    it('renders navigation tabs correctly', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /components/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /design system/i })).toBeInTheDocument();
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

    it('renders mobile admin dashboard when on mobile device', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Should render mobile-specific elements
      expect(screen.getByTestId('mobile-admin-dashboard')).toBeInTheDocument();
    });

    it('displays mobile-optimized stats grid', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      const statsGrid = screen.getByTestId('mobile-stats-grid');
      expect(statsGrid).toBeInTheDocument();
      expect(statsGrid).toHaveClass('grid-cols-2'); // 2x2 mobile grid
    });

    it('shows mobile bottom navigation', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      const bottomNav = screen.getByTestId('mobile-bottom-nav');
      expect(bottomNav).toBeInTheDocument();
      expect(bottomNav).toHaveClass('fixed', 'bottom-0');
    });

    it('handles touch interactions correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      const dashboardTab = screen.getByTestId('mobile-tab-dashboard');
      
      // Simulate touch interaction
      await user.click(dashboardTab);
      
      expect(dashboardTab).toHaveClass('bg-primary');
    });
  });

  describe('Tablet Rendering', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        screenSize: 'tablet' as const,
      });
    });

    it('renders mobile dashboard for tablet devices', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Tablets should use mobile layout
      expect(screen.getByTestId('mobile-admin-dashboard')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Click on Components tab
      const componentsTab = screen.getByRole('tab', { name: /components/i });
      await user.click(componentsTab);

      expect(componentsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('displays correct content for each tab', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Switch to Components tab
      await user.click(screen.getByRole('tab', { name: /components/i }));
      expect(screen.getByTestId('component-showcase')).toBeInTheDocument();

      // Switch to Design System tab
      await user.click(screen.getByRole('tab', { name: /design system/i }));
      expect(screen.getByTestId('design-system-showcase')).toBeInTheDocument();
    });
  });

  describe('Real-time Features', () => {
    it('displays connection status correctly', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });

    it('handles disconnection state', () => {
      mockUseWebSocket.mockReturnValue({
        ...defaultWebSocketState,
        connected: false,
      });

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
      expect(screen.getByTestId('connection-status')).toHaveClass('text-red-500');
    });

    it('updates stats in real-time', async () => {
      const mockSendMessage = jest.fn();
      mockUseWebSocket.mockReturnValue({
        ...defaultWebSocketState,
        sendMessage: mockSendMessage,
        lastMessage: {
          type: 'stats_update',
          data: { totalBookings: 157 },
        },
      });

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('157')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('renders without performance issues', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('uses proper loading states', async () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Should show loading spinner initially
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();

      // Should hide loading after data loads
      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();

      // Navigate with arrow keys
      await user.keyboard('{ArrowRight}');
      expect(screen.getAllByRole('tab')[1]).toHaveFocus();
    });

    it('has proper contrast ratios', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      const statsCards = screen.getAllByTestId(/stat-card/);
      statsCards.forEach(card => {
        // Check that cards have proper styling for contrast
        expect(card).toHaveClass('bg-white', 'text-gray-900');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state when API fails', async () => {
      // Mock fetch to return error
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });
    });

    it('provides retry functionality on error', async () => {
      const user = userEvent.setup();
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Mock successful retry
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ totalBookings: 156 }),
      });

      await user.click(screen.getByText(/retry/i));

      await waitFor(() => {
        expect(screen.getByText('156')).toBeInTheDocument();
      });
    });
  });
});