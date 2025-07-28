import { ApiService } from '../../api/apiService';

// Mock fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  let apiService: ApiService;
  const mockConfig = {
    baseUrl: 'https://api.test.com',
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = new ApiService(mockConfig);
  });

  describe('request method', () => {
    it('makes successful GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers()
      });

      const result = await apiService.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('adds authentication token when available', async () => {
      apiService.setAuthToken('test-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers()
      });

      await apiService.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('handles request timeout', async () => {
      const apiServiceWithShortTimeout = new ApiService({
        ...mockConfig,
        timeout: 100
      });

      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(apiServiceWithShortTimeout.get('/test')).rejects.toThrow('Request timeout');
    });

    it('retries failed requests', async () => {
      // First two attempts fail, third succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers()
        });

      const result = await apiService.get('/test');

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('fails after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('handles 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
        headers: new Headers()
      });

      await expect(apiService.get('/test')).rejects.toThrow('Resource not found');
    });

    it('handles 401 unauthorized errors', async () => {
      const onUnauthorized = jest.fn();
      apiService.onUnauthorized = onUnauthorized;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Headers()
      });

      await expect(apiService.get('/test')).rejects.toThrow('Unauthorized');
      expect(onUnauthorized).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    it('makes POST request with body', async () => {
      const requestBody = { name: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1, ...requestBody }),
        headers: new Headers()
      });

      const result = await apiService.post('/test', requestBody);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody)
        })
      );
      expect(result).toEqual({ id: 1, ...requestBody });
    });

    it('makes PUT request', async () => {
      const requestBody = { name: 'updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => requestBody,
        headers: new Headers()
      });

      await apiService.put('/test/1', requestBody);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody)
        })
      );
    });

    it('makes PATCH request', async () => {
      const requestBody = { name: 'patched' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => requestBody,
        headers: new Headers()
      });

      await apiService.patch('/test/1', requestBody);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        })
      );
    });

    it('makes DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
        headers: new Headers()
      });

      await apiService.delete('/test/1');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('interceptors', () => {
    it('applies request interceptor', async () => {
      const requestInterceptor = jest.fn((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'test'
        }
      }));

      apiService.addRequestInterceptor(requestInterceptor);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers()
      });

      await apiService.get('/test');

      expect(requestInterceptor).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test'
          })
        })
      );
    });

    it('applies response interceptor', async () => {
      const responseInterceptor = jest.fn((response) => ({
        ...response,
        modified: true
      }));

      apiService.addResponseInterceptor(responseInterceptor);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers()
      });

      const result = await apiService.get('/test');

      expect(responseInterceptor).toHaveBeenCalled();
      expect(result).toHaveProperty('modified', true);
    });

    it('applies error interceptor', async () => {
      const errorInterceptor = jest.fn((error) => {
        throw new Error(`Intercepted: ${error.message}`);
      });

      apiService.addErrorInterceptor(errorInterceptor);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Original error'));

      await expect(apiService.get('/test')).rejects.toThrow('Intercepted: Original error');
      expect(errorInterceptor).toHaveBeenCalled();
    });
  });

  describe('circuit breaker', () => {
    it('opens circuit after consecutive failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Trigger multiple failures
      for (let i = 0; i < 5; i++) {
        try {
          await apiService.get('/test');
        } catch (e) {
          // Expected to fail
        }
      }

      // Circuit should be open, request should fail immediately
      await expect(apiService.get('/test')).rejects.toThrow('Circuit breaker is open');
      
      // Fetch should not be called when circuit is open
      const callCountBefore = (fetch as jest.Mock).mock.calls.length;
      try {
        await apiService.get('/test');
      } catch (e) {
        // Expected to fail
      }
      expect((fetch as jest.Mock).mock.calls.length).toBe(callCountBefore);
    });

    it('half-opens circuit after timeout', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await apiService.get('/test');
        } catch (e) {
          // Expected to fail
        }
      }

      // Fast forward past timeout
      jest.advanceTimersByTime(30000);

      // Next request should attempt (half-open state)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
        headers: new Headers()
      });

      const result = await apiService.get('/test');
      expect(result).toEqual({ data: 'success' });

      jest.useRealTimers();
    });
  });

  describe('health check', () => {
    it('returns healthy status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
        headers: new Headers()
      });

      const health = await apiService.checkHealth();

      expect(health).toEqual({
        status: 'healthy',
        endpoint: 'https://api.test.com',
        timestamp: expect.any(String)
      });
    });

    it('returns unhealthy status on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const health = await apiService.checkHealth();

      expect(health).toEqual({
        status: 'unhealthy',
        endpoint: 'https://api.test.com',
        timestamp: expect.any(String),
        error: 'Connection failed'
      });
    });
  });
});