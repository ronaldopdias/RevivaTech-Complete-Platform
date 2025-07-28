import type { Metadata } from 'next';
import React from 'react';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: "Contact RevivaTech - Get In Touch for Computer Repair Services",
  description: "Contact RevivaTech for professional computer repair services. Call 020 7123 4567, book online, or visit our Bournemouth location. Free quotes and same-day service available.",
  keywords: [
    "contact revivatech",
    "computer repair contact",
    "bournemouth repair shop contact",
    "book repair appointment",
    "repair quote",
    "bournemouth repair shop",
    "phone repair quote",
    "emergency repair",
    "repair consultation"
  ],
  openGraph: {
    title: "Contact RevivaTech - Get In Touch for Computer Repair Services",
    description: "Contact RevivaTech for professional computer repair services. Call 020 7123 4567, book online, or visit our Bournemouth location.",
    url: "https://revivatech.co.uk/contact",
    images: [
      {
        url: "/images/contact-social-share.jpg",
        width: 1200,
        height: 630,
        alt: "Contact RevivaTech Computer Repair"
      }
    ]
  },
  alternates: {
    canonical: "/contact"
  }
};
export default function ContactPage() {
  return <ContactPageClient />;
}