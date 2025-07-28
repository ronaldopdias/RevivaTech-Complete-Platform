'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Search,
  Grid3X3,
  List,
  Image,
  Video,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  Database,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiService } from '@/lib/services/apiService';

export default function MediaLibrary() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Load media files from API
  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAdminMedia();
      
      if (response.success && response.data) {
        setMediaFiles(response.data.files || []);
      } else {
        setError(response.error || 'Failed to load media files');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('Error loading media files:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image')) {
      return <Image className="h-5 w-5 text-teal-600" />;
    } else if (type?.startsWith('video')) {
      return <Video className="h-5 w-5 text-blue-600" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getFileUrl = (file) => {
    // Placeholder for now - in production this would use the actual file path
    return '/api/placeholder/400/300';
  };

  const getThumbnailUrl = (file) => {
    // Placeholder for now - in production this would use the actual thumbnail path
    return '/api/placeholder/200/150';
  };

  const filteredFiles = mediaFiles.filter(file => 
    (file.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statsData = [
    {
      title: 'Total Files',
      value: mediaFiles.length.toString(),
      subtitle: 'All media files',
      icon: <Database className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Images',
      value: mediaFiles.filter(f => f.file_type?.startsWith('image')).length.toString(),
      subtitle: 'Image files',
      icon: <Image className="h-5 w-5" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Videos',
      value: mediaFiles.filter(f => f.file_type?.startsWith('video')).length.toString(),
      subtitle: 'Video files',
      icon: <Video className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Views',
      value: mediaFiles.reduce((acc, f) => acc + (f.view_count || 0), 0).toLocaleString(),
      subtitle: 'File views',
      icon: <Eye className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <AdminLayout title="Media Library">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600">Manage your repair procedure media files</p>
          </div>
        </div>

        <Tabs defaultValue="browse" className="space-y-4">
          <TabsList>
            <TabsTrigger value="browse">Browse Files</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {loading && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span>Loading media files...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 text-red-600">
                    <span>⚠️ {error}</span>
                    <Button onClick={loadMediaFiles} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsData.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                          </div>
                          <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                            <div className={stat.color}>
                              {stat.icon}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Search and Controls */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search files..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* File Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Files ({filteredFiles.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mediaFiles.length === 0 ? (
                      <div className="text-center py-12">
                        <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Media Files</h3>
                        <p className="text-muted-foreground mb-4">
                          No media files have been uploaded yet. Upload your first file to get started.
                        </p>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload First File
                        </Button>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredFiles.map((file) => (
                          <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                  {file.file_type?.startsWith('image') ? (
                                    <img
                                      src={getThumbnailUrl(file)}
                                      alt={file.filename || file.original_filename}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center space-y-2">
                                      {getFileIcon(file.file_type)}
                                      <span className="text-xs text-muted-foreground text-center">
                                        {file.filename || file.original_filename}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm truncate">{file.filename || file.original_filename}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.file_size)} • {new Date(file.upload_date || file.created_at).toLocaleDateString()}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-1">
                                    {(file.tags || []).slice(0, 2).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{file.view_count || 0} views</span>
                                    <div className="flex space-x-1">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredFiles.map((file) => (
                          <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  {file.file_type?.startsWith('image') ? (
                                    <img
                                      src={getThumbnailUrl(file)}
                                      alt={file.filename || file.original_filename}
                                      className="w-16 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                                      {getFileIcon(file.file_type)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm">{file.filename || file.original_filename}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.file_size)} • {new Date(file.upload_date || file.created_at).toLocaleDateString()}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(file.tags || []).slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-center space-y-1 text-xs text-muted-foreground">
                                  <span>{file.view_count || 0} views</span>
                                  <span>{file.download_count || 0} downloads</span>
                                </div>
                                
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Media Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop files here, or click to select files
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics dashboard coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}