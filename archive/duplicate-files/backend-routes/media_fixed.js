/**
 * RevivaTech Admin Media API (Compatible with existing schema)
 * File upload, storage, and management for procedure media
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'revivatech_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'revivatech_new',
    password: process.env.DB_PASSWORD || 'secure_password_2024',
    port: process.env.DB_PORT || 5435,
});

// Check existing media_files table
const initializeMediaTable = async () => {
    try {
    } catch (error) {
        console.error('❌ Error checking media table:', error);
    }
};

// Initialize table on module load
initializeMediaTable();

// Create upload directories in container
const createUploadDirectories = async () => {
    const directories = [
        '/app/uploads/images',
        '/app/uploads/videos', 
        '/app/uploads/documents',
        '/app/uploads/thumbnails'
    ];

    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`❌ Error creating directory ${dir}:`, error);
        }
    }
};

createUploadDirectories();

// Helper function to generate file ID
const generateFileId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `MEDIA-${timestamp}-${random}`;
};

// Helper function to determine file type
const getFileType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'document';
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = getFileType(file.mimetype);
        const uploadPath = `/app/uploads/${fileType}s`;
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(file.originalname);
        const cleanName = path.basename(file.originalname, extension)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);
        cb(null, `${timestamp}_${randomSuffix}_${cleanName}${extension}`);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        'video/mp4': true,
        'video/webm': true,
        'video/quicktime': true,
        'application/pdf': true,
        'text/plain': true
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 10 // Max 10 files per upload
    }
});

// POST /api/admin/media/upload - Upload multiple files
router.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const { title, description, alt_text } = req.body;
        const uploadedFiles = [];

        for (const file of req.files) {
            const fileType = getFileType(file.mimetype);
            
            // Insert file record into database using existing schema
            const insertQuery = `
                INSERT INTO media_files (
                    filename, original_filename, file_type, file_size_bytes,
                    storage_path, title, description, alt_text, processing_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;
            
            const values = [
                file.filename,
                file.originalname,
                fileType,
                file.size,
                file.path,
                title || file.originalname,
                description || '',
                alt_text || '',
                'completed'
            ];

            const result = await pool.query(insertQuery, values);
            uploadedFiles.push(result.rows[0]);
        }

        res.status(201).json({
            success: true,
            data: uploadedFiles,
            message: `${uploadedFiles.length} file(s) uploaded successfully`
        });

    } catch (error) {
        console.error('❌ Error uploading files:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('❌ Error cleaning up file:', unlinkError);
                }
            }
        }

        res.status(500).json({
            success: false,
            error: 'Failed to upload files',
            details: error.message
        });
    }
});

// GET /api/admin/media - List all media files with filtering
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            file_type,
            search,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Build WHERE conditions
        if (file_type) {
            whereConditions.push(`file_type = $${paramIndex}`);
            queryParams.push(file_type);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(original_filename ILIKE $${paramIndex} OR title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Count total records
        const countQuery = `SELECT COUNT(*) FROM media_files ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalRecords = parseInt(countResult.rows[0].count);

        // Get media files with pagination
        const query = `
            SELECT 
                id, uuid as file_id, filename, original_filename as original_name,
                file_type, file_size_bytes as file_size, storage_path as file_path,
                title, description, alt_text, thumbnail_url as thumbnail_path,
                processing_status as status, created_at, used_in_procedures
            FROM media_files 
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const result = await pool.query(query, queryParams);

        res.json({
            success: true,
            data: {
                files: result.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / limit),
                    totalRecords,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Error fetching media files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch media files',
            details: error.message
        });
    }
});

// GET /api/admin/media/:id - Get single media file details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT * FROM media_files 
            WHERE id = $1 OR uuid::text = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Media file not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching media file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch media file',
            details: error.message
        });
    }
});

// PUT /api/admin/media/:id - Update media file metadata
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, alt_text } = req.body;

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

        if (alt_text !== undefined) {
            updateFields.push(`alt_text = $${paramIndex}`);
            values.push(alt_text);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        const query = `
            UPDATE media_files 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex} OR uuid::text = $${paramIndex}
            RETURNING *
        `;

        values.push(id);
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Media file not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Media file updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating media file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update media file',
            details: error.message
        });
    }
});

// DELETE /api/admin/media/:id - Delete media file
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM media_files 
             WHERE id = $1 OR uuid::text = $1
             RETURNING uuid, original_filename`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Media file not found'
            });
        }

        res.json({
            success: true,
            message: 'Media file deleted successfully',
            data: { file_id: result.rows[0].uuid }
        });

    } catch (error) {
        console.error('❌ Error deleting media file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete media file',
            details: error.message
        });
    }
});

// GET /api/admin/media/serve/:id - Serve media file
router.get('/serve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT storage_path, original_filename, file_type
            FROM media_files 
            WHERE id = $1 OR uuid::text = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Media file not found'
            });
        }

        const { storage_path, original_filename, file_type } = result.rows[0];

        // Check if file exists
        try {
            await fs.access(storage_path);
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'Physical file not found'
            });
        }

        // Set appropriate headers
        const mimeTypes = {
            'image': 'image/jpeg',
            'video': 'video/mp4',
            'document': 'application/octet-stream'
        };

        res.setHeader('Content-Type', mimeTypes[file_type] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${original_filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=86400');

        // Send file
        res.sendFile(path.resolve(storage_path));

    } catch (error) {
        console.error('❌ Error serving media file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to serve media file',
            details: error.message
        });
    }
});

// GET /api/admin/media/stats/summary - Get media statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_files,
                COUNT(*) FILTER (WHERE file_type = 'image') as image_count,
                COUNT(*) FILTER (WHERE file_type = 'video') as video_count,
                COUNT(*) FILTER (WHERE file_type = 'document') as document_count,
                ROUND(SUM(file_size_bytes)::numeric / 1024 / 1024, 2) as total_size_mb
            FROM media_files
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching media stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch media statistics',
            details: error.message
        });
    }
});

module.exports = router;