import React from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import { PriceEstimate, RepairType } from '@/../config/pricing/pricing.engine';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CustomerInfo, AppointmentPreferences } from './CustomerInfoStep';

export interface ConfirmationStepProps {
  device: DeviceModel;
  selectedIssues: string[];
  problemDescription: string;
  photos: File[];
  repairEstimates: Array<{
    repair: RepairType;
    estimate: PriceEstimate;
  }>;
  customerInfo: CustomerInfo;
  appointmentPreferences: AppointmentPreferences;
  urgency: 'standard' | 'priority' | 'emergency';
  serviceOptions: {
    express: boolean;
    premiumParts: boolean;
    dataRecovery: boolean;
    warranty: 'standard' | 'extended' | 'premium';
    pickupDelivery: boolean;
  };
  onConfirm: () => void;
  onEdit: (step: string) => void;
  className?: string;
}

const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Not specified';
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const urgencyLabels = {
  standard: 'Standard Service (5-7 days)',
  priority: 'Priority Service (2-3 days)',
  emergency: 'Emergency Service (Same day)',
};

const serviceTypeLabels = {
  postal: 'Postal Service (FREE)',
  pickup: 'Pickup & Delivery (+£25)',
  'in-store': 'In-Store Service (FREE)',
};

const warrantyLabels = {
  standard: 'Standard Warranty',
  extended: 'Extended Warranty (+£30)',
  premium: 'Premium Warranty (+£60)',
};

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  device,
  selectedIssues,
  problemDescription,
  photos,
  repairEstimates,
  customerInfo,
  appointmentPreferences,
  urgency,
  serviceOptions,
  onConfirm,
  onEdit,
  className,
}) => {
  const totalCost = repairEstimates.reduce((sum, est) => sum + est.estimate.total, 0);
  const maxWarranty = Math.max(...repairEstimates.map(est => est.estimate.warranty), 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
        <p className="text-muted-foreground">
          Please review all details before confirming your repair booking
        </p>
      </div>

      {/* Device & Problem Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Device & Problem</h3>
          <Button variant="ghost" size="sm" onClick={() => onEdit('device-selection')}>
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          {/* Device info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
              📱
            </div>
            <div>
              <h4 className="font-semibold text-lg">{device.name}</h4>
              <p className="text-muted-foreground">
                {device.brand} • {device.year} • Avg. repair cost: £{device.averageRepairCost}
              </p>
            </div>
          </div>

          {/* Selected issues */}
          <div>
            <h5 className="font-medium mb-2">Selected Issues:</h5>
            <div className="flex flex-wrap gap-2">
              {selectedIssues.map((issue, index) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {issue}
                </span>
              ))}
            </div>
          </div>

          {/* Problem description */}
          <div>
            <h5 className="font-medium mb-2">Description:</h5>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {problemDescription}
            </p>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Uploaded Photos:</h5>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>📸</span>
                <span>{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</span>
              </div>
            </div>
          )}

          {/* Service urgency */}
          <div>
            <h5 className="font-medium mb-2">Service Urgency:</h5>
            <span className="text-sm bg-muted/50 px-3 py-1 rounded-full">
              {urgencyLabels[urgency]}
            </span>
          </div>
        </div>
      </Card>

      {/* Repair Services & Pricing */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Repair Services & Pricing</h3>
          <Button variant="ghost" size="sm" onClick={() => onEdit('pricing-review')}>
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          {/* Individual repairs */}
          {repairEstimates.map((est, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{est.repair.name}</h4>
                  <p className="text-sm text-muted-foreground">{est.repair.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">{formatCurrency(est.estimate.total)}</div>
                  <div className="text-sm text-muted-foreground">{est.estimate.estimatedTime}</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t">
                <div>Labor: {formatCurrency(est.estimate.laborCost)}</div>
                <div>Parts: {formatCurrency(est.estimate.partsCost)}</div>
              </div>

              {/* Options applied */}
              {est.estimate.options.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Options: </span>
                  {est.estimate.options.map((opt, i) => (
                    <span key={i} className="text-muted-foreground">
                      {opt.name} (+{formatCurrency(opt.cost)})
                      {i < est.estimate.options.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Service options */}
          <div className="space-y-2">
            <h5 className="font-medium">Service Options:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {serviceOptions.express && (
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Express Service (+50%)</span>
                </div>
              )}
              {serviceOptions.premiumParts && (
                <div className="flex items-center gap-2">
                  <span>⭐</span>
                  <span>Premium Parts (+25%)</span>
                </div>
              )}
              {serviceOptions.dataRecovery && (
                <div className="flex items-center gap-2">
                  <span>💾</span>
                  <span>Data Recovery (+£80)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <span>{warrantyLabels[serviceOptions.warranty]}</span>
              </div>
              {serviceOptions.pickupDelivery && (
                <div className="flex items-center gap-2">
                  <span>🚗</span>
                  <span>Pickup & Delivery (+£25)</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Cost:</span>
              <span className="text-primary">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
              <span>Warranty Period:</span>
              <span>{maxWarranty} days</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Contact & Service Details</h3>
          <Button variant="ghost" size="sm" onClick={() => onEdit('customer-info')}>
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact info */}
          <div>
            <h4 className="font-medium mb-3">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span>{' '}
                {customerInfo.firstName} {customerInfo.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span>{' '}
                {customerInfo.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span>{' '}
                {customerInfo.phone}
              </div>
              <div>
                <span className="font-medium">Preferred Contact:</span>{' '}
                <span className="capitalize">{customerInfo.preferredContact}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="font-medium mb-3">Address</h4>
            <div className="text-sm text-muted-foreground">
              <div>{customerInfo.address.street}</div>
              <div>{customerInfo.address.city}</div>
              <div>{customerInfo.address.postcode}</div>
              <div>{customerInfo.address.country}</div>
            </div>
          </div>
        </div>

        {/* Service type */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Service Type</h4>
              <div className="text-sm">
                {serviceTypeLabels[appointmentPreferences.serviceType]}
              </div>
            </div>

            {/* Appointment details */}
            {(appointmentPreferences.preferredDate || appointmentPreferences.preferredTime) && (
              <div>
                <h4 className="font-medium mb-3">Appointment</h4>
                <div className="space-y-1 text-sm">
                  {appointmentPreferences.preferredDate && (
                    <div>
                      <span className="font-medium">Date:</span>{' '}
                      {formatDate(appointmentPreferences.preferredDate)}
                    </div>
                  )}
                  {appointmentPreferences.preferredTime && (
                    <div>
                      <span className="font-medium">Time:</span>{' '}
                      {appointmentPreferences.preferredTime}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional notes */}
          {appointmentPreferences.notes && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Additional Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {appointmentPreferences.notes}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">✓</span>
            <span>
              <strong>Free Diagnosis:</strong> We'll provide a free diagnostic assessment 
              if you proceed with our recommended repairs.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">✓</span>
            <span>
              <strong>Warranty:</strong> All repairs come with a {maxWarranty}-day warranty 
              covering parts and labor.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">✓</span>
            <span>
              <strong>Data Protection:</strong> Your device and personal data are handled 
              with the highest security standards.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">✓</span>
            <span>
              <strong>No-Fix, No-Fee:</strong> If we can't fix your device, you don't pay 
              for the repair attempt.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">✓</span>
            <span>
              <strong>Transparent Pricing:</strong> The prices shown are final with no 
              hidden fees or charges.
            </span>
          </div>
        </div>
      </Card>

      {/* Final confirmation */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold">Ready to Book Your Repair?</h3>
          <p className="text-muted-foreground">
            By confirming this booking, you agree to our terms and conditions. 
            We'll send you a confirmation email with next steps.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div className="w-px h-12 bg-border"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{maxWarranty}</div>
              <div className="text-sm text-muted-foreground">Days Warranty</div>
            </div>
            <div className="w-px h-12 bg-border"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {repairEstimates.length > 0 ? repairEstimates[0].estimate.estimatedTime : 'TBD'}
              </div>
              <div className="text-sm text-muted-foreground">Completion Time</div>
            </div>
          </div>

          <Button onClick={onConfirm} size="lg" className="w-full text-lg py-6">
            Confirm Booking - {formatCurrency(totalCost)}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationStep;