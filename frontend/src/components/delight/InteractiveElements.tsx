'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Magnetic Button Component
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MagneticButton({ 
  children, 
  className = '', 
  onClick, 
  strength = 0.3,
  variant = 'primary',
  size = 'md'
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (event.clientX - centerX) * strength;
    const deltaY = (event.clientY - centerY) * strength;
    
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-semibold transition-all duration-300 ease-out
        relative overflow-hidden transform-gpu
        ${className}
      `}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      animate={{ 
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isHovered ? 1 : 0,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

// Glow Button with Animated Border
interface GlowButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  animated?: boolean;
}

export function GlowButton({ 
  children, 
  className = '', 
  onClick,
  glowColor = 'primary',
  animated = true
}: GlowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const glowColors = {
    primary: 'from-primary-500 to-secondary-500',
    accent: 'from-accent-500 to-pink-500',
    success: 'from-success-500 to-emerald-500',
    warning: 'from-warning-500 to-orange-500'
  };

  return (
    <motion.div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Border */}
      <motion.div
        className={`
          absolute -inset-0.5 bg-gradient-to-r ${glowColors[glowColor as keyof typeof glowColors]}
          rounded-xl blur-sm opacity-75 group-hover:opacity-100
          ${animated ? 'animate-pulse' : ''}
        `}
        animate={{
          scale: isHovered ? 1.05 : 1,
          opacity: isHovered ? 1 : 0.75
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Button */}
      <motion.button
        className={`
          relative px-6 py-3 bg-white text-gray-900 rounded-xl
          font-semibold transition-all duration-300
          ${className}
        `}
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}

// Floating Card with 3D Tilt
interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
  floatStrength?: number;
}

export function FloatingCard({ 
  children, 
  className = '', 
  tiltStrength = 10,
  floatStrength = 5
}: FloatingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotY = ((event.clientX - centerX) / (rect.width / 2)) * tiltStrength;
    const rotX = ((event.clientY - centerY) / (rect.height / 2)) * -tiltStrength;
    
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`
        bg-white rounded-2xl shadow-lg border border-gray-100
        transform-gpu perspective-1000
        ${className}
      `}
      style={{
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        y: isHovered ? -floatStrength : 0,
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0, 0, 0, 0.1)' 
          : '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ transform: 'translateZ(20px)' }}
        className="relative z-10"
      >
        {children}
      </motion.div>
      
      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/40 to-white/0 rounded-2xl opacity-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `linear-gradient(
            ${rotateY + 90}deg,
            transparent 30%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 70%
          )`
        }}
      />
    </motion.div>
  );
}

// Animated Icon Button
interface AnimatedIconButtonProps {
  icon: string;
  onClick?: () => void;
  className?: string;
  variant?: 'pulse' | 'bounce' | 'rotate' | 'scale' | 'swing';
  color?: string;
  size?: number;
}

export function AnimatedIconButton({ 
  icon, 
  onClick, 
  className = '',
  variant = 'scale',
  color = 'primary',
  size = 24
}: AnimatedIconButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const animations = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1]
    },
    bounce: {
      y: [0, -10, 0],
      scale: [1, 1.1, 1]
    },
    rotate: {
      rotate: [0, 360],
      scale: [1, 1.1, 1]
    },
    scale: {
      scale: [1, 1.3, 1]
    },
    swing: {
      rotate: [0, 15, -15, 10, -10, 0],
      scale: [1, 1.1, 1]
    }
  };

  const handleClick = () => {
    setIsClicked(true);
    onClick?.();
    setTimeout(() => setIsClicked(false), 600);
  };

  return (
    <motion.button
      className={`
        p-3 rounded-full bg-white shadow-lg border border-gray-100
        hover:shadow-xl transition-shadow duration-300
        ${className}
      `}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={isClicked ? animations[variant] : {}}
        transition={{ 
          duration: 0.6, 
          ease: 'easeInOut',
          times: variant === 'swing' ? [0, 0.2, 0.4, 0.6, 0.8, 1] : undefined
        }}
      >
        <Icon 
          name={icon} 
          size={size} 
          className={`text-${color}-500`}
        />
      </motion.div>
    </motion.button>
  );
}

// Ripple Effect Component
interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export function RippleEffect({ 
  children, 
  color = 'rgba(99, 102, 241, 0.3)',
  duration = 600,
  className = ''
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
  }>>([]);

  const addRipple = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple = {
      id: Date.now(),
      x: x - size / 2,
      y: y - size / 2,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseDown={addRipple}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// Morphing Button (changes shape on hover)
interface MorphingButtonProps {
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MorphingButton({ 
  children, 
  expandedContent, 
  className = '',
  onClick
}: MorphingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.button
      className={`
        bg-gradient-to-r from-primary-500 to-secondary-500 text-white
        rounded-full font-semibold overflow-hidden
        ${className}
      `}
      layout
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <motion.div
        className="flex items-center justify-center px-6 py-3"
        layout
      >
        {isExpanded && expandedContent ? (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2"
          >
            {expandedContent}
          </motion.div>
        ) : (
          children
        )}
      </motion.div>
    </motion.button>
  );
}

// Interactive Device Card with Hover Effects
interface InteractiveDeviceCardProps {
  device: {
    name: string;
    image: string;
    price: string;
    features: string[];
  };
  onClick?: () => void;
  className?: string;
}

export function InteractiveDeviceCard({ device, onClick, className = '' }: InteractiveDeviceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    if (isHovered) {
      controls.start({
        y: [0, -5, 0],
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
      });
    } else {
      controls.stop();
      controls.set({ y: 0 });
    }
  }, [isHovered, controls]);

  return (
    <motion.div
      className={`
        bg-white rounded-2xl border border-gray-200 overflow-hidden
        cursor-pointer group
        ${className}
      `}
      whileHover={{ 
        scale: 1.03,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Device Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <motion.img
          src={device.image}
          alt={device.name}
          className="w-full h-full object-contain p-6"
          animate={controls}
        />
        
        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Quick Action Button */}
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0
          }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Icon name="arrow-right" size={16} className="text-primary-500" />
          </div>
        </motion.div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        <motion.h3
          className="text-lg font-semibold text-gray-900 mb-2"
          animate={{ color: isHovered ? '#6366f1' : '#111827' }}
        >
          {device.name}
        </motion.h3>

        <div className="space-y-3">
          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {device.features.slice(0, 2).map((feature, index) => (
              <motion.span
                key={feature}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0.7,
                  x: 0
                }}
                transition={{ delay: index * 0.1 }}
              >
                {feature}
              </motion.span>
            ))}
          </div>

          {/* Price */}
          <motion.div
            className="flex items-center justify-between"
            animate={{ y: isHovered ? -2 : 0 }}
          >
            <span className="text-sm text-gray-500">Starting from</span>
            <span className="text-xl font-bold text-primary-600">{device.price}</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default {
  MagneticButton,
  GlowButton,
  FloatingCard,
  AnimatedIconButton,
  RippleEffect,
  MorphingButton,
  InteractiveDeviceCard
};