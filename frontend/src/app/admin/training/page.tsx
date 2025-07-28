'use client';

import { useState } from 'react';
import { 
  PlayCircle, 
  Users, 
  BookOpen, 
  Trophy, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import VideoTutorialSystem, { SAMPLE_TUTORIALS, type VideoTutorial } from '@/components/training/VideoTutorialSystem';
import { InteractiveOnboarding, ROLE_BASED_FLOWS } from '@/components/onboarding';
import { useOnboardingContext } from '@/providers/OnboardingProvider';

export default function AdminTrainingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tutorials' | 'onboarding' | 'analytics'>('overview');
  const [selectedRole, setSelectedRole] = useState<'all' | 'customer' | 'admin' | 'technician'>('all');
  const { showOnboarding, resetOnboarding, isOnboardingComplete } = useOnboardingContext();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tutorials', label: 'Video Tutorials', icon: <PlayCircle className="w-4 h-4" /> },
    { id: 'onboarding', label: 'Onboarding System', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: 'Training Analytics', icon: <Trophy className="w-4 h-4" /> }
  ];

  const TrainingOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Tutorials</p>
              <p className="text-2xl font-bold text-neutral-900">{SAMPLE_TUTORIALS.length}</p>
            </div>
            <PlayCircle className="w-8 h-8 text-trust-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Active Users</p>
              <p className="text-2xl font-bold text-neutral-900">1,247</p>
            </div>
            <Users className="w-8 h-8 text-professional-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Completion Rate</p>
              <p className="text-2xl font-bold text-neutral-900">87%</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Training Hours</p>
              <p className="text-2xl font-bold text-neutral-900">3,421</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Role-based Training Flows */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Training Flows by Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLE_BASED_FLOWS.map(flow => (
            <Card key={flow.role} className="p-4 border-l-4 border-l-trust-500">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${flow.color}`}>
                  {flow.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-700">{flow.title}</h4>
                  <p className="text-sm text-neutral-500">{flow.estimatedTime}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">{flow.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-professional-700">
                  {flow.modules.length} modules
                </span>
                <Badge variant="secondary" className="text-xs">
                  {flow.role}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={showOnboarding}
            className="bg-trust-500 hover:bg-trust-700 text-white"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Preview Onboarding
          </Button>
          <Button 
            onClick={resetOnboarding}
            variant="secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Onboarding Data
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Analytics
          </Button>
          <Button variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Tutorial
          </Button>
        </div>
      </Card>
    </div>
  );

  const TutorialManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-700">Video Tutorial Management</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-neutral-400" />
            <Input placeholder="Search tutorials..." className="w-64" />
          </div>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded text-sm"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
          </select>
          <Button className="bg-trust-500 hover:bg-trust-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Tutorial
          </Button>
        </div>
      </div>

      <VideoTutorialSystem
        tutorials={SAMPLE_TUTORIALS}
        userRole={selectedRole === 'all' ? undefined : selectedRole}
        showPlaylist={true}
        enableInteractive={true}
        onProgress={(tutorialId, progress) => {
          console.log('Tutorial progress:', tutorialId, progress);
        }}
        onComplete={(tutorialId) => {
          console.log('Tutorial completed:', tutorialId);
        }}
      />
    </div>
  );

  const OnboardingManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-700">Onboarding System Management</h3>
        <div className="flex items-center space-x-2">
          <Badge variant={isOnboardingComplete ? 'default' : 'secondary'}>
            {isOnboardingComplete ? 'Completed' : 'Pending'}
          </Badge>
          <Button 
            onClick={showOnboarding}
            className="bg-professional-500 hover:bg-professional-700 text-white"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Test Onboarding Flow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Statistics */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-neutral-700 mb-4">Onboarding Statistics</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Total Users Onboarded</span>
              <span className="font-semibold text-neutral-900">2,847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Average Completion Time</span>
              <span className="font-semibold text-neutral-900">12 minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Skip Rate</span>
              <span className="font-semibold text-neutral-900">8.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">User Satisfaction</span>
              <span className="font-semibold text-neutral-900">4.7/5.0</span>
            </div>
          </div>
        </Card>

        {/* Role Distribution */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-neutral-700 mb-4">User Role Distribution</h4>
          <div className="space-y-3">
            {ROLE_BASED_FLOWS.map(flow => (
              <div key={flow.role} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${flow.color.split(' ')[0]}`} />
                  <span className="text-neutral-700 capitalize">{flow.role}</span>
                </div>
                <span className="font-semibold text-neutral-900">
                  {Math.floor(Math.random() * 1000) + 100}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Onboarding Flow Preview */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-neutral-700 mb-4">Onboarding Flow Configuration</h4>
        <p className="text-neutral-600 mb-4">
          The onboarding system uses AI-powered adaptive flows with role-based training modules.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-neutral-200 rounded-lg">
            <h5 className="font-semibold text-neutral-700 mb-2">Experience Assessment</h5>
            <p className="text-sm text-neutral-600">Adaptive questionnaire to determine user experience level</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded-lg">
            <h5 className="font-semibold text-neutral-700 mb-2">Role-Based Training</h5>
            <p className="text-sm text-neutral-600">Customized training modules for each user role</p>
          </div>
          <div className="p-4 border border-neutral-200 rounded-lg">
            <h5 className="font-semibold text-neutral-700 mb-2">Competency Validation</h5>
            <p className="text-sm text-neutral-600">Assessment and certification system</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const TrainingAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-700">Training Analytics & Performance</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-neutral-700 mb-4">Completion Rates by Role</h4>
          <div className="space-y-4">
            {ROLE_BASED_FLOWS.map(flow => (
              <div key={flow.role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-700 capitalize">{flow.role}</span>
                  <span className="font-semibold text-neutral-900">
                    {Math.floor(Math.random() * 20) + 80}%
                  </span>
                </div>
                <div className="bg-neutral-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${flow.color.split(' ')[0]}`}
                    style={{ width: `${Math.floor(Math.random() * 20) + 80}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-semibold text-neutral-700 mb-4">Popular Tutorials</h4>
          <div className="space-y-3">
            {SAMPLE_TUTORIALS.slice(0, 5).map((tutorial, index) => (
              <div key={tutorial.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-700">{tutorial.title}</p>
                  <p className="text-sm text-neutral-500">{tutorial.category}</p>
                </div>
                <Badge variant="secondary">
                  {Math.floor(Math.random() * 500) + 100} views
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="text-lg font-semibold text-neutral-700 mb-4">Training Effectiveness Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-professional-600 mb-2">94%</div>
            <p className="text-neutral-600">User Satisfaction</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-trust-600 mb-2">76%</div>
            <p className="text-neutral-600">Feature Adoption</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">89%</div>
            <p className="text-neutral-600">Task Success Rate</p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Training & Onboarding Management</h1>
          <p className="text-neutral-600 mt-2">
            Manage video tutorials, onboarding flows, and track training effectiveness
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-trust-500 text-trust-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <TrainingOverview />}
        {activeTab === 'tutorials' && <TutorialManagement />}
        {activeTab === 'onboarding' && <OnboardingManagement />}
        {activeTab === 'analytics' && <TrainingAnalytics />}
      </div>
    </div>
  );
}