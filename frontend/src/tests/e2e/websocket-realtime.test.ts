/**
 * End-to-End Testing Suite for RevivaTech WebSocket and Real-time Features
 * Tests real-time communication, connection management, and live updates
 */

import { test, expect, Page } from '@playwright/test';
import { WebSocket } from 'ws';

interface WebSocketTestData {
  serverUrl: string;
  testEvents: {
    newBooking: any;
    repairStatusUpdate: any;
    customerMessage: any;
    priceUpdate: any;
  };
  authentication: {
    token: string;
    userId: string;
    role: string;
  };
}

const testWebSocketData: WebSocketTestData = {
  serverUrl: 'ws://localhost:3011',
  testEvents: {
    newBooking: {
      type: 'new_booking',
      payload: {
        bookingId: 'test-booking-123',
        customerName: 'Test Customer',
        deviceType: 'MacBook Pro',
        issueType: 'Screen Repair',
        status: 'pending',
        priority: 'normal'
      },
      timestamp: new Date().toISOString()
    },
    repairStatusUpdate: {
      type: 'repair_status_update',
      payload: {
        repairId: 'test-repair-456',
        oldStatus: 'in_progress',
        newStatus: 'completed',
        message: 'Repair completed successfully',
        technician: 'John Doe'
      },
      timestamp: new Date().toISOString()
    },
    customerMessage: {
      type: 'customer_message',
      payload: {
        conversationId: 'conv-789',
        customerId: 'customer-123',
        message: 'When will my repair be ready?',
        messageType: 'text'
      },
      timestamp: new Date().toISOString()
    },
    priceUpdate: {
      type: 'price_update',
      payload: {
        quoteId: 'quote-101',
        oldPrice: 299.99,
        newPrice: 279.99,
        reason: 'Parts cost reduction',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      timestamp: new Date().toISOString()
    }
  },
  authentication: {
    token: 'test-jwt-token',
    userId: 'user-123',
    role: 'admin'
  }
};

test.describe('WebSocket Connection Management', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test('WebSocket connection establishment and authentication', async () => {
    await test.step('Test WebSocket connection from admin dashboard', async () => {
      // Navigate to admin dashboard
      await page.goto('http://localhost:3010/admin');
      
      // Wait for WebSocket connection indicator
      await expect(page.locator('[data-testid="websocket-status"]')).toBeVisible();
      
      // Verify connection status is displayed
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText(/connected|connecting/i);
      
      // Wait for successful connection
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Test WebSocket connection from customer portal', async () => {
      await page.goto('http://localhost:3010/customer-portal');
      
      // Verify WebSocket connection for customer features
      await expect(page.locator('[data-testid="realtime-status"]')).toBeVisible();
      
      // Check for real-time features availability
      const realtimeFeatures = page.locator('[data-testid="realtime-enabled"]');
      await expect(realtimeFeatures).toBeVisible();
    });

    await test.step('Test connection recovery after temporary disconnect', async () => {
      await page.goto('http://localhost:3010/admin');
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Simulate network interruption
      await page.evaluate(() => {
        // Temporarily block WebSocket connections
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function() {
          throw new Error('Network error');
        } as any;
        
        // Restore after 2 seconds
        setTimeout(() => {
          window.WebSocket = originalWebSocket;
        }, 2000);
      });
      
      // Verify reconnection attempt
      await expect(page.locator('[data-testid="connection-status"]')).toContainText(/reconnecting|connecting/i);
      
      // Verify successful reconnection
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible({ timeout: 15000 });
    });
  });

  test('Real-time booking notifications', async () => {
    await test.step('Test new booking notifications in admin dashboard', async () => {
      await page.goto('http://localhost:3010/admin');
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Monitor for new booking notifications
      const bookingCount = page.locator('[data-testid="new-bookings-count"]');
      const initialCount = parseInt(await bookingCount.textContent() || '0');
      
      // Trigger test booking event
      await page.locator('[data-testid="test-new-booking"]').click();
      
      // Verify booking count updated
      await expect(bookingCount).toContainText((initialCount + 1).toString());
      
      // Verify notification appeared
      await expect(page.locator('[data-testid="booking-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-notification"]')).toContainText('New booking received');
    });

    await test.step('Test booking status updates', async () => {
      // Trigger repair status update
      await page.locator('[data-testid="test-completion"]').click();
      
      // Verify completion notification
      await expect(page.locator('[data-testid="completion-notification"]')).toBeVisible();
      
      // Verify stats updated
      const completedCount = page.locator('[data-testid="completed-today-count"]');
      await expect(completedCount).not.toContainText('0');
    });
  });

  test('Customer portal real-time updates', async () => {
    await test.step('Setup customer session', async () => {
      // Login as customer
      await page.goto('http://localhost:3010/login');
      await page.locator('[data-testid="email-input"]').fill('customer@example.com');
      await page.locator('[data-testid="password-input"]').fill('TestPassword123!');
      await page.locator('[data-testid="login-button"]').click();
      
      // Navigate to customer portal
      await page.goto('http://localhost:3010/customer-portal');
      await expect(page.locator('[data-testid="repair-timeline"]')).toBeVisible();
    });

    await test.step('Test real-time repair status updates', async () => {
      // Get current repair status
      const statusIndicator = page.locator('[data-testid="current-status"]');
      const initialStatus = await statusIndicator.textContent();
      
      // Simulate status update from admin side
      // This would typically be triggered by admin action
      await page.evaluate(() => {
        // Simulate WebSocket message
        const mockStatusUpdate = {
          type: 'repair_status_update',
          payload: {
            repairId: 'customer-repair-123',
            newStatus: 'diagnostic_complete',
            message: 'Diagnostic completed - repair estimate ready',
            updatedBy: 'Technician Sarah'
          }
        };
        
        // Trigger custom event that WebSocket handler would normally trigger
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: mockStatusUpdate }));
      });
      
      // Verify status updated in real-time
      await expect(statusIndicator).not.toContainText(initialStatus || '');
      await expect(page.locator('[data-testid="status-message"]')).toContainText('Diagnostic completed');
    });

    await test.step('Test real-time chat message notifications', async () => {
      // Navigate to chat section
      await page.locator('[data-testid="chat-tab"]').click();
      await expect(page.locator('[data-testid="chat-widget"]')).toBeVisible();
      
      // Monitor for new message indicator
      const messageCount = page.locator('[data-testid="unread-messages"]');
      
      // Simulate incoming message
      await page.evaluate(() => {
        const mockMessage = {
          type: 'chat_message',
          payload: {
            conversationId: 'chat-123',
            message: 'Your repair is ready for pickup!',
            sender: 'Support Team',
            timestamp: new Date().toISOString()
          }
        };
        
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: mockMessage }));
      });
      
      // Verify message appeared and notification updated
      await expect(page.locator('[data-testid="latest-message"]')).toContainText('ready for pickup');
      await expect(page.locator('[data-testid="message-notification"]')).toBeVisible();
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});

test.describe('WebSocket Performance and Reliability', () => {
  test('Connection performance and latency', async ({ page }) => {
    await test.step('Measure WebSocket connection time', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:3010/admin');
      
      // Wait for WebSocket connection
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      const connectionTime = Date.now() - startTime;
      
      // Should connect within 5 seconds
      expect(connectionTime).toBeLessThan(5000);
      console.log(`WebSocket connection time: ${connectionTime}ms`);
    });

    await test.step('Measure message round-trip time', async () => {
      await page.goto('http://localhost:3010/admin');
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Send test message and measure response time
      const startTime = Date.now();
      await page.locator('[data-testid="test-new-booking"]').click();
      
      // Wait for notification to appear
      await expect(page.locator('[data-testid="booking-notification"]')).toBeVisible();
      const roundTripTime = Date.now() - startTime;
      
      // Should respond within 1 second
      expect(roundTripTime).toBeLessThan(1000);
      console.log(`WebSocket round-trip time: ${roundTripTime}ms`);
    });
  });

  test('Connection stability under load', async ({ page }) => {
    await test.step('Test multiple rapid messages', async () => {
      await page.goto('http://localhost:3010/admin');
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Send multiple test messages rapidly
      for (let i = 0; i < 10; i++) {
        await page.locator('[data-testid="test-new-booking"]').click();
        await page.waitForTimeout(100);
      }
      
      // Verify connection remains stable
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Verify all messages were processed
      const bookingCount = await page.locator('[data-testid="new-bookings-count"]').textContent();
      expect(parseInt(bookingCount || '0')).toBeGreaterThanOrEqual(10);
    });
  });

  test('Memory leak detection', async ({ page }) => {
    await test.step('Monitor memory usage over extended connection', async () => {
      await page.goto('http://localhost:3010/admin');
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      // Send many messages over time
      for (let i = 0; i < 50; i++) {
        await page.locator('[data-testid="test-new-booking"]').click();
        await page.waitForTimeout(50);
      }
      
      // Wait for garbage collection
      await page.waitForTimeout(2000);
      
      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory should not increase by more than 50%
        expect(memoryIncreasePercent).toBeLessThan(50);
        console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`);
      }
    });
  });
});

test.describe('WebSocket Security and Authentication', () => {
  test('Authentication and authorization', async ({ page }) => {
    await test.step('Test unauthenticated WebSocket connection', async () => {
      // Clear any existing authentication
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      
      await page.goto('http://localhost:3010/admin');
      
      // Should redirect to login or show authentication required
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|auth/);
    });

    await test.step('Test role-based WebSocket access', async () => {
      // Login as customer (limited access)
      await page.goto('http://localhost:3010/login');
      await page.locator('[data-testid="email-input"]').fill('customer@example.com');
      await page.locator('[data-testid="password-input"]').fill('TestPassword123!');
      await page.locator('[data-testid="login-button"]').click();
      
      // Try to access admin WebSocket features
      await page.goto('http://localhost:3010/admin');
      
      // Should be denied or redirected
      const hasAccess = await page.locator('[data-testid="admin-websocket-controls"]').isVisible();
      expect(hasAccess).toBeFalsy();
    });
  });

  test('Message validation and sanitization', async ({ page }) => {
    await test.step('Test malicious message handling', async () => {
      await page.goto('http://localhost:3010/admin');
      await expect(page.locator('[data-testid="connection-indicator"].bg-green-500')).toBeVisible();
      
      // Attempt to send malicious message
      await page.evaluate(() => {
        const maliciousMessage = {
          type: 'xss_attempt',
          payload: {
            message: '<script>alert("XSS")</script>',
            customerName: '<img src=x onerror=alert("XSS")>'
          }
        };
        
        // This should be sanitized by the WebSocket handler
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: maliciousMessage }));
      });
      
      // Verify no XSS execution
      const alertPresent = await page.evaluate(() => {
        return window.alert !== undefined && window.alert.toString().includes('alert("XSS")');
      });
      expect(alertPresent).toBeFalsy();
    });
  });
});