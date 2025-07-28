import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: "Privacy Policy - How RevivaTech Protects Your Personal Information",
  description: "RevivaTech's privacy policy explains how we collect, use, and protect your personal information. UK GDPR compliant with comprehensive data protection measures.",
  keywords: [
    "privacy policy",
    "data protection",
    "gdpr compliance",
    "personal information",
    "data security",
    "customer privacy",
    "information handling"
  ],
  openGraph: {
    title: "Privacy Policy - How RevivaTech Protects Your Personal Information",
    description: "RevivaTech's privacy policy explains how we collect, use, and protect your personal information. UK GDPR compliant.",
    url: "https://revivatech.co.uk/privacy"
  },
  alternates: {
    canonical: "/privacy"
  },
  robots: {
    index: true,
    follow: true
  }
};
import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/sections/HeroSection';

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection
        variant="secondary"
        size="medium"
        alignment="center"
        title={{
          text: "Privacy Policy",
          level: 1,
          variant: 'display'
        }}
        subtitle={{
          text: "How we collect, use, and protect your personal information",
          variant: 'large'
        }}
        description={{
          text: "At RevivaTech, we are committed to protecting your privacy and ensuring the security of your personal data. This policy explains our practices in detail.",
          variant: 'body'
        }}
        background="muted"
        className="mb-16"
      />

      {/* Privacy Policy Content */}
      <div className="container mx-auto px-4 mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            
            {/* Last Updated */}
            <div className="bg-muted p-6 rounded-lg mb-12">
              <p className="text-sm text-muted-foreground mb-2">Last Updated: January 2025</p>
              <p className="text-sm">
                This Privacy Policy is effective as of January 1, 2025, and applies to all users of RevivaTech services.
                We may update this policy from time to time and will notify you of any material changes.
              </p>
            </div>

            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">1. Introduction</h2>
              <p className="mb-4">
                RevivaTech ("we," "our," or "us") operates the computer and device repair services at revivatech.co.uk. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit 
                our website, use our services, or interact with us.
              </p>
              <p className="mb-4">
                We are committed to protecting your privacy and ensuring that your personal information is handled in a 
                safe and responsible manner. This policy complies with the UK General Data Protection Regulation (UK GDPR) 
                and the Data Protection Act 2018.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-4">2.1 Personal Information</h3>
              <p className="mb-4">We may collect the following personal information:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Contact Information:</strong> Name, email address, phone number, postal address</li>
                <li><strong>Device Information:</strong> Device type, model, serial number, problem description</li>
                <li><strong>Service Information:</strong> Repair history, service preferences, communication preferences</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by third-party providers)</li>
                <li><strong>Account Information:</strong> Username, password (encrypted), profile preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">2.2 Technical Information</h3>
              <p className="mb-4">We automatically collect certain technical information:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Website Usage:</strong> IP address, browser type, pages visited, time spent on site</li>
                <li><strong>Device Data:</strong> Operating system, device type, screen resolution</li>
                <li><strong>Cookies and Analytics:</strong> Session data, preferences, performance metrics</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">2.3 Device Content</h3>
              <p className="mb-4">
                During repair services, we may have access to content on your device. We implement strict policies 
                to protect your privacy:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>We only access content necessary for diagnosis and repair</li>
                <li>All technicians sign confidentiality agreements</li>
                <li>We recommend backing up and removing sensitive data before service</li>
                <li>We do not copy, store, or share personal content from your device</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold mb-4">3.1 Service Provision</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Process and fulfill your repair requests</li>
                <li>Communicate about your device status and repairs</li>
                <li>Provide customer support and technical assistance</li>
                <li>Maintain service records and warranty information</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3.2 Business Operations</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Process payments and manage billing</li>
                <li>Improve our services and customer experience</li>
                <li>Analyze usage patterns and service performance</li>
                <li>Conduct quality assurance and training</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3.3 Legal Compliance</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Comply with legal obligations and regulations</li>
                <li>Protect our rights and prevent fraud</li>
                <li>Respond to legal requests and court orders</li>
                <li>Maintain records as required by law</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">4. Information Sharing and Disclosure</h2>
              
              <p className="mb-4">We do not sell, trade, or rent your personal information to third parties. We may share information in these limited circumstances:</p>
              
              <h3 className="text-xl font-semibold mb-4">4.1 Service Providers</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Payment Processors:</strong> Stripe, PayPal for secure payment processing</li>
                <li><strong>Cloud Services:</strong> AWS, Google Cloud for secure data storage</li>
                <li><strong>Communication Tools:</strong> Email and SMS service providers</li>
                <li><strong>Analytics:</strong> Google Analytics for website performance (anonymized data)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">4.2 Legal Requirements</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>To investigate suspected fraud or illegal activity</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">5. Data Security</h2>
              
              <p className="mb-4">We implement comprehensive security measures to protect your information:</p>
              
              <h3 className="text-xl font-semibold mb-4">5.1 Technical Safeguards</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
                <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">5.2 Physical Security</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Secure facilities with controlled access</li>
                <li>Surveillance systems and alarm monitoring</li>
                <li>Locked storage for devices under repair</li>
                <li>Secure disposal of electronic media</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">5.3 Staff Training</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Regular privacy and security training for all staff</li>
                <li>Signed confidentiality agreements</li>
                <li>Background checks for all technicians</li>
                <li>Clear data handling procedures and policies</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">6. Your Rights Under UK GDPR</h2>
              
              <p className="mb-4">You have the following rights regarding your personal data:</p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-semibold mb-3">Right to Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Request a copy of the personal data we hold about you
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-semibold mb-3">Right to Rectification</h4>
                  <p className="text-sm text-muted-foreground">
                    Request correction of inaccurate or incomplete data
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-semibold mb-3">Right to Erasure</h4>
                  <p className="text-sm text-muted-foreground">
                    Request deletion of your personal data in certain circumstances
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-semibold mb-3">Right to Portability</h4>
                  <p className="text-sm text-muted-foreground">
                    Request your data in a structured, machine-readable format
                  </p>
                </div>
              </div>

              <p className="mb-4">
                To exercise any of these rights, please contact us at privacy@revivatech.co.uk. 
                We will respond within 30 days of receiving your request.
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">7. Cookies and Tracking</h2>
              
              <p className="mb-4">We use cookies and similar technologies to enhance your experience:</p>
              
              <h3 className="text-xl font-semibold mb-4">7.1 Types of Cookies</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for website functionality and security</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Targeting Cookies:</strong> Used for relevant advertising (with your consent)</li>
              </ul>

              <p className="mb-4">
                You can manage your cookie preferences through your browser settings or our cookie consent manager. 
                Please note that disabling certain cookies may affect website functionality.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">8. Data Retention</h2>
              
              <p className="mb-4">We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy:</p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Service Records:</strong> 7 years for warranty and legal compliance</li>
                <li><strong>Financial Records:</strong> 6 years as required by UK tax law</li>
                <li><strong>Marketing Data:</strong> Until you withdraw consent or unsubscribe</li>
                <li><strong>Website Analytics:</strong> 26 months (Google Analytics default)</li>
                <li><strong>CCTV Footage:</strong> 30 days unless required for investigation</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">9. Children's Privacy</h2>
              
              <p className="mb-4">
                Our services are not directed to children under 16 years of age. We do not knowingly collect 
                personal information from children under 16. If you are a parent or guardian and believe your 
                child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">10. International Data Transfers</h2>
              
              <p className="mb-4">
                Some of our service providers may be located outside the UK. When we transfer your data internationally, 
                we ensure appropriate safeguards are in place:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Adequacy decisions by the UK Information Commissioner's Office</li>
                <li>Standard Contractual Clauses approved by UK authorities</li>
                <li>Certification schemes and codes of conduct</li>
                <li>Binding corporate rules for multinational companies</li>
              </ul>
            </section>

            {/* Changes to Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">11. Changes to This Privacy Policy</h2>
              
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify you of any material changes by:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a prominent notice on our website</li>
                <li>Requesting renewed consent where required</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">12. Contact Us</h2>
              
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="bg-card p-6 rounded-lg border">
                <h4 className="font-semibold mb-4">Data Protection Officer</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> privacy@revivatech.co.uk</p>
                  <p><strong>Phone:</strong> 020 7123 4567</p>
                  <p><strong>Post:</strong><br/>
                    RevivaTech Data Protection Officer<br/>
                    8 GodsHill Close<br/>
                    Bournemouth, BH8 0EJ<br/>
                    United Kingdom
                  </p>
                </div>
              </div>

              <p className="mt-6 mb-4">
                You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) 
                if you believe we have not handled your personal data appropriately:
              </p>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Information Commissioner's Office</strong><br/>
                  Website: ico.org.uk<br/>
                  Phone: 0303 123 1113<br/>
                  Post: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-8">Related Information</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/terms" 
                className="px-6 py-3 bg-card border rounded-lg hover:shadow-lg transition-shadow font-semibold"
              >
                Terms of Service
              </a>
              <a 
                href="/contact" 
                className="px-6 py-3 bg-card border rounded-lg hover:shadow-lg transition-shadow font-semibold"
              >
                Contact Us
              </a>
              <a 
                href="mailto:privacy@revivatech.co.uk" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Privacy Questions
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}