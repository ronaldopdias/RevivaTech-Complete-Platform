'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Menu as MenuIcon,
  LayoutDashboard,
  Wrench,
  BarChart3,
  Settings,
  Users,
  Video,
  FileText,
  Database
} from 'lucide-react';

const drawerWidth = 260;

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AdminLayout({ children, title = 'Admin Dashboard', breadcrumbs = [] }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { text: 'Procedures', icon: Wrench, href: '/admin/procedures' },
    { text: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { text: 'Media Library', icon: Video, href: '/admin/media' },
    { text: 'Users', icon: Users, href: '/admin/users' },
    { text: 'Reports', icon: FileText, href: '/admin/reports' },
    { text: 'Database', icon: Database, href: '/admin/database' },
    { text: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const drawerContent = (
    <div className="h-full flex flex-col">
      {/* Logo/Brand Section */}
      <div
        className="h-16 px-4 flex items-center border-b border-white/10 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #ADD8E6 0%, #4A9FCC 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">RevivaTech</h2>
            <p className="text-white/80 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Scrollable Container */}
      <div className="flex-1 overflow-hidden">
        <nav className="h-full pt-2 overflow-y-auto admin-nav-scroll">
          <ul className="space-y-1 px-2 pb-4">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#36454F] hover:bg-[#ADD8E6] hover:text-[#1A5266] hover:translate-x-1 transition-all duration-200 group"
                >
                  {React.createElement(item.icon, { className: "w-5 h-5 text-[#4A9FCC] group-hover:text-[#1A5266]" })}
                  <span className="text-sm font-medium group-hover:font-semibold">
                    {item.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Trust Signal Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="bg-[#008080] text-white text-xs h-5"
          >
            Phase 4 Active
          </Badge>
        </div>
        <p className="text-[#36454F] text-xs">ML-Enhanced System</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* App Bar */}
      <header
        className="fixed top-0 right-0 bg-white shadow-sm border-b border-gray-200 z-30"
        style={{
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
          left: isMobile ? 0 : `${drawerWidth}px`
        }}
      >
        <div className="h-16 px-4 flex items-center">
          <Button
            variant="ghost"
            onClick={handleDrawerToggle}
            className="mr-4 p-2 md:hidden text-[#36454F]"
            aria-label="open drawer"
          >
            <MenuIcon className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[#1A5266] mb-1">
              {title}
            </h1>

            {breadcrumbs.length > 0 && (
              <nav className="text-sm text-[#36454F]">
                {breadcrumbs.map((crumb, index) => (
                  <span key={index}>
                    {index > 0 && <span className="mx-2">/</span>}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-[#1A5266]">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-[#008080] text-white flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      <nav
        className="flex-shrink-0"
        style={{ width: isMobile ? 0 : drawerWidth }}
        aria-label="admin navigation"
      >
        {/* Mobile Drawer */}
        {isMobile && mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black opacity-50"
              onClick={handleDrawerToggle}
            />
            <div
              className="relative bg-white shadow-lg"
              style={{ width: drawerWidth }}
            >
              {drawerContent}
            </div>
          </div>
        )}

        {/* Desktop Drawer */}
        {!isMobile && (
          <div
            className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg"
            style={{ width: drawerWidth }}
          >
            {drawerContent}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main
        className="flex-1 bg-[#F9FAFB] min-h-screen"
        style={{
          marginLeft: isMobile ? 0 : 0,
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`
        }}
      >
        <div className="pt-16">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// Also export as default for backward compatibility
export default AdminLayout;