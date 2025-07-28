// Service Bundling Logic for Laptop Repair Services
// Analyzes selected services and suggests complementary ones

import { LaptopRepairService, ALL_LAPTOP_SERVICES } from './laptop-repair-services';

export interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  services: string[]; // Array of service IDs
  commonUseCase: string;
  savings: number; // Potential time/cost savings
  priority: 'high' | 'medium' | 'low';
}

export interface BundleSuggestion {
  bundle: ServiceBundle;
  relevantServices: string[]; // Services already selected that trigger this suggestion
  missingServices: string[]; // Services not yet selected
  confidence: number; // 0-100, how confident the suggestion is
  reasoning: string;
}

// Predefined service bundles based on common repair scenarios
export const SERVICE_BUNDLES: ServiceBundle[] = [
  {
    id: 'performance-boost',
    name: 'Complete Performance Boost',
    description: 'Hardware upgrade + software optimization for maximum performance',
    services: ['a11', 'a1', 'a3', 'b8'], // Hardware Upgrades + Virus Removal + OS Reinstall + Full Clean
    commonUseCase: 'Slow laptop needing comprehensive performance improvement',
    savings: 15, // % savings in terms of combined efficiency
    priority: 'high'
  },
  {
    id: 'liquid-damage-recovery',
    name: 'Liquid Damage Complete Recovery',
    description: 'Full liquid damage assessment and component recovery',
    services: ['c5', 'c1', 'c6', 'b8'], // Liquid Spillage + Motherboard + USB Ports + Full Clean
    commonUseCase: 'Laptop with liquid spillage requiring comprehensive repair',
    savings: 20,
    priority: 'high'
  },
  {
    id: 'connectivity-fix',
    name: 'Complete Connectivity Solution',
    description: 'Fix all network and port connectivity issues',
    services: ['a2', 'c6', 'a7'], // Internet Issues + USB Ports + Webcam
    commonUseCase: 'Multiple connectivity problems affecting productivity',
    savings: 10,
    priority: 'medium'
  },
  {
    id: 'display-complete',
    name: 'Complete Display Repair',
    description: 'Screen replacement with hinge and display issue fixes',
    services: ['a10', 'b7', 'c9'], // Screen Repair + Hinge Repair + Display Issues
    commonUseCase: 'Comprehensive display problems including physical damage',
    savings: 15,
    priority: 'high'
  },
  {
    id: 'power-system-overhaul',
    name: 'Power System Overhaul',
    description: 'Complete power and charging system repair',
    services: ['c10', 'c8', 'a12'], // Power Issues + DC Jack + Battery Replacement
    commonUseCase: 'Multiple power-related problems affecting laptop usability',
    savings: 18,
    priority: 'high'
  },
  {
    id: 'startup-recovery',
    name: 'Complete Startup Recovery',
    description: 'Fix boot issues with system optimization',
    services: ['b5', 'b6', 'a3', 'a6'], // Startup Issues + BSOD + OS Reinstall + HDD Replacement
    commonUseCase: 'Laptop with severe startup and boot problems',
    savings: 12,
    priority: 'medium'
  },
  {
    id: 'maintenance-package',
    name: 'Preventive Maintenance Package',
    description: 'Keep your laptop running optimally',
    services: ['b8', 'a1', 'a4', 'a11'], // Full Clean + Virus Removal + Data Backup + Hardware Upgrades
    commonUseCase: 'Regular maintenance to prevent future issues',
    savings: 10,
    priority: 'medium'
  },
  {
    id: 'business-essential',
    name: 'Business Critical Recovery',
    description: 'Fast turnaround for business laptops',
    services: ['a4', 'a3', 'a1', 'a2'], // Data Backup + OS Reinstall + Virus Removal + Internet Issues
    commonUseCase: 'Business laptop needing quick restoration with data protection',
    savings: 8,
    priority: 'low'
  }
];

// Service relationships - which services commonly go together
export const SERVICE_RELATIONSHIPS: Record<string, string[]> = {
  // Hardware issues often need cleaning
  'a11': ['b8'], // Hardware Upgrades + Full Clean
  'a6': ['a3', 'a4'], // HDD Replacement + OS Reinstall + Data Backup
  'a12': ['c10', 'c8'], // Battery + Power Issues + DC Jack
  
  // Display issues
  'a10': ['b7', 'c9'], // Screen + Hinge + Display Issues
  'b7': ['c11'], // Single Hinge + Multiple Hinges (escalation)
  
  // Power system
  'c10': ['c8', 'a12'], // Power Issues + DC Jack + Battery
  'c8': ['c10'], // DC Jack + Power Issues
  
  // Liquid damage
  'c5': ['c1', 'c6', 'b8'], // Liquid + Motherboard + USB Ports + Clean
  
  // Connectivity
  'a2': ['c6', 'a7'], // Internet + USB Ports + Webcam
  'c6': ['a2'], // USB Ports + Internet Issues
  
  // Software issues
  'a1': ['a3', 'b8'], // Virus + OS Reinstall + Full Clean
  'a3': ['a1', 'a4'], // OS Reinstall + Virus + Data Backup
  'b5': ['b6', 'a3'], // Startup + BSOD + OS Reinstall
  'b6': ['b5', 'a6'], // BSOD + Startup + HDD Replacement
  
  // Motherboard issues
  'c1': ['c5', 'c10'], // Motherboard + Liquid Damage + Power Issues
  
  // Physical damage
  'c3': ['c1', 'c11', 'c9'], // Dropped/Smashed + Motherboard + Multiple Hinges + Display
};

/**
 * Analyzes selected services and generates intelligent bundle suggestions
 */
export function generateBundleSuggestions(
  selectedServiceIds: string[],
  selectedBand: 'A' | 'B' | 'C' | null
): BundleSuggestion[] {
  if (selectedServiceIds.length === 0) {
    return [];
  }

  const suggestions: BundleSuggestion[] = [];

  // Check each predefined bundle
  for (const bundle of SERVICE_BUNDLES) {
    const relevantServices = bundle.services.filter(serviceId => 
      selectedServiceIds.includes(serviceId)
    );
    
    if (relevantServices.length === 0) continue;

    const missingServices = bundle.services.filter(serviceId => 
      !selectedServiceIds.includes(serviceId)
    );

    if (missingServices.length === 0) continue; // Already have all services

    // Calculate confidence based on how many services are already selected
    const confidence = Math.round((relevantServices.length / bundle.services.length) * 100);
    
    // Only suggest if we have at least 25% of the bundle services
    if (confidence < 25) continue;

    // Filter missing services by band if specified
    const filteredMissingServices = selectedBand 
      ? missingServices.filter(serviceId => {
          const service = ALL_LAPTOP_SERVICES.find(s => s.id === serviceId);
          return service?.band === selectedBand;
        })
      : missingServices;

    if (filteredMissingServices.length === 0) continue;

    suggestions.push({
      bundle,
      relevantServices,
      missingServices: filteredMissingServices,
      confidence,
      reasoning: generateReasoning(bundle, relevantServices, filteredMissingServices)
    });
  }

  // Also check for individual service relationships
  for (const selectedId of selectedServiceIds) {
    const relatedServices = SERVICE_RELATIONSHIPS[selectedId] || [];
    
    for (const relatedId of relatedServices) {
      if (selectedServiceIds.includes(relatedId)) continue; // Already selected
      
      const relatedService = ALL_LAPTOP_SERVICES.find(s => s.id === relatedId);
      if (!relatedService) continue;
      
      // Filter by band if specified
      if (selectedBand && relatedService.band !== selectedBand) continue;

      // Create individual suggestion
      const selectedService = ALL_LAPTOP_SERVICES.find(s => s.id === selectedId);
      if (!selectedService) continue;

      suggestions.push({
        bundle: {
          id: `individual-${selectedId}-${relatedId}`,
          name: `${selectedService.name} + ${relatedService.name}`,
          description: `Commonly paired services for comprehensive repair`,
          services: [selectedId, relatedId],
          commonUseCase: `Often combined to address related issues`,
          savings: 5,
          priority: 'low' as const
        },
        relevantServices: [selectedId],
        missingServices: [relatedId],
        confidence: 75,
        reasoning: `${relatedService.name} is commonly needed when addressing ${selectedService.name}`
      });
    }
  }

  // Sort by confidence and priority
  return suggestions
    .sort((a, b) => {
      // First by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.bundle.priority] - priorityOrder[a.bundle.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by confidence
      return b.confidence - a.confidence;
    })
    .slice(0, 3); // Limit to top 3 suggestions
}

/**
 * Generates human-readable reasoning for bundle suggestions
 */
function generateReasoning(
  bundle: ServiceBundle,
  relevantServices: string[],
  missingServices: string[]
): string {
  const relevantServiceNames = relevantServices
    .map(id => ALL_LAPTOP_SERVICES.find(s => s.id === id)?.name)
    .filter(Boolean);
  
  const missingServiceNames = missingServices
    .map(id => ALL_LAPTOP_SERVICES.find(s => s.id === id)?.name)
    .filter(Boolean);

  if (relevantServices.length === 1) {
    return `Since you selected "${relevantServiceNames[0]}", you might also need "${missingServiceNames.join('" and "')}" for a complete solution.`;
  } else {
    return `Your selected services (${relevantServiceNames.join(', ')}) are part of our "${bundle.name}" package. Adding ${missingServiceNames.length > 1 ? 'these services' : 'this service'} would provide a comprehensive solution.`;
  }
}

/**
 * Calculates potential cost savings for a bundle
 */
export function calculateBundleSavings(bundleServices: string[]): number {
  const services = bundleServices
    .map(id => ALL_LAPTOP_SERVICES.find(s => s.id === id))
    .filter(Boolean) as LaptopRepairService[];
  
  const totalCost = services.reduce((sum, service) => sum + service.basePrice, 0);
  
  // Simplified savings calculation - could be more sophisticated
  if (services.length >= 4) return totalCost * 0.15; // 15% savings for 4+ services
  if (services.length >= 3) return totalCost * 0.10; // 10% savings for 3+ services
  if (services.length >= 2) return totalCost * 0.05; // 5% savings for 2+ services
  
  return 0;
}

/**
 * Gets service information by ID
 */
export function getServiceInfo(serviceId: string): LaptopRepairService | undefined {
  return ALL_LAPTOP_SERVICES.find(service => service.id === serviceId);
}