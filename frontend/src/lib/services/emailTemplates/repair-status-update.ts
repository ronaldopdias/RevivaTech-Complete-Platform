import { baseLayout } from './base-layout';

export interface RepairStatusUpdateData {
  customerName: string;
  bookingReference: string;
  device: {
    brand: string;
    model: string;
  };
  previousStatus: string;
  newStatus: string;
  statusMessage: string;
  timeline?: Array<{
    status: string;
    date: string;
    completed: boolean;
  }>;
  estimatedCompletion?: string;
  actionRequired?: {
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
  };
}

const statusColors: Record<string, string> = {
  'received': '#007AFF',
  'diagnosing': '#FF9500',
  'in-repair': '#FF9500',
  'testing': '#FF9500',
  'completed': '#34C759',
  'ready-for-collection': '#34C759',
  'delivered': '#34C759',
  'on-hold': '#FF3B30',
  'cancelled': '#8E8E93'
};

const statusEmojis: Record<string, string> = {
  'received': '📦',
  'diagnosing': '🔍',
  'in-repair': '🔧',
  'testing': '🧪',
  'completed': '✅',
  'ready-for-collection': '📍',
  'delivered': '🚚',
  'on-hold': '⏸️',
  'cancelled': '❌'
};

export const render = (data: RepairStatusUpdateData): string => {
  const statusColor = statusColors[data.newStatus] || '#007AFF';
  const statusEmoji = statusEmojis[data.newStatus] || '📱';
  
  const content = `
    <h2>Repair Status Update ${statusEmoji}</h2>
    <p>Hi ${data.customerName},</p>
    <p>We have an update on your ${data.device.brand} ${data.device.model} repair.</p>
    
    <div class="info-box" style="border-left: 4px solid ${statusColor};">
        <h3 style="color: ${statusColor};">Status: ${data.newStatus.replace(/-/g, ' ').toUpperCase()}</h3>
        <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
        <p>${data.statusMessage}</p>
        ${data.estimatedCompletion ? `
            <p><strong>Estimated Completion:</strong> ${data.estimatedCompletion}</p>
        ` : ''}
    </div>
    
    ${data.timeline ? `
    <h3>Repair Progress</h3>
    <div style="margin: 20px 0;">
        ${data.timeline.map((step, index) => `
            <div style="display: flex; align-items: center; margin: 10px 0;">
                <div style="
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background-color: ${step.completed ? '#34C759' : '#E5E5EA'};
                    margin-right: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                ">
                    ${step.completed ? '✓' : index + 1}
                </div>
                <div style="flex: 1;">
                    <p style="margin: 0; font-weight: ${step.completed ? '600' : '400'};">
                        ${step.status}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #8E8E93;">
                        ${step.date}
                    </p>
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${data.actionRequired ? `
    <div class="info-box" style="background-color: #FFF3CD; border-color: #FF9500;">
        <h3 style="color: #FF9500;">Action Required</h3>
        <p><strong>${data.actionRequired.title}</strong></p>
        <p>${data.actionRequired.description}</p>
        <div style="text-align: center; margin-top: 20px;">
            <a href="${data.actionRequired.buttonUrl}" class="button" style="background-color: #FF9500;">
                ${data.actionRequired.buttonText}
            </a>
        </div>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://revivatech.co.uk/track?ref=${data.bookingReference}" class="button">
            View Full Details
        </a>
    </div>
    
    <p style="margin-top: 30px;">
        Have questions about your repair? Contact us at support@revivatech.co.uk or call us at +44 123 456 789.
    </p>
  `;
  
  return baseLayout(content);
};