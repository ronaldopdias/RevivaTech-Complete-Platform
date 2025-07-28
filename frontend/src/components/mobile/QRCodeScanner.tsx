'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

interface QRScanResult {
  data: string;
  format: string;
  timestamp: number;
  confidence?: number;
}

interface QRCodeScannerProps {
  onScan: (result: QRScanResult) => void;
  onError?: (error: string) => void;
  className?: string;
  showOverlay?: boolean;
  autoStart?: boolean;
  scanDelay?: number;
  preferredCamera?: 'user' | 'environment';
}

export function QRCodeScanner({
  onScan,
  onError,
  className = '',
  showOverlay = true,
  autoStart = true,
  scanDelay = 300,
  preferredCamera = 'environment'
}: QRCodeScannerProps) {
  const [isActive, setIsActive] = useState(autoStart);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [lastScan, setLastScan] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);
  const animationRef = useRef<number>();

  // Initialize camera devices
  useEffect(() => {
    const getCameraDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const cameras = mediaDevices.filter(device => device.kind === 'videoinput');
        setDevices(cameras);
        
        // Select preferred camera
        const preferredDevice = cameras.find(device => 
          device.label.toLowerCase().includes(preferredCamera === 'environment' ? 'back' : 'front')
        ) || cameras[0];
        
        if (preferredDevice) {
          setCurrentDeviceId(preferredDevice.deviceId);
        }
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
        onError?.('Failed to access camera devices');
      }
    };

    getCameraDevices();
  }, [preferredCamera, onError]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      // Request camera permission
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
          facingMode: preferredCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setHasPermission(true);
      
      // Initialize QR scanner (using a hypothetical QR library)
      // In practice, you'd use a library like @zxing/library or qr-scanner
      initializeScanner();
      
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
      onError?.('Camera access denied or unavailable');
    }
  }, [currentDeviceId, preferredCamera, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Mock QR scanner implementation
  const initializeScanner = useCallback(() => {
    const scanFrame = () => {
      if (!isActive || !videoRef.current) return;
      
      // Mock QR detection (in practice, use a real QR library)
      const now = Date.now();
      if (now - lastScan > scanDelay) {
        // Simulate QR code detection
        if (Math.random() > 0.98) { // 2% chance per frame for demo
          const mockResult: QRScanResult = {
            data: 'DEVICE:iPhone-14-Pro:A2894:2023',
            format: 'QR_CODE',
            timestamp: now,
            confidence: 0.95
          };
          
          setLastScan(now);
          onScan(mockResult);
          
          // Haptic feedback for successful scan
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50]);
          }
          
          // Visual feedback
          setIsActive(false);
          setTimeout(() => setIsActive(true), 2000);
        }
      }
      
      animationRef.current = requestAnimationFrame(scanFrame);
    };
    
    scanFrame();
  }, [isActive, scanDelay, lastScan, onScan]);

  // Toggle camera on/off
  const toggleCamera = () => {
    if (isActive) {
      stopCamera();
      setIsActive(false);
    } else {
      setIsActive(true);
      startCamera();
    }
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    const nextIndex = (devices.findIndex(d => d.deviceId === currentDeviceId) + 1) % devices.length;
    setCurrentDeviceId(devices[nextIndex]?.deviceId || '');
  };

  // Toggle flashlight (if supported)
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.();
      
      if (capabilities?.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !isFlashOn }]
        });
        setIsFlashOn(!isFlashOn);
      }
    } catch (error) {
      console.error('Flash control error:', error);
    }
  };

  // Start camera when component mounts or becomes active
  useEffect(() => {
    if (isActive && currentDeviceId) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive, currentDeviceId, startCamera, stopCamera]);

  // Handle device changes
  useEffect(() => {
    if (isActive && currentDeviceId) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [currentDeviceId]);

  if (hasPermission === false) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <Icon name="camera-off" size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Camera Access Required</h3>
        <p className="text-gray-500 text-center mb-4">
          Please enable camera access to scan QR codes for device identification.
        </p>
        <button
          onClick={startCamera}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
        >
          Enable Camera
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      
      {/* Camera Overlay */}
      <AnimatePresence>
        {showOverlay && isActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Scanning Frame */}
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
              {/* Corner Indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
              
              {/* Scanning Line */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-lg shadow-primary-500/50"
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-white text-sm font-medium">
                  Position QR code within the frame
                </p>
                <p className="text-white/80 text-xs mt-1">
                  Device serial numbers and model info supported
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Camera Toggle */}
        <motion.button
          className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          onClick={toggleCamera}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name={isActive ? "camera-off" : "camera"} size={20} />
        </motion.button>
        
        {/* Camera Switch */}
        {devices.length > 1 && (
          <motion.button
            className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            onClick={switchCamera}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="refresh-cw" size={20} />
          </motion.button>
        )}
        
        {/* Flash Toggle */}
        <motion.button
          className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center text-white ${
            isFlashOn ? 'bg-primary-500' : 'bg-black/50'
          }`}
          onClick={toggleFlash}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name={isFlashOn ? "zap-off" : "zap"} size={20} />
        </motion.button>
      </div>
      
      {/* Status Indicator */}
      <div className="absolute top-4 left-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
          isActive 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
          {isActive ? 'Scanning' : 'Paused'}
        </div>
      </div>
    </div>
  );
}

// QR Scanner Hook for easy integration
export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = () => {
    setIsScanning(true);
    setError(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleScan = (result: QRScanResult) => {
    setLastResult(result);
    // Auto-stop after successful scan
    setIsScanning(false);
  };

  const handleError = (error: string) => {
    setError(error);
    setIsScanning(false);
  };

  // Parse device information from QR code
  const parseDeviceInfo = (data: string) => {
    try {
      // Parse format: "DEVICE:ModelName:SerialNumber:Year"
      if (data.startsWith('DEVICE:')) {
        const parts = data.split(':');
        return {
          type: 'device',
          model: parts[1],
          serial: parts[2],
          year: parts[3],
          raw: data
        };
      }
      
      // Parse URL format
      if (data.startsWith('http')) {
        return {
          type: 'url',
          url: data,
          raw: data
        };
      }
      
      // Generic text
      return {
        type: 'text',
        text: data,
        raw: data
      };
    } catch (error) {
      return {
        type: 'unknown',
        raw: data
      };
    }
  };

  return {
    isScanning,
    lastResult,
    error,
    startScanning,
    stopScanning,
    handleScan,
    handleError,
    parseDeviceInfo
  };
}

export default QRCodeScanner;