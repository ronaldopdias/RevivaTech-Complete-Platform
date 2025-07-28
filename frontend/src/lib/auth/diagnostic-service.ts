/**
 * Authentication Diagnostic Service
 * Provides comprehensive testing and troubleshooting for authentication issues
 */

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export interface DiagnosticReport {
  overall: 'healthy' | 'issues' | 'critical';
  timestamp: string;
  results: DiagnosticResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

class AuthDiagnosticService {
  private baseUrl = '/api/auth';

  /**
   * Run comprehensive authentication diagnostics
   */
  async runDiagnostics(): Promise<DiagnosticReport> {
    const results: DiagnosticResult[] = [];
    
    // Test 1: API Connectivity
    results.push(await this.testApiConnectivity());
    
    // Test 2: Auth Endpoint Availability
    results.push(await this.testAuthEndpoints());
    
    // Test 3: Admin User Credentials
    results.push(await this.testAdminCredentials());
    
    // Test 4: Token Validation
    results.push(await this.testTokenValidation());
    
    // Test 5: Local Storage Access
    results.push(await this.testLocalStorage());
    
    // Test 6: Network Configuration
    results.push(await this.testNetworkConfiguration());

    // Calculate summary
    const summary = {
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warning').length,
    };

    // Determine overall status
    let overall: 'healthy' | 'issues' | 'critical' = 'healthy';
    if (summary.failed > 0) {
      overall = summary.failed > 2 ? 'critical' : 'issues';
    } else if (summary.warnings > 0) {
      overall = 'issues';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      results,
      summary,
    };
  }

  /**
   * Test basic API connectivity
   */
  private async testApiConnectivity(): Promise<DiagnosticResult> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          test: 'API Connectivity',
          status: 'pass',
          message: 'API is accessible and responding',
          details: { status: response.status, data },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          test: 'API Connectivity',
          status: 'fail',
          message: `API returned status ${response.status}`,
          details: { status: response.status, statusText: response.statusText },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        test: 'API Connectivity',
        status: 'fail',
        message: 'Failed to connect to API',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test authentication endpoints availability
   */
  private async testAuthEndpoints(): Promise<DiagnosticResult> {
    const endpoints = [
      { path: '/login', method: 'POST' },
      { path: '/refresh', method: 'POST' },
      { path: '/logout', method: 'POST' },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body to test endpoint availability
        });

        // We expect 400 (validation error) for empty requests, not 404
        const isAvailable = response.status !== 404;
        results.push({
          path: endpoint.path,
          available: isAvailable,
          status: response.status,
        });
      } catch (error) {
        results.push({
          path: endpoint.path,
          available: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const availableCount = results.filter(r => r.available).length;
    const status = availableCount === endpoints.length ? 'pass' : 
                  availableCount > 0 ? 'warning' : 'fail';

    return {
      test: 'Auth Endpoints',
      status,
      message: `${availableCount}/${endpoints.length} endpoints available`,
      details: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test admin credentials (without actually logging in)
   */
  private async testAdminCredentials(): Promise<DiagnosticResult> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@revivatech.co.uk',
          password: 'admin123',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user?.role === 'ADMIN') {
          return {
            test: 'Admin Credentials',
            status: 'pass',
            message: 'Admin credentials are valid and user has ADMIN role',
            details: { 
              userId: data.user.id,
              email: data.user.email,
              role: data.user.role,
            },
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            test: 'Admin Credentials',
            status: 'fail',
            message: 'Admin login succeeded but user does not have ADMIN role',
            details: data,
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          test: 'Admin Credentials',
          status: 'fail',
          message: `Admin login failed with status ${response.status}`,
          details: { status: response.status, error: errorData },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        test: 'Admin Credentials',
        status: 'fail',
        message: 'Failed to test admin credentials',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test token validation endpoint
   */
  private async testTokenValidation(): Promise<DiagnosticResult> {
    try {
      // First get a token
      const loginResponse = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@revivatech.co.uk',
          password: 'admin123',
        }),
      });

      if (!loginResponse.ok) {
        return {
          test: 'Token Validation',
          status: 'fail',
          message: 'Cannot test token validation - login failed',
          timestamp: new Date().toISOString(),
        };
      }

      const loginData = await loginResponse.json();
      const token = loginData.tokens?.accessToken;

      if (!token) {
        return {
          test: 'Token Validation',
          status: 'fail',
          message: 'No access token received from login',
          timestamp: new Date().toISOString(),
        };
      }

      // Test token validation
      const validateResponse = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (validateResponse.ok) {
        const userData = await validateResponse.json();
        return {
          test: 'Token Validation',
          status: 'pass',
          message: 'Token validation is working correctly',
          details: { user: userData.user },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          test: 'Token Validation',
          status: 'fail',
          message: `Token validation failed with status ${validateResponse.status}`,
          details: { status: validateResponse.status },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        test: 'Token Validation',
        status: 'fail',
        message: 'Failed to test token validation',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test local storage access
   */
  private async testLocalStorage(): Promise<DiagnosticResult> {
    try {
      if (typeof window === 'undefined') {
        return {
          test: 'Local Storage',
          status: 'warning',
          message: 'Running in server environment - local storage not available',
          timestamp: new Date().toISOString(),
        };
      }

      // Test write
      const testKey = 'revivatech_auth_test';
      const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
      
      localStorage.setItem(testKey, testValue);
      
      // Test read
      const retrieved = localStorage.getItem(testKey);
      
      // Test delete
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        return {
          test: 'Local Storage',
          status: 'pass',
          message: 'Local storage is working correctly',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          test: 'Local Storage',
          status: 'fail',
          message: 'Local storage read/write test failed',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        test: 'Local Storage',
        status: 'fail',
        message: 'Local storage access failed',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test network configuration
   */
  private async testNetworkConfiguration(): Promise<DiagnosticResult> {
    const details: any = {};

    if (typeof window !== 'undefined') {
      details.hostname = window.location.hostname;
      details.port = window.location.port;
      details.protocol = window.location.protocol;
      details.origin = window.location.origin;
    }

    details.baseUrl = this.baseUrl;
    details.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A';

    // Check if we're in development or production
    const isDevelopment = details.hostname === 'localhost' || details.hostname === '127.0.0.1';
    const isProduction = details.hostname?.includes('revivatech.co');

    let status: 'pass' | 'warning' | 'fail' = 'pass';
    let message = 'Network configuration looks good';

    if (!isDevelopment && !isProduction) {
      status = 'warning';
      message = 'Unknown hostname - may cause API routing issues';
    }

    return {
      test: 'Network Configuration',
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate a formatted diagnostic report
   */
  formatReport(report: DiagnosticReport): string {
    const lines = [
      '=== Authentication Diagnostic Report ===',
      `Generated: ${report.timestamp}`,
      `Overall Status: ${report.overall.toUpperCase()}`,
      '',
      `Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`,
      '',
      'Test Results:',
      '=============',
    ];

    report.results.forEach((result, index) => {
      const statusIcon = result.status === 'pass' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      lines.push(`${index + 1}. ${statusIcon} ${result.test}: ${result.message}`);
      
      if (result.details) {
        lines.push(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }
}

export const authDiagnosticService = new AuthDiagnosticService();