import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { SWRConfig } from 'swr';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ClientOnly } from '../components/ClientOnly';
import { fetcher } from '../lib/api';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Professional device repair and data recovery services in the UK" />
        <meta name="keywords" content="device repair, data recovery, iPhone repair, MacBook repair, laptop repair, UK" />
        <meta name="author" content="RevivaTech" />
        <meta property="og:site_name" content="RevivaTech" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://revivatech.co.uk" />
      </Head>
      
      <SWRConfig
        value={{
          fetcher,
          errorRetryCount: 3,
          errorRetryInterval: 1000,
          dedupingInterval: 2000,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
        }}
      >
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          suppressHydrationWarning
        >
          <ErrorBoundary>
            <div className={inter.className} suppressHydrationWarning>
              <Component {...pageProps} />
              <ClientOnly>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1f2937',
                      color: '#f9fafb',
                    },
                  }}
                />
              </ClientOnly>
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </SWRConfig>
    </>
  );
}