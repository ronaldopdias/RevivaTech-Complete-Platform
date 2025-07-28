'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Phone, 
  Mail,
  AlertCircle,
  CheckCircle,
  Star,
  Truck,
  Home,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TimeSlot,
  AppointmentPreference,
  getFilteredSlots,
  groupSlotsByDate,
  getNextAvailableSlot,
  validateSlotForServices,
  formatSlotTime,
  estimateRepairDuration,
  determineAppointmentType,
  getDateAvailability
} from '@/lib/data/appointment-scheduling';

interface AppointmentSchedulerProps {
  selectedServices: string[];
  onAppointmentSelect: (slot: TimeSlot | null, preferences: AppointmentPreference) => void;
  className?: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  selectedServices,
  onAppointmentSelect,
  className
}) => {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [preferences, setPreferences] = useState<AppointmentPreference>({
    urgency: 'standard',
    dropOffMethod: 'bring-in',
    contactPreference: 'email',
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [currentWeek, setCurrentWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calculate estimated duration and appointment type
  const estimatedDuration = useMemo(() => {
    return estimateRepairDuration(selectedServices);
  }, [selectedServices]);

  const appointmentType = useMemo(() => {
    return determineAppointmentType(selectedServices, preferences.urgency);
  }, [selectedServices, preferences.urgency]);

  // Get filtered slots based on preferences
  const availableSlots = useMemo(() => {
    return getFilteredSlots(preferences, selectedServices);
  }, [preferences, selectedServices]);

  // Group slots by date for calendar view
  const slotsByDate = useMemo(() => {
    return groupSlotsByDate(availableSlots);
  }, [availableSlots]);

  // Get next available slot as suggestion
  const nextAvailableSlot = useMemo(() => {
    return getNextAvailableSlot(preferences, selectedServices);
  }, [preferences, selectedServices]);

  // Generate calendar dates for current week
  const calendarDates = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (currentWeek * 7) + 1);
    
    const dates = [];
    for (let i = 0; i < 14; i++) { // Show 2 weeks
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeek]);

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    const validation = validateSlotForServices(slot, selectedServices);
    if (validation.valid) {
      setSelectedSlot(slot);
      onAppointmentSelect(slot, preferences);
    }
  };

  // Handle preference changes
  const handlePreferenceChange = (key: keyof AppointmentPreference, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    // Update parent with current selection
    onAppointmentSelect(selectedSlot, newPreferences);
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      setCurrentWeek(prev => Math.min(prev + 1, 3)); // Max 4 weeks ahead
    } else {
      setCurrentWeek(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Calendar className="w-5 h-5 text-professional-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Your Appointment
          </h3>
        </div>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Choose a convenient time for your laptop repair. Our team will be ready with the right tools and expertise.
        </p>
      </div>

      {/* Appointment Details Summary */}
      <div className="bg-gradient-to-r from-professional-50 to-trust-50 border border-professional-200 rounded-xl p-4">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-professional-600" />
            <div>
              <div className="font-medium text-gray-900">Estimated Duration</div>
              <div className="text-gray-600">
                {Math.ceil(estimatedDuration / 60)} hour{Math.ceil(estimatedDuration / 60) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-professional-600" />
            <div>
              <div className="font-medium text-gray-900">Service Priority</div>
              <div className="text-gray-600 capitalize">{appointmentType}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-professional-600" />
            <div>
              <div className="font-medium text-gray-900">Services</div>
              <div className="text-gray-600">{selectedServices.length} selected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Preferences */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Appointment Preferences</h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Drop-off Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you like to get your laptop to us?
            </label>
            <div className="space-y-2">
              {[
                { id: 'bring-in', label: 'Bring to store', icon: MapPin, description: 'Drop off at our location' },
                { id: 'collection', label: 'Collection service', icon: Home, description: 'We collect from your address' },
                { id: 'post', label: 'Post to us', icon: Truck, description: 'Send via secure courier' }
              ].map((method) => {
                const IconComponent = method.icon;
                return (
                  <label key={method.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dropOffMethod"
                      value={method.id}
                      checked={preferences.dropOffMethod === method.id}
                      onChange={(e) => handlePreferenceChange('dropOffMethod', e.target.value)}
                      className="w-4 h-4 text-professional-600 border-gray-300 focus:ring-professional-500"
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">{method.label}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How urgent is your repair?
            </label>
            <div className="space-y-2">
              {[
                { id: 'standard', label: 'Standard', description: 'Regular turnaround time' },
                { id: 'urgent', label: 'Urgent', description: 'Priority booking available' },
                { id: 'emergency', label: 'Emergency', description: 'Same-day or express service' }
              ].map((urgency) => (
                <label key={urgency.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={urgency.id}
                    checked={preferences.urgency === urgency.id}
                    onChange={(e) => handlePreferenceChange('urgency', e.target.value)}
                    className="w-4 h-4 text-professional-600 border-gray-300 focus:ring-professional-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{urgency.label}</div>
                    <div className="text-sm text-gray-600">{urgency.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preferred Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Time of Day
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'morning', label: 'Morning (9AM-12PM)' },
              { id: 'afternoon', label: 'Afternoon (12PM-4PM)' },
              { id: 'evening', label: 'Evening (4PM-6PM)' },
              { id: 'flexible', label: 'Flexible' }
            ].map((time) => (
              <button
                key={time.id}
                onClick={() => handlePreferenceChange('preferredTime', time.id)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                  preferences.preferredTime === time.id
                    ? "border-professional-500 bg-professional-50 text-professional-700"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                )}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How should we contact you?
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'phone', label: 'Phone Call', icon: Phone },
              { id: 'sms', label: 'Text Message', icon: Phone }
            ].map((contact) => {
              const IconComponent = contact.icon;
              return (
                <button
                  key={contact.id}
                  onClick={() => handlePreferenceChange('contactPreference', contact.id)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    preferences.contactPreference === contact.id
                      ? "border-professional-500 bg-professional-50 text-professional-700"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{contact.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Booking Suggestion */}
      {nextAvailableSlot && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Next Available Slot</div>
                <div className="text-sm text-green-700">
                  {nextAvailableSlot.date.toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })} at {formatSlotTime(nextAvailableSlot)}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSlotSelect(nextAvailableSlot)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Book This Slot
            </button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Available Time Slots</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              disabled={currentWeek === 0}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              disabled={currentWeek >= 3}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {calendarDates.map((date, index) => {
            const dateKey = date.toISOString().split('T')[0];
            const daySlots = slotsByDate[dateKey] || [];
            const availability = getDateAvailability(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-3 min-h-[120px]",
                  daySlots.length > 0 ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                  isToday && "border-professional-300 bg-professional-25"
                )}
              >
                <div className="text-center mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    {date.toLocaleDateString('en-GB', { day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-600">
                    {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {daySlots.slice(0, 3).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className={cn(
                        "w-full text-xs px-2 py-1 rounded border transition-colors",
                        selectedSlot?.id === slot.id
                          ? "border-professional-500 bg-professional-500 text-white"
                          : slot.available
                          ? "border-gray-300 bg-white text-gray-700 hover:border-professional-300 hover:bg-professional-50"
                          : "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      )}
                      disabled={!slot.available}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                  {daySlots.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{daySlots.length - 3} more
                    </div>
                  )}
                  {daySlots.length === 0 && (
                    <div className="text-xs text-gray-400 text-center">
                      No slots
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Appointment Summary */}
      {selectedSlot && (
        <div className="bg-white border border-professional-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Selected Appointment</h4>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700 mb-1">Date & Time</div>
              <div className="text-gray-900">
                {selectedSlot.date.toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="text-gray-900">{formatSlotTime(selectedSlot)}</div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700 mb-1">Service Details</div>
              <div className="text-gray-900">
                {selectedServices.length} services • {Math.ceil(estimatedDuration / 60)} hour duration
              </div>
              <div className="text-gray-900 capitalize">
                {preferences.urgency} priority • {preferences.dropOffMethod.replace('-', ' ')}
              </div>
            </div>
          </div>
          
          {/* Notes Field */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={preferences.notes || ''}
              onChange={(e) => handlePreferenceChange('notes', e.target.value)}
              placeholder="Any specific requirements or information for your appointment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-professional-500 focus:border-professional-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* No Slots Available Warning */}
      {availableSlots.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-900">No Available Slots</div>
              <div className="text-sm text-yellow-700">
                Try adjusting your preferences or contact us directly to arrange a suitable time.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler;