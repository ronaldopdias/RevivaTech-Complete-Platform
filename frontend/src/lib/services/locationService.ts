'use client';

// Enhanced Location Service with Privacy and Performance
interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchMode?: boolean;
}

interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface LocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
}

class LocationService {
  private watchId: number | null = null;
  private lastKnownPosition: LocationResult | null = null;
  private permissions: PermissionState | null = null;

  constructor() {
    this.checkPermissions();
  }

  // Check location permissions
  async checkPermissions(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      this.permissions = permission.state;
      
      // Listen for permission changes
      permission.addEventListener('change', () => {
        this.permissions = permission.state;
      });
      
      return permission.state;
    } catch (error) {
      console.warn('Permission API not supported');
      return 'prompt';
    }
  }

  // Get current location with enhanced error handling
  async getCurrentLocation(options: LocationOptions = {}): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 0,
          message: 'Geolocation is not supported by this browser.',
          type: 'NOT_SUPPORTED'
        } as LocationError);
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result: LocationResult = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          // Try to get address from coordinates
          try {
            result.address = await this.reverseGeocode(
              result.latitude, 
              result.longitude
            );
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
          }

          this.lastKnownPosition = result;
          resolve(result);
        },
        (error) => {
          const locationError: LocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code),
            type: this.getErrorType(error.code)
          };
          reject(locationError);
        },
        defaultOptions
      );
    });
  }

  // Watch location changes for real-time tracking
  watchLocation(
    onLocationUpdate: (location: LocationResult) => void,
    onError: (error: LocationError) => void,
    options: LocationOptions = {}
  ): () => void {
    if (!navigator.geolocation) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
        type: 'NOT_SUPPORTED'
      });
      return () => {};
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000 // 1 minute for watching
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const result: LocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        // Get address for first location or if moved significantly
        if (!this.lastKnownPosition || 
            this.calculateDistance(this.lastKnownPosition, result) > 100) {
          try {
            result.address = await this.reverseGeocode(
              result.latitude, 
              result.longitude
            );
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
          }
        } else {
          result.address = this.lastKnownPosition.address;
        }

        this.lastKnownPosition = result;
        onLocationUpdate(result);
      },
      (error) => {
        const locationError: LocationError = {
          code: error.code,
          message: this.getErrorMessage(error.code),
          type: this.getErrorType(error.code)
        };
        onError(locationError);
      },
      defaultOptions
    );

    // Return cleanup function
    return () => this.stopWatching();
  }

  // Stop watching location
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get last known position (cached)
  getLastKnownPosition(): LocationResult | null {
    return this.lastKnownPosition;
  }

  // Calculate distance between two points in meters
  calculateDistance(pos1: LocationResult, pos2: LocationResult): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δφ = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Find nearby repair shops (mock implementation)
  async findNearbyShops(location: LocationResult, radius: number = 5000): Promise<any[]> {
    // This would integrate with a real location API
    const mockShops = [
      {
        id: '1',
        name: 'RevivaTech Main Shop',
        address: 'Rua Principal, 123',
        distance: 1200,
        rating: 4.8,
        latitude: location.latitude + 0.01,
        longitude: location.longitude + 0.01
      },
      {
        id: '2',
        name: 'RevivaTech Express',
        address: 'Avenida Central, 456',
        distance: 2800,
        rating: 4.6,
        latitude: location.latitude - 0.02,
        longitude: location.longitude + 0.015
      }
    ];

    return mockShops.filter(shop => shop.distance <= radius);
  }

  // Reverse geocoding (convert coordinates to address)
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Using a free geocoding service (in production, use a proper API)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      // Fallback to coordinates
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // Get user-friendly error message
  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied. Please enable location permissions.';
      case 2:
        return 'Location unavailable. Please check your GPS settings.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown location error occurred.';
    }
  }

  // Get error type for handling
  private getErrorType(code: number): LocationError['type'] {
    switch (code) {
      case 1:
        return 'PERMISSION_DENIED';
      case 2:
        return 'POSITION_UNAVAILABLE';
      case 3:
        return 'TIMEOUT';
      default:
        return 'NOT_SUPPORTED';
    }
  }

  // Check if location services are available
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get permission status
  getPermissionStatus(): PermissionState | null {
    return this.permissions;
  }

  // Request location permission with user-friendly prompt
  async requestPermission(): Promise<boolean> {
    try {
      await this.getCurrentLocation({ timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const locationService = new LocationService();

// Convenience hooks for React components
export function useLocation() {
  const [location, setLocation] = React.useState<LocationResult | null>(null);
  const [error, setError] = React.useState<LocationError | null>(null);
  const [loading, setLoading] = React.useState(false);

  const getCurrentLocation = async (options?: LocationOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await locationService.getCurrentLocation(options);
      setLocation(result);
      return result;
    } catch (err) {
      setError(err as LocationError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const watchLocation = (options?: LocationOptions) => {
    setError(null);
    
    return locationService.watchLocation(
      (loc) => setLocation(loc),
      (err) => setError(err),
      options
    );
  };

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
    isSupported: locationService.isSupported(),
    permissionStatus: locationService.getPermissionStatus()
  };
}

export default locationService;