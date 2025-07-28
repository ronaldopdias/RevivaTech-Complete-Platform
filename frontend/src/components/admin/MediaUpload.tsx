'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  CloudUpload,
  Image,
  VideoFile,
  Description,
  Delete,
  Visibility,
  Edit,
  Download,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadDate: Date;
  tags: string[];
  description?: string;
  procedureId?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress?: number;
}

interface MediaUploadProps {
  onUploadComplete?: (files: MediaFile[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
  procedureId?: string;
}

export default function MediaUpload({
  onUploadComplete,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
  maxSize = 100,
  multiple = true,
  procedureId,
}: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxSize}MB limit` };
    }
    
    const fileType = file.type;
    const isAccepted = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return fileType.startsWith(type.replace('*', ''));
      }
      return type === fileType || file.name.toLowerCase().endsWith(type);
    });

    if (!isAccepted) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  };

  const simulateUpload = async (file: File): Promise<MediaFile> => {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const mediaFile: MediaFile = {
      id: fileId,
      name: file.name,
      type: getFileType(file),
      size: file.size,
      url: URL.createObjectURL(file),
      uploadDate: new Date(),
      tags: [],
      procedureId,
      status: 'uploading',
      progress: 0,
    };

    setFiles(prev => [...prev, mediaFile]);

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress }
            : f
        )
      );
    }

    // Simulate processing
    setFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: undefined }
          : f
      )
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Complete upload
    const completedFile = {
      ...mediaFile,
      status: 'ready' as const,
      progress: undefined,
      thumbnailUrl: mediaFile.type === 'image' ? mediaFile.url : undefined,
    };

    setFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? completedFile
          : f
      )
    );

    return completedFile;
  };

  const handleFileUpload = async (fileList: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setNotification({
        open: true,
        message: `Upload errors: ${errors.join(', ')}`,
        severity: 'error'
      });
    }

    const uploadedFiles: MediaFile[] = [];
    for (const file of validFiles) {
      try {
        const uploadedFile = await simulateUpload(file);
        uploadedFiles.push(uploadedFile);
      } catch (error) {
        setNotification({
          open: true,
          message: `Failed to upload ${file.name}`,
          severity: 'error'
        });
      }
    }

    if (uploadedFiles.length > 0) {
      setNotification({
        open: true,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        severity: 'success'
      });
      onUploadComplete?.(uploadedFiles);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setNotification({
      open: true,
      message: 'File deleted successfully',
      severity: 'success'
    });
  };

  const handleEditFile = (file: MediaFile) => {
    setSelectedFile(file);
    setOpenDialog(true);
  };

  const handleSaveFileDetails = () => {
    if (selectedFile) {
      setFiles(prev => 
        prev.map(f => 
          f.id === selectedFile.id 
            ? selectedFile
            : f
        )
      );
      setOpenDialog(false);
      setSelectedFile(null);
      setNotification({
        open: true,
        message: 'File details updated',
        severity: 'success'
      });
    }
  };

  const getFileIcon = (type: string, status: string) => {
    if (status === 'uploading' || status === 'processing') {
      return <CloudUpload sx={{ color: '#4A9FCC' }} />;
    }
    
    switch (type) {
      case 'image':
        return <Image sx={{ color: '#008080' }} />;
      case 'video':
        return <VideoFile sx={{ color: '#ADD8E6' }} />;
      default:
        return <Description sx={{ color: '#1A5266' }} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle sx={{ color: '#4CAF50', fontSize: '1rem' }} />;
      case 'error':
        return <Error sx={{ color: '#F44336', fontSize: '1rem' }} />;
      case 'processing':
        return <Warning sx={{ color: '#FF9800', fontSize: '1rem' }} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card 
        sx={{ 
          mb: 3,
          border: isDragging ? '2px dashed #ADD8E6' : '2px dashed #E0E0E0',
          backgroundColor: isDragging ? '#F0F8FF' : 'transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent>
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              textAlign: 'center',
              py: 4,
              cursor: 'pointer',
            }}
          >
            <CloudUpload sx={{ fontSize: 64, color: '#4A9FCC', mb: 2 }} />
            
            <Typography variant="h6" sx={{ color: '#1A5266', mb: 1 }}>
              Drop files here or click to upload
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#36454F', mb: 2 }}>
              Supports images, videos, and documents up to {maxSize}MB
            </Typography>
            
            <input
              type="file"
              multiple={multiple}
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            
            <label htmlFor="file-upload-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                sx={{
                  backgroundColor: '#008080',
                  '&:hover': { backgroundColor: '#006666' },
                }}
              >
                Choose Files
              </Button>
            </label>
          </Box>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#1A5266', mb: 2 }}>
              Uploaded Files ({files.length})
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {files.map((file) => (
                <Card
                  key={file.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* File Icon */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                      {getFileIcon(file.type, file.status)}
                      {getStatusIcon(file.status)}
                    </Box>

                    {/* File Info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1A5266' }}>
                        {file.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: '#4A9FCC' }}>
                          {formatFileSize(file.size)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#4A9FCC' }}>
                          • {file.type}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#4A9FCC' }}>
                          • {file.uploadDate.toLocaleDateString()}
                        </Typography>
                      </Box>

                      {file.tags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {file.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: '20px' }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Upload Progress */}
                      {file.status === 'uploading' && typeof file.progress === 'number' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={file.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#008080',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#4A9FCC' }}>
                            Uploading... {file.progress}%
                          </Typography>
                        </Box>
                      )}

                      {file.status === 'processing' && (
                        <Typography variant="caption" sx={{ color: '#FF9800' }}>
                          Processing...
                        </Typography>
                      )}
                    </Box>

                    {/* Actions */}
                    {file.status === 'ready' && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleEditFile(file)}>
                          <Edit sx={{ color: '#4A9FCC' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => window.open(file.url, '_blank')}>
                          <Visibility sx={{ color: '#008080' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteFile(file.id)}>
                          <Delete sx={{ color: '#F44336' }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Edit File Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#1A5266' }}>Edit File Details</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="File Name"
                fullWidth
                value={selectedFile.name}
                onChange={(e) => setSelectedFile({ ...selectedFile, name: e.target.value })}
              />
              
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={selectedFile.description || ''}
                onChange={(e) => setSelectedFile({ ...selectedFile, description: e.target.value })}
              />
              
              <TextField
                label="Tags (comma separated)"
                fullWidth
                value={selectedFile.tags.join(', ')}
                onChange={(e) => setSelectedFile({ 
                  ...selectedFile, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveFileDetails}
            sx={{
              backgroundColor: '#008080',
              '&:hover': { backgroundColor: '#006666' },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}