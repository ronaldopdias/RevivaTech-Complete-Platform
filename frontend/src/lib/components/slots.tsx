// Slot composition utilities for RevivaTech components
import React from 'react';
import { SlotDefinition } from '@/types/config';

// Types for slot system
export interface SlotProps {
  name: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export interface SlotContextValue {
  slots: Record<string, React.ReactNode>;
  setSlot: (name: string, content: React.ReactNode) => void;
  removeSlot: (name: string) => void;
}

// Slot context for component composition
export const SlotContext = React.createContext<SlotContextValue | null>(null);

// Slot provider component
export interface SlotProviderProps {
  children: React.ReactNode;
  initialSlots?: Record<string, React.ReactNode>;
}

export const SlotProvider: React.FC<SlotProviderProps> = ({ 
  children, 
  initialSlots = {} 
}) => {
  const [slots, setSlots] = React.useState<Record<string, React.ReactNode>>(initialSlots);

  const setSlot = React.useCallback((name: string, content: React.ReactNode) => {
    setSlots(prev => ({ ...prev, [name]: content }));
  }, []);

  const removeSlot = React.useCallback((name: string) => {
    setSlots(prev => {
      const newSlots = { ...prev };
      delete newSlots[name];
      return newSlots;
    });
  }, []);

  const value = React.useMemo(() => ({
    slots,
    setSlot,
    removeSlot,
  }), [slots, setSlot, removeSlot]);

  return (
    <SlotContext.Provider value={value}>
      {children}
    </SlotContext.Provider>
  );
};

// Hook to use slot context
export const useSlotContext = (): SlotContextValue => {
  const context = React.useContext(SlotContext);
  if (!context) {
    throw new Error('useSlotContext must be used within a SlotProvider');
  }
  return context;
};

// Slot component for rendering slot content
export const Slot: React.FC<SlotProps> = ({ 
  name, 
  children, 
  fallback,
  className 
}) => {
  const context = React.useContext(SlotContext);
  
  // If no context, render children or fallback
  if (!context) {
    return (
      <div className={className}>
        {children || fallback}
      </div>
    );
  }

  const slotContent = context.slots[name];
  
  return (
    <div className={className}>
      {slotContent || children || fallback}
    </div>
  );
};

// Hook to set slot content
export const useSlot = (name: string, content: React.ReactNode) => {
  const { setSlot, removeSlot } = useSlotContext();
  
  React.useEffect(() => {
    setSlot(name, content);
    return () => removeSlot(name);
  }, [name, content, setSlot, removeSlot]);
};

// Utility to validate slot configuration
export const validateSlots = (
  slotDefinitions: Record<string, SlotDefinition>,
  providedSlots: Record<string, React.ReactNode>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required slots
  Object.entries(slotDefinitions).forEach(([slotName, definition]) => {
    if (definition.required && !providedSlots[slotName]) {
      errors.push(`Required slot '${slotName}' is missing`);
    }
  });
  
  // Check unknown slots
  Object.keys(providedSlots).forEach(slotName => {
    if (!slotDefinitions[slotName]) {
      errors.push(`Unknown slot '${slotName}' provided`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Utility to merge slot props with default props
export const mergeSlotProps = (
  baseProps: Record<string, any>,
  slotProps: Record<string, any> = {}
): Record<string, any> => {
  return {
    ...baseProps,
    ...slotProps,
    className: [baseProps.className, slotProps.className]
      .filter(Boolean)
      .join(' ')
  };
};

// Higher-order component to add slot support to components
export interface WithSlotsProps {
  slots?: Record<string, React.ReactNode>;
  slotProps?: Record<string, Record<string, any>>;
}

export const withSlots = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  slotDefinitions: Record<string, SlotDefinition> = {}
) => {
  const WrappedComponent = React.forwardRef<any, P & WithSlotsProps>(
    ({ slots = {}, slotProps = {}, ...props }, ref) => {
      // Validate slots if definitions provided
      if (Object.keys(slotDefinitions).length > 0) {
        const validation = validateSlots(slotDefinitions, slots);
        if (!validation.valid && process.env.NODE_ENV === 'development') {
          console.warn('Slot validation errors:', validation.errors);
        }
      }

      return (
        <SlotProvider initialSlots={slots}>
          <Component ref={ref} {...(props as unknown as P)} />
        </SlotProvider>
      );
    }
  );

  WrappedComponent.displayName = `withSlots(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Slot-aware component factory
export interface SlotComponentProps<T = Record<string, any>> {
  config?: {
    slots?: Record<string, SlotDefinition>;
  };
  slots?: Record<string, React.ReactNode>;
  slotProps?: Record<string, Record<string, any>>;
  children?: React.ReactNode;
  render?: (slots: Record<string, React.ReactNode>) => React.ReactNode;
}

export const createSlotComponent = <T extends Record<string, any>>(
  name: string,
  slotDefinitions: Record<string, SlotDefinition> = {}
) => {
  const SlotComponent: React.FC<SlotComponentProps<T> & T> = ({
    config,
    slots = {},
    slotProps = {},
    children,
    render,
    ...props
  }) => {
    const actualSlotDefinitions = config?.slots || slotDefinitions;
    
    // Validate slots
    const validation = validateSlots(actualSlotDefinitions, slots);
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      console.warn(`${name} slot validation errors:`, validation.errors);
    }

    return (
      <SlotProvider initialSlots={slots}>
        {render ? (
          render(slots)
        ) : (
          children
        )}
      </SlotProvider>
    );
  };

  SlotComponent.displayName = `SlotComponent(${name})`;
  
  return SlotComponent;
};

// Export types
export type { SlotDefinition };