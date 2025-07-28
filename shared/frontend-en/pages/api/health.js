// Simple health check endpoint
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'RevivaTech New Frontend',
    version: '2.0.0'
  });
}