import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

export interface ProblemDescriptionStepProps {
  device: DeviceModel;
  selectedIssues: string[];
  problemDescription: string;
  urgency: 'standard' | 'priority' | 'emergency';
  onIssuesChange: (issues: string[]) => void;
  onDescriptionChange: (description: string) => void;
  onUrgencyChange: (urgency: 'standard' | 'priority' | 'emergency') => void;
  className?: string;
}

interface IssueButtonProps {
  issue: string;
  isSelected: boolean;
  isCommon: boolean;
  onClick: () => void;
}

const IssueButton: React.FC<IssueButtonProps> = ({ 
  issue, 
  isSelected, 
  isCommon, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={cn(
      'p-3 text-left text-sm border rounded-lg transition-all hover:shadow-sm relative',
      isSelected
        ? 'border-primary bg-primary/5 text-primary shadow-sm'
        : 'border-border hover:border-primary/50',
      isCommon && !isSelected && 'border-amber-200 bg-amber-50'
    )}
  >
    {isCommon && (
      <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
    )}
    <span className="mr-2 font-medium">
      {isSelected ? '✓' : '+'}
    </span>
    {issue}
  </button>
);

const urgencyOptions = [
  {
    key: 'standard' as const,
    title: 'Standard Service',
    description: '5-7 business days',
    details: 'Regular repair timeline with standard parts',
    multiplier: 1,
    icon: '📅',
  },
  {
    key: 'priority' as const,
    title: 'Priority Service',
    description: '2-3 business days',
    details: 'Faster processing with priority handling',
    multiplier: 1.5,
    icon: '⚡',
  },
  {
    key: 'emergency' as const,
    title: 'Emergency Service',
    description: 'Same day/24 hours',
    details: 'Immediate attention for urgent repairs',
    multiplier: 2,
    icon: '🚨',
  },
];

// Common repair issues across all device types
const universalIssues = [
  'Device won\'t turn on',
  'Overheating issues',
  'Software problems',
  'Performance issues',
  'Data recovery needed',
  'Physical damage',
  'Water/liquid damage',
  'Virus or malware',
  'Hardware diagnosis needed',
];

// Device-specific issue suggestions
const getDeviceSpecificIssues = (device: DeviceModel): string[] => {
  const deviceSpecific: string[] = [];
  
  // Screen-related issues for devices with screens
  if (device.categoryId.includes('phone') || device.categoryId.includes('laptop') || 
      device.categoryId === 'iphone' || device.categoryId === 'ipad' || 
      device.categoryId === 'macbook' || device.categoryId === 'imac') {
    deviceSpecific.push(
      'Screen is cracked or damaged',
      'Display issues (lines, flickering)',
      'Touch screen not responding',
      'Backlight not working'
    );
  }

  // Battery issues for portable devices
  if (device.categoryId.includes('phone') || device.categoryId.includes('laptop') || 
      device.categoryId === 'iphone' || device.categoryId === 'ipad' || 
      device.categoryId === 'macbook') {
    deviceSpecific.push(
      'Battery drains quickly',
      'Won\'t charge properly',
      'Battery swelling',
      'Charging port issues'
    );
  }

  // Keyboard issues for laptops
  if (device.categoryId.includes('laptop') || device.categoryId === 'macbook') {
    deviceSpecific.push(
      'Keyboard keys not working',
      'Sticky or unresponsive keys',
      'Trackpad issues',
      'Keyboard backlight not working'
    );
  }

  // Audio issues
  deviceSpecific.push(
    'No sound or audio issues',
    'Microphone not working',
    'Speakers crackling or distorted'
  );

  // Connectivity issues
  deviceSpecific.push(
    'WiFi connection problems',
    'Bluetooth not working',
    'USB ports not working'
  );

  return deviceSpecific;
};

export const ProblemDescriptionStep: React.FC<ProblemDescriptionStepProps> = ({
  device,
  selectedIssues,
  problemDescription,
  urgency,
  onIssuesChange,
  onDescriptionChange,
  onUrgencyChange,
  className,
}) => {
  const [deviceSpecificIssues, setDeviceSpecificIssues] = useState<string[]>([]);

  useEffect(() => {
    setDeviceSpecificIssues(getDeviceSpecificIssues(device));
  }, [device]);

  const handleIssueToggle = (issue: string) => {
    if (selectedIssues.includes(issue)) {
      onIssuesChange(selectedIssues.filter(i => i !== issue));
    } else {
      onIssuesChange([...selectedIssues, issue]);
    }
  };

  const commonIssues = device.commonIssues || [];
  const allSuggestedIssues = [
    ...deviceSpecificIssues,
    ...universalIssues,
  ].filter((issue, index, array) => array.indexOf(issue) === index); // Remove duplicates

  const isDescriptionValid = problemDescription.trim().length >= 10;
  const hasSelectedIssues = selectedIssues.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Describe the Problem</h2>
        <p className="text-muted-foreground">
          Tell us what's wrong with your {device.name} so we can provide the best solution
        </p>
      </div>

      {/* Device context */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
            📱
          </div>
          <div>
            <h3 className="font-semibold">{device.name}</h3>
            <p className="text-sm text-muted-foreground">
              {device.brand} • {device.year}
            </p>
          </div>
        </div>
      </Card>

      {/* Common issues for this device */}
      {commonIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>⭐</span>
            Common Issues for {device.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            These are the most frequently reported problems for your device model
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {commonIssues.map((issue) => (
              <IssueButton
                key={issue}
                issue={issue}
                isSelected={selectedIssues.includes(issue)}
                isCommon={true}
                onClick={() => handleIssueToggle(issue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other possible issues */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Other Possible Issues</h3>
        <p className="text-sm text-muted-foreground">
          Select any additional problems you're experiencing
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allSuggestedIssues
            .filter(issue => !commonIssues.includes(issue))
            .map((issue) => (
              <IssueButton
                key={issue}
                issue={issue}
                isSelected={selectedIssues.includes(issue)}
                isCommon={false}
                onClick={() => handleIssueToggle(issue)}
              />
            ))}
        </div>
      </div>

      {/* Custom description */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Detailed Description</h3>
        <p className="text-sm text-muted-foreground">
          Please provide a detailed description of the problem (minimum 10 characters)
        </p>
        <Textarea
          placeholder={`Describe what happened to your ${device.name}...

Examples:
• When did the problem start?
• What were you doing when it happened?
• Any error messages you've seen?
• Steps you've already tried?

The more detail you provide, the better we can help you.`}
          value={problemDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={6}
          className={cn(
            'w-full resize-none',
            !isDescriptionValid && problemDescription.length > 0 && 'border-red-500'
          )}
        />
        <div className="flex justify-between text-sm">
          <span className={cn(
            'text-muted-foreground',
            !isDescriptionValid && problemDescription.length > 0 && 'text-red-500'
          )}>
            {problemDescription.length < 10 
              ? `${10 - problemDescription.length} more characters needed`
              : `${problemDescription.length} characters`
            }
          </span>
          {isDescriptionValid && (
            <span className="text-green-600">✓ Description looks good</span>
          )}
        </div>
      </div>

      {/* Urgency selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Service Urgency</h3>
        <p className="text-sm text-muted-foreground">
          How quickly do you need your device repaired?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {urgencyOptions.map((option) => {
            const isSelected = urgency === option.key;
            
            return (
              <Card
                key={option.key}
                variant="outlined"
                className={cn(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'hover:border-primary/50'
                )}
                onClick={() => onUrgencyChange(option.key)}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl">{option.icon}</div>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 mx-auto',
                    isSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-border'
                  )}></div>
                  <h4 className="font-semibold">{option.title}</h4>
                  <p className="text-sm font-medium text-primary">
                    {option.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.details}
                  </p>
                  {option.multiplier > 1 && (
                    <div className="text-xs text-orange-600 font-medium">
                      +{Math.round((option.multiplier - 1) * 100)}% surcharge
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold mb-2">Summary</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Selected Issues:</span>{' '}
            {hasSelectedIssues ? (
              <span className="text-green-600">
                {selectedIssues.length} issue{selectedIssues.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span className="text-red-500">Please select at least one issue</span>
            )}
          </div>
          <div>
            <span className="font-medium">Description:</span>{' '}
            {isDescriptionValid ? (
              <span className="text-green-600">Complete</span>
            ) : (
              <span className="text-red-500">
                {problemDescription.length === 0 ? 'Required' : 'Too short'}
              </span>
            )}
          </div>
          <div>
            <span className="font-medium">Service Level:</span>{' '}
            <span className="capitalize">{urgency}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProblemDescriptionStep;