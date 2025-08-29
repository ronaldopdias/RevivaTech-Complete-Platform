/**
 * RevivaTech Admin Users API - Prisma Version
 * User management with admin role controls
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { prisma } = require('../../lib/prisma');
const router = express.Router();

// Helper function to hash passwords
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Helper function to generate verification token
const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// GET /api/admin/users - List all users with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            role,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Build Prisma where clause
        const whereClause = {};
        
        // Search filter
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Role filter
        if (role && role !== 'all') {
            whereClause.role = role.toUpperCase();
        }

        // Status filter (based on user activity and verification)
        if (status) {
            switch (status.toLowerCase()) {
                case 'active':
                    whereClause.isActive = true;
                    whereClause.isVerified = true;
                    break;
                case 'inactive':
                    whereClause.isActive = false;
                    break;
                case 'unverified':
                    whereClause.isVerified = false;
                    break;
                case 'locked':
                    whereClause.lockedUntil = { not: null };
                    break;
            }
        }

        // Get total count for pagination
        const totalUsers = await prisma.user.count({ where: whereClause });

        // Get users with sorting
        const orderByClause = {};
        orderByClause[sortBy] = sortOrder.toLowerCase();

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: orderByClause,
            take: parseInt(limit),
            skip: parseInt(offset),
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                isVerified: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                lockedUntil: true,
                loginAttempts: true,
                _count: {
                    select: {
                        sessions: true,
                        bookings: true
                    }
                }
            }
        });

        // Transform users data
        const transformedUsers = users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            isLocked: user.lockedUntil && new Date(user.lockedUntil) > new Date(),
            lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            loginAttempts: user.loginAttempts || 0,
            activeSessionsCount: user._count.sessions,
            bookingsCount: user._count.bookings,
            status: getUserStatus(user)
        }));

        res.json({
            success: true,
            data: transformedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit),
                hasNext: offset + parseInt(limit) < totalUsers,
                hasPrev: parseInt(page) > 1
            },
            filters: {
                search: search || null,
                role: role || 'all',
                status: status || 'all'
            }
        });

    } catch (error) {
        console.error('Admin users list error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

// Helper function to determine user status
function getUserStatus(user) {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        return 'locked';
    }
    if (!user.isVerified) {
        return 'unverified';
    }
    if (!user.isActive) {
        return 'inactive';
    }
    return 'active';
}

// GET /api/admin/users/:id - Get single user details
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sessions: {
                    select: {
                        id: true,
                        sessionToken: true,
                        expires: true
                    },
                    orderBy: { expires: 'desc' }
                },
                bookings: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        finalPrice: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: {
                        sessions: true,
                        bookings: true
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

        // Transform user data
        const transformedUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            isLocked: user.lockedUntil && new Date(user.lockedUntil) > new Date(),
            lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            loginAttempts: user.loginAttempts || 0,
            lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
            phone: user.phone,
            status: getUserStatus(user),
            stats: {
                totalSessions: user._count.sessions,
                totalBookings: user._count.bookings,
                activeSessions: user.sessions.filter(s => 
                    s.expires && new Date(s.expires) > new Date()
                ).length
            },
            recentBookings: user.bookings.map(booking => ({
                id: booking.id,
                status: booking.status,
                createdAt: booking.createdAt.toISOString(),
                amount: parseFloat(booking.finalPrice || 0)
            })),
            activeSessions: user.sessions.filter(s => 
                s.expires && new Date(s.expires) > new Date()
            ).map(session => ({
                id: session.id,
                sessionToken: session.sessionToken,
                expiresAt: session.expires.toISOString()
            }))
        };

        res.json({
            success: true,
            data: transformedUser
        });

    } catch (error) {
        console.error('Admin user details error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user details',
            message: error.message
        });
    }
});

// POST /api/admin/users - Create new user
router.post('/', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            username,
            password,
            role = 'CUSTOMER',
            phone,
            isActive = true,
            isVerified = false,
            sendWelcomeEmail = true
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'firstName, lastName, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { username: username?.toLowerCase() }
                ].filter(Boolean)
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'A user with this email or username already exists'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: email.toLowerCase(),
                username: username?.toLowerCase(),
                password_hash: hashedPassword,
                role: role.toUpperCase(),
                phone,
                isActive,
                isVerified,
                loginAttempts: 0
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                phone: true
            }
        });

        // TODO: Send welcome email if requested
        if (sendWelcomeEmail && !isVerified) {
            // Integration with email service would go here
            console.log(`TODO: Send welcome email to ${email}`);
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                ...newUser,
                fullName: `${newUser.firstName} ${newUser.lastName}`.trim(),
                createdAt: newUser.createdAt.toISOString(),
                status: getUserStatus(newUser)
            }
        });

    } catch (error) {
        console.error('Admin user creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
            message: error.message
        });
    }
});

// PUT /api/admin/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const {
            firstName,
            lastName,
            email,
            username,
            role,
            phone,
            isActive,
            isVerified
        } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check for email/username conflicts (excluding current user)
        if (email || username) {
            const conflictUser = await prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: userId } },
                        {
                            OR: [
                                email ? { email: email.toLowerCase() } : {},
                                username ? { username: username.toLowerCase() } : {}
                            ].filter(condition => Object.keys(condition).length > 0)
                        }
                    ]
                }
            });

            if (conflictUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Conflict detected',
                    message: 'Email or username is already in use by another user'
                });
            }
        }

        // Build update data
        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email.toLowerCase();
        if (username !== undefined) updateData.username = username?.toLowerCase();
        if (role !== undefined) updateData.role = role.toUpperCase();
        if (phone !== undefined) updateData.phone = phone;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isVerified !== undefined) updateData.isVerified = isVerified;

        updateData.updatedAt = new Date();

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                isVerified: true,
                phone: true,
                updatedAt: true,
                lockedUntil: true,
                loginAttempts: true
            }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                ...updatedUser,
                fullName: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
                updatedAt: updatedUser.updatedAt.toISOString(),
                status: getUserStatus(updatedUser),
                isLocked: updatedUser.lockedUntil && new Date(updatedUser.lockedUntil) > new Date()
            }
        });

    } catch (error) {
        console.error('Admin user update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
            message: error.message
        });
    }
});

// DELETE /api/admin/users/:id - Delete user (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { hardDelete = false } = req.query;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Prevent deletion of admin users (safety check)
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Cannot delete admin users',
                message: 'Admin users cannot be deleted for security reasons'
            });
        }

        if (hardDelete === 'true') {
            // Hard delete - actually remove from database
            await prisma.user.delete({
                where: { id: userId }
            });

            res.json({
                success: true,
                message: 'User permanently deleted',
                data: { deletedUserId: userId, type: 'hard_delete' }
            });
        } else {
            // Soft delete - deactivate user
            const deactivatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    isActive: false,
                    updatedAt: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    updatedAt: true
                }
            });

            res.json({
                success: true,
                message: 'User deactivated successfully',
                data: {
                    ...deactivatedUser,
                    updatedAt: deactivatedUser.updatedAt.toISOString(),
                    type: 'soft_delete'
                }
            });
        }

    } catch (error) {
        console.error('Admin user deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
            message: error.message
        });
    }
});

// GET /api/admin/users/stats/summary - Get user statistics summary
router.get('/stats/summary', async (req, res) => {
    try {
        // Get user statistics using Prisma aggregations
        const [
            totalUsers,
            activeUsers,
            verifiedUsers,
            lockedUsers,
            usersByRole,
            recentUsers
        ] = await Promise.all([
            // Total users
            prisma.user.count(),
            
            // Active users
            prisma.user.count({
                where: { isActive: true }
            }),
            
            // Verified users
            prisma.user.count({
                where: { isVerified: true }
            }),
            
            // Locked users
            prisma.user.count({
                where: {
                    lockedUntil: {
                        gt: new Date()
                    }
                }
            }),
            
            // Users by role
            prisma.user.groupBy({
                by: ['role'],
                _count: {
                    id: true
                }
            }),
            
            // Recent users (last 7 days)
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);

        // Transform role statistics
        const roleStats = {};
        usersByRole.forEach(group => {
            roleStats[group.role.toLowerCase()] = group._count.id;
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
                lockedUsers,
                recentUsers,
                roleDistribution: {
                    customer: roleStats.customer || 0,
                    technician: roleStats.technician || 0,
                    admin: roleStats.admin || 0,
                    super_admin: roleStats.super_admin || 0
                },
                percentages: {
                    activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0',
                    verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : '0.0',
                    lockRate: totalUsers > 0 ? ((lockedUsers / totalUsers) * 100).toFixed(1) : '0.0'
                },
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Admin user stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics',
            message: error.message
        });
    }
});

module.exports = router;