import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: "Terms of Service - RevivaTech Computer Repair Service Terms",
  description: "RevivaTech's terms of service outline the conditions for using our computer repair services, including warranties, liability, and customer responsibilities.",
  keywords: [
    "terms of service",
    "service terms",
    "repair warranty",
    "service conditions",
    "legal terms",
    "customer agreement"
  ],
  openGraph: {
    title: "Terms of Service - RevivaTech Computer Repair Service Terms",
    description: "RevivaTech's terms of service outline the conditions for using our computer repair services, including warranties and customer responsibilities.",
    url: "https://revivatech.co.uk/terms"
  },
  alternates: {
    canonical: "/terms"
  },
  robots: {
    index: true,
    follow: true
  }
};
import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/sections/HeroSection';

export default function TermsOfServicePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection
        variant="secondary"
        size="medium"
        alignment="center"
        title={{
          text: "Terms of Service",
          level: 1,
          variant: 'display'
        }}
        subtitle={{
          text: "Terms and conditions for using RevivaTech services",
          variant: 'large'
        }}
        description={{
          text: "Please read these terms carefully before using our repair services. These terms govern your relationship with RevivaTech and outline our mutual responsibilities.",
          variant: 'body'
        }}
        background="muted"
        className="mb-16"
      />

      {/* Terms Content */}
      <div className="container mx-auto px-4 mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            
            {/* Last Updated */}
            <div className="bg-muted p-6 rounded-lg mb-12">
              <p className="text-sm text-muted-foreground mb-2">Last Updated: January 2025</p>
              <p className="text-sm">
                These Terms of Service are effective as of January 1, 2025. By using our services, you agree to be bound by these terms.
                We may update these terms from time to time and will notify you of any material changes.
              </p>
            </div>

            {/* Acceptance of Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing our website, booking our services, or bringing your device to RevivaTech for repair, 
                you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, 
                please do not use our services.
              </p>
              <p className="mb-4">
                These terms apply to all users of our services, including customers, website visitors, and anyone 
                interacting with RevivaTech in any capacity.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">2. Service Description</h2>
              
              <h3 className="text-xl font-semibold mb-4">2.1 Repair Services</h3>
              <p className="mb-4">RevivaTech provides professional computer and device repair services including:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Mac and PC laptop/desktop repair</li>
                <li>Mobile device repair (iPhone, Android, tablets)</li>
                <li>Data recovery services</li>
                <li>Virus and malware removal</li>
                <li>Custom PC builds and upgrades</li>
                <li>Network setup and optimization</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">2.2 Diagnostic Services</h3>
              <p className="mb-4">
                We offer free diagnostic evaluations to identify device issues and provide repair estimates. 
                Diagnostics are provided in good faith but do not guarantee that all issues will be identified 
                or that repairs will be successful.
              </p>

              <h3 className="text-xl font-semibold mb-4">2.3 Service Limitations</h3>
              <p className="mb-4">
                Our services are subject to availability, technical feasibility, and parts availability. 
                We reserve the right to decline service for devices that are beyond economical repair, 
                pose safety risks, or are suspected of being stolen.
              </p>
            </section>

            {/* Booking and Payment */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">3. Booking and Payment Terms</h2>
              
              <h3 className="text-xl font-semibold mb-4">3.1 Service Booking</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Bookings can be made online, by phone, or in person</li>
                <li>All repair estimates are valid for 30 days from issue date</li>
                <li>Customers must approve all repairs before work begins</li>
                <li>Emergency and same-day services are subject to availability</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3.2 Payment Terms</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Payment is due upon completion of services</li>
                <li>We accept cash, credit/debit cards, bank transfers, and PayPal</li>
                <li>Pricing includes labor and parts unless otherwise specified</li>
                <li>Additional charges may apply for emergency or out-of-hours service</li>
                <li>All prices include VAT where applicable</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3.3 Cancellation Policy</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Customers may cancel bookings up to 2 hours before appointment</li>
                <li>No-show appointments may incur a £25 fee for subsequent bookings</li>
                <li>Work-in-progress cancellations will be charged for completed work</li>
                <li>Diagnostic fees are non-refundable once evaluation begins</li>
              </ul>
            </section>

            {/* Device Handling */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">4. Device Handling and Responsibility</h2>
              
              <h3 className="text-xl font-semibold mb-4">4.1 Customer Responsibilities</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Provide accurate device information and problem descriptions</li>
                <li>Back up important data before bringing device for repair</li>
                <li>Remove or disable security features (passwords, Find My, etc.)</li>
                <li>Provide necessary chargers, adapters, or accessories</li>
                <li>Disclose any previous repair attempts or modifications</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">4.2 Data Protection</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>We strongly recommend backing up all data before repair</li>
                <li>RevivaTech is not responsible for data loss during repair</li>
                <li>We implement security measures to protect customer data</li>
                <li>Personal data access is limited to repair requirements only</li>
                <li>Customer data will not be copied, shared, or misused</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">4.3 Device Security</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Devices are stored in secure, monitored facilities</li>
                <li>Access is restricted to authorized technicians only</li>
                <li>Comprehensive insurance covers devices in our care</li>
                <li>Customers must provide proof of ownership when collecting devices</li>
              </ul>
            </section>

            {/* Warranties and Guarantees */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">5. Warranties and Guarantees</h2>
              
              <h3 className="text-xl font-semibold mb-4">5.1 Repair Warranty</h3>
              <div className="bg-card p-6 rounded-lg border mb-6">
                <h4 className="font-semibold mb-3">90-Day Comprehensive Warranty</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  All repairs are covered by our 90-day warranty from the date of completion.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Covers the same fault recurring</li>
                  <li>• Includes parts and labor for warranty repairs</li>
                  <li>• Does not cover new or unrelated issues</li>
                  <li>• Requires proof of original repair receipt</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold mb-4">5.2 Warranty Exclusions</h3>
              <p className="mb-4">The warranty does not cover:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Physical damage caused after repair (drops, liquid damage, etc.)</li>
                <li>Normal wear and tear</li>
                <li>Software issues not related to the original repair</li>
                <li>Damage caused by unauthorized modifications or repairs</li>
                <li>Issues caused by malware, viruses, or user error</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">5.3 Parts Warranty</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Genuine manufacturer parts carry original manufacturer warranty</li>
                <li>High-quality aftermarket parts carry our 90-day warranty</li>
                <li>Defective parts will be replaced at no charge during warranty period</li>
                <li>Labor for warranty part replacement is included</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">6. Limitation of Liability</h2>
              
              <h3 className="text-xl font-semibold mb-4">6.1 Service Limitations</h3>
              <p className="mb-4">
                While we strive for successful repairs, we cannot guarantee that all devices can be repaired or 
                that repairs will restore devices to like-new condition. Some devices may have underlying issues 
                that become apparent only after repair attempts.
              </p>

              <h3 className="text-xl font-semibold mb-4">6.2 Liability Cap</h3>
              <p className="mb-4">
                Our total liability for any claim related to our services is limited to the lesser of:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>The amount paid for the specific service giving rise to the claim</li>
                <li>The current market value of the device being repaired</li>
                <li>£1,000 maximum for any single incident</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">6.3 Excluded Damages</h3>
              <p className="mb-4">We are not liable for:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Loss of data, software, or digital content</li>
                <li>Loss of business, profits, or revenue</li>
                <li>Inconvenience or loss of use</li>
                <li>Consequential or indirect damages</li>
                <li>Third-party claims or damages</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">7. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold mb-4">7.1 Website Content</h3>
              <p className="mb-4">
                All content on our website, including text, graphics, logos, images, and software, is the property of 
                RevivaTech or our licensors and is protected by UK and international copyright laws.
              </p>

              <h3 className="text-xl font-semibold mb-4">7.2 Customer Content</h3>
              <p className="mb-4">
                Customers retain ownership of all content and data on their devices. We do not claim any ownership 
                rights to customer content and will not access it except as necessary for repair services.
              </p>

              <h3 className="text-xl font-semibold mb-4">7.3 Software and Licensing</h3>
              <p className="mb-4">
                We may install or reinstall software as part of our services. Customers are responsible for ensuring 
                they have valid licenses for all software on their devices.
              </p>
            </section>

            {/* Privacy and Confidentiality */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">8. Privacy and Confidentiality</h2>
              
              <p className="mb-4">
                We take customer privacy seriously and implement comprehensive measures to protect your information:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>All staff sign confidentiality agreements</li>
                <li>Customer information is not shared with third parties</li>
                <li>Device content is accessed only when necessary for repairs</li>
                <li>Personal data is handled according to our Privacy Policy</li>
                <li>Secure disposal procedures for replaced components</li>
              </ul>

              <p className="mb-4">
                For detailed information about how we handle your personal data, please see our 
                <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">9. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold mb-4">9.1 Customer Complaints</h3>
              <p className="mb-4">
                We are committed to resolving any issues promptly and fairly. If you have concerns about our service:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Contact us immediately at hello@revivatech.co.uk</li>
                <li>Provide details of the issue and your repair reference number</li>
                <li>We will investigate and respond within 48 hours</li>
                <li>Escalation procedures are available for unresolved issues</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">9.2 Mediation and Arbitration</h3>
              <p className="mb-4">
                For disputes that cannot be resolved through direct communication, we encourage mediation through 
                an agreed-upon neutral third party before pursuing legal action.
              </p>

              <h3 className="text-xl font-semibold mb-4">9.3 Governing Law</h3>
              <p className="mb-4">
                These terms are governed by English law, and any disputes will be subject to the exclusive 
                jurisdiction of the English courts.
              </p>
            </section>

            {/* Device Collection */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">10. Device Collection and Abandonment</h2>
              
              <h3 className="text-xl font-semibold mb-4">10.1 Collection Requirements</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Devices must be collected within 30 days of repair completion</li>
                <li>Valid photo ID and proof of ownership required for collection</li>
                <li>Outstanding balances must be paid before device release</li>
                <li>Collection appointments may be required for security</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">10.2 Abandoned Devices</h3>
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
                <h4 className="font-semibold mb-3 text-yellow-800">Important Notice</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Devices not collected within 90 days of completion notification may be considered abandoned.
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Storage fees of £5 per day apply after 30 days</li>
                  <li>• Attempts will be made to contact customer</li>
                  <li>• After 90 days, devices may be recycled or disposed of</li>
                  <li>• No compensation for abandoned devices</li>
                </ul>
              </div>
            </section>

            {/* Force Majeure */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">11. Force Majeure</h2>
              
              <p className="mb-4">
                We shall not be liable for any delay or failure to perform our obligations due to circumstances 
                beyond our reasonable control, including but not limited to:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Natural disasters, pandemics, or public health emergencies</li>
                <li>Government regulations or restrictions</li>
                <li>Labor strikes or supply chain disruptions</li>
                <li>Technical failures or cyber attacks</li>
                <li>Transportation or communication breakdowns</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">12. Termination</h2>
              
              <p className="mb-4">
                We reserve the right to refuse service or terminate our relationship with customers who:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Violate these terms of service</li>
                <li>Provide false or misleading information</li>
                <li>Engage in abusive or threatening behavior</li>
                <li>Attempt to defraud or deceive our staff</li>
                <li>Bring devices suspected of being stolen</li>
              </ul>
            </section>

            {/* Updates to Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">13. Updates to Terms</h2>
              
              <p className="mb-4">
                We may update these Terms of Service from time to time to reflect changes in our services, 
                legal requirements, or business practices. We will notify customers of material changes by:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Posting updated terms on our website with revision date</li>
                <li>Sending email notifications to registered customers</li>
                <li>Providing notice during service interactions</li>
                <li>Requesting acknowledgment of new terms when required</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">14. Contact Information</h2>
              
              <p className="mb-4">
                If you have questions about these Terms of Service or need clarification on any provisions, 
                please contact us:
              </p>
              
              <div className="bg-card p-6 rounded-lg border">
                <h4 className="font-semibold mb-4">RevivaTech Customer Service</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> hello@revivatech.co.uk</p>
                  <p><strong>Phone:</strong> 020 7123 4567</p>
                  <p><strong>Address:</strong><br/>
                    RevivaTech<br/>
                    8 GodsHill Close<br/>
                    Bournemouth, BH8 0EJ<br/>
                    United Kingdom
                  </p>
                  <p><strong>Business Hours:</strong><br/>
                    Monday - Friday: 9:00 AM - 6:00 PM<br/>
                    Saturday: 10:00 AM - 4:00 PM<br/>
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">15. Acknowledgment</h2>
              
              <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg">
                <p className="text-sm">
                  <strong>By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
                </p>
                <p className="text-sm mt-3">
                  These terms constitute the entire agreement between you and RevivaTech regarding our services and supersede 
                  any previous agreements or understandings, whether written or oral.
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
                href="/privacy" 
                className="px-6 py-3 bg-card border rounded-lg hover:shadow-lg transition-shadow font-semibold"
              >
                Privacy Policy
              </a>
              <a 
                href="/contact" 
                className="px-6 py-3 bg-card border rounded-lg hover:shadow-lg transition-shadow font-semibold"
              >
                Contact Us
              </a>
              <a 
                href="/booking-demo" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Book Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}