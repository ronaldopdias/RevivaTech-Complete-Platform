# Design System Testing & Monitoring Guide

## Overview

The RevivaTech Design System V2 includes comprehensive testing and monitoring capabilities to ensure quality, performance, and accessibility compliance. This guide covers all testing frameworks, monitoring tools, and analytics systems.

## 📋 Table of Contents

1. [Testing Framework](#testing-framework)
2. [Component Testing](#component-testing)
3. [Visual Regression Testing](#visual-regression-testing)
4. [Performance Monitoring](#performance-monitoring)
5. [Analytics & Usage Tracking](#analytics--usage-tracking)
6. [Accessibility Testing](#accessibility-testing)
7. [Storybook Integration](#storybook-integration)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Testing Framework

### Architecture

The design system uses a multi-layered testing approach:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Component interaction testing
- **Visual Tests**: Automated screenshot comparison
- **Performance Tests**: Load time and memory usage
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **E2E Tests**: Playwright for end-to-end scenarios

### Test Structure

```
src/design-system/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx     # Unit tests
│   │   └── Button.stories.tsx  # Storybook stories
│   └── Card/
│       ├── Card.tsx
│       ├── Card.test.tsx
│       └── Card.stories.tsx
├── testing/
│   ├── visual-regression.ts    # Visual testing framework
│   └── test-utils.ts          # Testing utilities
├── monitoring/
│   └── DesignSystemAnalytics.ts
└── test-setup.ts             # Global test configuration
```

---

## Component Testing

### Running Tests

```bash
# Run all design system tests
npm run test:design-system

# Watch mode for development
npm run test:design-system:watch

# Generate coverage report
npm run test:design-system:coverage

# Run specific component tests
npm test Button.test.tsx
```

### Test Structure

Each component includes comprehensive tests covering:

#### 1. Basic Rendering
```typescript
describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });
});
```

#### 2. Variant Testing
```typescript
const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;

variants.forEach(variant => {
  it(`renders ${variant} variant correctly`, () => {
    render(<Button variant={variant}>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
```

#### 3. Accessibility Testing
```typescript
it('has proper ARIA attributes', () => {
  render(<Button aria-label="Custom label">Button</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-label', 'Custom label');
});

it('supports keyboard navigation', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  const button = screen.getByRole('button');
  button.focus();
  
  fireEvent.keyDown(button, { key: 'Enter' });
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

#### 4. Performance Testing
```typescript
it('renders quickly with many components', () => {
  const startTime = performance.now();
  
  render(
    <div>
      {Array.from({ length: 100 }, (_, i) => (
        <Button key={i}>Button {i}</Button>
      ))}
    </div>
  );
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  expect(renderTime).toBeLessThan(100); // Should render in <100ms
});
```

### Test Coverage Requirements

The design system maintains high test coverage standards:

- **Global**: 70% minimum coverage
- **Design System**: 85% minimum coverage
- **Critical Components**: 95% minimum coverage

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
  './src/design-system/': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

---

## Visual Regression Testing

### Overview

Visual regression testing ensures components maintain consistent appearance across:
- Different browsers (Chrome, Firefox, Safari)
- Multiple viewports (desktop, tablet, mobile)
- Various component states and variants

### Configuration

```typescript
import { VisualRegressionTester, defaultTestSuite } from './testing/visual-regression';

const customTestSuite = {
  name: 'Button Component Visual Tests',
  baselineDir: './tests/visual/baselines',
  outputDir: './tests/visual/results',
  threshold: 0.1, // 0.1% difference tolerance
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ],
  tests: [
    {
      component: 'Button',
      variant: 'primary',
      size: 'md',
    },
    {
      component: 'Button',
      variant: 'secondary',
      size: 'md',
      props: { disabled: true },
    },
  ],
};
```

### Running Visual Tests

```bash
# Run all visual regression tests
npm run test:visual

# Run specific component visual tests
npm run test:visual -- --component=Button

# Update baselines (use with caution)
npm run test:visual:update-baselines
```

### Visual Test Results

The system generates detailed reports including:
- Screenshot comparisons
- Difference percentages
- Failed test details
- Browser-specific results

Example output:
```
📸 Visual Regression Test Results:
Total: 45, Passed: 43, Failed: 2
Pass Rate: 95.6%

❌ Failed Tests:
- Button primary (firefox desktop)
  Difference: 0.15%
- Card elevated (webkit mobile)
  Difference: 0.12%

📄 Report saved: ./tests/visual/results/visual-regression-report.md
```

---

## Performance Monitoring

### Real-time Performance Tracking

The design system includes comprehensive performance monitoring:

```typescript
import { designSystemAnalytics } from './monitoring/DesignSystemAnalytics';

// Track component usage
designSystemAnalytics.trackComponentUsage('Button', 'primary', 'md');

// Track user interactions
designSystemAnalytics.trackComponentInteraction('Button', 'click');

// Track errors
designSystemAnalytics.trackComponentError('Button', error, 'onClick handler');
```

### Performance Metrics

#### 1. Render Performance
- **Average Render Time**: Time taken to render components
- **Memory Usage**: JavaScript heap size during renders
- **Bundle Size Impact**: Component size contribution to bundle

#### 2. User Experience Metrics
- **Interaction Delay**: Time between user action and component response
- **Error Rate**: Percentage of components that throw errors
- **User Satisfaction**: Calculated based on performance and error rates

#### 3. Usage Analytics
- **Component Adoption**: Which components are used most
- **Variant Popularity**: Most popular component variants
- **Performance Issues**: Components with consistent performance problems

### Performance Dashboard

```typescript
const analytics = designSystemAnalytics.getUsageAnalytics();

console.log(`
Usage Statistics:
- Total Components: ${analytics.totalComponents}
- Total Renders: ${analytics.totalRenders}
- Average Render Time: ${analytics.averageRenderTime}ms
- Error Rate: ${analytics.errorRate}%
- User Satisfaction: ${analytics.userSatisfaction}%

Most Used Components:
${analytics.mostUsedComponents.map(c => 
  `- ${c.name}: ${c.count} renders (${c.percentage}%)`
).join('\n')}
`);
```

### Performance Thresholds

The system monitors performance against these thresholds:

```typescript
const performanceThresholds = {
  renderTime: 50,      // Max 50ms render time
  memoryUsage: 50,     // Max 50MB memory usage
  errorRate: 1,        // Max 1% error rate
  bundleSize: 100,     // Max 100KB component size
};
```

---

## Analytics & Usage Tracking

### Component Usage Analytics

Track how components are used in production:

```typescript
import { useDesignSystemAnalytics } from './monitoring/DesignSystemAnalytics';

const MyComponent = () => {
  const { trackUsage, trackInteraction } = useDesignSystemAnalytics();
  
  useEffect(() => {
    trackUsage('Button', 'primary', 'md');
  }, []);
  
  const handleClick = () => {
    trackInteraction('Button', 'click');
    // Handle click
  };
  
  return <Button onClick={handleClick}>Click me</Button>;
};
```

### Analytics Dashboard

Access comprehensive analytics through the dashboard:

```typescript
const analytics = designSystemAnalytics.getUsageAnalytics();

// View usage statistics
console.log(analytics.mostUsedComponents);
console.log(analytics.mostUsedVariants);
console.log(analytics.performanceIssues);

// Generate report
const report = designSystemAnalytics.generateReport();
console.log(report);
```

### Data Collection

The system collects:
- **Component Usage**: Which components are rendered
- **Variant Preferences**: Popular variant combinations
- **Performance Data**: Render times, memory usage
- **Error Tracking**: Component errors and stack traces
- **User Interactions**: Click, hover, focus events
- **Accessibility Metrics**: Compliance scores

### Privacy & Data Protection

- **No Personal Data**: Only component usage data is collected
- **Local Storage**: Data stored locally for development
- **Opt-out Available**: Can be disabled in production
- **GDPR Compliant**: No personally identifiable information

---

## Accessibility Testing

### WCAG 2.1 AA Compliance

All components are tested for accessibility compliance:

```typescript
import { checkColorContrast, checkKeyboardNavigation } from './accessibility';

describe('Accessibility Tests', () => {
  it('meets color contrast requirements', () => {
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole('button');
    
    const contrast = checkColorContrast(
      getComputedStyle(button).color,
      getComputedStyle(button).backgroundColor
    );
    
    expect(contrast).toBeGreaterThan(4.5); // WCAG AA standard
  });
  
  it('supports keyboard navigation', async () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    
    await checkKeyboardNavigation(button);
    expect(button).toHaveFocus();
  });
});
```

### Accessibility Metrics

The system tracks:
- **Color Contrast Ratios**: Ensure proper contrast
- **Keyboard Navigation**: Tab order and focus management
- **Screen Reader Support**: ARIA attributes and semantic HTML
- **Focus Management**: Proper focus indicators
- **ARIA Compliance**: Proper ARIA attributes

### Accessibility Scoring

```typescript
designSystemAnalytics.trackAccessibility('Button', {
  contrastRatio: 7.2,
  keyboardNavigable: true,
  screenReaderCompatible: true,
  focusManagement: true,
  ariaCompliance: true,
  wcagLevel: 'AA',
});
```

---

## Storybook Integration

### Story Configuration

Each component includes comprehensive Storybook stories:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component documentation...'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};
```

### Storybook Addons

The system includes these addons:
- **Docs**: Auto-generated documentation
- **Controls**: Interactive component controls
- **Viewport**: Responsive design testing
- **A11y**: Accessibility testing
- **Actions**: Event logging

### Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook

# Run visual regression tests with Storybook
npm run test:visual
```

---

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/design-system-tests.yml
name: Design System Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run design system tests
      run: npm run test:design-system:coverage
    
    - name: Run visual regression tests
      run: npm run test:visual
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Upload visual test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: visual-regression-results
        path: ./tests/visual/results/
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "src/design-system/**/*.{ts,tsx}": [
      "npm run test:design-system",
      "npm run lint:fix"
    ]
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Test Failures

**Problem**: Component tests are failing after changes
**Solution**: 
1. Update test snapshots: `npm run test:design-system -- --updateSnapshot`
2. Check for breaking changes in component APIs
3. Verify accessibility compliance

#### 2. Visual Regression Failures

**Problem**: Visual tests failing due to minor differences
**Solution**:
1. Review screenshots in `./tests/visual/results/`
2. If changes are intentional: `npm run test:visual:update-baselines`
3. Adjust threshold in test configuration

#### 3. Performance Issues

**Problem**: Components not meeting performance thresholds
**Solution**:
1. Check analytics dashboard for slowest components
2. Profile component render times
3. Optimize heavy computations
4. Consider memoization

#### 4. Storybook Build Errors

**Problem**: Storybook failing to build
**Solution**:
1. Check for TypeScript errors
2. Verify story imports
3. Update Storybook configuration

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug mode
designSystemAnalytics.enable();

// View debug information
console.log(designSystemAnalytics.generateReport());
```

### Performance Profiling

Use React DevTools Profiler to identify performance bottlenecks:

```typescript
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log(`${id} ${phase}: ${actualDuration}ms`);
};

<Profiler id="Button" onRender={onRenderCallback}>
  <Button>Test</Button>
</Profiler>
```

---

## Best Practices

### 1. Test Writing
- Write tests before implementing features (TDD)
- Test user behavior, not implementation details
- Use meaningful test descriptions
- Cover edge cases and error scenarios

### 2. Performance Optimization
- Monitor render times regularly
- Use React.memo for expensive components
- Implement lazy loading for large components
- Optimize bundle size with tree shaking

### 3. Accessibility
- Test with screen readers
- Ensure keyboard navigation works
- Verify color contrast ratios
- Use semantic HTML elements

### 4. Visual Testing
- Update baselines carefully
- Review visual changes in pull requests
- Test across different browsers
- Consider responsive design

---

## Support

For questions or issues:

1. Check the troubleshooting section
2. Review component documentation
3. File an issue on GitHub
4. Contact the design system team

---

**Version**: 2.0.0 | **Last Updated**: July 2025
**Testing Coverage**: 85%+ | **Accessibility**: WCAG 2.1 AA Compliant