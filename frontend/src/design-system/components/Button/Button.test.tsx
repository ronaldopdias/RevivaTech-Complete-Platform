/**
 * Button Component Tests
 * Comprehensive test suite for Button component using Jest and React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, ButtonGroup, IconButton, FloatingActionButton } from './Button';
import { Heart, Share, Settings } from 'lucide-react';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });

    it('renders with custom text', () => {
      render(<Button>Custom Button</Button>);
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'accent', 'outline', 'ghost', 'subtle', 'danger', 'success', 'warning', 'link'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>Test</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // Test that variant-specific classes are applied
        switch (variant) {
          case 'primary':
            expect(button).toHaveClass('bg-gradient-to-r', 'from-primary-500', 'to-primary-600');
            break;
          case 'secondary':
            expect(button).toHaveClass('bg-gradient-to-r', 'from-secondary-500', 'to-secondary-600');
            break;
          case 'outline':
            expect(button).toHaveClass('border-2', 'border-primary-500', 'bg-transparent');
            break;
          case 'ghost':
            expect(button).toHaveClass('bg-transparent', 'text-primary-600');
            break;
          case 'subtle':
            expect(button).toHaveClass('bg-primary-50', 'text-primary-700');
            break;
          case 'danger':
            expect(button).toHaveClass('bg-gradient-to-r', 'from-red-500', 'to-red-600');
            break;
          case 'success':
            expect(button).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-green-600');
            break;
          case 'warning':
            expect(button).toHaveClass('bg-gradient-to-r', 'from-yellow-500', 'to-yellow-600');
            break;
          case 'link':
            expect(button).toHaveClass('text-primary-600', 'underline-offset-4', 'hover:underline');
            break;
          default:
            expect(button).toHaveClass('bg-gradient-to-r');
        }
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>Test</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // Test that size-specific classes are applied
        const sizeClasses = {
          xs: 'h-7',
          sm: 'h-8', 
          md: 'h-10',
          lg: 'h-12',
          xl: 'h-14',
          '2xl': 'h-16'
        };
        expect(button).toHaveClass(sizeClasses[size]);
      });
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(<Button leftIcon={Heart}>With Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Check that icon is present
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(<Button rightIcon={Share}>With Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with both icons', () => {
      render(<Button leftIcon={Heart} rightIcon={Share}>With Icons</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Should have 2 SVG elements
      expect(button.querySelectorAll('svg')).toHaveLength(2);
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('renders loading state', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Check for loading spinner
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows loading text when provided', () => {
      render(<Button loading loadingText="Processing...">Submit</Button>);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders full width', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('is focusable by default', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });

    it('has proper role', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Type attribute', () => {
    it('defaults to button type', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('accepts custom type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('External links', () => {
    it('renders as anchor for external links', () => {
      render(<Button href="https://example.com" external>External Link</Button>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});

describe('ButtonGroup Component', () => {
  it('renders multiple buttons', () => {
    render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>
    );
    
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('applies group styling', () => {
    render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex');
  });

  it('supports different orientations', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
  });
});

describe('IconButton Component', () => {
  it('renders icon button', () => {
    render(<IconButton icon={Settings} aria-label="Settings" />);
    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('requires aria-label for accessibility', () => {
    render(<IconButton icon={Settings} aria-label="Settings" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Settings');
  });

  it('supports different sizes', () => {
    render(<IconButton icon={Settings} aria-label="Settings" size="lg" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('FloatingActionButton Component', () => {
  it('renders floating action button', () => {
    render(<FloatingActionButton icon={Heart} aria-label="Like" />);
    const button = screen.getByRole('button', { name: 'Like' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('fixed');
  });

  it('supports different positions', () => {
    render(<FloatingActionButton icon={Heart} aria-label="Like" position="bottom-left" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bottom-4', 'left-4');
  });

  it('supports different positions - bottom-right', () => {
    render(<FloatingActionButton icon={Heart} aria-label="Like" position="bottom-right" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bottom-4', 'right-4');
  });
});

describe('Performance', () => {
  it('renders quickly with many buttons', () => {
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <Button key={i} variant="primary">
            Button {i}
          </Button>
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 100 buttons in less than 100ms
    expect(renderTime).toBeLessThan(100);
    expect(screen.getAllByRole('button')).toHaveLength(100);
  });
});

describe('Error Handling', () => {
  it('handles missing props gracefully', () => {
    // @ts-expect-error - testing error handling
    render(<Button />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('handles invalid variant gracefully', () => {
    // @ts-expect-error - testing error handling
    render(<Button variant="invalid">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('Theme Integration', () => {
  it('supports custom CSS variables', () => {
    render(
      <div style={{ '--primary-color': '#ff0000' }}>
        <Button variant="primary">Themed Button</Button>
      </div>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('Animation States', () => {
  it('shows loading animation', async () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    const spinner = button.querySelector('.animate-spin');
    
    expect(spinner).toBeInTheDocument();
  });

  it('transitions from loading to normal state', async () => {
    const { rerender } = render(<Button loading>Loading</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    
    rerender(<Button loading={false}>Normal</Button>);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});