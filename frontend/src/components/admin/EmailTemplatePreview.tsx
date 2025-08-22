'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, X, Code, Smartphone, Monitor, Tablet, 
  Maximize2, Minimize2, Copy, Download, Send,
  RefreshCw, XCircle, Settings, ZoomIn, ZoomOut,
  RotateCcw, Split, FileText, Save, Edit
} from 'lucide-react';

// Enhanced template interface matching API response
interface EmailTemplate {
  id: string | number;
  name: string;
  subject: string;
  html_template: string;
  text_template?: string;
  category: string;
  template_type: string;
  is_active: boolean;
  usage_count: number;
  version: number;
  variables?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: number;
  last_used_at?: string;
}

interface EmailTemplatePreviewProps {
  templateId: string;
  onClose: () => void;
}

type ViewMode = 'preview' | 'code' | 'split';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type CodeMode = 'html' | 'text';

export default function EmailTemplatePreview({ templateId, onClose }: EmailTemplatePreviewProps) {
  // State management
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [codeMode, setCodeMode] = useState<CodeMode>('html');
  const [fullScreen, setFullScreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  
  // Code editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtmlTemplate, setEditedHtmlTemplate] = useState('');
  const [editedTextTemplate, setEditedTextTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch template data with proper error handling
  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/email-templates/${templateId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      
      if (result.success && result.data) {
        setTemplate(result.data);
        setEditedHtmlTemplate(result.data.html_template || '');
        setEditedTextTemplate(result.data.text_template || '');
        setHasUnsavedChanges(false);
      } else {
        throw new Error(result.error || 'Failed to load template');
      }
    } catch (err) {
      console.error('Template fetch error:', err);
      setError(err instanceof Error ? err.message : 'Error loading template');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullScreen) {
          setFullScreen(false);
        } else {
          onClose();
        }
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setViewMode('preview');
            break;
          case '2':
            e.preventDefault();
            setViewMode('code');
            break;
          case '3':
            e.preventDefault();
            setViewMode('split');
            break;
          case '=':
            e.preventDefault();
            setZoom(prev => Math.min(200, prev + 10));
            break;
          case '-':
            e.preventDefault();
            setZoom(prev => Math.max(50, prev - 10));
            break;
          case '0':
            e.preventDefault();
            setZoom(100);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [fullScreen, onClose]);

  // Copy to clipboard functionality
  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // TODO: Add toast notification
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Save template changes
  const saveTemplate = async () => {
    if (!template) return;
    
    try {
      setSaving(true);
      const updatedTemplate = {
        ...template,
        html_template: editedHtmlTemplate,
        text_template: editedTextTemplate
      };
      
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTemplate),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      
      setTemplate({ ...template, ...updatedTemplate });
      setHasUnsavedChanges(false);
      console.log('Template saved successfully');
      
    } catch (err) {
      console.error('Save error:', err);
      // TODO: Add toast notification for error
    } finally {
      setSaving(false);
    }
  };

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    if (codeMode === 'html') {
      setEditedHtmlTemplate(newCode);
      setHasUnsavedChanges(newCode !== template?.html_template);
    } else {
      setEditedTextTemplate(newCode);
      setHasUnsavedChanges(newCode !== template?.text_template);
    }
  };

  // Get device dimensions for responsive preview
  const getDeviceDimensions = () => {
    switch (deviceMode) {
      case 'mobile':
        return { width: 375, maxWidth: '375px', label: 'iPhone 13' };
      case 'tablet':
        return { width: 768, maxWidth: '768px', label: 'iPad' };
      default:
        return { width: '100%', maxWidth: '100%', label: 'Desktop' };
    }
  };

  const deviceDims = getDeviceDimensions();

  // Loading state
  if (loading) {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm`}>
        <Card className="w-full max-w-lg bg-white shadow-2xl">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-6 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">Loading Template</h3>
            <p className="text-gray-600">Fetching template data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
        <Card className="w-full max-w-lg bg-white shadow-2xl">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">Template Error</h3>
            <p className="text-gray-600 mb-6">{error || 'Template not found'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => fetchTemplate()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main preview interface
  return (
    <div className={`fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-all duration-300`}>
      <div className={`bg-white shadow-2xl transition-all duration-300 ${
        fullScreen 
          ? 'inset-0' 
          : 'inset-4 rounded-xl'
      }`}>
        
        {/* Header */}
        <div className="border-b bg-gray-50/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {template.name}
              </h2>
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Active' : 'Inactive'} 
              </Badge>
              <span className="text-sm text-gray-500">
                v{template.version}
              </span>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg border p-1">
                <Button 
                  size="sm" 
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('preview')}
                  className="px-3"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant={viewMode === 'code' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('code')}
                  className="px-3"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant={viewMode === 'split' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('split')}
                  className="px-3"
                >
                  <Split className="h-4 w-4" />
                </Button>
              </div>

              {/* Device Mode Toggle */}
              {viewMode !== 'code' && (
                <div className="flex bg-white rounded-lg border p-1">
                  <Button 
                    size="sm" 
                    variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
                    onClick={() => setDeviceMode('desktop')}
                    className="px-3"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
                    onClick={() => setDeviceMode('tablet')}
                    className="px-3"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
                    onClick={() => setDeviceMode('mobile')}
                    className="px-3"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Zoom Controls */}
              {viewMode !== 'code' && (
                <div className="flex items-center gap-1 bg-white rounded-lg border px-2 py-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                    className="px-2 py-1 h-8"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-mono w-10 text-center">
                    {zoom}%
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                    className="px-2 py-1 h-8"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setZoom(100)}
                    className="px-2 py-1 h-8"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {viewMode === 'code' || viewMode === 'split' ? (
                  <>
                    <Button 
                      size="sm" 
                      variant={isEditing ? 'default' : 'outline'}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? 'View' : 'Edit'}
                    </Button>
                    {isEditing && hasUnsavedChanges && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={saveTemplate}
                        disabled={saving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                  </>
                ) : null}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(
                    codeMode === 'html' ? 
                      (isEditing ? editedHtmlTemplate : template.html_template) : 
                      (isEditing ? editedTextTemplate : (template.text_template || '')), 
                    codeMode.toUpperCase()
                  )}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline">
                  <Send className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setFullScreen(!fullScreen)}
                >
                  {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Device indicator */}
          {viewMode !== 'code' && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{deviceDims.label}</span>
                {typeof deviceDims.width === 'number' && (
                  <span className="text-gray-400">({deviceDims.width}px)</span>
                )}
                <span className="text-gray-400">•</span>
                <span>Zoom: {zoom}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          {viewMode === 'preview' && (
            <PreviewPanel 
              templateId={templateId}
              deviceMode={deviceMode}
              zoom={zoom}
              deviceDims={deviceDims}
            />
          )}
          
          {viewMode === 'code' && (
            <CodePanel 
              template={template}
              codeMode={codeMode}
              onCodeModeChange={setCodeMode}
              isEditing={isEditing}
              editedHtmlTemplate={editedHtmlTemplate}
              editedTextTemplate={editedTextTemplate}
              onCodeChange={handleCodeChange}
            />
          )}
          
          {viewMode === 'split' && (
            <div className="h-full grid grid-cols-2 gap-0">
              <div className="border-r">
                <CodePanel 
                  template={template}
                  codeMode={codeMode}
                  onCodeModeChange={setCodeMode}
                  isEditing={isEditing}
                  editedHtmlTemplate={editedHtmlTemplate}
                  editedTextTemplate={editedTextTemplate}
                  onCodeChange={handleCodeChange}
                />
              </div>
              <PreviewPanel 
                templateId={templateId}
                deviceMode={deviceMode}
                zoom={zoom}
                deviceDims={deviceDims}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50/50 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Subject: {template.subject}</span>
              <span>•</span>
              <span>Category: {template.category}</span>
              <span>•</span>
              <span>Used: {template.usage_count} times</span>
            </div>
            <div className="text-xs">
              Press Esc to close • Ctrl+1/2/3 for view modes • Ctrl +/- for zoom
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview Panel Component
interface PreviewPanelProps {
  templateId: string;
  deviceMode: DeviceMode;
  zoom: number;
  deviceDims: { width: string | number; maxWidth: string; label: string };
}

function PreviewPanel({ templateId, deviceMode, zoom, deviceDims }: PreviewPanelProps) {
  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 flex justify-center items-start min-h-full">
        <div 
          className="bg-white rounded-lg shadow-lg transition-all duration-300"
          style={{ 
            maxWidth: deviceDims.maxWidth,
            width: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: zoom < 100 ? '2rem' : '0'
          }}
        >
          {/* Responsive iframe container */}
          <div className="relative w-full overflow-hidden rounded-lg">
            <iframe
              src={`/api/email-templates/preview?id=${templateId}`}
              className="w-full border-0"
              style={{ 
                height: deviceMode === 'mobile' ? '667px' : 
                       deviceMode === 'tablet' ? '800px' : 
                       '700px',
                minHeight: '500px'
              }}
              title="Email Template Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Code Panel Component  
interface CodePanelProps {
  template: EmailTemplate;
  codeMode: CodeMode;
  onCodeModeChange: (mode: CodeMode) => void;
  isEditing: boolean;
  editedHtmlTemplate: string;
  editedTextTemplate: string;
  onCodeChange: (code: string) => void;
}

function CodePanel({ 
  template, 
  codeMode, 
  onCodeModeChange, 
  isEditing, 
  editedHtmlTemplate, 
  editedTextTemplate, 
  onCodeChange 
}: CodePanelProps) {
  const currentContent = codeMode === 'html' ? 
    (isEditing ? editedHtmlTemplate : template.html_template) : 
    (isEditing ? editedTextTemplate : (template.text_template || 'No text template available'));
  
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Code header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex gap-2">
          <Button 
            size="sm"
            variant={codeMode === 'html' ? 'default' : 'outline'}
            onClick={() => onCodeModeChange('html')}
            className="text-xs"
          >
            HTML
          </Button>
          <Button 
            size="sm"
            variant={codeMode === 'text' ? 'default' : 'outline'}
            onClick={() => onCodeModeChange('text')}
            className="text-xs"
          >
            Text
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <Edit className="h-3 w-3" />
              Editing Mode
            </span>
          )}
          <div className="text-xs text-gray-400">
            {currentContent.length.toLocaleString()} characters
          </div>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <textarea
            value={currentContent}
            onChange={(e) => onCodeChange(e.target.value)}
            className="w-full h-full p-4 text-sm leading-relaxed bg-gray-900 text-gray-100 font-mono border-0 outline-0 resize-none"
            style={{
              fontFamily: 'Consolas, "Courier New", monospace',
              lineHeight: '1.5',
              tabSize: '2'
            }}
            placeholder={`Enter ${codeMode.toUpperCase()} template code here...`}
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-auto">
            <pre className="p-4 text-sm leading-relaxed">
              <code className="text-gray-100 whitespace-pre-wrap break-words font-mono">
                {currentContent}
              </code>
            </pre>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="border-t border-gray-700 px-4 py-2 bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>{codeMode.toUpperCase()} Template</span>
            {isEditing && (
              <span className="text-yellow-400">• Unsaved Changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>Lines: {currentContent.split('\n').length}</span>
            <span>Words: {currentContent.trim().split(/\s+/).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}