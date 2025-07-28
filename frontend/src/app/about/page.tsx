'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Users, 
  Award, 
  Shield, 
  Clock,
  ArrowRight,
  Star,
  CheckCircle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

const teamMembers = [
  {
    id: 1,
    name: 'Marcus Thompson',
    role: 'Founder & CEO',
    bio: 'Over 15 years of experience in electronics repair and business management. Passionate about providing exceptional customer service.',
    experience: '15+ years',
    certifications: 'Apple Certified, CompTIA A+',
    photo: null
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    role: 'Senior Technician',
    bio: 'Expert in mobile device repairs and data recovery. Specializes in iPhone and Android device diagnostics.',
    experience: '8+ years',
    certifications: 'IPC Certified, Mobile Repair',
    photo: null
  },
  {
    id: 3,
    name: 'David Chen',
    role: 'Lead Technician',
    bio: 'Computer hardware specialist with expertise in Mac and PC repairs. Known for solving complex logic board issues.',
    experience: '10+ years',
    certifications: 'Apple Certified, Microsoft Partner',
    photo: null
  }
];

const companyStats = [
  { value: '50,000+', label: 'Devices Repaired', icon: Award },
  { value: '4.9/5', label: 'Customer Rating', icon: Star },
  { value: '98%', label: 'Success Rate', icon: CheckCircle },
  { value: '24hrs', label: 'Average Turnaround', icon: Clock },
];

const milestones = [
  {
    year: '2018',
    title: 'Company Founded',
    description: 'Started as a small repair shop in Bournemouth with a focus on quality service.'
  },
  {
    year: '2019',
    title: 'Team Expansion',
    description: 'Grew our team of certified technicians and introduced comprehensive repair warranties.'
  },
  {
    year: '2020',
    title: 'Digital Transformation',
    description: 'Launched online booking system and contactless repair services during the pandemic.'
  },
  {
    year: '2021',
    title: 'Service Excellence',
    description: 'Achieved 98% customer satisfaction rate and expanded to serve all of Bournemouth.'
  },
  {
    year: '2022',
    title: 'Innovation Leader',
    description: 'Introduced advanced diagnostics and became an authorized service provider for major brands.'
  },
  {
    year: '2025',
    title: 'Industry Leader',
    description: 'Now serving 50,000+ customers with the most advanced repair facility in Bournemouth.'
  }
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            About RevivaTech
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
Bournemouth's most trusted device repair specialists, bringing technology back to life since 2018
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/booking-demo" 
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Book Repair Now
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="/services" 
              className="border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors"
            >
              Our Services
            </a>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {companyStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Our Story</h2>
            <div className="text-lg text-gray-600 leading-relaxed space-y-6">
              <p>
                RevivaTech was founded in 2018 with a simple mission: to provide honest, professional, 
                and reliable device repair services to the people of Bournemouth. What started as a small 
                repair shop has grown into one of Bournemouth's most trusted repair services.
              </p>
              <p>
                We believe that technology should enhance your life, not complicate it. When your devices 
                break down, we're here to get them—and you—back up and running as quickly as possible. 
                Our team of certified technicians combines years of experience with the latest diagnostic 
                tools to ensure your repairs are done right the first time.
              </p>
              <p>
                From the latest iPhone to vintage MacBooks, from gaming laptops to critical business 
                servers, we've seen it all and fixed it all. Our commitment to using genuine parts, 
                providing comprehensive warranties, and maintaining transparent pricing has earned us 
                the trust of over 50,000 customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a small repair shop to Bournemouth's leading device repair service
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="flex gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{milestone.year}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Meet Our Expert Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Certified technicians passionate about technology and customer service
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-2xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600 mb-6">{member.bio}</p>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Experience: </span>
                    <span className="text-gray-600">{member.experience}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Certifications: </span>
                    <span className="text-gray-600">{member.certifications}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Integrity</h3>
              <p className="text-gray-600">
                We provide honest assessments, transparent pricing, and will always tell you 
                if a repair isn't worth the cost.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Excellence</h3>
              <p className="text-gray-600">
                We use only genuine parts, employ certified technicians, and stand behind 
                our work with comprehensive warranties.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Service</h3>
              <p className="text-gray-600">
                Your satisfaction is our priority. We go above and beyond to ensure you're 
                completely happy with our service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Visit Our Bournemouth Workshop</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Conveniently located in Bournemouth with easy local access
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Address</h3>
              <p className="text-blue-100">
                8 GodsHill Close<br />
                Bournemouth<br />
                BH8 0EJ
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Phone</h3>
              <p className="text-blue-100">
                <a href="tel:02071234567" className="hover:underline">
                  020 7123 4567
                </a>
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Email</h3>
              <p className="text-blue-100">
                <a href="mailto:hello@revivatech.co.uk" className="hover:underline">
                  hello@revivatech.co.uk
                </a>
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a 
              href="/booking-demo" 
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Book Your Repair
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}