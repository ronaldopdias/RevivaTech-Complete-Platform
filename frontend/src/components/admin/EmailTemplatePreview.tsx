'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, X, Code, Smartphone, Edit, CheckCircle, 
  XCircle, RefreshCw, Copy, Download, Send
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/api';
import { adminApiService } from '@/lib/services/adminApiService';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  type: string;
  isActive: boolean;
  usageCount: number;
  charCount: number;
  updatedAt: string;
  variables?: string[];
}

interface EmailTemplatePreviewProps {
  templateId: string;
  onClose: () => void;
}

export default function EmailTemplatePreview({ templateId, onClose }: EmailTemplatePreviewProps) {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getEmailTemplate(templateId);
      
      if (result.success && result.data) {
        setTemplate(result.data);
      } else {
        setError(result.error || 'Failed to load template');
      }
    } catch (err) {
      setError('Error loading template');
      console.error('Template fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    // TODO: Implement test email sending
    alert('Test email functionality coming soon!');
  };

  const handleExport = () => {
    // TODO: Implement template export
    alert('Template export functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading template...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium mb-4">{error || 'Template not found'}</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{template.name}</CardTitle>
              <CardDescription className="mt-1">
                {template.subject}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={template.isActive ? 'default' : 'secondary'}>
                {template.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{template.category}</Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Actions Bar */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveView('desktop')}>
                <Eye className="h-4 w-4 mr-2" />
                Desktop View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveView('mobile')}>
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCode(!showCode)}>
                <Code className="h-4 w-4 mr-2" />
                {showCode ? 'Hide' : 'Show'} Code
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSendTest}>
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Preview Area */}
            <div className="lg:col-span-2 border-r overflow-hidden">
              <div className="h-full overflow-auto bg-gray-50">
                {showCode ? (
                  <div className="p-6">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                      <code>{template.template || 'Template code not available'}</code>
                    </pre>
                  </div>
                ) : (
                  <div className={`p-6 ${activeView === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <iframe
                        src={`/api/email-templates/preview?id=${templateId}`}
                        className="w-full h-[600px] border-0"
                        title="Email Template Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Template Info */}
            <div className="p-6 overflow-auto">
              <div className="space-y-6">
                {/* Statistics */}
                <div>
                  <h3 className="font-medium mb-3">Usage Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Times Used</span>
                      <span className="font-medium">{template.usageCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Character Count</span>
                      <span className="font-medium">{template.charCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-medium">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variables */}
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Template Variables</h3>
                    <div className="space-y-1">
                      {template.variables.map((variable) => (
                        <div key={variable} className="flex items-center gap-2 text-sm">
                          <Code className="h-3 w-3 text-muted-foreground" />
                          <code className="bg-muted px-2 py-0.5 rounded">
                            {`{${variable}}`}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Template
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      disabled={!template.isActive}
                    >
                      {template.isActive ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="font-medium mb-3">Recent Activity</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>No recent activity recorded</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}