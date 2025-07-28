// Shared utility functions
export { clsx } from 'clsx';

// Domain-specific utilities
export const getDomainConfig = () => {
  if (typeof window === 'undefined') return { domain: 'pt', locale: 'pt-BR' };
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('revivatech.co.uk')) {
    return {
      domain: 'en',
      locale: 'en-GB',
      currency: 'GBP',
      timezone: 'Europe/London'
    };
  }
  
  // Default to Portuguese domain
  return {
    domain: 'pt',
    locale: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  };
};

// Theme-aware utility functions
export const getThemeClasses = (theme: 'light' | 'dark') => {
  return {
    background: theme === 'dark' ? 'bg-nordic-charcoal' : 'bg-white',
    surface: theme === 'dark' ? 'bg-nordic-surface' : 'bg-gray-50',
    text: theme === 'dark' ? 'text-nordic-light' : 'text-gray-900',
    border: theme === 'dark' ? 'border-nordic-border' : 'border-gray-200',
  };
};