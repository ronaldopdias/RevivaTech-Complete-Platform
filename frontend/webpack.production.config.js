/**
 * Production Webpack Configuration for Console Log Stripping
 * Removes console.log statements during build process for production
 * Works alongside runtime console optimizer for complete console management
 */

const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  
  // Production optimizations
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            // Remove console statements in production builds
            drop_console: true,
            drop_debugger: true,
            // Keep console.error and console.warn for critical issues
            pure_funcs: [
              'console.log',
              'console.info', 
              'console.debug',
              'console.trace',
              'console.time',
              'console.timeEnd',
              'console.group',
              'console.groupCollapsed',
              'console.groupEnd',
              'console.count',
              'console.table'
            ],
          },
          mangle: {
            // Mangle function names except for error reporting
            keep_fnames: /error|Error/,
          },
        },
        // Extract comments to separate file
        extractComments: false,
      }),
    ],
  },

  // Webpack plugins for additional console management
  plugins: [
    // Define environment variables for console management
    new webpack.DefinePlugin({
      'process.env.STRIP_CONSOLE_LOGS': JSON.stringify(true),
      'process.env.ENABLE_DEBUG_MODE': JSON.stringify(false),
      'process.env.ENABLE_PII_REDACTION': JSON.stringify(true),
    }),
    
    // Custom plugin to remove console statements that Terser might miss
    new ConsoleStripperPlugin(),
  ],

  // Module rules for additional processing
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                // Babel plugin to remove console statements
                process.env.NODE_ENV === 'production' && [
                  'transform-remove-console',
                  {
                    // Keep console.error and console.warn
                    exclude: ['error', 'warn']
                  }
                ]
              ].filter(Boolean),
            },
          },
        ],
      },
    ],
  },
};

/**
 * Custom Webpack Plugin to strip console statements
 * Acts as a fallback for any console statements that escape Terser
 */
class ConsoleStripperPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('ConsoleStripperPlugin', (compilation, callback) => {
      // Process each asset
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.js') && !filename.includes('.min.')) {
          const asset = compilation.assets[filename];
          let source = asset.source();
          
          if (typeof source === 'string') {
            // Remove console statements (except error and warn)
            const consoleRegex = /console\.(log|info|debug|trace|time|timeEnd|group|groupCollapsed|groupEnd|count|table)\s*\([^)]*\);?/g;
            
            const originalSize = source.length;
            source = source.replace(consoleRegex, '');
            const newSize = source.length;
            
            if (originalSize !== newSize) {
              compilation.assets[filename] = {
                source: () => source,
                size: () => source.length
              };
              
              console.log(`Console statements stripped from ${filename}: ${originalSize - newSize} bytes removed`);
            }
          }
        }
      });
      
      callback();
    });
  }
}

// Export configuration
module.exports.ConsoleStripperPlugin = ConsoleStripperPlugin;