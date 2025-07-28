import { baseLayout } from './base-layout';

export interface InvoiceData {
  customerName: string;
  customerEmail: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  bookingReference: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount?: {
    description: string;
    amount: number;
  };
  total: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  notes?: string;
}

export const render = (data: InvoiceData): string => {
  const statusColors = {
    paid: '#34C759',
    pending: '#FF9500',
    overdue: '#FF3B30'
  };
  
  const statusText = {
    paid: 'PAID',
    pending: 'PAYMENT PENDING',
    overdue: 'OVERDUE'
  };
  
  const content = `
    <h2>Invoice #${data.invoiceNumber}</h2>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
            <p style="margin: 5px 0;"><strong>${data.customerName}</strong></p>
            <p style="margin: 5px 0; color: #4A4A4A;">${data.customerEmail}</p>
            ${data.customerAddress ? `
                <p style="margin: 5px 0; color: #4A4A4A;">${data.customerAddress.line1}</p>
                ${data.customerAddress.line2 ? `<p style="margin: 5px 0; color: #4A4A4A;">${data.customerAddress.line2}</p>` : ''}
                <p style="margin: 5px 0; color: #4A4A4A;">${data.customerAddress.city}, ${data.customerAddress.postcode}</p>
                <p style="margin: 5px 0; color: #4A4A4A;">${data.customerAddress.country}</p>
            ` : ''}
        </div>
        <div style="text-align: right;">
            <p style="margin: 5px 0; color: #4A4A4A;">Invoice Date: ${data.invoiceDate}</p>
            ${data.dueDate ? `<p style="margin: 5px 0; color: #4A4A4A;">Due Date: ${data.dueDate}</p>` : ''}
            <p style="margin: 5px 0; color: #4A4A4A;">Booking Ref: ${data.bookingReference}</p>
            <p style="
                margin: 15px 0 5px 0;
                padding: 8px 16px;
                background-color: ${statusColors[data.paymentStatus]};
                color: white;
                display: inline-block;
                border-radius: 4px;
                font-weight: 600;
            ">
                ${statusText[data.paymentStatus]}
            </p>
        </div>
    </div>
    
    <table class="data-table">
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">£${item.unitPrice.toFixed(2)}</td>
                    <td style="text-align: right;">£${item.total.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div style="margin-top: 30px; text-align: right;">
        <table style="width: 300px; margin-left: auto;">
            <tr>
                <td style="padding: 8px 0;">Subtotal:</td>
                <td style="text-align: right; padding: 8px 0;">£${data.subtotal.toFixed(2)}</td>
            </tr>
            ${data.discount ? `
                <tr>
                    <td style="padding: 8px 0;">${data.discount.description}:</td>
                    <td style="text-align: right; padding: 8px 0; color: #34C759;">-£${data.discount.amount.toFixed(2)}</td>
                </tr>
            ` : ''}
            <tr>
                <td style="padding: 8px 0;">VAT (${data.taxRate}%):</td>
                <td style="text-align: right; padding: 8px 0;">£${data.tax.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #E5E5EA;">
                <td style="padding: 12px 0; font-weight: 600; font-size: 18px;">Total:</td>
                <td style="text-align: right; padding: 12px 0; font-weight: 600; font-size: 18px;">
                    £${data.total.toFixed(2)}
                </td>
            </tr>
        </table>
    </div>
    
    ${data.notes ? `
        <div class="info-box" style="margin-top: 30px;">
            <h3>Notes</h3>
            <p>${data.notes}</p>
        </div>
    ` : ''}
    
    ${data.paymentStatus === 'pending' ? `
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://revivatech.co.uk/pay/${data.invoiceNumber}" class="button">
                Pay Now
            </a>
        </div>
    ` : ''}
    
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #E5E5EA;">
        <p style="font-size: 14px; color: #8E8E93;">
            <strong>RevivaTech Ltd</strong><br>
            8 GodsHill Close, Bournemouth, BH8 0EJ<br>
            VAT Registration: GB123456789<br>
            Company Registration: 12345678
        </p>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #8E8E93;">
        ${data.paymentStatus === 'paid' 
            ? `Thank you for your payment${data.paymentMethod ? ` via ${data.paymentMethod}` : ''}.` 
            : 'Please ensure payment is made by the due date to avoid any service delays.'
        }
        For billing inquiries, contact billing@revivatech.co.uk
    </p>
  `;
  
  const footerContent = `
    <p>
        <a href="https://revivatech.co.uk/invoice/${data.invoiceNumber}/download" style="color: #007AFF;">
            Download PDF Invoice
        </a> | 
        <a href="https://revivatech.co.uk/account/invoices" style="color: #007AFF;">
            View All Invoices
        </a>
    </p>
    <p style="margin-top: 20px; font-size: 12px; color: #C7C7CC;">
        This invoice was generated electronically and is valid without signature.
    </p>
  `;
  
  return baseLayout(content, footerContent);
};