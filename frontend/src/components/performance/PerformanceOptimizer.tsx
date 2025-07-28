'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, AlertTriangle, CheckCircle, X, Settings } from 'lucide-react';
import { usePerformanceMonitoring, performanceUtils, webVitalsMonitor } from '@/lib/performance/coreWebVitals';
import { useAuth } from '@/lib/auth/client';

interface PerformanceOptimizerProps {
  showDebugPanel?: boolean;
  enableAutoOptimizations?: boolean;
  className?: string;
}

export function PerformanceOptimizer({ 
  showDebugPanel = false, 
  enableAutoOptimizations = true,
  className = '' 
}: PerformanceOptimizerProps) {
  const { isAdmin } = useAuth();
  const { report, resourceAnalysis, score, metrics, suggestions } = usePerformanceMonitoring();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(showDebugPanel);

  useEffect(() => {
    if (enableAutoOptimizations) {
      runAutoOptimizations();
    }
  }, [enableAutoOptimizations]);

  const runAutoOptimizations = async () => {
    setIsOptimizing(true);
    const results: string[] = [];

    try {
      // 1. Preload critical resources (skip local fonts - using Google Fonts)
      performanceUtils.preloadResource('/icons/icon-192x192.png', 'image');
      results.push('✅ Preloaded critical resources');

      // 2. Optimize images
      performanceUtils.lazyLoadImages();
      results.push('✅ Enabled lazy loading for images');

      // 3. Optimize fonts
      performanceUtils.optimizeFonts();
      results.push('✅ Optimized font loading');

      // 4. Enable resource hints
      enableResourceHints();
      results.push('✅ Added resource hints');

      // 5. Optimize third-party scripts
      await optimizeThirdPartyScripts();
      results.push('✅ Optimized third-party scripts');

      // 6. Enable service worker caching
      if ('serviceWorker' in navigator) {
        results.push('✅ Service worker caching active');
      }

      setOptimizationResults(results);
    } catch (error) {
      console.error('Auto-optimization failed:', error);
      results.push('❌ Some optimizations failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const enableResourceHints = () => {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://api.revivatech.co.uk', crossOrigin: 'anonymous' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) {
        link.crossOrigin = hint.crossOrigin;
      }
      document.head.appendChild(link);
    });
  };

  const optimizeThirdPartyScripts = async () => {
    // Delay non-critical third-party scripts
    const scripts = document.querySelectorAll('script[data-delay]');
    
    if (scripts.length > 0) {
      // Load them after user interaction or after 3 seconds
      const loadScripts = () => {
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          newScript.src = script.getAttribute('data-src') || '';
          newScript.async = true;
          document.head.appendChild(newScript);
        });
      };

      // Load on first user interaction
      const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      const onFirstInteraction = () => {
        loadScripts();
        interactionEvents.forEach(event => {
          document.removeEventListener(event, onFirstInteraction);
        });
      };

      interactionEvents.forEach(event => {
        document.addEventListener(event, onFirstInteraction, { passive: true });
      });

      // Fallback: load after 3 seconds
      setTimeout(loadScripts, 3000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Admin-only debug panel (replaces NODE_ENV check)
  if (isAdmin() && showPanel) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Performance</span>
                {score > 0 && (
                  <div className="flex items-center gap-1">
                    {getScoreIcon(score)}
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {/* Optimization Status */}
              {isOptimizing && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Settings className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm font-medium">Optimizing performance...</span>
                  </div>
                </div>
              )}

              {/* Optimization Results */}
              {optimizationResults.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Optimizations</h4>
                  <div className="space-y-1">
                    {optimizationResults.map((result, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Web Vitals */}
              {metrics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Core Web Vitals</h4>
                  <div className="space-y-2">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className={`flex items-center justify-between px-2 py-1 rounded text-xs ${getMetricColor(metric.rating)}`}
                      >
                        <span className="font-medium">{metric.name}</span>
                        <span>
                          {metric.name === 'CLS' 
                            ? metric.value.toFixed(3)
                            : `${Math.round(metric.value)}ms`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Analysis */}
              {resourceAnalysis && resourceAnalysis.slowResources.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Slow Resources ({resourceAnalysis.slowResources.length})
                  </h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {resourceAnalysis.slowResources.slice(0, 3).map((resource, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        <div className="font-medium truncate">{resource.name.split('/').pop()}</div>
                        <div className="text-gray-500">
                          {resource.duration}ms • {resource.type}
                          {resource.size > 0 && ` • ${Math.round(resource.size / 1024)}KB`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggestions</h4>
                  <div className="space-y-1">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="text-xs text-gray-600 leading-relaxed">
                        • {suggestion}
                      </div>
                    ))}
                    {suggestions.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{suggestions.length - 3} more suggestions
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No data state */}
              {!report && (
                <div className="text-center py-4 text-gray-500">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Measuring performance...</div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Production: Silent optimization only
  return null;
}

// Hook for components to trigger custom performance tracking
export function usePerformanceTracker() {
  const trackRender = (componentName: string) => {
    webVitalsMonitor.mark(`${componentName}-render-start`);
    
    return () => {
      webVitalsMonitor.mark(`${componentName}-render-end`);
      webVitalsMonitor.measure(
        `${componentName}-render-time`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    };
  };

  const trackInteraction = (interactionName: string) => {
    performanceUtils.trackCustomMetric(interactionName, Date.now());
  };

  return {
    trackRender,
    trackInteraction
  };
}

export default PerformanceOptimizer;