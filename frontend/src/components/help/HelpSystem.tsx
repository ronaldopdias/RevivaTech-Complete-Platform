'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Search, Book, MessageCircle, Video, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: 'article' | 'video' | 'faq' | 'guide';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  readTime?: number;
  videoUrl?: string;
  externalUrl?: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articles: HelpArticle[];
}

const helpData: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    description: 'New to RevivaTech? Start here',
    articles: [
      {
        id: 'create-account',
        title: 'Creating Your Account',
        content: `
# Creating Your RevivaTech Account

Welcome to RevivaTech! Creating an account is quick and easy.

## Why Create an Account?
- Track your repair progress in real-time
- Access repair history and warranties
- Get personalized quotes and recommendations
- Secure communication with technicians

## Step-by-Step Guide

### 1. Visit the Registration Page
Navigate to [revivatech.co.uk/register](https://revivatech.co.uk/register)

### 2. Enter Your Information
- **Email**: Use a valid email address you check regularly
- **Password**: Must be at least 8 characters with letters and numbers
- **Name**: Enter your full name for personalized service
- **Phone**: Optional but recommended for updates

### 3. Verify Your Email
Check your inbox for a verification email and click the link to activate your account.

### 4. Complete Your Profile
Add any additional information to help us serve you better.

## Tips for Account Security
- Use a strong, unique password
- Enable two-factor authentication
- Keep your contact information up to date
- Log out from shared devices

## Need Help?
If you encounter any issues during registration, contact our support team at support@revivatech.co.uk
        `,
        category: 'getting-started',
        tags: ['account', 'registration', 'setup'],
        type: 'guide',
        difficulty: 'beginner',
        lastUpdated: '2025-07-13',
        readTime: 3,
      },
      {
        id: 'first-booking',
        title: 'Booking Your First Repair',
        content: `
# Booking Your First Repair

Ready to book your first repair? This guide will walk you through the entire process.

## Before You Start
- Have your device details ready (model, year, brand)
- Know what issues you're experiencing
- Consider taking photos of any visible damage

## The Booking Process

### Step 1: Device Selection
1. Choose your device type from our comprehensive database
2. Search for your specific model or browse by brand
3. Select the correct year and specifications

### Step 2: Describe Your Problem
1. Select from common issues or describe custom problems
2. Add detailed descriptions of symptoms
3. Upload photos if helpful (optional)

### Step 3: Choose Service Options
- **Standard Service**: 3-5 business days
- **Express Service**: 24-48 hours (+50% cost)
- **Same Day Service**: Within business hours (+100% cost)

### Step 4: Get Your Quote
You'll receive an instant estimate. Final pricing is confirmed after device inspection.

### Step 5: Schedule Your Appointment
Choose from:
- **Drop-off**: Visit our London location
- **Collection**: We collect from your location
- **Mail-in**: Secure postal service

## What Happens Next?
1. You'll receive confirmation via email and SMS
2. Bring or send your device at the scheduled time
3. We'll inspect and confirm the quote
4. Track progress in your customer portal

## Common Questions

**How accurate are the initial quotes?**
Our quotes are typically within 10% of the final price.

**Can I change my service level later?**
Yes, you can upgrade to express service before work begins.

**What if you can't fix my device?**
We offer a "No Fix, No Fee" guarantee for diagnostic fees.
        `,
        category: 'getting-started',
        tags: ['booking', 'repair', 'quote', 'scheduling'],
        type: 'guide',
        difficulty: 'beginner',
        lastUpdated: '2025-07-13',
        readTime: 5,
      },
    ],
  },
  {
    id: 'booking-repairs',
    name: 'Booking & Repairs',
    icon: '🔧',
    description: 'Everything about the repair process',
    articles: [
      {
        id: 'pricing-explained',
        title: 'How Our Pricing Works',
        content: `
# Understanding RevivaTech Pricing

Our transparent pricing system ensures you know exactly what you're paying for.

## Base Pricing Factors

### Device Complexity
- **Simple devices**: Basic phones, tablets
- **Moderate complexity**: Laptops, desktop computers
- **High complexity**: Gaming consoles, specialized equipment

### Issue Type
- **Software issues**: Usually quickest and least expensive
- **Hardware replacement**: Varies by part cost and difficulty
- **Liquid damage**: Requires extensive cleaning and testing
- **Data recovery**: Specialized process with variable complexity

### Parts Quality
- **Genuine OEM**: Original manufacturer parts (highest quality)
- **Genuine aftermarket**: High-quality third-party parts
- **Standard aftermarket**: Good quality budget option

## Service Level Multipliers

### Standard Service (Base Price)
- 3-5 business days
- Standard queue priority
- Best value option

### Express Service (+50%)
- 24-48 hours
- Higher priority in queue
- Ideal for urgent needs

### Same Day Service (+100%)
- Within business hours
- Highest priority
- Perfect for emergencies

## Additional Factors

### Device Age
- **Modern devices** (0-2 years): Standard pricing
- **Older devices** (3-5 years): Possible complexity increase
- **Legacy devices** (5+ years): Parts availability affects pricing

### Damage Extent
- **Single issue**: Base pricing applies
- **Multiple issues**: Bundled repair discounts
- **Extensive damage**: May require additional work

## Example Breakdown

\`\`\`
iPhone 13 Screen Replacement
Base repair cost:        £150
Genuine OEM part:        £120
Express service (50%):   £135
Total quote:             £405

Estimated time: 24-48 hours
Quote valid: 7 days
\`\`\`

## Price Guarantees

### No Fix, No Fee
If we can't repair your device, you don't pay diagnostic fees.

### Quote Accuracy
Final price won't exceed initial quote by more than 10%.

### Transparent Billing
All costs are itemized and explained before work begins.

## Getting the Best Value

### Money-Saving Tips
- Choose standard service when not urgent
- Consider aftermarket parts for older devices
- Bundle multiple repairs for discounts
- Take advantage of seasonal promotions

### When to Choose Premium Options
- Critical business devices
- Time-sensitive repairs
- Latest generation devices
- Warranty preservation needs
        `,
        category: 'booking-repairs',
        tags: ['pricing', 'quotes', 'service-levels', 'costs'],
        type: 'article',
        difficulty: 'intermediate',
        lastUpdated: '2025-07-13',
        readTime: 6,
      },
    ],
  },
  {
    id: 'account-management',
    name: 'Account Management',
    icon: '👤',
    description: 'Managing your account and settings',
    articles: [
      {
        id: 'customer-portal',
        title: 'Using the Customer Portal',
        content: `
# Your Customer Portal Guide

The customer portal is your command center for all repair-related activities.

## Dashboard Overview

### Main Sections
- **Active Repairs**: Current device status and progress
- **Repair History**: Past services and warranties
- **Messages**: Communication with technicians
- **Billing**: Invoices and payment information
- **Settings**: Account preferences and security

## Real-Time Repair Tracking

### Status Updates
Your repair progresses through these stages:
1. **Received**: Device logged into our system
2. **Diagnosed**: Initial assessment completed
3. **Quote Approved**: Work authorized to proceed
4. **In Progress**: Repair work underway
5. **Testing**: Quality assurance and testing
6. **Completed**: Ready for collection/return
7. **Delivered**: Device returned to customer

### Notifications
- **Email updates**: Automatic status changes
- **SMS alerts**: Critical updates and completion
- **Push notifications**: Real-time updates
- **In-app messages**: Direct technician communication

## Communication Features

### Direct Messaging
- Chat directly with your assigned technician
- Share photos and documents
- Get real-time responses during business hours
- Escalate to management if needed

### File Management
- Download invoices and receipts
- View warranty certificates
- Access diagnostic reports
- Store device manuals and guides

## Account Security

### Security Features
- Two-factor authentication
- Session management
- Login history
- Device management

### Privacy Settings
- Communication preferences
- Data sharing options
- Newsletter subscriptions
- Marketing preferences

## Managing Multiple Devices

### Device Library
- Register frequently repaired devices
- Store device specifications and history
- Set up automatic notifications
- Track warranty information

### Bulk Operations
- Submit multiple repair requests
- Manage family or business devices
- Coordinate pickup and delivery
- Consolidated billing options

## Troubleshooting Common Issues

### Login Problems
1. Check your email address is correct
2. Verify your password
3. Clear browser cache and cookies
4. Try resetting your password

### Missing Notifications
1. Check spam/junk folders
2. Verify email address in settings
3. Update notification preferences
4. Contact support if issues persist

### Syncing Issues
1. Refresh the page
2. Log out and back in
3. Clear browser cache
4. Try a different browser

## Getting the Most from Your Portal

### Pro Tips
- Set up notification preferences early
- Save important documents locally
- Use the search function to find information quickly
- Rate your experience to help us improve

### Advanced Features
- Export repair history
- Set up automated reminders
- Create repair templates for recurring issues
- Access API for business integrations
        `,
        category: 'account-management',
        tags: ['portal', 'dashboard', 'tracking', 'communication'],
        type: 'guide',
        difficulty: 'beginner',
        lastUpdated: '2025-07-13',
        readTime: 8,
      },
    ],
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    icon: '🔍',
    description: 'Common issues and solutions',
    articles: [
      {
        id: 'common-issues',
        title: 'Common Issues & Solutions',
        content: `
# Common Issues & Quick Solutions

Before booking a repair, try these troubleshooting steps that might resolve your issue.

## Mobile Devices

### Phone Won't Turn On
**Possible Causes:**
- Battery completely drained
- Faulty charging cable or adapter
- Software crash
- Hardware failure

**Try These Steps:**
1. Charge for at least 30 minutes with a known good cable
2. Try a different charging cable and adapter
3. Force restart (varies by device model)
4. Check for visible damage to charging port

**When to Book Repair:**
- No response after 2 hours of charging
- Charging port is damaged or loose
- Battery drains extremely quickly
- Device gets very hot while charging

### Screen Issues
**Possible Causes:**
- Physical damage (cracks, shattered glass)
- LCD/OLED panel failure
- Loose connections
- Software issues

**Try These Steps:**
1. Restart the device
2. Check if touch functionality works
3. Look for signs of liquid damage
4. Test with external display (if possible)

**When to Book Repair:**
- Visible cracks or damage
- Dead pixels or color distortion
- Touch not responding
- Screen flickering or going black

## Laptop & Computer Issues

### Computer Won't Boot
**Possible Causes:**
- Power supply issues
- RAM problems
- Hard drive failure
- Motherboard issues

**Try These Steps:**
1. Check all power connections
2. Try a different power outlet
3. Remove and reseat RAM sticks
4. Listen for unusual beeps or fan noises

**When to Book Repair:**
- No power lights or fan activity
- Blue screen or error messages
- Grinding noises from hard drive
- Overheating or burning smell

### Slow Performance
**Possible Causes:**
- Too many startup programs
- Insufficient storage space
- Malware or viruses
- Aging hardware

**Try These Steps:**
1. Restart the computer
2. Close unnecessary programs
3. Run disk cleanup
4. Check for malware
5. Update operating system

**When to Book Repair:**
- Performance doesn't improve after cleanup
- Frequent crashes or freezes
- Hard drive making noises
- Overheating issues

## Data Recovery Situations

### When You Might Need Data Recovery
- Hard drive clicking or grinding
- "Drive not found" errors
- Accidentally deleted important files
- Computer won't boot but data is needed
- Water or physical damage to device

### What NOT to Do
- Don't keep trying to power on a clicking drive
- Don't use data recovery software on physically damaged drives
- Don't open the device yourself
- Don't attempt DIY liquid damage cleaning

### What TO Do
- Power off the device immediately
- Don't panic - data recovery is often possible
- Contact us for professional assessment
- Preserve any backup information you have

## Gaming Console Issues

### Console Won't Start
**Try These Steps:**
1. Check power cable connections
2. Try a different power outlet
3. Check for overheating (clean vents)
4. Reset power supply (unplug for 10 seconds)

### Disc Reading Problems
**Try These Steps:**
1. Clean the disc gently
2. Try different discs
3. Check for dust in disc slot
4. Restart the console

## When to Contact Support

### Emergency Situations
- Smoke or burning smell
- Electrical shock from device
- Liquid spill on powered device
- Device is extremely hot

### Immediate Repair Needed
- Complete device failure
- Critical business data at risk
- Safety concerns
- Time-sensitive work requirements

### Can Wait for Appointment
- Cosmetic damage only
- Minor performance issues
- Non-critical functionality problems
- Questions about service options

## Prevention Tips

### Device Care
- Use surge protectors
- Keep devices clean and dust-free
- Avoid extreme temperatures
- Handle with care (especially screens)
- Regular software updates

### Data Protection
- Regular backups to cloud or external drive
- Don't store everything on desktop
- Use reputable antivirus software
- Be cautious with downloads and links

## Getting Professional Help

### What Information to Provide
- Device make, model, and year
- Detailed description of the problem
- When the issue started
- What you were doing when it occurred
- Any error messages

### Preparing for Service
- Back up important data if possible
- Remove personal accessories (cases, screen protectors)
- Note any passwords or special settings
- Document the device's condition with photos
        `,
        category: 'troubleshooting',
        tags: ['troubleshooting', 'diy', 'common-problems', 'prevention'],
        type: 'article',
        difficulty: 'beginner',
        lastUpdated: '2025-07-13',
        readTime: 10,
      },
    ],
  },
];

const HelpSystem = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const helpRef = useRef<HTMLDivElement>(null);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results: HelpArticle[] = [];
      helpData.forEach(category => {
        category.articles.forEach(article => {
          const matchesTitle = article.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesContent = article.content.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesTags = article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
          
          if (matchesTitle || matchesContent || matchesTags) {
            results.push(article);
          }
        });
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    setSearchQuery('');
  };

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'guide':
        return <Book className="w-4 h-4" />;
      case 'faq':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderContent = () => {
    if (selectedArticle) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h2>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  {getIcon(selectedArticle.type)}
                  <span className="capitalize">{selectedArticle.type}</span>
                </span>
                <span>Difficulty: {selectedArticle.difficulty}</span>
                {selectedArticle.readTime && <span>{selectedArticle.readTime} min read</span>}
              </div>
            </div>
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          </div>
          
          <div className="prose max-w-none">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: selectedArticle.content.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.+)/g, '<h3>$1</h3>') 
              }} 
            />
          </div>

          {selectedArticle.externalUrl && (
            <div className="border-t pt-4">
              <a 
                href={selectedArticle.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View external resource</span>
              </a>
            </div>
          )}
        </div>
      );
    }

    if (searchQuery && searchResults.length > 0) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
          {searchResults.map(article => (
            <Card key={article.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div 
                onClick={() => handleArticleClick(article)}
                className="flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getIcon(article.type)}
                    <h4 className="font-medium text-gray-900">{article.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {article.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="capitalize">{article.category.replace('-', ' ')}</span>
                    <span className="capitalize">{article.difficulty}</span>
                    {article.readTime && <span>{article.readTime} min read</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (selectedCategory) {
      const category = helpData.find(cat => cat.id === selectedCategory);
      if (!category) return null;

      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 border-b pb-4">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {category.articles.map(article => (
              <Card key={article.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div 
                  onClick={() => handleArticleClick(article)}
                  className="flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getIcon(article.type)}
                      <h3 className="font-medium text-gray-900">{article.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="capitalize">{article.difficulty}</span>
                      {article.readTime && <span>{article.readTime} min read</span>}
                      <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we help you?</h2>
          <p className="text-gray-600">Search for answers or browse our help categories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {helpData.map(category => (
            <Card 
              key={category.id} 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="flex items-start space-x-4">
                <span className="text-3xl">{category.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <p className="text-xs text-gray-500">{category.articles.length} articles</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          ))}
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Need more help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="/contact" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <MessageCircle className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
            <a href="tel:+442012345678" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <span>📞</span>
              <span>Call Us</span>
            </a>
            <a href="mailto:help@revivatech.co.uk" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <span>✉️</span>
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg z-40"
        variant="primary"
        aria-label="Open help"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={helpRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Help & Support</h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;