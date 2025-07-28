'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Confetti Component
interface ConfettiProps {
  active: boolean;
  config?: {
    angle?: number;
    spread?: number;
    startVelocity?: number;
    elementCount?: number;
    decay?: number;
  };
}

export function Confetti({ active, config = {} }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const defaultConfig = {
    angle: 90,
    spread: 45,
    startVelocity: 45,
    elementCount: 100,
    decay: 0.9,
    ...config
  };

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Confetti particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    // Create particles
    for (let i = 0; i < defaultConfig.elementCount; i++) {
      const angle = (defaultConfig.angle - defaultConfig.spread / 2) + 
                   (Math.random() * defaultConfig.spread);
      const velocity = Math.random() * defaultConfig.startVelocity;
      
      particles.push({
        x: canvas.width / 2,
        y: canvas.height,
        vx: Math.cos(angle * Math.PI / 180) * velocity,
        vy: Math.sin(angle * Math.PI / 180) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    // Animation loop
    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.5; // gravity
        particle.vx *= defaultConfig.decay;
        particle.rotation += particle.rotationSpeed;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation * Math.PI / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();

        // Remove particles that are off screen
        if (particle.y > canvas.height + 10) {
          particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, defaultConfig]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}

// Success Celebration Component
interface SuccessCelebrationProps {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  icon?: string;
  onComplete?: () => void;
  confetti?: boolean;
}

export function SuccessCelebration({ 
  isVisible, 
  title, 
  subtitle, 
  icon = 'check-circle',
  onComplete,
  confetti = true
}: SuccessCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible && confetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, confetti]);

  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Success Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full shadow-2xl">
              {/* Animated Success Icon */}
              <motion.div
                className="relative mx-auto mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  type: 'spring', 
                  damping: 12,
                  stiffness: 200 
                }}
              >
                <div className="w-20 h-20 mx-auto bg-success-100 rounded-full flex items-center justify-center relative">
                  <Icon 
                    name={icon} 
                    size={40} 
                    className="text-success-600" 
                  />
                  
                  {/* Pulse rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-success-300"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      delay: 0.5
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-success-300"
                    animate={{ 
                      scale: [1, 1.8, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      delay: 1
                    }}
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-2xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {title}
              </motion.h2>

              {/* Subtitle */}
              {subtitle && (
                <motion.p
                  className="text-gray-600 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {subtitle}
                </motion.p>
              )}

              {/* Success Details */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-center gap-2 text-sm text-success-700 bg-success-50 rounded-lg py-2 px-4">
                  <Icon name="shield-check" size={16} />
                  <span>90-Day Warranty Included</span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-primary-700 bg-primary-50 rounded-lg py-2 px-4">
                  <Icon name="clock" size={16} />
                  <span>Estimated completion in 24-48 hours</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Confetti */}
          {confetti && <Confetti active={showConfetti} />}
        </>
      )}
    </AnimatePresence>
  );
}

// Booking Completion Celebration
interface BookingCelebrationProps {
  isVisible: boolean;
  bookingId: string;
  deviceName: string;
  estimatedCompletion: string;
  onViewDashboard?: () => void;
  onClose?: () => void;
}

export function BookingCelebration({ 
  isVisible, 
  bookingId, 
  deviceName, 
  estimatedCompletion,
  onViewDashboard,
  onClose
}: BookingCelebrationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-gradient-to-br from-primary-900/90 to-secondary-900/90 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Celebration Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full shadow-2xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500" />
              </div>

              {/* Animated Success Elements */}
              <motion.div
                className="relative z-10"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Success Icon with Device */}
                <div className="relative mb-6">
                  <motion.div
                    className="w-24 h-24 mx-auto bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center relative"
                    animate={{ 
                      boxShadow: [
                        '0 0 0 0 rgba(16, 185, 129, 0.4)',
                        '0 0 0 20px rgba(16, 185, 129, 0)',
                        '0 0 0 0 rgba(16, 185, 129, 0.4)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Icon name="check" size={48} className="text-white" />
                  </motion.div>

                  {/* Floating Device Icons */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ 
                      y: [-5, 5, -5],
                      rotate: [-10, 10, -10]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                      <Icon name="smartphone" size={16} className="text-white" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute -top-2 -left-2"
                    animate={{ 
                      y: [5, -5, 5],
                      rotate: [10, -10, 10]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  >
                    <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                      <Icon name="wrench" size={12} className="text-white" />
                    </div>
                  </motion.div>
                </div>

                {/* Success Message */}
                <motion.h2
                  className="text-2xl font-bold text-gray-900 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Booking Confirmed! 🎉
                </motion.h2>

                <motion.p
                  className="text-gray-600 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Your {deviceName} repair has been scheduled
                </motion.p>

                {/* Booking Details */}
                <motion.div
                  className="space-y-4 mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Booking ID</span>
                        <p className="font-mono font-medium text-primary-600">#{bookingId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Estimated Completion</span>
                        <p className="font-medium text-gray-900">{estimatedCompletion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg text-left">
                    <Icon name="mail" className="text-primary-500" size={20} />
                    <div className="text-sm">
                      <p className="font-medium text-primary-900">Email confirmation sent</p>
                      <p className="text-primary-700">Check your inbox for details</p>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <button
                    onClick={onViewDashboard}
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 rounded-xl font-semibold transition-all hover:shadow-lg active:scale-95"
                  >
                    View Dashboard
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all hover:bg-gray-200 active:scale-95"
                  >
                    Continue Browsing
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Confetti */}
          <Confetti active={isVisible} />
        </>
      )}
    </AnimatePresence>
  );
}

// Quick Success Toast
interface SuccessToastProps {
  isVisible: boolean;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function SuccessToast({ isVisible, message, duration = 3000, onClose }: SuccessToastProps) {
  useEffect(() => {
    if (isVisible && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-white shadow-lg rounded-xl p-4 flex items-center gap-3 max-w-sm border border-success-200">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Icon name="check-circle" size={24} className="text-success-500" />
            </motion.div>
            
            <span className="text-gray-900 font-medium">{message}</span>
            
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Progress Celebration (for multi-step flows)
interface ProgressCelebrationProps {
  step: number;
  totalSteps: number;
  stepTitle: string;
}

export function ProgressCelebration({ step, totalSteps, stepTitle }: ProgressCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (step > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Icon name="check-circle" size={48} className="text-success-500 mx-auto mb-3" />
            </motion.div>
            
            <h3 className="font-bold text-lg text-gray-900 mb-1">Step {step} Complete!</h3>
            <p className="text-gray-600 text-sm">{stepTitle}</p>
            
            <div className="mt-4">
              <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-success-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{step} of {totalSteps} steps</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default {
  Confetti,
  SuccessCelebration,
  BookingCelebration,
  SuccessToast,
  ProgressCelebration
};