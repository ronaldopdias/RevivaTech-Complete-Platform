'use client';

/**
 * Content Management Dashboard
 * Phase 4: Content Management System - Admin dashboard for content management
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useContentList } from '@/lib/cms/hooks/useContent';
import { contentValidator, revivaTechContentTypes } from '@/lib/cms/contentConfig';
import { translationManager } from '@/lib/cms/translationManager';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Languages,
  Copy,
  RefreshCw,
  Download,
  Upload,
  Settings
} from 'lucide-react';

interface ContentItem {
  id: string;
  type: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  locale: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
}

export default function CMSDashboard() {
  const [selectedType, setSelectedType] = useState('page');
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showTranslations, setShowTranslations] = useState(false);

  const {
    data: contentList,
    loading,
    error,
    refetch,
    loadMore,
    hasMore
  } = useContentList<ContentItem>(selectedType, {
    locale: selectedLocale,
    search: searchQuery || undefined,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    limit: 20,
    orderBy: 'updatedAt',
    orderDirection: 'desc'
  });

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    translations: 0
  });

  const [translationJobs, setTranslationJobs] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadTranslationJobs();
  }, [selectedType]);

  const loadStats = async () => {
    try {
      // Get content stats for current type
      const allContent = await fetch(`/api/cms/${selectedType}?limit=1000`).then(r => r.json());
      const content = allContent.data || [];

      setStats({
        total: content.length,
        published: content.filter((item: ContentItem) => item.status === 'published').length,
        draft: content.filter((item: ContentItem) => item.status === 'draft').length,
        translations: content.filter((item: ContentItem) => item.locale !== 'en').length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTranslationJobs = () => {
    const jobs = translationManager.getTranslationJobs({
      contentType: selectedType
    });
    setTranslationJobs(jobs);
  };

  const handleCreateContent = () => {
    // Navigate to content editor
    window.location.href = `/admin/cms/${selectedType}/new`;
  };

  const handleEditContent = (item: ContentItem) => {
    // Navigate to content editor
    window.location.href = `/admin/cms/${selectedType}/${item.id}/edit`;
  };

  const handleDeleteContent = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/${selectedType}/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refetch();
        loadStats();
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete content');
    }
  };

  const handlePublishContent = async (item: ContentItem) => {
    try {
      const response = await fetch(`/api/cms/${selectedType}/${item.id}/publish`, {
        method: 'PATCH'
      });

      if (response.ok) {
        refetch();
        loadStats();
      } else {
        throw new Error('Failed to publish content');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish content');
    }
  };

  const handleDuplicateContent = async (item: ContentItem) => {
    try {
      const response = await fetch(`/api/cms/${selectedType}/${item.id}/duplicate`, {
        method: 'PATCH'
      });

      if (response.ok) {
        refetch();
        loadStats();
      } else {
        throw new Error('Failed to duplicate content');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate content');
    }
  };

  const handleCreateTranslation = async (item: ContentItem) => {
    const targetLocale = selectedLocale === 'en' ? 'pt' : 'en';
    
    try {
      await translationManager.createTranslationJob(
        selectedType,
        item.id,
        [targetLocale],
        {
          title: `Translate "${item.title}" to ${targetLocale.toUpperCase()}`,
          createdBy: 'admin'
        }
      );

      loadTranslationJobs();
      alert(`Translation job created for ${targetLocale.toUpperCase()}`);
    } catch (error) {
      console.error('Translation job error:', error);
      alert('Failed to create translation job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <Edit3 className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Content</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-600 mt-1">Manage your website content across multiple languages</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTranslations(!showTranslations)}
              className="flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              Translations
            </Button>
            
            <Button
              variant="outline"
              onClick={refetch}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button onClick={handleCreateContent} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New {selectedType}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Edit3 className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Translations</p>
                <p className="text-2xl font-bold text-purple-600">{stats.translations}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Content Types</h3>
              <div className="space-y-2">
                {revivaTechContentTypes.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => setSelectedType(type.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedType === type.name
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {type.label}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Language</h4>
                <div className="space-y-2">
                  {['en', 'pt'].map((locale) => (
                    <button
                      key={locale}
                      onClick={() => setSelectedLocale(locale)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedLocale === locale
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {locale === 'en' ? '🇬🇧 English' : '🇵🇹 Portuguese'}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {['draft', 'published', 'archived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        if (statusFilter.includes(status)) {
                          setStatusFilter(statusFilter.filter(s => s !== status));
                        } else {
                          setStatusFilter([...statusFilter, status]);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter.includes(status)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Content List */}
            <Card>
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900">
                  {revivaTechContentTypes.find(t => t.name === selectedType)?.label || selectedType}
                </h3>
              </div>

              <div className="divide-y">
                {loading && contentList.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading content...</p>
                  </div>
                ) : contentList.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                    <p className="text-gray-600 mb-4">Get started by creating your first {selectedType}.</p>
                    <Button onClick={handleCreateContent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create {selectedType}
                    </Button>
                  </div>
                ) : (
                  contentList.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <Badge className={getStatusColor(item.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(item.status)}
                                {item.status}
                              </div>
                            </Badge>
                            {item.locale !== 'en' && (
                              <Badge variant="secondary">
                                {item.locale.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">/{item.slug}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Updated {formatDate(item.updatedAt)}</span>
                            {item.publishedAt && (
                              <span>Published {formatDate(item.publishedAt)}</span>
                            )}
                            {item.createdBy && (
                              <span>by {item.createdBy}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditContent(item)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          {item.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishContent(item)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateTranslation(item)}
                          >
                            <Languages className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateContent(item)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteContent(item)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {hasMore && (
                <div className="p-6 border-t text-center">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Load More
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Translation Jobs Panel */}
        {showTranslations && (
          <Card className="mt-6 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Translation Jobs</h3>
            {translationJobs.length === 0 ? (
              <p className="text-gray-600">No translation jobs found.</p>
            ) : (
              <div className="space-y-4">
                {translationJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{job.title}</h4>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{job.sourceLocale.toUpperCase()} → {job.targetLocales.join(', ').toUpperCase()}</span>
                      <span>{job.progress}% complete</span>
                      <span>Created {formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}