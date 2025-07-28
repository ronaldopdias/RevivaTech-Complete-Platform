'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  MessageSquare, 
  Calendar, 
  MapPin,
  Phone,
  Package,
  Clock,
  CreditCard,
  FileText,
  Copy,
  ExternalLink,
  Smartphone,
  Printer
} from 'lucide-react';

interface BookingDetails {
  id: string;
  device: {
    brand: string;
    model: string;
    category: string;
    year: number;
  };
  repair: {
    type: string;
    description: string;
    estimatedPrice: number;
    estimatedDuration: string;
  };
  appointment: {
    date: string;
    time: string;
    serviceType: 'dropoff' | 'pickup' | 'mail';
    technician?: string;
    location?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      postcode: string;
    };
  };
  issueDescription: string;
  images?: string[];
  reference: string;
  status: 'confirmed' | 'pending_payment' | 'cancelled';
  createdAt: string;
  estimatedCompletion?: string;
}

interface BookingConfirmationProps {
  booking: BookingDetails;
  onNewBooking: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onNewBooking
}) => {
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendEmail = async () => {
    // Simulate email sending
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleSendSMS = async () => {
    // Simulate SMS sending
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(booking.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConfirmation = () => {
    // Simulate PDF download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(
      `Booking Confirmation\nReference: ${booking.reference}\nDevice: ${booking.device.brand} ${booking.device.model}\nRepair: ${booking.repair.description}`
    ));
    element.setAttribute('download', `booking-${booking.reference}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getServiceTypeDetails = () => {
    switch (booking.appointment.serviceType) {
      case 'pickup':
        return {
          icon: <Package className="h-5 w-5" />,
          title: 'Pickup Service',
          description: 'We will collect your device from your address',
          location: booking.customer.address ? 
            `${booking.customer.address.street}, ${booking.customer.address.city}, ${booking.customer.address.postcode}` :
            'Address to be confirmed'
        };
      case 'mail':
        return {
          icon: <Mail className="h-5 w-5" />,
          title: 'Mail-in Service',
          description: 'Send your device using our prepaid shipping label',
          location: 'Shipping label will be emailed to you'
        };
      default:
        return {
          icon: <MapPin className="h-5 w-5" />,
          title: 'Drop-off Service',
          description: 'Bring your device to our repair center',
          location: '123 High Street, London SW1A 1AA'
        };
    }
  };

  const serviceDetails = getServiceTypeDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-8">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-green-700 dark:text-green-300 mb-4">
          Your repair booking has been successfully created and confirmed.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 inline-block">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Booking Reference:</span>
            <span className="text-xl font-mono font-bold text-gray-900 dark:text-white">{booking.reference}</span>
            <button
              onClick={handleCopyReference}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Copy reference"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1">Reference copied to clipboard!</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={handleSendEmail}
          disabled={emailSent}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Mail className="h-4 w-4 mr-2" />
          {emailSent ? 'Email Sent!' : 'Email Confirmation'}
        </button>
        
        <button
          onClick={handleSendSMS}
          disabled={smsSent}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          {smsSent ? 'SMS Sent!' : 'SMS Reminder'}
        </button>
        
        <button
          onClick={handleDownloadConfirmation}
          className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </button>
        
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Booking Details</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Device Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Device</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.device.brand} {booking.device.model}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {booking.device.category} • {booking.device.year}
                </p>
              </div>
            </div>

            {/* Repair Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Repair</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {booking.repair.description}
                </p>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>Estimated: {booking.repair.estimatedDuration}</span>
                  <span className="font-medium">£{booking.repair.estimatedPrice}</span>
                </div>
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Issue Description</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {booking.issueDescription}
                </p>
              </div>
            </div>

            {/* Uploaded Images */}
            {booking.images && booking.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Uploaded Images ({booking.images.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {booking.images.map((image, index) => (
                    <div key={index} className="w-full h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Image {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appointment & Contact Details */}
        <div className="space-y-6">
          {/* Appointment Details */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appointment</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                {serviceDetails.icon}
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {serviceDetails.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {serviceDetails.description}
                  </p>
                </div>
              </div>

              {booking.appointment.serviceType !== 'mail' && (
                <>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(booking.appointment.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.appointment.time}
                      </p>
                    </div>
                  </div>

                  {booking.appointment.technician && (
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-blue-500 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">T</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {booking.appointment.technician}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Assigned Technician
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {serviceDetails.location}
                  </p>
                  {booking.appointment.serviceType === 'dropoff' && (
                    <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-1 flex items-center">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on map
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-white">
                    {booking.customer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {booking.customer.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <p className="text-sm text-gray-900 dark:text-white">
                  {booking.customer.email}
                </p>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <p className="text-sm text-gray-900 dark:text-white">
                  {booking.customer.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">What happens next?</h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {booking.appointment.serviceType === 'dropoff' && (
            <>
              <p>1. Bring your device to our repair center at the scheduled time</p>
              <p>2. We'll perform a detailed diagnosis and provide a final quote</p>
              <p>3. Once approved, we'll begin the repair process</p>
              <p>4. You'll receive updates via email and SMS throughout the repair</p>
            </>
          )}
          {booking.appointment.serviceType === 'pickup' && (
            <>
              <p>1. Our technician will arrive at your address at the scheduled time</p>
              <p>2. We'll collect your device and bring it to our repair center</p>
              <p>3. We'll perform a detailed diagnosis and contact you with a quote</p>
              <p>4. Once repaired, we'll arrange return delivery</p>
            </>
          )}
          {booking.appointment.serviceType === 'mail' && (
            <>
              <p>1. You'll receive a prepaid shipping label via email within 1 hour</p>
              <p>2. Package your device securely using our guidelines</p>
              <p>3. Drop off at any post office or arrange collection</p>
              <p>4. We'll email you when we receive your device</p>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <FileText className="h-4 w-4 mr-2" />
          View in Dashboard
        </button>
        
        <button
          onClick={() => window.location.href = '/support'}
          className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Support
        </button>
        
        <button
          onClick={onNewBooking}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <Package className="h-4 w-4 mr-2" />
          Book Another Repair
        </button>
      </div>

      {/* Important Information */}
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Important Information</h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• Please bring a valid ID when dropping off your device</li>
          <li>• Back up your data before repair - we're not responsible for data loss</li>
          <li>• Remove any screen protectors and cases before service</li>
          <li>• Final quote may vary from estimate after detailed diagnosis</li>
          <li>• No repair, no charge policy applies</li>
        </ul>
      </div>
    </div>
  );
};

export default BookingConfirmation;