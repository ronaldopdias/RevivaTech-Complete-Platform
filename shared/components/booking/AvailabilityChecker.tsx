'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  MapPin,
  Package,
  Zap,
  Calendar
} from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  technicianId: string;
  technicianName: string;
  serviceType: 'dropoff' | 'pickup' | 'express';
  location?: string;
  estimatedDuration: number; // in minutes
  capacity: {
    current: number;
    maximum: number;
  };
}

interface AvailabilityRequest {
  serviceType: 'dropoff' | 'pickup' | 'express';
  deviceCategory: string;
  repairType: string;
  urgency: 'standard' | 'urgent' | 'express';
  location?: {
    postcode: string;
    distance?: number;
  };
}

interface AvailabilityCheckerProps {
  request: AvailabilityRequest;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot;
}

// Mock availability data generator
const generateAvailabilitySlots = (request: AvailabilityRequest): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const now = new Date();
  const technicians = [
    { id: 'tech1', name: 'John Smith', specialty: 'Apple' },
    { id: 'tech2', name: 'Sarah Johnson', specialty: 'Android' },
    { id: 'tech3', name: 'Mike Chen', specialty: 'PC/Laptop' },
    { id: 'tech4', name: 'Emma Wilson', specialty: 'Gaming' }
  ];

  // Generate slots for next 14 days
  for (let day = 0; day < 14; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    
    // Skip weekends for pickup service
    if (request.serviceType === 'pickup' && (date.getDay() === 0 || date.getDay() === 6)) {
      continue;
    }

    const dateStr = date.toISOString().split('T')[0];
    
    // Generate time slots based on service type
    const timeSlots = request.serviceType === 'express' 
      ? ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      : ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

    timeSlots.forEach(time => {
      technicians.forEach(tech => {
        // Simulate availability based on various factors
        const isAvailable = Math.random() > 0.4;
        const currentCapacity = Math.floor(Math.random() * 3);
        const maxCapacity = request.serviceType === 'express' ? 2 : 4;

        if (isAvailable && currentCapacity < maxCapacity) {
          slots.push({
            id: `${dateStr}-${time}-${tech.id}`,
            date: dateStr,
            time,
            available: true,
            technicianId: tech.id,
            technicianName: tech.name,
            serviceType: request.serviceType,
            location: request.serviceType === 'pickup' ? request.location?.postcode : '123 High Street, London',
            estimatedDuration: request.urgency === 'express' ? 30 : 45,
            capacity: {
              current: currentCapacity,
              maximum: maxCapacity
            }
          });
        }
      });
    });
  }

  return slots.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
};

export const AvailabilityChecker: React.FC<AvailabilityCheckerProps> = ({
  request,
  onSlotSelect,
  selectedSlot
}) => {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const slots = generateAvailabilitySlots(request);
      setAvailabilitySlots(slots);
      setLastChecked(new Date());
      
      if (slots.length === 0) {
        setError('No availability found for your requirements. Please try different options.');
      }
    } catch (err) {
      setError('Failed to check availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, [request]);

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'pickup':
        return <Package className="h-4 w-4" />;
      case 'express':
        return <Zap className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'pickup':
        return 'Pickup Service';
      case 'express':
        return 'Express Service';
      default:
        return 'Drop-off';
    }
  };

  const getAvailabilityColor = (capacity: { current: number; maximum: number }) => {
    const ratio = capacity.current / capacity.maximum;
    if (ratio < 0.5) return 'text-green-600';
    if (ratio < 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Group slots by date
  const slotsByDate = availabilitySlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Real-time Availability
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getServiceTypeLabel(request.serviceType)} • {request.deviceCategory} • {request.repairType}
          </p>
        </div>
        
        <button
          onClick={checkAvailability}
          disabled={loading}
          className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Last checked timestamp */}
      {lastChecked && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {lastChecked.toLocaleTimeString()}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Checking real-time availability...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">
                Availability Check Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available slots */}
      {!loading && !error && Object.keys(slotsByDate).length > 0 && (
        <div className="space-y-4">
          {Object.entries(slotsByDate).map(([date, slots]) => {
            const dateObj = new Date(date);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const isTomorrow = dateObj.toDateString() === new Date(Date.now() + 86400000).toDateString();
            
            let dateLabel = dateObj.toLocaleDateString('en-GB', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            });
            
            if (isToday) dateLabel = `Today, ${dateLabel}`;
            if (isTomorrow) dateLabel = `Tomorrow, ${dateLabel}`;

            return (
              <div key={date} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateLabel}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => onSlotSelect(slot)}
                      className={`p-3 rounded-lg text-left transition-all hover:shadow-md ${
                        selectedSlot?.id === slot.id
                          ? 'bg-blue-600 text-white border-2 border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getServiceTypeIcon(slot.serviceType)}
                          <span className="ml-2 font-medium">{slot.time}</span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      
                      <div className={`text-sm ${selectedSlot?.id === slot.id ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        <div className="flex items-center mb-1">
                          <span>👨‍🔧 {slot.technicianName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>⏱️ {slot.estimatedDuration} min</span>
                          <span className={selectedSlot?.id === slot.id ? 'text-blue-200' : getAvailabilityColor(slot.capacity)}>
                            {slot.capacity.current}/{slot.capacity.maximum} booked
                          </span>
                        </div>
                        
                        {slot.location && (
                          <div className="text-xs mt-1 truncate">
                            📍 {slot.location}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No availability found */}
      {!loading && !error && Object.keys(slotsByDate).length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                Limited Availability
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                No immediate slots available for your requirements. We recommend:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside">
                <li>Try a different service type (drop-off vs pickup)</li>
                <li>Consider standard instead of express service</li>
                <li>Check availability for next week</li>
                <li>Contact us directly for urgent repairs</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected slot summary */}
      {selectedSlot && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100">
                Slot Selected
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                {new Date(selectedSlot.date).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} at {selectedSlot.time} with {selectedSlot.technicianName}
              </p>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1 space-x-4">
                <span className="flex items-center">
                  {getServiceTypeIcon(selectedSlot.serviceType)}
                  <span className="ml-1">{getServiceTypeLabel(selectedSlot.serviceType)}</span>
                </span>
                <span>⏱️ {selectedSlot.estimatedDuration} minutes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability legend */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Availability Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Good availability (0-50% booked)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Limited availability (50-80% booked)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">High demand (80%+ booked)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityChecker;