/**
 * RevivaTech Admin Procedures API (Compatible with existing schema)
 * CRUD operations for repair procedures management
 */

const express = require('express');
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

// Helper function to map difficulty level to string
const getDifficultyString = (level) => {
    switch (level) {
        case 1: return 'Beginner';
        case 2: return 'Intermediate';
        case 3: return 'Advanced';
        case 4: return 'Expert';
        case 5: return 'Expert';
        default: return 'Unknown';
    }
};

// Helper function to map difficulty string to level
const getDifficultyLevel = (difficulty) => {
    switch (difficulty) {
        case 'Beginner': return 1;
        case 'Intermediate': return 2;
        case 'Advanced': return 3;
        case 'Expert': return 4;
        default: return 2; // Default to Intermediate
    }
};

// GET /api/admin/procedures - List all procedures with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            difficulty,
            status,
            sortBy = 'updated_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions
        if (search) {
            whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR overview ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (category) {
            whereConditions.push(`repair_type = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }

        if (difficulty) {
            const difficultyLevel = getDifficultyLevel(difficulty);
            whereConditions.push(`difficulty_level = $${paramIndex}`);
            queryParams.push(difficultyLevel);
            paramIndex++;
        }

        if (status) {
            whereConditions.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Count total records
        const countQuery = `SELECT COUNT(*) FROM repair_procedures ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalRecords = parseInt(countResult.rows[0].count);

        // Get procedures with pagination
        const query = `
            SELECT 
                id,
                uuid as procedure_id,
                title,
                description,
                overview,
                device_compatibility,
                repair_type as category,
                difficulty_level,
                estimated_time_minutes,
                success_rate,
                view_count,
                status,
                diagnostic_tags as tags,
                created_at,
                updated_at,
                tools_required,
                parts_required,
                safety_warnings
            FROM repair_procedures 
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const result = await pool.query(query, queryParams);

        // Transform the results to match expected format
        const transformedResults = result.rows.map(row => ({
            ...row,
            difficulty: getDifficultyString(row.difficulty_level),
            video_count: 0, // Not tracked in current schema
            image_count: 0  // Not tracked in current schema
        }));

        res.json({
            success: true,
            data: {
                procedures: transformedResults,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / limit),
                    totalRecords,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Error fetching procedures:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch procedures',
            details: error.message
        });
    }
});

// GET /api/admin/procedures/:id - Get single procedure by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                *,
                uuid as procedure_id
            FROM repair_procedures 
            WHERE id = $1 OR uuid::text = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Procedure not found'
            });
        }

        const procedure = result.rows[0];
        procedure.difficulty = getDifficultyString(procedure.difficulty_level);

        res.json({
            success: true,
            data: procedure
        });

    } catch (error) {
        console.error('❌ Error fetching procedure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch procedure',
            details: error.message
        });
    }
});

// POST /api/admin/procedures - Create new procedure
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            overview,
            device_compatibility = {},
            category,
            difficulty,
            estimated_time_minutes = 60,
            tools_required = {},
            parts_required = {},
            safety_warnings = {},
            status = 'draft'
        } = req.body;

        // Validation
        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }

        const difficulty_level = getDifficultyLevel(difficulty);
        
        const query = `
            INSERT INTO repair_procedures (
                title, description, overview, device_compatibility, repair_type,
                difficulty_level, estimated_time_minutes, tools_required, 
                parts_required, safety_warnings, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            title, description, overview, JSON.stringify(device_compatibility), category,
            difficulty_level, estimated_time_minutes, JSON.stringify(tools_required),
            JSON.stringify(parts_required), JSON.stringify(safety_warnings), status
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Procedure created successfully'
        });

    } catch (error) {
        console.error('❌ Error creating procedure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create procedure',
            details: error.message
        });
    }
});

// PUT /api/admin/procedures/:id - Update procedure
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            overview,
            device_compatibility,
            category,
            difficulty,
            estimated_time_minutes,
            tools_required,
            parts_required,
            safety_warnings,
            status
        } = req.body;

        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramIndex}`);
            values.push(title);
            paramIndex++;
        }

        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            values.push(description);
            paramIndex++;
        }

        if (overview !== undefined) {
            updateFields.push(`overview = $${paramIndex}`);
            values.push(overview);
            paramIndex++;
        }

        if (device_compatibility !== undefined) {
            updateFields.push(`device_compatibility = $${paramIndex}`);
            values.push(JSON.stringify(device_compatibility));
            paramIndex++;
        }

        if (category !== undefined) {
            updateFields.push(`repair_type = $${paramIndex}`);
            values.push(category);
            paramIndex++;
        }

        if (difficulty !== undefined) {
            updateFields.push(`difficulty_level = $${paramIndex}`);
            values.push(getDifficultyLevel(difficulty));
            paramIndex++;
        }

        if (estimated_time_minutes !== undefined) {
            updateFields.push(`estimated_time_minutes = $${paramIndex}`);
            values.push(estimated_time_minutes);
            paramIndex++;
        }

        if (tools_required !== undefined) {
            updateFields.push(`tools_required = $${paramIndex}`);
            values.push(JSON.stringify(tools_required));
            paramIndex++;
        }

        if (parts_required !== undefined) {
            updateFields.push(`parts_required = $${paramIndex}`);
            values.push(JSON.stringify(parts_required));
            paramIndex++;
        }

        if (safety_warnings !== undefined) {
            updateFields.push(`safety_warnings = $${paramIndex}`);
            values.push(JSON.stringify(safety_warnings));
            paramIndex++;
        }

        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE repair_procedures 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex} OR uuid::text = $${paramIndex}
            RETURNING *
        `;

        values.push(id);
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Procedure not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Procedure updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating procedure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update procedure',
            details: error.message
        });
    }
});

// DELETE /api/admin/procedures/:id - Delete procedure
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            DELETE FROM repair_procedures 
            WHERE id = $1 OR uuid::text = $1
            RETURNING uuid, title
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Procedure not found'
            });
        }

        res.json({
            success: true,
            message: `Procedure "${result.rows[0].title}" deleted successfully`,
            data: { procedure_id: result.rows[0].uuid }
        });

    } catch (error) {
        console.error('❌ Error deleting procedure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete procedure',
            details: error.message
        });
    }
});

// GET /api/admin/procedures/stats/summary - Get procedures statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_procedures,
                COUNT(*) FILTER (WHERE status = 'published') as published_count,
                COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE status = 'archived') as archived_count,
                ROUND(AVG(success_rate), 2) as avg_success_rate,
                SUM(view_count) as total_views,
                COUNT(DISTINCT repair_type) as categories_count,
                COUNT(DISTINCT device_compatibility) as devices_count
            FROM repair_procedures
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching procedure stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch procedure statistics',
            details: error.message
        });
    }
});

module.exports = router;