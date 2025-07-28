import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'temporary' | 'permanent';
  width?: number;
  position?: 'left' | 'right';
}

export function Drawer({
  isOpen,
  onClose,
  children,
  className,
  variant = 'temporary',
  width = 260,
  position = 'left'
}: DrawerProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && variant === 'temporary') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, variant]);

  if (variant === 'permanent') {
    return (
      <div
        className={cn(
          'h-full bg-white border-r border-gray-200 shadow-lg',
          className
        )}
        style={{ width }}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out',
          position === 'left' ? 'left-0' : 'right-0',
          isOpen 
            ? 'translate-x-0' 
            : position === 'left' 
              ? '-translate-x-full' 
              : 'translate-x-full',
          className
        )}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 transition-colors md:hidden"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </div>
    </>
  );
}

export default Drawer;