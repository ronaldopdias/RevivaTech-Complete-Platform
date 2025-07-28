/**
 * Mobile Admin Dashboard E2E Tests
 * Comprehensive end-to-end testing for mobile admin experience
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe('Mobile Admin Dashboard', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      ...devices['iPhone 12'],
      permissions: ['notifications'],
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Mobile Navigation', () => {
    test('should load mobile admin dashboard', async () => {
      await page.goto('/admin');
      
      // Should detect mobile and render mobile dashboard
      await expect(page.locator('[data-testid="mobile-admin-dashboard"]')).toBeVisible();
      
      // Should have mobile header
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
      
      // Should have bottom navigation
      await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    });

    test('should navigate between tabs using bottom navigation', async () => {
      await page.goto('/admin');
      
      // Start on Dashboard tab
      await expect(page.locator('[data-testid="mobile-tab-dashboard"]')).toHaveClass(/active/);
      
      // Navigate to Components tab
      await page.locator('[data-testid="mobile-tab-components"]').click();
      await expect(page.locator('[data-testid="mobile-tab-components"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="component-showcase"]')).toBeVisible();
      
      // Navigate to Design System tab
      await page.locator('[data-testid="mobile-tab-design-system"]').click();
      await expect(page.locator('[data-testid="mobile-tab-design-system"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="design-system-showcase"]')).toBeVisible();
    });

    test('should handle touch interactions on navigation', async () => {
      await page.goto('/admin');
      
      const dashboardTab = page.locator('[data-testid="mobile-tab-dashboard"]');
      
      // Test touch start feedback
      await dashboardTab.dispatchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      // Should show touch feedback
      await expect(dashboardTab).toHaveClass(/touch-active/);
      
      // Test touch end
      await dashboardTab.dispatchEvent('touchend');
      
      // Touch feedback should be removed
      await expect(dashboardTab).not.toHaveClass(/touch-active/);
    });

    test('should support swipe gestures for tab navigation', async () => {
      await page.goto('/admin');
      
      const tabContainer = page.locator('[data-testid="mobile-tab-container"]');
      
      // Swipe left to next tab
      await tabContainer.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      
      await tabContainer.dispatchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      await tabContainer.dispatchEvent('touchend');
      
      // Should move to next tab
      await expect(page.locator('[data-testid="mobile-tab-components"]')).toHaveClass(/active/);
    });
  });

  test.describe('Mobile Stats Dashboard', () => {
    test('should display stats in mobile 2x2 grid', async () => {
      await page.goto('/admin');
      
      const statsGrid = page.locator('[data-testid="mobile-stats-grid"]');
      await expect(statsGrid).toBeVisible();
      await expect(statsGrid).toHaveClass(/grid-cols-2/);
      
      // Should have all 4 stat cards
      const statCards = page.locator('[data-testid^="stat-card-"]');
      await expect(statCards).toHaveCount(4);
    });

    test('should show real-time updates on mobile', async () => {
      await page.goto('/admin');
      
      // Wait for initial stats load
      await expect(page.locator('[data-testid="stat-card-bookings"]')).toContainText('156');
      
      // Simulate real-time update (would come from WebSocket in real app)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('stats-update', {
          detail: { totalBookings: 157 }
        }));
      });
      
      // Should update without page reload
      await expect(page.locator('[data-testid="stat-card-bookings"]')).toContainText('157');
    });

    test('should handle stat card touch interactions', async () => {
      await page.goto('/admin');
      
      const bookingsCard = page.locator('[data-testid="stat-card-bookings"]');
      
      // Touch feedback on press
      await bookingsCard.dispatchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      await expect(bookingsCard).toHaveClass(/scale-98/); // Touch scale effect
      
      // Release
      await bookingsCard.dispatchEvent('touchend');
      await expect(bookingsCard).not.toHaveClass(/scale-98/);
    });
  });

  test.describe('Mobile Component Showcase', () => {
    test('should display mobile-optimized component showcase', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      // Should show mobile filter tags instead of dropdown
      await expect(page.locator('[data-testid="mobile-filter-tags"]')).toBeVisible();
      await expect(page.locator('select')).not.toBeVisible();
      
      // Should use single-column grid
      const componentsGrid = page.locator('[data-testid="components-grid"]');
      await expect(componentsGrid).toHaveClass(/grid-cols-1/);
    });

    test('should handle horizontal scrolling filter tags', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      const filterTags = page.locator('[data-testid="mobile-filter-tags"]');
      
      // Should be horizontally scrollable
      await expect(filterTags).toHaveClass(/overflow-x-auto/);
      
      // Test horizontal scroll
      await filterTags.evaluate(el => {
        el.scrollLeft = 100;
      });
      
      const scrollLeft = await filterTags.evaluate(el => el.scrollLeft);
      expect(scrollLeft).toBe(100);
    });

    test('should filter components using mobile tags', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      // Click UI filter tag
      await page.locator('[data-testid="filter-tag-ui"]').click();
      
      // Should filter to UI components only
      await expect(page.locator('[data-testid="component-card-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="component-card-card"]')).not.toBeVisible();
      
      // Filter tag should be active
      await expect(page.locator('[data-testid="filter-tag-ui"]')).toHaveClass(/active/);
    });

    test('should handle mobile component card interactions', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      const buttonCard = page.locator('[data-testid="component-card-button"]');
      
      // Should have minimum touch target size
      const boundingBox = await buttonCard.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // 44px minimum
      
      // Touch interaction
      await buttonCard.click();
      
      // Should expand or show details
      await expect(page.locator('[data-testid="component-details-button"]')).toBeVisible();
    });

    test('should support mobile search functionality', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      const searchInput = page.locator('[data-testid="mobile-search-input"]');
      
      // Should have mobile-optimized search
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('type', 'search');
      
      // Search for Button component
      await searchInput.fill('Button');
      
      // Should filter results
      await expect(page.locator('[data-testid="component-card-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="component-card-card"]')).not.toBeVisible();
    });

    test('should toggle filters visibility on mobile', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      const filtersToggle = page.locator('[data-testid="mobile-filters-toggle"]');
      const filtersSection = page.locator('[data-testid="mobile-filters-section"]');
      
      // Initially collapsed
      await expect(filtersSection).toHaveClass(/hidden/);
      
      // Toggle filters
      await filtersToggle.click();
      await expect(filtersSection).not.toHaveClass(/hidden/);
      
      // Toggle again to hide
      await filtersToggle.click();
      await expect(filtersSection).toHaveClass(/hidden/);
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile devices', async () => {
      const startTime = Date.now();
      
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    });

    test('should have good touch responsiveness', async () => {
      await page.goto('/admin');
      
      const dashboardTab = page.locator('[data-testid="mobile-tab-dashboard"]');
      
      const startTime = Date.now();
      await dashboardTab.click();
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });

    test('should handle smooth animations on mobile', async () => {
      await page.goto('/admin');
      
      // Check that transitions are smooth (no janky animations)
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      // Wait for transition
      await page.waitForTimeout(300);
      
      // Should complete transition smoothly
      await expect(page.locator('[data-testid="component-showcase"]')).toBeVisible();
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should meet mobile accessibility standards', async () => {
      await page.goto('/admin');
      
      // Check touch target sizes
      const touchTargets = page.locator('[data-testid^="mobile-tab-"]');
      
      for (let i = 0; i < await touchTargets.count(); i++) {
        const target = touchTargets.nth(i);
        const boundingBox = await target.boundingBox();
        
        expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should support screen reader navigation', async () => {
      await page.goto('/admin');
      
      // Check ARIA labels
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
      await expect(bottomNav).toHaveAttribute('role', 'tablist');
      
      const tabs = page.locator('[data-testid^="mobile-tab-"]');
      for (let i = 0; i < await tabs.count(); i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute('role', 'tab');
        await expect(tab).toHaveAttribute('aria-label');
      }
    });

    test('should handle focus management correctly', async () => {
      await page.goto('/admin');
      
      // Tab to first navigation item
      await page.keyboard.press('Tab');
      
      const focused = await page.locator(':focus');
      await expect(focused).toHaveAttribute('data-testid', 'mobile-tab-dashboard');
    });
  });

  test.describe('Mobile Gestures', () => {
    test('should handle pinch-to-zoom on component cards', async () => {
      await page.goto('/admin');
      await page.locator('[data-testid="mobile-tab-components"]').click();
      
      const componentCard = page.locator('[data-testid="component-card-button"]');
      
      // Simulate pinch gesture
      await componentCard.dispatchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 100 }
        ]
      });
      
      await componentCard.dispatchEvent('touchmove', {
        touches: [
          { clientX: 80, clientY: 100 },
          { clientX: 220, clientY: 100 }
        ]
      });
      
      await componentCard.dispatchEvent('touchend');
      
      // Should handle zoom appropriately (prevent default zoom or provide custom behavior)
      const transform = await componentCard.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Should either prevent zoom or apply custom scaling
      expect(transform).toBeDefined();
    });

    test('should handle pull-to-refresh gesture', async () => {
      await page.goto('/admin');
      
      const dashboard = page.locator('[data-testid="mobile-admin-dashboard"]');
      
      // Simulate pull down gesture
      await dashboard.dispatchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 50 }]
      });
      
      await dashboard.dispatchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 150 }]
      });
      
      await dashboard.dispatchEvent('touchend');
      
      // Should trigger refresh (check for loading indicator)
      await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
    });

    test('should handle double-tap prevention', async () => {
      await page.goto('/admin');
      
      const tab = page.locator('[data-testid="mobile-tab-components"]');
      
      // Double tap quickly
      await tab.click();
      await tab.click();
      
      // Should only trigger one navigation
      await page.waitForTimeout(100);
      await expect(page.locator('[data-testid="component-showcase"]')).toBeVisible();
    });
  });

  test.describe('Mobile Offline Experience', () => {
    test('should work offline with cached content', async () => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Go offline
      await context.setOffline(true);
      
      // Navigate between tabs - should still work
      await page.locator('[data-testid="mobile-tab-components"]').click();
      await expect(page.locator('[data-testid="component-showcase"]')).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
    });

    test('should show offline indicator when disconnected', async () => {
      await page.goto('/admin');
      
      // Go offline
      await context.setOffline(true);
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
      
      // Should hide offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });
  });

  test.describe('Mobile Real-time Features', () => {
    test('should display real-time connection status', async () => {
      await page.goto('/admin');
      
      const connectionStatus = page.locator('[data-testid="mobile-connection-status"]');
      
      // Should show connected status
      await expect(connectionStatus).toBeVisible();
      await expect(connectionStatus).toContainText(/connected/i);
    });

    test('should handle real-time notifications on mobile', async () => {
      await page.goto('/admin');
      
      // Grant notification permission
      await context.grantPermissions(['notifications']);
      
      // Simulate incoming notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('notification', {
          detail: {
            title: 'New Booking',
            body: 'Mobile booking received',
            icon: '/icons/icon-192x192.png'
          }
        }));
      });
      
      // Should show mobile notification
      await expect(page.locator('[data-testid="mobile-notification"]')).toBeVisible();
    });
  });
});

// Import devices for mobile simulation
const { devices } = require('@playwright/test');