/**
 * PRISMA MIGRATION: Admin Procedures API
 * Converted from raw SQL to Prisma ORM operations
 * CRUD operations for repair procedures management
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../lib/prisma');
const { authenticateBetterAuth: authenticateToken, requireAdmin } = require('../../middleware/better-auth-official');

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

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'admin-procedures-api',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// GET /api/admin/procedures - List all procedures with filtering and pagination
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
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

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build where clause for Prisma
        const whereClause = {};
        
        // Search filter (title or description)
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Category filter
        if (category) {
            whereClause.category = category;
        }
        
        // Difficulty filter
        if (difficulty) {
            whereClause.difficulty_level = getDifficultyLevel(difficulty);
        }
        
        // Status filter
        if (status) {
            whereClause.status = status;
        }

        // Execute query with Prisma
        const [procedures, totalCount] = await Promise.all([
            prisma.repairProcedure.findMany({
                where: whereClause,
                take: parseInt(limit),
                skip: offset,
                orderBy: {
                    [sortBy]: sortOrder.toLowerCase()
                },
                include: {
                    steps: {
                        orderBy: { step_order: 'asc' }
                    },
                    mediaFiles: {
                        select: {
                            id: true,
                            file_name: true,
                            file_type: true,
                            file_size: true
                        }
                    }
                }
            }),
            prisma.repairProcedure.count({ where: whereClause })
        ]);

        // Format response
        const formattedProcedures = procedures.map(proc => ({
            id: proc.id,
            title: proc.title,
            description: proc.description,
            category: proc.category,
            estimated_time_minutes: proc.estimated_time_minutes,
            difficulty_level: proc.difficulty_level,
            difficulty: getDifficultyString(proc.difficulty_level),
            status: proc.status,
            tools_required: proc.tools_required,
            parts_required: proc.parts_required,
            safety_precautions: proc.safety_precautions,
            prerequisites: proc.prerequisites,
            tips: proc.tips,
            warnings: proc.warnings,
            created_at: proc.created_at,
            updated_at: proc.updated_at,
            created_by: proc.created_by,
            updated_by: proc.updated_by,
            step_count: proc.steps?.length || 0,
            media_count: proc.mediaFiles?.length || 0,
            media_files: proc.mediaFiles
        }));

        res.json({
            success: true,
            data: {
                procedures: formattedProcedures,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalCount / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('List procedures error:', error);
        res.status(500).json({
            error: 'Failed to retrieve procedures',
            code: 'PROCEDURES_LIST_ERROR'
        });
    }
});

// GET /api/admin/procedures/:id - Get specific procedure with steps
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const procedure = await prisma.repairProcedure.findUnique({
            where: { id },
            include: {
                steps: {
                    orderBy: { step_order: 'asc' }
                },
                mediaFiles: true
            }
        });

        if (!procedure) {
            return res.status(404).json({
                error: 'Procedure not found',
                code: 'PROCEDURE_NOT_FOUND'
            });
        }

        // Format response
        const formattedProcedure = {
            ...procedure,
            difficulty: getDifficultyString(procedure.difficulty_level),
            step_count: procedure.steps?.length || 0,
            media_count: procedure.mediaFiles?.length || 0
        };

        res.json({
            success: true,
            data: formattedProcedure
        });

    } catch (error) {
        console.error('Get procedure error:', error);
        res.status(500).json({
            error: 'Failed to retrieve procedure',
            code: 'PROCEDURE_GET_ERROR'
        });
    }
});

// POST /api/admin/procedures - Create new procedure
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            estimated_time_minutes,
            difficulty,
            tools_required,
            parts_required,
            safety_precautions,
            prerequisites,
            tips,
            warnings,
            steps
        } = req.body;

        // Validate required fields
        if (!title || !category) {
            return res.status(400).json({
                error: 'Title and category are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Create procedure with steps in transaction
        const newProcedure = await prisma.$transaction(async (tx) => {
            // Create the procedure
            const procedure = await tx.repairProcedure.create({
                data: {
                    title,
                    description: description || '',
                    category,
                    estimated_time_minutes: parseInt(estimated_time_minutes) || 30,
                    difficulty_level: getDifficultyLevel(difficulty),
                    status: 'draft',
                    tools_required: tools_required || [],
                    parts_required: parts_required || [],
                    safety_precautions: safety_precautions || [],
                    prerequisites: prerequisites || [],
                    tips: tips || [],
                    warnings: warnings || [],
                    created_by: req.user?.id || null,
                    updated_by: req.user?.id || null,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Create steps if provided
            if (steps && Array.isArray(steps) && steps.length > 0) {
                await tx.procedureStep.createMany({
                    data: steps.map((step, index) => ({
                        procedure_id: procedure.id,
                        step_order: index + 1,
                        title: step.title || `Step ${index + 1}`,
                        description: step.description || '',
                        estimated_time_minutes: step.estimated_time_minutes || 5,
                        is_optional: step.is_optional || false,
                        warning_message: step.warning_message || null,
                        success_criteria: step.success_criteria || null,
                        common_mistakes: step.common_mistakes || [],
                        tools_needed: step.tools_needed || [],
                        media_references: step.media_references || []
                    }))
                });
            }

            // Fetch the complete procedure with steps
            return await tx.repairProcedure.findUnique({
                where: { id: procedure.id },
                include: {
                    steps: {
                        orderBy: { step_order: 'asc' }
                    }
                }
            });
        });

        res.status(201).json({
            success: true,
            message: 'Procedure created successfully',
            data: {
                ...newProcedure,
                difficulty: getDifficultyString(newProcedure.difficulty_level)
            }
        });

    } catch (error) {
        console.error('Create procedure error:', error);
        res.status(500).json({
            error: 'Failed to create procedure',
            code: 'PROCEDURE_CREATE_ERROR'
        });
    }
});

// PUT /api/admin/procedures/:id - Update procedure
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category,
            estimated_time_minutes,
            difficulty,
            status,
            tools_required,
            parts_required,
            safety_precautions,
            prerequisites,
            tips,
            warnings,
            steps
        } = req.body;

        // Check if procedure exists
        const existingProcedure = await prisma.repairProcedure.findUnique({
            where: { id }
        });

        if (!existingProcedure) {
            return res.status(404).json({
                error: 'Procedure not found',
                code: 'PROCEDURE_NOT_FOUND'
            });
        }

        // Update procedure and steps in transaction
        const updatedProcedure = await prisma.$transaction(async (tx) => {
            // Build update data
            const updateData = {
                updated_at: new Date(),
                updated_by: req.user?.id || null
            };

            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (category !== undefined) updateData.category = category;
            if (estimated_time_minutes !== undefined) updateData.estimated_time_minutes = parseInt(estimated_time_minutes);
            if (difficulty !== undefined) updateData.difficulty_level = getDifficultyLevel(difficulty);
            if (status !== undefined) updateData.status = status;
            if (tools_required !== undefined) updateData.tools_required = tools_required;
            if (parts_required !== undefined) updateData.parts_required = parts_required;
            if (safety_precautions !== undefined) updateData.safety_precautions = safety_precautions;
            if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
            if (tips !== undefined) updateData.tips = tips;
            if (warnings !== undefined) updateData.warnings = warnings;

            // Update the procedure
            const procedure = await tx.repairProcedure.update({
                where: { id },
                data: updateData
            });

            // Update steps if provided
            if (steps && Array.isArray(steps)) {
                // Delete existing steps
                await tx.procedureStep.deleteMany({
                    where: { procedure_id: id }
                });

                // Create new steps
                if (steps.length > 0) {
                    await tx.procedureStep.createMany({
                        data: steps.map((step, index) => ({
                            procedure_id: id,
                            step_order: index + 1,
                            title: step.title || `Step ${index + 1}`,
                            description: step.description || '',
                            estimated_time_minutes: step.estimated_time_minutes || 5,
                            is_optional: step.is_optional || false,
                            warning_message: step.warning_message || null,
                            success_criteria: step.success_criteria || null,
                            common_mistakes: step.common_mistakes || [],
                            tools_needed: step.tools_needed || [],
                            media_references: step.media_references || []
                        }))
                    });
                }
            }

            // Fetch the updated procedure with steps
            return await tx.repairProcedure.findUnique({
                where: { id },
                include: {
                    steps: {
                        orderBy: { step_order: 'asc' }
                    }
                }
            });
        });

        res.json({
            success: true,
            message: 'Procedure updated successfully',
            data: {
                ...updatedProcedure,
                difficulty: getDifficultyString(updatedProcedure.difficulty_level)
            }
        });

    } catch (error) {
        console.error('Update procedure error:', error);
        res.status(500).json({
            error: 'Failed to update procedure',
            code: 'PROCEDURE_UPDATE_ERROR'
        });
    }
});

// DELETE /api/admin/procedures/:id - Delete procedure
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if procedure exists
        const existingProcedure = await prisma.repairProcedure.findUnique({
            where: { id }
        });

        if (!existingProcedure) {
            return res.status(404).json({
                error: 'Procedure not found',
                code: 'PROCEDURE_NOT_FOUND'
            });
        }

        // Delete procedure and related data in transaction
        await prisma.$transaction(async (tx) => {
            // Delete related steps first
            await tx.procedureStep.deleteMany({
                where: { procedure_id: id }
            });

            // Delete the procedure
            await tx.repairProcedure.delete({
                where: { id }
            });
        });

        res.json({
            success: true,
            message: 'Procedure deleted successfully'
        });

    } catch (error) {
        console.error('Delete procedure error:', error);
        res.status(500).json({
            error: 'Failed to delete procedure',
            code: 'PROCEDURE_DELETE_ERROR'
        });
    }
});

// GET /api/admin/procedures/stats/summary - Get procedure statistics
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [
            totalProcedures,
            proceduresByCategory,
            proceduresByDifficulty,
            proceduresByStatus,
            recentProcedures
        ] = await Promise.all([
            // Total procedure count
            prisma.repairProcedure.count(),

            // Procedures by category
            prisma.repairProcedure.groupBy({
                by: ['category'],
                _count: { id: true }
            }),

            // Procedures by difficulty
            prisma.repairProcedure.groupBy({
                by: ['difficulty_level'],
                _count: { id: true }
            }),

            // Procedures by status
            prisma.repairProcedure.groupBy({
                by: ['status'],
                _count: { id: true }
            }),

            // Recent procedures
            prisma.repairProcedure.findMany({
                take: 5,
                orderBy: { updated_at: 'desc' },
                select: {
                    id: true,
                    title: true,
                    category: true,
                    status: true,
                    updated_at: true
                }
            })
        ]);

        // Calculate average estimated time
        const avgTimeResult = await prisma.repairProcedure.aggregate({
            _avg: { estimated_time_minutes: true }
        });

        res.json({
            success: true,
            data: {
                summary: {
                    total_procedures: totalProcedures,
                    average_time_minutes: Math.round(avgTimeResult._avg.estimated_time_minutes || 0),
                    published_count: proceduresByStatus.find(s => s.status === 'published')?._count.id || 0,
                    draft_count: proceduresByStatus.find(s => s.status === 'draft')?._count.id || 0
                },
                by_category: proceduresByCategory.map(cat => ({
                    category: cat.category,
                    count: cat._count.id
                })),
                by_difficulty: proceduresByDifficulty.map(diff => ({
                    level: diff.difficulty_level,
                    difficulty: getDifficultyString(diff.difficulty_level),
                    count: diff._count.id
                })),
                by_status: proceduresByStatus.map(status => ({
                    status: status.status,
                    count: status._count.id
                })),
                recent_procedures: recentProcedures
            }
        });

    } catch (error) {
        console.error('Procedure stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve procedure statistics',
            code: 'PROCEDURE_STATS_ERROR'
        });
    }
});

// POST /api/admin/procedures/:id/publish - Publish a procedure
router.post('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const procedure = await prisma.repairProcedure.update({
            where: { id },
            data: {
                status: 'published',
                updated_at: new Date(),
                updated_by: req.user?.id || null
            }
        });

        res.json({
            success: true,
            message: 'Procedure published successfully',
            data: procedure
        });

    } catch (error) {
        console.error('Publish procedure error:', error);
        res.status(500).json({
            error: 'Failed to publish procedure',
            code: 'PROCEDURE_PUBLISH_ERROR'
        });
    }
});

// POST /api/admin/procedures/:id/unpublish - Unpublish a procedure
router.post('/:id/unpublish', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const procedure = await prisma.repairProcedure.update({
            where: { id },
            data: {
                status: 'draft',
                updated_at: new Date(),
                updated_by: req.user?.id || null
            }
        });

        res.json({
            success: true,
            message: 'Procedure unpublished successfully',
            data: procedure
        });

    } catch (error) {
        console.error('Unpublish procedure error:', error);
        res.status(500).json({
            error: 'Failed to unpublish procedure',
            code: 'PROCEDURE_UNPUBLISH_ERROR'
        });
    }
});

module.exports = router;