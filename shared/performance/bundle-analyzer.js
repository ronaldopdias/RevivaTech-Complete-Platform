const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const fs = require('fs');
const path = require('path');

// Bundle analysis configuration
const bundleAnalyzerConfig = {
  analyzerMode: 'static',
  openAnalyzer: false,
  reportFilename: 'bundle-report.html',
  defaultSizes: 'parsed',
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  logLevel: 'info'
};

// Performance budget thresholds (in bytes)
const PERFORMANCE_BUDGETS = {
  // Main bundle size limits
  maxInitialBundleSize: 250 * 1024, // 250KB
  maxChunkSize: 500 * 1024, // 500KB
  
  // Asset size limits
  maxImageSize: 200 * 1024, // 200KB
  maxFontSize: 100 * 1024, // 100KB
  maxCSSSize: 50 * 1024, // 50KB
  
  // Library size warnings
  maxLibrarySize: 150 * 1024, // 150KB per library
  
  // Total size limits
  maxTotalBundleSize: 2 * 1024 * 1024, // 2MB
  
  // Loading performance
  maxJavaScriptParseTime: 100, // 100ms
  maxCSSParseTime: 50, // 50ms
};

// Critical performance metrics
const CRITICAL_METRICS = {
  firstContentfulPaint: 1800, // 1.8s
  largestContentfulPaint: 2500, // 2.5s
  firstInputDelay: 100, // 100ms
  cumulativeLayoutShift: 0.1, // 0.1
  totalBlockingTime: 300, // 300ms
};

function analyzeBundleSize(statsPath) {
  console.log('🔍 Analyzing bundle size...');
  
  if (!fs.existsSync(statsPath)) {
    console.error('❌ Bundle stats file not found. Run build first.');
    process.exit(1);
  }

  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  const assets = stats.assets || [];
  const chunks = stats.chunks || [];
  
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let imageSize = 0;
  let fontSize = 0;
  
  const violations = [];
  const warnings = [];
  
  console.log('\n📊 Bundle Analysis Results:');
  console.log('=' .repeat(50));
  
  // Analyze individual assets
  assets.forEach(asset => {
    const size = asset.size;
    totalSize += size;
    
    if (asset.name.endsWith('.js')) {
      jsSize += size;
      
      if (size > PERFORMANCE_BUDGETS.maxChunkSize) {
        violations.push(`❌ Large JS chunk: ${asset.name} (${formatBytes(size)})`);
      }
      
      if (asset.name.includes('main') && size > PERFORMANCE_BUDGETS.maxInitialBundleSize) {
        violations.push(`❌ Large main bundle: ${asset.name} (${formatBytes(size)})`);
      }
    }
    
    if (asset.name.endsWith('.css')) {
      cssSize += size;
      
      if (size > PERFORMANCE_BUDGETS.maxCSSSize) {
        warnings.push(`⚠️  Large CSS file: ${asset.name} (${formatBytes(size)})`);
      }
    }
    
    if (asset.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      imageSize += size;
      
      if (size > PERFORMANCE_BUDGETS.maxImageSize) {
        warnings.push(`⚠️  Large image: ${asset.name} (${formatBytes(size)})`);
      }
    }
    
    if (asset.name.match(/\.(woff|woff2|ttf|eot)$/)) {
      fontSize += size;
      
      if (size > PERFORMANCE_BUDGETS.maxFontSize) {
        warnings.push(`⚠️  Large font: ${asset.name} (${formatBytes(size)})`);
      }
    }
  });
  
  // Check total bundle size
  if (totalSize > PERFORMANCE_BUDGETS.maxTotalBundleSize) {
    violations.push(`❌ Total bundle too large: ${formatBytes(totalSize)}`);
  }
  
  // Analyze chunk dependencies
  const largeDependencies = findLargeDependencies(stats);
  largeDependencies.forEach(dep => {
    if (dep.size > PERFORMANCE_BUDGETS.maxLibrarySize) {
      warnings.push(`⚠️  Large dependency: ${dep.name} (${formatBytes(dep.size)})`);
    }
  });
  
  // Display results
  console.log(`📦 Total Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`🟨 JavaScript: ${formatBytes(jsSize)} (${((jsSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`🎨 CSS: ${formatBytes(cssSize)} (${((cssSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`🖼️  Images: ${formatBytes(imageSize)} (${((imageSize / totalSize) * 100).toFixed(1)}%)`);
  console.log(`🔤 Fonts: ${formatBytes(fontSize)} (${((fontSize / totalSize) * 100).toFixed(1)}%)`);
  
  console.log('\n📈 Performance Budget Status:');
  console.log('=' .repeat(50));
  
  if (violations.length === 0 && warnings.length === 0) {
    console.log('✅ All performance budgets met!');
  } else {
    violations.forEach(violation => console.log(violation));
    warnings.forEach(warning => console.log(warning));
  }
  
  // Display largest dependencies
  if (largeDependencies.length > 0) {
    console.log('\n📚 Largest Dependencies:');
    console.log('=' .repeat(50));
    largeDependencies.slice(0, 10).forEach(dep => {
      console.log(`${dep.name}: ${formatBytes(dep.size)}`);
    });
  }
  
  // Generate recommendations
  generateOptimizationRecommendations(stats, violations, warnings);
  
  return {
    totalSize,
    jsSize,
    cssSize,
    imageSize,
    fontSize,
    violations,
    warnings,
    largeDependencies
  };
}

function findLargeDependencies(stats) {
  const modules = stats.modules || [];
  const dependencies = {};
  
  modules.forEach(module => {
    if (module.name && module.name.includes('node_modules')) {
      const match = module.name.match(/node_modules[/\\]([^/\\]+)/);
      if (match) {
        const packageName = match[1];
        if (!dependencies[packageName]) {
          dependencies[packageName] = 0;
        }
        dependencies[packageName] += module.size || 0;
      }
    }
  });
  
  return Object.entries(dependencies)
    .map(([name, size]) => ({ name, size }))
    .sort((a, b) => b.size - a.size);
}

function generateOptimizationRecommendations(stats, violations, warnings) {
  console.log('\n💡 Optimization Recommendations:');
  console.log('=' .repeat(50));
  
  const recommendations = [];
  
  // Bundle splitting recommendations
  if (violations.some(v => v.includes('Large main bundle'))) {
    recommendations.push('🔄 Implement code splitting to reduce main bundle size');
    recommendations.push('📦 Move vendor libraries to separate chunks');
  }
  
  // Dependency optimization
  const largeDeps = findLargeDependencies(stats);
  if (largeDeps.length > 0) {
    recommendations.push('📚 Consider lighter alternatives for large dependencies:');
    largeDeps.slice(0, 5).forEach(dep => {
      recommendations.push(`   - ${dep.name}: ${formatBytes(dep.size)}`);
    });
  }
  
  // Image optimization
  if (warnings.some(w => w.includes('Large image'))) {
    recommendations.push('🖼️  Optimize images: use WebP format, compress, implement lazy loading');
  }
  
  // CSS optimization
  if (warnings.some(w => w.includes('Large CSS'))) {
    recommendations.push('🎨 Optimize CSS: remove unused styles, implement critical CSS');
  }
  
  // Font optimization
  if (warnings.some(w => w.includes('Large font'))) {
    recommendations.push('🔤 Optimize fonts: use woff2 format, implement font-display: swap');
  }
  
  // Dynamic imports
  recommendations.push('⚡ Use dynamic imports for non-critical code');
  recommendations.push('🎯 Implement tree shaking to remove dead code');
  recommendations.push('📦 Enable gzip/brotli compression on server');
  
  if (recommendations.length === 0) {
    console.log('✅ Bundle is well optimized!');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Performance monitoring utilities
function measureRuntimePerformance() {
  return `
    // Runtime performance monitoring
    (function() {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('Performance:', entry.name, entry.duration + 'ms');
          
          // Send to analytics
          if (window.gtag) {
            window.gtag('event', 'timing_complete', {
              name: entry.name,
              value: Math.round(entry.duration)
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
      
      // Core Web Vitals monitoring
      if ('web-vitals' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        });
      }
    })();
  `;
}

// Export functions for use in build scripts
module.exports = {
  bundleAnalyzerConfig,
  PERFORMANCE_BUDGETS,
  CRITICAL_METRICS,
  analyzeBundleSize,
  findLargeDependencies,
  generateOptimizationRecommendations,
  formatBytes,
  measureRuntimePerformance
};

// CLI execution
if (require.main === module) {
  const statsPath = process.argv[2] || './dist/bundle-stats.json';
  analyzeBundleSize(statsPath);
}