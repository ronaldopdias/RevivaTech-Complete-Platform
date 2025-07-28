'use client';

import React from 'react';
import FloatingNavigation from '@/components/navigation/FloatingNavigation';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';
import Footer from '@/components/layout/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  breadcrumbClassName?: string;
  customBreadcrumbs?: any[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showBreadcrumbs = true,
  breadcrumbClassName = '',
  customBreadcrumbs 
}) => {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.2),transparent_50%)]"></div>
      
      {/* Header Container */}
      <header className="relative h-20 w-full z-50">
        <FloatingNavigation />
      </header>
      
      <main className="relative z-10">
        {children}
      </main>
      <Footer 
        variant="default"
        showNewsletter={false}
        showSocial={true}
        showContact={true}
        companyName="RevivaTech"
        copyright="© 2025 RevivaTech. All rights reserved. | London's Premier Device Repair Service"
      />
    </div>
  );
};

export default MainLayout;