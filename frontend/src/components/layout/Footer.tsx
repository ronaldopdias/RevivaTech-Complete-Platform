'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';

// Footer section interface
interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
}

// Footer props
export interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'rich';
  showNewsletter?: boolean;
  showSocial?: boolean;
  showContact?: boolean;
  sections?: FooterSection[];
  copyright?: string;
  logo?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  companyName?: string;
}

// Footer component
export const Footer: React.FC<FooterProps> = ({
  className,
  variant = 'default',
  showNewsletter = true,
  showSocial = true,
  showContact = true,
  sections,
  copyright,
  logo,
  companyName = 'RevivaTech',
}) => {
  // Comprehensive sitemap footer sections
  const defaultSections: FooterSection[] = [
    {
      title: 'Services',
      links: [
        { label: 'Mac Repair', href: '/apple/mac-repair' },
        { label: 'iPhone Repair', href: '/apple/iphone-repair' },
        { label: 'iPad Repair', href: '/apple/ipad-repair' },
        { label: 'MacBook Repair', href: '/apple/macbook-repair' },
        { label: 'PC Repair', href: '/laptop-pc/repair' },
        { label: 'Data Recovery', href: '/data-recovery' },
        { label: 'Virus Removal', href: '/laptop-pc/virus-removal' },
        { label: 'Custom Builds', href: '/laptop-pc/custom-builds' },
      ],
    },
    {
      title: 'Customer Portal',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Track Repair', href: '/track-repair' },
        { label: 'Repair History', href: '/repair-history' },
        { label: 'My Profile', href: '/profile' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'Login', href: '/login' },
        { label: 'Register', href: '/register' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'All Services', href: '/services' },
        { label: 'Reviews', href: '/reviews' },
        { label: 'Book Repair', href: '/book-repair' },
        { label: 'Admin Portal', href: '/admin' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Support & Legal',
      links: [
        { label: 'FAQ', href: '/faq' },
        { label: 'Warranty', href: '/warranty' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Data Protection', href: '/data-protection' },
      ],
    },
  ];

  const finalSections = sections || defaultSections;
  const currentYear = new Date().getFullYear();
  const finalCopyright = copyright || `© ${currentYear} ${companyName}. All rights reserved.`;

  if (variant === 'minimal') {
    return (
      <footer className={cn("border-t bg-background", className)}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              {logo && (
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 32}
                  height={logo.height || 32}
                  className="h-8 w-auto"
                />
              )}
              <span className="font-semibold text-foreground">{companyName}</span>
            </div>
            <p className="text-sm text-muted-foreground">{finalCopyright}</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("bg-gray-900 text-white", className)}>
      <div className="container mx-auto px-6">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {logo && (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width || 40}
                    height={logo.height || 40}
                    className="h-10 w-auto"
                  />
                )}
                <h3 className="text-xl font-bold text-white">{companyName}</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                Nationwide device repair service based in Bournemouth with 50,000+ happy customers across the UK.
              </p>

              {/* Contact info */}
              {showContact && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">
                      hello@revivatech.co.uk
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a 
                      href="tel:02071234567" 
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      020 7123 4567
                    </a>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">
                      8 GodsHill Close, BH8 0EJ, Bournemouth
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm mt-2">
                    <span className="text-gray-400 ml-7">
                      Nationwide Service Available
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer sections */}
            {finalSections.map((section, index) => (
              <div key={section.title} className="lg:col-span-1">
                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter signup */}
          {showNewsletter && variant === 'rich' && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="max-w-md">
                <h4 className="font-semibold text-foreground mb-4">
                  Stay Updated
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the latest tips and updates about device care and repair.
                </p>
                <form className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <Button type="submit" size="sm">
                    Subscribe
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400 text-center md:text-left">{finalCopyright}</p>

            {/* Social links */}
            {showSocial && (
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com/revivatech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/revivatech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/revivatech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/revivatech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;