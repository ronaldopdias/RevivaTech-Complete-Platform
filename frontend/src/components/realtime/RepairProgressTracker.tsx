/**
 * Real-Time Repair Progress Tracker Component
 * 
 * Provides live updates on repair progress with:
 * - Real-time status updates via WebSocket
 * - Visual progress indicators
 * - Step-by-step milestone tracking
 * - Estimated completion times
 * - Customer notifications
 * 
 * Configuration-driven architecture following Nordic design principles
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  bookingStatusService, 
  BookingProgress, 
  BookingStatus, 
  BookingMilestone,
  BookingStatusUpdate 
} from '@/services/booking-status.service';

interface RepairProgressTrackerProps {
  bookingId: string;
  className?: string;
  showTimeline?: boolean;
  showActions?: boolean;
  compact?: boolean;
  onStatusChange?: (status: BookingStatus) => void;
}

interface ProgressStepConfig {
  status: BookingStatus;
  title: string;
  description: string;
  icon: string;
  color: string;
  estimatedDuration: number; // minutes
}

// Configuration for progress steps
const progressSteps: ProgressStepConfig[] = [
  {
    status: 'pending',
    title: 'Booking Received',
    description: 'Your repair booking has been submitted',
    icon: '📝',
    color: 'blue',
    estimatedDuration: 0,
  },
  {
    status: 'confirmed',
    title: 'Booking Confirmed',
    description: 'Booking confirmed and assigned to technician',
    icon: '✅',
    color: 'green',
    estimatedDuration: 30,
  },
  {
    status: 'device-received',
    title: 'Device Received',
    description: 'Device received at our repair center',
    icon: '📦',
    color: 'blue',
    estimatedDuration: 60,
  },
  {
    status: 'diagnosis',
    title: 'Diagnosis in Progress',
    description: 'Technician examining device and identifying issues',
    icon: '🔍',
    color: 'orange',
    estimatedDuration: 120,
  },
  {
    status: 'diagnosis-complete',
    title: 'Diagnosis Complete',
    description: 'Issues identified, repair quote prepared',
    icon: '📋',
    color: 'blue',
    estimatedDuration: 30,
  },
  {
    status: 'quote-pending',
    title: 'Quote Pending',
    description: 'Awaiting your approval for repair quote',
    icon: '⏳',
    color: 'yellow',
    estimatedDuration: 0,
  },
  {
    status: 'quote-approved',
    title: 'Quote Approved',
    description: 'Quote approved, repair added to queue',
    icon: '👍',
    color: 'green',
    estimatedDuration: 15,
  },
  {
    status: 'repair-queued',
    title: 'Queued for Repair',
    description: 'Device in repair queue, waiting for technician',
    icon: '⏱️',
    color: 'orange',
    estimatedDuration: 240,
  },
  {
    status: 'repair-started',
    title: 'Repair Started',
    description: 'Technician has begun repair work',
    icon: '🔧',
    color: 'blue',
    estimatedDuration: 30,
  },
  {
    status: 'repair-progress',
    title: 'Repair in Progress',
    description: 'Active repair work being performed',
    icon: '⚡',
    color: 'orange',
    estimatedDuration: 180,
  },
  {
    status: 'repair-complete',
    title: 'Repair Complete',
    description: 'Repair work finished, starting quality testing',
    icon: '✨',
    color: 'green',
    estimatedDuration: 15,
  },
  {
    status: 'testing',
    title: 'Quality Testing',
    description: 'Testing device functionality and quality',
    icon: '🧪',
    color: 'blue',
    estimatedDuration: 60,
  },
  {
    status: 'ready-pickup',
    title: 'Ready for Pickup',
    description: 'Device ready for collection or delivery',
    icon: '🎉',
    color: 'green',
    estimatedDuration: 0,
  },
  {
    status: 'delivered',
    title: 'Delivered',
    description: 'Device delivered to customer',
    icon: '🚚',
    color: 'green',
    estimatedDuration: 0,
  },
  {
    status: 'completed',
    title: 'Completed',
    description: 'Repair completed successfully',
    icon: '🏆',
    color: 'green',
    estimatedDuration: 0,
  },
];

export const RepairProgressTracker: React.FC<RepairProgressTrackerProps> = ({
  bookingId,
  className,
  showTimeline = true,
  showActions = true,
  compact = false,
  onStatusChange,
}) => {
  const [progress, setProgress] = useState<BookingProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Handle booking progress updates
  const handleProgressUpdate = useCallback((updatedProgress: BookingProgress) => {
    setProgress(updatedProgress);
    setLastUpdate(new Date());
    setError(null);
    
    if (onStatusChange) {
      onStatusChange(updatedProgress.currentStatus);
    }
  }, [onStatusChange]);

  // Initialize real-time tracking
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeTracking = async () => {
      try {
        // Connect to booking status service
        await bookingStatusService.connect();
        setIsConnected(true);

        // Fetch initial progress
        const initialProgress = await bookingStatusService.getBookingProgress(bookingId);
        if (initialProgress) {
          setProgress(initialProgress);
          setLastUpdate(new Date());
        }

        // Subscribe to real-time updates
        unsubscribe = bookingStatusService.trackBooking(bookingId, handleProgressUpdate);
        
      } catch (err) {
        setError('Failed to connect to real-time updates');
        console.error('Error initializing progress tracking:', err);
      }
    };

    initializeTracking();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [bookingId, handleProgressUpdate]);

  // Get current step configuration
  const getCurrentStep = (): ProgressStepConfig | null => {
    if (!progress) return null;
    return progressSteps.find(step => step.status === progress.currentStatus) || null;
  };

  // Get step status (completed, current, pending)
  const getStepStatus = (step: ProgressStepConfig): 'completed' | 'current' | 'pending' => {
    if (!progress) return 'pending';
    
    const currentStepIndex = progressSteps.findIndex(s => s.status === progress.currentStatus);
    const stepIndex = progressSteps.findIndex(s => s.status === step.status);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  // Calculate estimated completion
  const getEstimatedCompletion = (): string | null => {
    if (!progress) return null;
    
    const currentStepIndex = progressSteps.findIndex(s => s.status === progress.currentStatus);
    if (currentStepIndex === -1) return null;
    
    const remainingSteps = progressSteps.slice(currentStepIndex + 1);
    const totalMinutes = remainingSteps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    
    if (totalMinutes === 0) return 'Complete';
    
    const estimatedDate = new Date(Date.now() + totalMinutes * 60 * 1000);
    return estimatedDate.toLocaleString();
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Connection Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading repair progress...</span>
        </div>
      </Card>
    );
  }

  const currentStep = getCurrentStep();
  const estimatedCompletion = getEstimatedCompletion();

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className={cn(
            'font-bold',
            compact ? 'text-lg' : 'text-xl'
          )}>
            Repair Progress
          </h2>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}></div>
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Booking: {bookingId}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {formatRelativeTime(lastUpdate.getTime())}
            </span>
          )}
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        {currentStep && (
          <div className="flex items-center space-x-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-3xl">{currentStep.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
              {estimatedCompletion && estimatedCompletion !== 'Complete' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated completion: {estimatedCompletion}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {progress.progressPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      {showTimeline && !compact && (
        <div className="space-y-4">
          <h3 className="font-semibold">Progress Timeline</h3>
          <div className="space-y-3">
            {progressSteps.map((step, index) => {
              const stepStatus = getStepStatus(step);
              const isLast = index === progressSteps.length - 1;
              
              return (
                <div key={step.status} className="flex items-start space-x-3">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                      stepStatus === 'completed' 
                        ? 'bg-green-500 text-white'
                        : stepStatus === 'current'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {stepStatus === 'completed' ? '✓' : step.icon}
                    </div>
                    {!isLast && (
                      <div className={cn(
                        'w-0.5 h-8 mt-1',
                        stepStatus === 'completed' ? 'bg-green-200' : 'bg-muted'
                      )}></div>
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 pb-4">
                    <h4 className={cn(
                      'font-medium',
                      stepStatus === 'current' ? 'text-primary' : 'text-foreground'
                    )}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {stepStatus === 'completed' && progress.statusHistory.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed {formatRelativeTime(progress.statusHistory.find(h => h.status === step.status)?.timestamp || 0)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
            {progress.currentStatus === 'quote-pending' && (
              <>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => {/* Handle quote approval */}}
                >
                  Approve Quote
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {/* Handle quote rejection */}}
                >
                  Reject Quote
                </Button>
              </>
            )}
            {progress.currentStatus === 'ready-pickup' && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {/* Handle pickup scheduling */}}
              >
                Schedule Pickup
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default RepairProgressTracker;