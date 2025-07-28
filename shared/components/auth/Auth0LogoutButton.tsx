import React from 'react';
import { useAuth0 } from './Auth0Provider';

interface Auth0LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  returnTo?: string;
}

export const Auth0LogoutButton: React.FC<Auth0LogoutButtonProps> = ({
  className = '',
  children,
  variant = 'outline',
  size = 'md',
  fullWidth = false,
  returnTo
}) => {
  const { logout, isAuthenticated, isLoading } = useAuth0();

  const handleLogout = () => {
    const returnUrl = returnTo || window.location.origin;
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(returnUrl)}`;
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={classes}
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging out...
        </div>
      ) : (
        children || 'Logout'
      )}
    </button>
  );
};

// Web Component version for framework-agnostic use (browser-only)
let Auth0LogoutButtonElement: any;

// Define Web Component only in browser environment
if (typeof window !== 'undefined' && typeof HTMLElement !== 'undefined') {
  Auth0LogoutButtonElement = class extends HTMLElement {
    connectedCallback() {
      const label = this.getAttribute('label') || 'Logout';
      const variant = this.getAttribute('variant') || 'outline';
      const size = this.getAttribute('size') || 'md';
      const returnTo = this.getAttribute('return-to') || window.location.origin;
      
      this.innerHTML = `
        <button 
          class="auth0-logout-btn auth0-logout-btn--${variant} auth0-logout-btn--${size}" 
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            border-radius: 0.5rem;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
            padding: ${size === 'sm' ? '0.5rem 0.75rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.5rem 1rem'};
            font-size: ${size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem'};
            background-color: ${variant === 'primary' ? '#dc2626' : variant === 'secondary' ? '#4b5563' : '#ffffff'};
            color: ${variant === 'outline' ? '#374151' : '#ffffff'};
            border: ${variant === 'outline' ? '1px solid #d1d5db' : 'none'};
          "
          onmouseover="this.style.backgroundColor='${variant === 'primary' ? '#b91c1c' : variant === 'secondary' ? '#374151' : '#f9fafb'}'"
          onmouseout="this.style.backgroundColor='${variant === 'primary' ? '#dc2626' : variant === 'secondary' ? '#4b5563' : '#ffffff'}'"
        >
          ${label}
        </button>
      `;
      
      this.querySelector('button')?.addEventListener('click', () => {
        window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
      });
    }
  };

  // Register the web component
  if (!customElements.get('auth0-logout-button')) {
    customElements.define('auth0-logout-button', Auth0LogoutButtonElement);
  }
}

// Export for type safety (will be undefined on server)
export { Auth0LogoutButtonElement };