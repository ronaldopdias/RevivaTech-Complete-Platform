import { baseLayout } from './base-layout';

export interface PaymentConfirmationData {
  customerName: string;
  invoiceNumber: string;
  paymentMethod: string;
  paymentDate: string;
  amount: number;
  bookingReference: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  cardLast4?: string;
  paypalEmail?: string;
}

export const render = (data: PaymentConfirmationData): string => {
  const content = `
    <h2>Payment Received ✅</h2>
    <p>Hi ${data.customerName},</p>
    <p>We've successfully received your payment. Thank you for your business!</p>
    
    <div class="info-box">
        <h3>Payment Details</h3>
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
        <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod}
            ${data.cardLast4 ? ` ending in ${data.cardLast4}` : ''}
            ${data.paypalEmail ? ` (${data.paypalEmail})` : ''}
        </p>
        <p><strong>Total Amount:</strong> £${data.amount.toFixed(2)}</p>
    </div>
    
    <h3>Payment Breakdown</h3>
    <table class="data-table">
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">£${item.amount.toFixed(2)}</td>
                </tr>
            `).join('')}
            <tr>
                <td style="font-weight: 600; padding-top: 20px;">Total</td>
                <td style="font-weight: 600; text-align: right; padding-top: 20px;">
                    £${data.amount.toFixed(2)}
                </td>
            </tr>
        </tbody>
    </table>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://revivatech.co.uk/invoice/${data.invoiceNumber}" class="button">
            Download Invoice
        </a>
        <a href="https://revivatech.co.uk/track?ref=${data.bookingReference}" class="button button-secondary" style="margin-left: 10px;">
            Track Repair
        </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #8E8E93;">
        This receipt is for your records. A copy has been saved to your account.
        If you have any questions about this payment, please contact us at billing@revivatech.co.uk
    </p>
  `;
  
  return baseLayout(content);
};