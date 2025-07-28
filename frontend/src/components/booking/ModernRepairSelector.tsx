'use client';

import React, { useState } from 'react';
import { Monitor, Battery, Droplets, HardDrive, Settings, Wrench, Camera, Volume2, Zap, MousePointer, Cog } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RepairType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  commonFor: string[];
}

interface ModernRepairSelectorProps {
  onRepairTypeSelect: (repairType: string) => void;
  selectedRepairType?: string | null;
  deviceCategory?: string;
}

const repairTypes: RepairType[] = [
  {
    id: 'SCREEN_REPAIR',
    name: 'Screen Repair',
    description: 'Cracked, broken, or unresponsive display',
    icon: Monitor,
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    commonFor: ['iPhone', 'iPad', 'MacBook', 'Android Phone'],
  },
  {
    id: 'BATTERY_REPLACEMENT',
    name: 'Battery Replacement',
    description: 'Poor battery life or charging issues',
    icon: Battery,
    estimatedTime: '1-2 hours',
    difficulty: 'Easy',
    commonFor: ['iPhone', 'MacBook', 'Android Phone', 'iPad'],
  },
  {
    id: 'WATER_DAMAGE',
    name: 'Water Damage',
    description: 'Device exposed to liquid or moisture',
    icon: Droplets,
    estimatedTime: '1-3 days',
    difficulty: 'Hard',
    commonFor: ['iPhone', 'Android Phone', 'MacBook', 'iPad'],
  },
  {
    id: 'DATA_RECOVERY',
    name: 'Data Recovery',
    description: 'Recover lost files and documents',
    icon: HardDrive,
    estimatedTime: '2-7 days',
    difficulty: 'Hard',
    commonFor: ['MacBook', 'Desktop PC', 'Gaming Console'],
  },
  {
    id: 'SOFTWARE_ISSUE',
    name: 'Software Issues',
    description: 'OS problems, crashes, or performance issues',
    icon: Settings,
    estimatedTime: '1-4 hours',
    difficulty: 'Easy',
    commonFor: ['MacBook', 'Desktop PC', 'iPhone', 'Android Phone'],
  },
  {
    id: 'HARDWARE_DIAGNOSTIC',
    name: 'Hardware Diagnostic',
    description: 'Identify unknown hardware problems',
    icon: Wrench,
    estimatedTime: '30-60 minutes',
    difficulty: 'Easy',
    commonFor: ['MacBook', 'Desktop PC', 'Gaming Console'],
  },
  {
    id: 'MOTHERBOARD_REPAIR',
    name: 'Motherboard Repair',
    description: 'Logic board or mainboard issues',
    icon: Cog,
    estimatedTime: '3-7 days',
    difficulty: 'Hard',
    commonFor: ['MacBook', 'Desktop PC', 'Gaming Console'],
  },
  {
    id: 'CAMERA_REPAIR',
    name: 'Camera Repair',
    description: 'Camera not working or image quality issues',
    icon: Camera,
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    commonFor: ['iPhone', 'Android Phone', 'iPad'],
  },
  {
    id: 'SPEAKER_REPAIR',
    name: 'Speaker Repair',
    description: 'Audio problems or speaker replacement',
    icon: Volume2,
    estimatedTime: '1-3 hours',
    difficulty: 'Medium',
    commonFor: ['iPhone', 'MacBook', 'Android Phone', 'iPad'],
  },
  {
    id: 'CHARGING_PORT',
    name: 'Charging Port Repair',
    description: 'Charging port or connector issues',
    icon: Zap,
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    commonFor: ['iPhone', 'Android Phone', 'MacBook', 'iPad'],
  },
  {
    id: 'BUTTON_REPAIR',
    name: 'Button Repair',
    description: 'Power, volume, or home button issues',
    icon: MousePointer,
    estimatedTime: '1-2 hours',
    difficulty: 'Easy',
    commonFor: ['iPhone', 'Android Phone', 'Gaming Console'],
  },
  {
    id: 'CUSTOM_REPAIR',
    name: 'Other/Custom Repair',
    description: 'Specific issue not listed above',
    icon: Settings,
    estimatedTime: '1-5 days',
    difficulty: 'Medium',
    commonFor: ['All Devices'],
  },
];

const difficultyColors = {
  Easy: 'text-green-600 bg-green-100',
  Medium: 'text-yellow-600 bg-yellow-100',
  Hard: 'text-red-600 bg-red-100',
};

export default function ModernRepairSelector({ 
  onRepairTypeSelect, 
  selectedRepairType, 
  deviceCategory 
}: ModernRepairSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(selectedRepairType || null);

  // Filter repair types based on device category if provided
  const relevantRepairTypes = deviceCategory
    ? repairTypes.filter(repair => 
        repair.commonFor.some(device => 
          device.toLowerCase().includes(deviceCategory.toLowerCase()) || 
          repair.commonFor.includes('All Devices')
        )
      )
    : repairTypes;

  const handleRepairTypeSelect = (repairTypeId: string) => {
    setSelectedType(repairTypeId);
    onRepairTypeSelect(repairTypeId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          What needs to be repaired?
        </h2>
        <p className="text-gray-600">
          Select the type of repair your device needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relevantRepairTypes.map((repairType) => {
          const IconComponent = repairType.icon;
          const isSelected = selectedType === repairType.id;
          
          return (
            <Card
              key={repairType.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-transparent hover:border-blue-200 hover:shadow-md'
              }`}
              onClick={() => handleRepairTypeSelect(repairType.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{repairType.name}</h3>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    difficultyColors[repairType.difficulty]
                  }`}>
                    {repairType.difficulty}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">{repairType.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Est. time:</span>
                  <span className="font-medium text-gray-700">{repairType.estimatedTime}</span>
                </div>

                {isSelected && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Selected
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="mt-6">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">
                  {repairTypes.find(r => r.id === selectedType)?.name}
                </h4>
                <p className="text-sm text-green-700">
                  {repairTypes.find(r => r.id === selectedType)?.description}
                </p>
              </div>
              <span className="text-green-600 font-semibold">Selected ✓</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}