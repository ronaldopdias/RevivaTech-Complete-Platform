import { NextRequest, NextResponse } from 'next/server';
import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIRECTORY || join(process.cwd(), 'public', 'uploads');
const MAX_AGE_TEMP_FILES = 24 * 60 * 60 * 1000; // 24 hours for temp files
const MAX_AGE_ABANDONED_FILES = 7 * 24 * 60 * 60 * 1000; // 7 days for abandoned files

interface CleanupResult {
  deletedFiles: number;
  freedSpace: number;
  errors: string[];
  summary: {
    tempFiles: number;
    abandonedFiles: number;
    oldFiles: number;
  };
}

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  
  try {
    const items = await readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = join(dirPath, item.name);
      
      if (item.isDirectory()) {
        totalSize += await getDirectorySize(itemPath);
      } else {
        const stats = await stat(itemPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return totalSize;
}

async function cleanupTempFiles(): Promise<{ deleted: number; freedSpace: number; errors: string[] }> {
  const tempDir = join(UPLOAD_DIR, 'temp');
  let deleted = 0;
  let freedSpace = 0;
  const errors: string[] = [];
  
  if (!existsSync(tempDir)) {
    return { deleted, freedSpace, errors };
  }
  
  try {
    const categories = await readdir(tempDir, { withFileTypes: true });
    
    for (const category of categories) {
      if (!category.isDirectory()) continue;
      
      const categoryPath = join(tempDir, category.name);
      const files = await readdir(categoryPath);
      
      for (const file of files) {
        const filePath = join(categoryPath, file);
        
        try {
          const stats = await stat(filePath);
          const ageInMs = Date.now() - stats.mtime.getTime();
          
          if (ageInMs > MAX_AGE_TEMP_FILES) {
            freedSpace += stats.size;
            await unlink(filePath);
            deleted++;
          }
        } catch (error) {
          errors.push(`Failed to delete temp file ${file}: ${error}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Error cleaning temp files: ${error}`);
  }
  
  return { deleted, freedSpace, errors };
}

async function cleanupAbandonedFiles(): Promise<{ deleted: number; freedSpace: number; errors: string[] }> {
  const bookingsDir = join(UPLOAD_DIR, 'bookings');
  let deleted = 0;
  let freedSpace = 0;
  const errors: string[] = [];
  
  if (!existsSync(bookingsDir)) {
    return { deleted, freedSpace, errors };
  }
  
  try {
    const bookingFolders = await readdir(bookingsDir, { withFileTypes: true });
    
    for (const folder of bookingFolders) {
      if (!folder.isDirectory()) continue;
      
      const folderPath = join(bookingsDir, folder.name);
      
      try {
        const stats = await stat(folderPath);
        const ageInMs = Date.now() - stats.mtime.getTime();
        
        // Check if booking folder hasn't been accessed in a while
        // This would typically check against a database to see if booking is completed
        if (ageInMs > MAX_AGE_ABANDONED_FILES) {
          const files = await readdir(folderPath);
          
          for (const file of files) {
            const filePath = join(folderPath, file);
            const fileStats = await stat(filePath);
            freedSpace += fileStats.size;
            await unlink(filePath);
            deleted++;
          }
          
          // Remove empty directory
          await readdir(folderPath).then(async (remaining) => {
            if (remaining.length === 0) {
              // Would need to implement rmdir for empty directories
            }
          });
        }
      } catch (error) {
        errors.push(`Error processing booking folder ${folder.name}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Error cleaning abandoned files: ${error}`);
  }
  
  return { deleted, freedSpace, errors };
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cleanupType = searchParams.get('type') || 'all';
    
    const result: CleanupResult = {
      deletedFiles: 0,
      freedSpace: 0,
      errors: [],
      summary: {
        tempFiles: 0,
        abandonedFiles: 0,
        oldFiles: 0,
      },
    };
    
    if (cleanupType === 'temp' || cleanupType === 'all') {
      const tempCleanup = await cleanupTempFiles();
      result.deletedFiles += tempCleanup.deleted;
      result.freedSpace += tempCleanup.freedSpace;
      result.errors.push(...tempCleanup.errors);
      result.summary.tempFiles = tempCleanup.deleted;
    }
    
    if (cleanupType === 'abandoned' || cleanupType === 'all') {
      const abandonedCleanup = await cleanupAbandonedFiles();
      result.deletedFiles += abandonedCleanup.deleted;
      result.freedSpace += abandonedCleanup.freedSpace;
      result.errors.push(...abandonedCleanup.errors);
      result.summary.abandonedFiles = abandonedCleanup.deleted;
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.deletedFiles} files deleted, ${Math.round(result.freedSpace / 1024 / 1024)} MB freed`,
      result,
    });
    
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const uploadDirExists = existsSync(UPLOAD_DIR);
    
    if (!uploadDirExists) {
      return NextResponse.json({
        success: true,
        stats: {
          totalSize: 0,
          totalFiles: 0,
          directories: {
            temp: { size: 0, files: 0 },
            bookings: { size: 0, files: 0 },
          },
        },
      });
    }
    
    const totalSize = await getDirectorySize(UPLOAD_DIR);
    
    // Count total files
    let totalFiles = 0;
    const countFiles = async (dirPath: string): Promise<number> => {
      try {
        const items = await readdir(dirPath, { withFileTypes: true });
        let count = 0;
        
        for (const item of items) {
          if (item.isDirectory()) {
            count += await countFiles(join(dirPath, item.name));
          } else {
            count++;
          }
        }
        
        return count;
      } catch {
        return 0;
      }
    };
    
    totalFiles = await countFiles(UPLOAD_DIR);
    
    // Get directory-specific stats
    const tempDir = join(UPLOAD_DIR, 'temp');
    const bookingsDir = join(UPLOAD_DIR, 'bookings');
    
    const tempStats = {
      size: existsSync(tempDir) ? await getDirectorySize(tempDir) : 0,
      files: existsSync(tempDir) ? await countFiles(tempDir) : 0,
    };
    
    const bookingsStats = {
      size: existsSync(bookingsDir) ? await getDirectorySize(bookingsDir) : 0,
      files: existsSync(bookingsDir) ? await countFiles(bookingsDir) : 0,
    };
    
    return NextResponse.json({
      success: true,
      stats: {
        totalSize,
        totalFiles,
        directories: {
          temp: tempStats,
          bookings: bookingsStats,
        },
        recommendations: {
          shouldCleanTemp: tempStats.files > 50,
          shouldCleanAbandoned: bookingsStats.size > 100 * 1024 * 1024, // > 100MB
          lowDiskSpace: totalSize > 500 * 1024 * 1024, // > 500MB
        },
      },
    });
    
  } catch (error) {
    console.error('Storage stats API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get storage statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}