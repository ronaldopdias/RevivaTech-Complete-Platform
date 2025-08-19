import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SimpleThemeProvider } from "@/providers/SimpleThemeProvider";
import { ServiceProvider } from "@/providers/ServiceProvider";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import PWAInitializer from "@/components/PWAInitializer";
import FingerprintAnalytics from "@/components/analytics/FingerprintAnalytics";
import PerformanceOptimizer from "@/components/performance/PerformanceOptimizer";
import { UniversalAnalyticsProvider } from "@/components/analytics/UniversalAnalyticsProvider";
import ThirdPartyAnalyticsWrapper from "@/components/analytics/ThirdPartyAnalyticsWrapper";
import ConsentManager from "@/components/analytics/ConsentManager";
import { WebSocketProvider } from "@/lib/realtime/WebSocketProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";

// Analytics are managed via ThirdPartyAnalyticsWrapper

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "RevivaTech - Professional Computer & Device Repair Services Bournemouth",
    template: "%s | RevivaTech"
  },
  description: "Expert computer repair services in Bournemouth. Mac, PC, mobile device repairs with 90-day warranty, genuine parts, and same-day service. Free diagnostics and transparent pricing.",
  keywords: [
    "computer repair bournemouth",
    "laptop repair",
    "mac repair",
    "iphone repair", 
    "data recovery",
    "virus removal",
    "pc repair",
    "mobile repair",
    "bournemouth repair shop",
    "device repair",
    "screen repair",
    "professional repair",
    "same day repair",
    "warranty repair",
    "bournemouth repair",
    "apple certified repair",
    "macbook repair",
    "ipad repair",
    "android repair",
    "tablet repair"
  ],
  authors: [{ name: "RevivaTech", url: "https://revivatech.co.uk" }],
  creator: "RevivaTech",
  publisher: "RevivaTech",
  category: "Technology Services",
  metadataBase: new URL("https://revivatech.co.uk"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://revivatech.co.uk",
    siteName: "RevivaTech",
    title: "RevivaTech - Professional Computer & Device Repair Services Bournemouth",
    description: "Expert computer repair services in Bournemouth. Mac, PC, mobile device repairs with 90-day warranty, genuine parts, and same-day service.",
    images: [
      {
        url: "/images/revivatech-social-share.jpg",
        width: 1200,
        height: 630,
        alt: "RevivaTech Computer Repair Services Bournemouth"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@revivatech",
    creator: "@revivatech",
    title: "RevivaTech - Professional Computer & Device Repair Services Bournemouth",
    description: "Expert computer repair services in Bournemouth. Mac, PC, mobile device repairs with 90-day warranty, genuine parts, and same-day service.",
    images: ["/images/revivatech-social-share.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0EA5E9" },
    { media: "(prefers-color-scheme: dark)", color: "#38BDF8" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-5GE7SMG2S1"></script>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-5GE7SMG2S1');
            `,
          }}
        />
        
        {/* Facebook Pixel */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2652169749501');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2652169749501&ev=PageView&noscript=1"
          />
        </noscript>
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Icons - minimized to reduce preload warnings */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        
        {/* Removed preload to prevent browser warnings about unused resources */}
        
        {/* PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RevivaTech" />
        
        {/* Windows PWA Support */}
        <meta name="msapplication-TileImage" content="/icons/icon-192x192.svg" />
        <meta name="msapplication-TileColor" content="#0EA5E9" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#0EA5E9" />
        <meta name="background-color" content="#ffffff" />
        
        {/* Business Structured Data */}
        <script 
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://revivatech.co.uk/#business",
              "name": "RevivaTech",
              "alternateName": "RevivaTech Computer Repair",
              "description": "Professional computer and device repair services in Bournemouth with expert technicians, genuine parts, and comprehensive warranties.",
              "url": "https://revivatech.co.uk",
              "logo": "https://revivatech.co.uk/images/revivatech-logo.svg",
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
              "priceRange": "£29-£599",
              "serviceArea": {
                "@type": "City",
                "name": "Bournemouth"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "247",
                "bestRating": "5"
              },
              "sameAs": [
                "https://facebook.com/revivatech",
                "https://twitter.com/revivatech",
                "https://instagram.com/revivatech"
              ]
            })
          }}
        />
        
        {/* Organization Structured Data */}
        <script 
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
                }
              ],
              "founder": {
                "@type": "Person",
                "name": "Marcus Thompson"
              },
              "foundingDate": "2018-01-01",
              "slogan": "Reviving Technology, Restoring Confidence"
            })
          }}
        />
        
        {/* Theme script */}
        <script 
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('revivatech-theme') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {
                  console.warn('Failed to set theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div suppressHydrationWarning>
          <SimpleThemeProvider
            defaultTheme="system"
            storageKey="revivatech-theme"
          >
              <AuthProvider>
                <ServiceProvider
                  config={{
                    environment: (process.env.NODE_ENV as any) || 'development',
                    useMockServices: process.env.NODE_ENV === 'development',
                    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
                  }}
                  enableHealthMonitoring={process.env.NODE_ENV === 'production'}
                  healthCheckInterval={process.env.NODE_ENV === 'production' ? 60000 : 0}
                >
                  <OnboardingProvider
                    enableAutoStart={true}
                    skipForDevelopment={false}
                  >
                    <ThirdPartyAnalyticsWrapper>
                      <UniversalAnalyticsProvider
                        trackingEnabled={process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false'}
                        debugMode={process.env.NODE_ENV === 'development'}
                      >
                        {/* WebSocket temporarily disabled to prevent connection errors */}
                        {children}
                      <PWAInitializer />
                      <FingerprintAnalytics />
                      <PerformanceOptimizer 
                        showDebugPanel={process.env.NODE_ENV === 'development'}
                        enableAutoOptimizations={true}
                      />
                      <ConsentManager 
                        showBanner={true}
                        position="bottom"
                      />
                    </UniversalAnalyticsProvider>
                  </ThirdPartyAnalyticsWrapper>
                </OnboardingProvider>
              </ServiceProvider>
              </AuthProvider>
          </SimpleThemeProvider>
        </div>
      </body>
    </html>
  );
}
