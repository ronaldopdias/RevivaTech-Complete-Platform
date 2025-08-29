/**
 * Advanced Role Management API Routes
 * Provides comprehensive role and permission management
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../lib/prisma');
const { requireAuth: authenticateToken } = require('../lib/auth-utils');
const rolesService = require('../lib/advanced-roles-service');

const router = express.Router();

// Apply authentication to all role management routes
router.use(authenticateToken);

/**
 * GET /api/roles - List all available roles
 */
router.get('/', rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        roleAssignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        _count: {
          select: { roleAssignments: true }
        }
      },
      orderBy: [
        { isSystemRole: 'desc' }, // System roles first
        { name: 'asc' }
      ]
    });

    const rolesWithEffectivePermissions = await Promise.all(
      roles.map(async (role) => {
        const effectivePermissions = await rolesService.getRoleEffectivePermissions(role.name);
        return {
          ...role,
          effectivePermissions,
          userCount: role._count.roleAssignments
        };
      })
    );

    res.json({
      success: true,
      data: rolesWithEffectivePermissions,
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve roles',
      message: error.message
    });
  }
});

/**
 * GET /api/roles/permissions - List all available permissions
 */
router.get('/permissions', rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const permissions = Object.entries(rolesService.CORE_PERMISSIONS).map(([key, description]) => ({
      permission: key,
      description,
      category: key.split('.')[0] // Extract category (users, bookings, etc.)
    }));

    // Group by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        permissions: groupedPermissions,
        categories: Object.keys(groupedPermissions)
      },
      message: 'Permissions retrieved successfully'
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve permissions',
      message: error.message
    });
  }
});

/**
 * GET /api/roles/:roleId - Get specific role details
 */
router.get('/:roleId', [
  param('roleId').notEmpty().withMessage('Role ID is required')
], rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roleId } = req.params;
    
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        roleAssignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: `Role with ID '${roleId}' does not exist`
      });
    }

    const effectivePermissions = await rolesService.getRoleEffectivePermissions(role.name);
    const inheritedRoles = rolesService.getInheritedRoles(role.name);

    res.json({
      success: true,
      data: {
        ...role,
        effectivePermissions,
        inheritedRoles,
        userCount: role.roleAssignments.length
      },
      message: 'Role details retrieved successfully'
    });
  } catch (error) {
    console.error('Get role details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve role details',
      message: error.message
    });
  }
});

/**
 * POST /api/roles - Create custom role
 */
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[A-Z][A-Z0-9_]*$/)
    .withMessage('Role name must be uppercase, start with letter, and contain only letters, numbers, and underscores'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('At least one permission must be specified')
], rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, displayName, description, permissions } = req.body;
    
    const newRole = await rolesService.createCustomRole(name, displayName, description, permissions);
    
    res.status(201).json({
      success: true,
      data: newRole,
      message: 'Custom role created successfully'
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create role',
      message: error.message
    });
  }
});

/**
 * PUT /api/roles/:roleId - Update role
 */
router.put('/:roleId', [
  param('roleId').notEmpty().withMessage('Role ID is required'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('permissions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one permission must be specified')
], rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roleId } = req.params;
    const { displayName, description, permissions } = req.body;

    // Check if role exists and is not a system role
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    if (existingRole.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system roles'
      });
    }

    // Validate permissions if provided
    if (permissions) {
      const invalidPermissions = permissions.filter(p => !rolesService.CORE_PERMISSIONS[p]);
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions',
          details: invalidPermissions
        });
      }
    }

    // Update role
    const updateData = { updatedAt: new Date() };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
      message: error.message
    });
  }
});

/**
 * DELETE /api/roles/:roleId - Delete custom role
 */
router.delete('/:roleId', [
  param('roleId').notEmpty().withMessage('Role ID is required')
], rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roleId } = req.params;

    // Check if role exists and is not a system role
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { roleAssignments: true }
        }
      }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    if (existingRole.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system roles'
      });
    }

    if (existingRole._count.roleAssignments > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role with active assignments',
        message: `Role has ${existingRole._count.roleAssignments} active assignments`
      });
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
      message: error.message
    });
  }
});

/**
 * POST /api/roles/:roleId/assign - Assign role to user
 */
router.post('/:roleId/assign', [
  param('roleId').notEmpty().withMessage('Role ID is required'),
  body('userId').notEmpty().withMessage('User ID is required')
], rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roleId } = req.params;
    const { userId } = req.body;

    // Get role name
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    const assignment = await rolesService.assignRoleToUser(userId, role.name, req.user.id);
    
    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Role assigned successfully'
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to assign role',
      message: error.message
    });
  }
});

/**
 * DELETE /api/roles/:roleId/assign/:userId - Remove role from user
 */
router.delete('/:roleId/assign/:userId', [
  param('roleId').notEmpty().withMessage('Role ID is required'),
  param('userId').notEmpty().withMessage('User ID is required')
], rolesService.requirePermissions(['users.roles.manage']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { roleId, userId } = req.params;

    // Get role name
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    await rolesService.removeRoleFromUser(userId, role.name);
    
    res.json({
      success: true,
      message: 'Role removed successfully'
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to remove role',
      message: error.message
    });
  }
});

/**
 * GET /api/roles/user/:userId/permissions - Get user's effective permissions
 */
router.get('/user/:userId/permissions', [
  param('userId').notEmpty().withMessage('User ID is required')
], rolesService.requireAnyPermission(['users.roles.manage', 'users.read']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;

    const effectivePermissions = await rolesService.getUserEffectivePermissions(userId);
    
    // Get user's role assignments for context
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

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: userId,
        effectivePermissions,
        roles: user.roleAssignments.map(assignment => ({
          id: assignment.role.id,
          name: assignment.role.name,
          displayName: assignment.role.displayName,
          assignedAt: assignment.assignedAt
        }))
      },
      message: 'User permissions retrieved successfully'
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user permissions',
      message: error.message
    });
  }
});

module.exports = router;