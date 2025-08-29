/**
 * Advanced Role Management System
 * Implements dynamic permissions, role inheritance, and resource-based access control
 */

const { prisma } = require('./prisma');

class AdvancedRolesService {
  constructor() {
    // Core system permissions
    this.CORE_PERMISSIONS = {
      // User Management
      'users.read': 'View user profiles and information',
      'users.create': 'Create new user accounts',
      'users.update': 'Modify user information',
      'users.delete': 'Delete user accounts',
      'users.roles.manage': 'Assign and modify user roles',
      
      // Booking Management
      'bookings.read': 'View booking information',
      'bookings.create': 'Create new bookings',
      'bookings.update': 'Modify booking details',
      'bookings.delete': 'Cancel or delete bookings',
      'bookings.assign': 'Assign technicians to bookings',
      
      // Device Management
      'devices.read': 'View device information',
      'devices.create': 'Add new devices to catalog',
      'devices.update': 'Modify device information',
      'devices.delete': 'Remove devices from catalog',
      
      // Pricing Management
      'pricing.read': 'View pricing information',
      'pricing.update': 'Modify pricing rules',
      
      // Analytics & Reports
      'analytics.read': 'View analytics and reports',
      'analytics.export': 'Export analytics data',
      
      // System Administration
      'system.settings': 'Modify system settings',
      'system.audit': 'View audit logs',
      'system.maintenance': 'Perform system maintenance',
      
      // Email Management
      'email.templates': 'Manage email templates',
      'email.send': 'Send emails',
      'email.config': 'Configure email settings'
    };

    // Role inheritance hierarchy (child inherits from parent)
    this.ROLE_INHERITANCE = {
      'SUPER_ADMIN': [], // Inherits from no one, has all permissions
      'ADMIN': ['SUPER_ADMIN'], // Inherits from SUPER_ADMIN
      'MANAGER': ['ADMIN'], // Inherits from ADMIN
      'TECHNICIAN': ['MANAGER'], // Inherits from MANAGER for specific permissions
      'CUSTOMER': [] // Base role with minimal permissions
    };
  }

  /**
   * Initialize default roles and permissions
   */
  async initializeRoleSystem() {
    try {
      console.log('[Roles] Initializing advanced role management system...');

      // Create default roles with their base permissions
      const defaultRoles = [
        {
          name: 'SUPER_ADMIN',
          displayName: 'Super Administrator',
          description: 'Full system access with all permissions',
          permissions: Object.keys(this.CORE_PERMISSIONS), // All permissions
          isSystemRole: true
        },
        {
          name: 'ADMIN',
          displayName: 'Administrator',
          description: 'Administrative access with most permissions',
          permissions: [
            'users.read', 'users.create', 'users.update', 'users.roles.manage',
            'bookings.read', 'bookings.create', 'bookings.update', 'bookings.assign',
            'devices.read', 'devices.create', 'devices.update',
            'pricing.read', 'pricing.update',
            'analytics.read', 'analytics.export',
            'email.templates', 'email.send', 'email.config'
          ],
          isSystemRole: true
        },
        {
          name: 'MANAGER',
          displayName: 'Manager',
          description: 'Management level access for operations',
          permissions: [
            'users.read',
            'bookings.read', 'bookings.create', 'bookings.update', 'bookings.assign',
            'devices.read',
            'pricing.read',
            'analytics.read',
            'email.send'
          ],
          isSystemRole: true
        },
        {
          name: 'TECHNICIAN',
          displayName: 'Technician',
          description: 'Technical staff with repair-focused permissions',
          permissions: [
            'bookings.read', 'bookings.update', // Can view and update assigned bookings
            'devices.read', // Can view device information
            'pricing.read' // Can view pricing for quotes
          ],
          isSystemRole: true
        },
        {
          name: 'CUSTOMER',
          displayName: 'Customer',
          description: 'Customer access with booking permissions',
          permissions: [
            'bookings.read', // Can view their own bookings
            'bookings.create', // Can create new bookings
            'devices.read' // Can view available services
          ],
          isSystemRole: true
        }
      ];

      // Create or update default roles
      for (const roleData of defaultRoles) {
        await prisma.role.upsert({
          where: { name: roleData.name },
          update: {
            displayName: roleData.displayName,
            description: roleData.description,
            permissions: roleData.permissions,
            isSystemRole: roleData.isSystemRole,
            updatedAt: new Date()
          },
          create: roleData
        });
      }

      console.log('[Roles] ✅ Advanced role system initialized successfully');
      return true;
    } catch (error) {
      console.error('[Roles] ❌ Failed to initialize role system:', error);
      return false;
    }
  }

  /**
   * Get effective permissions for a user (including inherited permissions)
   */
  async getUserEffectivePermissions(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleAssignments: {
            include: {
              role: true
            }
          }
        }
      });

      if (!user) return [];

      const allPermissions = new Set();

      // Get permissions from all assigned roles
      for (const assignment of user.roleAssignments) {
        const rolePermissions = await this.getRoleEffectivePermissions(assignment.role.name);
        rolePermissions.forEach(permission => allPermissions.add(permission));
      }

      return Array.from(allPermissions);
    } catch (error) {
      console.error('[Roles] Failed to get user permissions:', error);
      return [];
    }
  }

  /**
   * Get effective permissions for a role (including inherited permissions)
   */
  async getRoleEffectivePermissions(roleName) {
    try {
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) return [];

      const allPermissions = new Set(role.permissions || []);

      // Add inherited permissions
      const inheritedRoles = this.getInheritedRoles(roleName);
      for (const inheritedRoleName of inheritedRoles) {
        const inheritedRole = await prisma.role.findUnique({
          where: { name: inheritedRoleName }
        });
        
        if (inheritedRole && inheritedRole.permissions) {
          inheritedRole.permissions.forEach(permission => allPermissions.add(permission));
        }
      }

      return Array.from(allPermissions);
    } catch (error) {
      console.error('[Roles] Failed to get role permissions:', error);
      return [];
    }
  }

  /**
   * Get all roles that this role inherits from (recursive)
   */
  getInheritedRoles(roleName, visited = new Set()) {
    if (visited.has(roleName)) return []; // Prevent circular inheritance
    visited.add(roleName);

    const inheritedRoles = [];
    const parentRoles = this.ROLE_INHERITANCE[roleName] || [];

    for (const parentRole of parentRoles) {
      inheritedRoles.push(parentRole);
      // Recursively get inherited roles
      const grandparentRoles = this.getInheritedRoles(parentRole, visited);
      inheritedRoles.push(...grandparentRoles);
    }

    return inheritedRoles;
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId, permission) {
    const userPermissions = await this.getUserEffectivePermissions(userId);
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(userId, permissions) {
    const userPermissions = await this.getUserEffectivePermissions(userId);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  async userHasAllPermissions(userId, permissions) {
    const userPermissions = await this.getUserEffectivePermissions(userId);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId, roleName, assignedBy = null) {
    try {
      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        throw new Error(`Role '${roleName}' does not exist`);
      }

      // Check if assignment already exists
      const existingAssignment = await prisma.roleAssignment.findUnique({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: role.id
          }
        }
      });

      if (existingAssignment) {
        throw new Error(`User already has role '${roleName}'`);
      }

      // Create role assignment
      const assignment = await prisma.roleAssignment.create({
        data: {
          userId: userId,
          roleId: role.id,
          assignedBy: assignedBy,
          assignedAt: new Date()
        },
        include: {
          role: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      return assignment;
    } catch (error) {
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId, roleName) {
    try {
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        throw new Error(`Role '${roleName}' does not exist`);
      }

      const deleted = await prisma.roleAssignment.delete({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: role.id
          }
        }
      });

      return deleted;
    } catch (error) {
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }

  /**
   * Create custom role
   */
  async createCustomRole(name, displayName, description, permissions) {
    try {
      // Validate permissions
      const invalidPermissions = permissions.filter(p => !this.CORE_PERMISSIONS[p]);
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }

      const role = await prisma.role.create({
        data: {
          name: name.toUpperCase(),
          displayName,
          description,
          permissions,
          isSystemRole: false,
          createdAt: new Date()
        }
      });

      return role;
    } catch (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }
  }

  /**
   * Generate permission middleware for Express routes
   */
  requirePermissions(permissions) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'MISSING_AUTH'
          });
        }

        const hasPermissions = Array.isArray(permissions)
          ? await this.userHasAllPermissions(req.user.id, permissions)
          : await this.userHasPermission(req.user.id, permissions);

        if (!hasPermissions) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            requiredPermissions: Array.isArray(permissions) ? permissions : [permissions]
          });
        }

        next();
      } catch (error) {
        console.error('[Roles] Permission check error:', error);
        res.status(500).json({
          success: false,
          error: 'Permission check failed',
          code: 'PERMISSION_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * Generate permission middleware for any of the specified permissions
   */
  requireAnyPermission(permissions) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'MISSING_AUTH'
          });
        }

        const hasAnyPermission = await this.userHasAnyPermission(req.user.id, permissions);

        if (!hasAnyPermission) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            requiredPermissions: permissions
          });
        }

        next();
      } catch (error) {
        console.error('[Roles] Permission check error:', error);
        res.status(500).json({
          success: false,
          error: 'Permission check failed',
          code: 'PERMISSION_CHECK_ERROR'
        });
      }
    };
  }
}

module.exports = new AdvancedRolesService();