/**
 * Card Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Card, CardGrid } from './Card';
import { Button } from '../Button/Button';
import React from 'react';

const meta: Meta<typeof Card> = {
  title: 'Design System/Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'filled', 'gradient', 'glass', 'interactive'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
  args: {
    onClick: fn(),
    title: 'Card Title',
    subtitle: 'Card subtitle',
    children: 'This is the card content area.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
};

export const Interactive: Story = {
  args: {
    variant: 'interactive',
    onClick: fn(),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card variant="default" title="Default" subtitle="Standard card">
        <p className="text-sm text-gray-600">Default card styling</p>
      </Card>
      <Card variant="elevated" title="Elevated" subtitle="Enhanced shadow">
        <p className="text-sm text-gray-600">Elevated card with shadow</p>
      </Card>
      <Card variant="outlined" title="Outlined" subtitle="Prominent border">
        <p className="text-sm text-gray-600">Outlined card with border</p>
      </Card>
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Card variant="elevated" title="Card with Actions" subtitle="Multiple action buttons">
      <div className="space-y-4">
        <p className="text-gray-600">
          This card includes multiple action buttons.
        </p>
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="outline" size="sm">
            Secondary
          </Button>
        </div>
      </div>
    </Card>
  ),
};