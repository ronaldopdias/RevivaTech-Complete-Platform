'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePermissions } from '@/hooks/usePermissions';
import { AdminGate, TechnicianGate, CustomerGate, StaffGate, ManagementGate, PermissionGate } from '@/lib/auth/role-guards';
import { UserRole } from '@/lib/auth/types';
import { 
  Calendar, 
  Wrench, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  BarChart3, 
  Settings, 
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

// Action Button with permission checking
interface ActionButtonProps {
  resource: string;
  action: string;
  resourceData?: any;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  icon?: React.ComponentType<any>;
  requireAll?: boolean;
  permissions?: Array<{ resource: string; action: string }>;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  resource,
  action,
  resourceData,
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  icon: Icon,
  requireAll = true,
  permissions,
  ...props
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  // Check single permission or multiple permissions
  const hasRequiredPermission = permissions
    ? (requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions))
    : hasPermission(resource, action, resourceData);

  if (!hasRequiredPermission) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
};

// Quick Actions Panel based on role
export const QuickActionsPanel: React.FC = () => {
  const permissions = usePermissions();

  if (!permissions.isAuthenticated) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        
        {/* Customer Actions */}
        <CustomerGate>
          <ActionButton
            resource="bookings"
            action="create"
            variant="primary"
            icon={Calendar}
          >
            Book Repair
          </ActionButton>
          
          <ActionButton
            resource="messages"
            action="create"
            variant="outline"
            icon={MessageSquare}
          >
            Contact Support
          </ActionButton>
        </CustomerGate>

        {/* Technician Actions */}
        <TechnicianGate>
          <ActionButton
            resource="repairs"
            action="update"
            variant="primary"
            icon={Wrench}
          >
            Update Repair
          </ActionButton>
          
          <ActionButton
            resource="inventory"
            action="request"
            variant="outline"
            icon={Package}
          >
            Request Parts
          </ActionButton>
          
          <ActionButton
            resource="schedule"
            action="read:own"
            variant="outline"
            icon={Calendar}
          >
            View Schedule
          </ActionButton>
        </TechnicianGate>

        {/* Admin Actions */}
        <AdminGate>
          <ActionButton
            resource="customers"
            action="create"
            variant="primary"
            icon={Users}
          >
            Add Customer
          </ActionButton>
          
          <ActionButton
            resource="technicians"
            action="create"
            variant="primary"
            icon={Users}
          >
            Add Technician
          </ActionButton>
          
          <ActionButton
            resource="reports"
            action="create"
            variant="outline"
            icon={BarChart3}
          >
            Generate Report
          </ActionButton>
          
          <ActionButton
            resource="quotes"
            action="create"
            variant="outline"
            icon={FileText}
          >
            Create Quote
          </ActionButton>
        </AdminGate>

        {/* Management Actions */}
        <ManagementGate>
          <ActionButton
            resource="settings"
            action="update"
            variant="outline"
            icon={Settings}
          >
            System Settings
          </ActionButton>
          
          <ActionButton
            resource="analytics"
            action="read"
            variant="outline"
            icon={TrendingUp}
          >
            Analytics
          </ActionButton>
        </ManagementGate>

        {/* Super Admin Actions */}
        <PermissionGate resource="users" action="create">
          <ActionButton
            resource="users"
            action="create"
            variant="primary"
            icon={Shield}
          >
            Manage Users
          </ActionButton>
        </PermissionGate>
      </div>
    </Card>
  );
};

// Status indicators based on role
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  children: React.ReactNode;
  showIcon?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  children,
  showIcon = true,
}) => {
  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    info: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    pending: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${config.color} ${config.bg}`}>
      {showIcon && <IconComponent className="h-4 w-4 mr-1" />}
      {children}
    </div>
  );
};

// Resource Actions Menu (Create, Read, Update, Delete)
interface ResourceActionsProps {
  resource: string;
  resourceData?: any;
  resourceId?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreate?: () => void;
  compact?: boolean;
}

export const ResourceActions: React.FC<ResourceActionsProps> = ({
  resource,
  resourceData,
  resourceId,
  onView,
  onEdit,
  onDelete,
  onCreate,
  compact = false,
}) => {
  const permissions = usePermissions();

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <PermissionGate resource={resource} action="read" resourceData={resourceData}>
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
        </PermissionGate>
        
        <PermissionGate resource={resource} action="update" resourceData={resourceData}>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </PermissionGate>
        
        <PermissionGate resource={resource} action="delete" resourceData={resourceData}>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </PermissionGate>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <PermissionGate resource={resource} action="create">
        <ActionButton
          resource={resource}
          action="create"
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onCreate}
        >
          Create
        </ActionButton>
      </PermissionGate>
      
      <PermissionGate resource={resource} action="read" resourceData={resourceData}>
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      </PermissionGate>
      
      <PermissionGate resource={resource} action="update" resourceData={resourceData}>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </PermissionGate>
      
      <PermissionGate resource={resource} action="delete" resourceData={resourceData}>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </PermissionGate>
    </div>
  );
};

// Role-based dashboard widgets
export const DashboardWidget: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<any>;
  requiredPermission?: { resource: string; action: string };
}> = ({ title, value, change, trend, icon: Icon, requiredPermission }) => {
  const permissions = usePermissions();

  // Check permission if required
  if (requiredPermission && !permissions.hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null;
  }

  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }[trend || 'neutral'];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p className={`text-sm ${trendColor}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
};

// Role-based dashboard
export const RoleBasedDashboard: React.FC = () => {
  const permissions = usePermissions();

  if (!permissions.isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* Customer Dashboard */}
      <CustomerGate>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardWidget
            title="Active Repairs"
            value="3"
            icon={Wrench}
            requiredPermission={{ resource: 'repairs', action: 'read:own' }}
          />
          <DashboardWidget
            title="Pending Quotes"
            value="2"
            icon={FileText}
            requiredPermission={{ resource: 'quotes', action: 'read:own' }}
          />
          <DashboardWidget
            title="Total Spent"
            value="£1,245"
            icon={DollarSign}
            requiredPermission={{ resource: 'invoices', action: 'read:own' }}
          />
          <DashboardWidget
            title="Satisfaction"
            value="4.8★"
            icon={Star}
          />
        </div>
      </CustomerGate>

      {/* Technician Dashboard */}
      <TechnicianGate>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardWidget
            title="Assigned Repairs"
            value="8"
            icon={Wrench}
            requiredPermission={{ resource: 'repairs', action: 'read' }}
          />
          <DashboardWidget
            title="Completed Today"
            value="3"
            change="+1 from yesterday"
            trend="up"
            icon={CheckCircle}
          />
          <DashboardWidget
            title="Average Time"
            value="2.5h"
            change="-0.3h from last week"
            trend="up"
            icon={Clock}
          />
          <DashboardWidget
            title="Rating"
            value="4.9★"
            icon={Star}
          />
        </div>
      </TechnicianGate>

      {/* Admin Dashboard */}
      <AdminGate>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardWidget
            title="Total Customers"
            value="1,247"
            change="+12% this month"
            trend="up"
            icon={Users}
            requiredPermission={{ resource: 'customers', action: 'read' }}
          />
          <DashboardWidget
            title="Active Repairs"
            value="45"
            icon={Wrench}
            requiredPermission={{ resource: 'repairs', action: 'read' }}
          />
          <DashboardWidget
            title="Revenue"
            value="£23,450"
            change="+8% this month"
            trend="up"
            icon={DollarSign}
            requiredPermission={{ resource: 'analytics', action: 'read' }}
          />
          <DashboardWidget
            title="Efficiency"
            value="94%"
            change="+2% this week"
            trend="up"
            icon={TrendingUp}
            requiredPermission={{ resource: 'analytics', action: 'read' }}
          />
        </div>
      </AdminGate>

      {/* Quick Actions Panel */}
      <QuickActionsPanel />
    </div>
  );
};

// Data table with role-based actions
interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  resource: string;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<any>;
    permission: { resource: string; action: string };
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive';
  }>;
}

export function RoleBasedDataTable<T extends { id: string }>({
  data,
  columns,
  resource,
  onView,
  onEdit,
  onDelete,
  actions = [],
}: DataTableProps<T>) {
  const permissions = usePermissions();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-muted/50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {column.render ? column.render(item[column.key as keyof T], item) : String(item[column.key as keyof T])}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <ResourceActions
                    resource={resource}
                    resourceData={item}
                    onView={() => onView?.(item)}
                    onEdit={() => onEdit?.(item)}
                    onDelete={() => onDelete?.(item)}
                    compact
                  />
                  
                  {/* Custom actions */}
                  {actions.map((action, index) => (
                    <PermissionGate
                      key={index}
                      resource={action.permission.resource}
                      action={action.permission.action}
                      resourceData={item}
                    >
                      <Button
                        variant={action.variant || 'ghost'}
                        size="sm"
                        onClick={() => action.onClick(item)}
                      >
                        {action.icon && <action.icon className="h-4 w-4" />}
                      </Button>
                    </PermissionGate>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RoleBasedDashboard;