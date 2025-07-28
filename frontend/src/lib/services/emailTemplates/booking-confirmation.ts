import { baseLayout } from './base-layout';

export interface BookingConfirmationData {
  customerName: string;
  bookingReference: string;
  device: {
    brand: string;
    model: string;
    issues: string[];
  };
  service: {
    type: string;
    urgency: string;
    estimatedCost: number;
    estimatedDays: number;
  };
  appointment?: {
    date: string;
    time: string;
    type: string;
  };
  nextSteps: string[];
}

export const render = (data: BookingConfirmationData): string => {
  const content = `
    <h2>Booking Confirmed! 🎉</h2>
    <p>Hi ${data.customerName},</p>
    <p>Thank you for choosing RevivaTech for your repair needs. We've successfully received your booking and our team will take great care of your device.</p>
    
    <div class="info-box">
        <h3>Booking Reference: ${data.bookingReference}</h3>
        <p><strong>Device:</strong> ${data.device.brand} ${data.device.model}</p>
        <p><strong>Issues:</strong> ${data.device.issues.join(', ')}</p>
        <p><strong>Service Type:</strong> ${data.service.type}</p>
        <p><strong>Priority:</strong> ${data.service.urgency}</p>
        <p><strong>Estimated Cost:</strong> £${data.service.estimatedCost.toFixed(2)}</p>
        <p><strong>Estimated Time:</strong> ${data.service.estimatedDays} business days</p>
    </div>
    
    ${data.appointment ? `
    <div class="info-box">
        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> ${data.appointment.date}</p>
        <p><strong>Time:</strong> ${data.appointment.time}</p>
        <p><strong>Type:</strong> ${data.appointment.type}</p>
    </div>
    ` : ''}
    
    <h3>What Happens Next?</h3>
    <ul style="color: #4A4A4A; line-height: 24px;">
        ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://revivatech.co.uk/track?ref=${data.bookingReference}" class="button">
            Track Your Repair
        </a>
    </div>
    
    <p style="margin-top: 30px;">
        <strong>Need to make changes?</strong><br>
        You can manage your booking online or contact us at support@revivatech.co.uk
    </p>
  `;
  
  return baseLayout(content);
};