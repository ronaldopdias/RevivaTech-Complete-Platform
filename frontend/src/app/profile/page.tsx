'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { User, Mail, Phone, MapPin, Shield, Camera } from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    marketing: boolean;
    twoFactorEnabled: boolean;
  };
  avatar?: string;
  memberSince: string;
  loyaltyPoints: number;
  tier: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch user profile from API
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/customer/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          // Fallback to mock data for development
          setProfile({
            id: 'user-123',
            firstName: 'Sarah',
            lastName: 'Thompson',
            email: 'sarah.thompson@email.com',
            phone: '+44 7700 900123',
            address: {
              street: '123 High Street',
              city: 'London',
              postcode: 'SW1A 1AA',
              country: 'United Kingdom'
            },
            preferences: {
              notifications: {
                email: true,
                sms: true,
                push: false
              },
              marketing: false,
              twoFactorEnabled: false
            },
            memberSince: '2022-03-15',
            loyaltyPoints: 1250,
            tier: 'Silver'
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setIsEditing(false);
        // Show success message
      } else {
        // Handle error
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  const updatePreferences = (updates: Partial<UserProfile['preferences']>) => {
    if (profile) {
      setProfile({
        ...profile,
        preferences: { ...profile.preferences, ...updates }
      });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'text-amber-600 bg-amber-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600">Unable to load your profile information.</p>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h3>
                <p className="text-gray-600">{profile.email}</p>
                
                <div className="mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(profile.tier)}`}>
                    {profile.tier} Member
                  </span>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>Member since {new Date(profile.memberSince).toLocaleDateString()}</p>
                  <p className="mt-1">Loyalty Points: <span className="font-semibold">{profile.loyaltyPoints}</span></p>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <Button
                  variant={isEditing ? "primary" : "outline"}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    value={profile.firstName}
                    onChange={(e) => updateProfile({ firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    value={profile.lastName}
                    onChange={(e) => updateProfile({ lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </Card>

            {/* Address */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Address</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <Input
                    value={profile.address.street}
                    onChange={(e) => updateProfile({
                      address: { ...profile.address, street: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={profile.address.city}
                    onChange={(e) => updateProfile({
                      address: { ...profile.address, city: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <Input
                    value={profile.address.postcode}
                    onChange={(e) => updateProfile({
                      address: { ...profile.address, postcode: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Preferences</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.email}
                        onChange={(e) => updatePreferences({
                          notifications: {
                            ...profile.preferences.notifications,
                            email: e.target.checked
                          }
                        })}
                        className="mr-3"
                      />
                      <Mail className="w-4 h-4 mr-2" />
                      Email notifications
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.sms}
                        onChange={(e) => updatePreferences({
                          notifications: {
                            ...profile.preferences.notifications,
                            sms: e.target.checked
                          }
                        })}
                        className="mr-3"
                      />
                      <Phone className="w-4 h-4 mr-2" />
                      SMS notifications
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.push}
                        onChange={(e) => updatePreferences({
                          notifications: {
                            ...profile.preferences.notifications,
                            push: e.target.checked
                          }
                        })}
                        className="mr-3"
                      />
                      Push notifications
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Marketing</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={profile.preferences.marketing}
                      onChange={(e) => updatePreferences({
                        marketing: e.target.checked
                      })}
                      className="mr-3"
                    />
                    Receive marketing communications
                  </label>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Security</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      <span>Two-Factor Authentication</span>
                    </div>
                    <Button
                      variant={profile.preferences.twoFactorEnabled ? "secondary" : "primary"}
                      size="sm"
                    >
                      {profile.preferences.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}