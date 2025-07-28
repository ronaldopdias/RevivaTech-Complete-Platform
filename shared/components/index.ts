// Shared component library exports
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export { ThemeProvider, useTheme } from './ThemeProvider';

// Newly added shared components
export { 
  LoadingSpinner, 
  ButtonLoadingSpinner, 
  PageLoadingSpinner, 
  InlineLoadingSpinner, 
  CardLoadingSpinner, 
  ProcessingSpinner 
} from './LoadingSpinner';
export { default as ClientOnly } from './ClientOnly';

// UI Components
export { Badge } from './ui/badge';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Auth0 Components
export {
  Auth0Provider,
  Auth0LoginButton,
  Auth0LoginButtonElement,
  Auth0LogoutButton,
  Auth0LogoutButtonElement,
  Auth0UserProfile,
  Auth0UserProfileElement,
  Auth0ProtectedRoute,
  withAuth0Protection,
  useAuth0Protection,
  useAuth0,
  useAuth0User,
  useAuth0Actions,
  useAuth0Status,
  useAuth0Roles,
  useAuth0Conditional,
  useAuth0Metadata,
  registerAuth0WebComponents,
  getAuth0Config,
  isAuth0Configured
} from './auth';