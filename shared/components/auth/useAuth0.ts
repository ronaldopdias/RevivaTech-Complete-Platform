import { useAuth0 as useAuth0Core } from './Auth0Provider';

// Re-export the main hook
export const useAuth0 = useAuth0Core;

// Additional utility hooks for specific use cases
export const useAuth0User = () => {
  const { user, isLoading, isAuthenticated } = useAuth0Core();
  return { user, isLoading, isAuthenticated };
};

export const useAuth0Actions = () => {
  const { loginWithRedirect, logout } = useAuth0Core();
  return { loginWithRedirect, logout };
};

export const useAuth0Status = () => {
  const { isAuthenticated, isLoading, error } = useAuth0Core();
  return { isAuthenticated, isLoading, error };
};

// Hook for role-based access control
export const useAuth0Roles = () => {
  const { user, isAuthenticated, isLoading } = useAuth0Core();
  
  const getUserRoles = () => {
    if (!isAuthenticated || !user) return [];
    return user[`${process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}/roles`] || [];
  };

  const hasRole = (role: string) => {
    const roles = getUserRoles();
    return roles.includes(role);
  };

  const hasAnyRole = (roles: string[]) => {
    const userRoles = getUserRoles();
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles: string[]) => {
    const userRoles = getUserRoles();
    return roles.every(role => userRoles.includes(role));
  };

  return {
    isLoading,
    isAuthenticated,
    getUserRoles,
    hasRole,
    hasAnyRole,
    hasAllRoles
  };
};

// Hook for conditional rendering based on auth state
export const useAuth0Conditional = () => {
  const { isAuthenticated, isLoading } = useAuth0Core();

  const whenAuthenticated = (component: React.ReactNode) => {
    return isAuthenticated ? component : null;
  };

  const whenNotAuthenticated = (component: React.ReactNode) => {
    return !isAuthenticated && !isLoading ? component : null;
  };

  const whenLoading = (component: React.ReactNode) => {
    return isLoading ? component : null;
  };

  return {
    whenAuthenticated,
    whenNotAuthenticated,
    whenLoading
  };
};

// Hook for Auth0 metadata
export const useAuth0Metadata = () => {
  const { user, isAuthenticated } = useAuth0Core();

  const getMetadata = (key?: string) => {
    if (!isAuthenticated || !user) return null;
    
    const metadata = user[`${process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}/metadata`] || {};
    return key ? metadata[key] : metadata;
  };

  const getUserMetadata = (key?: string) => {
    if (!isAuthenticated || !user) return null;
    
    const userMetadata = user.user_metadata || {};
    return key ? userMetadata[key] : userMetadata;
  };

  const getAppMetadata = (key?: string) => {
    if (!isAuthenticated || !user) return null;
    
    const appMetadata = user.app_metadata || {};
    return key ? appMetadata[key] : appMetadata;
  };

  return {
    getMetadata,
    getUserMetadata,
    getAppMetadata
  };
};