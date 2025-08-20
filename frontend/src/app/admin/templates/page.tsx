'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, FileText, MessageSquare, Download, Eye, Edit, 
  FileSpreadsheet, Code, RefreshCw, Plus, Search,
  CheckCircle, XCircle, AlertCircle, Image, Images,
  BarChart3, TrendingUp, Users
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getApiBaseUrl } from '@/lib/utils/api';
import { adminApiService } from '@/lib/services/adminApiService';
import EmailTemplateManager from '@/components/admin/EmailTemplateManager';
import EmailTemplatePreview from '@/components/admin/EmailTemplatePreview';

interface Template {
  id: string;
  name: string;
  subject?: string;
  template?: string;
  category: string;
  type: string;
  isActive?: boolean;
  is_active?: boolean;
  usageCount?: number;
  usage_count?: number;
  charCount?: number;
  updatedAt?: string;
  updated_at?: string;
}

interface ExportCapabilities {
  csv: { available: boolean; description: string };
  excel: { available: boolean; description: string };
  sms: { available: boolean; templates: number };
  json: { available: boolean; description: string };
}

export default function UnifiedTemplateManager() {
  const [activeTab, setActiveTab] = useState('email');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [exportCapabilities, setExportCapabilities] = useState<ExportCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Fetch templates based on active tab
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'email':
          // Use frontend API route instead of direct backend call
          const response = await fetch('/api/email-templates');
          if (response.ok) {
            result = await response.json();
          } else {
            result = { success: false, error: 'Failed to fetch email templates' };
          }
          break;
        case 'sms':
          result = await adminApiService.get('/api/export/sms/templates');
          break;
        case 'pdf':
          result = await adminApiService.get('/api/pdf/status');
          break;
        default:
          result = await adminApiService.get('/api/templates');
      }
      
      if (result.success || result.data) {
        if (activeTab === 'sms' && result.data?.templates) {
          setTemplates(result.data.templates);
        } else if (activeTab === 'email' && result.data?.templates) {
          setTemplates(result.data.templates);
        } else if (activeTab === 'pdf' && result.data?.capabilities) {
          // Create template entries from PDF capabilities
          setTemplates([
            { id: 'invoice', name: 'Invoice PDF', type: 'pdf', category: 'document', isActive: true },
            { id: 'quote', name: 'Quote PDF', type: 'pdf', category: 'document', isActive: true },
            { id: 'diagnostic', name: 'Diagnostic Report', type: 'pdf', category: 'document', isActive: false }
          ]);
        } else if (result.data?.template_types) {
          // Unified endpoint response
          const allTemplates: Template[] = [];
          Object.entries(result.data.template_types).forEach(([type, info]: [string, any]) => {
            if (info.templates_count > 0) {
              allTemplates.push({
                id: type,
                name: info.name,
                type,
                category: 'system',
                isActive: info.available,
                usageCount: info.templates_count
              });
            }
          });
          setTemplates(allTemplates);
        } else {
          setTemplates([]);
        }
      } else {
        // Handle API error from adminApiService
        console.error('API error:', result.error);
        setMessage({ type: 'error', text: result.error || 'Failed to load templates' });
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates' });
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch export capabilities
  const fetchExportCapabilities = async () => {
    try {
      const result = await adminApiService.get('/api/export/capabilities');
      if (result.success && result.data?.capabilities) {
        setExportCapabilities(result.data.capabilities);
      }
    } catch (error) {
      console.error('Failed to fetch export capabilities:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  useEffect(() => {
    fetchExportCapabilities();
  }, []);

  // Export templates
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const endpoint = format === 'csv' 
        ? '/api/export/csv/email-templates'
        : '/api/export/excel/email-templates';
        
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `templates-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage({ type: 'success', text: `Templates exported to ${format.toUpperCase()} successfully` });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: `Failed to export templates to ${format.toUpperCase()}` });
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category))).filter(Boolean);

  // Handle template editing
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplateEditor(true);
  };

  // Handle template creation
  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  // Handle template editor close
  const handleEditorClose = () => {
    setShowTemplateEditor(false);
    setSelectedTemplate(null);
    fetchTemplates(); // Refresh templates after editing
  };

  // Handle template preview
  const handlePreviewTemplate = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setShowPreview(true);
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewTemplateId(null);
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Template Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage all email, SMS, PDF, and export templates in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchTemplates()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Export Capabilities */}
      {exportCapabilities && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Export Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(exportCapabilities).map(([format, info]) => (
                <Badge key={format} variant="secondary" className="flex items-center gap-1">
                  {info.available ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  {format.toUpperCase()}
                  {format === 'sms' && info.templates && ` (${info.templates} templates)`}
                </Badge>
              ))}
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6">
              <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="email" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Templates
                </TabsTrigger>
                <TabsTrigger 
                  value="sms"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS Templates
                </TabsTrigger>
                <TabsTrigger 
                  value="pdf"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Templates
                </TabsTrigger>
                <TabsTrigger 
                  value="gallery"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Images className="h-4 w-4 mr-2" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Code className="h-4 w-4 mr-2" />
                  All Templates
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Filters */}
            <div className="p-6 border-b bg-muted/30">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template Lists */}
            <TabsContent value={activeTab} className="m-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  Loading templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No templates found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {activeTab === 'email' && <TableHead>Subject</TableHead>}
                      {activeTab === 'sms' && <TableHead>Characters</TableHead>}
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTemplateIcon(template.type || activeTab)}
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </TableCell>
                        {activeTab === 'email' && (
                          <TableCell className="max-w-[300px] truncate">
                            {template.subject || '-'}
                          </TableCell>
                        )}
                        {activeTab === 'sms' && (
                          <TableCell>
                            <Badge variant="outline">
                              {template.charCount || 0} chars
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="secondary">
                            {template.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            (template.isActive || template.is_active) ? 'default' : 'secondary'
                          }>
                            {(template.isActive || template.is_active) ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.usageCount || template.usage_count || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handlePreviewTemplate(template.id)}
                              title="Preview template"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditTemplate(template)}
                              title="Edit template"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="sms" className="m-0">
              {/* SMS templates content - same table structure */}
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  Loading SMS templates...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Characters</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[400px]">
                          <p className="text-sm text-muted-foreground truncate">
                            {template.template}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.charCount && template.charCount > 160 ? 'destructive' : 'secondary'}>
                            {template.charCount || 0}/160
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" title="Preview SMS template">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditTemplate(template)}
                              title="Edit SMS template"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="pdf" className="m-0">
              {/* PDF templates content */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Available' : 'Coming Soon'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" disabled={!template.isActive}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" disabled={!template.isActive}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="all" className="m-0">
              {/* All templates overview */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTemplateIcon(template.type)}
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">{template.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Templates:</span>
                            <span className="font-medium">{template.usageCount || 0}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            View
                          </Button>
                          <Button size="sm" className="flex-1">
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Phase 3: Template Gallery Tab */}
            <TabsContent value="gallery" className="m-0">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Template Visual Gallery</h3>
                  <p className="text-muted-foreground">
                    Visual management of templates with preview thumbnails and drag-and-drop organization
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <div className="text-center">
                            {getTemplateIcon(template.type)}
                            <div className="mt-2 text-xs text-muted-foreground">
                              {template.type?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm truncate" title={template.name}>
                            {template.name}
                          </h4>
                          
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <span className="text-muted-foreground">
                              {template.usageCount || 0} uses
                            </span>
                          </div>
                          
                          <div className="flex gap-1 pt-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="flex-1 text-xs" 
                              onClick={() => handlePreviewTemplate(template.id)}
                              title="Preview template"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="flex-1 text-xs"
                              onClick={() => handleEditTemplate(template)}
                              title="Edit template"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Images className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No templates found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start creating templates to see them in the visual gallery
                    </p>
                    <Button onClick={handleCreateTemplate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Phase 3: Analytics Tab */}
            <TabsContent value="analytics" className="m-0">
              <div className="p-6 space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Template Analytics & Usage Tracking</h3>
                  <p className="text-muted-foreground">
                    Monitor template performance, usage patterns, and engagement metrics
                  </p>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Templates</p>
                          <p className="text-2xl font-bold">{templates.length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Templates</p>
                          <p className="text-2xl font-bold text-green-600">
                            {templates.filter(t => t.isActive || t.is_active).length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Usage</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {templates.reduce((sum, t) => sum + (t.usageCount || t.usage_count || 0), 0)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Categories</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {Array.from(new Set(templates.map(t => t.category))).length}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Usage Analytics Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Template Performance</CardTitle>
                    <CardDescription>
                      Detailed usage statistics and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Usage Count</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates
                          .sort((a, b) => (b.usageCount || b.usage_count || 0) - (a.usageCount || a.usage_count || 0))
                          .slice(0, 10)
                          .map((template) => {
                            const usage = template.usageCount || template.usage_count || 0;
                            const maxUsage = Math.max(...templates.map(t => t.usageCount || t.usage_count || 0));
                            const performance = maxUsage > 0 ? (usage / maxUsage) * 100 : 0;
                            
                            return (
                              <TableRow key={template.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTemplateIcon(template.type)}
                                    <span className="font-medium">{template.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {template.type?.toUpperCase() || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {template.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {usage.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    (template.isActive || template.is_active) ? 'default' : 'secondary'
                                  }>
                                    {(template.isActive || template.is_active) ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(performance, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {performance.toFixed(0)}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                    
                    {templates.length === 0 && (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No analytics data</h3>
                        <p className="text-muted-foreground">
                          Analytics will appear once templates are created and used
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {selectedTemplate ? `Edit Template: ${selectedTemplate.name}` : 'Template Editor'}
                </h3>
                <Button
                  variant="ghost"
                  onClick={handleEditorClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <EmailTemplateManager className="border-0 shadow-none" />
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal - Basic modal for now */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Create New Template</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <EmailTemplateManager className="border-0 shadow-none" />
            </div>
          </div>
        </div>
      )}

      {/* Email Template Preview Modal */}
      {showPreview && previewTemplateId && (
        <EmailTemplatePreview
          templateId={previewTemplateId}
          onClose={handlePreviewClose}
        />
      )}
    </div>
  );
}