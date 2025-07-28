import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FileUpload, { UploadedFile } from '@/components/ui/FileUpload';

interface FileRecord extends UploadedFile {
  uploadDate: string;
  bookingId?: string;
  category: string;
  tags?: string[];
  isArchived?: boolean;
}

interface FileManagerProps {
  className?: string;
  bookingId?: string;
  category?: string;
  readonly?: boolean;
}

interface FilterOptions {
  category: string;
  fileType: string;
  dateRange: string;
  searchTerm: string;
}

const FILE_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'device-photos', label: 'Device Photos' },
  { value: 'repair-documentation', label: 'Repair Documentation' },
  { value: 'before-after', label: 'Before/After Photos' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'diagnostics', label: 'Diagnostic Reports' },
];

const FILE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'video', label: 'Videos' },
];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
];

export const FileManager: React.FC<FileManagerProps> = ({
  className,
  bookingId,
  category,
  readonly = false,
}) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    category: category || 'all',
    fileType: 'all',
    dateRange: 'all',
    searchTerm: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUploader, setShowUploader] = useState(false);

  // Mock data for demonstration
  const mockFiles: FileRecord[] = [
    {
      id: '1',
      fileName: 'device_photo_1.jpg',
      originalName: 'iPhone Screen Damage.jpg',
      size: 2045612,
      type: 'image/jpeg',
      url: '/uploads/bookings/booking-123/device_photo_1.jpg',
      uploadDate: '2025-07-14T10:30:00Z',
      bookingId: 'booking-123',
      category: 'device-photos',
      tags: ['screen-damage', 'iPhone'],
    },
    {
      id: '2',
      fileName: 'repair_doc_1.pdf',
      originalName: 'Repair Documentation.pdf',
      size: 1024000,
      type: 'application/pdf',
      url: '/uploads/bookings/booking-123/repair_doc_1.pdf',
      uploadDate: '2025-07-14T11:45:00Z',
      bookingId: 'booking-123',
      category: 'repair-documentation',
      tags: ['documentation', 'complete'],
    },
  ];

  useEffect(() => {
    // Simulate loading files
    setTimeout(() => {
      setFiles(mockFiles);
      setLoading(false);
    }, 1000);
  }, [bookingId, category]);

  useEffect(() => {
    let filtered = [...files];

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(file => file.category === filters.category);
    }

    if (filters.fileType !== 'all') {
      filtered = filtered.filter(file => {
        switch (filters.fileType) {
          case 'image':
            return file.type.startsWith('image/');
          case 'document':
            return file.type.includes('pdf') || file.type.includes('document');
          case 'video':
            return file.type.startsWith('video/');
          default:
            return true;
        }
      });
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(file => 
        file.originalName.toLowerCase().includes(term) ||
        file.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
        default:
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFiles(filtered);
  }, [files, filters, sortBy, sortOrder]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileSelect = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const handleDownloadSelected = () => {
    selectedFiles.forEach(fileId => {
      const file = files.find(f => f.id === fileId);
      if (file) {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.originalName;
        link.click();
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {
      // Implementation for bulk delete
      console.log('Deleting files:', Array.from(selectedFiles));
      setSelectedFiles(new Set());
    }
  };

  const handleUploadComplete = (uploadResults: any) => {
    console.log('Upload completed:', uploadResults);
    setShowUploader(false);
    // Refresh files list
    // In real implementation, refetch files from API
  };

  const FileGridItem: React.FC<{ file: FileRecord }> = ({ file }) => {
    const isSelected = selectedFiles.has(file.id);
    const isImage = file.type.startsWith('image/');
    
    return (
      <Card 
        className={cn(
          'p-3 cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => handleFileSelect(file.id)}
      >
        <div className="space-y-3">
          {/* File Preview */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {isImage ? (
              <img
                src={file.url}
                alt={file.originalName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                {file.type.includes('pdf') ? '📄' : '📁'}
              </div>
            )}
            
            {/* Selection indicator */}
            <div className={cn(
              'absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white',
              isSelected ? 'bg-primary' : 'bg-white/50'
            )}>
              {isSelected && (
                <div className="w-full h-full flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              )}
            </div>
          </div>
          
          {/* File Info */}
          <div className="space-y-1">
            <div className="font-medium text-sm truncate">{file.originalName}</div>
            <div className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
            </div>
            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.slice(0, 2).map(tag => (
                  <span 
                    key={tag}
                    className="text-xs bg-muted px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const FileListItem: React.FC<{ file: FileRecord }> = ({ file }) => {
    const isSelected = selectedFiles.has(file.id);
    const isImage = file.type.startsWith('image/');
    
    return (
      <Card 
        className={cn(
          'p-4 cursor-pointer transition-all hover:shadow-sm',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => handleFileSelect(file.id)}
      >
        <div className="flex items-center gap-4">
          {/* Selection checkbox */}
          <div className={cn(
            'w-5 h-5 rounded border-2',
            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
          )}>
            {isSelected && (
              <div className="w-full h-full flex items-center justify-center text-white text-xs">
                ✓
              </div>
            )}
          </div>
          
          {/* File icon/preview */}
          <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
            {isImage ? (
              <img
                src={file.url}
                alt={file.originalName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">
                {file.type.includes('pdf') ? '📄' : '📁'}
              </div>
            )}
          </div>
          
          {/* File details */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{file.originalName}</div>
            <div className="text-sm text-muted-foreground">
              {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
            </div>
            {file.tags && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {file.tags.map(tag => (
                  <span 
                    key={tag}
                    className="text-xs bg-muted px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(file.url, '_blank');
              }}
            >
              👁️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.originalName;
                link.click();
              }}
            >
              📥
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <div>Loading files...</div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Manager</h2>
          <p className="text-muted-foreground">
            {bookingId ? `Files for booking ${bookingId}` : 'Manage all uploaded files'}
          </p>
        </div>
        {!readonly && (
          <Button onClick={() => setShowUploader(true)}>
            📁 Upload Files
          </Button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <Card className="p-6 border-2 border-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upload New Files</h3>
            <Button variant="ghost" onClick={() => setShowUploader(false)}>
              ✕
            </Button>
          </div>
          <FileUpload
            files={[]}
            onFilesChange={() => {}}
            bookingId={bookingId}
            category={category}
            onUploadComplete={handleUploadComplete}
            showGuidelines={true}
            maxFiles={10}
          />
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search files..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            options={FILE_CATEGORIES}
          />
          <Select
            value={filters.fileType}
            onValueChange={(value) => setFilters(prev => ({ ...prev, fileType: value }))}
            options={FILE_TYPES}
          />
          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            options={DATE_RANGES}
          />
        </div>
      </Card>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleSelectAll}
              disabled={filteredFiles.length === 0}
            >
              {selectedFiles.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedFiles.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.size} selected
                </span>
                <Button variant="ghost" size="sm" onClick={handleDownloadSelected}>
                  📥 Download
                </Button>
                {!readonly && (
                  <Button variant="ghost" size="sm" onClick={handleDeleteSelected}>
                    🗑️ Delete
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
              options={[
                { value: 'date', label: 'Date' },
                { value: 'name', label: 'Name' },
                { value: 'size', label: 'Size' },
              ]}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            <div className="flex border rounded">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                ☰
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📂</div>
          <h3 className="text-lg font-semibold mb-2">No files found</h3>
          <p className="text-muted-foreground">
            {files.length === 0 
              ? 'No files have been uploaded yet.'
              : 'Try adjusting your filters to see more results.'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredFiles.length} of {files.length} files
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map(file => (
                <FileGridItem key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(file => (
                <FileListItem key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Storage Usage */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Storage Usage</h4>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))} used
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {files.length} files total
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FileManager;