export const mockAuthService = {
  login: jest.fn().mockResolvedValue({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer'
    },
    token: 'mock-token',
    refreshToken: 'mock-refresh-token'
  }),
  
  register: jest.fn().mockResolvedValue({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer'
    },
    token: 'mock-token',
    refreshToken: 'mock-refresh-token'
  }),
  
  logout: jest.fn().mockResolvedValue(true),
  
  refreshToken: jest.fn().mockResolvedValue({
    token: 'new-mock-token',
    refreshToken: 'new-mock-refresh-token'
  }),
  
  forgotPassword: jest.fn().mockResolvedValue({
    message: 'Password reset email sent'
  }),
  
  resetPassword: jest.fn().mockResolvedValue({
    message: 'Password reset successful'
  }),
  
  verifyEmail: jest.fn().mockResolvedValue({
    message: 'Email verified successfully'
  }),
  
  getCurrentUser: jest.fn().mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer'
  }),
  
  updateProfile: jest.fn().mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    name: 'Updated User',
    role: 'customer'
  })
};