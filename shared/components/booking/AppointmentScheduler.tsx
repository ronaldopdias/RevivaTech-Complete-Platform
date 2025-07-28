'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MapPin,
  Package,
  Mail,
  CheckCircle,
  AlertCircle,
  User,
  Phone
} from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
  technician?: string;
  estimatedDuration?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  timeSlots: TimeSlot[];
}

interface AppointmentSchedulerProps {
  serviceType: 'dropoff' | 'pickup' | 'mail';
  onAppointmentSelect: (appointment: { date: string; time: string; serviceType: string }) => void;
  selectedAppointment?: { date: string; time: string };
}

const generateTimeSlots = (date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 17;
  const now = new Date();
  const selectedDate = new Date(date);
  const isToday = selectedDate.toDateString() === now.toDateString();

  for (let hour = startHour; hour <= endHour; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, 0, 0, 0);

    // Check if slot is in the past
    const isPast = isToday && slotTime < now;
    
    // Simulate availability (in real app, this would come from backend)
    const isAvailable = !isPast && Math.random() > 0.3;

    slots.push({
      time: timeString,
      available: isAvailable,
      technician: isAvailable ? ['John Smith', 'Sarah Johnson', 'Mike Chen'][Math.floor(Math.random() * 3)] : undefined,
      estimatedDuration: '30-45 min'
    });
  }

  return slots;
};

const generateWeekDays = (startDate: Date): DaySchedule[] => {
  const days: DaySchedule[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;
    
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      isToday,
      isPast,
      timeSlots: generateTimeSlots(date.toISOString().split('T')[0])
    });
  }
  
  return days;
};

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  serviceType,
  onAppointmentSelect,
  selectedAppointment
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Start from Monday of current week
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    setWeekDays(generateWeekDays(startOfWeek));
  }, [currentWeek]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
    setSelectedDate(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onAppointmentSelect({
        date: selectedDate,
        time,
        serviceType
      });
    }
  };

  const selectedDay = weekDays.find(day => day.date === selectedDate);

  if (serviceType === 'mail') {
    return (
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Mail className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
            Mail-in Service
          </h3>
        </div>
        <div className="space-y-4">
          <p className="text-blue-800 dark:text-blue-200">
            For mail-in service, we'll provide you with:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>Prepaid shipping label</li>
            <li>Protective packaging instructions</li>
            <li>Insurance coverage during transit</li>
            <li>Tracking number for your shipment</li>
          </ul>
          <div className="bg-blue-100 dark:bg-blue-800 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Processing time:</strong> 1-2 business days after we receive your device<br />
              <strong>Return shipping:</strong> Free for repairs over £50
            </p>
          </div>
          <button
            onClick={() => onAppointmentSelect({ date: '', time: '', serviceType: 'mail' })}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue with Mail-in Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Type Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center mb-2">
          {serviceType === 'dropoff' ? (
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          ) : (
            <Package className="h-5 w-5 text-blue-600 mr-2" />
          )}
          <h3 className="font-medium text-gray-900 dark:text-white">
            {serviceType === 'dropoff' ? 'Drop-off Appointment' : 'Pickup Service'}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {serviceType === 'dropoff' 
            ? 'Bring your device to our repair center at your chosen time.'
            : 'We\'ll collect your device from your address at the scheduled time.'
          }
        </p>
        {serviceType === 'pickup' && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            Additional £5 pickup charge applies
          </div>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {currentWeek.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          onClick={() => navigateWeek('next')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <button
            key={day.date}
            onClick={() => !day.isPast && handleDateSelect(day.date)}
            disabled={day.isPast}
            className={`p-3 rounded-lg text-center transition-colors ${
              day.isPast
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : selectedDate === day.date
                ? 'bg-blue-600 text-white'
                : day.isToday
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="text-xs font-medium">{day.dayName}</div>
            <div className="text-lg font-semibold">
              {new Date(day.date).getDate()}
            </div>
            <div className="text-xs">
              {day.timeSlots.filter(slot => slot.available).length} slots
            </div>
          </button>
        ))}
      </div>

      {/* Time Slots */}
      {selectedDate && selectedDay && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Available Times - {selectedDay.dayName}, {new Date(selectedDate).toLocaleDateString()}
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {selectedDay.timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    !slot.available
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : selectedAppointment?.time === slot.time && selectedAppointment?.date === selectedDate
                      ? 'bg-green-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">{slot.time}</span>
                  </div>
                  {slot.available ? (
                    <>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {slot.technician}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {slot.estimatedDuration}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Unavailable
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedDay.timeSlots.filter(slot => slot.available).length === 0 && (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No available time slots for this date. Please select another day.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Appointment Summary */}
      {selectedAppointment && selectedAppointment.date && selectedAppointment.time && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100">
                Appointment Selected
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                {new Date(selectedAppointment.date).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} at {selectedAppointment.time}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {serviceType === 'dropoff' ? 'Drop-off' : 'Pickup'} service
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Business Hours Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Business Hours</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Monday - Friday:</span>
            <span>9:00 AM - 5:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span>Saturday:</span>
            <span>10:00 AM - 4:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span>Sunday:</span>
            <span>Closed</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-2" />
            123 High Street, London SW1A 1AA
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
            <Phone className="h-4 w-4 mr-2" />
            +44 20 7123 4567
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;