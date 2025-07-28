'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Random Delightful Messages
const DELIGHTFUL_MESSAGES = {
  welcome: [
    "Welcome to the repair wizards! 🧙‍♂️",
    "Ready to bring your device back to life? ✨",
    "Your tech's salvation awaits! 🚀",
    "Time to work some repair magic! 🪄"
  ],
  loading: [
    "Working our magic... ✨",
    "Sprinkling some tech dust... 🌟",
    "Consulting the repair oracle... 🔮",
    "Summoning the fix fairies... 🧚‍♀️",
    "Brewing the perfect solution... ⚗️"
  ],
  success: [
    "Boom! Magic happened! 💥",
    "That was smooth as butter! 🧈",
    "Nailed it! 🎯",
    "Consider it done! ✅",
    "Mission accomplished! 🏆"
  ],
  thinking: [
    "Hmm, let me think... 🤔",
    "Processing your awesomeness... 🧠",
    "Calculating the perfect fix... 📊",
    "Consulting my repair crystal ball... 🔮"
  ]
};

// Floating Repair Tools Animation
export function FloatingRepairTools() {
  const tools = [
    { icon: 'wrench', color: 'text-primary-500', delay: 0 },
    { icon: 'settings', color: 'text-secondary-500', delay: 0.5 },
    { icon: 'zap', color: 'text-warning-500', delay: 1 },
    { icon: 'cpu', color: 'text-accent-500', delay: 1.5 },
    { icon: 'smartphone', color: 'text-success-500', delay: 2 }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {tools.map((tool, index) => (
        <motion.div
          key={tool.icon}
          className={`absolute ${tool.color}`}
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            rotate: 0,
            opacity: 0
          }}
          animate={{
            y: -50,
            rotate: 360,
            opacity: [0, 0.6, 0.6, 0],
            x: `+=${Math.random() * 200 - 100}`
          }}
          transition={{
            duration: 8,
            delay: tool.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <Icon name={tool.icon} size={24} />
        </motion.div>
      ))}
    </div>
  );
}

// Personality Message Component
interface PersonalityMessageProps {
  type: keyof typeof DELIGHTFUL_MESSAGES;
  className?: string;
  showEmoji?: boolean;
}

export function PersonalityMessage({ type, className = '', showEmoji = true }: PersonalityMessageProps) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const messages = DELIGHTFUL_MESSAGES[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
  }, [type]);

  const messageWithoutEmoji = showEmoji ? currentMessage : currentMessage.replace(/[^\w\s!?.,]/g, '').trim();

  return (
    <motion.p
      className={`text-gray-600 font-medium ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={currentMessage} // Re-trigger animation when message changes
      transition={{ type: 'spring', damping: 20 }}
    >
      {messageWithoutEmoji}
    </motion.p>
  );
}

// Brand Moments Component (special occasions)
interface BrandMomentsProps {
  children: React.ReactNode;
  occasion?: 'birthday' | 'holiday' | 'milestone' | 'celebration';
}

export function BrandMoments({ children, occasion }: BrandMomentsProps) {
  const [showSpecialEffect, setShowSpecialEffect] = useState(false);

  useEffect(() => {
    if (occasion) {
      setShowSpecialEffect(true);
      const timer = setTimeout(() => setShowSpecialEffect(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [occasion]);

  const occasionEffects = {
    birthday: {
      particles: ['🎂', '🎉', '🎈', '🎁', '✨'],
      message: "Happy Birthday from RevivaTech! 🎂"
    },
    holiday: {
      particles: ['❄️', '🎄', '⭐', '🎅', '🔔'],
      message: "Happy Holidays! 🎄"
    },
    milestone: {
      particles: ['🏆', '⭐', '🎯', '💎', '🚀'],
      message: "Milestone achieved! 🏆"
    },
    celebration: {
      particles: ['🎉', '🎊', '✨', '🌟', '💫'],
      message: "Time to celebrate! 🎉"
    }
  };

  return (
    <div className="relative">
      {children}
      
      {/* Special Occasion Effects */}
      <AnimatePresence>
        {showSpecialEffect && occasion && (
          <>
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 15 }).map((_, index) => {
                const particle = occasionEffects[occasion].particles[
                  Math.floor(Math.random() * occasionEffects[occasion].particles.length)
                ];
                
                return (
                  <motion.div
                    key={index}
                    className="absolute text-2xl"
                    initial={{
                      x: Math.random() * window.innerWidth,
                      y: window.innerHeight + 50,
                      rotate: 0,
                      scale: 0
                    }}
                    animate={{
                      y: -100,
                      rotate: Math.random() * 720 - 360,
                      scale: [0, 1, 0],
                      x: `+=${Math.random() * 200 - 100}`
                    }}
                    transition={{
                      duration: 4,
                      delay: index * 0.2,
                      ease: 'easeOut'
                    }}
                  >
                    {particle}
                  </motion.div>
                );
              })}
            </div>

            {/* Special Message */}
            <motion.div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <div className="bg-white rounded-xl shadow-lg border-2 border-primary-200 px-6 py-3">
                <p className="text-primary-600 font-semibold">
                  {occasionEffects[occasion].message}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Repair Status with Personality
interface RepairStatusPersonalityProps {
  status: 'received' | 'diagnosing' | 'repairing' | 'testing' | 'completed' | 'ready';
  deviceName: string;
  className?: string;
}

export function RepairStatusPersonality({ status, deviceName, className = '' }: RepairStatusPersonalityProps) {
  const statusPersonalities = {
    received: {
      message: `Your ${deviceName} has arrived safely! 📦`,
      subtext: "Our tech wizards are preparing their magic tools",
      emoji: "👋",
      color: "primary",
      animation: "bounce"
    },
    diagnosing: {
      message: `Playing detective with your ${deviceName} 🔍`,
      subtext: "Investigating every circuit and connection",
      emoji: "🕵️‍♂️",
      color: "secondary",
      animation: "pulse"
    },
    repairing: {
      message: `Healing your ${deviceName} with TLC ⚡`,
      subtext: "Our repair ninjas are working their magic",
      emoji: "🥷",
      color: "warning",
      animation: "wiggle"
    },
    testing: {
      message: `Your ${deviceName} is doing jumping jacks! 🏃‍♂️`,
      subtext: "Running extensive quality tests",
      emoji: "🧪",
      color: "accent",
      animation: "shake"
    },
    completed: {
      message: `Ta-da! Your ${deviceName} is reborn! ✨`,
      subtext: "Ready for pickup and good as new",
      emoji: "🎉",
      color: "success",
      animation: "celebrate"
    },
    ready: {
      message: `Your ${deviceName} is ready to come home! 🏠`,
      subtext: "Waiting for you with a smile",
      emoji: "😊",
      color: "success",
      animation: "wave"
    }
  };

  const personality = statusPersonalities[status];

  const animations = {
    bounce: {
      y: [0, -10, 0],
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
    },
    wiggle: {
      rotate: [0, -5, 5, -5, 5, 0],
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
    },
    shake: {
      x: [0, -2, 2, -2, 2, 0],
      transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
    },
    celebrate: {
      rotate: [0, 15, -15, 15, -15, 0],
      scale: [1, 1.2, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    },
    wave: {
      rotate: [0, 20, -20, 20, -20, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  return (
    <motion.div
      className={`
        bg-white rounded-2xl border border-${personality.color}-200 p-6
        shadow-lg text-center
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Animated Status Emoji */}
      <motion.div
        className="text-6xl mb-4"
        animate={animations[personality.animation as keyof typeof animations]}
      >
        {personality.emoji}
      </motion.div>

      {/* Status Message */}
      <motion.h3
        className={`text-xl font-bold text-${personality.color}-600 mb-2`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {personality.message}
      </motion.h3>

      <motion.p
        className="text-gray-600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {personality.subtext}
      </motion.p>

      {/* Progress Animation */}
      <motion.div
        className="mt-4 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-${personality.color}-400 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeOut', delay: 0.8 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Easter Egg Component (hidden delights)
interface EasterEggProps {
  trigger: 'konami' | 'click-count' | 'time-based';
  clickCount?: number;
  timeDelay?: number;
}

export function EasterEgg({ trigger, clickCount = 10, timeDelay = 30000 }: EasterEggProps) {
  const [isTriggered, setIsTriggered] = useState(false);
  const [currentClicks, setCurrentClicks] = useState(0);

  useEffect(() => {
    if (trigger === 'time-based') {
      const timer = setTimeout(() => {
        setIsTriggered(true);
      }, timeDelay);
      return () => clearTimeout(timer);
    }
  }, [trigger, timeDelay]);

  useEffect(() => {
    if (trigger === 'konami') {
      const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
      ];
      let currentSequence: string[] = [];

      const handleKeyDown = (event: KeyboardEvent) => {
        currentSequence.push(event.code);
        
        if (currentSequence.length > konamiCode.length) {
          currentSequence = currentSequence.slice(-konamiCode.length);
        }

        if (currentSequence.join(',') === konamiCode.join(',')) {
          setIsTriggered(true);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [trigger]);

  const handleClick = () => {
    if (trigger === 'click-count') {
      const newCount = currentClicks + 1;
      setCurrentClicks(newCount);
      
      if (newCount >= clickCount) {
        setIsTriggered(true);
      }
    }
  };

  return (
    <>
      {trigger === 'click-count' && (
        <div onClick={handleClick} className="cursor-pointer">
          <span className="sr-only">Easter egg trigger</span>
        </div>
      )}

      <AnimatePresence>
        {isTriggered && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Rainbow Background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)'
              }}
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
            />

            {/* Dancing RevivaTech Logo */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.5, 1],
                y: [0, -50, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="text-8xl font-bold text-white drop-shadow-lg">
                🛠️ RevivaTech 🛠️
              </div>
            </motion.div>

            {/* Floating Emojis */}
            {Array.from({ length: 20 }).map((_, index) => {
              const emojis = ['🎉', '✨', '🚀', '💫', '🌟', '🎊', '🔧', '📱', '💻'];
              const emoji = emojis[Math.floor(Math.random() * emojis.length)];
              
              return (
                <motion.div
                  key={index}
                  className="absolute text-4xl"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: window.innerHeight + 50,
                    rotate: 0
                  }}
                  animate={{
                    y: -100,
                    rotate: 360,
                    x: `+=${Math.random() * 400 - 200}`
                  }}
                  transition={{
                    duration: 3,
                    delay: index * 0.1,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  {emoji}
                </motion.div>
              );
            })}

            {/* Secret Message */}
            <motion.div
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >
              <div className="bg-black/80 text-white px-6 py-3 rounded-xl text-center">
                <p className="text-xl font-bold">🎉 You found the secret! 🎉</p>
                <p className="text-sm mt-1">Thanks for being curious! - The RevivaTech Team</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Motivational Tips Component
export function MotivationalTips() {
  const tips = [
    "💡 Pro tip: Regular cleaning can extend your device's life by 30%!",
    "🔋 Battery health tip: Avoid charging to 100% every time!",
    "🌡️ Keep it cool: High temperatures are your device's worst enemy!",
    "💧 Water damage? Turn it off immediately and bring it to us!",
    "🔄 Restart weekly: Give your device a fresh start!",
    "📱 Screen protectors: A small investment for huge savings!",
    "⚡ Original chargers: They're worth the extra cost!",
    "🧹 Clean your charging ports monthly with a dry brush!"
  ];

  const [currentTip, setCurrentTip] = useState(tips[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 10000); // Change tip every 10 seconds

    return () => clearInterval(interval);
  }, [tips]);

  return (
    <motion.div
      className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl p-4 mb-6"
      key={currentTip}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon name="lightbulb" className="text-primary-500 mt-0.5" size={20} />
        </motion.div>
        <p className="text-primary-700 font-medium">{currentTip}</p>
      </div>
    </motion.div>
  );
}

export default {
  FloatingRepairTools,
  PersonalityMessage,
  BrandMoments,
  RepairStatusPersonality,
  EasterEgg,
  MotivationalTips
};