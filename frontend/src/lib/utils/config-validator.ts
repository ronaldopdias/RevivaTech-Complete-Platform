/**
 * Configuration Validation System
 * Validates environment variables and configuration at startup
 * Provides comprehensive validation reporting and error handling
 */

import { validateConfiguration, getDebugInfo, type ConfigValidationResult, type DebugInfo } from './api-config';

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validator: () => ValidationRuleResult;
}

export interface ValidationRuleResult {
  passed: boolean;
  message: string;
  details?: any;
}

export interface SystemValidationResult {
  isValid: boolean;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  errors: ValidationRuleResult[];
  warnings: ValidationRuleResult[];
  info: ValidationRuleResult[];
  timestamp: Date;
  environment: string;
  debugInfo?: DebugInfo;
}

export interface StartupHealthCheck {
  configurationValid: boolean;
  networkConnectivity: boolean;
  serviceDiscovery: boolean;
  environmentVariables: boolean;
  ready: boolean;
}

class ConfigurationValidator {
  private validationRules: ValidationRule[] = [];
  private isServerSide: boolean;

  constructor() {
    this.isServerSide = typeof window === 'undefined';
    this.initializeValidationRules();
  }

  /**
   * Initialize all validation rules based on environment
   */
  private initializeValidationRules(): void {
    // Universal validation rules
    this.addRule({
      name: 'Environment Detection',
      description: 'Verify environment detection is working correctly',
      severity: 'error',
      validator: () => this.validateEnvironmentDetection()
    });

    this.addRule({
      name: 'URL Resolution Configuration',
      description: 'Validate URL resolution configuration',
      severity: 'error', 
      validator: () => this.validateUrlResolution()
    });

    // Server-side specific rules
    if (this.isServerSide) {
      this.addRule({
        name: 'Backend Internal URL',
        description: 'Validate backend internal URL for container communication',
        severity: 'error',
        validator: () => this.validateBackendInternalUrl()
      });

      this.addRule({
        name: 'Database Configuration',
        description: 'Validate database connection configuration',
        severity: 'error',
        validator: () => this.validateDatabaseConfig()
      });

      this.addRule({
        name: 'Redis Configuration', 
        description: 'Validate Redis connection configuration',
        severity: 'warning',
        validator: () => this.validateRedisConfig()
      });
    }

    // Client-side specific rules
    if (!this.isServerSide) {
      this.addRule({
        name: 'Public API URL',
        description: 'Validate client-side API URL configuration',
        severity: 'warning',
        validator: () => this.validatePublicApiUrl()
      });

      this.addRule({
        name: 'WebSocket Configuration',
        description: 'Validate WebSocket URL configuration',
        severity: 'warning',
        validator: () => this.validateWebSocketConfig()
      });

      this.addRule({
        name: 'Domain Configuration',
        description: 'Validate domain configuration',
        severity: 'info',
        validator: () => this.validateDomainConfig()
      });
    }

    // Production-specific rules
    if (process.env.NODE_ENV === 'production') {
      this.addRule({
        name: 'Production Security',
        description: 'Validate production security requirements',
        severity: 'error',
        validator: () => this.validateProductionSecurity()
      });

      this.addRule({
        name: 'HTTPS Configuration',
        description: 'Validate HTTPS configuration in production',
        severity: 'error',
        validator: () => this.validateHttpsConfig()
      });
    }
  }

  /**
   * Add a validation rule
   */
  addRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Run all validation rules and return comprehensive results
   */
  validateAll(): SystemValidationResult {
    const results: ValidationRuleResult[] = [];
    const errors: ValidationRuleResult[] = [];
    const warnings: ValidationRuleResult[] = [];
    const info: ValidationRuleResult[] = [];

    for (const rule of this.validationRules) {
      try {
        const result = rule.validator();
        result.message = `[${rule.name}] ${result.message}`;
        results.push(result);

        if (!result.passed) {
          switch (rule.severity) {
            case 'error':
              errors.push(result);
              break;
            case 'warning':
              warnings.push(result);
              break;
            case 'info':
              info.push(result);
              break;
          }
        }
      } catch (error) {
        const failedResult: ValidationRuleResult = {
          passed: false,
          message: `[${rule.name}] Validation rule failed to execute: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        };
        
        results.push(failedResult);
        errors.push(failedResult);
      }
    }

    const passedRules = results.filter(r => r.passed).length;
    const isValid = errors.length === 0;

    return {
      isValid,
      totalRules: this.validationRules.length,
      passedRules,
      failedRules: results.length - passedRules,
      errors,
      warnings,
      info,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      debugInfo: getDebugInfo()
    };
  }

  /**
   * Quick health check for startup validation
   */
  getStartupHealthCheck(): StartupHealthCheck {
    const validation = this.validateAll();
    const urlValidation = validateConfiguration();

    return {
      configurationValid: validation.isValid,
      networkConnectivity: true, // Placeholder - would implement actual network check
      serviceDiscovery: true, // Placeholder - would implement service discovery check
      environmentVariables: urlValidation.isValid,
      ready: validation.isValid && urlValidation.isValid
    };
  }

  // Individual validation rule implementations

  private validateEnvironmentDetection(): ValidationRuleResult {
    const nodeEnv = process.env.NODE_ENV;
    
    if (!nodeEnv) {
      return {
        passed: false,
        message: 'NODE_ENV environment variable is not set'
      };
    }

    if (!['development', 'staging', 'production'].includes(nodeEnv)) {
      return {
        passed: false,
        message: `NODE_ENV has invalid value: ${nodeEnv}. Must be development, staging, or production`
      };
    }

    return {
      passed: true,
      message: `Environment correctly detected as: ${nodeEnv}`
    };
  }

  private validateUrlResolution(): ValidationRuleResult {
    try {
      const urlValidation = validateConfiguration();
      
      if (!urlValidation.isValid) {
        return {
          passed: false,
          message: `URL resolution configuration invalid: ${urlValidation.errors.join(', ')}`,
          details: urlValidation
        };
      }

      return {
        passed: true,
        message: 'URL resolution configuration valid'
      };
    } catch (error) {
      return {
        passed: false,
        message: `URL resolution validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private validateBackendInternalUrl(): ValidationRuleResult {
    const internalUrl = process.env.BACKEND_INTERNAL_URL;

    if (!internalUrl) {
      return {
        passed: false,
        message: 'BACKEND_INTERNAL_URL environment variable is required for server-side operations'
      };
    }

    try {
      const url = new URL(internalUrl);
      
      if (!url.hostname.includes('revivatech_')) {
        return {
          passed: false,
          message: `Backend internal URL should use container name. Got: ${url.hostname}`
        };
      }

      if (url.protocol !== 'http:') {
        return {
          passed: false,
          message: `Backend internal URL should use HTTP for internal communication. Got: ${url.protocol}`
        };
      }

      return {
        passed: true,
        message: `Backend internal URL valid: ${internalUrl}`
      };
    } catch (error) {
      return {
        passed: false,
        message: `Backend internal URL is not a valid URL: ${internalUrl}`
      };
    }
  }

  private validateDatabaseConfig(): ValidationRuleResult {
    const dbHost = process.env.DATABASE_INTERNAL_HOST || process.env.DB_HOST;
    
    if (!dbHost) {
      return {
        passed: false,
        message: 'Database host configuration missing (DATABASE_INTERNAL_HOST or DB_HOST required)'
      };
    }

    if (!dbHost.includes('revivatech_') && dbHost !== 'localhost') {
      return {
        passed: false,
        message: `Database host should use container name or localhost. Got: ${dbHost}`
      };
    }

    const dbPort = process.env.DATABASE_INTERNAL_PORT || process.env.DB_PORT;
    if (dbPort && isNaN(parseInt(dbPort))) {
      return {
        passed: false,
        message: `Database port must be a number. Got: ${dbPort}`
      };
    }

    return {
      passed: true,
      message: `Database configuration valid: ${dbHost}:${dbPort || '5432'}`
    };
  }

  private validateRedisConfig(): ValidationRuleResult {
    const redisUrl = process.env.REDIS_INTERNAL_URL || process.env.REDIS_URL;
    
    if (!redisUrl) {
      return {
        passed: false,
        message: 'Redis configuration missing (REDIS_INTERNAL_URL or REDIS_URL recommended)'
      };
    }

    try {
      const url = new URL(redisUrl);
      
      if (url.protocol !== 'redis:') {
        return {
          passed: false,
          message: `Redis URL should use redis: protocol. Got: ${url.protocol}`
        };
      }

      if (!url.hostname.includes('revivatech_') && url.hostname !== 'localhost') {
        return {
          passed: false,
          message: `Redis hostname should use container name or localhost. Got: ${url.hostname}`
        };
      }

      return {
        passed: true,
        message: `Redis configuration valid: ${redisUrl}`
      };
    } catch (error) {
      return {
        passed: false,
        message: `Redis URL is not valid: ${redisUrl}`
      };
    }
  }

  private validatePublicApiUrl(): ValidationRuleResult {
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!publicApiUrl) {
      return {
        passed: true, // OK to be empty for proxy routing
        message: 'Public API URL not configured - using proxy routing'
      };
    }

    try {
      const url = new URL(publicApiUrl);
      
      if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
        return {
          passed: false,
          message: 'Public API URL must use HTTPS in production'
        };
      }

      return {
        passed: true,
        message: `Public API URL valid: ${publicApiUrl}`
      };
    } catch (error) {
      return {
        passed: false,
        message: `Public API URL is not valid: ${publicApiUrl}`
      };
    }
  }

  private validateWebSocketConfig(): ValidationRuleResult {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    
    if (!wsUrl) {
      return {
        passed: true, // OK - will be generated dynamically
        message: 'WebSocket URL not configured - will be generated dynamically'
      };
    }

    try {
      const url = new URL(wsUrl);
      
      if (!['ws:', 'wss:'].includes(url.protocol)) {
        return {
          passed: false,
          message: `WebSocket URL must use ws: or wss: protocol. Got: ${url.protocol}`
        };
      }

      if (process.env.NODE_ENV === 'production' && url.protocol !== 'wss:') {
        return {
          passed: false,
          message: 'WebSocket URL must use wss: in production'
        };
      }

      return {
        passed: true,
        message: `WebSocket URL valid: ${wsUrl}`
      };
    } catch (error) {
      return {
        passed: false,
        message: `WebSocket URL is not valid: ${wsUrl}`
      };
    }
  }

  private validateDomainConfig(): ValidationRuleResult {
    const domain = process.env.NEXT_PUBLIC_DOMAIN;
    
    if (!domain) {
      return {
        passed: false,
        message: 'NEXT_PUBLIC_DOMAIN environment variable is required'
      };
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    if (!domainRegex.test(domain) && domain !== 'localhost') {
      return {
        passed: false,
        message: `Domain format is invalid: ${domain}`
      };
    }

    return {
      passed: true,
      message: `Domain configuration valid: ${domain}`
    };
  }

  private validateProductionSecurity(): ValidationRuleResult {
    const issues: string[] = [];

    // Check for development secrets in production
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('development')) {
      issues.push('JWT_SECRET appears to be a development secret');
    }

    // Check for default passwords
    if (process.env.DATABASE_PASSWORD && process.env.DATABASE_PASSWORD === 'revivatech_password') {
      issues.push('DATABASE_PASSWORD appears to be a default development password');
    }

    // Check for required production secrets
    const requiredSecrets = ['JWT_SECRET'];
    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        issues.push(`Required production secret ${secret} is missing`);
      }
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: `Production security issues: ${issues.join(', ')}`,
        details: { issues }
      };
    }

    return {
      passed: true,
      message: 'Production security configuration valid'
    };
  }

  private validateHttpsConfig(): ValidationRuleResult {
    if (process.env.NODE_ENV !== 'production') {
      return {
        passed: true,
        message: 'HTTPS validation skipped (not in production)'
      };
    }

    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

    const issues: string[] = [];

    if (publicApiUrl && !publicApiUrl.startsWith('https://')) {
      issues.push('NEXT_PUBLIC_API_URL must use HTTPS in production');
    }

    if (wsUrl && !wsUrl.startsWith('wss://')) {
      issues.push('NEXT_PUBLIC_WEBSOCKET_URL must use WSS in production');
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: `HTTPS configuration issues: ${issues.join(', ')}`,
        details: { issues }
      };
    }

    return {
      passed: true,
      message: 'HTTPS configuration valid for production'
    };
  }
}

// Singleton instance
const configValidator = new ConfigurationValidator();

export default configValidator;

// Convenience exports
export const validateSystemConfiguration = (): SystemValidationResult => 
  configValidator.validateAll();

export const getStartupHealthCheck = (): StartupHealthCheck => 
  configValidator.getStartupHealthCheck();

export const isSystemReady = (): boolean => 
  configValidator.getStartupHealthCheck().ready;

/**
 * Startup validation that can be called during application initialization
 */
export const performStartupValidation = (): Promise<SystemValidationResult> => {
  return new Promise((resolve) => {
    // Allow async validation in the future if needed
    setTimeout(() => {
      const result = validateSystemConfiguration();
      
      // Log validation results
      if (result.isValid) {
          totalRules: result.totalRules,
          passedRules: result.passedRules,
          warnings: result.warnings.length
        });
      } else {
        console.error('❌ Configuration validation failed', {
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        });
      }

      resolve(result);
    }, 0);
  });
};