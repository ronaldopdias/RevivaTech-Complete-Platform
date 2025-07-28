'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface MobileNavigationProps {
  className?: string;
}

const navigationTabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    path: '/',
  },
  {
    id: 'services',
    label: 'Services', 
    icon: 'wrench',
    path: '/services',
  },
  {
    id: 'book',
    label: 'Book',
    icon: 'calendar-plus',
    path: '/book-repair',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/dashboard',
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'message-circle',
    path: '/contact',
  },
];

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [showFAB, setShowFAB] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Update active tab based on current path
  useEffect(() => {
    const currentTab = navigationTabs.find(tab => 
      pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path))
    );
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [pathname]);

  // Hide/show FAB on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowFAB(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleTabPress = (tab: TabItem) => {
    // Haptic feedback for supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    setActiveTab(tab.id);
    router.push(tab.path);
  };

  const handleFABPress = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]);
    }
    
    router.push('/book-repair');
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <motion.nav
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white/80 backdrop-blur-lg border-t border-gray-200/50
          safe-area-pb
          ${className}
        `}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center justify-around px-4 py-2 h-16">
          {navigationTabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[48px] min-h-[48px] rounded-xl
                transition-all duration-300 ease-out
                ${activeTab === tab.id 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
              whileTap={{ scale: 0.9 }}
              onTouchStart={() => handleTabPress(tab)}
              onClick={() => handleTabPress(tab)}
            >
              {/* Active Tab Background */}
              <AnimatePresence>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-primary-50 rounded-xl"
                    layoutId="activeTabBg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                  />
                )}
              </AnimatePresence>

              {/* Tab Icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <Icon 
                    name={tab.icon} 
                    size={20}
                    className={activeTab === tab.id ? 'text-primary-600' : 'text-gray-500'}
                  />
                  
                  {/* Badge */}
                  {tab.badge && (
                    <motion.span
                      className="
                        absolute -top-1 -right-1 
                        min-w-[16px] h-4 px-1
                        bg-accent-500 text-white text-xs font-medium
                        rounded-full flex items-center justify-center
                      "
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </div>
                
                {/* Tab Label */}
                <span className={`
                  text-xs font-medium mt-1 transition-colors
                  ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-500'}
                `}>
                  {tab.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Floating Action Button */}
      <AnimatePresence>
        {showFAB && (
          <motion.button
            className="
              fixed bottom-20 right-4 z-40
              w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500
              rounded-full shadow-lg shadow-primary-500/25
              flex items-center justify-center
              text-white font-semibold
              active:scale-95 transition-transform
            "
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onTouchStart={handleFABPress}
            onClick={handleFABPress}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Icon name="plus" size={24} className="text-white" />
            
            {/* Ripple Effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)'
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Safe Area Spacer */}
      <div className="h-16 w-full" />
    </>
  );
}

export default MobileNavigation;