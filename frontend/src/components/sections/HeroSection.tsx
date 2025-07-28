'use client';

import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { Star, Clock, Shield, Zap, ArrowRight, Play, Smartphone, Laptop, Monitor } from 'lucide-react';

// Revolutionary Hero Section V2.0 - Animated Gradients & Floating Elements
const heroVariants = cva(
  "relative overflow-hidden min-h-screen flex items-center",
  {
    variants: {
      variant: {
        animated: "hero-animated-gradient text-white",
        gradient: "bg-gradient-to-br from-primary-500 to-primary-700 text-white",
        glassmorphism: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl text-white",
        premium: "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white",
      },
      size: {
        compact: "min-h-[80vh]",
        standard: "min-h-screen",
        full: "min-h-screen",
      },
      animation: {
        floating: "with-floating-devices",
        particles: "with-particles",
        pulse: "with-pulse-background",
        none: "",
      },
    },
    defaultVariants: {
      variant: "animated",
      size: "standard",
      animation: "floating",
    },
  }
);

// Revolutionary Hero Props Interface V2.0
export interface HeroSectionProps extends VariantProps<typeof heroVariants> {
  headline?: {
    main: string;
    highlight?: string;
    typewriter?: boolean;
    gradient?: boolean;
  };
  subheadline?: string;
  description?: string;
  cta?: {
    primary?: {
      text: string;
      href?: string;
      onClick?: () => void;
      variant?: 'default' | 'glow' | 'magnetic';
      icon?: React.ReactNode;
    };
    secondary?: {
      text: string;
      href?: string;
      onClick?: () => void;
      variant?: 'glass' | 'outline';
      icon?: React.ReactNode;
    };
  };
  trustIndicators?: Array<{
    icon: React.ReactNode;
    text: string;
    highlight?: boolean;
  }>;
  liveActivity?: {
    enabled: boolean;
    items?: Array<{
      type: 'booking' | 'completion' | 'review';
      customer: string;
      device: string;
      time: string;
    }>;
  };
  floatingDevices?: boolean;
  particles?: boolean;
  stats?: {
    customers?: string;
    rating?: string;
    repairs?: string;
  };
  className?: string;
}

// Revolutionary Hero Component V2.0
export const HeroSection: React.FC<HeroSectionProps> = ({
  variant = "animated",
  size = "standard",
  animation = "floating",
  headline = { main: "Revive Your Tech", highlight: "In 24 Hours" },
  subheadline = "UK's most trusted repair service with 50,000+ happy customers nationwide",
  description,
  cta = {
    primary: { text: "Get Instant Quote", variant: "glow", icon: <ArrowRight className="w-5 h-5" /> },
    secondary: { text: "Watch How It Works", variant: "glass", icon: <Play className="w-5 h-5" /> }
  },
  trustIndicators = [
    { icon: <Shield className="w-5 h-5" />, text: "90-Day Warranty", highlight: true },
    { icon: <Clock className="w-5 h-5" />, text: "Same Day Service" },
    { icon: <Star className="w-5 h-5" />, text: "4.9/5 Rating" }
  ],
  liveActivity = { enabled: true },
  floatingDevices = true,
  particles = false,
  stats = { customers: "50,000+", rating: "4.9/5", repairs: "24h" },
  className,
}) => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Simulate live activity updates
  const activityItems = liveActivity.items || [
    { type: 'booking', customer: 'Sarah M.', device: 'MacBook Pro', time: '2 minutes ago' },
    { type: 'completion', customer: 'James K.', device: 'iPhone 15 Pro', time: '5 minutes ago' },
    { type: 'review', customer: 'Emma R.', device: 'iPad Air', time: '8 minutes ago' },
  ];

  useEffect(() => {
    setIsVisible(true);
    
    if (liveActivity.enabled) {
      const interval = setInterval(() => {
        setCurrentActivity((prev) => (prev + 1) % activityItems.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [liveActivity.enabled, activityItems.length]);

  return (
    <section className={cn(heroVariants({ variant, size, animation }), className)}>
      {/* Floating Device Elements */}
      {floatingDevices && (
        <div className="floating-devices">
          <div className="floating-device floating-device-1">
            <Smartphone className="w-16 h-16 text-white/20" />
          </div>
          <div className="floating-device floating-device-2">
            <Laptop className="w-20 h-20 text-white/20" />
          </div>
          <div className="floating-device floating-device-3">
            <Monitor className="w-18 h-18 text-white/20" />
          </div>
        </div>
      )}

      {/* Particle System */}
      {particles && (
        <div className="particles-background">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content Container */}
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
          
          {/* Hero Content */}
          <div className={cn(
            "space-y-8 text-center lg:text-left",
            isVisible && "animate-fade-in"
          )}>
            
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                {headline.gradient ? (
                  <span className="gradient-text-animated">
                    {headline.main}
                  </span>
                ) : (
                  <span className="text-white drop-shadow-2xl">
                    {headline.main}
                  </span>
                )}
                {headline.highlight && (
                  <span className={cn(
                    "block mt-2",
                    headline.typewriter ? "typewriter-text" : "text-white/90"
                  )}>
                    {headline.highlight}
                  </span>
                )}
              </h1>
              
              {/* Subheadline */}
              {subheadline && (
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-medium max-w-2xl">
                  {subheadline}
                </p>
              )}
              
              {/* Description */}
              {description && (
                <p className="text-base md:text-lg text-white/80 max-w-xl">
                  {description}
                </p>
              )}
            </div>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {cta.primary && (
                <Button
                  size="lg"
                  className={cn(
                    "group relative overflow-hidden",
                    cta.primary.variant === 'glow' && "glow-effect",
                    cta.primary.variant === 'magnetic' && "magnetic-button"
                  )}
                  onClick={cta.primary.onClick}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {cta.primary.text}
                    {cta.primary.icon}
                  </span>
                  {cta.primary.variant === 'glow' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Button>
              )}
              
              {cta.secondary && (
                <Button
                  variant="secondary"
                  size="lg"
                  className={cn(
                    "group",
                    cta.secondary.variant === 'glass' && "glassmorphism border-white/30 text-white hover:bg-white/20"
                  )}
                  onClick={cta.secondary.onClick}
                >
                  <span className="flex items-center gap-2">
                    {cta.secondary.icon}
                    {cta.secondary.text}
                  </span>
                </Button>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-8">
              {trustIndicators.map((indicator, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-white/90 trust-badge-float",
                    indicator.highlight && "bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
                  )}
                >
                  {indicator.icon}
                  <span className="text-sm font-medium">{indicator.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-6 pt-8 text-center lg:text-left">
                {stats.customers && (
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stats.customers}
                    </div>
                    <div className="text-sm text-white/70">Happy Customers</div>
                  </div>
                )}
                {stats.rating && (
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stats.rating}
                    </div>
                    <div className="text-sm text-white/70">Average Rating</div>
                  </div>
                )}
                {stats.repairs && (
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stats.repairs}
                    </div>
                    <div className="text-sm text-white/70">Repair Time</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Activity Feed */}
          <div className="relative">
            {liveActivity.enabled && (
              <div className="space-y-4 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/80 font-medium">Live Activity</span>
                </div>
                
                <div className="space-y-3">
                  {activityItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "glassmorphism p-4 transition-all duration-500",
                        index === currentActivity 
                          ? "opacity-100 scale-100 live-activity-item" 
                          : "opacity-50 scale-95"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          item.type === 'booking' && "bg-blue-500/20 text-blue-300",
                          item.type === 'completion' && "bg-green-500/20 text-green-300",
                          item.type === 'review' && "bg-yellow-500/20 text-yellow-300"
                        )}>
                          {item.type === 'booking' && <Clock className="w-5 h-5" />}
                          {item.type === 'completion' && <Zap className="w-5 h-5" />}
                          {item.type === 'review' && <Star className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            <strong>{item.customer}</strong> {
                              item.type === 'booking' ? 'booked' :
                              item.type === 'completion' ? 'completed' : 'reviewed'
                            } {item.device}
                          </p>
                          <p className="text-xs text-white/60">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
    </section>
  );
};

export default HeroSection;