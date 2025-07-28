# RevivaTech Testing Guide - Phase 7

## Comprehensive Testing Strategy 🧪

This guide covers our multi-layered testing approach for the RevivaTech platform, including unit tests, integration tests, E2E tests, and PWA testing.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Component Testing](#component-testing)
5. [E2E Testing](#e2e-testing)
6. [PWA Testing](#pwa-testing)
7. [Mobile Testing](#mobile-testing)
8. [Performance Testing](#performance-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [CI/CD Integration](#cicd-integration)

## Testing Philosophy

### Testing Pyramid

```
    /\     E2E Tests (Few)
   /  \    - User workflows
  /____\   - Critical paths
 /      \  Integration Tests (Some)
/        \ - Component interactions
\        / - API integration  
 \______/  Unit Tests (Many)
          - Pure functions
          - Component logic
```

### Quality Standards

- **Coverage**: Minimum 70% overall, 85% for critical components
- **Performance**: Tests complete within defined timeouts
- **Reliability**: Flaky test rate < 1%
- **Maintainability**: Clear, readable test code

## Test Structure

```
frontend/
├── src/
│   └── __tests__/              # Unit & Integration Tests
│       ├── setup.ts            # Test setup & configuration
│       ├── mocks/              # Mock implementations
│       ├── components/         # Component tests
│       ├── integration/        # Integration tests
│       ├── pwa/               # PWA functionality tests
│       └── mobile/            # Mobile-specific tests
├── e2e/                       # End-to-End Tests
│   ├── mobile/                # Mobile E2E tests
│   ├── desktop/               # Desktop E2E tests
│   ├── pwa/                   # PWA E2E tests
│   └── accessibility/         # A11y E2E tests
├── jest.config.js             # Jest configuration
├── playwright.config.ts       # Playwright configuration
└── package.json              # Test scripts
```

## Running Tests

### Unit & Integration Tests (Jest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test AdminDashboard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="mobile"

# Update snapshots
npm test -- --updateSnapshot
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run mobile E2E tests only
npm run test:e2e:mobile

# Run PWA E2E tests only
npm run test:e2e:pwa

# Run tests in headed mode (visible browser)
npm run test:e2e -- --headed

# Run tests on specific browser
npm run test:e2e -- --project="Mobile Chrome"

# Debug mode (step through tests)
npm run test:e2e -- --debug

# Run specific test file
npm run test:e2e mobile/mobile-admin.spec.ts
```

### Visual Testing

```bash
# Generate visual baselines
npm run test:visual:update

# Run visual regression tests
npm run test:visual

# Review visual differences
npm run test:visual:review
```

## Component Testing

### Best Practices

1. **Test User Interactions**
```typescript
// ✅ Good: Test user behavior
test('should open menu when hamburger button is clicked', async () => {
  render(<AdminDashboard />);
  const menuButton = screen.getByRole('button', { name: /menu/i });
  await userEvent.click(menuButton);
  expect(screen.getByRole('navigation')).toBeVisible();
});

// ❌ Avoid: Testing implementation details
test('should set isMenuOpen to true', () => {
  // Testing internal state instead of user-visible behavior
});
```

2. **Test Mobile Interactions**
```typescript
test('should support swipe gestures on mobile', async () => {
  render(<AdminDashboard />);
  const dashboard = screen.getByTestId('dashboard');
  
  // Simulate swipe right
  fireEvent.touchStart(dashboard, { touches: [{ clientX: 0, clientY: 0 }] });
  fireEvent.touchMove(dashboard, { touches: [{ clientX: 100, clientY: 0 }] });
  fireEvent.touchEnd(dashboard);
  
  await waitFor(() => {
    expect(screen.getByRole('navigation')).toBeVisible();
  });
});
```

3. **Test Responsive Behavior**
```typescript
test('should adapt layout for mobile screens', () => {
  // Mock mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  
  render(<AdminDashboard />);
  
  expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
});
```

### Testing Patterns

#### Render with Providers
```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <QueryClient>
          {ui}
        </QueryClient>
      </AuthProvider>
    </ThemeProvider>
  );
};
```

#### Mock API Calls
```typescript
beforeEach(() => {
  server.use(
    rest.get('/api/repairs', (req, res, ctx) => {
      return res(ctx.json({ repairs: mockRepairs }));
    })
  );
});
```

#### Test Accessibility
```typescript
test('should be accessible', async () => {
  const { container } = render(<AdminDashboard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## E2E Testing

### Page Object Model

```typescript
// pages/AdminDashboardPage.ts
export class AdminDashboardPage {
  constructor(private page: Page) {}

  async navigateToRepairs() {
    await this.page.click('[data-testid="repairs-nav"]');
    await this.page.waitForURL('**/repairs');
  }

  async createNewRepair(repairData: RepairData) {
    await this.page.click('[data-testid="new-repair-btn"]');
    await this.page.fill('[data-testid="customer-name"]', repairData.customerName);
    await this.page.selectOption('[data-testid="device-type"]', repairData.deviceType);
    await this.page.click('[data-testid="submit-repair"]');
  }

  async getMobileMenu() {
    return this.page.locator('[data-testid="mobile-menu"]');
  }
}
```

### Mobile Testing Patterns

```typescript
test.describe('Mobile Admin Dashboard', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should support touch navigation', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    await adminPage.goto();

    // Test swipe gesture
    await page.locator('[data-testid="dashboard"]').swipe({ dx: 200, dy: 0 });
    await expect(adminPage.getMobileMenu()).toBeVisible();
  });

  test('should adapt to device orientation', async ({ page }) => {
    await page.goto('/admin');
    
    // Portrait mode
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
    
    // Landscape mode  
    await page.setViewportSize({ width: 812, height: 375 });
    await expect(page.locator('[data-testid="landscape-layout"]')).toBeVisible();
  });
});
```

## PWA Testing

### Service Worker Testing

```typescript
test.describe('PWA Functionality', () => {
  test('should install service worker', async ({ page, context }) => {
    // Enable service workers
    await context.addInitScript(() => {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
      });
    });

    await page.goto('/admin');
    
    // Wait for service worker registration
    await page.waitForFunction(() => 
      navigator.serviceWorker.controller !== null
    );

    const swRegistered = await page.evaluate(() => 
      navigator.serviceWorker.controller !== null
    );
    expect(swRegistered).toBe(true);
  });

  test('should work offline', async ({ page, context }) => {
    await page.goto('/admin');
    
    // Go offline
    await context.setOffline(true);
    
    // Should still be accessible
    await page.reload();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });
});
```

### Installation Testing

```typescript
test('should show PWA install prompt', async ({ page }) => {
  // Mock beforeinstallprompt event
  await page.addInitScript(() => {
    window.addEventListener('load', () => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });
  });

  await page.goto('/admin');
  
  await expect(page.locator('[data-testid="install-prompt"]')).toBeVisible();
});
```

## Performance Testing

### Core Web Vitals

```typescript
test('should meet Core Web Vitals standards', async ({ page }) => {
  await page.goto('/admin');
  
  // Measure performance metrics
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const vitals = {};
        
        entries.forEach((entry) => {
          if (entry.name === 'largest-contentful-paint') {
            vitals.lcp = entry.startTime;
          }
          if (entry.name === 'first-input-delay') {
            vitals.fid = entry.duration;
          }
          if (entry.name === 'cumulative-layout-shift') {
            vitals.cls = entry.value;
          }
        });
        
        resolve(vitals);
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    });
  });

  // Assert performance standards
  expect(metrics.lcp).toBeLessThan(2500); // 2.5s
  expect(metrics.fid).toBeLessThan(100);  // 100ms
  expect(metrics.cls).toBeLessThan(0.1);  // 0.1
});
```

### Bundle Analysis

```typescript
test('should have reasonable bundle size', async ({ page }) => {
  const response = await page.goto('/admin');
  const transferSize = response.headers()['content-length'];
  
  // Main bundle should be under 500KB
  expect(parseInt(transferSize)).toBeLessThan(500 * 1024);
});
```

## Accessibility Testing

### Automated A11y Testing

```typescript
test('should pass accessibility audit', async ({ page }) => {
  await page.goto('/admin');
  
  // Run axe-core accessibility tests
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Keyboard Navigation

```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('/admin');
  
  // Tab through interactive elements
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'main-nav');
  
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input');
});
```

### Screen Reader Testing

```typescript
test('should have proper ARIA labels', async ({ page }) => {
  await page.goto('/admin');
  
  // Check for proper labeling
  await expect(page.locator('[data-testid="repair-count"]')).toHaveAttribute('aria-label', /active repairs/i);
  await expect(page.locator('[data-testid="revenue-metric"]')).toHaveAttribute('aria-label', /revenue/i);
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Quality Gates

```json
{
  "coverage": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  },
  "performance": {
    "lcp": 2500,
    "fid": 100,
    "cls": 0.1
  },
  "accessibility": {
    "violations": 0,
    "score": 95
  }
}
```

## Test Data Management

### Fixtures
```typescript
// fixtures/repairData.ts
export const mockRepairs = [
  {
    id: '1',
    customerName: 'John Doe',
    deviceType: 'iPhone 12',
    issue: 'Screen replacement',
    status: 'in-progress',
    estimatedCompletion: '2025-07-20',
  },
  // ... more mock data
];
```

### Database Seeding
```typescript
// tests/setup/seed-data.ts
export async function seedTestData() {
  await db.repairs.create({
    data: mockRepairs
  });
}
```

## Debugging Tests

### Jest Debugging
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand AdminDashboard.test.tsx

# Run with verbose output
npm test -- --verbose --detectOpenHandles
```

### Playwright Debugging
```bash
# Run in headed mode
npm run test:e2e -- --headed

# Debug mode (step through)
npm run test:e2e -- --debug

# Trace viewer
npx playwright show-trace trace.zip
```

## Best Practices Summary

### ✅ Do
- Write tests from user perspective
- Test responsive behavior
- Mock external dependencies
- Use accessibility matchers
- Keep tests focused and isolated
- Use descriptive test names
- Test error states
- Maintain test data fixtures

### ❌ Don't
- Test implementation details
- Write overly complex tests
- Share state between tests
- Skip test cleanup
- Ignore flaky tests
- Test third-party libraries
- Use production data in tests
- Couple tests to exact markup

---

*Testing Guide v2.0 | Updated July 2025 | Phase 7 Implementation*