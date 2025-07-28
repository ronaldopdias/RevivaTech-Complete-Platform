import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export interface PhotoUploadStepProps {
  device: DeviceModel;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  className?: string;
}

interface PhotoPreviewProps {
  file: File;
  onRemove: () => void;
  onRotate?: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ file, onRemove, onRotate }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setIsLoading(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-3 relative group">
      {isLoading ? (
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Upload preview"
            className="w-full h-32 object-cover rounded-lg"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            {onRotate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRotate}
                className="text-white hover:bg-white/20"
              >
                🔄
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="text-white hover:bg-white/20"
            >
              🗑️
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground">
        <div className="truncate">{file.name}</div>
        <div>{formatFileSize(file.size)}</div>
      </div>
    </Card>
  );
};

// Image compression utility
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const PHOTO_TIPS = [
  {
    title: 'Good Lighting',
    description: 'Take photos in well-lit areas or use your device\'s flash',
    icon: '💡',
  },
  {
    title: 'Clear Focus',
    description: 'Make sure the damage or issue is clearly visible and in focus',
    icon: '🎯',
  },
  {
    title: 'Multiple Angles',
    description: 'Include different angles to show the full extent of the problem',
    icon: '📐',
  },
  {
    title: 'Close-Up Details',
    description: 'Take close-up shots of specific damage or problem areas',
    icon: '🔍',
  },
];

const SUGGESTED_PHOTOS = [
  'Overall device condition',
  'Specific damage or problem area',
  'Serial number or model information',
  'Any error messages on screen',
  'Ports and connection points',
  'Back of device showing model details',
];

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  device,
  photos,
  onPhotosChange,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    const newPhotos: File[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file. Please upload only images.`);
          continue;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Please use images smaller than 10MB.`);
          continue;
        }

        try {
          // Compress image
          const compressedFile = await compressImage(file);
          newPhotos.push(compressedFile);
        } catch (error) {
          console.error('Error compressing image:', error);
          // If compression fails, use original file if it's small enough
          if (file.size < 2 * 1024 * 1024) {
            newPhotos.push(file);
          } else {
            alert(`Failed to process ${file.name}. Please try a different image.`);
          }
        }
      }

      // Add to existing photos (max 6 total)
      const updatedPhotos = [...photos, ...newPhotos].slice(0, 6);
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('An error occurred while processing your photos. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [photos, onPhotosChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = photos.length < 6;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Photos</h2>
        <p className="text-muted-foreground">
          Help us understand the problem by uploading photos of your {device.name}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          This step is optional but highly recommended for accurate diagnosis
        </p>
      </div>

      {/* Photo upload area */}
      <Card
        className={cn(
          'p-8 border-2 border-dashed transition-all',
          isDragging && 'border-primary bg-primary/5',
          !canAddMore && 'opacity-50 pointer-events-none'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center space-y-4">
          <div className="text-4xl">📸</div>
          
          {isProcessing ? (
            <div className="space-y-2">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Processing photos...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {canAddMore ? 'Drop photos here or click to browse' : 'Maximum photos reached (6/6)'}
                </h3>
                <p className="text-muted-foreground">
                  {canAddMore 
                    ? `You can upload up to ${6 - photos.length} more photo${6 - photos.length !== 1 ? 's' : ''}`
                    : 'Remove some photos to add new ones'
                  }
                </p>
              </div>

              {canAddMore && (
                <Button onClick={handleBrowseFiles} size="lg">
                  Browse Files
                </Button>
              )}
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </Card>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Uploaded Photos ({photos.length}/6)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <PhotoPreview
                key={`${photo.name}-${index}`}
                file={photo}
                onRemove={() => handleRemovePhoto(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggested photos */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Suggested Photos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTED_PHOTOS.map((suggestion, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">📷</span>
              {suggestion}
            </div>
          ))}
        </div>
      </Card>

      {/* Photo tips */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Tips for Better Photos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PHOTO_TIPS.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-xl">{tip.icon}</span>
              <div>
                <h5 className="font-medium text-sm">{tip.title}</h5>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Privacy notice */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔒</span>
          <div className="text-sm">
            <h5 className="font-medium mb-1">Privacy & Security</h5>
            <p className="text-muted-foreground">
              Your photos are securely stored and only used for repair diagnosis. 
              They will be permanently deleted after your repair is completed unless 
              you request otherwise.
            </p>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Photo Upload Status</h4>
            <p className="text-sm text-muted-foreground">
              {photos.length === 0 
                ? 'No photos uploaded (optional step)'
                : `${photos.length} photo${photos.length !== 1 ? 's' : ''} uploaded and ready`
              }
            </p>
          </div>
          {photos.length > 0 && (
            <div className="text-green-600 text-xl">✓</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PhotoUploadStep;