/**
 * Hydration Fix Tests for UI Components
 * Tests that boolean attributes render consistently on server and client
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ButtonReviva from '@/components/ui/Button';
import InputReviva from '@/components/ui/Input';
import CheckboxReviva from '@/components/ui/Checkbox';

describe('Hydration Fixes for Boolean Attributes', () => {
  describe('Button Component', () => {
    test('disabled attribute renders as true/false boolean consistently', () => {
      // Test disabled = true
      const { rerender } = render(<ButtonReviva disabled={true}>Disabled Button</ButtonReviva>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.getAttribute('disabled')).toBe('');
      
      // Test disabled = false
      rerender(<ButtonReviva disabled={false}>Enabled Button</ButtonReviva>);
      expect(button).not.toBeDisabled();
      expect(button.getAttribute('disabled')).toBeNull();
    });

    test('disabled attribute consistency with loading state', () => {
      const { rerender } = render(
        <ButtonReviva disabled={false} loading={false}>Normal Button</ButtonReviva>
      );
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      // Both disabled and loading
      rerender(<ButtonReviva disabled={true} loading={true}>Disabled Loading</ButtonReviva>);
      expect(button).toBeDisabled();
      
      // Only loading
      rerender(<ButtonReviva disabled={false} loading={true}>Only Loading</ButtonReviva>);
      expect(button).toBeDisabled();
      
      // Only disabled
      rerender(<ButtonReviva disabled={true} loading={false}>Only Disabled</ButtonReviva>);
      expect(button).toBeDisabled();
    });
  });

  describe('Input Component', () => {
    test('disabled and readOnly attributes render as true/false boolean consistently', () => {
      // Test disabled = true
      const { rerender } = render(<InputReviva disabled={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input.getAttribute('disabled')).toBe('');
      
      // Test disabled = false
      rerender(<InputReviva disabled={false} />);
      expect(input).not.toBeDisabled();
      expect(input.getAttribute('disabled')).toBeNull();
      
      // Test readOnly = true
      rerender(<InputReviva readOnly={true} />);
      expect(input).toHaveAttribute('readonly');
      
      // Test readOnly = false
      rerender(<InputReviva readOnly={false} />);
      expect(input).not.toHaveAttribute('readonly');
    });

    test('disabled attribute consistency with loading state', () => {
      const { rerender } = render(
        <InputReviva disabled={false} loading={false} />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
      
      // Both disabled and loading
      rerender(<InputReviva disabled={true} loading={true} />);
      expect(input).toBeDisabled();
      
      // Only loading
      rerender(<InputReviva disabled={false} loading={true} />);
      expect(input).toBeDisabled();
      
      // Only disabled
      rerender(<InputReviva disabled={true} loading={false} />);
      expect(input).toBeDisabled();
    });

    test('combination of disabled and readOnly states', () => {
      const { rerender } = render(
        <InputReviva disabled={true} readOnly={true} />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('readonly');
      
      // Test all false
      rerender(<InputReviva disabled={false} readOnly={false} />);
      expect(input).not.toBeDisabled();
      expect(input).not.toHaveAttribute('readonly');
    });
  });

  describe('Checkbox Component', () => {
    test('checked, disabled, and required attributes render as true/false boolean consistently', () => {
      // Test checked = true
      const { rerender } = render(<CheckboxReviva checked={true} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
      
      // Test checked = false
      rerender(<CheckboxReviva checked={false} />);
      expect(checkbox).not.toBeChecked();
      
      // Test disabled = true
      rerender(<CheckboxReviva disabled={true} />);
      expect(checkbox).toBeDisabled();
      expect(checkbox.getAttribute('disabled')).toBe('');
      
      // Test disabled = false
      rerender(<CheckboxReviva disabled={false} />);
      expect(checkbox).not.toBeDisabled();
      expect(checkbox.getAttribute('disabled')).toBeNull();
      
      // Test required = true
      rerender(<CheckboxReviva required={true} />);
      expect(checkbox).toBeRequired();
      
      // Test required = false
      rerender(<CheckboxReviva required={false} />);
      expect(checkbox).not.toBeRequired();
    });

    test('all boolean attributes together', () => {
      const { rerender } = render(
        <CheckboxReviva 
          checked={true} 
          disabled={true} 
          required={true} 
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
      expect(checkbox).toBeRequired();
      
      // Test all false
      rerender(
        <CheckboxReviva 
          checked={false} 
          disabled={false} 
          required={false} 
        />
      );
      expect(checkbox).not.toBeChecked();
      expect(checkbox).not.toBeDisabled();
      expect(checkbox).not.toBeRequired();
    });
  });

  describe('Hydration Consistency', () => {
    test('boolean attributes render consistently', () => {
      // Test with explicit boolean values that should work the same on server and client
      const { rerender } = render(
        <div>
          <ButtonReviva disabled={true}>Disabled Button</ButtonReviva>
          <InputReviva disabled={true} readOnly={true} />
          <CheckboxReviva checked={true} disabled={true} required={true} />
        </div>
      );
      
      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');
      const checkbox = screen.getByRole('checkbox');
      
      // All should be in expected states
      expect(button).toBeDisabled();
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('readonly');
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
      expect(checkbox).toBeRequired();
      
      // Test changing to false values
      rerender(
        <div>
          <ButtonReviva disabled={false}>Enabled Button</ButtonReviva>
          <InputReviva disabled={false} readOnly={false} />
          <CheckboxReviva checked={false} disabled={false} required={false} />
        </div>
      );
      
      // All should be in expected states
      expect(button).not.toBeDisabled();
      expect(input).not.toBeDisabled();
      expect(input).not.toHaveAttribute('readonly');
      expect(checkbox).not.toBeChecked();
      expect(checkbox).not.toBeDisabled();
      expect(checkbox).not.toBeRequired();
    });
  });
});