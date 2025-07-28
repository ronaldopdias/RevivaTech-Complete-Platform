'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Clock, 
  Trash2, 
  Edit3, 
  Download, 
  AlertCircle, 
  CheckCircle,
  History,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BookingProgress,
  SavedBooking,
  saveProgress,
  loadProgress,
  clearProgress,
  saveBookingForLater,
  getSavedBookings,
  loadSavedBooking,
  deleteSavedBooking,
  updateBookingTitle,
  hasAnyProgress,
  getStorageInfo
} from '@/lib/data/booking-progress';

interface BookingProgressManagerProps {
  currentStep: BookingProgress['step'];
  currentData: BookingProgress['data'];
  totalPrice: number;
  onProgressRestore: (progress: BookingProgress) => void;
  className?: string;
}

const BookingProgressManager: React.FC<BookingProgressManagerProps> = ({
  currentStep,
  currentData,
  totalPrice,
  onProgressRestore,
  className
}) => {
  const [savedBookings, setSavedBookings] = useState<SavedBooking[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [currentProgress, setCurrentProgress] = useState<BookingProgress | null>(null);

  // Load saved bookings and current progress on component mount
  useEffect(() => {
    setSavedBookings(getSavedBookings());
    setCurrentProgress(loadProgress());
  }, []);

  // Auto-save progress every 30 seconds if there's meaningful data
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentData.selectedServices.length > 0) {
        try {
          saveProgress(currentStep, currentData, totalPrice);
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentStep, currentData, totalPrice]);

  const handleSaveForLater = async () => {
    if (currentData.selectedServices.length === 0) {
      return;
    }

    setSaveStatus('saving');
    try {
      // First save as current progress
      const progressId = saveProgress(currentStep, currentData, totalPrice);
      
      // Load the full progress object
      const progress = loadProgress();
      if (!progress) throw new Error('Failed to create progress');
      
      // Save for later with custom title
      const finalTitle = saveTitle.trim() || `Band ${currentData.selectedBand} - ${currentData.selectedServices.length} services`;
      await saveBookingForLater(progress, finalTitle);
      
      // Refresh saved bookings list
      setSavedBookings(getSavedBookings());
      
      setSaveStatus('success');
      setSaveTitle('');
      setShowSaveDialog(false);
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save booking:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLoadBooking = async (bookingId: string) => {
    try {
      const progress = loadSavedBooking(bookingId);
      if (progress) {
        onProgressRestore(progress);
        setShowLoadDialog(false);
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    deleteSavedBooking(bookingId);
    setSavedBookings(getSavedBookings());
  };

  const handleUpdateTitle = (bookingId: string) => {
    if (editTitle.trim()) {
      updateBookingTitle(bookingId, editTitle.trim());
      setSavedBookings(getSavedBookings());
    }
    setEditingBookingId(null);
    setEditTitle('');
  };

  const handleRestoreCurrentProgress = () => {
    if (currentProgress) {
      onProgressRestore(currentProgress);
    }
  };

  const hasCurrentProgress = currentProgress !== null;
  const hasSelectedServices = currentData.selectedServices.length > 0;
  const storageInfo = getStorageInfo();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Auto-save Indicator */}
      {hasSelectedServices && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              Progress automatically saved
            </span>
          </div>
          <div className="text-xs text-green-600">
            Auto-saves every 30 seconds
          </div>
        </div>
      )}

      {/* Current Progress Restore */}
      {hasCurrentProgress && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  Resume Previous Session
                </div>
                <div className="text-sm text-blue-700">
                  You have unsaved progress from {new Date(currentProgress.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => clearProgress()}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleRestoreCurrentProgress}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Save for Later Button */}
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={!hasSelectedServices || saveStatus === 'saving'}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
            hasSelectedServices
              ? "bg-professional-500 text-white hover:bg-professional-600 shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          <Save className="w-4 h-4" />
          <span>
            {saveStatus === 'saving' ? 'Saving...' : 'Save for Later'}
          </span>
        </button>

        {/* Load Saved Button */}
        <button
          onClick={() => setShowLoadDialog(true)}
          disabled={savedBookings.length === 0}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
            savedBookings.length > 0
              ? "bg-trust-500 text-white hover:bg-trust-600"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          <Download className="w-4 h-4" />
          <span>Load Saved ({savedBookings.length})</span>
        </button>

        {/* Storage Info */}
        <div className="text-xs text-gray-500 ml-auto">
          {storageInfo.storageSize}KB used
        </div>
      </div>

      {/* Save Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">Booking saved successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">Failed to save booking. Please try again.</span>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save Booking</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Title (Optional)
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder={`Band ${currentData.selectedBand} - ${currentData.selectedServices.length} services`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-professional-500 focus:border-professional-500"
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <div>Services: {currentData.selectedServices.length}</div>
                  <div>Photos: {currentData.diagnosticPhotos.length}</div>
                  <div>Total: £{totalPrice.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveForLater}
                  disabled={saveStatus === 'saving'}
                  className="bg-professional-500 text-white px-4 py-2 rounded-md hover:bg-professional-600 transition-colors disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Load Saved Booking</h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {savedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No saved bookings found</p>
                </div>
              ) : (
                savedBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingBookingId === booking.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle(booking.id)}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateTitle(booking.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingBookingId(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{booking.title}</h4>
                            <button
                              onClick={() => {
                                setEditingBookingId(booking.id);
                                setEditTitle(booking.title);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Saved: {new Date(booking.savedAt).toLocaleDateString()}</div>
                          <div className="flex items-center space-x-4">
                            <span>{booking.summary.services} services</span>
                            <span>{booking.summary.photos} photos</span>
                            <span>£{booking.summary.totalPrice.toFixed(2)}</span>
                            <span>Band {booking.summary.band}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleLoadBooking(booking.id)}
                          className="bg-trust-500 text-white px-3 py-1 rounded text-sm hover:bg-trust-600 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingProgressManager;