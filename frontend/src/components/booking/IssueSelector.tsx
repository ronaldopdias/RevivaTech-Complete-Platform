'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock, Wrench, Camera, Volume2, Wifi, Battery, Smartphone } from 'lucide-react';

interface Issue {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  symptoms: string[];
  difficulty_level: string;
  icon?: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  repair_time_minutes: number;
  success_rate: number;
  parts_required: string[];
}

interface Device {
  id: string;
  display_name: string;
  brand_name: string;
  category_name: string;
  year: number;
}

interface IssueSelectorProps {
  device: Device;
  onIssuesSelect: (issues: Issue[]) => void;
  selectedIssues: Issue[];
  className?: string;
}

const issueIcons = {
  screen: Smartphone,
  battery: Battery,
  charging: Wrench,
  camera: Camera,
  audio: Volume2,
  connectivity: Wifi,
  hardware: Wrench,
  software: AlertTriangle,
  liquid: AlertTriangle,
};

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800',
};

export default function IssueSelector({ device, onIssuesSelect, selectedIssues, className = '' }: IssueSelectorProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3011' : '';

  useEffect(() => {
    if (device?.id) {
      loadDeviceIssues();
    }
  }, [device?.id]);

  const loadDeviceIssues = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/pricing/issues/${device.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      } else {
        throw new Error('Failed to load device issues');
      }
    } catch (err) {
      setError('Failed to load issues. Please try again.');
      console.error('Issues loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueToggle = (issue: Issue) => {
    const isSelected = selectedIssues.some(selected => selected.id === issue.id);
    
    let newSelectedIssues: Issue[];
    if (isSelected) {
      newSelectedIssues = selectedIssues.filter(selected => selected.id !== issue.id);
    } else {
      newSelectedIssues = [...selectedIssues, issue];
    }
    
    onIssuesSelect(newSelectedIssues);
  };

  const handleExpandToggle = (issueId: string) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const formatPrice = (min: number, max: number) => {
    if (min === max) return `£${min}`;
    return `£${min} - £${max}`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Issues...</h3>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadDeviceIssues}
            className="mt-2 text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          What needs to be repaired?
        </h3>
        <p className="text-gray-600">
          Select all issues with your {device.display_name}
        </p>
      </div>

      {/* Selected Issues Summary */}
      {selectedIssues.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            Selected Issues ({selectedIssues.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedIssues.map((issue) => (
              <span
                key={issue.id}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {issue.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No common issues found for this device</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const IconComponent = issueIcons[issue.category as keyof typeof issueIcons] || Wrench;
            const isSelected = selectedIssues.some(selected => selected.id === issue.id);
            const isExpanded = expandedIssue === issue.id;
            
            return (
              <div
                key={issue.id}
                className={`border-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Main Issue Card */}
                <div
                  onClick={() => handleIssueToggle(issue)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{issue.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[issue.difficulty_level as keyof typeof difficultyColors]}`}>
                            {issue.difficulty_level}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(issue.estimated_cost_min, issue.estimated_cost_max)}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(issue.repair_time_minutes)}
                      </div>
                      <div className="text-xs text-green-600">
                        {issue.success_rate}% success
                      </div>
                    </div>
                  </div>

                  {/* Quick symptoms preview */}
                  {issue.symptoms && issue.symptoms.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Common symptoms:</p>
                      <div className="flex flex-wrap gap-1">
                        {issue.symptoms.slice(0, 3).map((symptom, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {symptom}
                          </span>
                        ))}
                        {issue.symptoms.length > 3 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpandToggle(issue.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            +{issue.symptoms.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="space-y-3 pt-3">
                      {/* All Symptoms */}
                      {issue.symptoms && issue.symptoms.length > 3 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">All Symptoms</p>
                          <div className="flex flex-wrap gap-1">
                            {issue.symptoms.map((symptom, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parts Required */}
                      {issue.parts_required && issue.parts_required.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">Parts Required</p>
                          <div className="flex flex-wrap gap-1">
                            {issue.parts_required.map((part, index) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExpandToggle(issue.id);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Show less
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Continue Button */}
      {selectedIssues.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedIssues.length} issue{selectedIssues.length !== 1 ? 's' : ''} selected
            </div>
            <div className="text-lg font-bold text-blue-600">
              Estimated: {formatPrice(
                selectedIssues.reduce((sum, issue) => sum + issue.estimated_cost_min, 0),
                selectedIssues.reduce((sum, issue) => sum + issue.estimated_cost_max, 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}