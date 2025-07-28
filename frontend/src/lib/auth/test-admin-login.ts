/**
 * Admin Login Flow Test Script
 * Tests the complete admin authentication flow
 */

import { authDiagnosticService } from './diagnostic-service';
import { enhancedAuthService } from './api-auth-service';
import { LoginCredentials } from './types';

export interface LoginTestResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export interface LoginFlowTestReport {
  overall: 'success' | 'failure';
  timestamp: string;
  results: LoginTestResult[];
  diagnostics?: any;
}

class AdminLoginTester {
  private adminCredentials: LoginCredentials = {
    email: 'admin@revivatech.co.uk',
    password: 'admin123',
  };

  /**
   * Run complete admin login flow test
   */
  async testAdminLoginFlow(): Promise<LoginFlowTestReport> {
    const results: LoginTestResult[] = [];
    let overall: 'success' | 'failure' = 'success';

    console.log('🧪 Starting Admin Login Flow Test...');

    // Step 1: Run diagnostics
    results.push(await this.runDiagnostics());

    // Step 2: Test login API call
    results.push(await this.testLoginApiCall());

    // Step 3: Test token storage
    results.push(await this.testTokenStorage());

    // Step 4: Test token validation
    results.push(await this.testTokenValidation());

    // Step 5: Test admin role verification
    results.push(await this.testAdminRoleVerification());

    // Step 6: Test logout
    results.push(await this.testLogout());

    // Determine overall result
    const hasFailures = results.some(r => !r.success);
    if (hasFailures) {
      overall = 'failure';
    }

    const report: LoginFlowTestReport = {
      overall,
      timestamp: new Date().toISOString(),
      results,
    };

    // Add diagnostics if there were failures
    if (overall === 'failure') {
      try {
        report.diagnostics = await authDiagnosticService.runDiagnostics();
      } catch (error) {
        console.error('Failed to run diagnostics:', error);
      }
    }

    return report;
  }

  /**
   * Step 1: Run system diagnostics
   */
  private async runDiagnostics(): Promise<LoginTestResult> {
    try {
      const diagnostics = await authDiagnosticService.runDiagnostics();
      
      if (diagnostics.overall === 'healthy') {
        return {
          step: 'System Diagnostics',
          success: true,
          message: 'All diagnostic tests passed',
          details: diagnostics.summary,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          step: 'System Diagnostics',
          success: false,
          message: `Diagnostics found issues: ${diagnostics.summary.failed} failed, ${diagnostics.summary.warnings} warnings`,
          details: diagnostics,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        step: 'System Diagnostics',
        success: false,
        message: 'Failed to run diagnostics',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Step 2: Test login API call
   */
  private async testLoginApiCall(): Promise<LoginTestResult> {
    try {
      const response = await enhancedAuthService.login(this.adminCredentials);

      if (response.success && response.data) {
        const user = response.data.user;
        const tokens = response.data.tokens;

        if (user.role === 'ADMIN' && tokens.accessToken) {
          return {
            step: 'Login API Call',
            success: true,
            message: 'Admin login successful',
            details: {
              userId: user.id,
              email: user.email,
              role: user.role,
              hasAccessToken: !!tokens.accessToken,
              hasRefreshToken: !!tokens.refreshToken,
            },
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            step: 'Login API Call',
            success: false,
            message: 'Login succeeded but user is not admin or tokens missing',
            details: { user, tokens },
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        return {
          step: 'Login API Call',
          success: false,
          message: response.error?.message || 'Login failed',
          details: response.error,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        step: 'Login API Call',
        success: false,
        message: 'Login API call threw an error',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Step 3: Test token storage
   */
  private async testTokenStorage(): Promise<LoginTestResult> {
    try {
      if (typeof window === 'undefined') {
        return {
          step: 'Token Storage',
          success: false,
          message: 'Cannot test token storage in server environment',
          timestamp: new Date().toISOString(),
        };
      }

      // Check if tokens are stored
      const storedTokens = localStorage.getItem('revivatech_auth_tokens');
      
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        
        if (tokens.accessToken && tokens.refreshToken) {
          return {
            step: 'Token Storage',
            success: true,
            message: 'Tokens are properly stored in localStorage',
            details: {
              hasAccessToken: !!tokens.accessToken,
              hasRefreshToken: !!tokens.refreshToken,
            },
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            step: 'Token Storage',
            success: false,
            message: 'Tokens stored but missing access or refresh token',
            details: tokens,
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        return {
          step: 'Token Storage',
          success: false,
          message: 'No tokens found in localStorage',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        step: 'Token Storage',
        success: false,
        message: 'Error checking token storage',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Step 4: Test token validation
   */
  private async testTokenValidation(): Promise<LoginTestResult> {
    try {
      const response = await enhancedAuthService.validateSession();

      if (response.success && response.data) {
        const user = response.data;
        
        if (user.role === 'ADMIN') {
          return {
            step: 'Token Validation',
            success: true,
            message: 'Token validation successful',
            details: {
              userId: user.id,
              email: user.email,
              role: user.role,
            },
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            step: 'Token Validation',
            success: false,
            message: 'Token valid but user is not admin',
            details: user,
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        return {
          step: 'Token Validation',
          success: false,
          message: response.error?.message || 'Token validation failed',
          details: response.error,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        step: 'Token Validation',
        success: false,
        message: 'Token validation threw an error',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Step 5: Test admin role verification
   */
  private async testAdminRoleVerification(): Promise<LoginTestResult> {
    try {
      // Test permission checking
      const hasAdminPermission = enhancedAuthService.checkPermission('ADMIN', 'admin', 'read');
      const hasUserPermission = enhancedAuthService.checkPermission('ADMIN', 'users', 'create');

      if (hasAdminPermission && hasUserPermission) {
        return {
          step: 'Admin Role Verification',
          success: true,
          message: 'Admin role permissions verified',
          details: {
            hasAdminPermission,
            hasUserPermission,
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          step: 'Admin Role Verification',
          success: false,
          message: 'Admin role permissions not working correctly',
          details: {
            hasAdminPermission,
            hasUserPermission,
          },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        step: 'Admin Role Verification',
        success: false,
        message: 'Error testing admin role verification',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Step 6: Test logout
   */
  private async testLogout(): Promise<LoginTestResult> {
    try {
      await enhancedAuthService.logout();

      // Check if tokens are cleared
      if (typeof window !== 'undefined') {
        const storedTokens = localStorage.getItem('revivatech_auth_tokens');
        
        if (!storedTokens) {
          return {
            step: 'Logout',
            success: true,
            message: 'Logout successful - tokens cleared',
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            step: 'Logout',
            success: false,
            message: 'Logout called but tokens not cleared from storage',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        return {
          step: 'Logout',
          success: true,
          message: 'Logout called (cannot verify token clearing in server environment)',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        step: 'Logout',
        success: false,
        message: 'Logout threw an error',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Format test report for console output
   */
  formatReport(report: LoginFlowTestReport): string {
    const lines = [
      '=== Admin Login Flow Test Report ===',
      `Generated: ${report.timestamp}`,
      `Overall Result: ${report.overall.toUpperCase()}`,
      '',
      'Test Results:',
      '=============',
    ];

    report.results.forEach((result, index) => {
      const statusIcon = result.success ? '✅' : '❌';
      lines.push(`${index + 1}. ${statusIcon} ${result.step}: ${result.message}`);
      
      if (result.details) {
        lines.push(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      lines.push('');
    });

    if (report.diagnostics) {
      lines.push('Diagnostic Information:');
      lines.push('======================');
      lines.push(authDiagnosticService.formatReport(report.diagnostics));
    }

    return lines.join('\n');
  }
}

export const adminLoginTester = new AdminLoginTester();