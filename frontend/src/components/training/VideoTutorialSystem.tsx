'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  BookOpen,
  CheckCircle,
  Clock,
  User,
  Star,
  BarChart3,
  Download,
  Share,
  Bookmark,
  MessageCircle,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // in seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'onboarding' | 'features' | 'troubleshooting' | 'advanced';
  role: 'customer' | 'admin' | 'technician' | 'all';
  thumbnailUrl?: string;
  transcriptUrl?: string;
  captions?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  chapters?: Array<{
    title: string;
    start: number;
    end: number;
    keyPoints?: string[];
  }>;
  interactiveElements?: Array<{
    timestamp: number;
    type: 'quiz' | 'tip' | 'action' | 'checkpoint';
    content: any;
  }>;
  relatedTutorials?: string[];
  tags?: string[];
}

export interface UserProgress {
  userId: string;
  tutorialId: string;
  watchTime: number;
  completionPercentage: number;
  lastWatched: Date;
  bookmarks: number[];
  completed: boolean;
  quizScores?: Record<string, number>;
  notes?: string;
}

interface VideoTutorialSystemProps {
  tutorials: VideoTutorial[];
  userRole?: 'customer' | 'admin' | 'technician';
  onProgress?: (tutorialId: string, progress: UserProgress) => void;
  onComplete?: (tutorialId: string) => void;
  showPlaylist?: boolean;
  autoplay?: boolean;
  enableInteractive?: boolean;
  className?: string;
}

interface VideoPlayerProps {
  tutorial: VideoTutorial;
  onProgress?: (progress: UserProgress) => void;
  onComplete?: () => void;
  userProgress?: UserProgress;
  enableInteractive?: boolean;
}

// Sample tutorial data
const SAMPLE_TUTORIALS: VideoTutorial[] = [
  {
    id: 'customer-booking-basics',
    title: 'How to Book Your First Repair',
    description: 'Learn the step-by-step process of booking a device repair with RevivaTech',
    videoUrl: '/tutorials/customer-booking.mp4',
    duration: 240, // 4 minutes
    difficulty: 'beginner',
    category: 'onboarding',
    role: 'customer',
    thumbnailUrl: '/thumbnails/customer-booking.jpg',
    chapters: [
      { title: 'Getting Started', start: 0, end: 60, keyPoints: ['Account creation', 'Dashboard overview'] },
      { title: 'Device Selection', start: 60, end: 120, keyPoints: ['Choose device type', 'Describe the issue'] },
      { title: 'Booking Details', start: 120, end: 180, keyPoints: ['Select appointment time', 'Provide contact info'] },
      { title: 'Confirmation', start: 180, end: 240, keyPoints: ['Review booking', 'Payment options', 'What happens next'] }
    ],
    interactiveElements: [
      {
        timestamp: 30,
        type: 'tip',
        content: {
          title: 'Pro Tip',
          message: 'Having your device model number ready speeds up the booking process!'
        }
      },
      {
        timestamp: 90,
        type: 'checkpoint',
        content: {
          question: 'What information do you need before starting the booking?',
          options: ['Device model', 'Problem description', 'Preferred time', 'All of the above'],
          correct: 3
        }
      }
    ],
    tags: ['booking', 'customer', 'basic', 'getting-started']
  },
  {
    id: 'admin-dashboard-overview',
    title: 'Admin Dashboard Mastery',
    description: 'Complete guide to navigating and using the admin dashboard effectively',
    videoUrl: '/tutorials/admin-dashboard.mp4',
    duration: 600, // 10 minutes
    difficulty: 'intermediate',
    category: 'onboarding',
    role: 'admin',
    chapters: [
      { title: 'Dashboard Layout', start: 0, end: 120 },
      { title: 'Key Metrics', start: 120, end: 240 },
      { title: 'Customer Management', start: 240, end: 360 },
      { title: 'Repair Queue', start: 360, end: 480 },
      { title: 'Reports & Analytics', start: 480, end: 600 }
    ],
    tags: ['admin', 'dashboard', 'management', 'analytics']
  },
  {
    id: 'technician-workflow',
    title: 'Technician Repair Workflow',
    description: 'Master the complete repair process from intake to completion',
    videoUrl: '/tutorials/tech-workflow.mp4',
    duration: 480, // 8 minutes
    difficulty: 'intermediate',
    category: 'features',
    role: 'technician',
    tags: ['technician', 'workflow', 'repair', 'process']
  }
];

// Video Player Component
const VideoPlayer = ({ tutorial, onProgress, onComplete, userProgress, enableInteractive = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(userProgress?.watchTime || 0);
  const [duration, setDuration] = useState(tutorial.duration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showInteractiveElement, setShowInteractiveElement] = useState<any>(null);
  const [userNotes, setUserNotes] = useState(userProgress?.notes || '');
  const [bookmarks, setBookmarks] = useState<number[]>(userProgress?.bookmarks || []);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const currentTime = video.currentTime;
      const completionPercentage = (currentTime / duration) * 100;
      
      setCurrentTime(currentTime);
      
      if (onProgress) {
        onProgress({
          userId: 'current-user', // This would come from auth context
          tutorialId: tutorial.id,
          watchTime: currentTime,
          completionPercentage,
          lastWatched: new Date(),
          bookmarks,
          completed: completionPercentage >= 90,
          notes: userNotes
        });
      }

      // Check for interactive elements
      if (enableInteractive && tutorial.interactiveElements) {
        const activeElement = tutorial.interactiveElements.find(
          element => Math.abs(element.timestamp - currentTime) < 1
        );
        
        if (activeElement && showInteractiveElement?.timestamp !== activeElement.timestamp) {
          setShowInteractiveElement(activeElement);
          video.pause();
          setIsPlaying(false);
        }
      }

      // Check for completion
      if (completionPercentage >= 90 && onComplete) {
        onComplete();
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration || tutorial.duration);
    });

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', () => {});
    };
  }, [tutorial.id, duration, onProgress, onComplete, bookmarks, userNotes, enableInteractive, showInteractiveElement]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const addBookmark = () => {
    const newBookmarks = [...bookmarks, currentTime];
    setBookmarks(newBookmarks);
  };

  const jumpToBookmark = (time: number) => {
    handleSeek(time);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const dismissInteractiveElement = () => {
    setShowInteractiveElement(null);
    const video = videoRef.current;
    if (video && isPlaying) {
      video.play();
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={tutorial.videoUrl}
        className="w-full h-auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Interactive Overlay */}
      {showInteractiveElement && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <Card className="p-6 max-w-md mx-4 bg-white">
            {showInteractiveElement.type === 'tip' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-neutral-700">
                    {showInteractiveElement.content.title}
                  </h3>
                </div>
                <p className="text-neutral-600">{showInteractiveElement.content.message}</p>
                <Button onClick={dismissInteractiveElement} className="w-full">
                  Continue
                </Button>
              </div>
            )}
            
            {showInteractiveElement.type === 'checkpoint' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold text-neutral-700">Quick Check</h3>
                </div>
                <p className="text-neutral-600">{showInteractiveElement.content.question}</p>
                <div className="space-y-2">
                  {showInteractiveElement.content.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={index === showInteractiveElement.content.correct ? "default" : "secondary"}
                      className="w-full text-left justify-start"
                      onClick={dismissInteractiveElement}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-white text-sm">{formatTime(currentTime)}</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              {/* Chapter markers */}
              {tutorial.chapters?.map((chapter, index) => (
                <div
                  key={index}
                  className="absolute top-0 w-1 h-3 bg-yellow-400 transform -translate-x-1/2 cursor-pointer"
                  style={{ left: `${(chapter.start / duration) * 100}%` }}
                  onClick={() => handleSeek(chapter.start)}
                  title={chapter.title}
                />
              ))}
              {/* Bookmarks */}
              {bookmarks.map((bookmark, index) => (
                <div
                  key={index}
                  className="absolute top-0 w-1 h-3 bg-blue-400 transform -translate-x-1/2 cursor-pointer"
                  style={{ left: `${(bookmark / duration) * 100}%` }}
                  onClick={() => jumpToBookmark(bookmark)}
                  title={`Bookmark ${index + 1}`}
                />
              ))}
            </div>
            <span className="text-white text-sm">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={addBookmark}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Bookmark className="w-4 h-4" />
            </Button>

            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
              className="bg-black bg-opacity-50 text-white text-sm border border-gray-600 rounded px-2 py-1"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCaptions(!showCaptions)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              CC
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tutorial Playlist Component
const TutorialPlaylist = ({ 
  tutorials, 
  currentTutorial, 
  onSelect, 
  userProgress = {} 
}: {
  tutorials: VideoTutorial[];
  currentTutorial: VideoTutorial;
  onSelect: (tutorial: VideoTutorial) => void;
  userProgress?: Record<string, UserProgress>;
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-neutral-700 mb-4">Training Playlist</h3>
      {tutorials.map((tutorial, index) => {
        const progress = userProgress[tutorial.id];
        const isCompleted = progress?.completed || false;
        const isCurrent = tutorial.id === currentTutorial.id;
        
        return (
          <Card
            key={tutorial.id}
            className={`p-3 cursor-pointer transition-all hover:shadow-md ${
              isCurrent 
                ? 'border-trust-500 bg-trust-50' 
                : isCompleted
                ? 'border-green-200 bg-green-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => onSelect(tutorial)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-trust-500 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-neutral-700 truncate">
                  {tutorial.title}
                </h4>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {tutorial.description}
                </p>
                
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-xs text-neutral-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.ceil(tutorial.duration / 60)} min</span>
                  </span>
                  
                  <Badge 
                    variant={tutorial.difficulty === 'beginner' ? 'secondary' : tutorial.difficulty === 'intermediate' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {tutorial.difficulty}
                  </Badge>
                </div>

                {progress && progress.completionPercentage > 0 && (
                  <div className="mt-2">
                    <Progress value={progress.completionPercentage} className="h-1" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Main Video Tutorial System Component
const VideoTutorialSystem = ({
  tutorials = SAMPLE_TUTORIALS,
  userRole,
  onProgress,
  onComplete,
  showPlaylist = true,
  autoplay = false,
  enableInteractive = true,
  className = ""
}: VideoTutorialSystemProps) => {
  const [currentTutorial, setCurrentTutorial] = useState<VideoTutorial>(tutorials[0]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [filteredTutorials, setFilteredTutorials] = useState(tutorials);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Filter tutorials based on user role and filters
  useEffect(() => {
    let filtered = tutorials.filter(tutorial => 
      tutorial.role === 'all' || !userRole || tutorial.role === userRole
    );

    if (searchQuery) {
      filtered = filtered.filter(tutorial =>
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.category === filterCategory);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.difficulty === filterDifficulty);
    }

    setFilteredTutorials(filtered);
    
    // If current tutorial is not in filtered list, select first one
    if (filtered.length > 0 && !filtered.find(t => t.id === currentTutorial.id)) {
      setCurrentTutorial(filtered[0]);
    }
  }, [tutorials, userRole, searchQuery, filterCategory, filterDifficulty, currentTutorial.id]);

  const handleProgress = (tutorialId: string, progress: UserProgress) => {
    setUserProgress(prev => ({
      ...prev,
      [tutorialId]: progress
    }));
    
    if (onProgress) {
      onProgress(tutorialId, progress);
    }
  };

  const handleComplete = (tutorialId: string) => {
    if (onComplete) {
      onComplete(tutorialId);
    }
    
    // Auto-advance to next tutorial if available
    const currentIndex = filteredTutorials.findIndex(t => t.id === tutorialId);
    if (currentIndex < filteredTutorials.length - 1) {
      setCurrentTutorial(filteredTutorials[currentIndex + 1]);
    }
  };

  const getOverallProgress = () => {
    const completed = Object.values(userProgress).filter(p => p.completed).length;
    return (completed / filteredTutorials.length) * 100;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-700">Video Training Center</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-neutral-600">
              {Object.values(userProgress).filter(p => p.completed).length} of {filteredTutorials.length} completed
            </div>
            <Progress value={getOverallProgress()} className="w-32" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center space-x-4 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 border border-neutral-300 rounded text-sm"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-neutral-300 rounded text-sm"
          >
            <option value="all">All Categories</option>
            <option value="onboarding">Onboarding</option>
            <option value="features">Features</option>
            <option value="troubleshooting">Troubleshooting</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-1 border border-neutral-300 rounded text-sm"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {filteredTutorials.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No tutorials found</h3>
          <p className="text-neutral-600">Try adjusting your search or filter criteria</p>
        </Card>
      ) : (
        <div className={showPlaylist ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : ""}>
          {/* Video Player */}
          <div className={showPlaylist ? "lg:col-span-2" : ""}>
            <Card className="overflow-hidden">
              <VideoPlayer
                tutorial={currentTutorial}
                onProgress={(progress) => handleProgress(currentTutorial.id, progress)}
                onComplete={() => handleComplete(currentTutorial.id)}
                userProgress={userProgress[currentTutorial.id]}
                enableInteractive={enableInteractive}
              />
              
              {/* Tutorial Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-neutral-700">{currentTutorial.title}</h3>
                    <p className="text-neutral-600">{currentTutorial.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{currentTutorial.difficulty}</Badge>
                    <Badge variant="outline">{currentTutorial.category}</Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-neutral-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.ceil(currentTutorial.duration / 60)} minutes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span className="capitalize">{currentTutorial.role}</span>
                  </span>
                </div>

                {/* Chapters */}
                {currentTutorial.chapters && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-neutral-700">Chapters</h4>
                    <div className="space-y-1">
                      {currentTutorial.chapters.map((chapter, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between text-sm p-2 rounded hover:bg-neutral-50 cursor-pointer"
                        >
                          <span>{chapter.title}</span>
                          <span className="text-neutral-500">
                            {Math.floor(chapter.start / 60)}:{(chapter.start % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Playlist */}
          {showPlaylist && (
            <div className="space-y-4">
              <TutorialPlaylist
                tutorials={filteredTutorials}
                currentTutorial={currentTutorial}
                onSelect={setCurrentTutorial}
                userProgress={userProgress}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoTutorialSystem;
export { SAMPLE_TUTORIALS, type VideoTutorial, type UserProgress };