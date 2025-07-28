"use client";

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/sections/HeroSection';
import CallToAction from '@/components/sections/CallToAction';

// Contact information
const contactInfo = {
  phone: '020 7123 4567',
  email: 'hello@revivatech.co.uk',
  address: {
    street: '8 GodsHill Close',
    area: 'Bournemouth',
    city: 'Bournemouth',
    postcode: 'BH8 0EJ',
    country: 'United Kingdom'
  },
  businessHours: {
    weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
    saturday: 'Saturday: 10:00 AM - 4:00 PM',
    sunday: 'Sunday: Closed',
    emergency: '24/7 Emergency Service Available'
  },
  social: {
    facebook: 'https://facebook.com/revivatech',
    twitter: 'https://twitter.com/revivatech',
    instagram: 'https://instagram.com/revivatech',
    linkedin: 'https://linkedin.com/company/revivatech'
  }
};

// FAQ data
const faqData = [
  {
    id: 'pricing',
    question: 'How much does a repair cost?',
    answer: 'All repairs start with a free diagnostic evaluation. Once we identify the issue, we provide transparent pricing before any work begins. Prices vary by device and repair type, but we guarantee no hidden fees.'
  },
  {
    id: 'warranty',
    question: 'What warranty do you provide?',
    answer: 'All repairs come with a comprehensive 90-day warranty covering both parts and labor. If the same issue occurs within 90 days, we will fix it free of charge.'
  },
  {
    id: 'time',
    question: 'How long does a repair take?',
    answer: 'Many repairs can be completed the same day, especially screen replacements and simple component swaps. Complex repairs like data recovery or logic board work may take 2-5 business days.'
  },
  {
    id: 'data',
    question: 'Will my data be safe during repair?',
    answer: 'Data preservation is our priority. We take every precaution to protect your data and offer backup services. For data recovery specifically, we have a 98% success rate.'
  },
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept cash, all major credit/debit cards, bank transfers, and PayPal. Payment is due upon completion and your satisfaction with the repair.'
  },
  {
    id: 'collection',
    question: 'Do you offer collection and delivery?',
    answer: 'Yes! We offer free collection and delivery within Bournemouth for repairs over £200. For smaller repairs, our location is easily accessible by local transport.'
  }
];

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    device: '',
    issue: '',
    urgency: 'standard',
    message: ''
  });

  const [formStatus, setFormStatus] = useState('idle'); // idle, sending, sent, error

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    
    // Simulate form submission
    try {
      // This would integrate with your backend contact form API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFormStatus('sent');
      setFormData({
        name: '',
        email: '',
        phone: '',
        device: '',
        issue: '',
        urgency: 'standard',
        message: ''
      });
    } catch (error) {
      setFormStatus('error');
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection
        variant="secondary"
        size="medium"
        alignment="center"
        title={{
          text: "Get In Touch",
          level: 1,
          variant: 'display'
        }}
        subtitle={{
          text: "Multiple ways to reach us for support, quotes, and bookings",
          variant: 'large'
        }}
        description={{
          text: "Whether you need a quick quote, want to book a repair, or have questions about our services - we're here to help with fast, friendly support.",
          variant: 'body'
        }}
        background="muted"
        className="mb-16"
      />

      {/* Quick Contact Actions */}
      <div className="container mx-auto px-4 mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <a 
            href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
            className="p-6 bg-card border rounded-lg hover:shadow-lg transition-shadow text-center group"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">📞</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Call Us Now</h3>
            <p className="text-2xl font-bold text-primary mb-2">{contactInfo.phone}</p>
            <p className="text-sm text-muted-foreground">Immediate support & booking</p>
          </a>

          <a 
            href="/booking-demo"
            className="p-6 bg-card border rounded-lg hover:shadow-lg transition-shadow text-center group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Book Online</h3>
            <p className="text-lg font-semibold text-primary mb-2">Schedule Repair</p>
            <p className="text-sm text-muted-foreground">24/7 online booking system</p>
          </a>

          <a 
            href={`mailto:${contactInfo.email}`}
            className="p-6 bg-card border rounded-lg hover:shadow-lg transition-shadow text-center group"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">✉️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="text-lg font-semibold text-primary mb-2">{contactInfo.email}</p>
            <p className="text-sm text-muted-foreground">Detailed inquiries welcome</p>
          </a>
        </div>
      </div>

      {/* Main Contact Section */}
      <div className="container mx-auto px-4 mb-24">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form below and we'll get back to you within 2 hours during business hours. 
              For urgent repairs, please call us directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="020 1234 5678"
                  />
                </div>
                <div>
                  <label htmlFor="device" className="block text-sm font-medium mb-2">
                    Device Type
                  </label>
                  <select
                    id="device"
                    name="device"
                    value={formData.device}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select device type</option>
                    <option value="macbook">MacBook</option>
                    <option value="imac">iMac</option>
                    <option value="iphone">iPhone</option>
                    <option value="ipad">iPad</option>
                    <option value="windows-laptop">Windows Laptop</option>
                    <option value="desktop-pc">Desktop PC</option>
                    <option value="android-phone">Android Phone</option>
                    <option value="tablet">Tablet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="issue" className="block text-sm font-medium mb-2">
                  Issue Description
                </label>
                <input
                  type="text"
                  id="issue"
                  name="issue"
                  value={formData.issue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Cracked screen, won't turn on, water damage"
                />
              </div>

              <div>
                <label htmlFor="urgency" className="block text-sm font-medium mb-2">
                  Urgency Level
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="standard">Standard (3-5 days)</option>
                  <option value="priority">Priority (1-2 days)</option>
                  <option value="urgent">Urgent (same day)</option>
                  <option value="emergency">Emergency (24hr)</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Additional Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Any additional details about your device or repair needs..."
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === 'sending'}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formStatus === 'sending' ? 'Sending Message...' : 'Send Message'}
              </button>

              {formStatus === 'sent' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <p className="font-medium">Message sent successfully!</p>
                  <p className="text-sm">We'll get back to you within 2 hours during business hours.</p>
                </div>
              )}

              {formStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <p className="font-medium">Failed to send message.</p>
                  <p className="text-sm">Please try again or call us directly at {contactInfo.phone}.</p>
                </div>
              )}
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
            
            {/* Business Hours */}
            <div className="bg-card p-6 rounded-lg border mb-8">
              <h3 className="text-xl font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    ⚡ 24/7 Emergency Service Available
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card p-6 rounded-lg border mb-8">
              <h3 className="text-xl font-semibold mb-4">Visit Our Shop</h3>
              <div className="space-y-2">
                <p className="font-medium">{contactInfo.address.street}</p>
                <p>{contactInfo.address.area}</p>
                <p>{contactInfo.address.city} {contactInfo.address.postcode}</p>
                <p>{contactInfo.address.country}</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Transport Links:</p>
                <p className="text-sm">🚌 Local bus routes nearby</p>
                <p className="text-sm">🚗 Free street parking available</p>
                <p className="text-sm">🚶 Residential area location</p>
              </div>
            </div>

            {/* Services Available */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4">Services Available</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Walk-in Diagnostics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Same-day Repairs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Collection Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Emergency Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Business Accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Warranty Claims</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Quick answers to common questions about our repair services and process
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {faqData.map((faq) => (
                <div key={faq.id} className="bg-card p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for?
            </p>
            <a 
              href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Call Us: {contactInfo.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Map & Directions */}
      <div className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Find Us</h2>
            <p className="text-xl text-muted-foreground">
              Conveniently located in Bournemouth
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-lg border text-center">
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Interactive Map Coming Soon</p>
                <p className="text-muted-foreground">
                  {contactInfo.address.street}, {contactInfo.address.area}<br/>
                  {contactInfo.address.city} {contactInfo.address.postcode}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Get Directions
              </button>
              <a 
                href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
              >
                Call Before Visiting
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media & Final CTA */}
      <div className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4">
          <CallToAction
            variant="primary"
            background="transparent"
            alignment="center"
            title={{
              text: "Ready to Get Started?",
              level: 2,
              variant: 'heading'
            }}
            description={{
              text: "Choose the contact method that works best for you. We're here to help with all your device repair needs.",
              variant: 'large'
            }}
            features={[
              'Free diagnostic evaluation',
              'Same-day service available',
              '90-day repair warranty',
              'Transparent pricing always'
            ]}
            actions={[
              {
                component: 'Button',
                props: {
                  text: 'Book Repair Online',
                  variant: 'secondary',
                  size: 'lg',
                  href: '/booking-demo'
                }
              },
              {
                component: 'Button',
                props: {
                  text: 'Call Now: ' + contactInfo.phone,
                  variant: 'ghost',
                  size: 'lg',
                  href: 'tel:' + contactInfo.phone.replace(/\s/g, '')
                }
              }
            ]}
          />
          
          <div className="text-center mt-12">
            <p className="text-primary-foreground/80 mb-4">Follow us on social media for updates and tips</p>
            <div className="flex justify-center gap-6">
              <a href={contactInfo.social.facebook} className="text-2xl hover:text-primary-foreground/80 transition-colors">📘</a>
              <a href={contactInfo.social.twitter} className="text-2xl hover:text-primary-foreground/80 transition-colors">🐦</a>
              <a href={contactInfo.social.instagram} className="text-2xl hover:text-primary-foreground/80 transition-colors">📷</a>
              <a href={contactInfo.social.linkedin} className="text-2xl hover:text-primary-foreground/80 transition-colors">💼</a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}