'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

// Mobile Card Stack Component
interface MobileCardStackProps {
  cards: Array<{
    id: string;
    content: React.ReactNode;
    color?: string;
  }>;
  onCardSwipe?: (id: string, direction: 'left' | 'right') => void;
  className?: string;
}

export function MobileCardStack({ cards, onCardSwipe, className = '' }: MobileCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentCard = cards[currentIndex];
    if (currentCard) {
      onCardSwipe?.(currentCard.id, direction);
      setSwipeDirection(direction);
      
      // Move to next card
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
        setSwipeDirection(null);
      }, 300);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  }, [cards, currentIndex, onCardSwipe]);

  return (
    <div className={`relative h-96 perspective-1000 ${className}`}>
      <AnimatePresence>
        {cards.slice(currentIndex, currentIndex + 3).map((card, index) => {
          const isActive = index === 0;
          const zIndex = cards.length - index;
          
          return (
            <motion.div
              key={card.id}
              className={`
                absolute inset-0 rounded-2xl shadow-lg cursor-grab active:cursor-grabbing
                ${card.color || 'bg-white'}
              `}
              style={{ zIndex }}
              initial={{ 
                scale: 1 - index * 0.05,
                y: index * 10,
                rotateX: index * 3
              }}
              animate={{ 
                scale: 1 - index * 0.05,
                y: index * 10,
                rotateX: index * 3
              }}
              exit={{
                x: swipeDirection === 'left' ? -500 : 500,
                rotate: swipeDirection === 'left' ? -30 : 30,
                opacity: 0,
                transition: { duration: 0.3 }
              }}
              drag={isActive ? 'x' : false}
              dragConstraints={{ left: -100, right: 100 }}
              dragElastic={0.7}
              onDragEnd={(event, info) => {
                if (!isActive) return;
                
                if (Math.abs(info.offset.x) > 100) {
                  handleSwipe(info.offset.x > 0 ? 'right' : 'left');
                }
              }}
              whileDrag={{ 
                rotate: info => info.offset.x / 10,
                scale: 1.05
              }}
            >
              {card.content}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Swipe Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-colors
              ${index === currentIndex ? 'bg-primary-500' : 'bg-gray-300'}
            `}
          />
        ))}
      </div>
    </div>
  );
}

// Mobile Progress Steps
interface MobileProgressStepsProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
  }>;
  currentStep: number;
  onStepClick?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function MobileProgressSteps({ 
  steps, 
  currentStep, 
  onStepClick,
  orientation = 'horizontal' 
}: MobileProgressStepsProps) {
  return (
    <div className={`
      flex ${orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col'} 
      gap-4 p-4
    `}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = onStepClick && index <= currentStep;

        return (
          <div
            key={step.id}
            className={`
              flex ${orientation === 'horizontal' ? 'flex-col items-center' : 'flex-row items-center gap-3'}
              ${isClickable ? 'cursor-pointer' : ''}
            `}
            onClick={() => isClickable && onStepClick(index)}
          >
            {/* Step Circle */}
            <motion.div
              className={`
                relative w-10 h-10 rounded-full flex items-center justify-center
                transition-colors duration-300
                ${isCompleted 
                  ? 'bg-success-500 text-white' 
                  : isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}
              whileTap={{ scale: isClickable ? 0.95 : 1 }}
              animate={{ 
                scale: isActive ? 1.1 : 1,
                boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.3)' : '0 0 0px transparent'
              }}
            >
              {isCompleted ? (
                <Icon name="check" size={16} />
              ) : step.icon ? (
                <Icon name={step.icon} size={16} />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}

              {/* Active Pulse */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary-500"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Step Info */}
            <div className={`
              ${orientation === 'horizontal' ? 'text-center mt-2' : 'flex-1'}
            `}>
              <h4 className={`
                text-sm font-medium transition-colors
                ${isActive ? 'text-primary-600' : isCompleted ? 'text-success-600' : 'text-gray-500'}
              `}>
                {step.title}
              </h4>
              {step.description && (
                <p className="text-xs text-gray-400 mt-1">
                  {step.description}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {orientation === 'horizontal' && index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2 transition-colors
                ${index < currentStep ? 'bg-success-500' : 'bg-gray-200'}
              `} />
            )}
            
            {orientation === 'vertical' && index < steps.length - 1 && (
              <div className={`
                w-0.5 h-8 ml-5 transition-colors
                ${index < currentStep ? 'bg-success-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Mobile Action Sheet
interface ActionSheetOption {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  options: ActionSheetOption[];
}

export function MobileActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  options 
}: MobileActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Action Sheet */}
          <motion.div
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl p-6
              shadow-2xl max-h-[80vh] overflow-y-auto
            "
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
          >
            {/* Header */}
            {(title || description) && (
              <div className="text-center mb-6">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-gray-500">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Options */}
            <div className="space-y-2">
              {options.map((option, index) => (
                <motion.button
                  key={option.id}
                  className={`
                    w-full p-4 rounded-xl flex items-center gap-3
                    transition-colors touch-manipulation
                    ${option.variant === 'destructive'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    option.action();
                    onClose();
                    
                    // Haptic feedback
                    if ('vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                  }}
                >
                  {option.icon && (
                    <Icon name={option.icon} size={20} />
                  )}
                  <span className="font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Cancel Button */}
            <motion.button
              className="
                w-full p-4 mt-4 rounded-xl
                bg-gray-100 text-gray-600 font-medium
                touch-manipulation
              "
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
            >
              Cancel
            </motion.button>

            {/* Safe Area Spacer */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Mobile Tab Switcher
interface MobileTabSwitcherProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    badge?: number;
  }>;
  defaultTab?: string;
  className?: string;
}

export function MobileTabSwitcher({ tabs, defaultTab, className = '' }: MobileTabSwitcherProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`
              relative flex-1 min-w-0 px-4 py-2 rounded-lg
              font-medium text-sm transition-colors
              touch-manipulation whitespace-nowrap
              ${activeTab === tab.id
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab(tab.id);
              
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(10);
              }
            }}
          >
            {/* Active Background */}
            {activeTab === tab.id && (
              <motion.div
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                layoutId="activeTabBg"
                transition={{ type: 'spring', damping: 30 }}
              />
            )}

            {/* Tab Content */}
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              {tab.badge && (
                <span className="
                  min-w-[18px] h-[18px] px-1 bg-accent-500 text-white
                  text-xs font-medium rounded-full
                  flex items-center justify-center
                ">
                  {tab.badge}
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tabs.map((tab) => (
          activeTab === tab.id && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {tab.content}
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
}

export default {
  MobileCardStack,
  MobileProgressSteps,
  MobileActionSheet,
  MobileTabSwitcher
};