/**
 * Visual Regression Testing System
 * Automated visual testing for design system components
 */

import { Page, Browser, chromium, firefox, webkit } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface VisualTestConfig {
  component: string;
  variant?: string;
  size?: string;
  props?: Record<string, any>;
  viewport?: {
    width: number;
    height: number;
  };
  browsers?: ('chromium' | 'firefox' | 'webkit')[];
  threshold?: number;
  ignore?: string[];
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisualTestResult {
  component: string;
  variant?: string;
  size?: string;
  browser: string;
  viewport: string;
  passed: boolean;
  difference: number;
  threshold: number;
  baselineExists: boolean;
  screenshotPath: string;
  diffPath?: string;
  timestamp: number;
  error?: string;
}

export interface VisualTestSuite {
  name: string;
  tests: VisualTestConfig[];
  baselineDir: string;
  outputDir: string;
  threshold: number;
  browsers: ('chromium' | 'firefox' | 'webkit')[];
  viewports: Array<{
    name: string;
    width: number;
    height: number;
  }>;
}

class VisualRegressionTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baselineDir: string;
  private outputDir: string;
  private threshold: number;

  constructor(config: {
    baselineDir: string;
    outputDir: string;
    threshold?: number;
  }) {
    this.baselineDir = config.baselineDir;
    this.outputDir = config.outputDir;
    this.threshold = config.threshold || 0.1;

    // Ensure directories exist
    if (!existsSync(this.baselineDir)) {
      mkdirSync(this.baselineDir, { recursive: true });
    }
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async initialize(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium'): Promise<void> {
    const browsers = {
      chromium: chromium,
      firefox: firefox,
      webkit: webkit,
    };

    this.browser = await browsers[browserType].launch({
      headless: true,
      devtools: false,
    });

    this.page = await this.browser.newPage();
    
    // Set up page for consistent screenshots
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'DesignSystem-VisualTesting/1.0',
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  private generateTestId(config: VisualTestConfig, browser: string, viewport: string): string {
    const hash = createHash('md5')
      .update(JSON.stringify({ ...config, browser, viewport }))
      .digest('hex');
    return `${config.component}-${config.variant || 'default'}-${config.size || 'default'}-${browser}-${viewport}-${hash.slice(0, 8)}`;
  }

  private async captureScreenshot(
    config: VisualTestConfig,
    browser: string,
    viewport: string
  ): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    const testId = this.generateTestId(config, browser, viewport);
    const screenshotPath = join(this.outputDir, `${testId}.png`);

    // Navigate to component story
    const storyUrl = `http://localhost:6006/iframe.html?args=&id=design-system-components-${config.component.toLowerCase()}--${config.variant || 'default'}&viewMode=story`;
    
    try {
      await this.page.goto(storyUrl, { waitUntil: 'networkidle' });
      
      // Wait for component to render
      await this.page.waitForSelector('[data-testid="design-system-component"]', { timeout: 5000 });
      
      // Apply any custom props
      if (config.props) {
        await this.page.evaluate((props) => {
          // Update component props in Storybook
          const component = document.querySelector('[data-testid="design-system-component"]');
          if (component) {
            Object.entries(props).forEach(([key, value]) => {
              (component as any)[key] = value;
            });
          }
        }, config.props);
      }

      // Wait for animations to complete
      await this.page.waitForTimeout(500);

      // Take screenshot
      const options: any = {
        path: screenshotPath,
        fullPage: false,
        type: 'png',
      };

      if (config.clip) {
        options.clip = config.clip;
      } else {
        // Default to capturing just the component
        const component = await this.page.locator('[data-testid="design-system-component"]');
        const boundingBox = await component.boundingBox();
        if (boundingBox) {
          options.clip = boundingBox;
        }
      }

      await this.page.screenshot(options);
      
      return screenshotPath;
    } catch (error) {
      throw new Error(`Failed to capture screenshot for ${config.component}: ${error}`);
    }
  }

  private async compareScreenshots(
    currentPath: string,
    baselinePath: string,
    diffPath: string,
    threshold: number
  ): Promise<{ passed: boolean; difference: number }> {
    if (!existsSync(baselinePath)) {
      // No baseline exists, copy current as baseline
      const currentBuffer = readFileSync(currentPath);
      writeFileSync(baselinePath, currentBuffer);
      return { passed: true, difference: 0 };
    }

    // Use pixelmatch or similar for comparison
    // For now, we'll use a simple file size comparison as a placeholder
    const currentBuffer = readFileSync(currentPath);
    const baselineBuffer = readFileSync(baselinePath);
    
    const sizeDifference = Math.abs(currentBuffer.length - baselineBuffer.length) / baselineBuffer.length;
    const passed = sizeDifference <= threshold;

    if (!passed) {
      // Create diff image (placeholder - would use actual image diffing library)
      writeFileSync(diffPath, currentBuffer);
    }

    return { passed, difference: sizeDifference };
  }

  async runVisualTest(config: VisualTestConfig): Promise<VisualTestResult[]> {
    const browsers = config.browsers || ['chromium'];
    const viewports = config.viewport ? [config.viewport] : [{ width: 1280, height: 720 }];
    const results: VisualTestResult[] = [];

    for (const browserType of browsers) {
      await this.initialize(browserType);

      for (const viewport of viewports) {
        if (this.page) {
          await this.page.setViewportSize(viewport);
        }

        const viewportString = `${viewport.width}x${viewport.height}`;
        const testId = this.generateTestId(config, browserType, viewportString);
        
        try {
          const screenshotPath = await this.captureScreenshot(config, browserType, viewportString);
          const baselinePath = join(this.baselineDir, `${testId}.png`);
          const diffPath = join(this.outputDir, `${testId}-diff.png`);

          const comparison = await this.compareScreenshots(
            screenshotPath,
            baselinePath,
            diffPath,
            config.threshold || this.threshold
          );

          results.push({
            component: config.component,
            variant: config.variant,
            size: config.size,
            browser: browserType,
            viewport: viewportString,
            passed: comparison.passed,
            difference: comparison.difference,
            threshold: config.threshold || this.threshold,
            baselineExists: existsSync(baselinePath),
            screenshotPath,
            diffPath: comparison.passed ? undefined : diffPath,
            timestamp: Date.now(),
          });

        } catch (error) {
          results.push({
            component: config.component,
            variant: config.variant,
            size: config.size,
            browser: browserType,
            viewport: viewportString,
            passed: false,
            difference: 1,
            threshold: config.threshold || this.threshold,
            baselineExists: false,
            screenshotPath: '',
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      await this.close();
    }

    return results;
  }

  async runTestSuite(suite: VisualTestSuite): Promise<{
    results: VisualTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  }> {
    const allResults: VisualTestResult[] = [];

    for (const test of suite.tests) {
      const testConfig: VisualTestConfig = {
        ...test,
        browsers: test.browsers || suite.browsers,
        threshold: test.threshold || suite.threshold,
      };

      const results = await this.runVisualTest(testConfig);
      allResults.push(...results);
    }

    const summary = {
      total: allResults.length,
      passed: allResults.filter(r => r.passed).length,
      failed: allResults.filter(r => !r.passed).length,
      passRate: 0,
    };

    summary.passRate = (summary.passed / summary.total) * 100;

    return { results: allResults, summary };
  }

  generateReport(results: VisualTestResult[]): string {
    const groupedResults = results.reduce((acc, result) => {
      const key = `${result.component}-${result.variant || 'default'}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    }, {} as Record<string, VisualTestResult[]>);

    let report = `# Visual Regression Test Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = (passedTests / totalTests) * 100;

    report += `## Summary\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Passed: ${passedTests}\n`;
    report += `- Failed: ${failedTests}\n`;
    report += `- Pass Rate: ${passRate.toFixed(1)}%\n\n`;

    report += `## Test Results\n\n`;

    Object.entries(groupedResults).forEach(([componentKey, componentResults]) => {
      const [component, variant] = componentKey.split('-');
      report += `### ${component} ${variant !== 'default' ? `(${variant})` : ''}\n\n`;

      componentResults.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        report += `- **${result.browser}** ${result.viewport}: ${status}`;
        
        if (!result.passed) {
          report += ` - Difference: ${(result.difference * 100).toFixed(2)}%`;
          if (result.diffPath) {
            report += ` - [Diff Image](${result.diffPath})`;
          }
        }
        
        if (result.error) {
          report += ` - Error: ${result.error}`;
        }
        
        report += '\n';
      });

      report += '\n';
    });

    return report;
  }
}

// Pre-configured test suites
export const defaultTestSuite: VisualTestSuite = {
  name: 'Design System Components',
  baselineDir: './tests/visual/baselines',
  outputDir: './tests/visual/results',
  threshold: 0.1,
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ],
  tests: [
    // Button component tests
    {
      component: 'Button',
      variant: 'primary',
      size: 'md',
    },
    {
      component: 'Button',
      variant: 'secondary',
      size: 'md',
    },
    {
      component: 'Button',
      variant: 'outline',
      size: 'md',
    },
    {
      component: 'Button',
      variant: 'ghost',
      size: 'md',
    },
    {
      component: 'Button',
      variant: 'danger',
      size: 'md',
    },
    // Card component tests
    {
      component: 'Card',
      variant: 'default',
      size: 'md',
    },
    {
      component: 'Card',
      variant: 'elevated',
      size: 'md',
    },
    {
      component: 'Card',
      variant: 'outlined',
      size: 'md',
    },
    // Add more components as needed
  ],
};

// Utility functions
export async function runVisualTests(
  suite: VisualTestSuite = defaultTestSuite
): Promise<void> {
  const tester = new VisualRegressionTester({
    baselineDir: suite.baselineDir,
    outputDir: suite.outputDir,
    threshold: suite.threshold,
  });

  try {
    const { results, summary } = await tester.runTestSuite(suite);
    
    console.log('\n📸 Visual Regression Test Results:');
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
    console.log(`Pass Rate: ${summary.passRate.toFixed(1)}%`);

    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.component} ${result.variant || 'default'} (${result.browser} ${result.viewport})`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        } else {
          console.log(`  Difference: ${(result.difference * 100).toFixed(2)}%`);
        }
      });
    }

    // Generate and save report
    const report = tester.generateReport(results);
    const reportPath = join(suite.outputDir, 'visual-regression-report.md');
    writeFileSync(reportPath, report);
    console.log(`\n📄 Report saved: ${reportPath}`);

  } catch (error) {
    console.error('Visual regression tests failed:', error);
    process.exit(1);
  }
}

export { VisualRegressionTester };
export default VisualRegressionTester;