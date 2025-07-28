'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Camera Integration Component
interface CameraIntegrationProps {
  onPhotoCapture: (file: File) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function CameraIntegration({ onPhotoCapture, onError, className = '' }: CameraIntegrationProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch (error) {
      onError?.('Camera access denied or not available');
      console.error('Camera error:', error);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob and file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `device-photo-${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        });
        onPhotoCapture(file);
        
        // Strong haptic feedback for capture
        if ('vibrate' in navigator) {
          navigator.vibrate([30, 100, 30]);
        }
      }
    }, 'image/jpeg', 0.9);

    stopCamera();
  }, [onPhotoCapture, stopCamera]);

  return (
    <div className={className}>
      {/* Camera Trigger Button */}
      {!isActive && (
        <motion.button
          className="
            w-full py-4 px-6 bg-primary-500 text-white rounded-xl
            flex items-center justify-center gap-3
            shadow-lg shadow-primary-500/25
            touch-manipulation
          "
          whileTap={{ scale: 0.95 }}
          onClick={startCamera}
        >
          <Icon name="camera" size={24} />
          <span className="font-semibold">Take Device Photo</span>
        </motion.button>
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* AR Overlay for Device Detection */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                w-80 h-80 border-2 border-primary-400 rounded-2xl
                bg-primary-400/10 backdrop-blur-sm
              ">
                <div className="absolute -top-8 left-0 right-0 text-center">
                  <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    Position device in frame
                  </span>
                </div>
              </div>

              {/* Corner Guides */}
              <div className="absolute top-20 left-4">
                <div className="w-8 h-8 border-l-2 border-t-2 border-primary-400 rounded-tl-lg" />
              </div>
              <div className="absolute top-20 right-4">
                <div className="w-8 h-8 border-r-2 border-t-2 border-primary-400 rounded-tr-lg" />
              </div>
              <div className="absolute bottom-32 left-4">
                <div className="w-8 h-8 border-l-2 border-b-2 border-primary-400 rounded-bl-lg" />
              </div>
              <div className="absolute bottom-32 right-4">
                <div className="w-8 h-8 border-r-2 border-b-2 border-primary-400 rounded-br-lg" />
              </div>
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70">
              <div className="flex items-center justify-between">
                {/* Cancel Button */}
                <motion.button
                  className="
                    w-12 h-12 bg-gray-600/80 backdrop-blur-sm
                    rounded-full flex items-center justify-center
                    text-white
                  "
                  whileTap={{ scale: 0.9 }}
                  onClick={stopCamera}
                >
                  <Icon name="x" size={20} />
                </motion.button>

                {/* Capture Button */}
                <motion.button
                  className="
                    w-16 h-16 bg-white rounded-full
                    flex items-center justify-center
                    shadow-lg shadow-black/25
                  "
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                </motion.button>

                {/* Gallery Button */}
                <motion.button
                  className="
                    w-12 h-12 bg-gray-600/80 backdrop-blur-sm
                    rounded-full flex items-center justify-center
                    text-white
                  "
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon name="image" size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Bottom Sheet Component
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  title?: string;
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  snapPoints = [0.25, 0.5, 0.9],
  initialSnap = 1,
  title 
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);

  const handleDragEnd = useCallback((event: any, info: any) => {
    const { offset, velocity } = info;
    const screenHeight = window.innerHeight;
    const currentHeight = screenHeight * snapPoints[currentSnap];
    
    // Determine next snap point based on drag direction and velocity
    let nextSnap = currentSnap;
    
    if (velocity.y > 500 || offset.y > currentHeight * 0.3) {
      // Drag down - go to lower snap point or close
      nextSnap = Math.max(0, currentSnap - 1);
      if (nextSnap === 0) {
        onClose();
        return;
      }
    } else if (velocity.y < -500 || offset.y < -currentHeight * 0.3) {
      // Drag up - go to higher snap point
      nextSnap = Math.min(snapPoints.length - 1, currentSnap + 1);
    }
    
    setCurrentSnap(nextSnap);
    
    // Haptic feedback for snap
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [currentSnap, snapPoints, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl shadow-2xl
              max-h-[90vh] overflow-hidden
            "
            initial={{ y: '100%' }}
            animate={{ 
              y: `${(1 - snapPoints[currentSnap]) * 100}%` 
            }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', damping: 30 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 pb-4">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="px-6 pb-safe-area overflow-y-auto max-h-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Haptic Feedback Utilities
export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },
  notification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  }
};

// Device Info Detection
export const deviceInfo = {
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },
  
  hasCamera: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  },
  
  supportsVibration: () => {
    return 'vibrate' in navigator;
  },
  
  supportsWebShare: () => {
    return 'share' in navigator;
  }
};

export default {
  CameraIntegration,
  BottomSheet,
  haptics,
  deviceInfo
};