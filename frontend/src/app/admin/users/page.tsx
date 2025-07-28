'use client';

import React, { useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersList } from '@/components/admin/users/UsersList';
import { UserForm } from '@/components/admin/users/UserForm';
import { ChangePasswordForm } from '@/components/admin/users/ChangePasswordForm';

type ViewMode = 'list' | 'create' | 'edit' | 'change-password';

interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin' | 'technician';
  status: 'active' | 'suspended' | 'inactive';
}

export default function UsersManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateUser = async (data: UserFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3011/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      setViewMode('list');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  const handleEditUser = async (data: UserFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3011/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      setViewMode('list');
      setSelectedUser(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  const handlePasswordChangeSuccess = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-bold">Create New User</h1>
            </div>
            <UserForm
              onSubmit={handleCreateUser}
              onCancel={() => setViewMode('list')}
            />
          </div>
        );

      case 'edit':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-bold">Edit User</h1>
            </div>
            <UserForm
              user={selectedUser}
              onSubmit={handleEditUser}
              onCancel={() => setViewMode('list')}
            />
          </div>
        );

      case 'change-password':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-bold">Change Password</h1>
            </div>
            <ChangePasswordForm
              userId={selectedUser?.id}
              userEmail={selectedUser?.email}
              onSuccess={handlePasswordChangeSuccess}
              onCancel={() => setViewMode('list')}
            />
          </div>
        );

      default:
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold">User Management</h1>
              </div>
            </div>
            <UsersList
              key={refreshKey}
              onEditUser={(user) => {
                setSelectedUser(user);
                setViewMode('edit');
              }}
              onCreateUser={() => setViewMode('create')}
            />
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        {renderContent()}
      </div>
    </AdminLayout>
  );
}