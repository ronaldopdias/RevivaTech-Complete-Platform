import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// SWR fetcher function
export const fetcher = (url: string) => 
  api.get(url).then(res => res.data);

// API functions
export const apiClient = {
  // Health check
  health: () => api.get('/health'),
  
  // Info
  info: () => api.get('/api/info'),
  
  // Data Recovery
  dataRecovery: {
    getServices: () => api.get('/api/data-recovery/services'),
    createBooking: (data: any) => api.post('/api/bookings', data),
    getBooking: (id: string) => api.get(`/api/bookings/${id}`),
    updateBooking: (id: string, data: any) => api.put(`/api/bookings/${id}`, data),
  },
  
  // Repair Services
  repairs: {
    getServices: () => api.get('/api/repairs/services'),
    createBooking: (data: any) => api.post('/api/repairs/bookings', data),
    getBooking: (id: string) => api.get(`/api/repairs/bookings/${id}`),
  },
  
  // Customers
  customers: {
    create: (data: any) => api.post('/api/customers', data),
    update: (id: string, data: any) => api.put(`/api/customers/${id}`, data),
    get: (id: string) => api.get(`/api/customers/${id}`),
  },
};

export default api;