'use client';

import React, { useState } from 'react';
import { useFeature } from '@/lib/services/featureService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Video, Calendar, Clock, Users, Phone } from 'lucide-react';

interface ConsultationSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  available: boolean;
  technician: string;
}

export default function VideoConsultationPage() {
  const { isEnabled, config } = useFeature('video_consultations');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Mock consultation slots
  const consultationSlots: ConsultationSlot[] = [
    {
      id: 'slot-1',
      date: '2025-07-18',
      time: '09:00',
      duration: 30,
      available: true,
      technician: 'Marcus Thompson'
    },
    {
      id: 'slot-2',
      date: '2025-07-18',
      time: '10:30',
      duration: 30,
      available: true,
      technician: 'Sarah Johnson'
    },
    {
      id: 'slot-3',
      date: '2025-07-18',
      time: '14:00',
      duration: 30,
      available: false,
      technician: 'David Chen'
    },
    {
      id: 'slot-4',
      date: '2025-07-19',
      time: '11:00',
      duration: 30,
      available: true,
      technician: 'Emily Rodriguez'
    }
  ];

  const handleBookConsultation = async (slotId: string) => {
    setIsBooking(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSelectedSlot(slotId);
    setIsBooking(false);
  };

  if (!isEnabled) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="p-8 text-center">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Video Consultations Not Available
          </h3>
          <p className="text-gray-600">
            This feature is currently disabled or not available for your account.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Consultations</h1>
            <p className="text-gray-600">Get expert advice through live video calls with our technicians</p>
          </div>
        </div>
        
        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Video className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">HD Video Calls</h3>
            <p className="text-sm text-gray-600">
              Crystal clear video quality for detailed diagnostics
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Screen Sharing</h3>
            <p className="text-sm text-gray-600">
              Share your screen to show issues directly
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Flexible Scheduling</h3>
            <p className="text-sm text-gray-600">
              Book at your convenient time with expert technicians
            </p>
          </Card>
        </div>
      </div>

      {selectedSlot ? (
        <Card className="p-8 text-center">
          <div className="text-green-600 mb-4">
            <Video className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultation Booked!</h2>
          <p className="text-gray-600 mb-6">
            Your video consultation has been scheduled. You'll receive a confirmation email with the meeting link.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Date:</span>
                <p>{new Date(consultationSlots.find(s => s.id === selectedSlot)?.date!).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium">Time:</span>
                <p>{consultationSlots.find(s => s.id === selectedSlot)?.time}</p>
              </div>
              <div>
                <span className="font-medium">Technician:</span>
                <p>{consultationSlots.find(s => s.id === selectedSlot)?.technician}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="primary">
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>
              Book Another
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Slots */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Time Slots</h2>
            <div className="space-y-4">
              {consultationSlots.map((slot) => (
                <Card key={slot.id} className={`p-4 transition-all ${
                  slot.available 
                    ? 'hover:shadow-md cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {new Date(slot.date).toLocaleDateString()} at {slot.time}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.duration} minutes with {slot.technician}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {slot.available ? (
                        <Button
                          size="sm"
                          onClick={() => handleBookConsultation(slot.id)}
                          disabled={isBooking}
                        >
                          {isBooking ? 'Booking...' : 'Book Now'}
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-500">Unavailable</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Consultation Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Book Your Slot</h3>
                    <p className="text-sm text-gray-600">
                      Choose a convenient time from available slots
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Join the Call</h3>
                    <p className="text-sm text-gray-600">
                      Receive a meeting link via email before your appointment
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Get Expert Help</h3>
                    <p className="text-sm text-gray-600">
                      Show your device issues and get professional guidance
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 mt-6">
              <h3 className="font-semibold mb-4">What You'll Need</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Good internet connection
                </li>
                <li className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Camera and microphone access
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Your device ready for inspection
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* Configuration Display */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-8 p-6 bg-gray-50">
          <h3 className="font-semibold mb-4">Video Consultation Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Screen Sharing:</span> {config.enableScreenSharing ? 'Enabled' : 'Disabled'}
            </div>
            <div>
              <span className="font-medium">Recording:</span> {config.enableRecording ? 'Enabled' : 'Disabled'}
            </div>
            <div>
              <span className="font-medium">Max Duration:</span> {config.maxDuration / 60} minutes
            </div>
            <div>
              <span className="font-medium">Scheduling:</span> {config.enableScheduling ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}