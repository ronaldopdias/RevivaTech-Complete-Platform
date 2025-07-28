'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, FlashOn, FlashOff, RotateCw, CheckCircle, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { haptics } from '@/components/mobile/NativeFeatures';

interface DeviceDetection {
  confidence: number;
  brand?: string;
  model?: string;
  type: 'smartphone' | 'laptop' | 'tablet' | 'desktop' | 'unknown';
  suggestions: string[];
}

interface SmartCameraCaptureProps {
  onPhotoCapture: (file: File, detection?: DeviceDetection) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  expectedDeviceType?: string;
  className?: string;
}

export function SmartCameraCapture({ 
  onPhotoCapture, 
  onError, 
  onClose,
  expectedDeviceType,
  className = '' 
}: SmartCameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deviceDetection, setDeviceDetection] = useState<DeviceDetection | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      startCamera();
      startRealTimeAnalysis();
    } else {
      stopCamera();
      stopRealTimeAnalysis();
    }

    return () => {
      stopCamera();
      stopRealTimeAnalysis();
    };
  }, [isActive, facingMode]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 4096 },
          height: { ideal: 1080, max: 3072 },
          frameRate: { ideal: 30 },
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Flash support (experimental)
      if (flashEnabled && 'getCapabilities' in mediaStream.getVideoTracks()[0]) {
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: flashEnabled }]
          } as any);
        }
      }

      haptics.light();
    } catch (error) {
      console.error('Camera access error:', error);
      onError?.('Camera access denied or not available');
    }
  }, [facingMode, flashEnabled, onError, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startRealTimeAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    analysisIntervalRef.current = setInterval(() => {
      if (videoRef.current && !isAnalyzing) {
        analyzeFrame();
      }
    }, 2000); // Analyze every 2 seconds
  }, [isAnalyzing]);

  const stopRealTimeAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame
      context.drawImage(video, 0, 0);

      // Get image data for analysis
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simulate AI device detection (replace with actual ML model)
      const detection = await simulateDeviceDetection(imageData, expectedDeviceType);
      
      setDeviceDetection(detection);
      
      // Draw detection overlay
      drawDetectionOverlay(detection);

    } catch (error) {
      console.error('Frame analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [expectedDeviceType]);

  const simulateDeviceDetection = async (
    imageData: ImageData, 
    expectedType?: string
  ): Promise<DeviceDetection> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simple heuristic-based detection (replace with actual ML)
    const { width, height } = imageData;
    const aspectRatio = width / height;
    
    let type: DeviceDetection['type'] = 'unknown';
    let confidence = 0.3;
    let suggestions: string[] = [];

    // Basic aspect ratio detection
    if (aspectRatio > 1.5 && aspectRatio < 2.0) {
      type = 'laptop';
      confidence = 0.7;
      suggestions = ['MacBook Pro', 'MacBook Air', 'Dell XPS', 'ThinkPad'];
    } else if (aspectRatio > 0.4 && aspectRatio < 0.8) {
      type = 'smartphone';
      confidence = 0.8;
      suggestions = ['iPhone 15', 'iPhone 14', 'Samsung Galaxy', 'Google Pixel'];
    } else if (aspectRatio > 0.7 && aspectRatio < 1.4) {
      type = 'tablet';
      confidence = 0.6;
      suggestions = ['iPad Pro', 'iPad Air', 'Samsung Galaxy Tab'];
    } else if (aspectRatio > 1.3 && aspectRatio < 1.8) {
      type = 'desktop';
      confidence = 0.5;
      suggestions = ['iMac', 'Mac Studio', 'Desktop PC'];
    }

    // Boost confidence if matches expected type
    if (expectedType && type === expectedType) {
      confidence = Math.min(confidence + 0.2, 0.95);
    }

    return {
      confidence,
      type,
      suggestions: suggestions.slice(0, 3),
      brand: type === 'smartphone' && Math.random() > 0.5 ? 'Apple' : undefined,
      model: suggestions[0]
    };
  };

  const drawDetectionOverlay = useCallback((detection: DeviceDetection) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear previous overlay
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video display
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw detection box if confidence is high enough
    if (detection.confidence > 0.6) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const boxWidth = canvas.width * 0.6;
      const boxHeight = canvas.height * 0.6;

      // Detection box
      context.strokeStyle = '#10B981';
      context.lineWidth = 3;
      context.setLineDash([]);
      context.strokeRect(
        centerX - boxWidth / 2,
        centerY - boxHeight / 2,
        boxWidth,
        boxHeight
      );

      // Corner markers
      const cornerSize = 20;
      const corners = [
        [centerX - boxWidth / 2, centerY - boxHeight / 2],
        [centerX + boxWidth / 2, centerY - boxHeight / 2],
        [centerX - boxWidth / 2, centerY + boxHeight / 2],
        [centerX + boxWidth / 2, centerY + boxHeight / 2],
      ];

      corners.forEach(([x, y]) => {
        context.strokeStyle = '#10B981';
        context.lineWidth = 4;
        
        // Top-left corner
        if (x < centerX && y < centerY) {
          context.beginPath();
          context.moveTo(x, y + cornerSize);
          context.lineTo(x, y);
          context.lineTo(x + cornerSize, y);
          context.stroke();
        }
        // Top-right corner
        else if (x > centerX && y < centerY) {
          context.beginPath();
          context.moveTo(x - cornerSize, y);
          context.lineTo(x, y);
          context.lineTo(x, y + cornerSize);
          context.stroke();
        }
        // Bottom-left corner
        else if (x < centerX && y > centerY) {
          context.beginPath();
          context.moveTo(x, y - cornerSize);
          context.lineTo(x, y);
          context.lineTo(x + cornerSize, y);
          context.stroke();
        }
        // Bottom-right corner
        else if (x > centerX && y > centerY) {
          context.beginPath();
          context.moveTo(x - cornerSize, y);
          context.lineTo(x, y);
          context.lineTo(x, y - cornerSize);
          context.stroke();
        }
      });
    }
  }, []);

  const optimizeImage = useCallback(async (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      // High quality JPEG with optimization
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', 0.92);
    });
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsOptimizing(true);
    haptics.medium();

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas to high resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      context.drawImage(video, 0, 0);

      // Optimize image
      const optimizedBlob = await optimizeImage(canvas);
      const file = new File([optimizedBlob], `device-photo-${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });

      setCaptureCount(prev => prev + 1);
      
      // Final analysis on captured image
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const finalDetection = await simulateDeviceDetection(imageData, expectedDeviceType);

      haptics.success();
      onPhotoCapture(file, finalDetection);

    } catch (error) {
      console.error('Photo capture error:', error);
      haptics.error();
      onError?.('Failed to capture photo');
    } finally {
      setIsOptimizing(false);
    }
  }, [onPhotoCapture, onError, optimizeImage, expectedDeviceType]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    haptics.light();
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashEnabled(prev => !prev);
    haptics.light();
  }, []);

  return (
    <div className={className}>
      {/* Camera Trigger */}
      {!isActive && (
        <Button
          onClick={() => setIsActive(true)}
          className="w-full flex items-center justify-center gap-3 py-4"
          variant="primary"
        >
          <Camera className="w-5 h-5" />
          <span>Smart Camera</span>
          <Sparkles className="w-4 h-4" />
        </Button>
      )}

      {/* Camera Interface */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Video Stream */}
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Detection Overlay Canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              />

              {/* AI Detection Info */}
              <AnimatePresence>
                {deviceDetection && deviceDetection.confidence > 0.6 && (
                  <motion.div
                    className="absolute top-20 left-4 right-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-semibold">Device Detected</span>
                        <span className="text-sm text-green-400">
                          {Math.round(deviceDetection.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <div className="mb-1">
                          Type: <span className="font-medium capitalize">{deviceDetection.type}</span>
                        </div>
                        {deviceDetection.model && (
                          <div className="mb-1">
                            Suggested: <span className="font-medium">{deviceDetection.model}</span>
                          </div>
                        )}
                        {deviceDetection.suggestions.length > 0 && (
                          <div className="text-xs text-gray-300">
                            Similar: {deviceDetection.suggestions.slice(1).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analysis Indicator */}
              {isAnalyzing && (
                <div className="absolute top-4 right-4">
                  <div className="bg-blue-500 rounded-full p-2">
                    <Zap className="w-4 h-4 text-white animate-pulse" />
                  </div>
                </div>
              )}

              {/* Camera Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                {/* Top Row - Settings */}
                <div className="flex justify-between items-center mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFlash}
                    className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  >
                    {flashEnabled ? (
                      <FlashOn className="w-5 h-5" />
                    ) : (
                      <FlashOff className="w-5 h-5" />
                    )}
                  </Button>

                  {captureCount > 0 && (
                    <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-sm">{captureCount} photos</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCamera}
                    className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-between">
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setIsActive(false);
                      onClose?.();
                    }}
                    className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  >
                    <X className="w-6 h-6" />
                  </Button>

                  {/* Capture Button */}
                  <Button
                    onClick={capturePhoto}
                    disabled={isOptimizing}
                    className={`
                      w-20 h-20 rounded-full border-4 border-white
                      flex items-center justify-center relative overflow-hidden
                      ${isOptimizing ? 'bg-blue-500' : 'bg-white'}
                      ${deviceDetection?.confidence && deviceDetection.confidence > 0.6 ? 'shadow-lg shadow-green-500/50' : ''}
                    `}
                  >
                    {isOptimizing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <div className={`
                        w-16 h-16 rounded-full
                        ${deviceDetection?.confidence && deviceDetection.confidence > 0.6 ? 'bg-green-500' : 'bg-gray-300'}
                      `} />
                    )}
                  </Button>

                  {/* Gallery Button */}
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                    disabled
                  >
                    <div className="w-8 h-8 bg-gray-600 rounded-lg" />
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-center mt-4">
                  <p className="text-white text-sm opacity-80">
                    {deviceDetection?.confidence && deviceDetection.confidence > 0.6
                      ? 'Perfect! Tap to capture'
                      : 'Position device in frame for best results'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SmartCameraCapture;