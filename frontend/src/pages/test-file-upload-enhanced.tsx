'use client';

/**
 * Enhanced File Upload Test Page
 * 
 * This page demonstrates the advanced drag-and-drop file upload functionality:
 * - Multi-file drag & drop with visual feedback
 * - File categorization system
 * - Real-time upload progress
 * - Image preview with lightbox
 * - Batch operations
 * - Camera capture integration
 * - File validation and error handling
 */

import React, { useState } from 'react';
import { EnhancedFileUpload, UploadedFile } from '@/components/ui/EnhancedFileUpload';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  maxFiles: number;
  maxSizePerFile: number;
  acceptedTypes: string[];
  category: string;
  showCamera: boolean;
  showBatchOperations: boolean;
  allowReordering: boolean;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'repair_photos',
    name: 'Repair Documentation',
    description: 'Upload photos showing device damage and repair progress',
    maxFiles: 8,
    maxSizePerFile: 10,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    category: 'damage',
    showCamera: true,
    showBatchOperations: true,
    allowReordering: true,
  },
  {
    id: 'documents',
    name: 'Document Upload',
    description: 'Upload receipts, manuals, and other documentation',
    maxFiles: 5,
    maxSizePerFile: 5,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
    category: 'documents',
    showCamera: false,
    showBatchOperations: true,
    allowReordering: false,
  },
  {
    id: 'quick_photo',
    name: 'Quick Photo Capture',
    description: 'Single photo upload with camera integration',
    maxFiles: 1,
    maxSizePerFile: 15,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    category: 'general',
    showCamera: true,
    showBatchOperations: false,
    allowReordering: false,
  },
  {
    id: 'batch_import',
    name: 'Batch File Import',
    description: 'Large batch upload with comprehensive management',
    maxFiles: 20,
    maxSizePerFile: 8,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    category: 'general',
    showCamera: true,
    showBatchOperations: true,
    allowReordering: true,
  },
];

export default function EnhancedFileUploadTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(TEST_SCENARIOS[0]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadEvents, setUploadEvents] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalSize: 0,
  });

  // Event handlers
  const handleUploadStart = (fileCount: number) => {
    const event = `🚀 Upload started: ${fileCount} file(s)`;
    setUploadEvents(prev => [event, ...prev.slice(0, 9)]);
  };

  const handleUploadProgress = (progress: number, fileName: string) => {
    const event = `⏳ Progress: ${progress}% - ${fileName}`;
    setUploadEvents(prev => [event, ...prev.slice(0, 9)]);
  };

  const handleUploadComplete = (results: any) => {
    const successCount = results.successfulUploads || 0;
    const event = `✅ Upload completed: ${successCount} file(s) successful`;
    setUploadEvents(prev => [event, ...prev.slice(0, 9)]);
    
    setStats(prev => ({
      ...prev,
      totalUploads: prev.totalUploads + (results.totalFiles || 0),
      successfulUploads: prev.successfulUploads + successCount,
    }));
  };

  const handleUploadError = (error: string, fileName?: string) => {
    const event = `❌ Error: ${error}${fileName ? ` (${fileName})` : ''}`;
    setUploadEvents(prev => [event, ...prev.slice(0, 9)]);
    
    setStats(prev => ({
      ...prev,
      failedUploads: prev.failedUploads + 1,
    }));
  };

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    
    // Update total size
    const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
    setStats(prev => ({ ...prev, totalSize }));
  };

  const clearFiles = () => {
    setFiles([]);
    setStats({
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalSize: 0,
    });
  };

  const clearLogs = () => {
    setUploadEvents([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced File Upload Test Lab
          </h1>
          <p className="text-gray-600 mb-4">
            Test advanced drag-and-drop functionality with real-time feedback
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="info">Drag & Drop</Badge>
            <Badge variant="success">Camera Capture</Badge>
            <Badge variant="warning">Batch Operations</Badge>
            <Badge variant="secondary">Real-time Progress</Badge>
          </div>
        </div>

        {/* Test Scenario Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEST_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedScenario.id === scenario.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-lg mb-1">{scenario.name}</div>
                <div className="text-sm text-gray-600 mb-3">{scenario.description}</div>
                <div className="text-xs space-y-1">
                  <div>📁 Max Files: {scenario.maxFiles}</div>
                  <div>📏 Max Size: {scenario.maxSizePerFile}MB</div>
                  <div>🔧 Features: {[
                    scenario.showCamera && 'Camera',
                    scenario.showBatchOperations && 'Batch',
                    scenario.allowReordering && 'Reorder'
                  ].filter(Boolean).join(', ')}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                📤 {selectedScenario.name}
              </h2>
              <p className="text-gray-600 mb-6">{selectedScenario.description}</p>
              
              <EnhancedFileUpload
                files={files}
                onFilesChange={handleFilesChange}
                maxFiles={selectedScenario.maxFiles}
                maxSizePerFile={selectedScenario.maxSizePerFile}
                acceptedTypes={selectedScenario.acceptedTypes}
                category={selectedScenario.category}
                bookingId="test_booking_123"
                showCamera={selectedScenario.showCamera}
                showBatchOperations={selectedScenario.showBatchOperations}
                allowReordering={selectedScenario.allowReordering}
                onUploadStart={handleUploadStart}
                onUploadProgress={handleUploadProgress}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </Card>
          </div>

          {/* Stats and Logs Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">📊 Upload Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Files Uploaded:</span>
                  <span className="font-mono">{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <span className="font-mono">{formatFileSize(stats.totalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-mono">
                    {stats.totalUploads > 0 
                      ? `${Math.round((stats.successfulUploads / stats.totalUploads) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Uploads:</span>
                  <span className="font-mono text-red-600">{stats.failedUploads}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFiles}
                className="w-full mt-3"
              >
                Clear All Files
              </Button>
            </Card>

            {/* Event Log */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">📝 Event Log</h3>
                <Button variant="ghost" size="sm" onClick={clearLogs}>
                  Clear
                </Button>
              </div>
              <div className="space-y-1 text-xs max-h-64 overflow-y-auto">
                {uploadEvents.length === 0 ? (
                  <div className="text-gray-500 italic">No events yet...</div>
                ) : (
                  uploadEvents.map((event, index) => (
                    <div key={index} className="py-1 border-b border-gray-100 last:border-0">
                      <div className="font-mono text-xs">{event}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Test Instructions */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">🧪 Test Instructions</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <div><strong>Drag & Drop:</strong> Drag files onto the upload area</div>
                <div><strong>Browse:</strong> Click the upload area to select files</div>
                <div><strong>Camera:</strong> Use camera button for photos</div>
                <div><strong>Batch:</strong> Select multiple files for batch operations</div>
                <div><strong>Categories:</strong> Switch between file categories</div>
                <div><strong>Preview:</strong> Click images for lightbox view</div>
              </div>
            </Card>

            {/* Feature Matrix */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">🔧 Current Features</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Drag & Drop</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Progress Tracking</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Image Preview</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>File Validation</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Categorization</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Batch Operations</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Camera Capture</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Image Compression</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* File Type Support Matrix */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📋 Supported File Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="font-medium">Images</div>
              <div className="text-sm text-gray-600">JPEG, PNG, WebP, GIF</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Documents</div>
              <div className="text-sm text-gray-600">PDF, TXT</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">📷</div>
              <div className="font-medium">Camera</div>
              <div className="text-sm text-gray-600">Live capture</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium">Performance</div>
              <div className="text-sm text-gray-600">Auto-compression</div>
            </div>
          </div>
        </Card>

        {/* Usage Statistics */}
        {files.length > 0 && (
          <Card className="p-6 mt-6 bg-green-50 border-green-200">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              ✅ Test Results Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{files.length}</div>
                <div className="text-sm text-green-700">Files Uploaded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatFileSize(stats.totalSize)}
                </div>
                <div className="text-sm text-green-700">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalUploads > 0 
                    ? Math.round((stats.successfulUploads / stats.totalUploads) * 100)
                    : 100
                  }%
                </div>
                <div className="text-sm text-green-700">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(files.map(f => f.category)).size}
                </div>
                <div className="text-sm text-green-700">Categories Used</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}