import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIRECTORY || join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  type?: string;
  url?: string;
  error?: string;
}

async function ensureUploadDirectory(subPath: string = '') {
  const fullPath = join(UPLOAD_DIR, subPath);
  if (!existsSync(fullPath)) {
    await mkdir(fullPath, { recursive: true });
  }
  return fullPath;
}

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum of ${MAX_FILE_SIZE} bytes`
    };
  }

  return { valid: true };
}

function sanitizeFileName(originalName: string): string {
  return originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  const fileId = uuidv4();
  const sanitized = sanitizeFileName(originalName);
  const nameWithoutExt = sanitized.replace(`.${ext}`, '');
  return `${fileId}_${nameWithoutExt}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const bookingId = formData.get('bookingId') as string;
    const category = formData.get('category') as string || 'general';

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const results: UploadResult[] = [];
    const uploadSubDir = bookingId ? `bookings/${bookingId}` : `temp/${category}`;
    
    await ensureUploadDirectory(uploadSubDir);

    for (const file of files) {
      try {
        const validation = validateFile(file);
        if (!validation.valid) {
          results.push({
            success: false,
            originalName: file.name,
            error: validation.error
          });
          continue;
        }

        const fileName = generateFileName(file.name);
        const filePath = join(UPLOAD_DIR, uploadSubDir, fileName);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${uploadSubDir}/${fileName}`;
        const fileId = fileName.split('_')[0];

        results.push({
          success: true,
          fileId,
          fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        results.push({
          success: false,
          originalName: file.name,
          error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount} files uploaded successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
      uploadPath: uploadSubDir
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const fileName = searchParams.get('fileName');

    if (!fileId && !fileName) {
      return NextResponse.json(
        { success: false, error: 'File ID or file name required' },
        { status: 400 }
      );
    }

    // Implementation for file deletion would go here
    // For now, return success response
    return NextResponse.json({
      success: true,
      message: 'File deletion endpoint ready for implementation'
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}