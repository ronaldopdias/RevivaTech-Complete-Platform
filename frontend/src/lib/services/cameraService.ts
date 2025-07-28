/**
 * Camera Service for RevivaTech PWA
 * Handles device camera access, photo capture, and image processing
 */

export interface CameraCapabilities {
  hasCamera: boolean;
  canTakePhoto: boolean;
  canRecordVideo: boolean;
  supportedConstraints: string[];
  facingModes: string[];
}

export interface CaptureOptions {
  width?: number;
  height?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'webp' | 'png';
  facingMode?: 'user' | 'environment';
  flash?: boolean;
}

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  timestamp: number;
  metadata?: {
    deviceType?: string;
    location?: string;
    notes?: string;
  };
}

export interface CameraError {
  code: string;
  message: string;
  name: string;
}

class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.setupCanvas();
  }

  /**
   * Setup canvas for image processing
   */
  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Check camera capabilities
   */
  async getCameraCapabilities(): Promise<CameraCapabilities> {
    const capabilities: CameraCapabilities = {
      hasCamera: false,
      canTakePhoto: false,
      canRecordVideo: false,
      supportedConstraints: [],
      facingModes: []
    };

    try {
      // Check for getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return capabilities;
      }

      capabilities.hasCamera = true;
      capabilities.canTakePhoto = true;
      capabilities.canRecordVideo = 'MediaRecorder' in window;

      // Get supported constraints
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      capabilities.supportedConstraints = Object.keys(supportedConstraints);

      // Check for facing mode support
      if (supportedConstraints.facingMode) {
        try {
          // Test environment camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          capabilities.facingModes.push('environment');
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          // Environment camera not available
        }

        try {
          // Test front camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });
          capabilities.facingModes.push('user');
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          // Front camera not available
        }
      }

      console.log('📷 Camera capabilities:', capabilities);
      return capabilities;
    } catch (error) {
      console.error('Failed to get camera capabilities:', error);
      return capabilities;
    }
  }

  /**
   * Start camera stream
   */
  async startCamera(options: CaptureOptions = {}): Promise<MediaStream> {
    try {
      // Stop existing stream
      await this.stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 },
          facingMode: options.facingMode || 'environment'
        },
        audio: false
      };

      console.log('📷 Starting camera with constraints:', constraints);

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create video element if not exists
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
      }

      this.videoElement.srcObject = this.stream;
      await new Promise((resolve) => {
        this.videoElement!.onloadedmetadata = resolve;
      });

      console.log('✅ Camera started successfully');
      return this.stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw this.mapCameraError(error);
    }
  }

  /**
   * Stop camera stream
   */
  async stopCamera(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    console.log('📷 Camera stopped');
  }

  /**
   * Capture photo from camera stream
   */
  async capturePhoto(options: CaptureOptions = {}): Promise<CapturedImage> {
    if (!this.stream || !this.videoElement || !this.canvas || !this.ctx) {
      throw new Error('Camera not initialized');
    }

    try {
      const video = this.videoElement;
      const canvas = this.canvas;
      const ctx = this.ctx;

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const quality = options.quality || 0.8;
      const format = options.format || 'jpeg';
      const mimeType = `image/${format}`;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          mimeType,
          quality
        );
      });

      // Create data URL
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const capturedImage: CapturedImage = {
        blob,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        size: blob.size,
        timestamp: Date.now()
      };

      console.log('📸 Photo captured:', {
        size: `${Math.round(blob.size / 1024)}KB`,
        dimensions: `${canvas.width}x${canvas.height}`
      });

      return capturedImage;
    } catch (error) {
      console.error('Failed to capture photo:', error);
      throw new Error('Photo capture failed');
    }
  }

  /**
   * Get video element for display
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.stream) {
      throw new Error('Camera not started');
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    const currentFacingMode = videoTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    await this.startCamera({ facingMode: newFacingMode });
  }

  /**
   * Resize and optimize image
   */
  async resizeImage(
    image: CapturedImage, 
    maxWidth: number = 1200, 
    maxHeight: number = 1200,
    quality: number = 0.8
  ): Promise<CapturedImage> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    const canvas = this.canvas;
    const ctx = this.ctx;

    // Create image element
    const img = new Image();
    img.src = image.dataUrl;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Calculate new dimensions
    let { width, height } = this.calculateDimensions(
      img.width, 
      img.height, 
      maxWidth, 
      maxHeight
    );

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create resized blob'));
          }
        },
        'image/jpeg',
        quality
      );
    });

    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    return {
      ...image,
      blob,
      dataUrl,
      width,
      height,
      size: blob.size
    };
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if necessary
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Upload captured image
   */
  async uploadImage(
    image: CapturedImage,
    bookingId?: string,
    description?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', image.blob, `capture_${image.timestamp}.jpg`);
      
      if (bookingId) {
        formData.append('bookingId', bookingId);
      }
      
      if (description) {
        formData.append('description', description);
      }

      formData.append('metadata', JSON.stringify({
        width: image.width,
        height: image.height,
        size: image.size,
        timestamp: image.timestamp,
        source: 'camera_capture'
      }));

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('📤 Image uploaded successfully:', result.url);
        return { success: true, url: result.url };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Map camera errors to user-friendly messages
   */
  private mapCameraError(error: any): CameraError {
    const cameraError: CameraError = {
      code: error.name || 'UNKNOWN_ERROR',
      message: 'Camera access failed',
      name: error.name || 'UnknownError'
    };

    switch (error.name) {
      case 'NotAllowedError':
        cameraError.message = 'Camera access denied. Please allow camera permissions.';
        break;
      case 'NotFoundError':
        cameraError.message = 'No camera found on this device.';
        break;
      case 'NotReadableError':
        cameraError.message = 'Camera is already in use by another application.';
        break;
      case 'OverconstrainedError':
        cameraError.message = 'Camera constraints cannot be satisfied.';
        break;
      case 'SecurityError':
        cameraError.message = 'Camera access blocked due to security restrictions.';
        break;
      default:
        cameraError.message = error.message || 'Camera access failed.';
    }

    return cameraError;
  }

  /**
   * Check if device has camera
   */
  static async hasCamera(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  }

  /**
   * Request camera permissions
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const cameraService = new CameraService();
export default cameraService;