'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Star, 
  Quote, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Award,
  Users,
  TrendingUp,
  Heart,
  MapPin,
  Calendar
} from 'lucide-react';

// Testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechCorp Ltd',
    location: 'London',
    rating: 5,
    date: '2025-01-15',
    image: '/api/placeholder/80/80',
    content: 'Outstanding service! My MacBook Pro was repaired quickly and professionally. The team kept me informed throughout the entire process. The screen replacement looks brand new and the turnaround time was incredible. I would definitely recommend RevivaTech to anyone.',
    service: 'MacBook Pro Screen Repair',
    verified: true,
    featured: true
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'Software Developer',
    company: 'StartupXYZ',
    location: 'Manchester',
    rating: 5,
    date: '2025-01-10',
    image: '/api/placeholder/80/80',
    content: 'Highly recommend RevivaTech! They recovered all my data from a failed drive and fixed my laptop screen. The diagnostic was thorough and they explained everything clearly. Amazing technical expertise and customer service.',
    service: 'Data Recovery + Screen Repair',
    verified: true,
    featured: true
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'Student',
    company: 'University College London',
    location: 'London',
    rating: 5,
    date: '2025-01-08',
    image: '/api/placeholder/80/80',
    content: 'Great experience! They diagnosed my iPhone for free and completed the repair the same day. Quality work and excellent customer service. The staff were friendly and knowledgeable. My phone works perfectly now.',
    service: 'iPhone 12 Screen Repair',
    verified: true,
    featured: false
  },
  {
    id: 4,
    name: 'Michael Thompson',
    role: 'Business Owner',
    company: 'Thompson Associates',
    location: 'Birmingham',
    rating: 5,
    date: '2025-01-05',
    image: '/api/placeholder/80/80',
    content: 'Professional and efficient service. They built a custom gaming PC for my son and provided excellent after-sales support. The performance is incredible and the cable management is pristine. Worth every penny.',
    service: 'Custom Gaming PC Build',
    verified: true,
    featured: true
  },
  {
    id: 5,
    name: 'Lisa Rodriguez',
    role: 'Graphic Designer',
    company: 'Creative Studio',
    location: 'Leeds',
    rating: 5,
    date: '2025-01-03',
    image: '/api/placeholder/80/80',
    content: 'Saved my business! My iMac crashed during a critical project and they recovered everything and fixed the issue within 24 hours. Their emergency service is worth every penny. Absolutely professional.',
    service: 'iMac Data Recovery',
    verified: true,
    featured: false
  },
  {
    id: 6,
    name: 'James Wilson',
    role: 'IT Manager',
    company: 'Wilson Corp',
    location: 'Glasgow',
    rating: 5,
    date: '2025-01-01',
    image: '/api/placeholder/80/80',
    content: 'Excellent virus removal service for multiple office computers. They cleaned everything thoroughly and provided security training for our staff. Great value for money and ongoing support.',
    service: 'Business Virus Removal',
    verified: true,
    featured: false
  }
];

// Stats data
const stats = [
  { value: '2,847', label: 'Happy Customers', icon: Users, color: 'from-blue-500 to-cyan-600' },
  { value: '4.9/5', label: 'Average Rating', icon: Star, color: 'from-yellow-500 to-orange-600' },
  { value: '98%', label: 'Satisfaction Rate', icon: Heart, color: 'from-pink-500 to-red-600' },
  { value: '50K+', label: 'Repairs Completed', icon: Award, color: 'from-purple-500 to-violet-600' }
];

export default function TestimonialsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const categories = [
    { id: 'all', label: 'All Reviews' },
    { id: 'apple', label: 'Apple Repairs' },
    { id: 'pc', label: 'PC & Laptops' },
    { id: 'data', label: 'Data Recovery' },
    { id: 'custom', label: 'Custom Builds' }
  ];

  const filteredTestimonials = testimonials.filter(testimonial => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'apple') return testimonial.service.toLowerCase().includes('mac') || testimonial.service.toLowerCase().includes('iphone') || testimonial.service.toLowerCase().includes('ipad');
    if (selectedCategory === 'pc') return testimonial.service.toLowerCase().includes('laptop') || testimonial.service.toLowerCase().includes('pc');
    if (selectedCategory === 'data') return testimonial.service.toLowerCase().includes('data');
    if (selectedCategory === 'custom') return testimonial.service.toLowerCase().includes('custom');
    return true;
  });

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

  return (
    <MainLayout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                Customer <span className="gradient-text">Testimonials</span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Read what our customers say about our repair services. Real reviews from real people who trust us with their devices.
              </p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Testimonial Carousel */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Featured <span className="gradient-text">Reviews</span>
              </h2>
              <p className="text-lg text-gray-600">
                Hear from our satisfied customers about their repair experience
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative">
                {/* Quote icon */}
                <div className="absolute top-8 left-8 text-blue-100">
                  <Quote className="w-16 h-16" />
                </div>

                {/* Testimonial content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-xl md:text-2xl text-gray-700 mb-8 text-center leading-relaxed">
                    "{filteredTestimonials[currentTestimonial]?.content}"
                  </blockquote>

                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">
                        {filteredTestimonials[currentTestimonial]?.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-display font-bold text-gray-900 flex items-center gap-2">
                        {filteredTestimonials[currentTestimonial]?.name}
                        {filteredTestimonials[currentTestimonial]?.verified && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="text-gray-600">{filteredTestimonials[currentTestimonial]?.role}</div>
                      <div className="text-sm text-gray-500">{filteredTestimonials[currentTestimonial]?.company}</div>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {filteredTestimonials[currentTestimonial]?.location}
                      <Calendar className="w-4 h-4 ml-2" />
                      {new Date(filteredTestimonials[currentTestimonial]?.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={prevTestimonial}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="flex gap-2">
                    {filteredTestimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentTestimonial ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={nextTestimonial}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All Reviews Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                All <span className="gradient-text">Reviews</span>
              </h2>
              <p className="text-lg text-gray-600">
                Browse all customer reviews by service category
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTestimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-display font-bold text-gray-900 flex items-center gap-2">
                          {testimonial.name}
                          {testimonial.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* Service badge */}
                  <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {testimonial.service}
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {testimonial.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(testimonial.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-display font-bold mb-4">
              Ready to Join Our Happy Customers?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Experience the same quality service that our customers rave about
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Book Your Repair Now
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Read More Reviews
              </button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}