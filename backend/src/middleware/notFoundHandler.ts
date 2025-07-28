import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      type: 'NotFoundError',
    },
    availableEndpoints: {
      health: '/api/health',
      auth: '/api/auth',
      devices: '/api/devices',
      bookings: '/api/bookings',
      customers: '/api/customers',
    },
    timestamp: new Date().toISOString(),
  });
};