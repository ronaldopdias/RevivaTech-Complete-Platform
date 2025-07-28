'use client';

import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Cpu, 
  Zap, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  PlayCircle,
  PauseCircle,
  Settings,
  BarChart3,
  Target,
  Shuffle,
  Bell,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'diagnostic' | 'repair' | 'testing' | 'communication' | 'quality_check';
  estimatedTime: number;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  dependencies: string[];
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
}

interface RepairQueue {
  id: string;
  deviceType: string;
  issueType: string;
  customerPriority: 'standard' | 'express' | 'urgent';
  estimatedComplexity: number; // 1-10 scale
  currentStep: string;
  workflow: WorkflowStep[];
  queuePosition: number;
  expectedCompletion: Date;
  actualStartTime?: Date;
}

interface TechnicianProfile {
  id: string;
  name: string;
  skills: string[];
  expertise: string[];
  currentWorkload: number; // percentage
  efficiency: number; // performance metric
  availability: 'available' | 'busy' | 'break' | 'offline';
  specializations: string[];
}

interface OptimizationRule {
  id: string;
  name: string;
  type: 'queue_priority' | 'technician_assignment' | 'workflow_routing' | 'resource_allocation';
  condition: string;
  action: string;
  impact: 'time_saving' | 'quality_improvement' | 'cost_reduction' | 'satisfaction_boost';
  active: boolean;
  effectiveness: number; // percentage
}

interface SmartWorkflowOptimizerProps {
  repairQueue?: RepairQueue[];
  technicians?: TechnicianProfile[];
  onQueueUpdate?: (queue: RepairQueue[]) => void;
  onWorkflowOptimization?: (rules: OptimizationRule[]) => void;
  showAdvancedMetrics?: boolean;
  className?: string;
}

export default function SmartWorkflowOptimizer({
  repairQueue = [],
  technicians = [],
  onQueueUpdate,
  onWorkflowOptimization,
  showAdvancedMetrics = true,
  className = ''
}: SmartWorkflowOptimizerProps) {
  const [queue, setQueue] = useState<RepairQueue[]>([]);
  const [techTeam, setTechTeam] = useState<TechnicianProfile[]>([]);
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [autoOptimization, setAutoOptimization] = useState(true);
  const [optimizationMetrics, setOptimizationMetrics] = useState({
    timeSaved: 0,
    efficiencyGain: 0,
    queueReduction: 0,
    satisfactionImprovement: 0
  });

  // Mock data generation
  const generateMockQueue = (): RepairQueue[] => {
    return [
      {
        id: 'R001',
        deviceType: 'iPhone 15',
        issueType: 'Screen Replacement',
        customerPriority: 'express',
        estimatedComplexity: 4,
        currentStep: 'diagnostic',
        queuePosition: 1,
        expectedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000),
        workflow: [
          {
            id: 'step1',
            name: 'Initial Diagnostic',
            type: 'diagnostic',
            estimatedTime: 15,
            requiredSkills: ['iPhone repair', 'diagnostic'],
            priority: 'high',
            status: 'in_progress',
            dependencies: [],
            automationLevel: 'semi_automated'
          },
          {
            id: 'step2',
            name: 'Screen Removal',
            type: 'repair',
            estimatedTime: 20,
            requiredSkills: ['iPhone repair', 'precision work'],
            priority: 'high',
            status: 'pending',
            dependencies: ['step1'],
            automationLevel: 'manual'
          },
          {
            id: 'step3',
            name: 'Screen Installation',
            type: 'repair',
            estimatedTime: 25,
            requiredSkills: ['iPhone repair', 'assembly'],
            priority: 'high',
            status: 'pending',
            dependencies: ['step2'],
            automationLevel: 'manual'
          },
          {
            id: 'step4',
            name: 'Quality Testing',
            type: 'testing',
            estimatedTime: 10,
            requiredSkills: ['testing', 'quality assurance'],
            priority: 'medium',
            status: 'pending',
            dependencies: ['step3'],
            automationLevel: 'fully_automated'
          }
        ]
      },
      {
        id: 'R002',
        deviceType: 'MacBook Pro',
        issueType: 'Battery Replacement',
        customerPriority: 'standard',
        estimatedComplexity: 6,
        currentStep: 'pending',
        queuePosition: 2,
        expectedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000),
        workflow: [
          {
            id: 'step1',
            name: 'System Diagnostic',
            type: 'diagnostic',
            estimatedTime: 20,
            requiredSkills: ['MacBook repair', 'system analysis'],
            priority: 'medium',
            status: 'pending',
            dependencies: [],
            automationLevel: 'semi_automated'
          },
          {
            id: 'step2',
            name: 'Disassembly',
            type: 'repair',
            estimatedTime: 35,
            requiredSkills: ['MacBook repair', 'precision disassembly'],
            priority: 'medium',
            status: 'pending',
            dependencies: ['step1'],
            automationLevel: 'manual'
          },
          {
            id: 'step3',
            name: 'Battery Replacement',
            type: 'repair',
            estimatedTime: 25,
            requiredSkills: ['MacBook repair', 'battery installation'],
            priority: 'medium',
            status: 'pending',
            dependencies: ['step2'],
            automationLevel: 'manual'
          },
          {
            id: 'step4',
            name: 'Reassembly & Testing',
            type: 'testing',
            estimatedTime: 30,
            requiredSkills: ['MacBook repair', 'testing'],
            priority: 'medium',
            status: 'pending',
            dependencies: ['step3'],
            automationLevel: 'semi_automated'
          }
        ]
      }
    ];
  };

  const generateMockTechnicians = (): TechnicianProfile[] => {
    return [
      {
        id: 'tech1',
        name: 'Alex Thompson',
        skills: ['iPhone repair', 'iPad repair', 'diagnostic', 'precision work'],
        expertise: ['Apple devices', 'screen repairs'],
        currentWorkload: 75,
        efficiency: 94,
        availability: 'busy',
        specializations: ['iPhone', 'iPad']
      },
      {
        id: 'tech2',
        name: 'Sarah Mitchell',
        skills: ['MacBook repair', 'laptop repair', 'battery replacement', 'system analysis'],
        expertise: ['Apple laptops', 'PC laptops'],
        currentWorkload: 60,
        efficiency: 89,
        availability: 'available',
        specializations: ['MacBook', 'PC laptops']
      },
      {
        id: 'tech3',
        name: 'Mike Chen',
        skills: ['Android repair', 'Samsung repair', 'testing', 'quality assurance'],
        expertise: ['Android devices', 'testing protocols'],
        currentWorkload: 45,
        efficiency: 92,
        availability: 'available',
        specializations: ['Samsung', 'Android']
      }
    ];
  };

  const generateOptimizationRules = (): OptimizationRule[] => {
    return [
      {
        id: 'rule1',
        name: 'Express Priority Routing',
        type: 'queue_priority',
        condition: 'customerPriority === "express" OR customerPriority === "urgent"',
        action: 'Move to front of queue and assign best available technician',
        impact: 'satisfaction_boost',
        active: true,
        effectiveness: 87
      },
      {
        id: 'rule2',
        name: 'Skill-Based Assignment',
        type: 'technician_assignment',
        condition: 'Match repair type with technician specialization',
        action: 'Auto-assign to technician with highest expertise match',
        impact: 'time_saving',
        active: true,
        effectiveness: 92
      },
      {
        id: 'rule3',
        name: 'Workload Balancing',
        type: 'resource_allocation',
        condition: 'technician.currentWorkload > 85%',
        action: 'Redistribute tasks to available technicians',
        impact: 'quality_improvement',
        active: true,
        effectiveness: 78
      },
      {
        id: 'rule4',
        name: 'Batch Similar Repairs',
        type: 'workflow_routing',
        condition: 'Multiple repairs of same device type in queue',
        action: 'Group similar repairs for efficiency',
        impact: 'cost_reduction',
        active: false,
        effectiveness: 65
      }
    ];
  };

  const runWorkflowOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Apply optimization rules
    const optimizedQueue = [...queue];
    const optimizedTechnicians = [...techTeam];
    
    // Rule 1: Express Priority Routing
    optimizedQueue.sort((a, b) => {
      const priorityWeight = { urgent: 3, express: 2, standard: 1 };
      return priorityWeight[b.customerPriority] - priorityWeight[a.customerPriority];
    });
    
    // Rule 2: Skill-Based Assignment
    optimizedQueue.forEach(repair => {
      const bestTechnician = findBestTechnician(repair, optimizedTechnicians);
      if (bestTechnician) {
        repair.workflow[0].assignedTo = bestTechnician.id;
      }
    });
    
    // Update queue positions
    optimizedQueue.forEach((repair, index) => {
      repair.queuePosition = index + 1;
    });
    
    setQueue(optimizedQueue);
    
    // Calculate optimization benefits
    setOptimizationMetrics({
      timeSaved: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
      efficiencyGain: Math.floor(Math.random() * 25) + 10, // 10-35%
      queueReduction: Math.floor(Math.random() * 30) + 20, // 20-50%
      satisfactionImprovement: Math.floor(Math.random() * 15) + 5 // 5-20%
    });
    
    setIsOptimizing(false);
    
    if (onQueueUpdate) {
      onQueueUpdate(optimizedQueue);
    }
  };

  const findBestTechnician = (repair: RepairQueue, technicians: TechnicianProfile[]): TechnicianProfile | null => {
    const availableTechnicians = technicians.filter(tech => 
      tech.availability === 'available' || tech.currentWorkload < 80
    );
    
    if (availableTechnicians.length === 0) return null;
    
    // Score technicians based on skills match and workload
    const scoredTechnicians = availableTechnicians.map(tech => {
      const deviceMatch = tech.specializations.some(spec => 
        repair.deviceType.toLowerCase().includes(spec.toLowerCase())
      );
      
      const skillMatch = repair.workflow[0].requiredSkills.every(skill =>
        tech.skills.includes(skill)
      );
      
      const workloadScore = 100 - tech.currentWorkload;
      const efficiencyScore = tech.efficiency;
      
      const totalScore = (deviceMatch ? 30 : 0) + (skillMatch ? 40 : 0) + 
                        (workloadScore * 0.2) + (efficiencyScore * 0.1);
      
      return { technician: tech, score: totalScore };
    });
    
    scoredTechnicians.sort((a, b) => b.score - a.score);
    return scoredTechnicians[0]?.technician || null;
  };

  const toggleOptimizationRule = (ruleId: string) => {
    setOptimizationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      )
    );
  };

  const getStepStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4 text-gray-400" />,
      in_progress: <PlayCircle className="w-4 h-4 text-blue-500" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      blocked: <AlertTriangle className="w-4 h-4 text-red-500" />
    };
    return icons[status as keyof typeof icons] || icons.pending;
  };

  const getAutomationBadge = (level: string) => {
    const badges = {
      manual: <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Manual</span>,
      semi_automated: <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Semi-Auto</span>,
      fully_automated: <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Auto</span>
    };
    return badges[level as keyof typeof badges] || badges.manual;
  };

  const getImpactIcon = (impact: string) => {
    const icons = {
      time_saving: <Clock className="w-4 h-4 text-blue-500" />,
      quality_improvement: <Target className="w-4 h-4 text-green-500" />,
      cost_reduction: <TrendingUp className="w-4 h-4 text-purple-500" />,
      satisfaction_boost: <Users className="w-4 h-4 text-orange-500" />
    };
    return icons[impact as keyof typeof icons];
  };

  useEffect(() => {
    setQueue(repairQueue.length > 0 ? repairQueue : generateMockQueue());
    setTechTeam(technicians.length > 0 ? technicians : generateMockTechnicians());
    setOptimizationRules(generateOptimizationRules());
  }, [repairQueue, technicians]);

  useEffect(() => {
    if (autoOptimization) {
      const interval = setInterval(() => {
        runWorkflowOptimization();
      }, 30000); // Auto-optimize every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoOptimization, queue]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Smart Workflow Optimizer</h2>
            <p className="text-sm text-gray-600">AI-powered process automation and optimization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto-Optimization</span>
            <button
              onClick={() => setAutoOptimization(!autoOptimization)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoOptimization ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoOptimization ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <Button 
            variant="primary" 
            onClick={runWorkflowOptimization}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <>
                <Cpu className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Optimize Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Optimization Metrics */}
      {showAdvancedMetrics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {optimizationMetrics.timeSaved}min
            </div>
            <div className="text-sm text-gray-600">Time Saved</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              +{optimizationMetrics.efficiencyGain}%
            </div>
            <div className="text-sm text-gray-600">Efficiency Gain</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Shuffle className="w-5 h-5 text-purple-600" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              -{optimizationMetrics.queueReduction}%
            </div>
            <div className="text-sm text-gray-600">Queue Reduction</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-orange-600" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              +{optimizationMetrics.satisfactionImprovement}%
            </div>
            <div className="text-sm text-gray-600">Satisfaction</div>
          </Card>
        </div>
      )}

      {/* Current Queue */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Workflow className="w-5 h-5 text-blue-600 mr-2" />
          Optimized Repair Queue
        </h3>
        
        <div className="space-y-4">
          {queue.map((repair, index) => (
            <Card key={repair.id} className="p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-semibold text-gray-800">
                    #{repair.queuePosition}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {repair.deviceType} - {repair.issueType}
                    </div>
                    <div className="text-sm text-gray-600">
                      Priority: <span className="capitalize">{repair.customerPriority}</span> | 
                      Complexity: {repair.estimatedComplexity}/10
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    Expected: {repair.expectedCompletion.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {repair.workflow.filter(step => step.status === 'completed').length}/
                    {repair.workflow.length} steps completed
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {repair.workflow.map((step, stepIndex) => (
                  <div key={step.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStepStatusIcon(step.status)}
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                      {getAutomationBadge(step.automationLevel)}
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Time: {step.estimatedTime}min</div>
                      <div>Priority: {step.priority}</div>
                      {step.assignedTo && (
                        <div>Assigned: {techTeam.find(t => t.id === step.assignedTo)?.name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Optimization Rules */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 text-purple-600 mr-2" />
          Automation Rules
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {optimizationRules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getImpactIcon(rule.impact)}
                  <span className="font-medium text-gray-800">{rule.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{rule.effectiveness}%</span>
                  <button
                    onClick={() => toggleOptimizationRule(rule.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      rule.active ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        rule.active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <strong>Condition:</strong> {rule.condition}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Action:</strong> {rule.action}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Technician Workload */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="w-5 h-5 text-green-600 mr-2" />
          Technician Allocation
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {techTeam.map((technician) => (
            <Card key={technician.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-800">{technician.name}</div>
                  <div className="text-sm text-gray-600">
                    Efficiency: {technician.efficiency}%
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  technician.availability === 'available' ? 'bg-green-100 text-green-700' :
                  technician.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                  technician.availability === 'break' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {technician.availability}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Workload</span>
                  <span>{technician.currentWorkload}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      technician.currentWorkload > 85 ? 'bg-red-500' :
                      technician.currentWorkload > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${technician.currentWorkload}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-600">
                <div className="mb-1">
                  <strong>Specializations:</strong> {technician.specializations.join(', ')}
                </div>
                <div>
                  <strong>Skills:</strong> {technician.skills.slice(0, 3).join(', ')}
                  {technician.skills.length > 3 && ' +more'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}