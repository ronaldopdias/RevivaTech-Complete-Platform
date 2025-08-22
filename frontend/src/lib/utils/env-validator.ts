/**
 * Environment Variable Validation System
 * Ensures proper configuration for container networking and API connectivity
 */

interface EnvironmentConfig {
  // External URLs (client-side)
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_WS_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  
  // Internal URLs (server-side)
  BACKEND_INTERNAL_HOST?: string;
  BACKEND_INTERNAL_PORT?: string;
  BACKEND_INTERNAL_URL?: string;
  
  // Database Configuration
  DATABASE_INTERNAL_HOST?: string;
  DATABASE_INTERNAL_PORT?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  
  // Redis Configuration
  REDIS_INTERNAL_HOST?: string;
  REDIS_INTERNAL_PORT?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  
  // Application Configuration
  NODE_ENV?: string;
  PORT?: string;
  
  // Authentication
  BETTER_AUTH_SECRET?: string;
  JWT_SECRET?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
}

/**
 * Validate environment configuration for container networking
 */
export function validateEnvironment(): ValidationResult {
  const config: EnvironmentConfig = {
    // Client-side (Next.js public variables)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // Server-side internal networking
    BACKEND_INTERNAL_HOST: process.env.BACKEND_INTERNAL_HOST,
    BACKEND_INTERNAL_PORT: process.env.BACKEND_INTERNAL_PORT,
    BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL,
    
    // Database configuration
    DATABASE_INTERNAL_HOST: process.env.DATABASE_INTERNAL_HOST,
    DATABASE_INTERNAL_PORT: process.env.DATABASE_INTERNAL_PORT,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    
    // Redis configuration
    REDIS_INTERNAL_HOST: process.env.REDIS_INTERNAL_HOST,
    REDIS_INTERNAL_PORT: process.env.REDIS_INTERNAL_PORT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    
    // Application
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    
    // Authentication
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validations
  if (!config.NODE_ENV) {
    errors.push('NODE_ENV is required');
  }

  // Backend connectivity validation
  const hasBackendConfig = !!(
    config.BACKEND_INTERNAL_URL || 
    config.BACKEND_INTERNAL_HOST ||
    config.NEXT_PUBLIC_API_URL
  );

  if (!hasBackendConfig) {
    errors.push('No backend configuration found. Set BACKEND_INTERNAL_URL, BACKEND_INTERNAL_HOST, or NEXT_PUBLIC_API_URL');
  }

  // Database connectivity validation
  const hasDatabaseConfig = !!(
    config.DATABASE_INTERNAL_HOST || 
    config.DB_HOST
  );

  if (!hasDatabaseConfig) {
    warnings.push('No database configuration found. Set DATABASE_INTERNAL_HOST or DB_HOST for database connectivity');
  }

  // Redis connectivity validation
  const hasRedisConfig = !!(
    config.REDIS_INTERNAL_HOST || 
    config.REDIS_HOST
  );

  if (!hasRedisConfig) {
    warnings.push('No Redis configuration found. Set REDIS_INTERNAL_HOST or REDIS_HOST for caching');
  }

  // Authentication validation
  if (!config.BETTER_AUTH_SECRET && !config.JWT_SECRET) {
    errors.push('Authentication secret is required. Set BETTER_AUTH_SECRET or JWT_SECRET');
  }

  // Container networking best practices
  if (config.BACKEND_INTERNAL_HOST && !config.BACKEND_INTERNAL_PORT) {
    warnings.push('BACKEND_INTERNAL_HOST is set but BACKEND_INTERNAL_PORT is missing. Defaulting to 3011');
  }

  if (config.DATABASE_INTERNAL_HOST && !config.DATABASE_INTERNAL_PORT) {
    warnings.push('DATABASE_INTERNAL_HOST is set but DATABASE_INTERNAL_PORT is missing. Defaulting to 5432');
  }

  if (config.REDIS_INTERNAL_HOST && !config.REDIS_INTERNAL_PORT) {
    warnings.push('REDIS_INTERNAL_HOST is set but REDIS_INTERNAL_PORT is missing. Defaulting to 6379');
  }

  // Port validation
  const ports = [
    config.PORT,
    config.BACKEND_INTERNAL_PORT,
    config.DATABASE_INTERNAL_PORT,
    config.REDIS_INTERNAL_PORT,
  ].filter(Boolean);

  ports.forEach(port => {
    if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
      errors.push(`Invalid port number: ${port}`);
    }
  });

  // URL validation for client-side variables
  if (config.NEXT_PUBLIC_API_URL) {
    try {
      new URL(config.NEXT_PUBLIC_API_URL);
    } catch {
      errors.push('NEXT_PUBLIC_API_URL is not a valid URL');
    }
  }

  if (config.NEXT_PUBLIC_WS_URL) {
    try {
      const wsUrl = new URL(config.NEXT_PUBLIC_WS_URL);
      if (!['ws:', 'wss:'].includes(wsUrl.protocol)) {
        errors.push('NEXT_PUBLIC_WS_URL must use ws:// or wss:// protocol');
      }
    } catch {
      errors.push('NEXT_PUBLIC_WS_URL is not a valid WebSocket URL');
    }
  }

  // Security warnings
  if (config.NODE_ENV === 'production') {
    if (config.NEXT_PUBLIC_API_URL?.includes('localhost')) {
      errors.push('Production environment should not use localhost URLs');
    }
    
    if (!config.BETTER_AUTH_SECRET || config.BETTER_AUTH_SECRET.length < 32) {
      errors.push('BETTER_AUTH_SECRET must be at least 32 characters in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Get the resolved backend URL for internal use
 */
export function getBackendInternalUrl(): string {
  const validation = validateEnvironment();
  
  if (validation.config.BACKEND_INTERNAL_URL) {
    return validation.config.BACKEND_INTERNAL_URL;
  }
  
  if (validation.config.BACKEND_INTERNAL_HOST) {
    const port = validation.config.BACKEND_INTERNAL_PORT || '3011';
    return `http://${validation.config.BACKEND_INTERNAL_HOST}:${port}`;
  }
  
  // Fallback to standard container name
  return 'http://revivatech_backend:3011';
}

/**
 * Get the resolved database URL for internal use
 */
export function getDatabaseInternalUrl(): string {
  const validation = validateEnvironment();
  
  if (validation.config.DATABASE_INTERNAL_HOST) {
    const port = validation.config.DATABASE_INTERNAL_PORT || '5432';
    const user = validation.config.DB_USER || 'revivatech_user';
    const dbName = validation.config.DB_NAME || 'revivatech';
    return `postgresql://${user}@${validation.config.DATABASE_INTERNAL_HOST}:${port}/${dbName}`;
  }
  
  if (validation.config.DB_HOST) {
    const port = validation.config.DB_PORT || '5432';
    const user = validation.config.DB_USER || 'revivatech_user';
    const dbName = validation.config.DB_NAME || 'revivatech';
    return `postgresql://${user}@${validation.config.DB_HOST}:${port}/${dbName}`;
  }
  
  // Fallback to standard container name  
  return 'postgresql://revivatech_user@revivatech_database:5432/revivatech';
}

/**
 * Get the resolved Redis URL for internal use
 */
export function getRedisInternalUrl(): string {
  const validation = validateEnvironment();
  
  if (validation.config.REDIS_INTERNAL_HOST) {
    const port = validation.config.REDIS_INTERNAL_PORT || '6379';
    return `redis://${validation.config.REDIS_INTERNAL_HOST}:${port}`;
  }
  
  if (validation.config.REDIS_HOST) {
    const port = validation.config.REDIS_PORT || '6379';
    return `redis://${validation.config.REDIS_HOST}:${port}`;
  }
  
  // Fallback to standard container name
  return 'redis://revivatech_redis:6379';
}

/**
 * Log environment validation results
 */
export function logEnvironmentValidation(): void {
  const validation = validateEnvironment();
  
  console.log('🔍 [Environment Validation]');
  
  if (validation.errors.length > 0) {
    console.error('❌ Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('🔗 Resolved URLs:');
  console.log(`  Backend (Internal): ${getBackendInternalUrl()}`);
  console.log(`  Database (Internal): ${getDatabaseInternalUrl()}`);
  console.log(`  Redis (Internal): ${getRedisInternalUrl()}`);
  
  if (validation.config.NEXT_PUBLIC_API_URL) {
    console.log(`  API (Public): ${validation.config.NEXT_PUBLIC_API_URL}`);
  }
  
  if (validation.config.NEXT_PUBLIC_WS_URL) {
    console.log(`  WebSocket (Public): ${validation.config.NEXT_PUBLIC_WS_URL}`);
  }
}

export default {
  validateEnvironment,
  getBackendInternalUrl,
  getDatabaseInternalUrl,
  getRedisInternalUrl,
  logEnvironmentValidation
};