/**
 * Design System V2 - Enhanced Modal Component
 * Advanced modal component with comprehensive design tokens and animations
 */

import React, { forwardRef, HTMLAttributes, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from '../Button/Button';

// Modal variants using design tokens
const modalVariants = cva(
  [
    // Base styles
    'relative flex flex-col',
    'bg-white border border-gray-200',
    'shadow-2xl',
    'max-h-[90vh] max-w-[90vw]',
    'overflow-hidden',
    'transform transition-all duration-300 ease-out',
  ],
  {
    variants: {
      size: {
        xs: 'w-full max-w-xs',
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-xl',
        '2xl': 'w-full max-w-2xl',
        '3xl': 'w-full max-w-3xl',
        '4xl': 'w-full max-w-4xl',
        '5xl': 'w-full max-w-5xl',
        '6xl': 'w-full max-w-6xl',
        '7xl': 'w-full max-w-7xl',
        full: 'w-full h-full max-w-none max-h-none',
      },
      
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
      },
      
      variant: {
        default: 'bg-white border-gray-200',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-yellow-50 border-yellow-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
      },
      
      animation: {
        none: '',
        fade: 'animate-fadeIn',
        slideUp: 'animate-slideUp',
        slideDown: 'animate-slideDown',
        scale: 'animate-scaleIn',
        bounce: 'animate-bounce',
      },
      
      centered: {
        true: 'my-auto',
        false: 'mt-16 mb-8',
      },
    },
    
    defaultVariants: {
      size: 'md',
      radius: 'lg',
      variant: 'default',
      animation: 'scale',
      centered: true,
    },
  }
);

// Backdrop variants
const backdropVariants = cva(
  [
    'fixed inset-0 z-50',
    'flex items-center justify-center',
    'p-4 sm:p-6 lg:p-8',
    'transition-all duration-300 ease-out',
  ],
  {
    variants: {
      blur: {
        none: 'bg-black/50',
        sm: 'bg-black/50 backdrop-blur-sm',
        md: 'bg-black/50 backdrop-blur-md',
        lg: 'bg-black/50 backdrop-blur-lg',
      },
      
      animation: {
        none: '',
        fade: 'animate-fadeIn',
      },
    },
    
    defaultVariants: {
      blur: 'md',
      animation: 'fade',
    },
  }
);

// Modal component props
export interface ModalProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof modalVariants> {
  
  // Visibility props
  isOpen: boolean;
  onClose: () => void;
  
  // Content props
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  
  // Header props
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  
  // Footer props
  footer?: React.ReactNode;
  
  // Behavior props
  closeOnOverlayClick?: boolean;
  closeOnEscapeKey?: boolean;
  preventScrollLock?: boolean;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  
  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  backdropClassName?: string;
  
  // Backdrop props
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg';
  backdropAnimation?: 'none' | 'fade';
}

// Modal header component
const ModalHeader = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  onClose?: () => void;
  className?: string;
}>(({ 
  children, 
  title, 
  description, 
  variant = 'default', 
  showCloseButton = true, 
  closeButtonLabel = 'Close',
  onClose,
  className,
  ...props 
}, ref) => {
  const icons = {
    default: null,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };
  
  const iconColors = {
    default: '',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };
  
  const Icon = icons[variant];
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between',
        'px-6 py-4',
        'border-b border-gray-200',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 flex-1">
        {Icon && (
          <Icon className={cn('h-6 w-6 mt-0.5 flex-shrink-0', iconColors[variant])} />
        )}
        
        <div className="flex-1">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
      
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex-shrink-0 ml-3"
          aria-label={closeButtonLabel}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

ModalHeader.displayName = 'ModalHeader';

// Modal content component
const ModalContent = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  className?: string;
}>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex-1 overflow-y-auto',
      'px-6 py-4',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

ModalContent.displayName = 'ModalContent';

// Modal footer component
const ModalFooter = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  className?: string;
}>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-2',
      'px-6 py-4',
      'border-t border-gray-200',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

ModalFooter.displayName = 'ModalFooter';

// Hook for handling escape key
const useEscapeKey = (callback: () => void, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, enabled]);
};

// Hook for handling body scroll lock
const useScrollLock = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [enabled]);
};

// Hook for focus management
const useFocusManagement = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);
  
  return modalRef;
};

// Main Modal component
const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      title,
      description,
      showCloseButton = true,
      closeButtonLabel = 'Close',
      footer,
      closeOnOverlayClick = true,
      closeOnEscapeKey = true,
      preventScrollLock = false,
      size,
      radius,
      variant,
      animation,
      centered,
      className,
      contentClassName,
      headerClassName,
      footerClassName,
      backdropClassName,
      backdropBlur,
      backdropAnimation,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    const modalRef = useFocusManagement(isOpen);
    
    // Handle escape key
    useEscapeKey(onClose, closeOnEscapeKey);
    
    // Handle scroll lock
    useScrollLock(isOpen && !preventScrollLock);
    
    // Handle overlay click
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    };
    
    // Don't render if not open
    if (!isOpen) return null;
    
    const modalContent = (
      <div
        className={cn(
          backdropVariants({
            blur: backdropBlur,
            animation: backdropAnimation,
          }),
          backdropClassName
        )}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
      >
        <div
          ref={modalRef}
          className={cn(
            modalVariants({
              size,
              radius,
              variant,
              animation,
              centered,
            }),
            className
          )}
          {...props}
        >
          {/* Header */}
          {(title || description) && (
            <ModalHeader
              title={title}
              description={description}
              variant={variant}
              showCloseButton={showCloseButton}
              closeButtonLabel={closeButtonLabel}
              onClose={onClose}
              className={headerClassName}
            />
          )}
          
          {/* Content */}
          <ModalContent className={contentClassName}>
            {children}
          </ModalContent>
          
          {/* Footer */}
          {footer && (
            <ModalFooter className={footerClassName}>
              {footer}
            </ModalFooter>
          )}
        </div>
      </div>
    );
    
    // Render in portal
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

// Confirmation modal component
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  ...props
}: Omit<ModalProps, 'children' | 'footer'> & {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };
  
  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant === 'error' ? 'danger' : 'primary'}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      footer={footer}
      size="sm"
      {...props}
    />
  );
};

// Alert modal component
export const AlertModal = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  buttonText = 'OK',
  ...props
}: Omit<ModalProps, 'children' | 'footer'> & {
  buttonText?: string;
}) => {
  const footer = (
    <Button
      variant="primary"
      onClick={onClose}
    >
      {buttonText}
    </Button>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      footer={footer}
      size="sm"
      {...props}
    />
  );
};

// Modal hook for easier state management
export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(!isOpen);
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

// Export all components
export { Modal, ModalHeader, ModalContent, ModalFooter, ConfirmationModal, AlertModal, useModal, modalVariants };
export type { ModalProps };
export default Modal;