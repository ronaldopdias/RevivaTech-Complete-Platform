'use client';

import React, { useState, useEffect } from 'react';
// import { useWebSocket, useWebSocketSubscription } from '@shared/components/realtime/WebSocketProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Monitor, 
  Wifi, 
  WifiOff,
  Camera,
  Scan,
  Upload,
  Zap,
  CheckCircle
} from 'lucide-react';

interface Device {
  id: string;
  display_name: string;
  brand_name: string;
  category_name: string;
  year: number;
  slug: string;
  thumbnail_url?: string;
  repairability_score: number;
  avg_repair_cost: number;
  popularity_score: number;
  confidence_score?: number;
  detection_method?: 'manual' | 'image' | 'smart' | 'serial';
}

interface SmartSuggestion {
  device: Device;
  confidence: number;
  reason: string;
  category: string;
}

interface SmartDeviceDetectorProps {
  onDeviceSelect: (device: Device) => void;
  selectedDevice?: Device | null;
  className?: string;
}

export default function SmartDeviceDetector({ 
  onDeviceSelect, 
  selectedDevice, 
  className = '' 
}: SmartDeviceDetectorProps) {
  const [detectionMode, setDetectionMode] = useState<'browse' | 'smart' | 'image' | 'serial'>('browse');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { isConnected, sendMessage } = useWebSocket();

  // Subscribe to device detection results
  useWebSocketSubscription('device_detection_result', (data) => {
    if (data.suggestions) {
      setSmartSuggestions(data.suggestions);
      setIsScanning(false);
    }
  });

  // Subscribe to image processing results
  useWebSocketSubscription('image_processing_result', (data) => {
    if (data.detected_devices) {
      const suggestions: SmartSuggestion[] = data.detected_devices.map((device: any) => ({
        device,
        confidence: device.confidence || 0.8,
        reason: `Detected from image analysis`,
        category: device.category_name
      }));
      setSmartSuggestions(suggestions);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserAgent(navigator.userAgent);
      
      // Auto-detect based on user agent
      if (isConnected) {
        performSmartDetection();
      }
    }
  }, [isConnected]);

  const performSmartDetection = () => {
    if (!isConnected) return;

    setIsScanning(true);
    
    // Collect device information
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      // Check for mobile device characteristics
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    sendMessage({
      type: 'smart_device_detection',
      payload: {
        deviceInfo,
        sessionId: getSessionId(),
        detection_type: 'user_agent'
      },
      timestamp: new Date().toISOString()
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isConnected) return;

    setImageFile(file);
    setUploadProgress(10);

    // Convert to base64 for WebSocket transmission
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadProgress(50);
      
      sendMessage({
        type: 'image_device_detection',
        payload: {
          image: base64,
          sessionId: getSessionId(),
          filename: file.name,
          fileSize: file.size
        },
        timestamp: new Date().toISOString()
      });
    };
    
    reader.onerror = () => {
      setUploadProgress(0);
      console.error('Failed to read image file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleSerialLookup = () => {
    if (!serialNumber.trim() || !isConnected) return;

    setIsScanning(true);
    
    sendMessage({
      type: 'serial_device_lookup',
      payload: {
        serialNumber: serialNumber.trim(),
        sessionId: getSessionId()
      },
      timestamp: new Date().toISOString()
    });
  };

  const getSessionId = () => {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('device_detection_session');
      if (!sessionId) {
        sessionId = `detect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('device_detection_session', sessionId);
      }
      return sessionId;
    }
    return `detect_${Date.now()}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'smartphone':
      case 'phone':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'laptop':
        return Laptop;
      case 'desktop':
      case 'monitor':
        return Monitor;
      default:
        return Monitor;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Smart Device Detection
        </h2>
        <p className="text-gray-600">
          Let us help identify your device automatically, or browse manually
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Smart detection enabled</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">Smart detection unavailable - browse manually</span>
          </>
        )}
      </div>

      {/* Detection Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { id: 'smart', label: 'Smart Detection', icon: Zap, description: 'Auto-detect from browser info' },
          { id: 'image', label: 'Photo Detection', icon: Camera, description: 'Upload a photo of your device' },
          { id: 'serial', label: 'Serial Lookup', icon: Scan, description: 'Enter device serial number' },
          { id: 'browse', label: 'Manual Browse', icon: Search, description: 'Browse device categories' },
        ].map((mode) => {
          const IconComponent = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setDetectionMode(mode.id as any)}
              disabled={!isConnected && mode.id !== 'browse'}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                detectionMode === mode.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!isConnected && mode.id !== 'browse' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <IconComponent className="h-6 w-6 mb-2" />
              <div className="font-medium">{mode.label}</div>
              <div className="text-sm text-gray-600">{mode.description}</div>
            </button>
          );
        })}
      </div>

      {/* Detection Interface */}
      {detectionMode === 'smart' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Smart Device Detection
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <Button
                  onClick={performSmartDetection}
                  disabled={!isConnected || isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Detect My Device
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Analyzes browser and system information</p>
                <p>• Detects mobile devices, tablets, and desktops</p>
                <p>• No personal data collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {detectionMode === 'image' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Photo Device Detection
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="device-image-upload"
                  disabled={!isConnected}
                />
                <label htmlFor="device-image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Upload a photo of your device
                  </p>
                  <p className="text-sm text-gray-600">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
              
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {detectionMode === 'serial' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Scan className="h-5 w-5 mr-2" />
              Serial Number Lookup
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Device Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., C02XK0QKJHD5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <Button
                onClick={handleSerialLookup}
                disabled={!serialNumber.trim() || !isConnected || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Lookup Device
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Find serial number in device settings</p>
                <p>• Look for stickers on device</p>
                <p>• Check original packaging</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Detected Devices
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {smartSuggestions.map((suggestion, index) => {
                const IconComponent = getCategoryIcon(suggestion.category);
                return (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDevice?.id === suggestion.device.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onDeviceSelect(suggestion.device)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-8 w-8 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {suggestion.device.display_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {suggestion.device.brand_name} • {suggestion.device.year}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.reason}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={getConfidenceColor(suggestion.confidence)}>
                          {Math.round(suggestion.confidence * 100)}% match
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          ~£{suggestion.device.avg_repair_cost}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Device Confirmation */}
      {selectedDevice && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-900">
                    Selected: {selectedDevice.display_name}
                  </h4>
                  <p className="text-sm text-green-600">
                    {selectedDevice.brand_name} • {selectedDevice.year}
                  </p>
                </div>
              </div>
              <Badge variant="default">
                Confirmed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Browse Fallback */}
      {detectionMode === 'browse' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Browse Device Categories</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { category: 'Smartphones', icon: Smartphone, count: '250+ models' },
                { category: 'Tablets', icon: Tablet, count: '80+ models' },
                { category: 'Laptops', icon: Laptop, count: '150+ models' },
                { category: 'Desktops', icon: Monitor, count: '90+ models' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.category}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all text-center"
                  >
                    <IconComponent className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-medium">{item.category}</div>
                    <div className="text-sm text-gray-500">{item.count}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}