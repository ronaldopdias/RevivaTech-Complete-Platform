import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeHref?: string;
}

export function Breadcrumb({ 
  items, 
  className, 
  showHome = true, 
  homeHref = '/admin' 
}: BreadcrumbProps) {
  return (
    <nav 
      aria-label="breadcrumb" 
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      {showHome && (
        <>
          <Link 
            href={homeHref}
            className="flex items-center gap-1 text-[#4A9FCC] hover:text-[#1A5266] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Admin</span>
          </Link>
          {items.length > 0 && (
            <ChevronRight className="w-4 h-4 text-[#36454F] opacity-50" />
          )}
        </>
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link 
              href={item.href}
              className="text-[#4A9FCC] hover:text-[#1A5266] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#36454F] font-medium">
              {item.label}
            </span>
          )}
          
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 text-[#36454F] opacity-50" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumb;