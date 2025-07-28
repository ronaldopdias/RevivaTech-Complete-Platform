import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from './Card';
import Button from './Button';

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  uploadProgress?: number;
}

export interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  acceptedTypes?: string[];
  category?: string;
  bookingId?: string;
  className?: string;
  multiple?: boolean;
  dragDropText?: string;
  showGuidelines?: boolean;
  showPreview?: boolean;
  compressionEnabled?: boolean;
  onUploadStart?: () => void;
  onUploadComplete?: (results: any) => void;
  onUploadError?: (error: string) => void;
}

interface FilePreview {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 6,
  maxSizePerFile = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  category = 'general',
  bookingId,
  className,
  multiple = true,
  dragDropText = 'Drag & drop files here or click to browse',
  showGuidelines = true,
  showPreview = true,
  compressionEnabled = true,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImage = useCallback((file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      if (!compressionEnabled || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
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
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [compressionEnabled]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Allowed: ${acceptedTypes.join(', ')}`
      };
    }

    if (file.size > maxSizePerFile * 1024 * 1024) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizePerFile}MB`
      };
    }

    return { valid: true };
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setIsUploading(true);
    onUploadStart?.();

    try {
      const formData = new FormData();
      
      for (const file of filesToUpload) {
        formData.append('files', file);
      }
      
      if (bookingId) formData.append('bookingId', bookingId);
      if (category) formData.append('category', category);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.results) {
        const successfulUploads = result.results
          .filter((r: any) => r.success)
          .map((r: any) => ({
            id: r.fileId,
            fileName: r.fileName,
            originalName: r.originalName,
            size: r.size,
            type: r.type,
            url: r.url,
          }));

        onFilesChange([...files, ...successfulUploads]);
        onUploadComplete?.(result);
        
        // Clear previews after successful upload
        setPreviews([]);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      
      // Update previews to show error state
      setPreviews(prev => prev.map(p => ({ ...p, error: errorMessage, uploading: false })));
    } finally {
      setIsUploading(false);
    }
  };

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed. You can upload ${maxFiles - files.length} more.`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: FilePreview[] = [];

    for (const file of newFiles) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid file');
        continue;
      }

      const processedFile = await compressImage(file);
      validFiles.push(processedFile);

      if (showPreview && file.type.startsWith('image/')) {
        newPreviews.push({
          file: processedFile,
          preview: URL.createObjectURL(processedFile),
          uploading: false,
          progress: 0,
        });
      }
    }

    if (validFiles.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews]);
      await uploadFiles(validFiles);
    }
  }, [files.length, maxFiles, compressImage, validateFile, showPreview, uploadFiles]);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const fileList = e.dataTransfer.files;
    if (fileList) {
      processFiles(fileList);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  };

  const removePreview = (index: number) => {
    const preview = previews[index];
    URL.revokeObjectURL(preview.preview);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const canAddMore = files.length + previews.length < maxFiles;

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.preview));
    };
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-all duration-200 cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          !canAddMore && 'opacity-50 pointer-events-none',
          isUploading && 'pointer-events-none'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canAddMore && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={!canAddMore || isUploading}
          />
          
          <div className="text-4xl">
            {isUploading ? '⏳' : '📁'}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-lg font-medium">
              {isUploading ? 'Uploading files...' : dragDropText}
            </h4>
            <p className="text-sm text-muted-foreground">
              {canAddMore 
                ? `Upload up to ${maxFiles - files.length} more files (${maxSizePerFile}MB max each)`
                : `Maximum ${maxFiles} files reached`
              }
            </p>
          </div>

          {canAddMore && !isUploading && (
            <Button variant="ghost" className="pointer-events-none">
              Click to Browse
            </Button>
          )}
        </div>
      </Card>

      {/* File Guidelines */}
      {showGuidelines && (
        <Card className="p-4 bg-muted/50">
          <h4 className="font-medium mb-2">📋 File Guidelines</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
            <div>
              <strong>Accepted Types:</strong>
              <br />
              {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
            </div>
            <div>
              <strong>Max Size:</strong>
              <br />
              {maxSizePerFile}MB per file
            </div>
            <div>
              <strong>Max Files:</strong>
              <br />
              {maxFiles} files total
            </div>
          </div>
        </Card>
      )}

      {/* Upload Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Processing Files</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <Card key={index} className="p-2">
                <div className="space-y-2">
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={preview.preview}
                      alt={`Upload preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {!preview.uploading && !preview.error && (
                      <button
                        onClick={() => removePreview(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    )}
                    {preview.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-xs">Uploading...</div>
                      </div>
                    )}
                    {preview.error && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                        <div className="text-white text-xs text-center p-2">Error</div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium truncate">{preview.file.name}</div>
                    <div className="text-muted-foreground">{formatFileSize(preview.file.size)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Uploaded Files ({files.length}/{maxFiles})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="p-2">
                <div className="space-y-2">
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📄
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs">
                    <div className="font-medium truncate">{file.originalName}</div>
                    <div className="text-muted-foreground">{formatFileSize(file.size)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Upload Status</h4>
            <p className="text-sm text-muted-foreground">
              {files.length === 0 
                ? 'No files uploaded yet'
                : `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully`
              }
            </p>
          </div>
          {files.length > 0 && (
            <div className="text-green-600 text-xl">✅</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FileUpload;