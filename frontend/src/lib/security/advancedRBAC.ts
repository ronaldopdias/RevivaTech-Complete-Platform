'use client';

// Advanced Role-Based Access Control System
import { auditLogger } from '@/lib/security/audit-logger';

interface Permission {
  id: string;
  resource: string;
  action: string;
  scope?: 'global' | 'organization' | 'department' | 'team' | 'own';
  conditions?: PermissionCondition[];
  effect: 'allow' | 'deny';
  priority: number;
}

interface PermissionCondition {
  type: 'time' | 'location' | 'device' | 'mfa' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  context?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inherits?: string[];
  metadata: {
    isSystem: boolean;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    level: number;
  };
}

interface User {
  id: string;
  email: string;
  roles: string[];
  directPermissions: string[];
  context: UserContext;
  metadata: {
    lastLogin: number;
    mfaEnabled: boolean;
    trustedDevices: string[];
  };
}

interface UserContext {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    trusted: boolean;
    fingerprint: string;
  };
  mfa: {
    verified: boolean;
    method?: 'totp' | 'sms' | 'backup';
    timestamp?: number;
  };
  timestamp: number;
}

interface AccessRequest {
  resource: string;
  action: string;
  resourceData?: any;
  context: UserContext;
}

interface AccessResult {
  granted: boolean;
  reason: string;
  requiredConditions?: string[];
  permissions: Permission[];
  cached: boolean;
  evaluationTime: number;
}

class AdvancedRBACService {
  private permissionCache = new Map<string, { result: AccessResult; expires: number }>();
  private roleHierarchy = new Map<string, string[]>();
  private permissionRegistry = new Map<string, Permission>();
  private roleRegistry = new Map<string, Role>();

  constructor() {
    this.initializeSystemRoles();
    this.initializeSystemPermissions();
  }

  // Initialize system roles and permissions
  private initializeSystemRoles(): void {
    const systemRoles: Role[] = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: ['*'],
        metadata: {
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          level: 100
        }
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Administrative access with most permissions',
        permissions: [
          'users:read', 'users:create', 'users:update',
          'bookings:*', 'repairs:*', 'reports:*',
          'settings:read', 'settings:update'
        ],
        metadata: {
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          level: 80
        }
      },
      {
        id: 'technician',
        name: 'Technician',
        description: 'Technical staff with repair and diagnostic permissions',
        permissions: [
          'repairs:read', 'repairs:update', 'repairs:create',
          'diagnostics:*', 'bookings:read', 'bookings:update',
          'customers:read', 'inventory:read'
        ],
        metadata: {
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          level: 60
        }
      },
      {
        id: 'customer_service',
        name: 'Customer Service',
        description: 'Customer service with booking and communication permissions',
        permissions: [
          'bookings:*', 'customers:read', 'customers:update',
          'communications:*', 'quotes:read', 'quotes:create'
        ],
        metadata: {
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          level: 40
        }
      },
      {
        id: 'customer',
        name: 'Customer',
        description: 'Customer access to own bookings and profile',
        permissions: [
          'profile:read', 'profile:update',
          'bookings:read:own', 'bookings:create',
          'communications:read:own', 'quotes:read:own'
        ],
        metadata: {
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          level: 20
        }
      }
    ];

    systemRoles.forEach(role => {
      this.roleRegistry.set(role.id, role);
    });
  }

  private initializeSystemPermissions(): void {
    const systemPermissions: Permission[] = [
      // User Management
      {
        id: 'users:read',
        resource: 'users',
        action: 'read',
        scope: 'global',
        effect: 'allow',
        priority: 100
      },
      {
        id: 'users:create',
        resource: 'users',
        action: 'create',
        scope: 'global',
        effect: 'allow',
        priority: 100,
        conditions: [
          { type: 'mfa', operator: 'equals', value: true }
        ]
      },
      // Booking Management with conditions
      {
        id: 'bookings:read:own',
        resource: 'bookings',
        action: 'read',
        scope: 'own',
        effect: 'allow',
        priority: 50
      },
      {
        id: 'bookings:create',
        resource: 'bookings',
        action: 'create',
        scope: 'own',
        effect: 'allow',
        priority: 50,
        conditions: [
          { type: 'time', operator: 'greater_than', value: '08:00', context: 'business_hours' },
          { type: 'time', operator: 'less_than', value: '18:00', context: 'business_hours' }
        ]
      },
      // Sensitive operations requiring high security
      {
        id: 'financial:read',
        resource: 'financial',
        action: 'read',
        scope: 'global',
        effect: 'allow',
        priority: 200,
        conditions: [
          { type: 'mfa', operator: 'equals', value: true },
          { type: 'device', operator: 'equals', value: true, context: 'trusted' },
          { type: 'location', operator: 'in', value: ['office', 'secure'], context: 'location_type' }
        ]
      }
    ];

    systemPermissions.forEach(permission => {
      this.permissionRegistry.set(permission.id, permission);
    });
  }

  // Check access with advanced conditions
  async checkAccess(user: User, request: AccessRequest): Promise<AccessResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(user.id, request);
    
    // Check cache first
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return { ...cached.result, cached: true };
    }

    try {
      // Get all permissions for user
      const userPermissions = await this.getUserPermissions(user);
      
      // Find applicable permissions
      const applicablePermissions = userPermissions.filter(permission => 
        this.isPermissionApplicable(permission, request)
      );

      // Sort by priority (higher priority first)
      applicablePermissions.sort((a, b) => b.priority - a.priority);

      // Evaluate conditions for each permission
      let granted = false;
      let reason = 'No matching permissions found';
      const requiredConditions: string[] = [];

      for (const permission of applicablePermissions) {
        const conditionResult = await this.evaluateConditions(
          permission.conditions || [], 
          request.context
        );

        if (permission.effect === 'deny') {
          if (conditionResult.passed) {
            granted = false;
            reason = `Access explicitly denied by permission: ${permission.id}`;
            break;
          }
        } else if (permission.effect === 'allow') {
          if (conditionResult.passed) {
            granted = true;
            reason = `Access granted by permission: ${permission.id}`;
            break;
          } else {
            requiredConditions.push(...conditionResult.failedConditions);
          }
        }
      }

      const result: AccessResult = {
        granted,
        reason,
        requiredConditions: requiredConditions.length > 0 ? requiredConditions : undefined,
        permissions: applicablePermissions,
        cached: false,
        evaluationTime: Date.now() - startTime
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      // Audit log the access check
      await auditLogger.log({
        userId: user.id,
        action: 'permission_check',
        category: 'Authorization',
        details: {
          resource: request.resource,
          action: request.action,
          granted,
          reason,
          evaluationTime: result.evaluationTime
        },
        riskScore: granted ? 10 : 40
      });

      return result;

    } catch (error) {
      await auditLogger.log({
        userId: user.id,
        action: 'permission_check_error',
        category: 'Authorization',
        details: {
          resource: request.resource,
          action: request.action,
          error: error.message
        },
        riskScore: 80
      });

      return {
        granted: false,
        reason: 'Permission evaluation error',
        permissions: [],
        cached: false,
        evaluationTime: Date.now() - startTime
      };
    }
  }

  // Get all permissions for a user (including inherited)
  private async getUserPermissions(user: User): Promise<Permission[]> {
    const permissions: Permission[] = [];
    
    // Get direct permissions
    for (const permissionId of user.directPermissions) {
      const permission = this.permissionRegistry.get(permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }

    // Get role-based permissions
    for (const roleId of user.roles) {
      const rolePermissions = await this.getRolePermissions(roleId);
      permissions.push(...rolePermissions);
    }

    // Remove duplicates and sort by priority
    const uniquePermissions = permissions.filter((permission, index, array) => 
      array.findIndex(p => p.id === permission.id) === index
    );

    return uniquePermissions.sort((a, b) => b.priority - a.priority);
  }

  // Get permissions for a role (including inherited)
  private async getRolePermissions(roleId: string): Promise<Permission[]> {
    const permissions: Permission[] = [];
    const role = this.roleRegistry.get(roleId);
    
    if (!role) return permissions;

    // Process inherited roles first
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedPermissions = await this.getRolePermissions(inheritedRoleId);
        permissions.push(...inheritedPermissions);
      }
    }

    // Process direct permissions
    for (const permissionId of role.permissions) {
      if (permissionId === '*') {
        // Wildcard permission - add all permissions
        permissions.push(...Array.from(this.permissionRegistry.values()));
      } else if (permissionId.includes('*')) {
        // Pattern matching for permissions
        const pattern = permissionId.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        
        for (const [id, permission] of this.permissionRegistry) {
          if (regex.test(id)) {
            permissions.push(permission);
          }
        }
      } else {
        const permission = this.permissionRegistry.get(permissionId);
        if (permission) {
          permissions.push(permission);
        }
      }
    }

    return permissions;
  }

  // Check if permission applies to the request
  private isPermissionApplicable(permission: Permission, request: AccessRequest): boolean {
    // Check resource match
    if (permission.resource !== '*' && permission.resource !== request.resource) {
      return false;
    }

    // Check action match
    if (permission.action !== '*' && permission.action !== request.action) {
      return false;
    }

    // Check scope if applicable
    if (permission.scope === 'own' && request.resourceData) {
      // Resource must belong to the user
      return request.resourceData.userId === request.context.userId ||
             request.resourceData.ownerId === request.context.userId;
    }

    return true;
  }

  // Evaluate permission conditions
  private async evaluateConditions(
    conditions: PermissionCondition[], 
    context: UserContext
  ): Promise<{ passed: boolean; failedConditions: string[] }> {
    const failedConditions: string[] = [];

    for (const condition of conditions) {
      const passed = await this.evaluateCondition(condition, context);
      if (!passed) {
        failedConditions.push(this.getConditionDescription(condition));
      }
    }

    return {
      passed: failedConditions.length === 0,
      failedConditions
    };
  }

  // Evaluate a single condition
  private async evaluateCondition(
    condition: PermissionCondition, 
    context: UserContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'mfa':
        return this.evaluateMFACondition(condition, context);
      
      case 'time':
        return this.evaluateTimeCondition(condition, context);
      
      case 'location':
        return this.evaluateLocationCondition(condition, context);
      
      case 'device':
        return this.evaluateDeviceCondition(condition, context);
      
      case 'custom':
        return this.evaluateCustomCondition(condition, context);
      
      default:
        return false;
    }
  }

  // Condition evaluation methods
  private evaluateMFACondition(condition: PermissionCondition, context: UserContext): boolean {
    switch (condition.operator) {
      case 'equals':
        return context.mfa.verified === condition.value;
      default:
        return false;
    }
  }

  private evaluateTimeCondition(condition: PermissionCondition, context: UserContext): boolean {
    const now = new Date();
    const currentTime = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    
    switch (condition.operator) {
      case 'greater_than':
        return currentTime >= condition.value;
      case 'less_than':
        return currentTime <= condition.value;
      default:
        return false;
    }
  }

  private evaluateLocationCondition(condition: PermissionCondition, context: UserContext): boolean {
    // This would integrate with a location service
    switch (condition.operator) {
      case 'in':
        return condition.value.includes('office'); // Simplified
      default:
        return false;
    }
  }

  private evaluateDeviceCondition(condition: PermissionCondition, context: UserContext): boolean {
    switch (condition.operator) {
      case 'equals':
        if (condition.context === 'trusted') {
          return context.device.trusted === condition.value;
        }
        return false;
      default:
        return false;
    }
  }

  private evaluateCustomCondition(condition: PermissionCondition, context: UserContext): boolean {
    // Custom condition evaluation logic
    return true;
  }

  // Utility methods
  private generateCacheKey(userId: string, request: AccessRequest): string {
    return `${userId}:${request.resource}:${request.action}:${JSON.stringify(request.resourceData || {})}`;
  }

  private cacheResult(key: string, result: AccessResult): void {
    const expires = Date.now() + (5 * 60 * 1000); // 5 minutes
    this.permissionCache.set(key, { result, expires });
  }

  private getConditionDescription(condition: PermissionCondition): string {
    switch (condition.type) {
      case 'mfa':
        return 'Multi-factor authentication required';
      case 'time':
        return `Access allowed during business hours (${condition.value})`;
      case 'location':
        return 'Access restricted to secure locations';
      case 'device':
        return 'Trusted device required';
      default:
        return 'Additional security requirements';
    }
  }

  // Admin methods for role management
  async createRole(role: Omit<Role, 'metadata'>): Promise<Role> {
    const newRole: Role = {
      ...role,
      metadata: {
        isSystem: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'admin', // Should be actual user ID
        level: 50 // Default level
      }
    };

    this.roleRegistry.set(role.id, newRole);
    
    await auditLogger.log({
      userId: 'admin',
      action: 'role_created',
      category: 'Security',
      details: { roleId: role.id, roleName: role.name },
      riskScore: 30
    });

    return newRole;
  }

  async assignRole(userId: string, roleId: string): Promise<boolean> {
    // Implementation would update user roles in database
    await auditLogger.log({
      userId,
      action: 'role_assigned',
      category: 'Authorization',
      details: { roleId },
      riskScore: 40
    });

    return true;
  }

  // Clear cache for user
  clearUserCache(userId: string): void {
    for (const [key] of this.permissionCache) {
      if (key.startsWith(userId + ':')) {
        this.permissionCache.delete(key);
      }
    }
  }

  // Get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.permissionCache.size,
      hitRate: 0.85 // Mock hit rate
    };
  }
}

// Create singleton instance
export const advancedRBAC = new AdvancedRBACService();

// React hook for permission checking
export function usePermissions() {
  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const checkPermission = React.useCallback(async (
    resource: string, 
    action: string, 
    resourceData?: any
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Get current user and context
      const user = getCurrentUser(); // Implementation needed
      const context = getCurrentContext(); // Implementation needed
      
      const result = await advancedRBAC.checkAccess(user, {
        resource,
        action,
        resourceData,
        context
      });
      
      return result.granted;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const hasPermission = React.useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  return {
    permissions,
    loading,
    checkPermission,
    hasPermission
  };
}

// Utility functions (implementations needed)
function getCurrentUser(): User {
  // Implementation needed - get from auth context
  return {} as User;
}

function getCurrentContext(): UserContext {
  // Implementation needed - build from current session
  return {} as UserContext;
}

export default advancedRBAC;