'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useWebSocket, useWebSocketSubscription } from '@/hooks/useWebSocket';

interface RealtimeSchedulerProps {
  onSlotSelected?: (slot: TimeSlot) => void;
  onAvailabilityUpdate?: (availability: AvailabilityData) => void;
  serviceType: 'postal' | 'pickup' | 'in_store';
  estimatedDuration: number; // in minutes
  preferredDate?: string;
  technicianId?: string;
  sessionId?: string;
  className?: string;
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  technicianId: string;
  technicianName: string;
  available: boolean;
  bookingType: 'postal' | 'pickup' | 'in_store';
  estimatedDuration: number;
  capacity: number;
  currentBookings: number;
  priority: 'standard' | 'priority' | 'emergency';
  cost?: number;
  location?: string;
}

interface AvailabilityData {
  date: string;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  nextAvailable?: string;
  busyPeriods: Array<{ start: string; end: string; reason: string }>;
}

interface TechnicianInfo {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  status: 'available' | 'busy' | 'offline';
  currentLoad: number;
  maxCapacity: number;
  location?: string;
}

interface SchedulingFilters {
  dateRange: { start: string; end: string };
  timePreference: 'morning' | 'afternoon' | 'evening' | 'any';
  technicianPreference?: string;
  priorityLevel: 'standard' | 'priority' | 'emergency';
  locationRadius?: number; // for pickup/delivery
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function RealtimeScheduler({
  onSlotSelected,
  onAvailabilityUpdate,
  serviceType,
  estimatedDuration,
  preferredDate,
  technicianId,
  sessionId: providedSessionId,
  className
}: RealtimeSchedulerProps) {
  const [availability, setAvailability] = useState<Record<string, AvailabilityData>>({});
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [filters, setFilters] = useState<SchedulingFilters>({
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    timePreference: 'any',
    priorityLevel: 'standard',
  });

  const { isConnected, sendMessage } = useWebSocket();

  // Generate session ID if not provided
  const sessionId = useMemo(() => {
    if (providedSessionId) return providedSessionId;
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('scheduler_session_id');
      if (!id) {
        id = `scheduler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('scheduler_session_id', id);
      }
      return id;
    }
    return `scheduler_${Date.now()}`;
  }, [providedSessionId]);

  // Real-time availability updates
  useWebSocketSubscription('availability_update', (data: { sessionId: string; availability: AvailabilityData[] }) => {
    if (data.sessionId === sessionId) {
      const availabilityMap: Record<string, AvailabilityData> = {};
      data.availability.forEach(dayData => {
        availabilityMap[dayData.date] = dayData;
      });
      setAvailability(availabilityMap);
      setLoading(false);
      setError(null);

      if (onAvailabilityUpdate) {
        data.availability.forEach(dayData => onAvailabilityUpdate(dayData));
      }
    }
  });

  // Real-time technician status updates
  useWebSocketSubscription('technician_status_update', (data: { technicians: TechnicianInfo[] }) => {
    setTechnicians(data.technicians);
  });

  // Real-time slot booking confirmations
  useWebSocketSubscription('slot_booked', (data: { sessionId: string; slotId: string; technicianId: string }) => {
    if (data.sessionId === sessionId) {
      // Update availability to reflect the booking
      requestAvailability();
    }
  });

  // Real-time slot cancellations
  useWebSocketSubscription('slot_cancelled', (data: { slotId: string; technicianId: string; date: string }) => {
    // Update availability to reflect the cancellation
    requestAvailability();
  });

  // Error handling
  useWebSocketSubscription('availability_error', (data: { sessionId: string; error: string }) => {
    if (data.sessionId === sessionId) {
      setError(data.error);
      setLoading(false);
    }
  });

  // Request availability data
  const requestAvailability = useCallback(() => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);

    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)

    sendMessage({
      type: 'availability_request',
      payload: {
        sessionId,
        dateRange: {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0]
        },
        serviceType,
        estimatedDuration,
        technicianId,
        filters,
      },
      timestamp: new Date().toISOString()
    });
  }, [isConnected, currentWeek, serviceType, estimatedDuration, technicianId, filters, sendMessage, sessionId]);

  // Request technician information
  const requestTechnicians = useCallback(() => {
    if (!isConnected) return;

    sendMessage({
      type: 'technician_list_request',
      payload: {
        serviceType,
        location: filters.locationRadius ? 'user_location' : undefined,
        specialties: [],
      },
      timestamp: new Date().toISOString()
    });
  }, [isConnected, serviceType, filters.locationRadius, sendMessage]);

  // Load availability when component mounts or dependencies change
  useEffect(() => {
    if (isConnected) {
      requestAvailability();
      requestTechnicians();
    }
  }, [requestAvailability, requestTechnicians]);

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeek]);

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;

    setSelectedSlot(slot);
    if (onSlotSelected) {
      onSlotSelected(slot);
    }

    // Optimistically book the slot via WebSocket
    if (isConnected) {
      sendMessage({
        type: 'slot_hold_request',
        payload: {
          sessionId,
          slotId: slot.id,
          holdDuration: 300, // Hold for 5 minutes
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  const confirmBooking = () => {
    if (!selectedSlot || !isConnected) return;

    sendMessage({
      type: 'slot_booking_confirm',
      payload: {
        sessionId,
        slotId: selectedSlot.id,
        customerInfo: {}, // This would come from parent component
      },
      timestamp: new Date().toISOString()
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getSlotAvailability = (date: Date, timeSlot: string): TimeSlot | null => {
    const dateStr = date.toISOString().split('T')[0];
    const dayAvailability = availability[dateStr];
    
    if (!dayAvailability) return null;
    
    return dayAvailability.slots.find(slot => 
      slot.startTime === timeSlot
    ) || null;
  };

  const getSlotColor = (slot: TimeSlot | null): string => {
    if (!slot) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (!slot.available) return 'bg-red-100 text-red-600 cursor-not-allowed';
    if (selectedSlot?.id === slot.id) return 'bg-blue-600 text-white';
    if (slot.currentBookings === 0) return 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer';
    if (slot.currentBookings < slot.capacity) return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer';
    return 'bg-red-100 text-red-600 cursor-not-allowed';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getTechnicianBadgeColor = (status: string): string => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-yellow-100 text-yellow-700';
      case 'offline': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-gray-600">
            {isConnected ? 'Real-time scheduling active' : 'Offline mode'}
          </span>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading availability...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Scheduling Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Preference
            </label>
            <select
              value={filters.timePreference}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                timePreference: e.target.value as any
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="any">Any Time</option>
              <option value="morning">Morning (9AM-12PM)</option>
              <option value="afternoon">Afternoon (12PM-5PM)</option>
              <option value="evening">Evening (5PM-6PM)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={filters.priorityLevel}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priorityLevel: e.target.value as any
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="standard">Standard</option>
              <option value="priority">Priority (+£20)</option>
              <option value="emergency">Emergency (+£50)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={requestAvailability}
              disabled={!isConnected || loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Update Availability'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Technician Status */}
      {technicians.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-4">Available Technicians</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{tech.name}</div>
                  <div className="text-xs text-gray-600">
                    {tech.specialties.join(', ')} • ⭐ {tech.rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Load: {tech.currentLoad}/{tech.maxCapacity}
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getTechnicianBadgeColor(tech.status)
                )}>
                  {tech.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Select Appointment Time
          </h3>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              ← Previous Week
            </Button>
            <span className="text-sm text-gray-600 min-w-[120px] text-center">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              Next Week →
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="font-medium text-gray-700 text-sm">Time</div>
              {weekDates.map((date, index) => (
                <div key={index} className="text-center">
                  <div className="font-medium text-gray-900 text-sm">
                    {DAYS_OF_WEEK[date.getDay()]}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDate(date)}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-1">
              {TIME_SLOTS.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-2">
                  <div className="font-medium text-gray-700 text-sm py-2">
                    {timeSlot}
                  </div>
                  {weekDates.map((date, index) => {
                    const slot = getSlotAvailability(date, timeSlot);
                    return (
                      <button
                        key={index}
                        onClick={() => slot && handleSlotSelect(slot)}
                        className={cn(
                          "py-2 px-2 rounded text-xs font-medium transition-colors",
                          getSlotColor(slot)
                        )}
                        disabled={!slot || !slot.available}
                        title={
                          slot 
                            ? `${slot.technicianName} - ${slot.available ? 'Available' : 'Booked'} - ${slot.currentBookings}/${slot.capacity} bookings`
                            : 'No availability'
                        }
                      >
                        {slot ? (
                          <div className="space-y-1">
                            <div>{slot.technicianName.split(' ')[0]}</div>
                            {slot.cost && (
                              <div className="text-xs">£{slot.cost}</div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Limited availability</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-600">Fully booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Selected</span>
          </div>
        </div>
      </Card>

      {/* Selected Slot Details */}
      {selectedSlot && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Appointment
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Date & Time:</span>
                <p className="text-gray-900">
                  {new Date(selectedSlot.date).toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-gray-900">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Technician:</span>
                <p className="text-gray-900">{selectedSlot.technicianName}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Service Type:</span>
                <p className="text-gray-900 capitalize">{selectedSlot.bookingType.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Duration:</span>
                <p className="text-gray-900">{selectedSlot.estimatedDuration} minutes</p>
              </div>
              
              {selectedSlot.cost && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Cost:</span>
                  <p className="text-gray-900">£{selectedSlot.cost}</p>
                </div>
              )}
              
              {selectedSlot.location && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Location:</span>
                  <p className="text-gray-900">{selectedSlot.location}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={confirmBooking}
              disabled={!isConnected}
              className="flex-1"
            >
              Confirm Booking
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedSlot(null)}
              className="flex-1"
            >
              Change Selection
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}