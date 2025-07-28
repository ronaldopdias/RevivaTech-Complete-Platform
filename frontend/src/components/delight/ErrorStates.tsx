'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Delightful Error Message Component
interface DelightfulErrorProps {
  title: string;
  message: string;
  type?: 'connection' | 'validation' | 'server' | 'not-found' | 'camera' | 'payment';
  onRetry?: () => void;
  onClose?: () => void;
  suggestions?: string[];
  className?: string;
}

export function DelightfulError({ 
  title, 
  message, 
  type = 'server',
  onRetry,
  onClose,
  suggestions = [],
  className = ''
}: DelightfulErrorProps) {
  const [isVisible, setIsVisible] = useState(true);

  const errorConfig = {
    connection: {
      icon: 'wifi-off',
      color: 'warning',
      illustration: '📶',
      animation: 'bounce'
    },
    validation: {
      icon: 'alert-circle',
      color: 'danger',
      illustration: '⚠️',
      animation: 'shake'
    },
    server: {
      icon: 'server',
      color: 'danger',
      illustration: '🔧',
      animation: 'pulse'
    },
    'not-found': {
      icon: 'search',
      color: 'neutral',
      illustration: '🔍',
      animation: 'float'
    },
    camera: {
      icon: 'camera-off',
      color: 'warning',
      illustration: '📷',
      animation: 'swing'
    },
    payment: {
      icon: 'credit-card',
      color: 'danger',
      illustration: '💳',
      animation: 'bounce'
    }
  };

  const config = errorConfig[type];

  const animations = {
    bounce: {
      y: [0, -10, 0],
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
    },
    shake: {
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
    },
    float: {
      y: [0, -8, 0],
      rotate: [0, 5, -5, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    },
    swing: {
      rotate: [0, 10, -10, 5, -5, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className={`
        bg-white rounded-2xl border-2 border-${config.color}-200 p-6
        shadow-lg max-w-md mx-auto text-center
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Animated Error Icon */}
      <motion.div
        className="mb-4"
        animate={animations[config.animation as keyof typeof animations]}
      >
        <div className={`
          w-16 h-16 mx-auto bg-${config.color}-100 rounded-full 
          flex items-center justify-center mb-2
        `}>
          <Icon 
            name={config.icon} 
            size={32} 
            className={`text-${config.color}-500`}
          />
        </div>
        <div className="text-3xl">{config.illustration}</div>
      </motion.div>

      {/* Error Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            className="mb-4 text-left"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="font-medium text-gray-800 mb-2">Try these solutions:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Icon name="check" size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {onRetry && (
            <button
              onClick={onRetry}
              className={`
                px-6 py-2 bg-${config.color}-500 text-white rounded-lg
                font-medium hover:bg-${config.color}-600 transition-colors
                flex items-center gap-2
              `}
            >
              <Icon name="refresh-cw" size={16} />
              Try Again
            </button>
          )}
          
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Dismiss
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Form Validation Error with Animation
interface FormErrorProps {
  field: string;
  message: string;
  isVisible: boolean;
  type?: 'required' | 'format' | 'length' | 'match';
}

export function FormError({ field, message, isVisible, type = 'required' }: FormErrorProps) {
  const icons = {
    required: 'alert-circle',
    format: 'mail',
    length: 'type',
    match: 'shield-x'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="flex items-center gap-2 mt-1 text-danger-600"
          initial={{ opacity: 0, y: -10, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            x: [0, -2, 2, -2, 2, 0] // Shake animation
          }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ 
            type: 'spring', 
            damping: 15,
            x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
          }}
        >
          <Icon name={icons[type]} size={14} className="flex-shrink-0" />
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 404 Error Page Component
interface NotFoundErrorProps {
  onGoHome?: () => void;
  onGoBack?: () => void;
  customMessage?: string;
}

export function NotFoundError({ onGoHome, onGoBack, customMessage }: NotFoundErrorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Animated 404 */}
        <motion.div
          className="text-9xl font-bold text-gray-300 mb-4"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.div>

        {/* Floating Elements */}
        <div className="relative mb-8">
          <motion.div
            className="text-6xl"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🔍
          </motion.div>
          
          <motion.div
            className="absolute -top-4 -right-8 text-2xl"
            animate={{
              y: [0, -15, 0],
              x: [0, 5, 0]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 0.5 
            }}
          >
            ❓
          </motion.div>
          
          <motion.div
            className="absolute -bottom-2 -left-6 text-xl"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3.5, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 1 
            }}
          >
            🤔
          </motion.div>
        </div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            {customMessage || "Oops! The page you're looking for seems to have vanished into the digital void."}
          </p>
        </motion.div>

        {/* Quick Search */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search for repairs, devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Icon name="search" size={20} className="text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="home" size={16} />
              Go Home
            </button>
          )}
          
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="arrow-left" size={16} />
              Go Back
            </button>
          )}
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          className="mt-8 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>Popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <a href="/services" className="hover:text-primary-500 transition-colors">Services</a>
            <a href="/book-repair" className="hover:text-primary-500 transition-colors">Book Repair</a>
            <a href="/contact" className="hover:text-primary-500 transition-colors">Contact</a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Connection Error with Retry Animation
interface ConnectionErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ConnectionError({ onRetry, isRetrying = false }: ConnectionErrorProps) {
  return (
    <motion.div
      className="text-center p-8"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Animated WiFi Icon */}
      <motion.div
        className="mb-6"
        animate={{
          opacity: [0.3, 1, 0.3],
          scale: [0.8, 1, 0.8]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-20 h-20 mx-auto bg-warning-100 rounded-full flex items-center justify-center">
          <Icon name="wifi-off" size={40} className="text-warning-500" />
        </div>
      </motion.div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Lost</h3>
      <p className="text-gray-600 mb-6">
        Checking your internet connection and trying to reconnect...
      </p>

      {/* Retry Button */}
      <motion.button
        onClick={onRetry}
        disabled={isRetrying}
        className={`
          px-6 py-3 rounded-xl font-semibold transition-all
          ${isRetrying 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-warning-500 text-white hover:bg-warning-600'
          }
        `}
        whileHover={!isRetrying ? { scale: 1.05 } : {}}
        whileTap={!isRetrying ? { scale: 0.95 } : {}}
      >
        {isRetrying ? (
          <motion.div
            className="flex items-center gap-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Icon name="loader" size={16} />
            Reconnecting...
          </motion.div>
        ) : (
          <div className="flex items-center gap-2">
            <Icon name="refresh-cw" size={16} />
            Try Again
          </div>
        )}
      </motion.button>

      {/* Connection Tips */}
      <motion.div
        className="mt-6 text-sm text-gray-500 text-left max-w-xs mx-auto"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 2 }}
      >
        <p className="font-medium mb-2">Connection tips:</p>
        <ul className="space-y-1">
          <li>• Check your WiFi or mobile data</li>
          <li>• Move closer to your router</li>
          <li>• Restart your router if needed</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}

// Validation Error Toast
interface ValidationToastProps {
  errors: string[];
  isVisible: boolean;
  onClose: () => void;
}

export function ValidationToast({ errors, isVisible, onClose }: ValidationToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-danger-200 p-4">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon name="alert-triangle" size={20} className="text-danger-500 flex-shrink-0 mt-0.5" />
              </motion.div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Please fix these errors:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {errors.map((error, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      • {error}
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default {
  DelightfulError,
  FormError,
  NotFoundError,
  ConnectionError,
  ValidationToast
};