import React, { useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, X, Search, Loader2 } from 'lucide-react';
import { Slot, SlotProvider, WithSlotsProps } from '@/lib/components/slots';
import SelectConfig from '../../../config/components/Select/config';

// Select variants
const selectVariants = cva(
  "relative w-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-input bg-background hover:bg-accent/5",
        filled: "border-0 bg-muted hover:bg-muted/80",
        outlined: "border-2 border-input bg-background hover:border-primary/50",
        underlined: "border-0 border-b-2 border-input bg-transparent hover:border-primary/50",
        ghost: "border-0 bg-transparent hover:bg-accent",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
        xl: "h-14 px-4 text-lg",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
        success: "border-green-500 focus-visible:ring-green-500",
        info: "border-blue-500 focus-visible:ring-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "md",
      state: "default",
    },
  }
);

// Option interface
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: React.ComponentType<any>;
  disabled?: boolean;
  group?: string;
}

// Props interface
export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof selectVariants>,
    WithSlotsProps {
  options: SelectOption[];
  value?: string | number | (string | number)[];
  placeholder?: string;
  label?: string;
  description?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  maxSelections?: number;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
  name?: string;
  ariaLabel?: string;
  composition?: 'slots' | 'props';
  onChange?: (value: string | number | (string | number)[] | null) => void;
  onSearch?: (query: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onClear?: () => void;
}

// Main Select component
export const Select: React.FC<SelectProps> = ({
  variant,
  size,
  rounded,
  state,
  options,
  value,
  placeholder = 'Select an option...',
  label,
  description,
  errorMessage,
  required = false,
  disabled = false,
  loading = false,
  searchable = false,
  clearable = false,
  multiple = false,
  maxSelections,
  searchPlaceholder = 'Search options...',
  noOptionsMessage = 'No options found',
  name,
  className,
  ariaLabel,
  composition = 'props',
  onChange,
  onSearch,
  onOpen,
  onClose,
  onClear,
  slots = {},
  slotProps = {},
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const initialValues = (): (string | number)[] => {
    if (multiple) {
      if (Array.isArray(value)) {
        return value;
      }
      return value !== undefined && value !== null ? [value] : [];
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? [value[0]] : [];
    }
    return value !== undefined && value !== null ? [value] : [];
  };
  
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>(initialValues);

  const selectRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Determine actual state
  const actualState = errorMessage ? 'error' : state;

  // Filter options based on search (with safe fallback)
  const safeOptions = options || [];
  const filteredOptions = searchable
    ? safeOptions.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : safeOptions;

  // Group options
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const group = option.group || 'default';
    if (!groups[group]) groups[group] = [];
    groups[group].push(option);
    return groups;
  }, {} as Record<string, SelectOption[]>);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle open
  const handleOpen = () => {
    if (disabled || loading) return;
    setIsOpen(true);
    onOpen?.();
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    onClose?.();
  };

  // Handle toggle
  const handleToggle = () => {
    isOpen ? handleClose() : handleOpen();
  };

  // Handle option select
  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    let newValue: string | number | (string | number)[] | null;

    if (multiple) {
      const isSelected = selectedValues.includes(option.value);
      let newSelectedValues: (string | number)[];

      if (isSelected) {
        newSelectedValues = selectedValues.filter(v => v !== option.value);
      } else {
        if (maxSelections && selectedValues.length >= maxSelections) {
          return; // Don't add if at max
        }
        newSelectedValues = [...selectedValues, option.value];
      }

      setSelectedValues(newSelectedValues);
      newValue = newSelectedValues;
    } else {
      setSelectedValues([option.value]);
      newValue = option.value;
      handleClose();
    }

    onChange?.(newValue);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValues([]);
    onChange?.(multiple ? [] : null);
    onClear?.();
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Get display value
  const getDisplayValue = () => {
    if (selectedValues.length === 0) return placeholder;

    // Safety check for options array
    if (!options || !Array.isArray(options)) return placeholder;

    if (multiple) {
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option?.label || placeholder;
      }
      return `${selectedValues.length} selected`;
    }

    const option = options.find(opt => opt.value === selectedValues[0]);
    return option?.label || placeholder;
  };

  // Generate IDs
  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = label ? `${selectId}-label` : undefined;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const errorId = errorMessage ? `${selectId}-error` : undefined;

  if (composition === 'slots') {
    return (
      <SlotProvider initialSlots={slots}>
        <div className="space-y-2">
          {/* Label slot */}
          <Slot 
            name="label"
            fallback={
              label ? (
                <label 
                  id={labelId}
                  htmlFor={selectId}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </label>
              ) : null
            }
          />

          {/* Select trigger slot */}
          <div ref={selectRef} className="relative">
            <Slot 
              name="trigger"
              fallback={
                <button
                  type="button"
                  id={selectId}
                  className={cn(
                    selectVariants({ variant, size, rounded, state: actualState }),
                    "flex items-center justify-between",
                    className
                  )}
                  onClick={handleToggle}
                  disabled={disabled}
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                  aria-labelledby={labelId}
                  aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
                >
                  <span className={cn(
                    "truncate",
                    selectedValues.length === 0 && "text-muted-foreground"
                  )}>
                    {getDisplayValue()}
                  </span>
                  
                  <div className="flex items-center">
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {clearable && selectedValues.length > 0 && !disabled && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-0.5 hover:bg-accent rounded mr-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-180"
                    )} />
                  </div>
                </button>
              }
            />

            {/* Dropdown slot */}
            {isOpen && (
              <Slot 
                name="dropdown"
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg"
              />
            )}
          </div>

          {/* Description slot */}
          <Slot 
            name="description"
            fallback={
              description ? (
                <p id={descriptionId} className="text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null
            }
          />

          {/* Error slot */}
          <Slot 
            name="error"
            fallback={
              errorMessage ? (
                <p id={errorId} className="text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null
            }
          />
        </div>
      </SlotProvider>
    );
  }

  // Traditional props-based composition
  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label 
          id={labelId}
          htmlFor={selectId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Select */}
      <div ref={selectRef} className="relative">
        <button
          type="button"
          id={selectId}
          className={cn(
            selectVariants({ variant, size, rounded, state: actualState }),
            "flex items-center justify-between w-full",
            className
          )}
          onClick={handleToggle}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        >
          <span className={cn(
            "truncate text-left",
            selectedValues.length === 0 && "text-muted-foreground"
          )}>
            {getDisplayValue()}
          </span>
          
          <div className="flex items-center ml-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {clearable && selectedValues.length > 0 && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-accent rounded mr-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border-0 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {noOptionsMessage}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                <div key={groupName}>
                  {groupName !== 'default' && (
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
                      {groupName}
                    </div>
                  )}
                  {groupOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent transition-colors flex items-center justify-between",
                          option.disabled && "opacity-50 cursor-not-allowed",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => handleSelect(option)}
                        disabled={option.disabled}
                      >
                        <div className="flex items-center">
                          {option.icon && <option.icon className="h-4 w-4 mr-2" />}
                          <div>
                            <div>{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Error message */}
      {errorMessage && (
        <p id={errorId} className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {/* Hidden input for forms */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={multiple ? JSON.stringify(selectedValues) : selectedValues[0] || ''}
        />
      )}
    </div>
  );
};

Select.displayName = 'Select';

export { selectVariants };
export const config = SelectConfig;
export default Select;