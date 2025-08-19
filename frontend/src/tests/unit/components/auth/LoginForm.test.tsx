/**
 * LoginForm Component Tests
 * Tests that the LoginForm renders correctly with hydration fixes
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock the auth hooks
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    isLoading: false,
  }),
  signIn: jest.fn(),
}));

describe('LoginForm Component - Hydration Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form elements with proper attributes', () => {
    render(<LoginForm />);

    // Check that email input exists and has proper attributes
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).not.toBeDisabled();
    expect(emailInput).not.toHaveAttribute('readonly');

    // Check that password input exists and has proper attributes  
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).not.toBeDisabled();
    expect(passwordInput).not.toHaveAttribute('readonly');

    // Check that submit button exists and has proper attributes
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveAttribute('type', 'submit');

    // Check that remember me checkbox exists and has proper attributes
    const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    expect(rememberCheckbox).toBeInTheDocument();
    expect(rememberCheckbox).not.toBeChecked();
    expect(rememberCheckbox).not.toBeDisabled();
    expect(rememberCheckbox).not.toBeRequired();
  });

  test('form validation works correctly', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Try to submit empty form
    await user.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('form inputs accept user input correctly', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });

    // Type into email input
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');

    // Type into password input
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');

    // Click remember me checkbox
    await user.click(rememberCheckbox);
    expect(rememberCheckbox).toBeChecked();

    // Click again to uncheck
    await user.click(rememberCheckbox);
    expect(rememberCheckbox).not.toBeChecked();
  });

  test('loading state disables form elements correctly', () => {
    // Mock loading state
    const mockUseAuth = require('@/lib/auth').useAuth as jest.Mock;
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      isLoading: true,
    });

    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
    
    // Form inputs should still be enabled during loading
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
  });

  test('hydration consistency for boolean attributes', () => {
    render(<LoginForm />);

    // Get all form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });

    // Test that all boolean attributes are properly set as booleans (not strings)
    // This would cause hydration mismatches if not fixed
    
    // disabled attributes should be null (not present) when false
    expect(emailInput.getAttribute('disabled')).toBeNull();
    expect(passwordInput.getAttribute('disabled')).toBeNull();
    expect(submitButton.getAttribute('disabled')).toBeNull();
    expect(rememberCheckbox.getAttribute('disabled')).toBeNull();

    // readonly attributes should be null when false
    expect(emailInput.getAttribute('readonly')).toBeNull();
    expect(passwordInput.getAttribute('readonly')).toBeNull();

    // checked attribute should not be present when false
    expect(rememberCheckbox.getAttribute('checked')).toBeNull();

    // required attribute should not be present when false
    expect(rememberCheckbox.getAttribute('required')).toBeNull();
  });

  test('form accessibility is maintained', () => {
    render(<LoginForm />);

    // Check ARIA labels and associations
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });

    // Inputs should have proper labels
    expect(emailInput).toHaveAccessibleName();
    expect(passwordInput).toHaveAccessibleName();
    expect(rememberCheckbox).toHaveAccessibleName();

    // Form should be keyboard navigable
    expect(emailInput).toHaveAttribute('tabindex', '0');
    expect(passwordInput).toHaveAttribute('tabindex', '0');
    expect(rememberCheckbox).toHaveAttribute('tabindex', '0');
  });

  test('renders with custom props correctly', () => {
    const customClassName = 'custom-login-form';
    const onSuccess = jest.fn();
    
    render(
      <LoginForm 
        className={customClassName}
        onSuccess={onSuccess}
        redirectUrl="/dashboard"
      />
    );

    // Should apply custom className
    const form = screen.getByRole('form') || screen.getByTestId('login-form');
    expect(form).toHaveClass(customClassName);
  });
});