/**
 * RevivaTech Admin Users API
 * User management with admin role controls
 */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'revivatech_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'revivatech_new',
    password: process.env.DB_PASSWORD || 'secure_password_2024',
    port: process.env.DB_PORT || 5435,
});

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
            sortBy = '"createdAt"',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions
        if (search) {
            whereConditions.push(`("firstName" ILIKE $${paramIndex} OR "lastName" ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            whereConditions.push(`role = $${paramIndex}`);
            queryParams.push(role);
            paramIndex++;
        }

        if (status) {
            whereConditions.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Count total records
        const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalRecords = parseInt(countResult.rows[0].count);

        // Get users with pagination (excluding password_hash and reset tokens)
        const query = `
            SELECT 
                id, email, "firstName", "lastName", phone, role, "isActive" as status,
                "isVerified" as email_verified, "lastLoginAt" as last_login, "createdAt" as created_at, "updatedAt" as updated_at
            FROM users 
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const result = await pool.query(query, queryParams);

        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / limit),
                    totalRecords,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            details: error.message
        });
    }
});

// GET /api/admin/users/:id - Get single user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                id, email, "firstName", "lastName", phone, role, "isActive" as status,
                email_verified, verification_token, last_login, created_at, updated_at
            FROM users 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user session information
        const sessionQuery = `
            SELECT COUNT(*) as active_sessions, MAX(last_used) as last_session
            FROM user_sessions 
            WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
        `;
        
        const sessionResult = await pool.query(sessionQuery, [id]);

        const userData = {
            ...result.rows[0],
            session_info: sessionResult.rows[0]
        };

        res.json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
            details: error.message
        });
    }
});

// POST /api/admin/users - Create new user
router.post('/', async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            last_name,
            phone,
            role = 'customer',
            status = 'active',
            email_verified = false
        } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, first name, and last name are required'
            });
        }

        if (!['customer', 'technician', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be customer, technician, or admin'
            });
        }

        // Check if email already exists
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            });
        }

        // Hash password
        const password_hash = await hashPassword(password);
        const verification_token = email_verified ? null : generateToken();

        const query = `
            INSERT INTO users (
                email, password_hash, "firstName", "lastName", phone,
                role, status, email_verified, verification_token
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, email, "firstName", "lastName", phone, role, "isActive" as status, "isVerified" as email_verified, "createdAt"
        `;

        const values = [
            email, password_hash, "firstName", "lastName", phone,
            role, status, email_verified, verification_token
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
            details: error.message
        });
    }
});

// PUT /api/admin/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email,
            firstName,
            last_name,
            phone,
            role,
            status,
            email_verified
        } = req.body;

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (email !== undefined) {
            // Check if new email already exists for another user
            const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already exists'
                });
            }
            updateFields.push(`email = $${paramIndex}`);
            values.push(email);
            paramIndex++;
        }

        if (firstName !== undefined) {
            updateFields.push(`"firstName" = $${paramIndex}`);
            values.push(firstName);
            paramIndex++;
        }

        if (last_name !== undefined) {
            updateFields.push(`last_name = $${paramIndex}`);
            values.push(last_name);
            paramIndex++;
        }

        if (phone !== undefined) {
            updateFields.push(`phone = $${paramIndex}`);
            values.push(phone);
            paramIndex++;
        }

        if (role !== undefined) {
            if (!['customer', 'technician', 'admin'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid role. Must be customer, technician, or admin'
                });
            }
            updateFields.push(`role = $${paramIndex}`);
            values.push(role);
            paramIndex++;
        }

        if (status !== undefined) {
            if (!['active', 'suspended', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be active, suspended, or inactive'
                });
            }
            updateFields.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        if (email_verified !== undefined) {
            updateFields.push(`email_verified = $${paramIndex}`);
            values.push(email_verified);
            paramIndex++;
            
            // Clear verification token if email is verified
            if (email_verified) {
                updateFields.push(`verification_token = NULL`);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, email, "firstName", "lastName", phone, role, "isActive" as status, "isVerified" as email_verified, "updatedAt"
        `;

        values.push(id);
        const result = await pool.query(query, values);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
            details: error.message
        });
    }
});

// PUT /api/admin/users/:id/password - Update user password
router.put('/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long'
            });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Hash new password
        const password_hash = await hashPassword(new_password);

        const query = `
            UPDATE users 
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;

        await pool.query(query, [password_hash, id]);

        // Invalidate all user sessions
        await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);

        res.json({
            success: true,
            message: 'Password updated successfully. User will need to log in again.'
        });

    } catch (error) {
        console.error('❌ Error updating password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update password',
            details: error.message
        });
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent = false } = req.query;

        // Check if user exists
        const userCheck = await pool.query('SELECT email, "firstName", "lastName" FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userCheck.rows[0];

        if (permanent === 'true') {
            // Permanent deletion - remove all related data
            await pool.query('BEGIN');
            
            try {
                // Delete user sessions
                await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);
                
                // Update user-related records to remove foreign key references
                // (In production, you might want to keep these records for audit purposes)
                await pool.query('UPDATE bookings SET customer_id = NULL WHERE customer_id = $1', [id]);
                await pool.query('UPDATE notifications SET user_id = NULL WHERE user_id = $1', [id]);
                
                // Delete the user
                await pool.query('DELETE FROM users WHERE id = $1', [id]);
                
                await pool.query('COMMIT');

                res.json({
                    success: true,
                    message: `User ${user.email} permanently deleted`
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } else {
            // Soft deletion - deactivate account
            await pool.query(`
                UPDATE users 
                SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [id]);

            // Invalidate all user sessions
            await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);

            res.json({
                success: true,
                message: `User ${user.email} deactivated`,
                data: { user_id: id, email: user.email }
            });
        }

    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
            details: error.message
        });
    }
});

// POST /api/admin/users/:id/verify-email - Manually verify user email
router.post('/:id/verify-email', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE users 
            SET email_verified = true, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING email, "firstName", "lastName"
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            message: `Email verified for ${user.firstName} ${user.lastName} (${user.email})`,
            data: { user_id: id, email: user.email }
        });

    } catch (error) {
        console.error('❌ Error verifying email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify email',
            details: error.message
        });
    }
});

// POST /api/admin/users/:id/send-reset-link - Send password reset link
router.post('/:id/send-reset-link', async (req, res) => {
    try {
        const { id } = req.params;

        // Generate reset token
        const reset_token = generateToken();
        const reset_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const result = await pool.query(`
            UPDATE users 
            SET reset_token = $1, reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING email, "firstName", "lastName"
        `, [reset_token, reset_token_expires, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = result.rows[0];

        // TODO: Send actual email with reset link
        // For now, just return the token (in production, this would be sent via email)
        
        res.json({
            success: true,
            message: `Password reset link generated for ${user.email}`,
            data: { 
                user_id: id, 
                email: user.email,
                reset_token: reset_token, // Remove this in production
                expires_at: reset_token_expires
            }
        });

    } catch (error) {
        console.error('❌ Error sending reset link:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reset link',
            details: error.message
        });
    }
});

// GET /api/admin/users/stats/summary - Get user statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE role = 'customer') as customer_count,
                COUNT(*) FILTER (WHERE role = 'technician') as technician_count,
                COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
                COUNT(*) FILTER (WHERE status = 'active') as active_count,
                COUNT(*) FILTER (WHERE status = 'suspended') as suspended_count,
                COUNT(*) FILTER (WHERE status = 'inactive') as inactive_count,
                COUNT(*) FILTER (WHERE email_verified = true) as verified_count,
                COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') as recent_login_count,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week
            FROM users
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics',
            details: error.message
        });
    }
});

// GET /api/admin/users/:id/sessions - Get user active sessions
router.get('/:id/sessions', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id, device_info, ip_address, created_at, last_used, expires_at
            FROM user_sessions 
            WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
            ORDER BY last_used DESC
        `;

        const result = await pool.query(query, [id]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching user sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user sessions',
            details: error.message
        });
    }
});

// DELETE /api/admin/users/:id/sessions - Revoke all user sessions
router.delete('/:id/sessions', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            DELETE FROM user_sessions 
            WHERE user_id = $1
            RETURNING COUNT(*)
        `, [id]);

        res.json({
            success: true,
            message: 'All user sessions revoked',
            data: { sessions_revoked: result.rowCount }
        });

    } catch (error) {
        console.error('❌ Error revoking sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to revoke user sessions',
            details: error.message
        });
    }
});

module.exports = router;