import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  const backendUrl = `http://revivatech_backend:3011/api/${apiPath}`;
  
  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || '',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Forward Set-Cookie headers from backend to client
    const setCookies = response.headers.get('set-cookie');
    if (setCookies) {
      res.setHeader('Set-Cookie', setCookies);
    }
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}