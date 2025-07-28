import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface StorageStats {
  totalSize: number;
  totalFiles: number;
  directories: {
    temp: { size: number; files: number };
    bookings: { size: number; files: number };
  };
  recommendations: {
    shouldCleanTemp: boolean;
    shouldCleanAbandoned: boolean;
    lowDiskSpace: boolean;
  };
}

interface CleanupResult {
  deletedFiles: number;
  freedSpace: number;
  errors: string[];
  summary: {
    tempFiles: number;
    abandonedFiles: number;
    oldFiles: number;
  };
}

interface StorageMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const StorageMonitor: React.FC<StorageMonitorProps> = ({
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/files/cleanup');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch storage stats');
      }
    } catch (err) {
      setError('Network error while fetching storage stats');
      console.error('Storage stats error:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  const performCleanup = async (type: 'temp' | 'abandoned' | 'all' = 'all') => {
    setCleaning(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files/cleanup?type=${type}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setLastCleanup(data.result);
        // Refresh stats after cleanup
        await fetchStats();
      } else {
        setError(data.error || 'Cleanup failed');
      }
    } catch (err) {
      setError('Network error during cleanup');
      console.error('Cleanup error:', err);
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageUsageColor = (size: number) => {
    if (size > 500 * 1024 * 1024) return 'text-red-600'; // > 500MB
    if (size > 200 * 1024 * 1024) return 'text-yellow-600'; // > 200MB
    return 'text-green-600';
  };

  const getStorageUsageBackground = (size: number) => {
    if (size > 500 * 1024 * 1024) return 'bg-red-50 border-red-200'; // > 500MB
    if (size > 200 * 1024 * 1024) return 'bg-yellow-50 border-yellow-200'; // > 200MB
    return 'bg-green-50 border-green-200';
  };

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading storage stats...</span>
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={cn('p-6 bg-red-50 border-red-200', className)}>
        <div className="text-center">
          <div className="text-2xl mb-2">❌</div>
          <h3 className="font-semibold text-red-800 mb-2">Storage Monitor Error</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <Button variant="ghost" onClick={fetchStats}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Storage Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => performCleanup('all')}
            disabled={cleaning}
          >
            {cleaning ? '🧹 Cleaning...' : '🧹 Clean Up'}
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <Card className={cn('p-6', getStorageUsageBackground(stats.totalSize))}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">💾</div>
            <div className={cn('text-2xl font-bold', getStorageUsageColor(stats.totalSize))}>
              {formatBytes(stats.totalSize)}
            </div>
            <div className="text-sm text-muted-foreground">Total Storage Used</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFiles.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Files</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-2">
              {stats.recommendations.lowDiskSpace ? '⚠️' : '✅'}
            </div>
            <div className={cn(
              'text-2xl font-bold',
              stats.recommendations.lowDiskSpace ? 'text-red-600' : 'text-green-600'
            )}>
              {stats.recommendations.lowDiskSpace ? 'High Usage' : 'Normal'}
            </div>
            <div className="text-sm text-muted-foreground">Storage Status</div>
          </div>
        </div>
      </Card>

      {/* Directory Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Temporary Files</h3>
            {stats.recommendations.shouldCleanTemp && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Needs Cleanup
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Size:</span>
              <span className="font-medium">{formatBytes(stats.directories.temp.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Files:</span>
              <span className="font-medium">{stats.directories.temp.files.toLocaleString()}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => performCleanup('temp')}
              disabled={cleaning || stats.directories.temp.files === 0}
              className="w-full"
            >
              {cleaning ? 'Cleaning...' : 'Clean Temp Files'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Booking Files</h3>
            {stats.recommendations.shouldCleanAbandoned && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Large Size
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Size:</span>
              <span className="font-medium">{formatBytes(stats.directories.bookings.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Files:</span>
              <span className="font-medium">{stats.directories.bookings.files.toLocaleString()}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => performCleanup('abandoned')}
              disabled={cleaning || stats.directories.bookings.files === 0}
              className="w-full"
            >
              {cleaning ? 'Cleaning...' : 'Clean Abandoned Files'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Cleanup Results */}
      {lastCleanup && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-2">Cleanup Completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Files Deleted:</span>
                  <div className="text-lg font-bold text-green-700">
                    {lastCleanup.deletedFiles.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Space Freed:</span>
                  <div className="text-lg font-bold text-green-700">
                    {formatBytes(lastCleanup.freedSpace)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Breakdown:</span>
                  <div className="text-sm text-green-700">
                    {lastCleanup.summary.tempFiles} temp, {lastCleanup.summary.abandonedFiles} abandoned
                  </div>
                </div>
              </div>
              
              {lastCleanup.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800 text-sm">Errors:</div>
                  <ul className="text-xs text-red-700 mt-1">
                    {lastCleanup.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {lastCleanup.errors.length > 3 && (
                      <li>• ... and {lastCleanup.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {(stats.recommendations.shouldCleanTemp || stats.recommendations.shouldCleanAbandoned || stats.recommendations.lowDiskSpace) && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">📋 Recommendations</h3>
          <div className="space-y-2 text-sm text-blue-700">
            {stats.recommendations.shouldCleanTemp && (
              <div className="flex items-center gap-2">
                <span>🧹</span>
                <span>Clean temporary files to free up space</span>
              </div>
            )}
            {stats.recommendations.shouldCleanAbandoned && (
              <div className="flex items-center gap-2">
                <span>📦</span>
                <span>Review and archive old booking files</span>
              </div>
            )}
            {stats.recommendations.lowDiskSpace && (
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>Storage usage is high - consider cleaning up or adding more space</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Storage Metrics */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Storage Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-lg font-bold">
              {Math.round((stats.directories.temp.size / stats.totalSize) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Temp Files</div>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-lg font-bold">
              {Math.round((stats.directories.bookings.size / stats.totalSize) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Booking Files</div>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-lg font-bold">
              {stats.totalFiles > 0 ? Math.round(stats.totalSize / stats.totalFiles / 1024) : 0}KB
            </div>
            <div className="text-xs text-muted-foreground">Avg File Size</div>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <div className="text-lg font-bold">
              {autoRefresh ? '🟢' : '🔴'}
            </div>
            <div className="text-xs text-muted-foreground">Auto Refresh</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StorageMonitor;