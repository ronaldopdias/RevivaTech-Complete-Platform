import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  "stories": [
    "../src/stories/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/components/ui/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/components/business/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-actions",
    "@storybook/addon-viewport",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/nextjs",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  "docs": {
    "autodocs": "tag"
  },
  "features": {
    "buildStoriesJson": true
  }
};
export default config;