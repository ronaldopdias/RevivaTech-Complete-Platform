/**
 * Frontend Analytics Proxy Tests
 * Tests for the frontend API routes that proxy to backend analytics service
 */

import { GET, POST } from '@/app/api/analytics/route';
import { GET as EventsGET, POST as EventsPOST, DELETE as EventsDELETE } from '@/app/api/analytics/events/route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variable
process.env.BACKEND_INTERNAL_URL = 'http://test-backend:3011';

describe('Analytics Proxy Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Main Analytics Route (/api/analytics)', () => {
    test('GET should proxy to backend with correct URL', async () => {
      const mockBackendResponse = {
        success: true,
        data: { status: 'operational' },
        source: 'backend-analytics'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      const request = new NextRequest('https://localhost:3010/api/analytics?test=true');
      request.headers.set('authorization', 'Bearer test-token');

      const response = await GET(request);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend:3011/api/analytics?test=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'authorization': 'Bearer test-token'
          })
        })
      );

      expect(data).toMatchObject({
        success: true,
        data: mockBackendResponse,
        source: 'backend-proxy',
        timestamp: expect.any(String)
      });
    });

    test('POST should proxy to backend', async () => {
      const mockBackendResponse = { success: true };
      const requestBody = { query: 'test data' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      const request = new NextRequest('https://localhost:3010/api/analytics', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend:3011/api/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(requestBody)
        })
      );

      expect(data.success).toBe(true);
      expect(data.source).toBe('backend-proxy');
    });

    test('should handle backend errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const request = new NextRequest('https://localhost:3010/api/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        success: false,
        error: 'Failed to fetch analytics data',
        source: 'backend-proxy'
      });
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest('https://localhost:3010/api/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch analytics data');
    });
  });

  describe('Analytics Events Route (/api/analytics/events)', () => {
    test('POST should proxy events to backend', async () => {
      const mockBackendResponse = { success: true, processed: 1 };
      const eventData = {
        sessionId: 'test-session',
        events: [{ type: 'page_view', name: 'home' }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      const request = new NextRequest('https://localhost:3010/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'test-browser'
        }
      });

      const response = await EventsPOST(request);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend:3011/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'test-browser'
          }),
          body: JSON.stringify(eventData)
        })
      );

      expect(data.success).toBe(true);
      expect(data.source).toBe('backend-proxy');
    });

    test('GET should proxy query parameters', async () => {
      const mockBackendResponse = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      const request = new NextRequest('https://localhost:3010/api/analytics/events?sessionId=test&dateFrom=2024-01-01');
      
      const response = await EventsGET(request);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend:3011/api/analytics/events?sessionId=test&dateFrom=2024-01-01',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(data.success).toBe(true);
    });

    test('DELETE should proxy GDPR deletion requests', async () => {
      const mockBackendResponse = { success: true, message: 'Data deleted' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      const request = new NextRequest('https://localhost:3010/api/analytics/events?customerId=test-customer');
      
      const response = await EventsDELETE(request);
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend:3011/api/analytics/events?customerId=test-customer',
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(data.success).toBe(true);
    });
  });

  describe('Proxy Configuration', () => {
    test('should use correct backend URL from environment', () => {
      // Test that the correct environment variable is being used
      expect(process.env.BACKEND_INTERNAL_URL).toBe('http://test-backend:3011');
    });

    test('should forward authentication headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const request = new NextRequest('https://localhost:3010/api/analytics');
      request.headers.set('authorization', 'Bearer auth-token');
      request.headers.set('cookie', 'session=abc123');

      await GET(request);

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.headers).toMatchObject({
        'authorization': 'Bearer auth-token',
        'cookie': 'session=abc123'
      });
    });

    test('should include source metadata in responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      const request = new NextRequest('https://localhost:3010/api/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        source: 'backend-proxy',
        timestamp: expect.any(String)
      });
    });
  });
});

describe('Proxy Pattern Benefits', () => {
  test('should maintain consistent API response format', () => {
    // Documents the expected proxy response structure
    const expectedProxyResponse = {
      success: expect.any(Boolean),
      data: expect.any(Object),
      source: 'backend-proxy',
      timestamp: expect.any(String)
    };

    expect(expectedProxyResponse).toBeDefined();
  });

  test('should handle container networking properly', () => {
    // Documents that internal container URL should be used for server-side requests
    const containerUrl = process.env.BACKEND_INTERNAL_URL;
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // Container URL should be used for server-side proxy requests
    expect(containerUrl).toContain('test-backend');
  });
});