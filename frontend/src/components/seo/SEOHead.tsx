'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'service' | 'organization';
  structuredData?: object;
  noIndex?: boolean;
  canonical?: string;
}

const defaultSEO = {
  title: 'RevivaTech - Professional Computer & Device Repair Services Bournemouth',
  description: 'Expert computer repair services in Bournemouth. Mac, PC, mobile device repairs with 90-day warranty, genuine parts, and same-day service. Free diagnostics and transparent pricing.',
  keywords: [
    'computer repair bournemouth',
    'laptop repair',
    'mac repair',
    'iphone repair',
    'data recovery',
    'virus removal',
    'pc repair',
    'mobile repair',
    'bournemouth repair shop',
    'device repair',
    'screen repair',
    'professional repair',
    'same day repair',
    'warranty repair'
  ],
  image: '/images/revivatech-social-share.jpg',
  url: 'https://revivatech.co.uk',
  type: 'website' as const
};

// Business structured data
const businessStructuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://revivatech.co.uk/#business",
  "name": "RevivaTech",
  "alternateName": "RevivaTech Computer Repair",
  "description": "Professional computer and device repair services in Bournemouth with expert technicians, genuine parts, and comprehensive warranties.",
  "url": "https://revivatech.co.uk",
  "logo": "https://revivatech.co.uk/images/revivatech-logo.svg",
  "image": [
    "https://revivatech.co.uk/images/shop-front.jpg",
    "https://revivatech.co.uk/images/repair-lab.jpg",
    "https://revivatech.co.uk/images/team-photo.jpg"
  ],
  "telephone": "+442071234567",
  "email": "hello@revivatech.co.uk",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "8 GodsHill Close",
    "addressLocality": "Bournemouth",
    "addressRegion": "Bournemouth",
    "postalCode": "BH8 0EJ",
    "addressCountry": "GB"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "50.7192",
    "longitude": "-1.8808"
  },
  "openingHours": [
    "Mo-Fr 09:00-18:00",
    "Sa 10:00-16:00"
  ],
  "paymentAccepted": "Cash, Credit Card, Debit Card, PayPal, Bank Transfer",
  "priceRange": "£29-£599",
  "serviceArea": {
    "@type": "City",
    "name": "Bournemouth"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Bournemouth"
    },
    {
      "@type": "PostalCode",
      "name": "BH1"
    },
    {
      "@type": "PostalCode", 
      "name": "BH2"
    },
    {
      "@type": "PostalCode",
      "name": "BH3"
    },
    {
      "@type": "PostalCode",
      "name": "BH8"
    },
    {
      "@type": "PostalCode",
      "name": "BH9"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Repair Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Mac Repair",
          "description": "Professional MacBook, iMac, and Mac Mini repair services"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "minPrice": "89",
          "priceCurrency": "GBP"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "PC Repair",
          "description": "Windows laptop and desktop repair services"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "minPrice": "69",
          "priceCurrency": "GBP"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Data Recovery",
          "description": "Professional data recovery from damaged drives"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "minPrice": "129",
          "priceCurrency": "GBP"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Mobile Repair",
          "description": "iPhone, iPad, and Android device repairs"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "minPrice": "49",
          "priceCurrency": "GBP"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sarah Johnson"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "reviewBody": "Outstanding service! My MacBook Pro was repaired quickly and professionally. The team kept me informed throughout the process and the repair came with a 90-day warranty."
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "David Chen"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "reviewBody": "Highly recommend RevivaTech! They recovered all my data from a failed hard drive and fixed my laptop screen. Professional service at a fair price."
    }
  ],
  "sameAs": [
    "https://facebook.com/revivatech",
    "https://twitter.com/revivatech",
    "https://instagram.com/revivatech",
    "https://linkedin.com/company/revivatech"
  ]
};

// Organization structured data
const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://revivatech.co.uk/#organization",
  "name": "RevivaTech",
  "url": "https://revivatech.co.uk",
  "logo": "https://revivatech.co.uk/images/revivatech-logo.svg",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+442071234567",
      "contactType": "customer service",
      "areaServed": "GB",
      "availableLanguage": ["English"]
    },
    {
      "@type": "ContactPoint",
      "email": "hello@revivatech.co.uk",
      "contactType": "customer service",
      "areaServed": "GB"
    }
  ],
  "founder": {
    "@type": "Person",
    "name": "Marcus Thompson"
  },
  "foundingDate": "2018-01-01",
  "numberOfEmployees": "4-10",
  "industry": "Computer Repair",
  "slogan": "Reviving Technology, Restoring Confidence"
};

export default function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  structuredData,
  noIndex = false,
  canonical
}: SEOProps) {
  const pathname = usePathname();
  
  // Construct full URLs
  const fullUrl = url || `${defaultSEO.url}${pathname}`;
  const fullImage = image || defaultSEO.image;
  const canonicalUrl = canonical || fullUrl;

  // Merge keywords
  const allKeywords = keywords ? [...defaultSEO.keywords, ...keywords] : defaultSEO.keywords;

  // Page-specific title
  const pageTitle = title ? `${title} | RevivaTech` : defaultSEO.title;

  // Meta description
  const metaDescription = description || defaultSEO.description;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <meta name="author" content="RevivaTech" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="RevivaTech" />
      <meta property="og:locale" content="en_GB" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@revivatech" />
      <meta name="twitter:creator" content="@revivatech" />
      
      {/* Additional Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="RevivaTech" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#007AFF" />
      
      {/* Business Information */}
      <meta name="business:contact_data:street_address" content="8 GodsHill Close" />
      <meta name="business:contact_data:locality" content="Bournemouth" />
      <meta name="business:contact_data:region" content="Bournemouth" />
      <meta name="business:contact_data:postal_code" content="BH8 0EJ" />
      <meta name="business:contact_data:country_name" content="United Kingdom" />
      <meta name="business:contact_data:phone_number" content="+442071234567" />
      <meta name="business:contact_data:email" content="hello@revivatech.co.uk" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="GB-BOU" />
      <meta name="geo.placename" content="Bournemouth" />
      <meta name="geo.position" content="50.7192;-1.8808" />
      <meta name="ICBM" content="50.7192, -1.8808" />
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData)
        }}
      />
      
      {/* Custom Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      
      {/* Breadcrumb Structured Data for non-home pages */}
      {pathname !== '/' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://revivatech.co.uk"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": title || 'Page',
                  "item": fullUrl
                }
              ]
            })
          }}
        />
      )}
    </Head>
  );
}