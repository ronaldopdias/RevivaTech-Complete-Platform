'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  Image, 
  X, 
  Check, 
  AlertCircle,
  Paperclip,
  Download,
  Eye
} from 'lucide-react';

interface FileUploadItem {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
  preview?: string;
}

interface ChatFileUploadProps {
  onFilesUploaded: (files: FileUploadItem[]) => void;
  onFileRemoved: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  autoUpload?: boolean;
  uploadEndpoint?: string;
}

const defaultAllowedTypes = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const ChatFileUpload: React.FC<ChatFileUploadProps> = ({
  onFilesUploaded,
  onFileRemoved,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  allowedTypes = defaultAllowedTypes,
  autoUpload = true,
  uploadEndpoint = '/api/chat/upload'
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported';
    }
    
    return null;
  };

  const generatePreview = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });
  };

  const uploadFile = async (fileItem: FileUploadItem): Promise<FileUploadItem> => {
    const formData = new FormData();
    formData.append('file', fileItem.file);
    formData.append('context', 'chat');
    formData.append('timestamp', new Date().toISOString());

    try {
      // Simulate upload progress
      const updateProgress = (progress: number) => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress } : f
        ));
      };

      // Simulate progressive upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        updateProgress(i);
      }

      // In real implementation, make actual API call
      // const response = await fetch(uploadEndpoint, {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate successful upload
      const mockResponse = {
        url: URL.createObjectURL(fileItem.file),
        id: fileItem.id,
        filename: fileItem.file.name,
        size: fileItem.file.size,
        type: fileItem.file.type
      };

      return {
        ...fileItem,
        status: 'completed',
        progress: 100,
        url: mockResponse.url
      };
    } catch (error) {
      return {
        ...fileItem,
        status: 'error',
        error: 'Upload failed. Please try again.'
      };
    }
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: FileUploadItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      const preview = await generatePreview(file);
      const fileItem: FileUploadItem = {
        id: `file-${Date.now()}-${i}`,
        file,
        status: 'uploading',
        progress: 0,
        preview
      };

      newFiles.push(fileItem);
    }

    if (newFiles.length === 0) return;

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Auto-upload files if enabled
    if (autoUpload) {
      const uploadPromises = newFiles.map(async (fileItem) => {
        const uploadedItem = await uploadFile(fileItem);
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedItem.id ? uploadedItem : f
        ));
        return uploadedItem;
      });

      try {
        const completedFiles = await Promise.all(uploadPromises);
        onFilesUploaded(completedFiles);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    onFileRemoved(fileId);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
        />
        
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Max {maxFiles} files, {maxFileSize}MB each
        </p>
        
        {/* Supported formats */}
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {['JPG', 'PNG', 'PDF', 'DOC'].map(format => (
            <span
              key={format}
              className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded"
            >
              {format}
            </span>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0 mr-3">
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      {getFileIcon(fileItem.file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileItem.file.size)}
                  </p>

                  {/* Progress Bar */}
                  {fileItem.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {fileItem.progress}%
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {fileItem.status === 'error' && fileItem.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {fileItem.error}
                    </p>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center space-x-2 ml-3">
                  {fileItem.status === 'completed' && (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      {fileItem.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(fileItem.url, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                  
                  {fileItem.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileItem.id);
                    }}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors"
      >
        <Paperclip className="h-4 w-4 mr-2" />
        Attach Files
      </button>
    </div>
  );
};

export default ChatFileUpload;