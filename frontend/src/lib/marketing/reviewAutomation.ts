/**
 * Review Automation System
 * Automated review collection and management for RevivaTech
 * 
 * Features:
 * - Automated review request campaigns
 * - Multi-platform review management (Google, Facebook, Trustpilot)
 * - Review response automation
 * - Sentiment analysis and categorization
 * - Review display and showcase
 * - Performance analytics and insights
 */

import { z } from 'zod';

// Review Schema
export const ReviewSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  repairId: z.string().optional(),
  
  // Review content
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string(),
  
  // Platform information
  platform: z.enum(['google', 'facebook', 'trustpilot', 'website', 'email']),
  platformId: z.string().optional(),
  platformUrl: z.string().optional(),
  
  // Metadata
  deviceType: z.string().optional(),
  serviceType: z.string().optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  tags: z.array(z.string()).default([]),
  
  // Status
  status: z.enum(['pending', 'approved', 'rejected', 'featured']).default('pending'),
  featured: z.boolean().default(false),
  public: z.boolean().default(true),
  
  // Response
  response: z.object({
    content: z.string(),
    author: z.string(),
    respondedAt: z.date()
  }).optional(),
  
  // Analytics
  helpfulVotes: z.number().default(0),
  reportedCount: z.number().default(0),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  reviewedAt: z.date().optional()
});

export type Review = z.infer<typeof ReviewSchema>;

// Review Request Campaign Schema
export const ReviewRequestCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Trigger conditions
  trigger: z.object({
    event: z.enum(['repair_completed', 'payment_received', 'device_collected']),
    delay: z.object({
      amount: z.number(),
      unit: z.enum(['hours', 'days', 'weeks'])
    }),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any()
    })).default([])
  }),
  
  // Request settings
  platforms: z.array(z.enum(['google', 'facebook', 'trustpilot', 'website'])).default(['website']),
  emailTemplateId: z.string(),
  smsTemplateId: z.string().optional(),
  maxAttempts: z.number().default(3),
  attemptInterval: z.object({
    amount: z.number(),
    unit: z.enum(['days', 'weeks'])
  }).default({ amount: 7, unit: 'days' }),
  
  // Status
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  
  // Analytics
  analytics: z.object({
    sent: z.number().default(0),
    opened: z.number().default(0),
    clicked: z.number().default(0),
    reviewed: z.number().default(0),
    conversionRate: z.number().default(0)
  }).default({}),
  
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type ReviewRequestCampaign = z.infer<typeof ReviewRequestCampaignSchema>;

// Review Analytics Schema
export const ReviewAnalyticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  startDate: z.date(),
  endDate: z.date(),
  
  metrics: z.object({
    totalReviews: z.number(),
    averageRating: z.number(),
    ratingDistribution: z.record(z.number()),
    platformDistribution: z.record(z.number()),
    sentimentDistribution: z.object({
      positive: z.number(),
      neutral: z.number(),
      negative: z.number()
    }),
    responseRate: z.number(),
    averageResponseTime: z.number() // hours
  })
});

export type ReviewAnalytics = z.infer<typeof ReviewAnalyticsSchema>;

// Review Automation Service
export class ReviewAutomationService {
  private reviews: Review[] = [];
  private campaigns: ReviewRequestCampaign[] = [];
  private platformConfigs: Map<string, any> = new Map();

  constructor() {
    this.initializeData();
    this.setupPlatformConfigs();
  }

  private initializeData() {
    // Initialize with sample reviews
    this.reviews = [
      {
        id: 'rev-001',
        customerId: 'cust-001',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.j@email.com',
        repairId: 'rep-001',
        rating: 5,
        title: 'Excellent iPhone screen repair!',
        content: 'My iPhone 14 Pro screen was completely shattered, but RevivaTech fixed it perfectly. The quality is amazing and it looks brand new. Fast service and great communication throughout the process.',
        platform: 'website',
        deviceType: 'iPhone 14 Pro',
        serviceType: 'Screen Repair',
        sentiment: 'positive',
        tags: ['fast', 'quality', 'communication'],
        status: 'approved',
        featured: true,
        public: true,
        helpfulVotes: 12,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'rev-002',
        customerId: 'cust-002',
        customerName: 'Mark Thompson',
        customerEmail: 'mark.t@email.com',
        rating: 4,
        title: 'Good MacBook repair service',
        content: 'Had my MacBook Pro battery replaced. The service was professional and the repair was done well. Took a bit longer than expected but the quality is good.',
        platform: 'google',
        platformId: 'google-123',
        deviceType: 'MacBook Pro',
        serviceType: 'Battery Replacement',
        sentiment: 'positive',
        tags: ['professional', 'quality'],
        status: 'approved',
        public: true,
        helpfulVotes: 8,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    // Initialize with sample campaigns
    this.campaigns = [
      {
        id: 'camp-001',
        name: 'Post-Repair Review Request',
        description: 'Automated review requests sent after repair completion',
        trigger: {
          event: 'repair_completed',
          delay: { amount: 24, unit: 'hours' },
          conditions: []
        },
        platforms: ['website', 'google'],
        emailTemplateId: 'review-request-email',
        maxAttempts: 2,
        attemptInterval: { amount: 7, unit: 'days' },
        status: 'active',
        analytics: {
          sent: 156,
          opened: 124,
          clicked: 48,
          reviewed: 23,
          conversionRate: 14.7
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      }
    ];
  }

  private setupPlatformConfigs() {
    this.platformConfigs.set('google', {
      name: 'Google Reviews',
      baseUrl: 'https://www.google.com/maps/place/RevivaTech',
      icon: '/images/platforms/google.svg',
      color: '#4285F4'
    });

    this.platformConfigs.set('facebook', {
      name: 'Facebook Reviews',
      baseUrl: 'https://www.facebook.com/RevivaTech/reviews',
      icon: '/images/platforms/facebook.svg',
      color: '#1877F2'
    });

    this.platformConfigs.set('trustpilot', {
      name: 'Trustpilot',
      baseUrl: 'https://www.trustpilot.com/review/revivatech.co.uk',
      icon: '/images/platforms/trustpilot.svg',
      color: '#00B67A'
    });
  }

  // Review Management
  async submitReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const review: Review = {
      ...reviewData,
      id: `rev_${Date.now()}`,
      sentiment: this.analyzeSentiment(reviewData.content, reviewData.rating),
      tags: this.extractTags(reviewData.content),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validatedReview = ReviewSchema.parse(review);
    this.reviews.unshift(validatedReview);
    
    // Trigger automated response if negative
    if (validatedReview.sentiment === 'negative') {
      await this.handleNegativeReview(validatedReview);
    }

    return validatedReview;
  }

  async getReviews(filters?: {
    platform?: Review['platform'];
    rating?: number;
    sentiment?: Review['sentiment'];
    status?: Review['status'];
    featured?: boolean;
    limit?: number;
  }): Promise<Review[]> {
    let filteredReviews = [...this.reviews];

    if (filters?.platform) {
      filteredReviews = filteredReviews.filter(r => r.platform === filters.platform);
    }

    if (filters?.rating) {
      filteredReviews = filteredReviews.filter(r => r.rating === filters.rating);
    }

    if (filters?.sentiment) {
      filteredReviews = filteredReviews.filter(r => r.sentiment === filters.sentiment);
    }

    if (filters?.status) {
      filteredReviews = filteredReviews.filter(r => r.status === filters.status);
    }

    if (filters?.featured !== undefined) {
      filteredReviews = filteredReviews.filter(r => r.featured === filters.featured);
    }

    if (filters?.limit) {
      filteredReviews = filteredReviews.slice(0, filters.limit);
    }

    return filteredReviews;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
    const index = this.reviews.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedReview = {
      ...this.reviews[index],
      ...updates,
      updatedAt: new Date()
    };

    const validatedReview = ReviewSchema.parse(updatedReview);
    this.reviews[index] = validatedReview;
    return validatedReview;
  }

  async respondToReview(reviewId: string, response: string, author: string): Promise<boolean> {
    const review = await this.updateReview(reviewId, {
      response: {
        content: response,
        author,
        respondedAt: new Date()
      }
    });

    return review !== null;
  }

  // Campaign Management
  async createCampaign(campaignData: Omit<ReviewRequestCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewRequestCampaign> {
    const campaign: ReviewRequestCampaign = {
      ...campaignData,
      id: `camp_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validatedCampaign = ReviewRequestCampaignSchema.parse(campaign);
    this.campaigns.push(validatedCampaign);
    return validatedCampaign;
  }

  async getCampaigns(): Promise<ReviewRequestCampaign[]> {
    return this.campaigns;
  }

  async updateCampaign(id: string, updates: Partial<ReviewRequestCampaign>): Promise<ReviewRequestCampaign | null> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;

    const updatedCampaign = {
      ...this.campaigns[index],
      ...updates,
      updatedAt: new Date()
    };

    const validatedCampaign = ReviewRequestCampaignSchema.parse(updatedCampaign);
    this.campaigns[index] = validatedCampaign;
    return validatedCampaign;
  }

  // Trigger review request
  async triggerReviewRequest(customerId: string, repairId: string, campaignId?: string): Promise<boolean> {
    const campaign = campaignId 
      ? this.campaigns.find(c => c.id === campaignId)
      : this.campaigns.find(c => c.status === 'active');

    if (!campaign) return false;

    // Create review request record
    const requestId = `req_${Date.now()}`;
    
    // Send email/SMS (mock implementation)
    await this.sendReviewRequestEmail(customerId, repairId, campaign);
    
    // Update campaign analytics
    campaign.analytics.sent += 1;

    return true;
  }

  // Analytics
  async getReviewAnalytics(period: ReviewAnalytics['period'] = 'month'): Promise<ReviewAnalytics> {
    const now = new Date();
    const startDate = this.getStartDate(now, period);
    const endDate = now;

    const filteredReviews = this.reviews.filter(r => 
      r.createdAt >= startDate && r.createdAt <= endDate
    );

    const totalReviews = filteredReviews.length;
    const averageRating = totalReviews > 0 
      ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = filteredReviews.reduce((dist, r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    const platformDistribution = filteredReviews.reduce((dist, r) => {
      dist[r.platform] = (dist[r.platform] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    const sentimentCounts = filteredReviews.reduce((counts, r) => {
      if (r.sentiment) {
        counts[r.sentiment] = (counts[r.sentiment] || 0) + 1;
      }
      return counts;
    }, { positive: 0, neutral: 0, negative: 0 });

    const reviewsWithResponse = filteredReviews.filter(r => r.response);
    const responseRate = totalReviews > 0 ? (reviewsWithResponse.length / totalReviews) * 100 : 0;

    // Calculate average response time (mock calculation)
    const averageResponseTime = 24; // hours

    return {
      period,
      startDate,
      endDate,
      metrics: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        platformDistribution,
        sentimentDistribution: sentimentCounts,
        responseRate: Math.round(responseRate * 10) / 10,
        averageResponseTime
      }
    };
  }

  async getTopReviews(limit = 5): Promise<Review[]> {
    return this.reviews
      .filter(r => r.status === 'approved' && r.rating >= 4)
      .sort((a, b) => {
        // Sort by featured first, then by helpful votes, then by rating
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.helpfulVotes !== b.helpfulVotes) return b.helpfulVotes - a.helpfulVotes;
        return b.rating - a.rating;
      })
      .slice(0, limit);
  }

  // Platform Integration
  async syncPlatformReviews(platform: Review['platform']): Promise<number> {
    // Mock implementation - in real app, this would call platform APIs
    const mockNewReviews = [
      {
        id: `${platform}_sync_${Date.now()}`,
        customerId: 'unknown',
        customerName: 'Platform User',
        customerEmail: 'user@platform.com',
        rating: 5,
        content: 'Great service, highly recommended!',
        platform,
        platformId: `${platform}_${Date.now()}`,
        sentiment: 'positive' as const,
        status: 'approved' as const,
        public: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        helpfulVotes: 0,
        reportedCount: 0,
        featured: false
      }
    ];

    this.reviews.unshift(...mockNewReviews);
    return mockNewReviews.length;
  }

  // Utility Methods
  private analyzeSentiment(content: string, rating: number): Review['sentiment'] {
    // Simple sentiment analysis based on rating and keywords
    if (rating >= 4) return 'positive';
    if (rating >= 3) return 'neutral';
    return 'negative';
  }

  private extractTags(content: string): string[] {
    const positiveKeywords = ['excellent', 'great', 'amazing', 'perfect', 'fast', 'professional', 'quality', 'recommend'];
    const negativeKeywords = ['slow', 'expensive', 'poor', 'bad', 'terrible', 'waste', 'disappointed'];
    
    const lowerContent = content.toLowerCase();
    const tags: string[] = [];

    positiveKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    });

    negativeKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  private async handleNegativeReview(review: Review): Promise<void> {
    // Trigger immediate response workflow for negative reviews
    console.log(`Negative review detected: ${review.id}. Triggering response workflow.`);
    
    // In real implementation, this would:
    // 1. Send notification to management
    // 2. Create a support ticket
    // 3. Trigger follow-up communication with customer
  }

  private async sendReviewRequestEmail(customerId: string, repairId: string, campaign: ReviewRequestCampaign): Promise<void> {
    // Mock email sending
    console.log(`Sending review request email for repair ${repairId} using campaign ${campaign.id}`);
  }

  private getStartDate(endDate: Date, period: ReviewAnalytics['period']): Date {
    const start = new Date(endDate);
    
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return start;
  }
}

// Global review automation service instance
export const reviewAutomation = new ReviewAutomationService();