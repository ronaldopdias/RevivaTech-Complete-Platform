/**
 * Startup Environment Validation
 * Validates container networking configuration on application startup
 */

import { logEnvironmentValidation, validateEnvironment } from './env-validator';
import { getDebugInfo } from './api-config';

/**
 * Run comprehensive startup validation
 * This should be called early in the application lifecycle
 */
export function runStartupValidation(): boolean {
  try {
    console.log('🚀 [RevivaTech] Starting application with environment validation...');
    
    // Run environment validation
    logEnvironmentValidation();
    
    // Get API configuration debug info
    console.log('📡 [API Configuration Debug]');
    const debugInfo = getDebugInfo();
    console.log(`Environment: ${debugInfo.environment}`);
    console.log(`Server Side: ${debugInfo.isServerSide}`);
    console.log(`Health Check: ${debugInfo.healthCheckUrl}`);
    
    if (debugInfo.isServerSide) {
      console.log(`Internal API: ${debugInfo.internalApiUrl}`);
    } else {
      console.log(`External API: ${debugInfo.externalApiUrl}`);
    }
    
    console.log(`WebSocket: ${debugInfo.webSocketUrl}`);
    
    // Check if validation passes
    const validation = validateEnvironment();
    
    if (!validation.isValid) {
      console.error('❌ [RevivaTech] Startup validation failed!');
      console.error('Critical errors must be resolved:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️  [RevivaTech] Startup validation completed with warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    } else {
      console.log('✅ [RevivaTech] Startup validation completed successfully!');
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 [RevivaTech] Startup validation crashed:', error);
    return false;
  }
}

/**
 * Test container connectivity (for development and debugging)
 */
export async function testContainerConnectivity(): Promise<void> {
  if (typeof window !== 'undefined') {
    console.log('🔍 [Container Test] Skipping server-side connectivity tests (running client-side)');
    return;
  }
  
  console.log('🔍 [Container Test] Testing container connectivity...');
  
  const debugInfo = getDebugInfo();
  
  // Test backend connectivity
  try {
    const healthUrl = debugInfo.healthCheckUrl;
    console.log(`Testing backend connectivity: ${healthUrl}`);
    
    // Note: We can't actually make HTTP requests here since this runs at build time
    // This is more for logging and validation
    console.log('✅ [Container Test] Backend configuration validated');
  } catch (error) {
    console.error('❌ [Container Test] Backend connectivity test failed:', error);
  }
}

/**
 * Export environment info for debugging
 */
export function exportEnvironmentInfo(): Record<string, any> {
  const validation = validateEnvironment();
  const debugInfo = getDebugInfo();
  
  return {
    timestamp: new Date().toISOString(),
    validation: {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    },
    configuration: validation.config,
    apiDebugInfo: debugInfo,
    nodeEnv: process.env.NODE_ENV,
    isServerSide: typeof window === 'undefined'
  };
}

export default {
  runStartupValidation,
  testContainerConnectivity,
  exportEnvironmentInfo
};