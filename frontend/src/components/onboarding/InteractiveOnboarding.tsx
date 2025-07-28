'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Rocket, 
  Shield, 
  Clock, 
  Users,
  Settings,
  Monitor,
  Wrench,
  Star,
  Award,
  PlayCircle,
  BookOpen,
  Target,
  TrendingUp,
  UserCheck,
  Lock,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

// User role definitions for adaptive onboarding
export type UserRole = 'customer' | 'admin' | 'technician' | 'business' | 'new';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  required: boolean;
  videoUrl?: string;
  interactiveElements?: Array<{
    type: 'quiz' | 'simulation' | 'checklist';
    content: any;
  }>;
  competencyRequirements?: string[];
}

export interface RoleBasedFlow {
  role: UserRole;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  modules: TrainingModule[];
  estimatedTime: string;
  successCriteria: string[];
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<OnboardingStepProps>;
  optional?: boolean;
  completed?: boolean;
  roleSpecific?: UserRole[];
}

interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  onComplete: (data?: any) => void;
  data?: any;
  userRole?: UserRole;
  selectedFlow?: RoleBasedFlow;
}

interface InteractiveOnboardingProps {
  userRole?: UserRole;
  onComplete: (data: any) => void;
  onSkip: () => void;
  showWelcome?: boolean;
  enableRoleSelection?: boolean;
  customModules?: TrainingModule[];
}

// Define role-based training flows
const ROLE_BASED_FLOWS: RoleBasedFlow[] = [
  {
    role: 'customer',
    title: 'Customer Experience',
    description: 'Learn to book repairs, track progress, and manage your devices',
    color: 'bg-trust-500 text-white', // Trust Blue from brand theme
    icon: <Users className="w-6 h-6" />,
    estimatedTime: '5-10 minutes',
    successCriteria: [
      'Complete device booking simulation',
      'Understand repair tracking system',
      'Set up notification preferences'
    ],
    modules: [
      {
        id: 'customer_booking',
        title: 'How to Book a Repair',
        description: 'Step-by-step guide to booking your first repair',
        duration: '3 min',
        difficulty: 'beginner',
        required: true,
        videoUrl: '/training/customer-booking.mp4',
        interactiveElements: [
          {
            type: 'simulation',
            content: {
              scenario: 'Book a laptop screen repair',
              steps: ['Select device', 'Describe issue', 'Choose appointment', 'Confirm booking']
            }
          }
        ]
      },
      {
        id: 'customer_tracking',
        title: 'Track Your Repair',
        description: 'Monitor real-time progress and communicate with technicians',
        duration: '2 min',
        difficulty: 'beginner',
        required: true,
        interactiveElements: [
          {
            type: 'checklist',
            content: {
              items: ['Access customer portal', 'View repair status', 'Send messages', 'Review updates']
            }
          }
        ]
      },
      {
        id: 'customer_portal',
        title: 'Customer Portal Features',
        description: 'Explore your dashboard and account features',
        duration: '2 min',
        difficulty: 'beginner',
        required: false
      }
    ]
  },
  {
    role: 'admin',
    title: 'Administrative Control',
    description: 'Master the admin dashboard, analytics, and system management',
    color: 'bg-professional-500 text-white', // Professional Teal from brand theme
    icon: <Settings className="w-6 h-6" />,
    estimatedTime: '15-20 minutes',
    successCriteria: [
      'Navigate all dashboard sections',
      'Understand key metrics and reports',
      'Configure system settings',
      'Master user management'
    ],
    modules: [
      {
        id: 'admin_dashboard',
        title: 'Dashboard Overview',
        description: 'Navigate the admin interface and understand key metrics',
        duration: '5 min',
        difficulty: 'intermediate',
        required: true,
        videoUrl: '/training/admin-dashboard.mp4',
        competencyRequirements: ['Basic computer skills', 'Management experience']
      },
      {
        id: 'admin_analytics',
        title: 'Analytics & Reporting',
        description: 'Generate reports and analyze business performance',
        duration: '4 min',
        difficulty: 'intermediate',
        required: true,
        interactiveElements: [
          {
            type: 'simulation',
            content: {
              scenario: 'Generate monthly performance report',
              metrics: ['Revenue', 'Repair volume', 'Customer satisfaction', 'Technician efficiency']
            }
          }
        ]
      },
      {
        id: 'admin_users',
        title: 'User Management',
        description: 'Manage customer accounts, technicians, and permissions',
        duration: '3 min',
        difficulty: 'intermediate',
        required: true
      },
      {
        id: 'admin_settings',
        title: 'System Configuration',
        description: 'Configure business settings, pricing, and integrations',
        duration: '4 min',
        difficulty: 'advanced',
        required: false
      }
    ]
  },
  {
    role: 'technician',
    title: 'Technical Operations',
    description: 'Learn repair workflows, customer communication, and quality standards',
    color: 'bg-neutral-700 text-white', // Neutral Grey from brand theme
    icon: <Wrench className="w-6 h-6" />,
    estimatedTime: '10-15 minutes',
    successCriteria: [
      'Complete repair workflow simulation',
      'Understand quality standards',
      'Master customer communication tools'
    ],
    modules: [
      {
        id: 'tech_workflow',
        title: 'Repair Workflow',
        description: 'Standard procedures from intake to completion',
        duration: '6 min',
        difficulty: 'intermediate',
        required: true,
        videoUrl: '/training/tech-workflow.mp4',
        interactiveElements: [
          {
            type: 'simulation',
            content: {
              scenario: 'Process a phone screen replacement',
              steps: ['Initial diagnosis', 'Parts ordering', 'Repair execution', 'Quality check', 'Customer notification']
            }
          }
        ]
      },
      {
        id: 'tech_communication',
        title: 'Customer Communication',
        description: 'Best practices for updates and issue reporting',
        duration: '3 min',
        difficulty: 'beginner',
        required: true
      },
      {
        id: 'tech_quality',
        title: 'Quality Standards',
        description: 'RevivaTech quality checklist and procedures',
        duration: '4 min',
        difficulty: 'intermediate',
        required: true,
        competencyRequirements: ['Technical certification', 'Repair experience']
      }
    ]
  },
  {
    role: 'business',
    title: 'Business Partnership',
    description: 'Enterprise features, bulk management, and business analytics',
    color: 'bg-gradient-to-r from-professional-500 to-trust-500 text-white',
    icon: <Briefcase className="w-6 h-6" />,
    estimatedTime: '12-18 minutes',
    successCriteria: [
      'Understand enterprise features',
      'Set up bulk device management',
      'Configure business analytics'
    ],
    modules: [
      {
        id: 'business_features',
        title: 'Enterprise Features',
        description: 'Bulk bookings, priority support, and dedicated account management',
        duration: '5 min',
        difficulty: 'intermediate',
        required: true
      },
      {
        id: 'business_analytics',
        title: 'Business Intelligence',
        description: 'Advanced reporting and ROI tracking',
        duration: '4 min',
        difficulty: 'advanced',
        required: true
      },
      {
        id: 'business_integration',
        title: 'System Integration',
        description: 'API access and third-party integrations',
        duration: '6 min',
        difficulty: 'advanced',
        required: false
      }
    ]
  }
];

// Enhanced Welcome Step with Role Selection
const EnhancedWelcomeStep = ({ onNext, onComplete, userRole }: OnboardingStepProps & { userRole?: UserRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole || 'customer');
  const [showRoleSelection, setShowRoleSelection] = useState(!userRole);

  const handleContinue = () => {
    onComplete({ selectedRole, userType: selectedRole });
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-trust-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto">
          <Rocket className="w-10 h-10 text-trust-700" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-700">Welcome to RevivaTech!</h2>
        <p className="text-lg text-neutral-600 max-w-md mx-auto">
          Professional device repair services with real-time tracking and transparent pricing.
        </p>
      </div>

      {/* Trust signals using brand theme colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4">
          <Shield className="w-8 h-8 text-trust-700 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-700">Secure & Trusted</h3>
          <p className="text-sm text-neutral-600">Your devices and data are safe with us</p>
        </div>
        <div className="text-center p-4">
          <Clock className="w-8 h-8 text-professional-700 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-700">Fast Turnaround</h3>
          <p className="text-sm text-neutral-600">Quick repairs without compromising quality</p>
        </div>
        <div className="text-center p-4">
          <Users className="w-8 h-8 text-professional-500 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-700">Expert Support</h3>
          <p className="text-sm text-neutral-600">Professional technicians at your service</p>
        </div>
      </div>

      {/* Role Selection */}
      {showRoleSelection && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-700">Choose your experience</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {ROLE_BASED_FLOWS.map(flow => (
              <Card
                key={flow.role}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                  selectedRole === flow.role 
                    ? 'border-trust-500 bg-trust-50' 
                    : 'border-neutral-300 hover:border-trust-300'
                }`}
                onClick={() => setSelectedRole(flow.role)}
              >
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${flow.color}`}>
                    {flow.icon}
                  </div>
                  <h4 className="font-semibold text-neutral-700">{flow.title}</h4>
                  <p className="text-xs text-neutral-600">{flow.description}</p>
                  <p className="text-xs text-professional-700 font-medium">{flow.estimatedTime}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button 
          onClick={handleContinue} 
          className="w-full bg-trust-500 hover:bg-trust-700 text-white" 
          size="lg"
        >
          Start Training Journey
        </Button>
        <p className="text-sm text-neutral-500">
          This personalized setup will help you master the platform quickly
        </p>
      </div>
    </div>
  );
};

// Training Module Step Component
const TrainingModuleStep = ({ onNext, onPrevious, onComplete, data, selectedFlow }: OnboardingStepProps & { selectedFlow?: RoleBasedFlow }) => {
  const [currentModule, setCurrentModule] = useState(0);
  const [moduleProgress, setModuleProgress] = useState<Record<string, boolean>>({});
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  if (!selectedFlow) {
    return <div>No training flow selected</div>;
  }

  const modules = selectedFlow.modules;
  const currentModuleData = modules[currentModule];

  const handleModuleComplete = (moduleId: string) => {
    setModuleProgress(prev => ({ ...prev, [moduleId]: true }));
    
    if (currentModule < modules.length - 1) {
      setCurrentModule(currentModule + 1);
    } else {
      // All modules completed
      onComplete({ 
        completedModules: Object.keys(moduleProgress).length + 1,
        totalModules: modules.length,
        role: selectedFlow.role,
        competencyAchieved: true
      });
    }
  };

  const completedCount = Object.keys(moduleProgress).length + (currentModule === modules.length - 1 ? 1 : 0);
  const progressPercentage = (completedCount / modules.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-700">{selectedFlow.title} Training</h2>
          <div className="text-sm text-neutral-600">
            {completedCount} of {modules.length} modules completed
          </div>
        </div>
        
        <div className="bg-neutral-300 rounded-full h-2">
          <div
            className="bg-professional-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Module */}
      <Card className="p-6 border-l-4 border-l-trust-500">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold text-neutral-700">{currentModuleData.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentModuleData.difficulty === 'beginner' 
                    ? 'bg-green-100 text-green-700'
                    : currentModuleData.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {currentModuleData.difficulty}
                </span>
                {currentModuleData.required && (
                  <span className="px-2 py-1 bg-trust-100 text-trust-700 rounded text-xs font-medium">
                    Required
                  </span>
                )}
              </div>
              <p className="text-neutral-600">{currentModuleData.description}</p>
              <div className="flex items-center space-x-4 text-sm text-neutral-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentModuleData.duration}</span>
                </span>
                {currentModuleData.videoUrl && (
                  <span className="flex items-center space-x-1">
                    <PlayCircle className="w-4 h-4" />
                    <span>Video included</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Video Player Simulation */}
          {currentModuleData.videoUrl && (
            <div className="bg-neutral-100 rounded-lg p-8 text-center">
              {!isPlayingVideo ? (
                <Button
                  onClick={() => setIsPlayingVideo(true)}
                  className="bg-professional-500 hover:bg-professional-700 text-white"
                  size="lg"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Watch Training Video
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-neutral-800 h-48 rounded flex items-center justify-center">
                    <span className="text-white">🎥 Training Video Playing...</span>
                  </div>
                  <Button
                    onClick={() => setIsPlayingVideo(false)}
                    variant="secondary"
                  >
                    Video Completed ✓
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Interactive Elements */}
          {currentModuleData.interactiveElements?.map((element, index) => (
            <div key={index} className="bg-trust-50 p-4 rounded-lg">
              <h4 className="font-semibold text-neutral-700 mb-2 capitalize">
                {element.type} Exercise
              </h4>
              {element.type === 'simulation' && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">Scenario: {element.content.scenario}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {element.content.steps?.map((step: string, stepIndex: number) => (
                      <div key={stepIndex} className="bg-white p-2 rounded text-sm border">
                        {stepIndex + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {element.type === 'checklist' && (
                <div className="space-y-2">
                  {element.content.items?.map((item: string, itemIndex: number) => (
                    <label key={itemIndex} className="flex items-center space-x-2">
                      <Checkbox />
                      <span className="text-sm text-neutral-700">{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Competency Requirements */}
          {currentModuleData.competencyRequirements && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-neutral-700 mb-2">Prerequisites</h4>
              <ul className="space-y-1">
                {currentModuleData.competencyRequirements.map((req, index) => (
                  <li key={index} className="text-sm text-neutral-600 flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-yellow-600" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onPrevious}
          disabled={currentModule === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous Module
        </Button>
        
        <div className="flex space-x-2">
          {!currentModuleData.required && (
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => handleModuleComplete(currentModuleData.id)}
              className="text-neutral-500"
            >
              Skip Module
            </Button>
          )}
          <Button 
            type="button"
            onClick={() => handleModuleComplete(currentModuleData.id)}
            className="bg-trust-500 hover:bg-trust-700 text-white"
          >
            {currentModule === modules.length - 1 ? 'Complete Training' : 'Next Module'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Competency Assessment Step
const CompetencyAssessmentStep = ({ onNext, onPrevious, onComplete, data, selectedFlow }: OnboardingStepProps & { selectedFlow?: RoleBasedFlow }) => {
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [score, setScore] = useState(0);

  if (!selectedFlow) {
    return <div>No training flow selected</div>;
  }

  const handleAssessment = () => {
    // Simulate assessment
    const simulatedScore = Math.floor(Math.random() * 20) + 80; // 80-100%
    setScore(simulatedScore);
    setAssessmentComplete(true);
    
    setTimeout(() => {
      onComplete({
        assessmentScore: simulatedScore,
        competencyAchieved: simulatedScore >= 80,
        certificateEarned: simulatedScore >= 90,
        role: selectedFlow.role
      });
    }, 2000);
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-professional-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto">
          <Target className="w-10 h-10 text-professional-700" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-700">Competency Assessment</h2>
        <p className="text-lg text-neutral-600 max-w-md mx-auto">
          Complete this quick assessment to validate your {selectedFlow.title.toLowerCase()} skills
        </p>
      </div>

      {!assessmentComplete ? (
        <div className="space-y-6">
          <Card className="p-6 max-w-lg mx-auto">
            <h3 className="text-xl font-semibold text-neutral-700 mb-4">Success Criteria</h3>
            <ul className="space-y-2 text-left">
              {selectedFlow.successCriteria.map((criteria, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-professional-500" />
                  <span className="text-neutral-600">{criteria}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Button
            onClick={handleAssessment}
            className="bg-professional-500 hover:bg-professional-700 text-white"
            size="lg"
          >
            <Target className="w-5 h-5 mr-2" />
            Start Assessment
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto ${
            score >= 90 ? 'bg-green-100' : score >= 80 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                score >= 90 ? 'text-green-600' : score >= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {score}%
              </div>
              {score >= 90 && <Award className="w-6 h-6 text-green-600 mx-auto mt-1" />}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-neutral-700">
              {score >= 90 ? 'Excellent!' : score >= 80 ? 'Well Done!' : 'Keep Learning!'}
            </h3>
            <p className="text-neutral-600">
              {score >= 90 
                ? 'You\'ve earned a certificate of competency!' 
                : score >= 80 
                ? 'You\'ve passed the competency assessment!' 
                : 'Consider reviewing the training materials and trying again.'}
            </p>
          </div>

          {score >= 80 && (
            <div className="bg-trust-50 p-4 rounded-lg max-w-md mx-auto">
              <div className="flex items-center space-x-2 justify-center">
                <Award className="w-5 h-5 text-trust-700" />
                <span className="font-semibold text-trust-700">
                  {selectedFlow.title} Competency {score >= 90 ? 'Certificate' : 'Badge'} Earned
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {assessmentComplete && score >= 80 && (
          <Button 
            onClick={() => onComplete({ assessmentScore: score, certificateEarned: score >= 90 })}
            className="bg-trust-500 hover:bg-trust-700 text-white"
          >
            Continue to Dashboard
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Main Interactive Onboarding Component
const InteractiveOnboarding = ({ 
  userRole,
  onComplete, 
  onSkip, 
  showWelcome = true,
  enableRoleSelection = true,
  customModules
}: InteractiveOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [collectedData, setCollectedData] = useState<any>({});
  const [selectedFlow, setSelectedFlow] = useState<RoleBasedFlow | null>(null);

  // Initialize selected flow based on user role
  useEffect(() => {
    if (userRole && !selectedFlow) {
      const flow = ROLE_BASED_FLOWS.find(f => f.role === userRole);
      if (flow) setSelectedFlow(flow);
    }
  }, [userRole, selectedFlow]);

  const steps: OnboardingStep[] = [
    ...(showWelcome ? [{
      id: 'welcome',
      title: 'Welcome & Role Selection',
      description: 'Welcome to RevivaTech Training',
      icon: <Rocket className="w-5 h-5" />,
      component: EnhancedWelcomeStep,
    }] : []),
    {
      id: 'training',
      title: 'Training Modules',
      description: 'Complete your role-specific training',
      icon: <BookOpen className="w-5 h-5" />,
      component: TrainingModuleStep,
    },
    {
      id: 'assessment',
      title: 'Competency Assessment',
      description: 'Validate your skills',
      icon: <Target className="w-5 h-5" />,
      component: CompetencyAssessmentStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (data?: any) => {
    const stepData = { ...collectedData, [steps[currentStep].id]: data };
    setCollectedData(stepData);

    // Set selected flow if role was chosen in welcome step
    if (steps[currentStep].id === 'welcome' && data?.selectedRole) {
      const flow = ROLE_BASED_FLOWS.find(f => f.role === data.selectedRole);
      if (flow) setSelectedFlow(flow);
    }
    
    if (currentStep === steps.length - 1) {
      // Training completed
      onComplete({ 
        ...stepData,
        trainingCompleted: true,
        selectedFlow: selectedFlow?.role,
        timestamp: new Date().toISOString()
      });
      setIsVisible(false);
    } else {
      handleNext();
    }
  };

  const handleSkipOnboarding = () => {
    onSkip();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header with Brand Colors */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-trust-50 to-professional-50">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-neutral-700">
              {selectedFlow ? `${selectedFlow.title} Training` : 'Interactive Training'}
            </h1>
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-trust-500' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="text-neutral-500 hover:text-neutral-700"
            >
              Skip training
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="px-6 py-3 bg-neutral-50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
            <span className="text-neutral-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </span>
          </div>
          <div className="mt-2 bg-neutral-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-trust-500 to-professional-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <CurrentStepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleStepComplete}
            onSkip={steps[currentStep].optional ? handleNext : undefined}
            data={collectedData[steps[currentStep].id]}
            userRole={collectedData.welcome?.selectedRole || userRole}
            selectedFlow={selectedFlow}
          />
        </div>
      </div>
    </div>
  );
};

export default InteractiveOnboarding;
export { ROLE_BASED_FLOWS, type RoleBasedFlow, type TrainingModule };