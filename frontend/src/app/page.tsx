'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import useEventTracking from '@/hooks/useEventTracking';
import { 
  Smartphone, 
  Laptop, 
  HardDrive, 
  Shield, 
  Cpu, 
  Monitor,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Award,
  Zap,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

// Beautiful modern services data
const services = [
  {
    id: 'mac-repair',
    title: 'Mac Repair',
    description: 'Expert MacBook, iMac, and Mac Mini repair with genuine Apple parts and 90-day warranty.',
    icon: Laptop,
    href: '/book-repair',
    category: 'Apple Devices',
    featured: true,
    badge: 'Most Popular',
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 89, currency: 'GBP' },
    stats: { completed: '2,847', satisfaction: '98%' },
    features: ['Genuine Apple parts', '90-day warranty', 'Same-day service', 'Data preservation']
  },
  {
    id: 'mobile-repair',
    title: 'Mobile Device Repair',
    description: 'iPhone, iPad, Android phone and tablet repair with quality parts and quick turnaround.',
    icon: Smartphone,
    href: '/book-repair',
    category: 'Mobile Devices',
    featured: true,
    badge: 'Quick Service',
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 49, currency: 'GBP' },
    stats: { completed: '4,932', satisfaction: '97%' },
    features: ['Screen repairs', 'Battery replacement', 'Water damage', 'Same-day service']
  },
  {
    id: 'data-recovery',
    title: 'Data Recovery',
    description: 'Professional data recovery from damaged drives, SSDs, and mobile devices.',
    icon: HardDrive,
    href: '/book-repair',
    category: 'Data Services',
    featured: true,
    badge: 'No Recovery, No Fee',
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 129, currency: 'GBP' },
    stats: { completed: '1,254', satisfaction: '95%' },
    features: ['Clean room facilities', 'All storage types', 'Emergency service', '24/7 support']
  },
  {
    id: 'pc-repair',
    title: 'PC & Laptop Repair',
    description: 'Professional Windows laptop and desktop repair for all major brands.',
    icon: Monitor,
    href: '/book-repair',
    category: 'Windows Devices',
    gradient: 'from-indigo-500 to-blue-600',
    pricing: { from: 69, currency: 'GBP' },
    stats: { completed: '3,621', satisfaction: '96%' },
    features: ['All major brands', 'Hardware & software', 'Virus removal', 'Performance tuning']
  },
  {
    id: 'virus-removal',
    title: 'Virus & Security',
    description: 'Complete system cleaning and security optimization to protect your devices.',
    icon: Shield,
    href: '/book-repair',
    category: 'Security Services',
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 59, currency: 'GBP' },
    stats: { completed: '2,189', satisfaction: '99%' },
    features: ['Malware removal', 'System optimization', 'Security setup', 'Prevention training']
  },
  {
    id: 'custom-builds',
    title: 'Custom PC Builds',
    description: 'Professional custom PC building and upgrade services for gaming and workstations.',
    icon: Cpu,
    href: '/book-repair',
    category: 'Custom Solutions',
    gradient: 'from-cyan-500 to-blue-600',
    pricing: { from: 299, currency: 'GBP' },
    stats: { completed: '892', satisfaction: '100%' },
    features: ['Gaming builds', 'Workstations', 'Component selection', 'Performance tuning']
  },
];

// Removed live activity feed - was causing confusion

// Trust indicators
const trustStats = [
  { value: '50,000+', label: 'Devices Repaired', icon: Award, gradient: 'from-green-500 to-emerald-600' },
  { value: '4.9/5', label: 'Customer Rating', icon: Star, gradient: 'from-yellow-500 to-orange-600' },
  { value: '24hrs', label: 'Average Turnaround', icon: Clock, gradient: 'from-blue-500 to-indigo-600' },
  { value: '98%', label: 'Success Rate', icon: CheckCircle, gradient: 'from-purple-500 to-violet-600' },
];

// Customer testimonials
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechCorp',
    content: 'Outstanding service! My MacBook Pro was repaired quickly and professionally. The team kept me informed throughout the entire process.',
    rating: 5,
    image: '/api/placeholder/60/60',
    verified: true
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'Software Developer',
    company: 'StartupXYZ',
    content: 'Highly recommend RevivaTech! They recovered all my data from a failed drive and fixed my laptop screen. Amazing work.',
    rating: 5,
    image: '/api/placeholder/60/60',
    verified: true
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'Student',
    company: 'University College',
    content: 'Great experience! They diagnosed my iPhone for free and completed the repair the same day. Quality work and excellent customer service.',
    rating: 5,
    image: '/api/placeholder/60/60',
    verified: true
  }
];

// Live activities data for real-time updates
const liveActivities = [
  { action: 'MacBook Pro screen repair completed', location: 'Bournemouth', time: '2 minutes ago', status: 'completed' },
  { action: 'iPhone 14 battery replacement started', location: 'Manchester', time: '5 minutes ago', status: 'in-progress' },
  { action: 'Gaming PC diagnostic completed', location: 'Birmingham', time: '8 minutes ago', status: 'completed' },
  { action: 'iPad Air screen repair booked', location: 'Leeds', time: '12 minutes ago', status: 'booked' },
  { action: 'MacBook Air logic board repair completed', location: 'Glasgow', time: '15 minutes ago', status: 'completed' },
];

export default function Home() {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Analytics tracking
  const {
    trackPageView,
    trackServiceInteraction,
    trackContactInteraction,
    trackEngagementMilestone,
    isTrackingEnabled
  } = useEventTracking();

  // Auto-rotate live activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % liveActivities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate elements on scroll and track page view
  useEffect(() => {
    setIsVisible(true);
    
    // Track homepage view
    if (isTrackingEnabled) {
      trackPageView({
        page_section: 'homepage',
        device_preference: 'unknown',
        visit_intent: 'research'
      });
    }
  }, [trackPageView, isTrackingEnabled]);

  return (
      <MainLayout>
      {/* Hero Section with Gradient Background */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{
        minHeight: 'calc(100vh - 5rem)',
        background: 'linear-gradient(135deg, #082F49 0%, #0C4A6E 25%, #075985 50%, #0369A1 75%, #134E4A 100%)'
      }}>
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          {/* Nordic Main Headline */}
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-8 leading-tight animate-slide-up">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Revive Your Tech
            </span>
            <span className="block text-5xl md:text-6xl mt-4 text-white/90 animate-slide-up animate-delay-200">
              In 24 Hours
            </span>
          </h1>

          {/* Nordic Subtitle */}
          <p className="text-xl md:text-2xl font-body text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in animate-delay-500">
            UK's most trusted repair service with 50,000+ happy customers nationwide
            <span className="block mt-2 text-lg text-white/60 font-medium">Professional • Fast • Reliable • Nationwide Service</span>
          </p>

          {/* Floating Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {trustStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`glassmorphism rounded-2xl p-6 text-center animate-scale-in animate-delay-${(index + 1) * 200} hover:glassmorphism-strong transition-all duration-300 hover:scale-105 hover:shadow-hover-glow`}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Revolutionary CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-bounce-in animate-delay-1000">
            <Link 
              href="/book-repair" 
              className="group relative bg-white text-blue-600 font-semibold py-5 px-10 rounded-2xl hover:bg-white/95 transition-all duration-300 inline-flex items-center gap-3 hover:scale-105 hover:shadow-hover-glow"
              onClick={() => {
                if (isTrackingEnabled) {
                  trackServiceInteraction('click', 'booking_cta', {
                    cta_location: 'hero_section',
                    cta_text: 'Book Repair Now',
                    visit_intent: 'booking'
                  });
                }
              }}
            >
              <span className="relative z-10">Book Repair Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </Link>
            
            <a 
              href="#services" 
              className="group border-2 border-white/40 text-white font-semibold py-5 px-10 rounded-2xl hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-3 backdrop-blur-sm hover:scale-105 hover:border-white/60"
              onClick={() => {
                if (isTrackingEnabled) {
                  trackEngagementMilestone('scroll_to_services', 1, {
                    source: 'hero_cta',
                    engagement_type: 'navigation'
                  });
                }
              }}
            >
              <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Watch How It Works</span>
            </a>
          </div>

          {/* Customer Login Section */}
          <div className="mt-16 glassmorphism rounded-2xl p-8 max-w-md mx-auto animate-fade-in animate-delay-1200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Existing Customer?</h3>
              <p className="text-white/80 text-sm">Track your repair progress and manage bookings</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link 
                href="/login" 
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 py-3 px-6 rounded-xl font-medium hover:bg-white/30 transition-all duration-300 text-center"
              >
                Customer Login
              </Link>
              <Link 
                href="/register" 
                className="text-white/80 hover:text-white py-2 px-6 rounded-xl font-medium transition-all duration-300 text-center text-sm"
              >
                Create Account
              </Link>
            </div>
          </div>


          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">Scroll to explore</span>
              <ArrowRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      </section>

      {/* Modern Services Section */}
      <section id="services" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-center mb-6">
              <span className="gradient-text">Our Services</span>
            </h2>
            <p className="text-xl font-body text-gray-600 max-w-3xl mx-auto">
              Professional repair services for all your devices with transparent pricing and quality guarantees
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div 
                  key={service.id} 
                  className={`card-elevated hover-lift p-8 group animate-slide-up animate-delay-${index * 100} glass-primary border-0`}
                >
                  {/* Service Badge */}
                  {service.badge && (
                    <div className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                      {service.badge}
                    </div>
                  )}

                  {/* Service Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Service Content */}
                  <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="font-body text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Statistics */}
                  {service.stats && (
                    <div className="flex justify-between items-center mb-6 p-4 bg-gray-50/50 rounded-xl backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{service.stats.completed}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{service.stats.satisfaction}</div>
                        <div className="text-sm text-gray-600">Satisfaction</div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-gray-500">From</span>
                      <div className="text-3xl font-bold text-gray-900">
                        £{service.pricing.from}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link 
                    href={service.href}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-center block hover:shadow-hover-glow transition-all group-hover:scale-105"
                    onClick={() => {
                      if (isTrackingEnabled) {
                        trackServiceInteraction('click', service.id, {
                          service_name: service.title,
                          service_category: service.category,
                          pricing_from: service.pricing.from,
                          cta_location: 'services_section',
                          visit_intent: 'booking'
                        });
                      }
                    }}
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="py-32 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-display font-bold mb-6">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl font-body text-gray-600 max-w-3xl mx-auto">
              Simple, transparent, and professional - we make device repair stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Book Your Repair',
                description: 'Schedule online or visit our shop with your device',
                icon: Phone,
                color: 'from-blue-500 to-indigo-600'
              },
              {
                step: '02', 
                title: 'Free Diagnosis',
                description: 'Our experts perform comprehensive diagnostic evaluation',
                icon: Award,
                color: 'from-purple-500 to-pink-600'
              },
              {
                step: '03',
                title: 'Expert Repair',
                description: 'Professional repair with genuine parts and warranty',
                icon: CheckCircle,
                color: 'from-green-500 to-emerald-600'
              }
            ].map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className={`text-center animate-slide-up animate-delay-${index * 200}`}>
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <IconComponent className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-6xl font-bold text-gray-200 mb-4">{step.step}</div>
                  <h3 className="text-2xl font-display font-bold mb-4">{step.title}</h3>
                  <p className="font-body text-gray-600 text-lg">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-display font-bold mb-6">
              What Our <span className="gradient-text">Customers Say</span>
            </h2>
            <p className="text-xl font-body text-gray-600">
              Join thousands of satisfied customers who trust us with their devices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className={`card-elevated glass p-8 animate-slide-up animate-delay-${index * 100} border-0`}>
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="font-body text-gray-600 mb-6 text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-gray-900 flex items-center gap-2">
                      {testimonial.name}
                      {testimonial.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="font-body text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to Fix Your Device?
          </h2>
          <p className="text-xl font-body mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their repairs
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link 
              href="/book-repair" 
              className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors shadow-hover-glow"
              onClick={() => {
                if (isTrackingEnabled) {
                  trackServiceInteraction('click', 'booking_cta', {
                    cta_location: 'final_cta_section',
                    cta_text: 'Book Repair Now',
                    visit_intent: 'booking'
                  });
                }
              }}
            >
              Book Repair Now
            </Link>
            <a 
              href="tel:02071234567" 
              className="border-2 border-white/30 text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors inline-flex items-center gap-3 backdrop-blur-sm"
              onClick={() => {
                if (isTrackingEnabled) {
                  trackContactInteraction('phone', 'final_cta_section');
                }
              }}
            >
              <Phone className="w-5 h-5" />
              020 7123 4567
            </a>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="glassmorphism rounded-xl p-4 text-center">
              <Mail className="w-6 h-6 text-blue-200 mx-auto mb-2" />
              <div className="font-semibold">Email Us</div>
              <div className="text-blue-200 text-sm font-body">hello@revivatech.co.uk</div>
            </div>
            <div className="glassmorphism rounded-xl p-4 text-center">
              <MapPin className="w-6 h-6 text-blue-200 mx-auto mb-2" />
              <div className="font-semibold">Visit Us</div>
              <div className="text-blue-200 text-sm font-body">Bournemouth & Nationwide</div>
            </div>
            <div className="glassmorphism rounded-xl p-4 text-center">
              <MessageCircle className="w-6 h-6 text-blue-200 mx-auto mb-2" />
              <div className="font-semibold">Live Chat</div>
              <div className="text-blue-200 text-sm font-body">24/7 Support</div>
            </div>
          </div>
        </div>
      </section>

      </MainLayout>
  );
}
