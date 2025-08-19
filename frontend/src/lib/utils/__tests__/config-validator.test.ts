/**
 * Unit tests for Configuration Validation System
 * Tests configuration validation rules and startup health checks
 */

import {
  validateSystemConfiguration,
  getStartupHealthCheck,
  isSystemReady,
  performStartupValidation,
  type SystemValidationResult,
  type StartupHealthCheck
} from '../config-validator';

// Mock window for client-side tests
const mockWindow = () => {
  Object.defineProperty(global, 'window', {
    value: {
      location: {
        hostname: 'localhost',
        protocol: 'https:'
      }
    },
    writable: true,
    configurable: true
  });
};

// Mock server-side environment
const mockServerSide = () => {
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
    configurable: true
  });
};

// Mock environment variables
const mockEnv = (env: Record<string, string>) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  return () => {
    process.env = originalEnv;
  };
};

describe('Configuration Validation System', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Server-side Validation', () => {
    beforeEach(() => {
      mockServerSide();
    });

    it('should pass validation with complete server-side configuration', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011',
        DATABASE_INTERNAL_HOST: 'revivatech_database',
        REDIS_INTERNAL_URL: 'redis://revivatech_redis:6379'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.passedRules).toBeGreaterThan(0);

      restoreEnv();
    });

    it('should fail validation with missing backend internal URL', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development'
        // Missing BACKEND_INTERNAL_URL
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('BACKEND_INTERNAL_URL'))).toBe(true);

      restoreEnv();
    });

    it('should fail validation with invalid backend URL format', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        BACKEND_INTERNAL_URL: 'not-a-valid-url'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('not a valid URL'))).toBe(true);

      restoreEnv();
    });

    it('should warn about Redis configuration issues', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011',
        DATABASE_INTERNAL_HOST: 'revivatech_database'
        // Missing Redis configuration
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.warnings.some(w => w.message.includes('Redis configuration missing'))).toBe(true);

      restoreEnv();
    });

    it('should validate database configuration correctly', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011',
        DATABASE_INTERNAL_HOST: 'revivatech_database',
        DATABASE_INTERNAL_PORT: '5432'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.errors.filter(e => e.message.includes('Database')).length).toBe(0);

      restoreEnv();
    });
  });

  describe('Client-side Validation', () => {
    beforeEach(() => {
      mockWindow();
    });

    it('should pass validation with proper client-side configuration', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_API_URL: 'http://localhost:3011',
        NEXT_PUBLIC_WEBSOCKET_URL: 'ws://localhost:3011',
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      restoreEnv();
    });

    it('should accept empty public API URL for proxy routing', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'localhost'
        // No NEXT_PUBLIC_API_URL - should use proxy
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('proxy routing'))).toBe(true);

      restoreEnv();
    });

    it('should validate WebSocket URL format', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_WEBSOCKET_URL: 'http://localhost:3011', // Invalid protocol
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.warnings.some(w => w.message.includes('ws: or wss: protocol'))).toBe(true);

      restoreEnv();
    });

    it('should fail validation with invalid domain format', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'invalid..domain..name'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.info.some(i => i.message.includes('Domain format is invalid'))).toBe(true);

      restoreEnv();
    });
  });

  describe('Production Validation', () => {
    beforeEach(() => {
      mockWindow();
    });

    it('should require HTTPS in production', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://api.revivatech.co.uk', // HTTP in production
        NEXT_PUBLIC_DOMAIN: 'revivatech.co.uk'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('must use HTTPS in production'))).toBe(true);

      restoreEnv();
    });

    it('should require WSS for WebSocket in production', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.revivatech.co.uk',
        NEXT_PUBLIC_WEBSOCKET_URL: 'ws://api.revivatech.co.uk', // WS in production
        NEXT_PUBLIC_DOMAIN: 'revivatech.co.uk'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('must use wss: in production'))).toBe(true);

      restoreEnv();
    });

    it('should pass production validation with proper HTTPS configuration', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.revivatech.co.uk',
        NEXT_PUBLIC_WEBSOCKET_URL: 'wss://api.revivatech.co.uk',
        NEXT_PUBLIC_DOMAIN: 'revivatech.co.uk',
        JWT_SECRET: 'production-jwt-secret-key'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      restoreEnv();
    });

    it('should detect development secrets in production', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.revivatech.co.uk',
        NEXT_PUBLIC_DOMAIN: 'revivatech.co.uk',
        JWT_SECRET: 'your-super-secret-jwt-key-for-development' // Development secret
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('development secret'))).toBe(true);

      restoreEnv();
    });
  });

  describe('Environment Detection', () => {
    it('should validate NODE_ENV correctly', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'invalid-environment'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('NODE_ENV has invalid value'))).toBe(true);

      restoreEnv();
    });

    it('should require NODE_ENV to be set', () => {
      const restoreEnv = mockEnv({});
      delete process.env.NODE_ENV;

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('NODE_ENV environment variable is not set'))).toBe(true);

      restoreEnv();
    });
  });

  describe('Startup Health Check', () => {
    beforeEach(() => {
      mockWindow();
    });

    it('should return healthy status with valid configuration', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const healthCheck: StartupHealthCheck = getStartupHealthCheck();

      expect(healthCheck.ready).toBe(true);
      expect(healthCheck.configurationValid).toBe(true);
      expect(healthCheck.environmentVariables).toBe(true);

      restoreEnv();
    });

    it('should return unhealthy status with invalid configuration', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://api.example.com' // HTTP in production
      });

      const healthCheck: StartupHealthCheck = getStartupHealthCheck();

      expect(healthCheck.ready).toBe(false);
      expect(healthCheck.configurationValid).toBe(false);

      restoreEnv();
    });

    it('should provide system readiness through convenience function', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const ready = isSystemReady();
      expect(ready).toBe(true);

      restoreEnv();
    });
  });

  describe('Startup Validation', () => {
    beforeEach(() => {
      mockWindow();
      // Mock console methods
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should perform async startup validation successfully', async () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const result = await performStartupValidation();

      expect(result.isValid).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        '✅ Configuration validation passed',
        expect.objectContaining({
          totalRules: expect.any(Number),
          passedRules: expect.any(Number),
          warnings: expect.any(Number)
        })
      );

      restoreEnv();
    });

    it('should log errors for failed startup validation', async () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://api.example.com' // Invalid for production
      });

      const result = await performStartupValidation();

      expect(result.isValid).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '❌ Configuration validation failed',
        expect.objectContaining({
          errors: expect.any(Array),
          warnings: expect.any(Array)
        })
      );

      restoreEnv();
    });
  });

  describe('Validation Result Structure', () => {
    beforeEach(() => {
      mockWindow();
    });

    it('should return properly structured validation results', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('totalRules');
      expect(result).toHaveProperty('passedRules');
      expect(result).toHaveProperty('failedRules');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('info');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('debugInfo');

      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.info)).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);

      restoreEnv();
    });

    it('should include debug information in validation results', () => {
      const restoreEnv = mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_DOMAIN: 'localhost'
      });

      const result: SystemValidationResult = validateSystemConfiguration();

      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo).toHaveProperty('environment');
      expect(result.debugInfo).toHaveProperty('isServerSide');
      expect(result.debugInfo).toHaveProperty('config');

      restoreEnv();
    });
  });
});