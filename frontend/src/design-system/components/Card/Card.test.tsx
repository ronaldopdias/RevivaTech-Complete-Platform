/**
 * Card Component Tests
 * Comprehensive test suite for Card component using Jest and React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardGrid, CardHeader, CardContent, CardFooter } from './Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
    });

    it('renders with title and subtitle', () => {
      render(
        <Card title="Card Title" subtitle="Card Subtitle">
          Card content
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Test</Card>);
      const card = screen.getByText('Test').closest('div');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'elevated', 'outlined', 'filled', 'gradient', 'glass', 'interactive'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Card variant={variant}>Test content</Card>);
        const card = screen.getByText('Test content').closest('div');
        expect(card).toBeInTheDocument();
        
        // Test variant-specific styling
        if (variant === 'elevated') {
          expect(card).toHaveClass('shadow-lg');
        } else if (variant === 'outlined') {
          expect(card).toHaveClass('border-2');
        } else if (variant === 'interactive') {
          expect(card).toHaveClass('cursor-pointer');
        }
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Card size={size}>Test content</Card>);
        const card = screen.getByRole('article');
        expect(card).toBeInTheDocument();
        
        // Test size-specific padding
        if (size === 'xs') {
          expect(card).toHaveClass('p-2');
        } else if (size === 'sm') {
          expect(card).toHaveClass('p-3');
        } else if (size === 'lg') {
          expect(card).toHaveClass('p-6');
        }
      });
    });
  });

  describe('Interactive Features', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(
        <Card onClick={handleClick} variant="interactive">
          Clickable card
        </Card>
      );
      
      const card = screen.getByRole('article');
      await userEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard interaction', async () => {
      const handleClick = jest.fn();
      render(
        <Card onClick={handleClick} variant="interactive">
          Keyboard accessible card
        </Card>
      );
      
      const card = screen.getByRole('article');
      card.focus();
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('shows hover effects on interactive cards', () => {
      render(
        <Card variant="interactive">
          Hover me
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('transition-all');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Card aria-label="Custom card label">
          Card content
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Custom card label');
    });

    it('is focusable when interactive', () => {
      render(
        <Card variant="interactive" onClick={() => {}}>
          Interactive card
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not interactive', () => {
      render(<Card>Non-interactive card</Card>);
      
      const card = screen.getByRole('article');
      expect(card).not.toHaveAttribute('tabIndex');
    });

    it('has proper role', () => {
      render(<Card>Test content</Card>);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('renders header, content, and footer sections', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Header content')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('renders without header or footer', () => {
      render(
        <Card>
          <CardContent>Only content</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Only content')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('supports custom styles', () => {
      render(
        <Card style={{ backgroundColor: 'red' }}>
          Styled card
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveStyle({ backgroundColor: 'red' });
    });

    it('supports custom CSS variables', () => {
      render(
        <div style={{ '--card-bg': '#f0f0f0' }}>
          <Card>Themed card</Card>
        </div>
      );
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when loading', () => {
      render(<Card loading>Loading content</Card>);
      
      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('hides content when loading', () => {
      render(<Card loading>This should be hidden</Card>);
      
      expect(screen.queryByText('This should be hidden')).not.toBeInTheDocument();
    });
  });
});

describe('CardGrid Component', () => {
  it('renders children in a grid', () => {
    render(
      <CardGrid>
        <Card>Card 1</Card>
        <Card>Card 2</Card>
        <Card>Card 3</Card>
      </CardGrid>
    );
    
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  it('applies grid layout classes', () => {
    render(
      <CardGrid columns={3}>
        <Card>Card 1</Card>
        <Card>Card 2</Card>
      </CardGrid>
    );
    
    const grid = screen.getByRole('grid');
    expect(grid).toHaveClass('grid');
  });

  it('supports different column counts', () => {
    render(
      <CardGrid columns={4}>
        <Card>Card 1</Card>
        <Card>Card 2</Card>
      </CardGrid>
    );
    
    const grid = screen.getByRole('grid');
    expect(grid).toHaveClass('grid-cols-4');
  });

  it('supports different gap sizes', () => {
    render(
      <CardGrid gap="lg">
        <Card>Card 1</Card>
        <Card>Card 2</Card>
      </CardGrid>
    );
    
    const grid = screen.getByRole('grid');
    expect(grid).toHaveClass('gap-6');
  });

  it('is responsive by default', () => {
    render(
      <CardGrid>
        <Card>Card 1</Card>
        <Card>Card 2</Card>
      </CardGrid>
    );
    
    const grid = screen.getByRole('grid');
    expect(grid).toHaveClass('grid-cols-1');
  });
});

describe('CardHeader Component', () => {
  it('renders header content', () => {
    render(
      <CardHeader>
        <h2>Card Title</h2>
        <p>Card subtitle</p>
      </CardHeader>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
  });

  it('applies header styling', () => {
    render(<CardHeader>Header</CardHeader>);
    
    const header = screen.getByText('Header').parentElement;
    expect(header).toHaveClass('card-header');
  });
});

describe('CardContent Component', () => {
  it('renders content', () => {
    render(<CardContent>Main content here</CardContent>);
    
    expect(screen.getByText('Main content here')).toBeInTheDocument();
  });

  it('applies content styling', () => {
    render(<CardContent>Content</CardContent>);
    
    const content = screen.getByText('Content').parentElement;
    expect(content).toHaveClass('card-content');
  });
});

describe('CardFooter Component', () => {
  it('renders footer content', () => {
    render(<CardFooter>Footer content</CardFooter>);
    
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies footer styling', () => {
    render(<CardFooter>Footer</CardFooter>);
    
    const footer = screen.getByText('Footer').parentElement;
    expect(footer).toHaveClass('card-footer');
  });
});

describe('Performance', () => {
  it('renders quickly with many cards', () => {
    const startTime = performance.now();
    
    render(
      <CardGrid>
        {Array.from({ length: 50 }, (_, i) => (
          <Card key={i} title={`Card ${i}`}>
            Content for card {i}
          </Card>
        ))}
      </CardGrid>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 50 cards in less than 100ms
    expect(renderTime).toBeLessThan(100);
    expect(screen.getAllByRole('article')).toHaveLength(50);
  });

  it('handles large amounts of content efficiently', () => {
    const largeContent = 'Lorem ipsum '.repeat(1000);
    
    render(<Card>{largeContent}</Card>);
    
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
    expect(card.textContent).toContain('Lorem ipsum');
  });
});

describe('Error Handling', () => {
  it('handles missing props gracefully', () => {
    // @ts-expect-error - testing error handling
    render(<Card />);
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });

  it('handles invalid variant gracefully', () => {
    // @ts-expect-error - testing error handling
    render(<Card variant="invalid">Test</Card>);
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });
});

describe('Complex Scenarios', () => {
  it('handles nested cards', () => {
    render(
      <Card title="Outer Card">
        <Card title="Inner Card">
          Nested content
        </Card>
      </Card>
    );
    
    expect(screen.getByText('Outer Card')).toBeInTheDocument();
    expect(screen.getByText('Inner Card')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('handles cards with forms', () => {
    render(
      <Card title="Form Card">
        <form>
          <input type="text" placeholder="Name" />
          <button type="submit">Submit</button>
        </form>
      </Card>
    );
    
    expect(screen.getByText('Form Card')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('handles cards with media content', () => {
    render(
      <Card title="Media Card">
        <img src="/test-image.jpg" alt="Test image" />
        <video controls data-testid="video">
          <source src="/test-video.mp4" type="video/mp4" />
        </video>
      </Card>
    );
    
    expect(screen.getByText('Media Card')).toBeInTheDocument();
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
    expect(screen.getByTestId('video')).toBeInTheDocument();
  });
});

describe('Animation and Transitions', () => {
  it('applies transition classes for interactive cards', () => {
    render(
      <Card variant="interactive" onClick={() => {}}>
        Animated card
      </Card>
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('transition-all');
  });

  it('handles animation states', async () => {
    const { rerender } = render(
      <Card variant="interactive" className="animate-pulse">
        Animating card
      </Card>
    );
    
    const card = screen.getByText('Animating card');
    expect(card.parentElement).toHaveClass('animate-pulse');
    
    rerender(
      <Card variant="interactive">
        Static card
      </Card>
    );
    
    expect(card).not.toHaveClass('animate-pulse');
  });
});