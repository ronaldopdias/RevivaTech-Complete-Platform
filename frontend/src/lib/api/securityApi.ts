import { axiosSecure } from '../../utils/axiosSecure';

// Types
export interface SecurityMetrics {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  averageRiskScore: number;
  failedLogins: number;
  successfulLogins: number;
  criticalEvents: number;
  unacknowledgedAlerts: number;
  blockedIPs: number;
  twoFactorEnabled: number;
  totalUsers: number;
  trustedDevices: number;
  timestamp: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  sessionId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    browser: string;
    os: string;
    deviceFingerprint: string;
  };
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  status: 'active' | 'suspicious' | 'expired' | 'terminated';
  securityLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  activityCount: number;
  securityFlags: string[];
  trustedDevice: boolean;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  category: string;
  eventType: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  success?: boolean;
  riskScore: number;
  metadata?: Record<string, any>;
  correlationId?: string;
  sessionId?: string;
}

export interface FailedLoginAttempt {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  failureReason: string;
  twoFactorRequired: boolean;
  twoFactorSuccess?: boolean;
  country?: string;
  city?: string;
  deviceFingerprint?: string;
  riskScore: number;
  createdAt: string;
}

export interface SecurityConfig {
  maxFailedLogins: number;
  sessionTimeout: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  ipBlockDuration: number;
  suspiciousActivityThreshold: number;
  auditLogRetention: number;
  alertEmailEnabled: boolean;
  riskScoreThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Security API Class
class SecurityApi {
  private baseUrl = '/api/security';

  // Get security metrics
  async getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<SecurityMetrics> {
    try {
      const response = await axiosSecure.get<ApiResponse<SecurityMetrics>>(
        `${this.baseUrl}/metrics?timeRange=${timeRange}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch security metrics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      throw error;
    }
  }

  // Get security alerts
  async getAlerts(filters: {
    status?: 'active' | 'acknowledged' | 'resolved';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
    offset?: number;
  } = {}): Promise<SecurityAlert[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await axiosSecure.get<ApiResponse<SecurityAlert[]>>(
        `${this.baseUrl}/alerts?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch security alerts');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      throw error;
    }
  }

  // Get active sessions
  async getActiveSessions(filters: {
    userId?: string;
    status?: 'active' | 'suspicious' | 'expired' | 'terminated';
    limit?: number;
    offset?: number;
  } = {}): Promise<ActiveSession[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await axiosSecure.get<ApiResponse<ActiveSession[]>>(
        `${this.baseUrl}/sessions?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch active sessions');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  }

  // Get audit logs
  async getAuditLogs(filters: {
    category?: string;
    level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditLogEntry[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await axiosSecure.get<ApiResponse<AuditLogEntry[]>>(
        `${this.baseUrl}/audit-logs?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch audit logs');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Get failed login attempts
  async getFailedLoginAttempts(filters: {
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FailedLoginAttempt[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await axiosSecure.get<ApiResponse<FailedLoginAttempt[]>>(
        `${this.baseUrl}/login-attempts?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch failed login attempts');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching failed login attempts:', error);
      throw error;
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const response = await axiosSecure.post<ApiResponse<void>>(
        `${this.baseUrl}/alerts/${alertId}/acknowledge`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    try {
      const response = await axiosSecure.post<ApiResponse<void>>(
        `${this.baseUrl}/alerts/${alertId}/resolve`,
        { resolution }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to resolve alert');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Terminate session
  async terminateSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const response = await axiosSecure.delete<ApiResponse<void>>(
        `${this.baseUrl}/sessions/${sessionId}`,
        { data: { reason } }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to terminate session');
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  }

  // Block IP address
  async blockIPAddress(ipAddress: string, reason: string, duration?: number): Promise<void> {
    try {
      const response = await axiosSecure.post<ApiResponse<void>>(
        `${this.baseUrl}/block-ip`,
        { ipAddress, reason, duration }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to block IP address');
      }
    } catch (error) {
      console.error('Error blocking IP address:', error);
      throw error;
    }
  }

  // Unblock IP address
  async unblockIPAddress(ipAddress: string): Promise<void> {
    try {
      const response = await axiosSecure.delete<ApiResponse<void>>(
        `${this.baseUrl}/block-ip/${encodeURIComponent(ipAddress)}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to unblock IP address');
      }
    } catch (error) {
      console.error('Error unblocking IP address:', error);
      throw error;
    }
  }

  // Export audit logs
  async exportAuditLogs(filters: {
    format?: 'csv' | 'json';
    category?: string;
    level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await axiosSecure.get(
        `${this.baseUrl}/audit-logs/export?${params.toString()}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  // Get security configuration
  async getConfig(): Promise<SecurityConfig> {
    try {
      const response = await axiosSecure.get<ApiResponse<SecurityConfig>>(
        `${this.baseUrl}/config`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch security configuration');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching security config:', error);
      throw error;
    }
  }

  // Update security configuration
  async updateConfig(config: Partial<SecurityConfig>): Promise<SecurityConfig> {
    try {
      const response = await axiosSecure.put<ApiResponse<SecurityConfig>>(
        `${this.baseUrl}/config`,
        config
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update security configuration');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating security config:', error);
      throw error;
    }
  }

  // Helper method to download exported data
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const securityApi = new SecurityApi();
export default securityApi;