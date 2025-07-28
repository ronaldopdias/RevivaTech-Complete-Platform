import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/customer-portal/',
        '/customer-dashboard/',
      ],
    },
    sitemap: 'https://revivatech.co.uk/sitemap.xml',
  };
}