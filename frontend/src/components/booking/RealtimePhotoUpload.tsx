'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useWebSocket, useWebSocketSubscription } from '@/hooks/useWebSocket';

interface RealtimePhotoUploadProps {
  onPhotosAnalyzed?: (analysis: PhotoAnalysisResult[]) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  sessionId?: string;
  className?: string;
}

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  analysis?: PhotoAnalysisResult;
  error?: string;
}

interface PhotoAnalysisResult {
  photoId: string;
  damageDetection: DamageDetection;
  deviceRecognition: DeviceRecognition;
  qualityAssessment: QualityAssessment;
  repairRecommendations: RepairRecommendation[];
  confidence: number;
  processingTime: number;
}

interface DamageDetection {
  hasVisibleDamage: boolean;
  damageTypes: Array<{
    type: 'screen_crack' | 'dent' | 'water_damage' | 'port_damage' | 'button_damage' | 'cosmetic';
    severity: 'minor' | 'moderate' | 'severe';
    location: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  overallSeverity: 'minor' | 'moderate' | 'severe';
}

interface DeviceRecognition {
  detectedBrand?: string;
  detectedModel?: string;
  detectedYear?: number;
  confidence: number;
  deviceCategory: 'smartphone' | 'tablet' | 'laptop' | 'desktop' | 'accessory' | 'unknown';
}

interface QualityAssessment {
  imageQuality: 'poor' | 'fair' | 'good' | 'excellent';
  lighting: 'poor' | 'fair' | 'good' | 'excellent';
  focus: 'poor' | 'fair' | 'good' | 'excellent';
  angle: 'poor' | 'fair' | 'good' | 'excellent';
  recommendations: string[];
}

interface RepairRecommendation {
  repairType: string;
  priority: 'low' | 'medium' | 'high';
  estimatedCost: number;
  estimatedTime: number;
  description: string;
  urgency: string;
}

interface UploadProgress {
  photoId: string;
  percentage: number;
  stage: 'uploading' | 'processing' | 'analyzing' | 'completed';
  eta?: number;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 5;

export default function RealtimePhotoUpload({
  onPhotosAnalyzed,
  onUploadProgress,
  maxFiles = MAX_FILES,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = MAX_FILE_SIZE_MB,
  sessionId: providedSessionId,
  className
}: RealtimePhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isConnected, sendMessage } = useWebSocket();

  // Generate session ID if not provided
  const sessionId = useMemo(() => {
    if (providedSessionId) return providedSessionId;
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('photo_session_id');
      if (!id) {
        id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('photo_session_id', id);
      }
      return id;
    }
    return `photo_${Date.now()}`;
  }, [providedSessionId]);

  // Real-time upload progress updates
  useWebSocketSubscription('upload_progress', (data: UploadProgress) => {
    if (data.photoId) {
      setPhotos(prev => prev.map(photo => 
        photo.id === data.photoId 
          ? { ...photo, progress: data.percentage, status: data.stage === 'completed' ? 'completed' : 'uploading' }
          : photo
      ));
      
      if (onUploadProgress) {
        onUploadProgress(data);
      }
    }
  });

  // Real-time photo analysis results
  useWebSocketSubscription('photo_analysis_result', (data: { sessionId: string; analysis: PhotoAnalysisResult }) => {
    if (data.sessionId === sessionId) {
      setPhotos(prev => prev.map(photo => 
        photo.id === data.analysis.photoId 
          ? { ...photo, analysis: data.analysis, status: 'completed' }
          : photo
      ));

      if (onPhotosAnalyzed) {
        onPhotosAnalyzed([data.analysis]);
      }
    }
  });

  // Real-time processing status updates
  useWebSocketSubscription('photo_processing_status', (data: { sessionId: string; photoId: string; stage: string; progress: number }) => {
    if (data.sessionId === sessionId) {
      setPhotos(prev => prev.map(photo => 
        photo.id === data.photoId 
          ? { ...photo, progress: data.progress, status: data.stage as any }
          : photo
      ));
    }
  });

  // Error handling
  useWebSocketSubscription('photo_analysis_error', (data: { sessionId: string; photoId: string; error: string }) => {
    if (data.sessionId === sessionId) {
      setPhotos(prev => prev.map(photo => 
        photo.id === data.photoId 
          ? { ...photo, status: 'error', error: data.error }
          : photo
      ));
    }
  });

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File too large. Maximum size: ${maxFileSize}MB`;
    }
    
    return null;
  };

  const createPhotoFile = async (file: File): Promise<PhotoFile> => {
    const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id,
          file,
          preview: e.target?.result as string,
          status: 'pending',
          progress: 0,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentPhotoCount = photos.length;
    
    if (currentPhotoCount + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed. Currently have ${currentPhotoCount} photos.`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Create photo file objects
    const newPhotos = await Promise.all(validFiles.map(createPhotoFile));
    setPhotos(prev => [...prev, ...newPhotos]);

    // Start upload and analysis process
    processPhotos(newPhotos);
  };

  const processPhotos = async (photosToProcess: PhotoFile[]) => {
    setIsProcessing(true);

    for (const photo of photosToProcess) {
      try {
        // Update status to uploading
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, status: 'uploading' } : p
        ));

        // Create FormData for upload
        const formData = new FormData();
        formData.append('photo', photo.file);
        formData.append('sessionId', sessionId);
        formData.append('photoId', photo.id);

        // Send via WebSocket if connected, otherwise use HTTP upload
        if (isConnected) {
          // Convert file to base64 for WebSocket transmission
          const base64 = await fileToBase64(photo.file);
          
          sendMessage({
            type: 'photo_upload_and_analyze',
            payload: {
              sessionId,
              photoId: photo.id,
              filename: photo.file.name,
              mimeType: photo.file.type,
              size: photo.file.size,
              data: base64,
            },
            timestamp: new Date().toISOString()
          });
        } else {
          // Fallback to HTTP upload
          await uploadPhotoHTTP(photo, formData);
        }

      } catch (error) {
        console.error('Photo processing error:', error);
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, status: 'error', error: 'Upload failed' } 
            : p
        ));
      }
    }

    setIsProcessing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
    });
  };

  const uploadPhotoHTTP = async (photo: PhotoFile, formData: FormData) => {
    const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3011' : '';
    
    const response = await fetch(`${API_BASE}/api/photos/upload-analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update photo with analysis result
    setPhotos(prev => prev.map(p => 
      p.id === photo.id 
        ? { ...p, status: 'completed', analysis: result.analysis } 
        : p
    ));

    if (onPhotosAnalyzed && result.analysis) {
      onPhotosAnalyzed([result.analysis]);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const retryPhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      setPhotos(prev => prev.map(p => 
        p.id === photoId 
          ? { ...p, status: 'pending', error: undefined, progress: 0 } 
          : p
      ));
      processPhotos([photo]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const getStatusIcon = (status: PhotoFile['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '📤';
      case 'analyzing': return '🔍';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📷';
    }
  };

  const getStatusColor = (status: PhotoFile['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-500';
      case 'analyzing': return 'text-purple-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDamageIcon = (damageType: string) => {
    switch (damageType) {
      case 'screen_crack': return '📱💥';
      case 'dent': return '🔨';
      case 'water_damage': return '💧';
      case 'port_damage': return '🔌';
      case 'button_damage': return '🔘';
      case 'cosmetic': return '✨';
      default: return '🔧';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'text-yellow-600 bg-yellow-50';
      case 'moderate': return 'text-orange-600 bg-orange-50';
      case 'severe': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate overall progress
  React.useEffect(() => {
    if (photos.length === 0) {
      setOverallProgress(0);
      return;
    }

    const totalProgress = photos.reduce((sum, photo) => {
      if (photo.status === 'completed') return sum + 100;
      if (photo.status === 'error') return sum + 0;
      return sum + photo.progress;
    }, 0);

    setOverallProgress(Math.round(totalProgress / photos.length));
  }, [photos]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-orange-500"
          )} />
          <span className="text-gray-600">
            {isConnected ? 'Real-time analysis enabled' : 'Standard upload mode'}
          </span>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Processing photos...</span>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400",
          photos.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => photos.length < maxFiles && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">📷</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Device Photos
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop photos here, or click to select files
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Supported formats: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}</p>
            <p>Maximum file size: {maxFileSize}MB</p>
            <p>Maximum {maxFiles} photos ({photos.length} uploaded)</p>
          </div>
          
          {photos.length > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Overall progress: {overallProgress}%
              </p>
            </div>
          )}
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="p-4">
              <div className="flex gap-4">
                {/* Photo Preview */}
                <div className="relative flex-shrink-0">
                  <img
                    src={photo.preview}
                    alt="Device photo"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="absolute -top-2 -right-2">
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Photo Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getStatusIcon(photo.status)}</span>
                    <span className={cn("text-sm font-medium", getStatusColor(photo.status))}>
                      {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-2">
                    {photo.file.name}
                  </p>

                  {/* Progress Bar */}
                  {photo.status !== 'completed' && photo.status !== 'error' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${photo.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {photo.error && (
                    <div className="text-xs text-red-600 mb-2">
                      {photo.error}
                    </div>
                  )}

                  {/* Analysis Results */}
                  {photo.analysis && (
                    <div className="space-y-2 text-xs">
                      {/* Device Recognition */}
                      {photo.analysis.deviceRecognition.detectedBrand && (
                        <div className="flex items-center gap-1">
                          <span>📱</span>
                          <span className="text-gray-600">
                            {photo.analysis.deviceRecognition.detectedBrand} {photo.analysis.deviceRecognition.detectedModel}
                          </span>
                        </div>
                      )}

                      {/* Damage Detection */}
                      {photo.analysis.damageDetection.hasVisibleDamage && (
                        <div className="space-y-1">
                          {photo.analysis.damageDetection.damageTypes.map((damage, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span>{getDamageIcon(damage.type)}</span>
                              <span className={cn(
                                "px-1 py-0.5 rounded text-xs",
                                getSeverityColor(damage.severity)
                              )}>
                                {damage.type.replace('_', ' ')} ({damage.severity})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Repair Recommendations */}
                      {photo.analysis.repairRecommendations.length > 0 && (
                        <div className="text-xs text-blue-600">
                          💡 {photo.analysis.repairRecommendations.length} repair recommendations
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {photo.status === 'error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryPhoto(photo.id)}
                      className="mt-2 text-xs h-6"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Overall Analysis Summary */}
      {photos.some(p => p.analysis) && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Photo Analysis Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📷</div>
              <div className="font-medium">{photos.filter(p => p.status === 'completed').length}</div>
              <div className="text-gray-600">Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🔍</div>
              <div className="font-medium">
                {photos.filter(p => p.analysis?.damageDetection.hasVisibleDamage).length}
              </div>
              <div className="text-gray-600">Damage Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📱</div>
              <div className="font-medium">
                {photos.filter(p => p.analysis?.deviceRecognition.detectedBrand).length}
              </div>
              <div className="text-gray-600">Devices ID'd</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💡</div>
              <div className="font-medium">
                {photos.reduce((sum, p) => sum + (p.analysis?.repairRecommendations.length || 0), 0)}
              </div>
              <div className="text-gray-600">Recommendations</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}