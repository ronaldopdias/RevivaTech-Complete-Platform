'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell,
  Edit3,
  Save,
  X,
  Camera,
  Key,
  Smartphone,
  Clock
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  dateOfBirth: string;
  joinDate: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    repairUpdates: boolean;
  };
  securitySettings: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    sessionTimeout: number;
  };
  repairHistory: {
    totalRepairs: number;
    totalSpent: number;
    averageRating: number;
  };
}

const mockProfile: UserProfile = {
  id: 'user-001',
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '+44 7700 900123',
  address: {
    street: '123 High Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'United Kingdom'
  },
  dateOfBirth: '1985-06-15',
  joinDate: '2023-03-10',
  preferences: {
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    repairUpdates: true
  },
  securitySettings: {
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-01',
    sessionTimeout: 30
  },
  repairHistory: {
    totalRepairs: 5,
    totalSpent: 1250,
    averageRating: 4.8
  }
};

export const CustomerProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempProfile, setTempProfile] = useState<UserProfile>(mockProfile);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setTempProfile({ ...profile });
  };

  const handleSave = (section: string) => {
    setProfile({ ...tempProfile });
    setEditingSection(null);
  };

  const handleCancel = () => {
    setTempProfile({ ...profile });
    setEditingSection(null);
  };

  const updateTempProfile = (updates: Partial<UserProfile>) => {
    setTempProfile(prev => ({ ...prev, ...updates }));
  };

  const updatePreference = (key: keyof UserProfile['preferences'], value: boolean) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const toggleTwoFactor = () => {
    setProfile(prev => ({
      ...prev,
      securitySettings: {
        ...prev.securitySettings,
        twoFactorEnabled: !prev.securitySettings.twoFactorEnabled
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your personal information and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {profile.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile.repairHistory.totalRepairs}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Repairs</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    £{profile.repairHistory.totalSpent}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Spent</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile.repairHistory.averageRating}★
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h2>
              {editingSection !== 'personal' && (
                <button
                  onClick={() => handleEdit('personal')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="p-6">
              {editingSection === 'personal' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={tempProfile.name}
                        onChange={(e) => updateTempProfile({ name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={tempProfile.phone}
                        onChange={(e) => updateTempProfile({ phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={tempProfile.address.street}
                      onChange={(e) => updateTempProfile({ 
                        address: { ...tempProfile.address, street: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={tempProfile.address.city}
                        onChange={(e) => updateTempProfile({ 
                          address: { ...tempProfile.address, city: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postcode
                      </label>
                      <input
                        type="text"
                        value={tempProfile.address.postcode}
                        onChange={(e) => updateTempProfile({ 
                          address: { ...tempProfile.address, postcode: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={tempProfile.address.country}
                        onChange={(e) => updateTempProfile({ 
                          address: { ...tempProfile.address, country: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSave('personal')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                        <div className="font-medium text-gray-900 dark:text-white">{profile.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                        <div className="font-medium text-gray-900 dark:text-white">{profile.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                        <div className="font-medium text-gray-900 dark:text-white">{profile.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Member Since</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {new Date(profile.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Address</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {profile.address.street}<br />
                        {profile.address.city}, {profile.address.postcode}<br />
                        {profile.address.country}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(profile.preferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {key === 'emailNotifications' && 'Email Notifications'}
                      {key === 'smsNotifications' && 'SMS Notifications'}
                      {key === 'marketingEmails' && 'Marketing Emails'}
                      {key === 'repairUpdates' && 'Repair Status Updates'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {key === 'emailNotifications' && 'Receive notifications via email'}
                      {key === 'smsNotifications' && 'Receive notifications via SMS'}
                      {key === 'marketingEmails' && 'Receive promotional emails and offers'}
                      {key === 'repairUpdates' && 'Get updates about your repair progress'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updatePreference(key as keyof UserProfile['preferences'], e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        value ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${profile.securitySettings.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {profile.securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={toggleTwoFactor}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      profile.securitySettings.twoFactorEnabled
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {profile.securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Password</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last changed: {new Date(profile.securitySettings.lastPasswordChange).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Session Timeout</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically log out after inactivity
                  </div>
                </div>
                <select
                  value={profile.securitySettings.sessionTimeout}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    securitySettings: {
                      ...prev.securitySettings,
                      sessionTimeout: parseInt(e.target.value)
                    }
                  }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPasswordModal(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter your current password and choose a new one.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;