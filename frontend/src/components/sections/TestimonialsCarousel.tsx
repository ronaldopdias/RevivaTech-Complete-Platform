'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface TestimonialsCarouselProps {
  variant?: 'cards' | 'minimal' | 'centered';
  autoplay?: boolean;
  autoplayInterval?: number;
  title?: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    alignment?: 'left' | 'center' | 'right';
  };
  testimonials: Testimonial[];
  className?: string;
}

export function TestimonialsCarousel({
  variant = 'cards',
  autoplay = false,
  autoplayInterval = 5000,
  title,
  testimonials,
  className = '',
}: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        lucideIcon="Star"
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const titleClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className={`mb-12 ${titleClasses[title.alignment || 'center']}`}>
            {React.createElement(
              (`h${title.level || 2}`) as any,
              {
                className: 'text-3xl md:text-4xl font-bold text-gray-900 mb-4',
              },
              title.text
            )}
          </div>
        )}

        <div className="relative">
          {/* Testimonial Cards */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0">
                  <Card className="max-w-4xl mx-auto p-8 border-0 shadow-lg">
                    <div className="text-center">
                      {/* Quote */}
                      <div className="mb-6">
                        <Icon lucideIcon="Quote" className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <blockquote className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed">
                          "{testimonial.content}"
                        </blockquote>
                      </div>

                      {/* Rating */}
                      <div className="flex justify-center gap-1 mb-6">
                        {renderStars(testimonial.rating)}
                      </div>

                      {/* Author */}
                      <div className="flex items-center justify-center gap-4">
                        {testimonial.avatar && (
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-gray-600 text-sm">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          {testimonials.length > 1 && (
            <>
              {/* Previous/Next Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-white shadow-lg border-gray-200 hover:border-gray-300"
                aria-label="Previous testimonial"
              >
                <Icon lucideIcon="ChevronLeft" className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 bg-white shadow-lg border-gray-200 hover:border-gray-300"
                aria-label="Next testimonial"
              >
                <Icon lucideIcon="ChevronRight" className="w-4 h-4" />
              </Button>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsCarousel;