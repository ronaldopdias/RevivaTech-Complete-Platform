'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Users, 
  Heart, 
  Zap, 
  Award, 
  Clock,
  MapPin,
  DollarSign,
  ChevronRight,
  Star,
  Coffee,
  Laptop,
  Calendar,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react';

// Company values
const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'We put our customers at the heart of everything we do',
    color: 'from-red-500 to-pink-600'
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'We embrace new technologies and innovative solutions',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We strive for excellence in every repair and interaction',
    color: 'from-purple-500 to-violet-600'
  },
  {
    icon: Users,
    title: 'Teamwork',
    description: 'We work together to achieve great results',
    color: 'from-green-500 to-emerald-600'
  }
];

// Benefits
const benefits = [
  {
    icon: DollarSign,
    title: 'Competitive Salary',
    description: 'Market-leading salaries plus performance bonuses'
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance and wellness programs'
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Flexible working hours and remote work options'
  },
  {
    icon: Laptop,
    title: 'Latest Equipment',
    description: 'Work with the latest tools and technology'
  },
  {
    icon: Calendar,
    title: 'Paid Time Off',
    description: 'Generous vacation days and personal time'
  },
  {
    icon: Award,
    title: 'Training & Development',
    description: 'Continuous learning and certification programs'
  }
];

// Job openings
const jobOpenings = [
  {
    id: 1,
    title: 'Senior Technician - Apple Specialist',
    department: 'Technical',
    type: 'Full-time',
    location: 'London',
    salary: '£35,000 - £45,000',
    description: 'We are looking for an experienced Apple device technician to join our team. You will be responsible for diagnosing and repairing Mac computers, iPhones, and iPads.',
    requirements: [
      'Apple certification preferred',
      '3+ years experience in device repair',
      'Strong problem-solving skills',
      'Excellent attention to detail',
      'Customer service experience'
    ],
    featured: true
  },
  {
    id: 2,
    title: 'Customer Service Representative',
    department: 'Customer Support',
    type: 'Full-time',
    location: 'London',
    salary: '£24,000 - £28,000',
    description: 'Join our customer service team and help customers with their repair needs. You will be the first point of contact for customers and play a key role in their experience.',
    requirements: [
      'Excellent communication skills',
      'Customer service experience',
      'Problem-solving abilities',
      'Basic technical knowledge helpful',
      'Positive attitude'
    ],
    featured: false
  },
  {
    id: 3,
    title: 'Data Recovery Specialist',
    department: 'Technical',
    type: 'Full-time',
    location: 'London',
    salary: '£32,000 - £40,000',
    description: 'Specialized role focusing on data recovery from damaged storage devices. You will work with advanced tools and techniques to recover valuable data for our customers.',
    requirements: [
      'Data recovery experience',
      'Knowledge of storage technologies',
      'Clean room experience preferred',
      'Attention to detail',
      'Discretion and confidentiality'
    ],
    featured: true
  },
  {
    id: 4,
    title: 'Marketing Coordinator',
    department: 'Marketing',
    type: 'Full-time',
    location: 'London',
    salary: '£26,000 - £32,000',
    description: 'Help grow our brand and reach new customers. You will work on digital marketing campaigns, social media, and customer communications.',
    requirements: [
      'Marketing experience',
      'Digital marketing skills',
      'Social media management',
      'Content creation abilities',
      'Analytics experience'
    ],
    featured: false
  },
  {
    id: 5,
    title: 'Junior Technician',
    department: 'Technical',
    type: 'Full-time',
    location: 'London',
    salary: '£20,000 - £26,000',
    description: 'Entry-level position for someone passionate about technology. You will assist senior technicians and learn repair techniques for various devices.',
    requirements: [
      'Interest in technology',
      'Basic repair knowledge',
      'Willingness to learn',
      'Good communication skills',
      'Team player'
    ],
    featured: false
  }
];

// Company stats
const stats = [
  { value: '50+', label: 'Team Members', icon: Users },
  { value: '5 years', label: 'In Business', icon: Calendar },
  { value: '50K+', label: 'Repairs Completed', icon: Award },
  { value: '4.9/5', label: 'Employee Rating', icon: Star }
];

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    coverLetter: ''
  });

  const handleJobSelect = (jobId: number) => {
    setSelectedJob(selectedJob === jobId ? null : jobId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setApplicationData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Application submitted:', applicationData);
  };

  return (
    <MainLayout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                Join the <span className="gradient-text">RevivaTech</span> Team
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Be part of London's premier device repair service. We're looking for passionate individuals who love technology and helping people.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
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

        {/* Company Values */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Our <span className="gradient-text">Values</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These core values guide everything we do and shape our company culture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div key={index} className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Why Work <span className="gradient-text">With Us?</span>
              </h2>
              <p className="text-lg text-gray-600">
                We offer competitive benefits and a great work environment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Job Openings */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Open <span className="gradient-text">Positions</span>
              </h2>
              <p className="text-lg text-gray-600">
                Find your perfect role and start your career with us
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {jobOpenings.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleJobSelect(job.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-display font-bold">{job.title}</h3>
                          {job.featured && (
                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{job.department}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{job.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-6 h-6 text-gray-400 transition-transform ${
                        selectedJob === job.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>

                  {selectedJob === job.id && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="pt-6">
                        <h4 className="font-display font-bold mb-4">Job Description</h4>
                        <p className="text-gray-700 mb-6">{job.description}</p>
                        
                        <h4 className="font-display font-bold mb-4">Requirements</h4>
                        <div className="space-y-2 mb-6">
                          {job.requirements.map((req, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{req}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-4">
                          <button className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                            Apply Now
                          </button>
                          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Apply <span className="gradient-text">Today</span>
              </h2>
              <p className="text-lg text-gray-600">
                Ready to join our team? Fill out the form below and we'll be in touch
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={applicationData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={applicationData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={applicationData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <select
                      name="position"
                      value={applicationData.position}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">Select a position</option>
                      {jobOpenings.map((job) => (
                        <option key={job.id} value={job.title}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <select
                    name="experience"
                    value={applicationData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="">Select experience level</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-3">2-3 years</option>
                    <option value="4-5">4-5 years</option>
                    <option value="6+">6+ years</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    name="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Tell us why you'd be a great fit for this role..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Submit Application
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold mb-4">
                Questions About <span className="gradient-text">Working With Us?</span>
              </h2>
              <p className="text-lg text-gray-600">
                Get in touch with our HR team
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-4">Speak with our HR team</p>
                <p className="text-xl font-bold text-blue-600">020 7123 4567</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Send us your questions</p>
                <p className="text-lg font-semibold text-purple-600">careers@revivatech.co.uk</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}