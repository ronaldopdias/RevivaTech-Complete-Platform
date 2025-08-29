/**
 * PRISMA MIGRATION: Admin Media API
 * Converted from raw SQL to Prisma ORM operations
 * File upload, storage, and management for procedure media
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const { prisma } = require('../../lib/prisma');
const { authenticateBetterAuth: authenticateToken, requireAdmin } = require('../../middleware/better-auth-official');

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
    if (mimetype.startsWith('application/pdf')) return 'document';
    if (mimetype.startsWith('text/')) return 'document';
    return 'other';
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const fileType = getFileType(file.mimetype);
        let uploadDir = '/app/uploads/';
        
        switch (fileType) {
            case 'image':
                uploadDir += 'images';
                break;
            case 'video':
                uploadDir += 'videos';
                break;
            case 'document':
                uploadDir += 'documents';
                break;
            default:
                uploadDir += 'documents';
        }
        
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'application/pdf', 'text/plain', 'text/markdown'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'admin-media-api',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Upload media files with Prisma database tracking
router.post('/upload', authenticateToken, requireAdmin, upload.array('files', 10), async (req, res) => {
    try {
        const { procedure_id, title, description, tags } = req.body;
        const uploadedFiles = [];

        // Process each uploaded file
        for (const file of req.files) {
            const fileId = generateFileId();
            const fileType = getFileType(file.mimetype);
            
            // Create media file record using Prisma
            const mediaFile = await prisma.mediaFile.create({
                data: {
                    id: fileId,
                    file_name: file.originalname,
                    file_path: file.path,
                    file_type: fileType,
                    mime_type: file.mimetype,
                    file_size: file.size,
                    title: title || file.originalname,
                    description: description || null,
                    tags: tags ? JSON.parse(tags) : [],
                    procedure_id: procedure_id || null,
                    uploaded_by: req.user?.id || null,
                    metadata: {
                        originalName: file.originalname,
                        encoding: file.encoding,
                        destination: file.destination,
                        filename: file.filename
                    },
                    is_public: false,
                    view_count: 0,
                    download_count: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            uploadedFiles.push({
                id: mediaFile.id,
                file_name: mediaFile.file_name,
                file_type: mediaFile.file_type,
                file_size: mediaFile.file_size,
                mime_type: mediaFile.mime_type,
                title: mediaFile.title,
                url: `/api/admin/media/serve/${mediaFile.id}`,
                created_at: mediaFile.created_at
            });
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            data: {
                files: uploadedFiles
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to upload files',
            code: 'UPLOAD_ERROR',
            details: error.message
        });
    }
});

// Get all media files with filtering
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            file_type, 
            procedure_id, 
            limit = 50, 
            offset = 0,
            sort = 'created_at',
            order = 'desc'
        } = req.query;

        // Build where clause
        const whereClause = {};
        if (file_type) whereClause.file_type = file_type;
        if (procedure_id) whereClause.procedure_id = procedure_id;

        // Get media files with pagination
        const [mediaFiles, totalCount] = await Promise.all([
            prisma.mediaFile.findMany({
                where: whereClause,
                take: parseInt(limit),
                skip: parseInt(offset),
                orderBy: {
                    [sort]: order
                },
                select: {
                    id: true,
                    file_name: true,
                    file_type: true,
                    mime_type: true,
                    file_size: true,
                    title: true,
                    description: true,
                    tags: true,
                    procedure_id: true,
                    is_public: true,
                    view_count: true,
                    download_count: true,
                    created_at: true,
                    updated_at: true
                }
            }),
            prisma.mediaFile.count({
                where: whereClause
            })
        ]);

        // Format response
        const formattedFiles = mediaFiles.map(file => ({
            ...file,
            url: `/api/admin/media/serve/${file.id}`,
            thumbnail_url: file.file_type === 'image' ? `/api/admin/media/serve/${file.id}?thumbnail=true` : null
        }));

        res.json({
            success: true,
            data: {
                files: formattedFiles,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: parseInt(offset) + parseInt(limit) < totalCount
                }
            }
        });

    } catch (error) {
        console.error('Media list error:', error);
        res.status(500).json({
            error: 'Failed to retrieve media files',
            code: 'MEDIA_LIST_ERROR'
        });
    }
});

// Get specific media file details
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const mediaFile = await prisma.mediaFile.findUnique({
            where: { id }
        });

        if (!mediaFile) {
            return res.status(404).json({
                error: 'Media file not found',
                code: 'MEDIA_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                ...mediaFile,
                url: `/api/admin/media/serve/${mediaFile.id}`,
                thumbnail_url: mediaFile.file_type === 'image' ? `/api/admin/media/serve/${mediaFile.id}?thumbnail=true` : null
            }
        });

    } catch (error) {
        console.error('Media details error:', error);
        res.status(500).json({
            error: 'Failed to retrieve media file details',
            code: 'MEDIA_DETAILS_ERROR'
        });
    }
});

// Update media file metadata
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, tags, is_public, procedure_id } = req.body;

        // Check if media exists
        const existingMedia = await prisma.mediaFile.findUnique({
            where: { id }
        });

        if (!existingMedia) {
            return res.status(404).json({
                error: 'Media file not found',
                code: 'MEDIA_NOT_FOUND'
            });
        }

        // Build update data
        const updateData = {
            updated_at: new Date()
        };

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (tags !== undefined) updateData.tags = tags;
        if (is_public !== undefined) updateData.is_public = is_public;
        if (procedure_id !== undefined) updateData.procedure_id = procedure_id;

        // Update media file
        const updatedMedia = await prisma.mediaFile.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Media file updated successfully',
            data: updatedMedia
        });

    } catch (error) {
        console.error('Media update error:', error);
        res.status(500).json({
            error: 'Failed to update media file',
            code: 'MEDIA_UPDATE_ERROR'
        });
    }
});

// Delete media file
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Get media file details
        const mediaFile = await prisma.mediaFile.findUnique({
            where: { id }
        });

        if (!mediaFile) {
            return res.status(404).json({
                error: 'Media file not found',
                code: 'MEDIA_NOT_FOUND'
            });
        }

        // Delete physical file
        try {
            await fs.unlink(mediaFile.file_path);
        } catch (error) {
            console.warn(`Could not delete physical file: ${mediaFile.file_path}`);
        }

        // Delete database record
        await prisma.mediaFile.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Media file deleted successfully'
        });

    } catch (error) {
        console.error('Media delete error:', error);
        res.status(500).json({
            error: 'Failed to delete media file',
            code: 'MEDIA_DELETE_ERROR'
        });
    }
});

// Serve media file with view count tracking
router.get('/serve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { thumbnail, download } = req.query;

        // Get media file info
        const mediaFile = await prisma.mediaFile.findUnique({
            where: { id }
        });

        if (!mediaFile) {
            return res.status(404).json({
                error: 'Media file not found',
                code: 'MEDIA_NOT_FOUND'
            });
        }

        // Update view/download count
        const updateData = {};
        if (download) {
            updateData.download_count = { increment: 1 };
        } else {
            updateData.view_count = { increment: 1 };
        }

        await prisma.mediaFile.update({
            where: { id },
            data: updateData
        }).catch(err => console.warn('Could not update view count:', err));

        // Check if file exists
        try {
            await fs.access(mediaFile.file_path);
        } catch {
            return res.status(404).json({
                error: 'File not found on server',
                code: 'FILE_NOT_FOUND'
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', mediaFile.mime_type);
        
        if (download) {
            res.setHeader('Content-Disposition', `attachment; filename="${mediaFile.file_name}"`);
        } else {
            res.setHeader('Content-Disposition', `inline; filename="${mediaFile.file_name}"`);
        }

        // Stream file to response
        const fileStream = require('fs').createReadStream(mediaFile.file_path);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Media serve error:', error);
        res.status(500).json({
            error: 'Failed to serve media file',
            code: 'MEDIA_SERVE_ERROR'
        });
    }
});

// Get media statistics
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get statistics using Prisma aggregations
        const [
            totalFiles,
            totalSize,
            filesByType,
            recentUploads,
            mostViewed
        ] = await Promise.all([
            // Total file count
            prisma.mediaFile.count(),

            // Total storage size
            prisma.mediaFile.aggregate({
                _sum: { file_size: true }
            }),

            // Files by type
            prisma.mediaFile.groupBy({
                by: ['file_type'],
                _count: { id: true },
                _sum: { file_size: true }
            }),

            // Recent uploads
            prisma.mediaFile.findMany({
                take: 10,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    file_name: true,
                    file_type: true,
                    file_size: true,
                    created_at: true
                }
            }),

            // Most viewed files
            prisma.mediaFile.findMany({
                take: 10,
                orderBy: { view_count: 'desc' },
                where: { view_count: { gt: 0 } },
                select: {
                    id: true,
                    file_name: true,
                    view_count: true,
                    download_count: true
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                summary: {
                    total_files: totalFiles,
                    total_storage_mb: Math.round((totalSize._sum.file_size || 0) / (1024 * 1024)),
                    average_file_size_mb: totalFiles > 0 
                        ? Math.round((totalSize._sum.file_size || 0) / totalFiles / (1024 * 1024))
                        : 0
                },
                by_type: filesByType.map(type => ({
                    type: type.file_type,
                    count: type._count.id,
                    total_size_mb: Math.round((type._sum.file_size || 0) / (1024 * 1024))
                })),
                recent_uploads: recentUploads,
                most_viewed: mostViewed
            }
        });

    } catch (error) {
        console.error('Media stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve media statistics',
            code: 'MEDIA_STATS_ERROR'
        });
    }
});

module.exports = router;