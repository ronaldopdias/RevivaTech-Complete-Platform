// Authentication components
export { default as LoginForm } from './LoginForm';
export { default as RegisterForm } from './RegisterForm';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as AuthGuard, AdminOnly, TechnicianOnly, CustomerOnly, AuthenticatedOnly, GuestOnly } from './AuthGuard';

// RBAC components
export { default as RBACProvider } from '../../lib/auth/rbac-context';
export { 
  RoleGuard, 
  PermissionGate, 
  CanCreate, 
  CanRead, 
  CanUpdate, 
  CanDelete,
  AdminGate,
  SuperAdminGate,
  TechnicianGate,
  CustomerGate,
  StaffGate,
  ManagementGate,
  MultiPermissionGate,
  withRole,
  usePermissionCheck
} from '../../lib/auth/role-guards';

// Role-based navigation
export { 
  default as RoleBasedNavigation,
  CustomerNavigation,
  TechnicianNavigation,
  AdminNavigation,
  SuperAdminNavigation
} from './RoleBasedNavigation';

// Role-based UI components
export {
  ActionButton,
  QuickActionsPanel,
  StatusIndicator,
  ResourceActions,
  DashboardWidget,
  RoleBasedDashboard,
  RoleBasedDataTable
} from './RoleBasedComponents';