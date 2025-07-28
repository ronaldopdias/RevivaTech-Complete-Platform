import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface PhotoUploadV2Props {
  devicePhotos: File[];
  onPhotosChange: (photos: File[]) => void;
  deviceName?: string;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  className?: string;
}

interface PhotoPreview {
  file: File;
  url: string;
  compressed?: boolean;
  originalSize: number;
  compressedSize?: number;
}

// Image compression utility
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
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
};

export const PhotoUploadV2: React.FC<PhotoUploadV2Props> = ({
  devicePhotos,
  onPhotosChange,
  deviceName,
  maxFiles = 6,
  maxSizePerFile = 10,
  className,
}) => {
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process uploaded files
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select valid image files');
      return;
    }

    const totalFiles = devicePhotos.length + imageFiles.length;
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed. You can upload ${maxFiles - devicePhotos.length} more.`);
      return;
    }

    setUploading(true);

    try {
      const newPreviews: PhotoPreview[] = [];
      const processedFiles: File[] = [];

      for (const file of imageFiles) {
        // Check file size
        if (file.size > maxSizePerFile * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is ${maxSizePerFile}MB.`);
          continue;
        }

        // Compress if needed
        let processedFile = file;
        let compressed = false;
        
        if (file.size > 2 * 1024 * 1024) { // Compress files larger than 2MB
          processedFile = await compressImage(file);
          compressed = true;
        }

        processedFiles.push(processedFile);
        newPreviews.push({
          file: processedFile,
          url: URL.createObjectURL(processedFile),
          compressed,
          originalSize: file.size,
          compressedSize: compressed ? processedFile.size : undefined,
        });
      }

      setPreviews(prev => [...prev, ...newPreviews]);
      onPhotosChange([...devicePhotos, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing some files. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [devicePhotos, maxFiles, maxSizePerFile, onPhotosChange]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Remove photo
  const removePhoto = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = devicePhotos.filter((_, i) => i !== index);
    
    // Cleanup URL
    URL.revokeObjectURL(previews[index].url);
    
    setPreviews(newPreviews);
    onPhotosChange(newFiles);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Upload Device Photos</h3>
        <p className="text-muted-foreground">
          Photos help us provide more accurate estimates and faster service
          {deviceName && (
            <span className="block text-sm mt-1">
              📱 {deviceName}
            </span>
          )}
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-all duration-200',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-8 text-center space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="photo-upload"
            disabled={uploading}
          />
          
          <div className="text-6xl">
            {uploading ? '⏳' : '📸'}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-lg font-medium">
              {uploading ? 'Processing photos...' : 'Upload Device Photos'}
            </h4>
            <p className="text-sm text-muted-foreground">
              Drag and drop photos here, or{' '}
              <label
                htmlFor="photo-upload"
                className="text-primary cursor-pointer hover:underline"
              >
                click to browse
              </label>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <span>📁</span>
              <span>Up to {maxFiles} photos</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>📏</span>
              <span>Max {maxSizePerFile}MB each</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🗜️</span>
              <span>Auto-compressed</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Photo Guidelines */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">📋 Photo Guidelines</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-700">
          <div className="space-y-1">
            <p>✅ <strong>Good photos:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-4">
              <li>Clear, well-lit images</li>
              <li>Multiple angles of damage</li>
              <li>Close-ups of problem areas</li>
              <li>Serial number/model info</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p>❌ <strong>Avoid:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-4">
              <li>Blurry or dark photos</li>
              <li>Photos from too far away</li>
              <li>Reflective surfaces blocking view</li>
              <li>Personal information visible</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Photo Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">
            Uploaded Photos ({previews.length}/{maxFiles})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <Card key={index} className="p-2">
                <div className="space-y-2">
                  {/* Image Preview */}
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={preview.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* File Info */}
                  <div className="text-xs space-y-1">
                    <div className="font-medium truncate">
                      {preview.file.name}
                    </div>
                    <div className="text-muted-foreground">
                      {formatFileSize(preview.file.size)}
                      {preview.compressed && (
                        <span className="text-green-600">
                          {' '}(compressed from {formatFileSize(preview.originalSize)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {previews.length === 0 ? (
            'No photos uploaded yet'
          ) : (
            `${previews.length} photo${previews.length !== 1 ? 's' : ''} ready to submit`
          )}
        </div>
        
        <div className="flex gap-2">
          {previews.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                previews.forEach(preview => URL.revokeObjectURL(preview.url));
                setPreviews([]);
                onPhotosChange([]);
              }}
            >
              Clear All
            </Button>
          )}
          
          {previews.length < maxFiles && (
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Add More Photos
            </Button>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-medium">Faster Service</div>
          <div className="text-muted-foreground text-xs">
            Photos help us prepare parts in advance
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl mb-1">💰</div>
          <div className="font-medium">Better Quotes</div>
          <div className="text-muted-foreground text-xs">
            More accurate pricing with visual assessment
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl mb-1">🔒</div>
          <div className="font-medium">Secure & Private</div>
          <div className="text-muted-foreground text-xs">
            Photos are encrypted and never shared
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadV2;