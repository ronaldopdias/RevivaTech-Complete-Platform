'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Skeleton Loader with Shimmer Effect
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  animation = 'wave'
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-shimmer';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        bg-gray-200 ${getVariantClasses()} ${getAnimationClasses()}
        ${className}
      `}
      style={{ width, height }}
    />
  );
}

// Typewriter Loading Animation
interface TypewriterLoaderProps {
  texts: string[];
  speed?: number;
  className?: string;
}

export function TypewriterLoader({ texts, speed = 100, className = '' }: TypewriterLoaderProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentFullText.length) {
          setCurrentText(currentFullText.slice(0, currentText.length + 1));
        } else {
          // Start deleting after pause
          setTimeout(() => setIsDeleting(true), 1000);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // Move to next text
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [currentText, currentTextIndex, isDeleting, texts, speed]);

  return (
    <span className={`font-medium ${className}`}>
      {currentText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="border-r-2 border-primary-500 ml-1"
      />
    </span>
  );
}

// Device Repair Loading Animation
interface RepairLoaderProps {
  deviceType?: 'phone' | 'laptop' | 'tablet';
  message?: string;
  progress?: number;
}

export function RepairLoader({ 
  deviceType = 'phone', 
  message = 'Analyzing your device...',
  progress = 0
}: RepairLoaderProps) {
  const [animationStep, setAnimationStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'laptop':
        return 'laptop';
      case 'tablet':
        return 'tablet';
      case 'phone':
      default:
        return 'smartphone';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Device and Tools Animation */}
      <div className="relative w-32 h-32 mb-6">
        {/* Device */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: animationStep === 0 ? 1.1 : 1,
            rotate: animationStep === 1 ? 5 : 0
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Icon 
            name={getDeviceIcon()} 
            size={64} 
            className="text-primary-500"
          />
        </motion.div>

        {/* Floating Tools */}
        <motion.div
          className="absolute top-2 right-2"
          animate={{ 
            y: animationStep === 0 ? -10 : 0,
            rotate: animationStep === 0 ? 15 : 0,
            scale: animationStep === 0 ? 1.2 : 1
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Icon name="wrench" size={24} className="text-secondary-500" />
        </motion.div>

        <motion.div
          className="absolute top-2 left-2"
          animate={{ 
            y: animationStep === 1 ? -10 : 0,
            rotate: animationStep === 1 ? -15 : 0,
            scale: animationStep === 1 ? 1.2 : 1
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Icon name="settings" size={20} className="text-accent-500" />
        </motion.div>

        <motion.div
          className="absolute bottom-2 right-6"
          animate={{ 
            y: animationStep === 2 ? -10 : 0,
            rotate: animationStep === 2 ? 20 : 0,
            scale: animationStep === 2 ? 1.2 : 1
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Icon name="zap" size={18} className="text-warning-500" />
        </motion.div>

        {/* Diagnostic Scan Lines */}
        <AnimatePresence>
          {animationStep === 3 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
                animate={{ y: [0, 128] }}
                transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-400/30"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Message with Typewriter Effect */}
      <TypewriterLoader
        texts={[
          'Analyzing your device...',
          'Checking components...',
          'Calculating repair cost...',
          'Finding best technician...'
        ]}
        className="text-lg text-gray-700 mb-4"
      />

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}

// Floating Dots Loader
interface FloatingDotsProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
}

export function FloatingDots({ color = 'primary', size = 'md', count = 3 }: FloatingDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    accent: 'bg-accent-500',
    success: 'bg-success-500'
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color as keyof typeof colorClasses]} 
            rounded-full
          `}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

// Content Loading Skeleton
export function ContentSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3">
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="95%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>

      {/* Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <Skeleton width="100%" height={120} className="mb-3" />
            <Skeleton width="70%" height={20} className="mb-2" />
            <Skeleton width="50%" height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Device Model Loading Skeleton
export function DeviceModelSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.div
          key={index}
          className="p-4 border border-gray-200 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {/* Device Image Skeleton */}
          <Skeleton 
            variant="rounded" 
            width="100%" 
            height={120} 
            className="mb-3"
          />
          
          {/* Device Name */}
          <Skeleton width="80%" height={18} className="mb-2" />
          
          {/* Device Year */}
          <Skeleton width="40%" height={14} className="mb-3" />
          
          {/* Price Range */}
          <div className="flex justify-between items-center">
            <Skeleton width="50%" height={16} />
            <Skeleton width="30%" height={14} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Search Loading State
interface SearchLoaderProps {
  query: string;
}

export function SearchLoader({ query }: SearchLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="mb-4"
      >
        <Icon name="search" size={32} className="text-primary-500" />
      </motion.div>
      
      <p className="text-gray-600 text-center">
        Searching for <span className="font-medium text-primary-600">"{query}"</span>
      </p>
      
      <FloatingDots color="primary" size="sm" />
    </div>
  );
}

export default {
  Skeleton,
  TypewriterLoader,
  RepairLoader,
  FloatingDots,
  ContentSkeleton,
  DeviceModelSkeleton,
  SearchLoader
};