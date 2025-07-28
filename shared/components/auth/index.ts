// Auth0 Components
export { Auth0Provider } from './Auth0Provider';
export { Auth0LoginButton, Auth0LoginButtonElement } from './Auth0LoginButton';
export { Auth0LogoutButton, Auth0LogoutButtonElement } from './Auth0LogoutButton';
export { Auth0UserProfile, Auth0UserProfileElement } from './Auth0UserProfile';
export { Auth0ProtectedRoute, withAuth0Protection, useAuth0Protection } from './Auth0ProtectedRoute';

// Auth0 Hooks
export { 
  useAuth0, 
  useAuth0User, 
  useAuth0Actions, 
  useAuth0Status, 
  useAuth0Roles, 
  useAuth0Conditional,
  useAuth0Metadata 
} from './useAuth0';

// Web Components Registration
export const registerAuth0WebComponents = () => {
  if (typeof window !== 'undefined') {
    // Import and register all web components
    import('./Auth0LoginButton').then(({ Auth0LoginButtonElement }) => {
      if (!customElements.get('auth0-login-button')) {
        customElements.define('auth0-login-button', Auth0LoginButtonElement);
      }
    });

    import('./Auth0LogoutButton').then(({ Auth0LogoutButtonElement }) => {
      if (!customElements.get('auth0-logout-button')) {
        customElements.define('auth0-logout-button', Auth0LogoutButtonElement);
      }
    });

    import('./Auth0UserProfile').then(({ Auth0UserProfileElement }) => {
      if (!customElements.get('auth0-user-profile')) {
        customElements.define('auth0-user-profile', Auth0UserProfileElement);
      }
    });
  }
};

// Types for TypeScript support
export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  updated_at: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface Auth0ContextType {
  user: Auth0User | null;
  isLoading: boolean;
  error?: Error;
  loginWithRedirect: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Constants
export const AUTH0_NAMESPACE = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || 'https://api.revivatech.com';

// Utility functions
export const getAuth0Config = () => ({
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
  scope: process.env.NEXT_PUBLIC_AUTH0_SCOPE || 'openid profile email'
});

export const isAuth0Configured = () => {
  const config = getAuth0Config();
  return !!(config.domain && config.clientId);
};