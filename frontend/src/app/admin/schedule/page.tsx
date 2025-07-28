'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import AnalyticsWidget from '@/components/admin/AnalyticsWidget';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  status: 'Available' | 'Busy' | 'Off Duty' | 'On Break';
  currentRepair?: string;
  todaySchedule: number;
  weeklyHours: number;
}

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  technicianId: string;
  technicianName: string;
  serviceType: string;
  deviceType: string;
  scheduledTime: string;
  duration: number; // in minutes
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
  location: 'Workshop' | 'Customer Location' | 'Remote';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  notes?: string;
  estimatedCompletion?: string;
}

export default function AdminSchedulePage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        // Fetch both technicians and appointments
        const [techResponse, appointmentsResponse] = await Promise.all([
          fetch('/api/admin/technicians'),
          fetch('/api/admin/appointments')
        ]);

        if (!techResponse.ok || !appointmentsResponse.ok) {
          // Fallback to mock data
          setTechnicians([
            {
              id: 'TECH-001',
              name: 'Sarah Mitchell',
              email: 'sarah.mitchell@revivatech.co.uk',
              phone: '+44 7700 900200',
              specializations: ['iPhone Repair', 'iPad Repair', 'MacBook Repair'],
              status: 'Available',
              todaySchedule: 6,
              weeklyHours: 38
            },
            {
              id: 'TECH-002',
              name: 'James Carter',
              email: 'james.carter@revivatech.co.uk',
              phone: '+44 7700 900201',
              specializations: ['Android Repair', 'Samsung Repair', 'PC Repair'],
              status: 'Busy',
              currentRepair: 'Samsung Galaxy S24 Screen',
              todaySchedule: 8,
              weeklyHours: 42
            },
            {
              id: 'TECH-003',
              name: 'Emily Davis',
              email: 'emily.davis@revivatech.co.uk',
              phone: '+44 7700 900202',
              specializations: ['Data Recovery', 'Logic Board Repair', 'Diagnostic'],
              status: 'Available',
              todaySchedule: 4,
              weeklyHours: 35
            },
            {
              id: 'TECH-004',
              name: 'Michael Thompson',
              email: 'michael.thompson@revivatech.co.uk',
              phone: '+44 7700 900203',
              specializations: ['MacBook Repair', 'iMac Repair', 'Hardware Upgrade'],
              status: 'On Break',
              todaySchedule: 5,
              weeklyHours: 40
            }
          ]);

          setAppointments([
            {
              id: 'APT-001',
              customerId: 'CUST-001',
              customerName: 'Sarah Thompson',
              customerPhone: '+44 7700 900123',
              technicianId: 'TECH-001',
              technicianName: 'Sarah Mitchell',
              serviceType: 'Screen Repair',
              deviceType: 'iPhone 15 Pro',
              scheduledTime: `${selectedDate}T09:00:00`,
              duration: 120,
              status: 'Scheduled',
              location: 'Workshop',
              priority: 'Medium',
              notes: 'Customer prefers morning appointments'
            },
            {
              id: 'APT-002',
              customerId: 'CUST-002',
              customerName: 'James Rodriguez',
              customerPhone: '+44 7700 900124',
              technicianId: 'TECH-002',
              technicianName: 'James Carter',
              serviceType: 'Battery Replacement',
              deviceType: 'Samsung Galaxy S24',
              scheduledTime: `${selectedDate}T10:30:00`,
              duration: 90,
              status: 'In Progress',
              location: 'Workshop',
              priority: 'High',
              notes: 'Express service requested'
            },
            {
              id: 'APT-003',
              customerId: 'CUST-003',
              customerName: 'Emily Chen',
              customerPhone: '+44 7700 900125',
              technicianId: 'TECH-003',
              technicianName: 'Emily Davis',
              scheduledTime: `${selectedDate}T14:00:00`,
              serviceType: 'Data Recovery',
              deviceType: 'MacBook Pro 16"',
              duration: 180,
              status: 'Scheduled',
              location: 'Workshop',
              priority: 'Urgent',
              notes: 'Important business data - handle with care'
            },
            {
              id: 'APT-004',
              customerId: 'CUST-004',
              customerName: 'David Wilson',
              customerPhone: '+44 7700 900126',
              technicianId: 'TECH-004',
              technicianName: 'Michael Thompson',
              serviceType: 'Diagnostic',
              deviceType: 'iMac 27"',
              scheduledTime: `${selectedDate}T16:00:00`,
              duration: 60,
              status: 'Scheduled',
              location: 'Customer Location',
              priority: 'Low',
              notes: 'On-site visit required'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch schedule data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedDate]);

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = appointment.scheduledTime.split('T')[0];
    const matchesDate = appointmentDate === selectedDate;
    const matchesTechnician = selectedTechnician === 'all' || appointment.technicianId === selectedTechnician;
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = 
      appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDate && matchesTechnician && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTechnicianStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Busy': return 'bg-red-100 text-red-800';
      case 'Off Duty': return 'bg-gray-100 text-gray-800';
      case 'On Break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddAppointment = () => {
    console.log('Adding new appointment');
  };

  const handleEditAppointment = (appointmentId: string) => {
    console.log('Editing appointment:', appointmentId);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    console.log('Deleting appointment:', appointmentId);
  };

  const handleCompleteAppointment = (appointmentId: string) => {
    console.log('Completing appointment:', appointmentId);
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Management</h1>
            <p className="text-gray-600">Manage technician schedules and appointments</p>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
            <Button onClick={handleAddAppointment}>
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </div>
        </div>

        {/* Schedule Analytics */}
        <div className="mb-8">
          <AnalyticsWidget 
            variant="detailed"
            categories={['bookings', 'performance']}
            maxItems={4}
            showRefresh={true}
            showViewAll={true}
            className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200"
          />
        </div>

        {/* Technician Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {technicians.map((technician) => (
            <Card key={technician.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{technician.name}</div>
                    <div className="text-sm text-gray-500">{technician.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTechnicianStatusColor(technician.status)}`}>
                    {technician.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today:</span>
                  <span className="text-gray-900">{technician.todaySchedule} appointments</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This week:</span>
                  <span className="text-gray-900">{technician.weeklyHours}h</span>
                </div>
              </div>

              {technician.currentRepair && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <div className="text-blue-800 font-medium">Current Repair:</div>
                  <div className="text-blue-600">{technician.currentRepair}</div>
                </div>
              )}

              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Specializations:</div>
                <div className="flex flex-wrap gap-1">
                  {technician.specializations.slice(0, 2).map((spec) => (
                    <span key={spec} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {spec}
                    </span>
                  ))}
                  {technician.specializations.length > 2 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      +{technician.specializations.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search appointments by customer, device, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Technicians</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
              
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Appointments List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Technician</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(appointment.scheduledTime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">{appointment.duration}min</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{appointment.customerName}</div>
                        <div className="text-xs text-gray-500">{appointment.customerPhone}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{appointment.serviceType}</div>
                        <div className="text-xs text-gray-500">{appointment.deviceType}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{appointment.technicianName}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                        {appointment.priority}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        {appointment.location === 'Customer Location' && <MapPin className="w-4 h-4 mr-1" />}
                        {appointment.location}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {appointment.status === 'Scheduled' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">No appointments match your search criteria for the selected date.</p>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}