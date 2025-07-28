import React from 'react';
import { useAuth0 } from './Auth0Provider';

interface Auth0UserProfileProps {
  className?: string;
  showEmail?: boolean;
  showPicture?: boolean;
  showName?: boolean;
  variant?: 'dropdown' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export const Auth0UserProfile: React.FC<Auth0UserProfileProps> = ({
  className = '',
  showEmail = true,
  showPicture = true,
  showName = true,
  variant = 'inline',
  size = 'md'
}) => {
  const { user, isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex space-x-2">
          {showPicture && (
            <div className={`rounded-full bg-gray-300 ${
              size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
            }`}></div>
          )}
          {(showName || showEmail) && (
            <div className="flex-1 space-y-1">
              {showName && <div className="h-4 bg-gray-300 rounded w-20"></div>}
              {showEmail && <div className="h-3 bg-gray-300 rounded w-32"></div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const baseClasses = 'flex items-center space-x-3';
  const variantClasses = {
    dropdown: 'p-2 hover:bg-gray-100 rounded-lg cursor-pointer',
    card: 'p-4 bg-white rounded-lg border border-gray-200 shadow-sm',
    inline: ''
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const avatarSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes}>
      {showPicture && user.picture && (
        <img
          src={user.picture}
          alt={user.name || user.email}
          className={`rounded-full ${avatarSizeClasses[size]}`}
        />
      )}
      {showPicture && !user.picture && (
        <div className={`rounded-full bg-gray-300 flex items-center justify-center ${avatarSizeClasses[size]}`}>
          <span className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {(showName || showEmail) && (
        <div className="flex-1 min-w-0">
          {showName && user.name && (
            <p className={`font-medium text-gray-900 truncate ${textSizeClasses[size]}`}>
              {user.name}
            </p>
          )}
          {showEmail && (
            <p className={`text-gray-500 truncate ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
            }`}>
              {user.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Web Component version for framework-agnostic use (browser-only)
let Auth0UserProfileElement: any;

// Define Web Component only in browser environment
if (typeof window !== 'undefined' && typeof HTMLElement !== 'undefined') {
  Auth0UserProfileElement = class extends HTMLElement {
    connectedCallback() {
      const showEmail = this.getAttribute('show-email') !== 'false';
      const showPicture = this.getAttribute('show-picture') !== 'false';
      const showName = this.getAttribute('show-name') !== 'false';
      const variant = this.getAttribute('variant') || 'inline';
      const size = this.getAttribute('size') || 'md';
      
      // Check if user is authenticated (this would need to be implemented based on your auth state)
      const checkAuth = () => {
        fetch('/api/auth/me')
          .then(response => response.json())
          .then(user => {
            if (user) {
              this.renderProfile(user, { showEmail, showPicture, showName, variant, size });
            }
          })
          .catch(() => {
            // User not authenticated, hide component
            this.style.display = 'none';
          });
      };

      checkAuth();
    }

    renderProfile(user: any, options: any) {
      const { showEmail, showPicture, showName, variant, size } = options;
      
      const avatarSize = size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px';
      const textSize = size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px';
      const subtextSize = size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px';
      
      this.innerHTML = `
        <div class="auth0-user-profile" style="
          display: flex;
          align-items: center;
          gap: 12px;
          ${variant === 'card' ? 'padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : ''}
          ${variant === 'dropdown' ? 'padding: 8px; border-radius: 8px; cursor: pointer;' : ''}
        ">
          ${showPicture ? `
            ${user.picture ? `
              <img 
                src="${user.picture}" 
                alt="${user.name || user.email}"
                style="
                  width: ${avatarSize};
                  height: ${avatarSize};
                  border-radius: 50%;
                  object-fit: cover;
                "
              />
            ` : `
              <div style="
                width: ${avatarSize};
                height: ${avatarSize};
                border-radius: 50%;
                background-color: #d1d5db;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                font-weight: 500;
                font-size: ${textSize};
              ">
                ${user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            `}
          ` : ''}
          ${(showName || showEmail) ? `
            <div style="flex: 1; min-width: 0;">
              ${showName && user.name ? `
                <p style="
                  margin: 0;
                  font-weight: 500;
                  color: #111827;
                  font-size: ${textSize};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                ">
                  ${user.name}
                </p>
              ` : ''}
              ${showEmail ? `
                <p style="
                  margin: 0;
                  color: #6b7280;
                  font-size: ${subtextSize};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                ">
                  ${user.email}
                </p>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }
  };

  // Register the web component
  if (!customElements.get('auth0-user-profile')) {
    customElements.define('auth0-user-profile', Auth0UserProfileElement);
  }
}

// Export for type safety (will be undefined on server)
export { Auth0UserProfileElement };