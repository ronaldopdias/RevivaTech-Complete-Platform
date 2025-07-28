'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  Eye,
  Rotate3D,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DiagnosticPhoto {
  id: string;
  file: File;
  preview: string;
  category: PhotoCategory;
  description?: string;
  timestamp: Date;
}

export type PhotoCategory = 
  | 'overall-condition'
  | 'screen-damage' 
  | 'keyboard-issues'
  | 'port-damage'
  | 'physical-damage'
  | 'error-messages'
  | 'boot-issues'
  | 'other';

interface PhotoCategoryConfig {
  id: PhotoCategory;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  examples: string[];
  tips: string[];
  priority: 'high' | 'medium' | 'low';
}

const PHOTO_CATEGORIES: PhotoCategoryConfig[] = [
  {
    id: 'overall-condition',
    name: 'Overall Condition',
    description: 'General photos showing the laptop\'s current state',
    icon: Camera,
    examples: ['Laptop closed', 'Laptop open', 'Side view showing ports'],
    tips: ['Take photos in good lighting', 'Show any obvious damage', 'Include brand/model if visible'],
    priority: 'medium'
  },
  {
    id: 'screen-damage',
    name: 'Screen & Display Issues',
    description: 'Screen cracks, display problems, or visual defects',
    icon: Eye,
    examples: ['Cracked screen', 'Dead pixels', 'Display lines', 'Backlight issues'],
    tips: ['Turn screen on to show display issues', 'Take close-up of damage', 'Show extent of cracks'],
    priority: 'high'
  },
  {
    id: 'keyboard-issues',
    name: 'Keyboard Problems',
    description: 'Missing keys, spill damage, or keyboard malfunctions',
    icon: Rotate3D,
    examples: ['Missing keys', 'Sticky keys', 'Spill stains', 'Key not working'],
    tips: ['Show specific problem keys', 'Include any liquid damage', 'Test key responses if possible'],
    priority: 'medium'
  },
  {
    id: 'port-damage',
    name: 'Port & Connector Issues',
    description: 'USB, charging, audio, or other port problems',
    icon: Zap,
    examples: ['Broken USB ports', 'Loose charging port', 'Damaged audio jack'],
    tips: ['Take close-up photos', 'Show any physical damage', 'Include charging cable if relevant'],
    priority: 'high'
  },
  {
    id: 'physical-damage',
    name: 'Physical Damage',
    description: 'Dents, cracks, broken hinges, or structural damage',
    icon: AlertCircle,
    examples: ['Broken hinges', 'Case cracks', 'Dents from drops', 'Structural damage'],
    tips: ['Show damage from multiple angles', 'Include any loose parts', 'Show functionality impact'],
    priority: 'high'
  },
  {
    id: 'error-messages',
    name: 'Error Messages',
    description: 'Screenshots or photos of error screens',
    icon: Info,
    examples: ['Blue screen errors', 'Boot errors', 'Software error messages'],
    tips: ['Capture full error message', 'Include error codes', 'Take multiple if errors vary'],
    priority: 'high'
  },
  {
    id: 'boot-issues',
    name: 'Boot & Startup Problems',
    description: 'Issues during laptop startup or boot process',
    icon: Rotate3D,
    examples: ['Blank screen on startup', 'Boot loop', 'BIOS screens'],
    tips: ['Photo during startup process', 'Include any beep patterns', 'Show what appears on screen'],
    priority: 'medium'
  },
  {
    id: 'other',
    name: 'Other Issues',
    description: 'Any other problems not covered above',
    icon: ImageIcon,
    examples: ['Unusual sounds', 'Overheating areas', 'Any other concerns'],
    tips: ['Describe the issue clearly', 'Include relevant context', 'Multiple angles helpful'],
    priority: 'low'
  }
];

interface DiagnosticPhotoUploadProps {
  onPhotosChange: (photos: DiagnosticPhoto[]) => void;
  selectedServices?: string[];
  maxPhotos?: number;
  className?: string;
}

const DiagnosticPhotoUpload: React.FC<DiagnosticPhotoUploadProps> = ({
  onPhotosChange,
  selectedServices = [],
  maxPhotos = 10,
  className
}) => {
  const [photos, setPhotos] = useState<DiagnosticPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('overall-condition');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate smart category suggestions based on selected services
  const suggestedCategories = React.useMemo(() => {
    if (selectedServices.length === 0) return ['overall-condition'];
    
    const suggestions: PhotoCategory[] = ['overall-condition'];
    
    // Map service IDs to relevant photo categories
    const serviceToCategories: Record<string, PhotoCategory[]> = {
      // Screen-related services
      'a10': ['screen-damage', 'physical-damage'],
      'c9': ['screen-damage', 'error-messages'],
      
      // Physical damage services
      'b7': ['physical-damage', 'overall-condition'],
      'c3': ['physical-damage', 'overall-condition'],
      'c11': ['physical-damage'],
      
      // Port-related services
      'c6': ['port-damage'],
      'c7': ['port-damage'],
      'c8': ['port-damage'],
      
      // Boot/startup services
      'b5': ['boot-issues', 'error-messages'],
      'b6': ['error-messages', 'boot-issues'],
      'a3': ['boot-issues'],
      
      // Liquid damage
      'c5': ['physical-damage', 'keyboard-issues', 'overall-condition'],
      
      // Keyboard issues
      'b2': ['keyboard-issues'],
      
      // Power issues
      'c10': ['boot-issues', 'port-damage'],
      
      // Motherboard issues
      'c1': ['boot-issues', 'error-messages', 'physical-damage']
    };
    
    selectedServices.forEach(serviceId => {
      const categories = serviceToCategories[serviceId];
      if (categories) {
        categories.forEach(cat => {
          if (!suggestions.includes(cat)) {
            suggestions.push(cat);
          }
        });
      }
    });
    
    return suggestions;
  }, [selectedServices]);

  const handlePhotoUpload = useCallback((files: FileList) => {
    const newPhotos: DiagnosticPhoto[] = [];
    
    Array.from(files).forEach((file, index) => {
      if (photos.length + newPhotos.length >= maxPhotos) return;
      
      if (file.type.startsWith('image/')) {
        const id = `photo-${Date.now()}-${index}`;
        const preview = URL.createObjectURL(file);
        
        newPhotos.push({
          id,
          file,
          preview,
          category: selectedCategory,
          timestamp: new Date()
        });
      }
    });
    
    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, selectedCategory, maxPhotos, onPhotosChange]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handlePhotoUpload(e.target.files);
    }
  }, [handlePhotoUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handlePhotoUpload(e.dataTransfer.files);
    }
  }, [handlePhotoUpload]);

  const removePhoto = useCallback((photoId: string) => {
    const updatedPhotos = photos.filter(photo => {
      if (photo.id === photoId) {
        URL.revokeObjectURL(photo.preview);
        return false;
      }
      return true;
    });
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  const updatePhotoDescription = useCallback((photoId: string, description: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === photoId ? { ...photo, description } : photo
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  const currentCategoryConfig = PHOTO_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Camera className="w-5 h-5 text-professional-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Diagnostic Photos
          </h3>
        </div>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Upload photos to help our technicians diagnose your laptop issues more accurately. 
          This can speed up the repair process and ensure we address all problems.
        </p>
      </div>

      {/* Smart Category Suggestions */}
      {suggestedCategories.length > 1 && (
        <div className="bg-professional-50 border border-professional-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-professional-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-professional-800 mb-2">
                Recommended Photo Categories
              </h4>
              <p className="text-sm text-professional-700 mb-3">
                Based on your selected services, these photo categories would be most helpful:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedCategories.map(categoryId => {
                  const category = PHOTO_CATEGORIES.find(cat => cat.id === categoryId);
                  if (!category) return null;
                  
                  return (
                    <button
                      key={categoryId}
                      onClick={() => setSelectedCategory(categoryId)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                        selectedCategory === categoryId
                          ? "bg-professional-500 text-white"
                          : "bg-professional-100 text-professional-700 hover:bg-professional-200"
                      )}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selector */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Photo Category</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PHOTO_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            const isSuggested = suggestedCategories.includes(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "p-3 border rounded-lg transition-all duration-200 text-left",
                  isSelected 
                    ? "border-professional-500 bg-professional-50" 
                    : "border-gray-200 hover:border-gray-300",
                  isSuggested && !isSelected && "border-professional-200 bg-professional-25"
                )}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <IconComponent className={cn(
                    "w-4 h-4",
                    isSelected ? "text-professional-600" : "text-gray-600"
                  )} />
                  {isSuggested && (
                    <div className="w-2 h-2 bg-professional-500 rounded-full" />
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {category.name}
                </div>
                <div className="text-xs text-gray-600">
                  {category.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Category Info */}
      {currentCategoryConfig && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <currentCategoryConfig.icon className="w-5 h-5 text-professional-600 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-2">
                {currentCategoryConfig.name}
              </h5>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700 mb-1">Examples:</div>
                  <ul className="text-gray-600 space-y-0.5">
                    {currentCategoryConfig.examples.map((example, index) => (
                      <li key={index}>• {example}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Tips:</div>
                  <ul className="text-gray-600 space-y-0.5">
                    {currentCategoryConfig.tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-all duration-200",
          dragActive 
            ? "border-professional-500 bg-professional-50" 
            : "border-gray-300 hover:border-gray-400",
          photos.length >= maxPhotos && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Upload className="w-12 h-12 text-gray-400" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Upload Photos for: {currentCategoryConfig?.name}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop photos here, or click to select files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= maxPhotos}
              className="bg-professional-500 text-white px-6 py-2 rounded-lg hover:bg-professional-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose Files
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {photos.length}/{maxPhotos} photos uploaded • JPG, PNG up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Uploaded Photos */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            Uploaded Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => {
              const categoryConfig = PHOTO_CATEGORIES.find(cat => cat.id === photo.category);
              
              return (
                <div key={photo.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img
                      src={photo.preview}
                      alt="Diagnostic photo"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {categoryConfig && (
                            <categoryConfig.icon className="w-4 h-4 text-professional-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {categoryConfig?.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        placeholder="Add description (optional)..."
                        value={photo.description || ''}
                        onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-md p-2 resize-none"
                        rows={2}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {photo.file.name} • {(photo.file.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Photo Upload Benefits */}
      <div className="bg-gradient-to-r from-trust-50 to-professional-50 border border-trust-200 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Check className="w-5 h-5 text-green-600 mr-2" />
          Benefits of Photo Upload
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-800 mb-1">Faster Diagnosis</div>
            <div className="text-gray-600">Technicians can prepare before your laptop arrives</div>
          </div>
          <div>
            <div className="font-medium text-gray-800 mb-1">Accurate Quotes</div>
            <div className="text-gray-600">More precise repair estimates based on visible damage</div>
          </div>
          <div>
            <div className="font-medium text-gray-800 mb-1">No Surprises</div>
            <div className="text-gray-600">Identify potential additional issues early</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPhotoUpload;