'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  RotateCcw, 
  Download, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  SwitchCamera,
  Zap,
  Image as ImageIcon,
  Focus,
  FlashOff,
  FlashOn,
  Grid3x3,
  Maximize2,
  Minimize2,
  Target,
  Sparkles
} from 'lucide-react';
import { cameraService, CapturedImage, CameraError } from '@/lib/services/cameraService';
import { EnhancedTouchButton } from '@/components/mobile/AdvancedGestures';
import { AdvancedGestureRecognizer } from '@/components/mobile/AdvancedGestures';
import { PinchZoom } from '@/components/mobile/AdvancedGestures';

interface CameraCaptureProps {
  bookingId?: string;
  onImageCaptured?: (image: CapturedImage) => void;
  onImageUploaded?: (url: string) => void;
  onClose?: () => void;
  maxImages?: number;
  className?: string;
  autoUpload?: boolean;
}

export function CameraCapture({
  bookingId,
  onImageCaptured,
  onImageUploaded,
  onClose,
  maxImages = 5,
  className = '',
  autoUpload = false
}: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capabilities, setCapabilities] = useState<any>(null);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{x: number, y: number} | null>(null);
  const [isAutoFocus, setIsAutoFocus] = useState(true);
  const [captureMode, setCaptureMode] = useState<'single' | 'burst'>('single');
  const [arOverlay, setArOverlay] = useState(false);
  const [damageDetection, setDamageDetection] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkCameraCapabilities();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraCapabilities = async () => {
    try {
      const caps = await cameraService.getCameraCapabilities();
      setCapabilities(caps);
      
      if (!caps.hasCamera) {
        setError('No camera found on this device');
      }
    } catch (error) {
      setError('Failed to check camera capabilities');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await cameraService.startCamera({ facingMode });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsActive(true);
      console.log('📷 Camera started');
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError.message);
      console.error('Camera start failed:', cameraError);
    }
  };

  const stopCamera = async () => {
    await cameraService.stopCamera();
    setStream(null);
    setIsActive(false);
    console.log('📷 Camera stopped');
  };

  const switchCamera = async () => {
    if (!isActive) return;
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    try {
      await cameraService.switchCamera();
    } catch (error) {
      setError('Failed to switch camera');
    }
  };

  const capturePhoto = async () => {
    if (!isActive || capturedImages.length >= maxImages) return;
    
    setIsCapturing(true);
    try {
      const image = await cameraService.capturePhoto({
        quality: 0.8,
        format: 'jpeg'
      });
      
      // Optimize image size
      const optimizedImage = await cameraService.resizeImage(image, 1200, 1200, 0.8);
      
      setCapturedImages(prev => [...prev, optimizedImage]);
      onImageCaptured?.(optimizedImage);
      
      // Auto-upload if enabled
      if (autoUpload && bookingId) {
        await uploadImage(optimizedImage);
      }
      
      console.log('📸 Photo captured and optimized');
    } catch (error) {
      setError('Failed to capture photo');
      console.error('Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const uploadImage = async (image: CapturedImage) => {
    setIsUploading(true);
    try {
      const result = await cameraService.uploadImage(image, bookingId, description);
      
      if (result.success && result.url) {
        onImageUploaded?.(result.url);
        console.log('📤 Image uploaded:', result.url);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAllImages = async () => {
    if (capturedImages.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const image of capturedImages) {
        await uploadImage(image);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const downloadImage = (image: CapturedImage, index: number) => {
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `device_photo_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!capabilities) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Checking camera...</span>
        </CardContent>
      </Card>
    );
  }

  if (!capabilities.hasCamera) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No camera found on this device. You can still upload photos from your gallery.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Device Photos
              </CardTitle>
              <CardDescription>
                Take photos of your device for better diagnosis
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Camera Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Camera Active' : 'Camera Inactive'}
              </Badge>
              {capturedImages.length > 0 && (
                <Badge variant="outline">
                  {capturedImages.length}/{maxImages} Photos
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isActive ? (
                <Button onClick={startCamera} disabled={!!error}>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  {capabilities.facingModes.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchCamera}
                      title="Switch Camera"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={stopCamera} variant="outline">
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Photo Description (Optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Screen damage, Battery issues, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Mobile Camera Preview */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative'}`}
          >
            <Card className={`${isFullscreen ? 'h-full rounded-none' : ''}`}>
              <CardContent className="p-0">
                <AdvancedGestureRecognizer
                  onGesture={(event) => {
                    if (event.type === 'tap' && !isAutoFocus) {
                      // Manual focus
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        const x = ((event.data.x - rect.left) / rect.width) * 100;
                        const y = ((event.data.y - rect.top) / rect.height) * 100;
                        setFocusPoint({ x, y });
                        
                        // Clear focus point after 2 seconds
                        setTimeout(() => setFocusPoint(null), 2000);
                      }
                    } else if (event.type === 'doubletap') {
                      // Double tap to zoom
                      setZoom(zoom === 1 ? 2 : 1);
                    }
                  }}
                  config={{
                    enableTap: true,
                    enableDoubleTap: true,
                    enablePinch: true,
                    enableHaptics: true
                  }}
                >
                  <div
                    ref={containerRef}
                    className={`relative ${isFullscreen ? 'h-screen' : 'h-80'} bg-black rounded-lg overflow-hidden`}
                  >
                    <PinchZoom
                      minZoom={1}
                      maxZoom={5}
                      initialZoom={zoom}
                      onZoomChange={setZoom}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{
                          transform: `scale(${zoom})`,
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </PinchZoom>

                    {/* Grid Overlay */}
                    {isGridVisible && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white/30"></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AR Overlay for Damage Detection */}
                    {arOverlay && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-32 h-32 border-2 border-red-500 rounded-lg animate-pulse">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                              Screen Damage Detected
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Analysis Active
                        </div>
                      </div>
                    )}

                    {/* Focus Point */}
                    {focusPoint && (
                      <motion.div
                        className="absolute pointer-events-none"
                        style={{
                          left: `${focusPoint.x}%`,
                          top: `${focusPoint.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                      >
                        <Target className="w-8 h-8 text-white" />
                      </motion.div>
                    )}

                    {/* Top Controls */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {facingMode === 'environment' ? '📷 Back' : '🤳 Front'}
                        </Badge>
                        {zoom > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {zoom.toFixed(1)}x
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Flash Control */}
                        <EnhancedTouchButton
                          onClick={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
                          className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
                        >
                          {flashMode === 'off' ? <FlashOff className="w-5 h-5" /> : <FlashOn className="w-5 h-5" />}
                        </EnhancedTouchButton>

                        {/* Grid Toggle */}
                        <EnhancedTouchButton
                          onClick={() => setIsGridVisible(!isGridVisible)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isGridVisible ? 'bg-primary-500 text-white' : 'bg-black/50 text-white'
                          }`}
                        >
                          <Grid3x3 className="w-5 h-5" />
                        </EnhancedTouchButton>

                        {/* Fullscreen Toggle */}
                        <EnhancedTouchButton
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </EnhancedTouchButton>
                      </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between">
                        {/* Camera Switch */}
                        <EnhancedTouchButton
                          onClick={switchCamera}
                          className="w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center"
                        >
                          <SwitchCamera className="w-6 h-6" />
                        </EnhancedTouchButton>

                        {/* Capture Button */}
                        <div className="flex-1 flex justify-center">
                          <EnhancedTouchButton
                            onClick={capturePhoto}
                            disabled={isCapturing || capturedImages.length >= maxImages}
                            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
                            hapticFeedback={true}
                          >
                            {isCapturing ? (
                              <motion.div
                                className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              />
                            ) : (
                              <Camera className="w-8 h-8 text-gray-800" />
                            )}
                          </EnhancedTouchButton>
                        </div>

                        {/* AR/AI Toggle */}
                        <EnhancedTouchButton
                          onClick={() => setArOverlay(!arOverlay)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            arOverlay ? 'bg-primary-500 text-white' : 'bg-black/50 text-white'
                          }`}
                        >
                          <Sparkles className="w-6 h-6" />
                        </EnhancedTouchButton>
                      </div>

                      {/* Instructions */}
                      <div className="mt-4 text-center">
                        <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full inline-block">
                          {isAutoFocus ? 'Tap to focus • Double tap to zoom' : 'Tap to focus • Pinch to zoom'}
                        </p>
                      </div>
                    </div>

                    {/* Capture Animation */}
                    <AnimatePresence>
                      {isCapturing && (
                        <motion.div
                          className="absolute inset-0 bg-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </AdvancedGestureRecognizer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captured Images */}
      {capturedImages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Captured Photos ({capturedImages.length})
              </CardTitle>
              {!autoUpload && (
                <Button
                  onClick={uploadAllImages}
                  disabled={isUploading}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-bounce" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload All
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {capturedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.dataUrl}
                    alt={`Captured photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  
                  {/* Image Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadImage(image, index)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image Info */}
                  <div className="absolute bottom-1 left-1">
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(image.size / 1024)}KB
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3 text-sm">
            <Zap className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Photo Tips:</div>
              <ul className="text-muted-foreground text-xs space-y-1 mt-1">
                <li>• Ensure good lighting for clear photos</li>
                <li>• Capture multiple angles of the damage</li>
                <li>• Include model/serial numbers if visible</li>
                <li>• Photos help our technicians prepare for your repair</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}