/**
 * MSW Server Setup for Testing
 * Mock Service Worker configuration for API testing
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API handlers for testing
export const handlers = [
  // Admin Dashboard API mocks
  rest.get('/api/admin/stats', (req, res, ctx) => {
    return res(
      ctx.json({
        totalBookings: 156,
        pendingRepairs: 23,
        completedToday: 8,
        revenue: 12450.00,
        averageRepairTime: '3.2 days',
        customerSatisfaction: 4.8,
      })
    );
  }),

  // Component Showcase API mocks
  rest.get('/api/components', (req, res, ctx) => {
    return res(
      ctx.json({
        components: [
          {
            id: 'button',
            name: 'Button',
            category: 'UI',
            description: 'Interactive button component with variants',
            variants: ['primary', 'secondary', 'ghost'],
            props: ['variant', 'size', 'disabled'],
          },
          {
            id: 'card',
            name: 'Card',
            category: 'Layout',
            description: 'Container component for content',
            variants: ['default', 'outlined', 'elevated'],
            props: ['variant', 'padding', 'shadow'],
          },
        ],
      })
    );
  }),

  // Mobile API mocks
  rest.get('/api/mobile/device-info', (req, res, ctx) => {
    return res(
      ctx.json({
        isMobile: true,
        screenSize: { width: 375, height: 812 },
        touchCapable: true,
        orientation: 'portrait',
      })
    );
  }),

  // PWA API mocks
  rest.get('/api/pwa/manifest', (req, res, ctx) => {
    return res(
      ctx.json({
        name: 'RevivaTech Admin',
        short_name: 'RevivaTech',
        start_url: '/admin',
        display: 'standalone',
        theme_color: '#007AFF',
        background_color: '#FFFFFF',
      })
    );
  }),

  // WebSocket mock for real-time features
  rest.get('/api/websocket/connect', (req, res, ctx) => {
    return res(
      ctx.json({
        connected: true,
        url: 'ws://localhost:3011/ws',
        protocols: ['v1'],
      })
    );
  }),

  // Offline/Cache API mocks
  rest.get('/api/offline/components', (req, res, ctx) => {
    return res(
      ctx.json({
        cached: true,
        lastUpdated: new Date().toISOString(),
        components: ['Button', 'Card', 'Input', 'Select'],
      })
    );
  }),

  // Error simulation for testing
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Not Found' }));
  }),

  // Touch interaction mocks
  rest.post('/api/mobile/touch-event', (req, res, ctx) => {
    return res(
      ctx.json({
        received: true,
        eventType: 'touch',
        timestamp: Date.now(),
      })
    );
  }),
];

// Create server instance
export const server = setupServer(...handlers);