import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FileUpload, { UploadedFile } from '@/components/ui/FileUpload';
import PhotoUploadV2 from './PhotoUploadV2';

interface BookingData {
  deviceModel?: any;
  issues?: string[];
  customerInfo?: any;
  urgency?: string;
  timeline?: string;
}

interface BookingWithFileUploadProps {
  bookingData: BookingData;
  onBookingUpdate: (data: BookingData) => void;
  bookingId?: string;
  className?: string;
  step: 'device' | 'issues' | 'photos' | 'customer' | 'review';
  onStepChange: (step: string) => void;
}

export const BookingWithFileUpload: React.FC<BookingWithFileUploadProps> = ({
  bookingData,
  onBookingUpdate,
  bookingId,
  className,
  step,
  onStepChange,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [devicePhotos, setDevicePhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    // Update booking data with file references
    onBookingUpdate({
      ...bookingData,
      attachments: files.map(f => ({
        id: f.id,
        fileName: f.fileName,
        originalName: f.originalName,
        url: f.url,
        type: f.type,
        size: f.size,
      })),
    });
  };

  const handleDevicePhotosChange = (photos: File[]) => {
    setDevicePhotos(photos);
    // Convert File objects to data we can store in booking
    const photoData = photos.map(photo => ({
      name: photo.name,
      size: photo.size,
      type: photo.type,
      lastModified: photo.lastModified,
    }));
    
    onBookingUpdate({
      ...bookingData,
      devicePhotos: photoData,
    });
  };

  const handleUploadStart = () => {
    setUploading(true);
    setUploadError(null);
  };

  const handleUploadComplete = (results: any) => {
    setUploading(false);
    if (results.success) {
      console.log('Upload completed successfully:', results);
    }
  };

  const handleUploadError = (error: string) => {
    setUploading(false);
    setUploadError(error);
  };

  const renderPhotoUploadStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Device Photos</h2>
        <p className="text-muted-foreground">
          Help us provide a more accurate estimate by uploading photos of your device
        </p>
      </div>

      {/* Enhanced Photo Upload with drag & drop */}
      <Card className="p-6">
        <PhotoUploadV2
          devicePhotos={devicePhotos}
          onPhotosChange={handleDevicePhotosChange}
          deviceName={bookingData.deviceModel?.name}
          maxFiles={8}
          maxSizePerFile={15}
        />
      </Card>

      {/* Additional File Upload for Documentation */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Additional Documentation</h3>
            <p className="text-sm text-muted-foreground">
              Upload any additional files such as warranty documents, receipts, or error screenshots
            </p>
          </div>
          
          <FileUpload
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            bookingId={bookingId}
            category="booking-documents"
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={5}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
            dragDropText="Drop additional documents here"
            showGuidelines={false}
          />
        </div>
      </Card>

      {/* Upload Status */}
      {uploadError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌</span>
            <span className="font-medium">Upload Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{uploadError}</p>
        </Card>
      )}

      {/* Benefits of Photo Upload */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">📸 Why Upload Photos?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h5 className="font-medium text-blue-800">Faster Diagnosis</h5>
            <p className="text-sm text-blue-700">
              Visual assessment helps our technicians prepare for your repair
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">💰</div>
            <h5 className="font-medium text-blue-800">Better Pricing</h5>
            <p className="text-sm text-blue-700">
              Accurate quotes based on actual damage assessment
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔧</div>
            <h5 className="font-medium text-blue-800">Parts Ready</h5>
            <p className="text-sm text-blue-700">
              We can order parts in advance to speed up your repair
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="ghost" 
          onClick={() => onStepChange('issues')}
        >
          ← Back to Issues
        </Button>
        <Button 
          onClick={() => onStepChange('customer')}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Continue →'}
        </Button>
      </div>
    </div>
  );

  const renderFileManagementStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Manage Your Files</h2>
        <p className="text-muted-foreground">
          Review and manage all files associated with your booking
        </p>
      </div>

      {/* File Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl mb-2">📸</div>
            <div className="font-semibold">{devicePhotos.length} Device Photos</div>
            <div className="text-sm text-muted-foreground">
              {devicePhotos.reduce((size, photo) => size + photo.size, 0) / (1024 * 1024) < 1 
                ? `${Math.round(devicePhotos.reduce((size, photo) => size + photo.size, 0) / 1024)} KB`
                : `${Math.round(devicePhotos.reduce((size, photo) => size + photo.size, 0) / (1024 * 1024))} MB`
              }
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl mb-2">📄</div>
            <div className="font-semibold">{uploadedFiles.length} Documents</div>
            <div className="text-sm text-muted-foreground">
              {uploadedFiles.reduce((size, file) => size + file.size, 0) / (1024 * 1024) < 1 
                ? `${Math.round(uploadedFiles.reduce((size, file) => size + file.size, 0) / 1024)} KB`
                : `${Math.round(uploadedFiles.reduce((size, file) => size + file.size, 0) / (1024 * 1024))} MB`
              }
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border-green-200">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold text-green-800">All Set!</div>
            <div className="text-sm text-green-700">Files ready for technician review</div>
          </div>
        </div>
      </Card>

      {/* File Preview Grid */}
      {(devicePhotos.length > 0 || uploadedFiles.length > 0) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">File Preview</h3>
          
          {devicePhotos.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Device Photos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {devicePhotos.slice(0, 4).map((photo, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Device photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {devicePhotos.length > 4 && (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="text-lg">+{devicePhotos.length - 4}</div>
                      <div className="text-xs">more</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Documents</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <div className="text-2xl">
                      {file.type.includes('pdf') ? '📄' : '📁'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{file.originalName}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(file.size / 1024)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Privacy Notice */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <span className="text-lg">🔒</span>
          <div className="text-sm">
            <h5 className="font-medium mb-1">File Security & Privacy</h5>
            <p className="text-muted-foreground">
              All uploaded files are securely encrypted and stored. Your files are only accessible 
              to authorized technicians working on your repair and will be permanently deleted 
              30 days after repair completion, unless you request otherwise.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Return the appropriate step content
  switch (step) {
    case 'photos':
      return (
        <div className={cn('max-w-4xl mx-auto p-6', className)}>
          {renderPhotoUploadStep()}
        </div>
      );
    case 'review':
      return (
        <div className={cn('max-w-4xl mx-auto p-6', className)}>
          {renderFileManagementStep()}
        </div>
      );
    default:
      return (
        <div className={cn('max-w-4xl mx-auto p-6', className)}>
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">File Upload Integration</h3>
            <p className="text-muted-foreground">
              This component integrates file uploads with the booking system for steps: photos, review
            </p>
          </Card>
        </div>
      );
  }
};

export default BookingWithFileUpload;