'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Clock,
  Settings,
  FileText,
  Video,
  Image,
  Users,
  Star,
} from 'lucide-react';
import { apiService } from '@/lib/services/apiService';

export default function RepairProcedures() {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  // Load procedures from API
  useEffect(() => {
    loadProcedures();
  }, []);

  const loadProcedures = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAdminProcedures();
      
      if (response.success && response.data) {
        setProcedures(response.data.procedures || []);
      } else {
        setError(response.error || 'Failed to load procedures');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('Error loading procedures:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProcedures = procedures.filter(procedure =>
    procedure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (procedure.device_compatibility?.models || []).some(model => 
      model.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    procedure.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (procedure.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'success';
      case 'intermediate':
      case 'medium':
      case 'advanced':
        return 'warning';
      case 'expert':
      case 'hard':
        return 'destructive';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatEstimatedTime = (minutes) => {
    if (!minutes) return 'Unknown';
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getDeviceNames = (compatibility) => {
    if (!compatibility?.models) return 'Unknown';
    return compatibility.models.slice(0, 3).join(', ') + (compatibility.models.length > 3 ? '...' : '');
  };

  const statsData = [
    {
      title: 'Total Procedures',
      value: procedures.length.toString(),
      subtitle: 'All procedures',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Published Procedures',
      value: procedures.filter(p => p.status?.toLowerCase() === 'published').length.toString(),
      subtitle: 'Live procedures',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Views',
      value: procedures.reduce((acc, p) => acc + (p.view_count || 0), 0).toLocaleString(),
      subtitle: 'Procedure views',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Average Success Rate',
      value: procedures.length > 0 ? 
        (procedures.reduce((acc, p) => acc + parseFloat(p.success_rate || '0'), 0) / procedures.length).toFixed(1) + '%' : 
        '0%',
      subtitle: 'Success rate',
      icon: <Star className="h-5 w-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <AdminLayout title="Repair Procedures">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Procedures</h1>
            <p className="text-gray-600">Manage step-by-step repair guides and documentation</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Procedure
          </Button>
        </div>

        {loading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span>Loading procedures...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 text-red-600">
                <span>⚠️ {error}</span>
                <Button onClick={loadProcedures} variant="outline" size="sm">
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
                      placeholder="Search procedures..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Procedures List */}
            <Card>
              <CardHeader>
                <CardTitle>Procedures ({filteredProcedures.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProcedures.map((procedure) => (
                    <Card key={procedure.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold">{procedure.title}</h3>
                                  <Badge variant={getStatusColor(procedure.status)}>
                                    {procedure.status}
                                  </Badge>
                                  <Badge variant={getDifficultyColor(procedure.difficulty)}>
                                    {procedure.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm mb-2">
                                  {procedure.description}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Settings className="h-4 w-4 mr-1" />
                                    {getDeviceNames(procedure.device_compatibility)}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {formatEstimatedTime(procedure.estimated_time_minutes)}
                                  </span>
                                  <span className="flex items-center">
                                    <Video className="h-4 w-4 mr-1" />
                                    {procedure.video_count || 0} videos
                                  </span>
                                  <span className="flex items-center">
                                    <Image className="h-4 w-4 mr-1" />
                                    {procedure.image_count || 0} images
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>{procedure.view_count || 0} views</span>
                                <span>{procedure.success_rate || 0}% success rate</span>
                                <div className="flex items-center">
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {(procedure.category || '').replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProcedure(procedure);
                                    setShowDialog(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Procedure Details Dialog */}
        {showDialog && selectedProcedure && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedProcedure.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDialog(false)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedProcedure.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Devices</h4>
                    <p className="text-muted-foreground">{getDeviceNames(selectedProcedure.device_compatibility)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Category</h4>
                    <p className="text-muted-foreground">{(selectedProcedure.category || '').replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Difficulty</h4>
                    <Badge variant={getDifficultyColor(selectedProcedure.difficulty)}>
                      {selectedProcedure.difficulty}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Estimated Time</h4>
                    <p className="text-muted-foreground">{formatEstimatedTime(selectedProcedure.estimated_time_minutes)}</p>
                  </div>
                </div>

                {selectedProcedure.overview && (
                  <div>
                    <h4 className="font-semibold mb-2">Overview</h4>
                    <p className="text-muted-foreground text-sm mb-4">{selectedProcedure.overview}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Views:</span>
                      <span>{selectedProcedure.view_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span>{selectedProcedure.success_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Videos:</span>
                      <span>{selectedProcedure.video_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span>{selectedProcedure.image_count || 0}</span>
                    </div>
                  </div>
                </div>

                {selectedProcedure.tags && selectedProcedure.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProcedure.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => setShowDialog(false)}>
                    Close
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Procedure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}