'use client';

/**
 * Device Photo Gallery Component
 * 
 * Features:
 * - Real-time photo uploads during repair process
 * - Before/during/after categorization
 * - Lightbox view with zoom and navigation
 * - Photo timeline with repair step integration
 * - Technician annotations and notes
 * - High-resolution image support with lazy loading
 * - Download and sharing capabilities
 * - Photo comparison tools
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import useWebSocket from '@/hooks/useWebSocket';

interface PhotoAnnotation {
  id: string;
  x: number; // Percentage from left
  y: number; // Percentage from top
  note: string;
  technician: string;
  timestamp: string;
  color?: string;
}

interface RepairPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  fileSize: number;
  uploadedAt: string;
  capturedAt?: string;
  type: 'before' | 'during' | 'after' | 'diagnostic' | 'parts' | 'quality-check';
  category: 'intake' | 'diagnosis' | 'disassembly' | 'repair' | 'testing' | 'completion';
  step: string; // Related repair step
  stepId: string;
  description: string;
  technician: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata: {
    deviceAngle?: 'front' | 'back' | 'side' | 'internal' | 'detail';
    resolution?: { width: number; height: number };
    camera?: string;
    lighting?: 'natural' | 'studio' | 'flashlight';
    focus?: 'general' | 'defect' | 'component' | 'serial';
  };
  annotations: PhotoAnnotation[];
  isPublic: boolean; // Can customer see this photo
  isHighlight: boolean; // Featured photo for this step
  tags: string[];
}

interface PhotoGalleryProps {
  repairId: string;
  customerId?: string;
  showPrivatePhotos?: boolean;
  enableDownload?: boolean;
  enableSharing?: boolean;
  enableComparison?: boolean;
  groupByStep?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'timeline' | 'comparison' | 'lightbox';
type FilterType = 'all' | 'before' | 'during' | 'after' | 'diagnostic' | 'quality-check';

export default function PhotoGallery({
  repairId,
  customerId,
  showPrivatePhotos = false,
  enableDownload = true,
  enableSharing = true,
  enableComparison = true,
  groupByStep = true,
  className = ''
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<RepairPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<RepairPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<RepairPhoto | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [comparisonPhotos, setComparisonPhotos] = useState<[RepairPhoto?, RepairPhoto?]>([undefined, undefined]);
  const galleryRef = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time photo updates
  const { 
    isConnected, 
    sendMessage, 
    lastMessage 
  } = useWebSocket({
    url: 'ws://localhost:3011',
    shouldReconnect: true,
  });

  // Load initial photos
  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);

      // Mock photos data - replace with real API call
      const mockPhotos: RepairPhoto[] = [
        {
          id: 'photo-001',
          url: '/repair-photos/macbook-intake-front.jpg',
          thumbnailUrl: '/repair-photos/thumbs/macbook-intake-front.jpg',
          filename: 'macbook_intake_front.jpg',
          fileSize: 2456789,
          uploadedAt: '2025-07-13T09:15:00Z',
          capturedAt: '2025-07-13T09:10:00Z',
          type: 'before',
          category: 'intake',
          step: 'Device Intake & Initial Assessment',
          stepId: 'intake',
          description: 'Device condition upon arrival - front view showing screen damage',
          technician: {
            id: 'tech-sarah-001',
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg'
          },
          metadata: {
            deviceAngle: 'front',
            resolution: { width: 4032, height: 3024 },
            camera: 'iPhone 15 Pro',
            lighting: 'studio',
            focus: 'defect'
          },
          annotations: [
            {
              id: 'ann-001',
              x: 45,
              y: 30,
              note: 'LCD damage with dark spots visible',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-13T09:16:00Z',
              color: '#ff4444'
            },
            {
              id: 'ann-002',
              x: 55,
              y: 45,
              note: 'Flickering area reported by customer',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-13T09:17:00Z',
              color: '#ffaa44'
            }
          ],
          isPublic: true,
          isHighlight: true,
          tags: ['screen-damage', 'lcd-failure', 'customer-reported']
        },
        {
          id: 'photo-002',
          url: '/repair-photos/macbook-intake-back.jpg',
          thumbnailUrl: '/repair-photos/thumbs/macbook-intake-back.jpg',
          filename: 'macbook_intake_back.jpg',
          fileSize: 2234567,
          uploadedAt: '2025-07-13T09:16:00Z',
          capturedAt: '2025-07-13T09:11:00Z',
          type: 'before',
          category: 'intake',
          step: 'Device Intake & Initial Assessment',
          stepId: 'intake',
          description: 'Device condition upon arrival - back view showing external condition',
          technician: {
            id: 'tech-sarah-001',
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg'
          },
          metadata: {
            deviceAngle: 'back',
            resolution: { width: 4032, height: 3024 },
            camera: 'iPhone 15 Pro',
            lighting: 'studio',
            focus: 'general'
          },
          annotations: [],
          isPublic: true,
          isHighlight: false,
          tags: ['external-condition', 'housing']
        },
        {
          id: 'photo-003',
          url: '/repair-photos/macbook-diagnostic-lcd.jpg',
          thumbnailUrl: '/repair-photos/thumbs/macbook-diagnostic-lcd.jpg',
          filename: 'macbook_diagnostic_lcd.jpg',
          fileSize: 3445678,
          uploadedAt: '2025-07-13T10:45:00Z',
          capturedAt: '2025-07-13T10:40:00Z',
          type: 'diagnostic',
          category: 'diagnosis',
          step: 'Comprehensive Diagnostics',
          stepId: 'diagnostics',
          description: 'Detailed LCD panel diagnostic showing internal damage patterns',
          technician: {
            id: 'tech-sarah-001',
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg'
          },
          metadata: {
            deviceAngle: 'detail',
            resolution: { width: 4032, height: 3024 },
            camera: 'iPhone 15 Pro',
            lighting: 'flashlight',
            focus: 'defect'
          },
          annotations: [
            {
              id: 'ann-003',
              x: 35,
              y: 40,
              note: 'Internal LCD layer separation',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-13T10:46:00Z',
              color: '#ff0000'
            },
            {
              id: 'ann-004',
              x: 60,
              y: 25,
              note: 'Backlight functioning normally',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-13T10:47:00Z',
              color: '#00ff00'
            }
          ],
          isPublic: true,
          isHighlight: true,
          tags: ['diagnostic', 'lcd-internal', 'damage-pattern']
        },
        {
          id: 'photo-004',
          url: '/repair-photos/macbook-parts-new-screen.jpg',
          thumbnailUrl: '/repair-photos/thumbs/macbook-parts-new-screen.jpg',
          filename: 'macbook_parts_new_screen.jpg',
          fileSize: 2890123,
          uploadedAt: '2025-07-14T09:35:00Z',
          capturedAt: '2025-07-14T09:30:00Z',
          type: 'parts',
          category: 'diagnosis',
          step: 'Parts Verification',
          stepId: 'parts-arrival',
          description: 'Genuine Apple replacement screen assembly verification',
          technician: {
            id: 'tech-sarah-001',
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg'
          },
          metadata: {
            deviceAngle: 'detail',
            resolution: { width: 4032, height: 3024 },
            camera: 'iPhone 15 Pro',
            lighting: 'studio',
            focus: 'component'
          },
          annotations: [
            {
              id: 'ann-005',
              x: 20,
              y: 15,
              note: 'Part number: 661-16728 verified genuine',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-14T09:36:00Z',
              color: '#0066ff'
            },
            {
              id: 'ann-006',
              x: 75,
              y: 80,
              note: 'Serial number matches order',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-14T09:37:00Z',
              color: '#0066ff'
            }
          ],
          isPublic: true,
          isHighlight: true,
          tags: ['genuine-parts', 'verification', 'apple-oem']
        },
        {
          id: 'photo-005',
          url: '/repair-photos/macbook-disassembly-progress.jpg',
          thumbnailUrl: '/repair-photos/thumbs/macbook-disassembly-progress.jpg',
          filename: 'macbook_disassembly_progress.jpg',
          fileSize: 3567890,
          uploadedAt: '2025-07-14T11:15:00Z',
          capturedAt: '2025-07-14T11:10:00Z',
          type: 'during',
          category: 'disassembly',
          step: 'Device Disassembly',
          stepId: 'disassembly',
          description: 'Careful disassembly process showing internal components',
          technician: {
            id: 'tech-sarah-001',
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg'
          },
          metadata: {
            deviceAngle: 'internal',
            resolution: { width: 4032, height: 3024 },
            camera: 'iPhone 15 Pro',
            lighting: 'studio',
            focus: 'component'
          },
          annotations: [
            {
              id: 'ann-007',
              x: 30,
              y: 50,
              note: 'Logic board properly disconnected',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-14T11:16:00Z',
              color: '#00aa00'
            },
            {
              id: 'ann-008',
              x: 70,
              y: 30,
              note: 'All screws accounted for and organized',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-14T11:17:00Z',
              color: '#0066ff'
            }
          ],
          isPublic: true,
          isHighlight: false,
          tags: ['disassembly', 'internal-components', 'process']
        },
        {
          id: 'photo-006',
          url: '/repair-photos/macbook-screen-installation.jpg',
          thumbnailUrl: '/repair-photos/thumbs/macbook-screen-installation.jpg',
          filename: 'macbook_screen_installation.jpg',
          fileSize: 3234567,
          uploadedAt: '2025-07-14T13:30:00Z',
          capturedAt: '2025-07-14T13:25:00Z',
          type: 'during',
          category: 'repair',
          step: 'Screen Assembly Replacement',
          stepId: 'screen-replacement',
          description: 'New screen assembly being carefully installed',
          technician: {
            id: 'tech-sarah-001',
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg'
          },
          metadata: {
            deviceAngle: 'detail',
            resolution: { width: 4032, height: 3024 },
            camera: 'iPhone 15 Pro',
            lighting: 'studio',
            focus: 'component'
          },
          annotations: [
            {
              id: 'ann-009',
              x: 45,
              y: 35,
              note: 'Flex cables being connected carefully',
              technician: 'Sarah Johnson',
              timestamp: '2025-07-14T13:31:00Z',
              color: '#ffaa00'
            }
          ],
          isPublic: true,
          isHighlight: true,
          tags: ['installation', 'new-screen', 'repair-progress']
        }
      ];

      // Filter based on permissions
      const visiblePhotos = showPrivatePhotos 
        ? mockPhotos 
        : mockPhotos.filter(photo => photo.isPublic);

      setPhotos(visiblePhotos);
      setFilteredPhotos(visiblePhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [repairId, showPrivatePhotos]);

  // Handle real-time photo updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
        
        if (data.type === 'photo-uploaded' && data.repairId === repairId) {
          
          const newPhoto: RepairPhoto = {
            id: data.photoId,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            filename: data.filename,
            fileSize: data.fileSize,
            uploadedAt: data.timestamp,
            capturedAt: data.capturedAt,
            type: data.photoType,
            category: data.category,
            step: data.step,
            stepId: data.stepId,
            description: data.description,
            technician: data.technician,
            metadata: data.metadata || {},
            annotations: [],
            isPublic: data.isPublic !== false,
            isHighlight: data.isHighlight || false,
            tags: data.tags || []
          };

          setPhotos(prev => [newPhoto, ...prev]);
          
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Repair Photo', {
              body: `${data.step}: ${data.description}`,
              icon: '/favicon.ico'
            });
          }
        }

        if (data.type === 'photo-annotation' && data.repairId === repairId) {
          console.log('Photo annotation added:', data);
          
          setPhotos(prev => prev.map(photo => 
            photo.id === data.photoId 
              ? { 
                  ...photo, 
                  annotations: [...photo.annotations, data.annotation] 
                }
              : photo
          ));
        }
      } catch (err) {
        console.warn('Failed to parse photo update:', err);
      }
    }
  }, [lastMessage, repairId]);

  // Subscribe to photo updates
  useEffect(() => {
    if (isConnected && repairId) {
      sendMessage({
        type: 'subscribe',
        channel: `photos:${repairId}`,
        timestamp: new Date().toISOString()
      });

      return () => {
        sendMessage({
          type: 'unsubscribe',
          channel: `photos:${repairId}`,
          timestamp: new Date().toISOString()
        });
      };
    }
  }, [isConnected, repairId, sendMessage]);

  // Load initial photos
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Apply filters
  useEffect(() => {
    let filtered = photos;

    if (filter !== 'all') {
      filtered = photos.filter(photo => photo.type === filter);
    }

    setFilteredPhotos(filtered);
  }, [photos, filter]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'lightbox' && selectedPhoto) {
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
        
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (currentIndex > 0) {
              setSelectedPhoto(filteredPhotos[currentIndex - 1]);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (currentIndex < filteredPhotos.length - 1) {
              setSelectedPhoto(filteredPhotos[currentIndex + 1]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setViewMode('grid');
            setSelectedPhoto(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedPhoto, filteredPhotos]);

  const openLightbox = (photo: RepairPhoto) => {
    setSelectedPhoto(photo);
    setViewMode('lightbox');
  };

  const closeLightbox = () => {
    setViewMode('grid');
    setSelectedPhoto(null);
  };

  const downloadPhoto = async (photo: RepairPhoto) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  const sharePhoto = async (photo: RepairPhoto) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Repair Photo: ${photo.description}`,
          text: `${photo.step} - ${photo.description}`,
          url: photo.url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(photo.url);
      alert('Photo URL copied to clipboard');
    }
  };

  const addToComparison = (photo: RepairPhoto, slot: 0 | 1) => {
    setComparisonPhotos(prev => {
      const newComparison = [...prev] as [RepairPhoto?, RepairPhoto?];
      newComparison[slot] = photo;
      return newComparison;
    });
  };

  const clearComparison = () => {
    setComparisonPhotos([undefined, undefined]);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const groupPhotosByStep = (photos: RepairPhoto[]) => {
    return photos.reduce((groups, photo) => {
      const key = photo.stepId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(photo);
      return groups;
    }, {} as Record<string, RepairPhoto[]>);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading photos...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">Repair Photos</h2>
            <Badge className="bg-blue-100 text-blue-800">
              {filteredPhotos.length} photos
            </Badge>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
            {enableComparison && (
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparison')}
              >
                Compare
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-4">
          {(['all', 'before', 'during', 'after', 'diagnostic', 'quality-check'] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                filter === filterType ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filterType === 'all' ? `All (${photos.length})` : 
               `${filterType.replace('-', ' ')} (${photos.filter(p => p.type === filterType).length})`}
            </button>
          ))}
        </div>

        {/* Comparison Mode Controls */}
        {viewMode === 'comparison' && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Comparison Mode:</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm">
                  {comparisonPhotos[0] ? comparisonPhotos[0].description : 'Select first photo'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm">
                  {comparisonPhotos[1] ? comparisonPhotos[1].description : 'Select second photo'}
                </span>
              </div>
            </div>
            <Button size="sm" onClick={clearComparison}>
              Clear
            </Button>
          </div>
        )}
      </Card>

      {/* Photo Display */}
      {filteredPhotos.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>No photos available for the selected filter</p>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div 
                    className="aspect-square bg-gray-200 cursor-pointer relative group"
                    onClick={() => openLightbox(photo)}
                  >
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Photo Preview</span>
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); openLightbox(photo); }}>
                          View
                        </Button>
                        {enableDownload && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadPhoto(photo); }}>
                            ⬇️
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <Badge className={`absolute top-2 left-2 text-xs ${
                      photo.type === 'before' ? 'bg-red-100 text-red-800' :
                      photo.type === 'during' ? 'bg-yellow-100 text-yellow-800' :
                      photo.type === 'after' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {photo.type}
                    </Badge>

                    {/* Annotations Indicator */}
                    {photo.annotations.length > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {photo.annotations.length} notes
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <h4 className="font-medium text-sm mb-1 truncate">{photo.step}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{photo.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                      <span>{formatFileSize(photo.fileSize)}</span>
                    </div>
                    
                    {viewMode === 'comparison' && (
                      <div className="flex space-x-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => addToComparison(photo, 0)}
                        >
                          A
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => addToComparison(photo, 1)}
                        >
                          B
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && groupByStep && (
            <div className="space-y-6">
              {Object.entries(groupPhotosByStep(filteredPhotos)).map(([stepId, stepPhotos]) => (
                <Card key={stepId} className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{stepPhotos[0].step}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stepPhotos.map((photo) => (
                      <div key={photo.id} className="cursor-pointer" onClick={() => openLightbox(photo)}>
                        <div className="aspect-square bg-gray-200 rounded-lg mb-2">
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-lg">
                            <span className="text-gray-500 text-sm">Photo</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium truncate">{photo.description}</p>
                        <p className="text-xs text-gray-500">{new Date(photo.uploadedAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Comparison View */}
          {viewMode === 'comparison' && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisonPhotos.map((photo, index) => (
                  <div key={index} className={`border-2 rounded-lg p-4 ${
                    photo ? (index === 0 ? 'border-blue-500' : 'border-green-500') : 'border-gray-300 border-dashed'
                  }`}>
                    {photo ? (
                      <>
                        <div className="aspect-square bg-gray-200 rounded-lg mb-4">
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-lg">
                            <span className="text-gray-500">Photo Preview</span>
                          </div>
                        </div>
                        <h4 className="font-medium">{photo.step}</h4>
                        <p className="text-sm text-gray-600 mt-1">{photo.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(photo.uploadedAt).toLocaleString()}
                        </p>
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" onClick={() => openLightbox(photo)}>
                            View Full
                          </Button>
                          {enableDownload && (
                            <Button size="sm" variant="outline" onClick={() => downloadPhoto(photo)}>
                              Download
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📷</div>
                          <p>Select photo {index === 0 ? 'A' : 'B'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Lightbox View */}
      {viewMode === 'lightbox' && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 z-10"
            >
              ✕
            </button>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
                  if (currentIndex > 0) setSelectedPhoto(filteredPhotos[currentIndex - 1]);
                }}
                className="text-white bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70"
                disabled={filteredPhotos.findIndex(p => p.id === selectedPhoto.id) === 0}
              >
                ←
              </button>

              <div className="flex-1">
                {/* Main Image */}
                <div className="bg-white rounded-lg max-h-[70vh] overflow-hidden">
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Full Resolution Photo</span>
                  </div>
                </div>

                {/* Photo Info */}
                <div className="bg-white rounded-lg mt-4 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{selectedPhoto.step}</h3>
                    <div className="flex space-x-2">
                      {enableDownload && (
                        <Button size="sm" onClick={() => downloadPhoto(selectedPhoto)}>
                          Download
                        </Button>
                      )}
                      {enableSharing && (
                        <Button size="sm" variant="outline" onClick={() => sharePhoto(selectedPhoto)}>
                          Share
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedPhoto.description}</p>
                  
                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Captured</p>
                      <p>{new Date(selectedPhoto.capturedAt || selectedPhoto.uploadedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Technician</p>
                      <p>{selectedPhoto.technician.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="capitalize">{selectedPhoto.type.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">File Size</p>
                      <p>{formatFileSize(selectedPhoto.fileSize)}</p>
                    </div>
                  </div>

                  {/* Annotations */}
                  {selectedPhoto.annotations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Technician Notes</h4>
                      <div className="space-y-2">
                        {selectedPhoto.annotations.map((annotation) => (
                          <div key={annotation.id} className="flex items-start space-x-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full mt-1"
                              style={{ backgroundColor: annotation.color || '#0066ff' }}
                            ></div>
                            <div>
                              <p>{annotation.note}</p>
                              <p className="text-xs text-gray-500">
                                {annotation.technician} - {new Date(annotation.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
                  if (currentIndex < filteredPhotos.length - 1) setSelectedPhoto(filteredPhotos[currentIndex + 1]);
                }}
                className="text-white bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70"
                disabled={filteredPhotos.findIndex(p => p.id === selectedPhoto.id) === filteredPhotos.length - 1}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export types for use in other components
export type { RepairPhoto, PhotoAnnotation };