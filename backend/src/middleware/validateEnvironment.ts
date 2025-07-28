import { Request, Response, NextFunction } from 'express';

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'DATABASE_URL'
];

const validateEnvironment = (req: Request, res: Response, next: NextFunction) => {
  // Skip validation for non-critical endpoints
  if (req.path === '/api/health' || req.path === '/') {
    return next();
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server configuration error',
        type: 'ConfigurationError',
        details: process.env.NODE_ENV === 'development' 
          ? `Missing environment variables: ${missingVars.join(', ')}` 
          : 'Server misconfiguration detected',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

export { validateEnvironment };