import { checkDatabaseHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { checkLoggerHealth } from '../config/logger';
import { getConfig } from '../config/environment';

const config = getConfig();

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  lastChecked: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

// Health check registry
export class HealthCheckRegistry {
  private checks = new Map<string, () => Promise<HealthCheck>>();
  private lastResults = new Map<string, HealthCheck>();
  
  // Register a health check
  register(name: string, checkFn: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFn);
  }
  
  // Unregister a health check
  unregister(name: string): void {
    this.checks.delete(name);
    this.lastResults.delete(name);
  }
  
  // Run all health checks
  async runAll(): Promise<SystemHealth> {
    const results: HealthCheck[] = [];
    const promises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
      try {
        const start = Date.now();
        const result = await Promise.race([
          checkFn(),
          new Promise<HealthCheck>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);
        
        result.responseTime = Date.now() - start;
        result.lastChecked = new Date();
        
        this.lastResults.set(name, result);
        return result;
      } catch (error) {
        const failedCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          responseTime: Date.now() - Date.now(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          lastChecked: new Date(),
        };
        
        this.lastResults.set(name, failedCheck);
        return failedCheck;
      }
    });
    
    const checks = await Promise.all(promises);
    results.push(...checks);
    
    // Calculate overall health status
    const summary = {
      total: results.length,
      healthy: results.filter(c => c.status === 'healthy').length,
      unhealthy: results.filter(c => c.status === 'unhealthy').length,
      degraded: results.filter(c => c.status === 'degraded').length,
    };
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date(),
      checks: results,
      summary,
    };
  }
  
  // Run specific health check
  async runCheck(name: string): Promise<HealthCheck | null> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      return null;
    }
    
    try {
      const start = Date.now();
      const result = await checkFn();
      result.responseTime = Date.now() - start;
      result.lastChecked = new Date();
      
      this.lastResults.set(name, result);
      return result;
    } catch (error) {
      const failedCheck: HealthCheck = {
        name,
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        lastChecked: new Date(),
      };
      
      this.lastResults.set(name, failedCheck);
      return failedCheck;
    }
  }
  
  // Get last results without running checks
  getLastResults(): HealthCheck[] {
    return Array.from(this.lastResults.values());
  }
  
  // Get registered check names
  getRegisteredChecks(): string[] {
    return Array.from(this.checks.keys());
  }
}

// Create global health check registry
export const healthRegistry = new HealthCheckRegistry();

// Database health check
healthRegistry.register('database', async (): Promise<HealthCheck> => {
  const result = await checkDatabaseHealth();
  return {
    name: 'database',
    status: result.status,
    responseTime: 0, // Will be set by registry
    details: result.details,
    lastChecked: new Date(),
  };
});

// Redis health check
healthRegistry.register('redis', async (): Promise<HealthCheck> => {
  const result = await checkRedisHealth();
  return {
    name: 'redis',
    status: result.status,
    responseTime: 0, // Will be set by registry
    details: result.details,
    lastChecked: new Date(),
  };
});

// Logger health check
healthRegistry.register('logger', async (): Promise<HealthCheck> => {
  const result = checkLoggerHealth();
  return {
    name: 'logger',
    status: result.status,
    responseTime: 0, // Will be set by registry
    details: result.details,
    lastChecked: new Date(),
  };
});

// Application health check
healthRegistry.register('application', async (): Promise<HealthCheck> => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();
  
  // Check memory usage (warning if > 80%, critical if > 90%)
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (memoryUsagePercent > 90) {
    status = 'unhealthy';
  } else if (memoryUsagePercent > 80) {
    status = 'degraded';
  }
  
  return {
    name: 'application',
    status,
    responseTime: 0,
    details: {
      uptime,
      memoryUsage: {
        ...memoryUsage,
        usagePercent: memoryUsagePercent,
      },
      cpuUsage,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    lastChecked: new Date(),
  };
});

// File system health check
healthRegistry.register('filesystem', async (): Promise<HealthCheck> => {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    // Test write/read/delete operations
    const testFile = path.join(process.cwd(), '.health-check');
    const testData = 'health-check-' + Date.now();
    
    await fs.writeFile(testFile, testData);
    const readData = await fs.readFile(testFile, 'utf8');
    await fs.unlink(testFile);
    
    if (readData !== testData) {
      throw new Error('File system integrity check failed');
    }
    
    return {
      name: 'filesystem',
      status: 'healthy',
      responseTime: 0,
      details: { message: 'File system operations working correctly' },
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      name: 'filesystem',
      status: 'unhealthy',
      responseTime: 0,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      lastChecked: new Date(),
    };
  }
});

// External API health check
healthRegistry.register('external_apis', async (): Promise<HealthCheck> => {
  const checks = [];
  
  // Check Stripe API if configured
  if (config.STRIPE_SECRET_KEY) {
    try {
      const response = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: {
          'Authorization': `Bearer ${config.STRIPE_SECRET_KEY}`,
        },
      });
      
      checks.push({
        name: 'stripe',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: 0,
      });
    } catch (error) {
      checks.push({
        name: 'stripe',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Check other external APIs...
  
  const allHealthy = checks.every(check => check.status === 'healthy');
  const anyUnhealthy = checks.some(check => check.status === 'unhealthy');
  
  return {
    name: 'external_apis',
    status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
    responseTime: 0,
    details: { apis: checks },
    lastChecked: new Date(),
  };
});

// Disk space health check
healthRegistry.register('disk_space', async (): Promise<HealthCheck> => {
  const fs = await import('fs');
  const util = await import('util');
  
  try {
    const stats = await util.promisify(fs.statvfs || fs.statSync)(process.cwd());
    
    // Calculate disk usage percentage
    const total = stats.blocks * stats.frsize;
    const free = stats.bavail * stats.frsize;
    const used = total - free;
    const usagePercent = (used / total) * 100;
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (usagePercent > 95) {
      status = 'unhealthy';
    } else if (usagePercent > 85) {
      status = 'degraded';
    }
    
    return {
      name: 'disk_space',
      status,
      responseTime: 0,
      details: {
        total,
        used,
        free,
        usagePercent,
      },
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      name: 'disk_space',
      status: 'degraded',
      responseTime: 0,
      details: { 
        error: 'Could not determine disk usage',
        message: 'Disk space monitoring not available on this platform'
      },
      lastChecked: new Date(),
    };
  }
});

// Load balancer health check
healthRegistry.register('load_balancer', async (): Promise<HealthCheck> => {
  // This would check load balancer health in production
  // For now, we'll simulate a basic check
  
  const loadAverage = process.loadavg();
  const cpuCount = require('os').cpus().length;
  const loadPercent = (loadAverage[0] / cpuCount) * 100;
  
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (loadPercent > 90) {
    status = 'unhealthy';
  } else if (loadPercent > 70) {
    status = 'degraded';
  }
  
  return {
    name: 'load_balancer',
    status,
    responseTime: 0,
    details: {
      loadAverage,
      cpuCount,
      loadPercent,
    },
    lastChecked: new Date(),
  };
});

// Dependencies health check
healthRegistry.register('dependencies', async (): Promise<HealthCheck> => {
  const dependencies = [];
  
  // Check critical npm packages
  try {
    require('express');
    dependencies.push({ name: 'express', status: 'healthy' });
  } catch (error) {
    dependencies.push({ name: 'express', status: 'unhealthy', error: 'Package not found' });
  }
  
  try {
    require('next');
    dependencies.push({ name: 'next', status: 'healthy' });
  } catch (error) {
    dependencies.push({ name: 'next', status: 'unhealthy', error: 'Package not found' });
  }
  
  // Add more critical dependencies...
  
  const allHealthy = dependencies.every(dep => dep.status === 'healthy');
  
  return {
    name: 'dependencies',
    status: allHealthy ? 'healthy' : 'unhealthy',
    responseTime: 0,
    details: { dependencies },
    lastChecked: new Date(),
  };
});

// Custom health check helper
export function createCustomHealthCheck(
  name: string,
  checkFn: () => Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; details?: any }>
): void {
  healthRegistry.register(name, async (): Promise<HealthCheck> => {
    const result = await checkFn();
    return {
      name,
      status: result.status,
      responseTime: 0,
      details: result.details,
      lastChecked: new Date(),
    };
  });
}

// Readiness probe (for Kubernetes)
export async function readinessProbe(): Promise<boolean> {
  const critical_checks = ['database', 'redis', 'application'];
  
  for (const checkName of critical_checks) {
    const result = await healthRegistry.runCheck(checkName);
    if (!result || result.status === 'unhealthy') {
      return false;
    }
  }
  
  return true;
}

// Liveness probe (for Kubernetes)
export async function livenessProbe(): Promise<boolean> {
  // Basic liveness check - just ensure the process is responsive
  try {
    const result = await healthRegistry.runCheck('application');
    return result?.status !== 'unhealthy';
  } catch (error) {
    return false;
  }
}

// Startup probe (for Kubernetes)
export async function startupProbe(): Promise<boolean> {
  // Check if application has fully started
  const requiredChecks = ['database', 'redis', 'filesystem'];
  
  for (const checkName of requiredChecks) {
    const result = await healthRegistry.runCheck(checkName);
    if (!result || result.status === 'unhealthy') {
      return false;
    }
  }
  
  return true;
}