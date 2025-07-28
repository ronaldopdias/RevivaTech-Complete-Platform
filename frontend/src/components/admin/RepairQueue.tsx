"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Download, 
  Grid3X3, 
  List, 
  Calendar,
  Clock,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  MoreHorizontal,
  UserCheck,
  Timer,
  TrendingUp,
  Activity
} from 'lucide-react';

interface RepairTicket {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  device: string;
  brand: string;
  model: string;
  issue: string;
  description?: string;
  status: 'pending' | 'diagnosed' | 'in-progress' | 'waiting-parts' | 'completed' | 'ready-pickup' | 'picked-up' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTechnician?: string;
  technicianId?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedTime?: number; // in hours
  actualTime?: number; // in hours
  dateCreated: Date;
  dateAssigned?: Date;
  dateStarted?: Date;
  dateCompleted?: Date;
  dueDate?: Date;
  notes?: string;
  tags?: string[];
  partsRequired?: string[];
  warrantyInfo?: {
    hasWarranty: boolean;
    warrantyType?: string;
    expiryDate?: Date;
  };
  images?: string[];
  diagnosticResults?: string;
  completionNotes?: string;
}

interface RepairQueueProps {
  tickets?: RepairTicket[];
  loading?: boolean;
  onTicketSelect?: (ticket: RepairTicket) => void;
  onStatusUpdate?: (ticketId: string, status: RepairTicket['status']) => void;
  onTechnicianAssign?: (ticketId: string, technicianId: string) => void;
  onBulkUpdate?: (ticketIds: string[], updates: Partial<RepairTicket>) => void;
  className?: string;
}

interface QueueStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  avgRepairTime: number;
  totalRevenue: number;
  completionRate: number;
}

type ViewMode = 'list' | 'kanban' | 'calendar';

interface Technician {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  activeTickets: number;
  completionRate: number;
  avgRepairTime: number;
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: <Clock className="w-3 h-3" />,
    description: 'Awaiting diagnosis'
  },
  diagnosed: { 
    label: 'Diagnosed', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: <Eye className="w-3 h-3" />,
    description: 'Issue identified'
  },
  'in-progress': { 
    label: 'In Progress', 
    color: 'bg-professional-100 text-professional-800 border-professional-200', 
    icon: <Activity className="w-3 h-3" />,
    description: 'Currently being repaired'
  },
  'waiting-parts': { 
    label: 'Waiting Parts', 
    color: 'bg-orange-100 text-orange-800 border-orange-200', 
    icon: <Timer className="w-3 h-3" />,
    description: 'Parts on order'
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: <CheckCircle className="w-3 h-3" />,
    description: 'Repair finished'
  },
  'ready-pickup': { 
    label: 'Ready for Pickup', 
    color: 'bg-trust-100 text-trust-800 border-trust-200', 
    icon: <UserCheck className="w-3 h-3" />,
    description: 'Ready for customer'
  },
  'picked-up': { 
    label: 'Picked Up', 
    color: 'bg-neutral-100 text-neutral-800 border-neutral-200', 
    icon: <CheckCircle className="w-3 h-3" />,
    description: 'Collected by customer'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: <AlertTriangle className="w-3 h-3" />,
    description: 'Repair cancelled'
  },
};

const priorityConfig = {
  low: { 
    label: 'Low', 
    color: 'text-green-600 bg-green-50 border-green-200', 
    icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
    weight: 1
  },
  medium: { 
    label: 'Medium', 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    icon: <div className="w-2 h-2 bg-yellow-500 rounded-full" />,
    weight: 2
  },
  high: { 
    label: 'High', 
    color: 'text-orange-600 bg-orange-50 border-orange-200', 
    icon: <div className="w-2 h-2 bg-orange-500 rounded-full" />,
    weight: 3
  },
  urgent: { 
    label: 'Urgent', 
    color: 'text-red-600 bg-red-50 border-red-200', 
    icon: <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />,
    weight: 4
  },
};

// Mock technicians data
const mockTechnicians: Technician[] = [
  {
    id: 'tech-1',
    name: 'Sarah Chen',
    email: 'sarah@revivatech.co.uk',
    specialties: ['Apple', 'Samsung', 'Screen Repair'],
    activeTickets: 3,
    completionRate: 98,
    avgRepairTime: 2.5
  },
  {
    id: 'tech-2',
    name: 'Mike Johnson',
    email: 'mike@revivatech.co.uk',
    specialties: ['iPhone', 'iPad', 'Data Recovery'],
    activeTickets: 2,
    completionRate: 95,
    avgRepairTime: 3.1
  },
  {
    id: 'tech-3',
    name: 'Alex Rodriguez',
    email: 'alex@revivatech.co.uk',
    specialties: ['Android', 'Laptop', 'Hardware'],
    activeTickets: 4,
    completionRate: 92,
    avgRepairTime: 4.2
  },
  {
    id: 'tech-4',
    name: 'Emma Wilson',
    email: 'emma@revivatech.co.uk',
    specialties: ['MacBook', 'Dell', 'Software'],
    activeTickets: 1,
    completionRate: 97,
    avgRepairTime: 2.8
  }
];

const mockTickets: RepairTicket[] = [
  {
    id: 'REP-001',
    referenceNumber: 'REV-A1B2C3',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    device: 'MacBook Pro',
    model: '16" M3 2023',
    issue: 'Screen flickering and keyboard not responsive',
    status: 'in-progress',
    priority: 'high',
    assignedTechnician: 'Sarah Chen',
    estimatedCost: 320,
    dateCreated: new Date('2024-01-15'),
    dueDate: new Date('2024-01-18'),
    notes: 'Customer reported issues started after recent macOS update',
  },
  {
    id: 'REP-002',
    referenceNumber: 'REV-D4E5F6',
    customerName: 'Maria Garcia',
    customerEmail: 'maria.garcia@email.com',
    device: 'iPhone',
    model: '15 Pro',
    issue: 'Cracked screen replacement',
    status: 'waiting-parts',
    priority: 'medium',
    assignedTechnician: 'Mike Johnson',
    estimatedCost: 180,
    dateCreated: new Date('2024-01-14'),
    dueDate: new Date('2024-01-16'),
  },
  {
    id: 'REP-003',
    referenceNumber: 'REV-G7H8I9',
    customerName: 'David Wilson',
    device: 'Dell XPS',
    model: '13 Plus 2023',
    issue: 'Won\'t boot, suspected hard drive failure',
    status: 'diagnosed',
    priority: 'urgent',
    estimatedCost: 280,
    dateCreated: new Date('2024-01-13'),
    dueDate: new Date('2024-01-15'),
    notes: 'Data recovery required, customer has important work files',
  },
  {
    id: 'REP-004',
    referenceNumber: 'REV-J1K2L3',
    customerName: 'Emma Thompson',
    device: 'iPad Air',
    model: '5th Generation',
    issue: 'Battery draining quickly',
    status: 'completed',
    priority: 'low',
    assignedTechnician: 'Alex Rodriguez',
    estimatedCost: 120,
    actualCost: 115,
    dateCreated: new Date('2024-01-12'),
    dueDate: new Date('2024-01-14'),
  },
  {
    id: 'REP-005',
    referenceNumber: 'REV-M4N5O6',
    customerName: 'Robert Brown',
    device: 'Samsung Galaxy',
    model: 'S24 Ultra',
    issue: 'Camera not working properly',
    status: 'pending',
    priority: 'medium',
    dateCreated: new Date('2024-01-15'),
    dueDate: new Date('2024-01-17'),
  },
];

export const RepairQueue: React.FC<RepairQueueProps> = ({
  tickets = mockTickets,
  loading = false,
  onTicketSelect,
  onStatusUpdate,
  className,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = selectedStatus === 'all' || ticket.status === selectedStatus;
    const priorityMatch = selectedPriority === 'all' || ticket.priority === selectedPriority;
    return statusMatch && priorityMatch;
  });

  const getStatusCount = (status: string) => {
    if (status === 'all') return tickets.length;
    return tickets.filter(ticket => ticket.status === status).length;
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-3 bg-muted rounded w-40"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Repair Queue</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTickets.length} of {tickets.length} repairs
          </p>
        </div>
        <Button>
          + New Repair
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[120px]"
          >
            <option value="all">All ({getStatusCount('all')})</option>
            {Object.entries(statusConfig).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label} ({getStatusCount(status)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[120px]"
          >
            <option value="all">All Priorities</option>
            {Object.entries(priorityConfig).map(([priority, config]) => (
              <option key={priority} value={priority}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="font-medium mb-2">No repairs found</h4>
            <p className="text-sm text-muted-foreground">
              No repair tickets match your current filters
            </p>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const statusInfo = statusConfig[ticket.status];
            const priorityInfo = priorityConfig[ticket.priority];
            const isOverdue = ticket.dueDate && new Date() > ticket.dueDate;

            return (
              <Card
                key={ticket.id}
                className={cn(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  isOverdue && 'border-destructive/50 bg-destructive/5'
                )}
                onClick={() => onTicketSelect?.(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {ticket.referenceNumber}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                          statusInfo.color
                        )}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium',
                          priorityInfo.color
                        )}>
                          {priorityInfo.icon} {priorityInfo.label}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                            🚨 Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Device Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{ticket.customerName}</div>
                        {ticket.customerEmail && (
                          <div className="text-muted-foreground text-xs">
                            {ticket.customerEmail}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{ticket.device}</div>
                        <div className="text-muted-foreground text-xs">
                          {ticket.model}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Issue</div>
                        <div className="text-muted-foreground text-xs line-clamp-2">
                          {ticket.issue}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {ticket.assignedTechnician && (
                        <span>👤 {ticket.assignedTechnician}</span>
                      )}
                      <span>📅 Created {ticket.dateCreated.toLocaleDateString()}</span>
                      {ticket.dueDate && (
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          ⏰ Due {ticket.dueDate.toLocaleDateString()}
                        </span>
                      )}
                      {ticket.estimatedCost && (
                        <span>💰 £{ticket.estimatedCost}</span>
                      )}
                    </div>

                    {ticket.notes && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        📝 {ticket.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div className="flex items-center gap-2">
                    {onStatusUpdate && (
                      <select
                        value={ticket.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(ticket.id, e.target.value as RepairTicket['status']);
                        }}
                        className="px-2 py-1 text-xs border border-input bg-background rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <option key={status} value={status}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle more actions
                      }}
                    >
                      ⋮
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Load More */}
      {filteredTickets.length > 0 && filteredTickets.length >= 10 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Repairs
          </Button>
        </div>
      )}
    </div>
  );
};

export default RepairQueue;