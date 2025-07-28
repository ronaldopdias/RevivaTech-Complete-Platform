/**
 * API utility functions for RevivaTech frontend
 * Provides dynamic API base URL detection and common API helpers
 */

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3011';
  
  const hostname = window.location.hostname;
  
  // Tailscale IP access (development)
  if (hostname === '100.122.130.67') return 'http://100.122.130.67:3011';
  
  // Production domain
  if (hostname.includes('revivatech.co.uk')) return 'https://api.revivatech.co.uk';
  
  // Development fallback
  return 'http://localhost:3011';
};

export const apiClient = {
  get: async (endpoint: string) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  
  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  
  delete: async (endpoint: string) => {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
};