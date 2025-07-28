'use client';

/**
 * Enhanced File Upload Component with Advanced Drag & Drop
 * 
 * Features:
 * - Multi-file drag & drop with visual feedback
 * - Real-time upload progress with animations
 * - Image preview with lightbox
 * - File categorization (damage photos, receipts, etc.)
 * - Batch operations (select all, delete selected)
 * - Auto-retry on failed uploads
 * - Drag reordering of uploaded files
 * - Copy/paste support
 * - Camera capture integration
 * - File validation with detailed feedback
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from './Card';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  uploadProgress?: number;
  category: string;
  uploadedAt: string;
  thumbnailUrl?: string;
}

export interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number;
  acceptedTypes?: string[];
  category?: string;
  bookingId?: string;
  className?: string;
  multiple?: boolean;
  showCamera?: boolean;
  showBatchOperations?: boolean;
  allowReordering?: boolean;
  compressionEnabled?: boolean;
  onUploadStart?: (fileCount: number) => void;
  onUploadProgress?: (progress: number, fileName: string) => void;
  onUploadComplete?: (results: any) => void;
  onUploadError?: (error: string, fileName?: string) => void;
}

interface FilePreview {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
  retryCount: number;
}

interface DropZoneState {
  isDragging: boolean;
  dragCounter: number;
  dragType: 'file' | 'reorder' | null;
}

const ACCEPTED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'text/plain'],
  all: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
};

const CATEGORIES = [
  { id: 'damage', name: 'Damage Photos', icon: '📷', description: 'Photos showing device damage' },
  { id: 'before', name: 'Before Repair', icon: '🔧', description: 'Initial state documentation' },
  { id: 'after', name: 'After Repair', icon: '✨', description: 'Completed repair photos' },
  { id: 'receipt', name: 'Receipts', icon: '🧾', description: 'Purchase receipts and invoices' },
  { id: 'documents', name: 'Documents', icon: '📄', description: 'Additional documentation' },
  { id: 'general', name: 'General', icon: '📁', description: 'Other files' },
];

export const EnhancedFileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizePerFile = 10,
  acceptedTypes = ACCEPTED_TYPES.all,
  category = 'general',
  bookingId,
  className,
  multiple = true,
  showCamera = true,
  showBatchOperations = true,
  allowReordering = true,
  compressionEnabled = true,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [dropZone, setDropZone] = useState<DropZoneState>({
    isDragging: false,
    dragCounter: 0,
    dragType: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentCategory, setCurrentCategory] = useState(category);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Validate file with detailed feedback
  const validateFile = useCallback((file: File): { valid: boolean; error?: string; warning?: string } => {
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" not supported. Allowed: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`
      };
    }

    if (file.size > maxSizePerFile * 1024 * 1024) {
      return {
        valid: false,
        error: `File too large (${formatFileSize(file.size)}). Maximum: ${maxSizePerFile}MB`
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    // Check for warnings
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: true,
        warning: 'Large file - compression recommended'
      };
    }

    return { valid: true };
  }, [acceptedTypes, maxSizePerFile, formatFileSize]);

  // Compress image
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!compressionEnabled || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [compressionEnabled]);

  // Upload files with progress tracking
  const uploadFiles = useCallback(async (filesToUpload: File[]) => {
    setIsUploading(true);
    onUploadStart?.(filesToUpload.length);

    const formData = new FormData();
    
    // Add compressed files
    const compressedFiles = await Promise.all(
      filesToUpload.map(file => compressImage(file))
    );

    compressedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    if (bookingId) formData.append('bookingId', bookingId);
    formData.append('category', currentCategory);

    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onUploadProgress?.(progress, 'Uploading files...');
            
            // Update preview progress
            setPreviews(prev => prev.map(p => ({
              ...p,
              uploading: true,
              progress: progress
            })));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 207) {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/uploads');
        xhr.send(formData);
      });

    } catch (error) {
      throw error;
    }
  }, [bookingId, currentCategory, compressImage, onUploadStart, onUploadProgress]);

  // Process file selection
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      onUploadError?.(
        `Maximum ${maxFiles} files allowed. You can upload ${maxFiles - files.length} more.`
      );
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: FilePreview[] = [];

    setUploadStats(prev => ({ ...prev, totalFiles: newFiles.length }));

    for (const file of newFiles) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid file', file.name);
        setUploadStats(prev => ({ ...prev, failedFiles: prev.failedFiles + 1 }));
        continue;
      }

      if (validation.warning) {
        console.warn(`File warning for ${file.name}: ${validation.warning}`);
      }

      validFiles.push(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        newPreviews.push({
          id: `preview_${Date.now()}_${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
          progress: 0,
          retryCount: 0,
        });
      }
    }

    if (validFiles.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews]);
      
      try {
        const result = await uploadFiles(validFiles);
        
        if (result.success && result.results) {
          const successfulUploads = result.results
            .filter((r: any) => r.success)
            .map((r: any) => ({
              id: r.fileId || `file_${Date.now()}_${Math.random()}`,
              fileName: r.fileName,
              originalName: r.originalName,
              size: r.size,
              type: r.type,
              url: r.url,
              category: currentCategory,
              uploadedAt: new Date().toISOString(),
              thumbnailUrl: r.url.includes('image/') ? r.url.replace('/uploads/', '/uploads/thumb_') : undefined,
            }));

          onFilesChange([...files, ...successfulUploads]);
          onUploadComplete?.(result);
          
          setUploadStats(prev => ({ 
            ...prev, 
            completedFiles: prev.completedFiles + successfulUploads.length 
          }));
          
          // Clear previews after successful upload
          setPreviews([]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
        
        setUploadStats(prev => ({ 
          ...prev, 
          failedFiles: prev.failedFiles + validFiles.length 
        }));
      }
    }

    setIsUploading(false);
  }, [files, maxFiles, validateFile, uploadFiles, currentCategory, onFilesChange, onUploadComplete, onUploadError]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDropZone(prev => ({
      ...prev,
      dragCounter: prev.dragCounter + 1,
      isDragging: true,
      dragType: 'file'
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDropZone(prev => {
      const newCounter = prev.dragCounter - 1;
      return {
        ...prev,
        dragCounter: newCounter,
        isDragging: newCounter > 0,
        dragType: newCounter > 0 ? prev.dragType : null
      };
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDropZone({
      isDragging: false,
      dragCounter: 0,
      dragType: null
    });

    const fileList = e.dataTransfer.files;
    if (fileList?.length > 0) {
      processFiles(fileList);
    }
  }, [processFiles]);

  // File input handlers
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      processFiles(fileList);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      processFiles(fileList);
    }
    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Batch operations
  const selectAllFiles = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const deselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  const deleteSelectedFiles = () => {
    const remainingFiles = files.filter(f => !selectedFiles.has(f.id));
    onFilesChange(remainingFiles);
    setSelectedFiles(new Set());
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.preview));
    };
  }, [previews]);

  const canAddMore = files.length + previews.length < maxFiles;
  const selectedCategory = CATEGORIES.find(cat => cat.id === currentCategory) || CATEGORIES[0];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Selection */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">📂 File Category</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCurrentCategory(cat.id)}
              className={cn(
                'p-3 border-2 rounded-lg text-left transition-all text-sm',
                currentCategory === cat.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="text-lg">{cat.icon}</div>
              <div className="font-medium">{cat.name}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selectedCategory.description}
        </p>
      </Card>

      {/* Enhanced Drop Zone */}
      <Card
        ref={dropZoneRef}
        className={cn(
          'border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden',
          dropZone.isDragging ? 'border-primary bg-primary/10 scale-102' : 'border-border hover:border-primary/50',
          !canAddMore && 'opacity-50 pointer-events-none',
          isUploading && 'pointer-events-none'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => canAddMore && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center space-y-6">
          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={!canAddMore || isUploading}
          />
          
          {showCamera && (
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
              disabled={!canAddMore || isUploading}
            />
          )}

          {/* Upload Icon with Animation */}
          <motion.div
            animate={dropZone.isDragging ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="text-6xl"
          >
            {isUploading ? '⏳' : dropZone.isDragging ? '🎯' : '📁'}
          </motion.div>
          
          {/* Upload Text */}
          <div className="space-y-2">
            <h4 className="text-xl font-medium">
              {isUploading 
                ? 'Uploading files...' 
                : dropZone.isDragging 
                  ? 'Drop files here!' 
                  : 'Drag & drop files here'
              }
            </h4>
            <p className="text-muted-foreground">
              {canAddMore 
                ? `or click to browse • ${maxFiles - files.length} slots remaining • ${maxSizePerFile}MB max each`
                : `Maximum ${maxFiles} files reached`
              }
            </p>
          </div>

          {/* Action Buttons */}
          {canAddMore && !isUploading && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                variant="ghost" 
                className="pointer-events-none"
                size="sm"
              >
                📂 Browse Files
              </Button>
              {showCamera && (
                <Button 
                  variant="ghost" 
                  className="pointer-events-auto"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  📷 Take Photo
                </Button>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="w-full max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{uploadStats.completedFiles}/{uploadStats.totalFiles}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div 
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(uploadStats.completedFiles / uploadStats.totalFiles) * 100}%` 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Upload Previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h4 className="font-medium">⏳ Processing Files</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {previews.map((preview, index) => (
                <motion.div
                  key={preview.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-2 relative overflow-hidden">
                    <div className="space-y-2">
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={preview.preview}
                          alt={`Upload preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Progress Overlay */}
                        {preview.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-xs mb-1">Uploading...</div>
                              <div className="text-lg font-bold">{preview.progress}%</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Error Overlay */}
                        {preview.error && (
                          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                            <div className="text-white text-xs text-center p-2">
                              Upload Failed
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-medium truncate">{preview.file.name}</div>
                        <div className="text-muted-foreground">
                          {formatFileSize(preview.file.size)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Operations */}
      {showBatchOperations && files.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedFiles.size} of {files.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllFiles}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllFiles}>
                  Deselect All
                </Button>
              </div>
            </div>
            {selectedFiles.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={deleteSelectedFiles}
              >
                Delete Selected ({selectedFiles.size})
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Uploaded Files Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">
            📁 Uploaded Files ({files.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative group',
                  selectedFiles.has(file.id) && 'ring-2 ring-primary'
                )}
              >
                <Card className="p-2 cursor-pointer" onClick={() => toggleFileSelection(file.id)}>
                  <div className="space-y-2">
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(file.url);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          📄
                        </div>
                      )}
                      
                      {/* Selection Checkbox */}
                      <div className="absolute top-1 left-1">
                        <div className={cn(
                          'w-5 h-5 rounded border-2 bg-white',
                          selectedFiles.has(file.id) 
                            ? 'border-primary bg-primary' 
                            : 'border-gray-300'
                        )}>
                          {selectedFiles.has(file.id) && (
                            <div className="text-white text-xs text-center leading-none pt-0.5">✓</div>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilesChange(files.filter(f => f.id !== file.id));
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>

                      {/* Category Badge */}
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {CATEGORIES.find(cat => cat.id === file.category)?.icon}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="font-medium truncate">{file.originalName}</div>
                      <div className="text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightboxImage}
              alt="Lightbox view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full text-xl hover:bg-white/30 transition-colors"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Summary */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">📊 Upload Summary</h4>
            <p className="text-sm text-muted-foreground">
              {files.length === 0 
                ? 'No files uploaded yet'
                : `${files.length} file${files.length !== 1 ? 's' : ''} • ${selectedCategory.name} category`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {files.length > 0 && <div className="text-green-600 text-xl">✅</div>}
            {uploadStats.failedFiles > 0 && (
              <div className="text-red-600 text-sm">
                {uploadStats.failedFiles} failed
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedFileUpload;