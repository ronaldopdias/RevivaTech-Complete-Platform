'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Rocket, 
  Star,
  Award,
  Target,
  Users,
  Settings,
  Wrench,
  Briefcase,
  Clock,
  CheckCircle,
  SkipForward,
  RefreshCw,
  Lightbulb,
  Brain,
  Zap,
  Heart,
  TrendingUp,
  Shield,
  BookOpen,
  PlayCircle,
  MessageCircle,
  Gift,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import InteractiveOnboarding, { type UserRole, ROLE_BASED_FLOWS } from './InteractiveOnboarding';
import VideoTutorialSystem, { SAMPLE_TUTORIALS, type VideoTutorial } from '../training/VideoTutorialSystem';

interface UserProfile {
  id: string;
  role: UserRole;
  experience: 'beginner' | 'intermediate' | 'advanced';
  previousPlatformExperience?: boolean;
  completedOnboardingBefore?: boolean;
  preferences: {
    learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
    pace: 'fast' | 'normal' | 'slow';
    skipIntroductions: boolean;
    enableGamification: boolean;
    preferredLanguage: string;
  };
  goals?: string[];
  timeAvailable?: number; // minutes
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  optional?: boolean;
  minExperience?: 'beginner' | 'intermediate' | 'advanced';
  maxExperience?: 'beginner' | 'intermediate' | 'advanced';
  roles?: UserRole[];
  estimatedTime?: number; // minutes
  dependencies?: string[];
  skipConditions?: Array<{
    condition: string;
    reason: string;
  }>;
}

interface SmartOnboardingFlowProps {
  userProfile?: UserProfile;
  onComplete: (data: any) => void;
  onSkip: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
  customSteps?: OnboardingStep[];
  enableAI?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface AdaptiveRecommendation {
  type: 'skip' | 'focus' | 'simplify' | 'expand' | 'alternative';
  step: string;
  reason: string;
  confidence: number;
  action?: () => void;
}

// User Experience Assessment Component
const ExperienceAssessment = ({ onComplete, onSkip }: { onComplete: (data: any) => void; onSkip: () => void }) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: 'role_familiarity',
      question: 'How familiar are you with this type of platform?',
      type: 'scale',
      options: [
        { value: 1, label: 'Complete beginner' },
        { value: 2, label: 'Some experience' },
        { value: 3, label: 'Quite experienced' },
        { value: 4, label: 'Expert user' }
      ]
    },
    {
      id: 'time_available',
      question: 'How much time do you have for onboarding today?',
      type: 'choice',
      options: [
        { value: 5, label: '5 minutes - Just the essentials' },
        { value: 15, label: '15 minutes - Standard walkthrough' },
        { value: 30, label: '30+ minutes - Complete training' }
      ]
    },
    {
      id: 'learning_style',
      question: 'How do you prefer to learn new software?',
      type: 'choice',
      options: [
        { value: 'hands-on', label: 'Try it myself with guidance' },
        { value: 'visual', label: 'Watch videos and demonstrations' },
        { value: 'reading', label: 'Read instructions and documentation' },
        { value: 'mixed', label: 'Combination of all approaches' }
      ]
    },
    {
      id: 'goals',
      question: 'What are your main goals? (Select all that apply)',
      type: 'multiple',
      options: [
        { value: 'quick_start', label: 'Get started as quickly as possible' },
        { value: 'comprehensive', label: 'Learn all features thoroughly' },
        { value: 'specific_task', label: 'Complete a specific task' },
        { value: 'explore', label: 'Explore and understand capabilities' }
      ]
    }
  ];

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate experience level and preferences
      const experience = responses.role_familiarity >= 3 ? 'advanced' : 
                        responses.role_familiarity >= 2 ? 'intermediate' : 'beginner';
      
      onComplete({
        experience,
        timeAvailable: responses.time_available,
        learningStyle: responses.learning_style,
        goals: Array.isArray(responses.goals) ? responses.goals : [responses.goals],
        preferences: {
          learningStyle: responses.learning_style,
          pace: responses.time_available <= 5 ? 'fast' : 'normal',
          skipIntroductions: experience === 'advanced',
          enableGamification: true,
          preferredLanguage: 'en'
        }
      });
    }
  };

  const currentQ = questions[currentQuestion];
  const isAnswered = responses[currentQ.id] !== undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Brain className="w-12 h-12 text-professional-500 mx-auto" />
        <h2 className="text-2xl font-bold text-neutral-700">Smart Onboarding Setup</h2>
        <p className="text-neutral-600">
          Let's personalize your experience in just a few questions
        </p>
        <div className="flex justify-center space-x-1 mt-4">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index <= currentQuestion ? 'bg-professional-500' : 'bg-neutral-300'
              }`}
            />
          ))}
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              {currentQ.question}
            </h3>
            <div className="text-sm text-neutral-500">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>

          <div className="space-y-3">
            {currentQ.type === 'scale' && (
              <div className="grid grid-cols-1 gap-2">
                {currentQ.options.map(option => (
                  <Button
                    key={option.value}
                    variant={responses[currentQ.id] === option.value ? 'default' : 'secondary'}
                    onClick={() => handleResponse(currentQ.id, option.value)}
                    className="justify-start text-left h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-professional-100 text-professional-700 flex items-center justify-center text-sm font-medium">
                        {option.value}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {currentQ.type === 'choice' && (
              <div className="grid grid-cols-1 gap-2">
                {currentQ.options.map(option => (
                  <Button
                    key={option.value}
                    variant={responses[currentQ.id] === option.value ? 'default' : 'secondary'}
                    onClick={() => handleResponse(currentQ.id, option.value)}
                    className="justify-start text-left h-auto p-4"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}

            {currentQ.type === 'multiple' && (
              <div className="grid grid-cols-1 gap-2">
                {currentQ.options.map(option => {
                  const currentValues = responses[currentQ.id] || [];
                  const isSelected = currentValues.includes(option.value);
                  
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? 'default' : 'secondary'}
                      onClick={() => {
                        const newValues = isSelected
                          ? currentValues.filter((v: any) => v !== option.value)
                          : [...currentValues, option.value];
                        handleResponse(currentQ.id, newValues);
                      }}
                      className="justify-start text-left h-auto p-4"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                        <span>{option.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-neutral-500"
        >
          Skip Assessment
        </Button>
        
        <div className="flex space-x-2">
          {currentQuestion > 0 && (
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="bg-professional-500 hover:bg-professional-700 text-white"
          >
            {currentQuestion === questions.length - 1 ? 'Start Onboarding' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// AI-Powered Recommendations Component
const AIRecommendations = ({ 
  userProfile, 
  currentStep, 
  onAcceptRecommendation 
}: {
  userProfile: UserProfile;
  currentStep: string;
  onAcceptRecommendation: (recommendation: AdaptiveRecommendation) => void;
}) => {
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [userProfile, currentStep]);

  const generateRecommendations = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const recs: AdaptiveRecommendation[] = [];

    // Experience-based recommendations
    if (userProfile.experience === 'advanced' && userProfile.preferences.skipIntroductions) {
      recs.push({
        type: 'skip',
        step: 'basic_introduction',
        reason: 'Advanced user who prefers to skip introductions',
        confidence: 0.9
      });
    }

    // Time-based recommendations
    if (userProfile.timeAvailable && userProfile.timeAvailable <= 5) {
      recs.push({
        type: 'simplify',
        step: 'feature_tour',
        reason: 'Limited time available - focus on essentials only',
        confidence: 0.85
      });
    }

    // Learning style recommendations
    if (userProfile.preferences.learningStyle === 'visual') {
      recs.push({
        type: 'expand',
        step: 'video_tutorials',
        reason: 'Visual learner - expand video content',
        confidence: 0.8
      });
    }

    // Role-specific recommendations
    if (userProfile.role === 'customer' && userProfile.goals?.includes('quick_start')) {
      recs.push({
        type: 'focus',
        step: 'booking_demo',
        reason: 'Customer role with quick start goal - prioritize booking flow',
        confidence: 0.95
      });
    }

    setRecommendations(recs);
    setIsAnalyzing(false);
  };

  if (recommendations.length === 0 && !isAnalyzing) return null;

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          {isAnalyzing ? (
            <RefreshCw className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Brain className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-2">
            {isAnalyzing ? 'Analyzing your preferences...' : 'Smart Recommendations'}
          </h4>
          
          {!isAnalyzing && (
            <div className="space-y-2">
              {recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {rec.type}
                      </Badge>
                      <span className="text-sm font-medium text-blue-900">
                        {Math.round(rec.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{rec.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAcceptRecommendation(rec)}
                    className="ml-3"
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Gamification Components
const ProgressRewards = ({ 
  completedSteps, 
  totalSteps, 
  achievements 
}: {
  completedSteps: number;
  totalSteps: number;
  achievements: string[];
}) => {
  const progress = (completedSteps / totalSteps) * 100;
  const milestones = [25, 50, 75, 100];

  return (
    <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <div className="flex items-center space-x-3 mb-3">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h4 className="font-semibold text-yellow-900">Progress Rewards</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-yellow-800">Training Progress</span>
          <span className="font-medium text-yellow-900">{Math.round(progress)}%</span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex justify-between">
          {milestones.map(milestone => {
            const achieved = progress >= milestone;
            return (
              <div key={milestone} className="text-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  achieved ? 'bg-yellow-500 text-white' : 'bg-yellow-200 text-yellow-700'
                }`}>
                  {achieved ? '★' : milestone}
                </div>
                <div className="text-xs text-yellow-700 mt-1">{milestone}%</div>
              </div>
            );
          })}
        </div>

        {achievements.length > 0 && (
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <h5 className="text-sm font-medium text-yellow-900 mb-2">Recent Achievements</h5>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(-3).map((achievement, index) => (
                <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  🏆 {achievement}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Main Smart Onboarding Flow Component
const SmartOnboardingFlow = ({
  userProfile: initialProfile,
  onComplete,
  onSkip,
  onProfileUpdate,
  customSteps,
  enableAI = true,
  showProgress = true,
  className = ""
}: SmartOnboardingFlowProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null);
  const [currentPhase, setCurrentPhase] = useState<'assessment' | 'onboarding' | 'completion'>('assessment');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [adaptiveData, setAdaptiveData] = useState<any>({});

  const handleAssessmentComplete = (assessmentData: any) => {
    const profile: UserProfile = {
      id: 'current-user',
      role: assessmentData.selectedRole || 'customer',
      experience: assessmentData.experience,
      preferences: assessmentData.preferences,
      goals: assessmentData.goals,
      timeAvailable: assessmentData.timeAvailable,
      completedOnboardingBefore: false,
      previousPlatformExperience: assessmentData.experience !== 'beginner'
    };

    setUserProfile(profile);
    setCurrentPhase('onboarding');
    
    if (onProfileUpdate) {
      onProfileUpdate(profile);
    }
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    setCurrentPhase('completion');
    
    // Calculate achievements
    const newAchievements = [];
    if (onboardingData.trainingCompleted) {
      newAchievements.push('Training Master');
    }
    if (onboardingData.assessmentScore >= 90) {
      newAchievements.push('Excellence Award');
    }
    if (completedSteps.length >= 5) {
      newAchievements.push('Dedicated Learner');
    }
    
    setAchievements(prev => [...prev, ...newAchievements]);
    
    setTimeout(() => {
      onComplete({
        userProfile,
        completedSteps,
        achievements: [...achievements, ...newAchievements],
        onboardingData,
        adaptiveData
      });
    }, 3000);
  };

  const handleRecommendation = (recommendation: AdaptiveRecommendation) => {
    switch (recommendation.type) {
      case 'skip':
        setSkippedSteps(prev => [...prev, recommendation.step]);
        break;
      case 'focus':
        setAdaptiveData(prev => ({
          ...prev,
          focusAreas: [...(prev.focusAreas || []), recommendation.step]
        }));
        break;
      case 'simplify':
        setAdaptiveData(prev => ({
          ...prev,
          simplifiedSteps: [...(prev.simplifiedSteps || []), recommendation.step]
        }));
        break;
    }
  };

  if (!userProfile && currentPhase === 'assessment') {
    return (
      <div className={`${className}`}>
        <ExperienceAssessment
          onComplete={handleAssessmentComplete}
          onSkip={() => {
            // Create default profile
            const defaultProfile: UserProfile = {
              id: 'current-user',
              role: 'customer',
              experience: 'beginner',
              preferences: {
                learningStyle: 'mixed',
                pace: 'normal',
                skipIntroductions: false,
                enableGamification: true,
                preferredLanguage: 'en'
              }
            };
            setUserProfile(defaultProfile);
            setCurrentPhase('onboarding');
          }}
        />
      </div>
    );
  }

  if (currentPhase === 'onboarding' && userProfile) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Smart Recommendations */}
        {enableAI && (
          <AIRecommendations
            userProfile={userProfile}
            currentStep="current"
            onAcceptRecommendation={handleRecommendation}
          />
        )}

        {/* Progress Rewards */}
        {showProgress && userProfile.preferences.enableGamification && (
          <ProgressRewards
            completedSteps={completedSteps.length}
            totalSteps={8} // Estimated total steps
            achievements={achievements}
          />
        )}

        {/* Main Onboarding */}
        <InteractiveOnboarding
          userRole={userProfile.role}
          onComplete={handleOnboardingComplete}
          onSkip={onSkip}
          showWelcome={!userProfile.preferences.skipIntroductions}
          enableRoleSelection={false}
        />
      </div>
    );
  }

  if (currentPhase === 'completion') {
    return (
      <div className={`text-center space-y-6 ${className}`}>
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-700">Onboarding Complete!</h2>
          <p className="text-lg text-neutral-600 max-w-md mx-auto">
            Welcome to RevivaTech! Your personalized experience is ready.
          </p>
        </div>

        {/* Achievements Summary */}
        {achievements.length > 0 && (
          <Card className="p-6 max-w-md mx-auto bg-gradient-to-r from-yellow-50 to-orange-50">
            <h3 className="text-lg font-semibold text-neutral-700 mb-3 flex items-center justify-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span>Achievements Unlocked</span>
            </h3>
            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-2 justify-center">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-neutral-700">{achievement}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Start Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <Button
            variant="default"
            className="bg-trust-500 hover:bg-trust-700 text-white h-auto p-4"
            onClick={() => window.location.href = '/dashboard'}
          >
            <div className="text-center">
              <Monitor className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Go to Dashboard</div>
            </div>
          </Button>
          
          <Button
            variant="secondary"
            className="h-auto p-4"
            onClick={() => window.location.href = '/booking'}
          >
            <div className="text-center">
              <Wrench className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Book Repair</div>
            </div>
          </Button>
          
          <Button
            variant="secondary"
            className="h-auto p-4"
            onClick={() => window.location.href = '/help'}
          >
            <div className="text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">View Help</div>
            </div>
          </Button>
        </div>

        <p className="text-sm text-neutral-500">
          Redirecting to your personalized dashboard in 3 seconds...
        </p>
      </div>
    );
  }

  return null;
};

export default SmartOnboardingFlow;
export { type UserProfile, type AdaptiveRecommendation };