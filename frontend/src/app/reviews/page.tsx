'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Star, 
  ThumbsUp, 
  MessageCircle, 
  CheckCircle, 
  User,
  Calendar,
  Filter,
  Search,
  TrendingUp
} from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  service: string;
  date: string;
  comment: string;
  helpful: number;
  verified: boolean;
  response?: {
    text: string;
    date: string;
  };
}

export default function Reviews() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');

  const reviews: Review[] = [
    {
      id: '1',
      customerName: 'Sarah Johnson',
      rating: 5,
      service: 'MacBook Pro Screen Repair',
      date: '2025-01-10',
      comment: 'Excellent service! My MacBook screen was repaired within 2 hours. The team was professional and kept me updated throughout. The quality is as good as new and the price was very reasonable.',
      helpful: 23,
      verified: true,
      response: {
        text: 'Thank you Sarah! We\'re delighted you had a great experience with us. Your satisfaction is our priority!',
        date: '2025-01-11'
      }
    },
    {
      id: '2',
      customerName: 'Michael Chen',
      rating: 5,
      service: 'iPhone 14 Battery Replacement',
      date: '2025-01-08',
      comment: 'Quick and efficient battery replacement. My iPhone now lasts all day again! Great customer service and fair pricing.',
      helpful: 15,
      verified: true
    },
    {
      id: '3',
      customerName: 'Emma Williams',
      rating: 4,
      service: 'Gaming PC Custom Build',
      date: '2025-01-05',
      comment: 'Built an amazing gaming PC for me. Runs all my games perfectly. Only minor issue was it took a day longer than expected, but the quality makes up for it.',
      helpful: 18,
      verified: true,
      response: {
        text: 'Thanks for your feedback Emma! We apologize for the delay - we wanted to ensure everything was perfect. Enjoy your new gaming rig!',
        date: '2025-01-06'
      }
    },
    {
      id: '4',
      customerName: 'David Brown',
      rating: 5,
      service: 'Data Recovery',
      date: '2025-01-03',
      comment: 'Thought I had lost years of family photos when my hard drive failed. RevivaTech recovered everything! Cannot thank them enough.',
      helpful: 45,
      verified: true
    },
    {
      id: '5',
      customerName: 'Lisa Thompson',
      rating: 5,
      service: 'Laptop Virus Removal',
      date: '2024-12-28',
      comment: 'My laptop was completely infected and unusable. They cleaned it up, installed proper antivirus, and it runs better than ever!',
      helpful: 12,
      verified: true
    },
    {
      id: '6',
      customerName: 'James Wilson',
      rating: 5,
      service: 'iPad Screen Repair',
      date: '2024-12-20',
      comment: 'Dropped my iPad and shattered the screen. Fixed same day with genuine parts. Perfect repair and great warranty.',
      helpful: 8,
      verified: true
    }
  ];

  const reviewStats = {
    average: 4.8,
    total: 2847,
    distribution: [
      { stars: 5, count: 2341, percentage: 82 },
      { stars: 4, count: 385, percentage: 14 },
      { stars: 3, count: 89, percentage: 3 },
      { stars: 2, count: 23, percentage: 0.8 },
      { stars: 1, count: 9, percentage: 0.2 }
    ]
  };

  const filteredReviews = reviews
    .filter(review => {
      const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = filterRating === null || review.rating === filterRating;
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.helpful - a.helpful;
    });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Customer Reviews
              </h1>
              <p className="text-xl text-gray-600">
                See what our customers say about their repair experience with RevivaTech
              </p>
            </div>
          </div>
        </section>

        {/* Review Stats */}
        <section className="py-12 bg-white shadow-sm">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <span className="text-5xl font-bold text-gray-900 mr-3">
                    {reviewStats.average}
                  </span>
                  <div>
                    <div className="flex">{renderStars(5)}</div>
                    <p className="text-gray-600 mt-1">
                      Based on {reviewStats.total.toLocaleString()} reviews
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>98% recommend us</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Verified reviews</span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {reviewStats.distribution.map((dist) => (
                  <div key={dist.stars} className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-12">
                      {dist.stars} ★
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {dist.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All ratings</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most recent</option>
                <option value="helpful">Most helpful</option>
              </select>
            </div>
          </div>
        </section>

        {/* Reviews List */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            {review.customerName}
                            {review.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-600 ml-2" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{review.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(review.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <p className="text-gray-700 mb-4">{review.comment}</p>

                  {/* Business Response */}
                  {review.response && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 mb-1">RevivaTech Response</p>
                          <p className="text-blue-800 text-sm">{review.response.text}</p>
                          <p className="text-blue-600 text-xs mt-2">
                            {new Date(review.response.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Helpful */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">Helpful ({review.helpful})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Load More Reviews
              </button>
            </div>
          </div>
        </section>

        {/* Write Review CTA */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Had a repair with us?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Share your experience and help others make informed decisions
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Write a Review
            </button>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}