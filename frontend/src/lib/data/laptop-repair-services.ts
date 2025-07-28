// Laptop Repair Services Data Structure
// Three-tier pricing system: Band A (£49), Band B (£69), Band C (£89)

export interface LaptopRepairService {
  id: string;
  name: string;
  description: string;
  category: string;
  band: 'A' | 'B' | 'C';
  basePrice: number;
  includes: string[];
  excludes?: string[];
  estimatedTime: string;
  difficulty: 'Low' | 'Medium' | 'High' | 'Expert';
  commonIssues: string[];
  additionalNotes?: string;
  specialPricing?: {
    description: string;
    additionalCost: number;
  };
  warranty: string;
}

export interface ServiceBand {
  id: 'A' | 'B' | 'C';
  name: string;
  price: number;
  description: string;
  color: string;
  gradient: string;
  features: string[];
  serviceCount: number;
}

export interface LaptopRepairPricing {
  fixedLabourFee: boolean;
  noUpfrontPayment: boolean;
  guaranteePeriod: string;
  warranty: string;
  discounts: {
    student: number; // 15%
    blueLightCard: number; // 15%
  };
  supportedBrands: string[];
}

// Supported laptop brands
export const SUPPORTED_BRANDS = [
  'Lenovo', 'Samsung', 'HP', 'Dell', 'Microsoft Surface', 
  'Acer', 'ASUS', 'MSI', 'Alienware', 'Dynabook', 
  'Toshiba', 'PCSpecialist', 'Huawei', 'Razer'
];

// Service pricing and policies
export const LAPTOP_REPAIR_PRICING: LaptopRepairPricing = {
  fixedLabourFee: true,
  noUpfrontPayment: true,
  guaranteePeriod: '1 year',
  warranty: '90 days',
  discounts: {
    student: 15,
    blueLightCard: 15,
  },
  supportedBrands: SUPPORTED_BRANDS,
};

// Service bands configuration
export const SERVICE_BANDS: ServiceBand[] = [
  {
    id: 'A',
    name: 'Band A - Basic Repairs',
    price: 49,
    description: 'Software issues, basic hardware fixes, and performance optimization',
    color: 'trust',
    gradient: 'from-trust-100 to-trust-200',
    features: [
      'Windows & Software Issues',
      'Basic Hardware Fixes', 
      'Performance Optimization',
      'Data Recovery & Transfer'
    ],
    serviceCount: 12
  },
  {
    id: 'B', 
    name: 'Band B - Intermediate Repairs',
    price: 69,
    description: 'Hardware diagnostics, component replacement, and system cleaning',
    color: 'professional',
    gradient: 'from-professional-100 to-professional-200',
    features: [
      'Hardware Diagnostics',
      'Component Replacement',
      'Internal Cleaning & Service',
      'Graphics & Display Issues'
    ],
    serviceCount: 8
  },
  {
    id: 'C',
    name: 'Band C - Complex Repairs',
    price: 89,
    description: 'Motherboard repair, physical damage, and advanced diagnostics',
    color: 'neutral',
    gradient: 'from-neutral-100 to-neutral-200',
    features: [
      'Motherboard Repair',
      'Physical Damage Repair',
      'Port & Connector Fixes',
      'Advanced Diagnostics'
    ],
    serviceCount: 11
  }
];

// Band A Services (£49)
export const BAND_A_SERVICES: LaptopRepairService[] = [
  {
    id: 'a1',
    name: 'Virus Removal',
    description: 'Complete virus and malware removal with system optimization',
    category: 'Windows & Software Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Full system scan', 'Malware removal', 'System optimization', 'Security recommendations'],
    estimatedTime: '2-4 hours',
    difficulty: 'Low',
    commonIssues: ['Slow performance', 'Pop-up ads', 'Suspicious activity', 'Browser redirects'],
    warranty: '90 days'
  },
  {
    id: 'a2',
    name: 'Internet & Connectivity Issues',
    description: 'Fix wireless, ethernet, and internet connectivity problems',
    category: 'Windows & Software Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Network diagnostics', 'Driver updates', 'Connection setup', 'WiFi configuration'],
    estimatedTime: '1-2 hours',
    difficulty: 'Low',
    commonIssues: ['No internet access', 'WiFi not working', 'Slow connection', 'Can\'t connect to networks'],
    warranty: '90 days'
  },
  {
    id: 'a3',
    name: 'Windows OS Reinstallation',
    description: 'Fresh Windows installation with driver setup and basic software',
    category: 'Windows & Software Issues', 
    band: 'A',
    basePrice: 49,
    includes: ['OS installation', 'Driver installation', 'Windows updates', 'Basic software setup'],
    excludes: ['Data recovery (additional cost)', 'Software licenses'],
    estimatedTime: '3-5 hours',
    difficulty: 'Medium',
    commonIssues: ['Corrupted Windows', 'Boot failures', 'System crashes', 'Performance issues'],
    warranty: '90 days'
  },
  {
    id: 'a4',
    name: 'Data Backup & Transfer',
    description: 'Move files and folders to new device or storage location',
    category: 'Windows & Software Issues',
    band: 'A',
    basePrice: 49,
    includes: ['File backup', 'Data transfer', 'Folder organization', 'Transfer verification'],
    excludes: ['Program data migration (£99)', 'Email migration (£99)'],
    estimatedTime: '2-6 hours',
    difficulty: 'Low',
    commonIssues: ['Need to transfer files', 'Backup before repair', 'New computer setup'],
    additionalNotes: 'Moving files only. Program data such as Outlook requires separate service (£99)',
    warranty: '90 days'
  },
  {
    id: 'a5',
    name: 'Password Removal & Recovery',
    description: 'Remove or reset Windows login passwords and user accounts',
    category: 'Windows & Software Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Password removal', 'Account recovery', 'User account setup', 'Security recommendations'],
    estimatedTime: '30-60 minutes',
    difficulty: 'Low',
    commonIssues: ['Forgotten password', 'Locked out of computer', 'Account issues'],
    warranty: '90 days'
  },
  {
    id: 'a6',
    name: 'Hard Drive Replacement',
    description: 'Replace faulty hard drive with Windows installation and setup',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['HDD/SSD installation', 'Windows installation', 'Driver setup', 'Basic configuration'],
    excludes: ['Hard drive cost', 'Data recovery from old drive'],
    estimatedTime: '3-5 hours',
    difficulty: 'Medium',
    commonIssues: ['Hard drive failure', 'Slow boot times', 'Blue screen errors', 'Clicking noises'],
    warranty: '90 days'
  },
  {
    id: 'a7',
    name: 'Webcam Not Working',
    description: 'Fix built-in or external webcam functionality issues',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Driver diagnostics', 'Software troubleshooting', 'Privacy settings check', 'Camera testing'],
    estimatedTime: '1-2 hours',
    difficulty: 'Low',
    commonIssues: ['Camera not detected', 'Black screen', 'Poor image quality', 'Privacy blocked'],
    warranty: '90 days'
  },
  {
    id: 'a8',
    name: 'Sound & Speaker Issues',
    description: 'Repair audio problems and speaker functionality',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Audio driver update', 'Sound troubleshooting', 'Speaker testing', 'Audio settings optimization'],
    estimatedTime: '1-2 hours',
    difficulty: 'Low',
    commonIssues: ['No sound', 'Crackling audio', 'One speaker not working', 'Microphone issues'],
    warranty: '90 days'
  },
  {
    id: 'a9',
    name: 'Touchpad & Button Repair',
    description: 'Fix touchpad responsiveness and button functionality',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Touchpad calibration', 'Driver updates', 'Settings adjustment', 'Gesture configuration'],
    estimatedTime: '1-2 hours',
    difficulty: 'Low',
    commonIssues: ['Touchpad not working', 'Erratic cursor movement', 'Buttons not clicking', 'Gestures disabled'],
    warranty: '90 days'
  },
  {
    id: 'a10',
    name: 'Screen Repair & Replacement',
    description: 'Replace cracked or damaged laptop screens',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Screen replacement', 'LCD/LED installation', 'Bezel fitting', 'Display testing'],
    excludes: ['Screen part cost'],
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    commonIssues: ['Cracked screen', 'Black display', 'Lines on screen', 'Dim display'],
    warranty: '90 days'
  },
  {
    id: 'a11',
    name: 'Hardware Upgrades',
    description: 'Install RAM, SSD, graphics cards, or other components',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Component installation', 'Compatibility testing', 'Driver installation', 'Performance testing'],
    excludes: ['Component costs'],
    estimatedTime: '1-3 hours',
    difficulty: 'Medium',
    commonIssues: ['Need more RAM', 'Slow performance', 'Storage upgrade', 'Graphics improvement'],
    warranty: '90 days'
  },
  {
    id: 'a12',
    name: 'Battery Replacement',
    description: 'Replace laptop battery for improved power retention',
    category: 'Hardware Issues',
    band: 'A',
    basePrice: 49,
    includes: ['Battery replacement', 'Power calibration', 'Charging test', 'Power management setup'],
    excludes: ['Battery cost'],
    estimatedTime: '1-2 hours',
    difficulty: 'Medium',
    commonIssues: ['Battery not holding charge', 'Short battery life', 'Charging issues'],
    additionalNotes: 'For other power issues, please refer to Band B services',
    warranty: '90 days'
  }
];

// Band B Services (£69)
export const BAND_B_SERVICES: LaptopRepairService[] = [
  {
    id: 'b1',
    name: 'Beeping on Startup',
    description: 'Diagnose and fix POST beep codes and startup issues',
    category: 'Hardware Diagnostics',
    band: 'B',
    basePrice: 69,
    includes: ['POST diagnostics', 'Hardware testing', 'Component reseating', 'BIOS verification'],
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    commonIssues: ['Continuous beeping', 'Error beep codes', 'Hardware failure indication'],
    warranty: '90 days'
  },
  {
    id: 'b2',
    name: 'Laptop Keyboard Replacement',
    description: 'Replace faulty or damaged laptop keyboard',
    category: 'Component Replacement',
    band: 'B',
    basePrice: 69,
    includes: ['Keyboard removal', 'New keyboard installation', 'Key testing', 'Layout configuration'],
    excludes: ['Keyboard part cost'],
    estimatedTime: '2-3 hours',
    difficulty: 'Medium',
    commonIssues: ['Keys not working', 'Sticky keys', 'Missing keys', 'Spill damage'],
    warranty: '90 days'
  },
  {
    id: 'b3',
    name: 'Graphics Chip GPU Repair (Reflow)',
    description: 'Professional GPU reflow service for graphics chip issues',
    category: 'Component Replacement',
    band: 'B',
    basePrice: 69,
    includes: ['GPU diagnostics', 'Reflow procedure', 'Thermal management', 'Graphics testing'],
    estimatedTime: '4-6 hours',
    difficulty: 'Expert',
    commonIssues: ['No display', 'Artifacts on screen', 'Graphics card failure', 'Overheating GPU'],
    warranty: '90 days'
  },
  {
    id: 'b4',
    name: 'Windows Software Issues',
    description: 'Fix software conflicts, error messages, and system issues',
    category: 'Windows Issues',
    band: 'B',
    basePrice: 69,
    includes: ['Error diagnostics', 'Software conflict resolution', 'Registry repair', 'System optimization'],
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    commonIssues: ['Pop-up errors', 'Software crashes', 'System conflicts', 'Registry issues'],
    warranty: '90 days'
  },
  {
    id: 'b5',
    name: 'Startup & Boot Issues',
    description: 'Fix computers that won\'t start or load properly',
    category: 'Windows Issues',
    band: 'B',
    basePrice: 69,
    includes: ['Boot diagnostics', 'Startup repair', 'Boot sector fix', 'System file repair'],
    estimatedTime: '2-5 hours',
    difficulty: 'Medium',
    commonIssues: ['Won\'t boot', 'Freezing during startup', 'No bootable device', 'Blank screen with cursor'],
    warranty: '90 days'
  },
  {
    id: 'b6',
    name: 'Blue Screen of Death (BSOD)',
    description: 'Diagnose and fix blue screen errors and system crashes',
    category: 'Windows Issues',
    band: 'B',
    basePrice: 69,
    includes: ['BSOD analysis', 'Driver troubleshooting', 'Memory testing', 'System stability fixes'],
    estimatedTime: '3-5 hours',
    difficulty: 'High',
    commonIssues: ['Frequent crashes', 'Blue screen errors', 'System instability', 'Memory dumps'],
    warranty: '90 days'
  },
  {
    id: 'b7',
    name: 'Broken Hinge Repair (Single)',
    description: 'Repair one broken laptop hinge with reinforcement',
    category: 'Physical Repair',
    band: 'B',
    basePrice: 69,
    includes: ['Hinge assessment', 'Single hinge repair', 'Reinforcement', 'Alignment adjustment'],
    excludes: ['Hinge part cost if replacement needed'],
    estimatedTime: '2-4 hours',
    difficulty: 'High',
    commonIssues: ['Loose screen', 'Hinge cracking', 'Screen won\'t stay open', 'Wobbly display'],
    additionalNotes: 'Two or more sides require Band C service (£89)',
    warranty: '90 days'
  },
  {
    id: 'b8',
    name: 'Full Internal Clean & Service',
    description: 'Complete internal cleaning with thermal paste replacement',
    category: 'Internal Cleaning & Service',
    band: 'B',
    basePrice: 69,
    includes: ['High-pressure air cleaning', 'Fan cleaning', 'Thermal paste replacement (Arctic MX-4)', 'Performance restoration'],
    estimatedTime: '3-4 hours',
    difficulty: 'Medium',
    commonIssues: ['Overheating', 'Loud fan noise', 'Performance throttling', 'Dust buildup'],
    specialPricing: {
      description: 'Upgrade to PTM7950 thermal compound (lasts longer, improves over time)',
      additionalCost: 15
    },
    warranty: '90 days'
  }
];

// Band C Services (£89)
export const BAND_C_SERVICES: LaptopRepairService[] = [
  {
    id: 'c1',
    name: 'Motherboard Repair & Replacement',
    description: 'Advanced motherboard diagnostics and component-level repair',
    category: 'Motherboard Repair',
    band: 'C',
    basePrice: 89,
    includes: ['Component-level diagnostics', 'Micro-soldering', 'Circuit repair', 'Functionality testing'],
    excludes: ['Motherboard cost if replacement needed'],
    estimatedTime: '6-8 hours',
    difficulty: 'Expert',
    commonIssues: ['No power', 'Boot failures', 'Component failures', 'Physical damage'],
    warranty: '90 days'
  },
  {
    id: 'c2',
    name: 'BIOS/CMOS Password Reset',
    description: 'Remove or reset BIOS and CMOS passwords and settings',
    category: 'Advanced Diagnostics',
    band: 'C',
    basePrice: 89,
    includes: ['BIOS access', 'Password removal', 'CMOS reset', 'Settings restoration'],
    estimatedTime: '2-4 hours',
    difficulty: 'High',
    commonIssues: ['Forgotten BIOS password', 'Locked settings', 'CMOS corruption'],
    warranty: '90 days'
  },
  {
    id: 'c3',
    name: 'Dropped/Smashed Laptop Repair',
    description: 'Comprehensive repair for physically damaged laptops',
    category: 'Physical Damage Repair',
    band: 'C',
    basePrice: 89,
    includes: ['Damage assessment', 'Multiple component repair', 'Structural fixes', 'Function restoration'],
    excludes: ['Parts costs for replacements'],
    estimatedTime: '6-10 hours',
    difficulty: 'Expert',
    commonIssues: ['Physical impact damage', 'Multiple broken components', 'Structural damage'],
    warranty: '90 days'
  },
  {
    id: 'c4',
    name: 'Custom Desktop PC Build/Repair',
    description: 'Build or repair custom desktop PCs with your components',
    category: 'Custom PC Services',
    band: 'C',
    basePrice: 89,
    includes: ['Custom assembly', 'Component compatibility', 'Cable management', 'Performance optimization'],
    excludes: ['PC components (you can supply your own)'],
    estimatedTime: '4-8 hours',
    difficulty: 'High',
    commonIssues: ['Build new PC', 'Upgrade existing build', 'Compatibility issues', 'Performance optimization'],
    warranty: '90 days'
  },
  {
    id: 'c5',
    name: 'Liquid Spillage Damage Repair',
    description: 'Emergency liquid damage repair and component restoration',
    category: 'Physical Damage Repair',
    band: 'C',
    basePrice: 89,
    includes: ['Immediate cleaning', 'Corrosion removal', 'Component testing', 'Circuit restoration'],
    estimatedTime: '4-8 hours',
    difficulty: 'Expert',
    commonIssues: ['Water damage', 'Coffee spills', 'Liquid corrosion', 'Short circuits'],
    additionalNotes: 'Call ASAP - time is critical for liquid damage recovery',
    warranty: '90 days'
  },
  {
    id: 'c6',
    name: 'USB & Port Repairs',
    description: 'Repair broken USB, USB-C, audio, and ethernet ports',
    category: 'Port & Connector Fixes',
    band: 'C',
    basePrice: 89,
    includes: ['Port replacement', 'Connector repair', 'Circuit trace repair', 'Functionality testing'],
    excludes: ['Port components if needed'],
    estimatedTime: '3-6 hours',
    difficulty: 'Expert',
    commonIssues: ['Broken USB ports', 'Loose connections', 'Port not working', 'Physical damage'],
    specialPricing: {
      description: 'USB-C motherboard track repair (especially Huawei models)',
      additionalCost: 49
    },
    additionalNotes: 'USB-C ports may require additional motherboard repair (+£49) due to track damage',
    warranty: '90 days'
  },
  {
    id: 'c7',
    name: 'Audio Jack Repair',
    description: 'Fix broken or loose headphone and microphone jacks',
    category: 'Port & Connector Fixes',
    band: 'C',
    basePrice: 89,
    includes: ['Jack replacement', 'Internal wiring repair', 'Audio circuit testing', 'Sound verification'],
    estimatedTime: '2-4 hours',
    difficulty: 'High',
    commonIssues: ['No audio output', 'Loose jack', 'One channel not working', 'Jack physically broken'],
    warranty: '90 days'
  },
  {
    id: 'c8',
    name: 'Power Socket (DC Jack) Repair',
    description: 'Fix broken or wobbly laptop power charging ports',
    category: 'Port & Connector Fixes',
    band: 'C',
    basePrice: 89,
    includes: ['DC jack replacement', 'Power circuit repair', 'Charging verification', 'Cable management'],
    estimatedTime: '3-5 hours',
    difficulty: 'Expert',
    commonIssues: ['Loose charging port', 'Won\'t charge', 'Intermittent charging', 'Jack physically damaged'],
    warranty: '90 days'
  },
  {
    id: 'c9',
    name: 'Display Issues Repair',
    description: 'Fix complex display problems and screen malfunctions',
    category: 'Display Issues',
    band: 'C',
    basePrice: 89,
    includes: ['Display diagnostics', 'Backlight repair', 'Inverter testing', 'Cable troubleshooting'],
    estimatedTime: '3-6 hours',
    difficulty: 'High',
    commonIssues: ['Flickering screen', 'Dim display', 'No backlight', 'Colored lines/bars', 'Distorted image'],
    warranty: '90 days'
  },
  {
    id: 'c10',
    name: 'Power Issues Repair',
    description: 'Diagnose and fix complex power and charging problems',
    category: 'Power Issues',
    band: 'C',
    basePrice: 89,
    includes: ['Power circuit analysis', 'Charging system repair', 'Battery management fix', 'Power delivery testing'],
    estimatedTime: '4-6 hours',
    difficulty: 'Expert',
    commonIssues: ['Won\'t turn on', 'Random shutdowns', 'Continuous restarting', 'Charging problems'],
    warranty: '90 days'
  },
  {
    id: 'c11',
    name: 'Multiple Broken Hinges',
    description: 'Repair two or more broken laptop hinges with reinforcement',
    category: 'Physical Damage Repair',
    band: 'C',
    basePrice: 89,
    includes: ['Multiple hinge repair', 'Structural reinforcement', 'Alignment correction', 'Stress testing'],
    excludes: ['Hinge parts if replacement needed'],
    estimatedTime: '4-6 hours',
    difficulty: 'Expert',
    commonIssues: ['Multiple loose hinges', 'Structural damage', 'Screen alignment issues'],
    warranty: '90 days'
  }
];

// Combined services array
export const ALL_LAPTOP_SERVICES: LaptopRepairService[] = [
  ...BAND_A_SERVICES,
  ...BAND_B_SERVICES, 
  ...BAND_C_SERVICES
];

// Utility functions
export const getServicesByBand = (band: 'A' | 'B' | 'C'): LaptopRepairService[] => {
  return ALL_LAPTOP_SERVICES.filter(service => service.band === band);
};

export const getServiceById = (id: string): LaptopRepairService | undefined => {
  return ALL_LAPTOP_SERVICES.find(service => service.id === id);
};

export const calculateTotalPrice = (
  selectedServices: string[], 
  discounts: { student?: boolean; blueLightCard?: boolean } = {}
): number => {
  const services = selectedServices.map(id => getServiceById(id)).filter(Boolean) as LaptopRepairService[];
  let total = services.reduce((sum, service) => sum + service.basePrice, 0);
  
  // Apply discounts
  if (discounts.student || discounts.blueLightCard) {
    total = total * (1 - LAPTOP_REPAIR_PRICING.discounts.student / 100);
  }
  
  return Math.round(total * 100) / 100; // Round to 2 decimal places
};

export const getBandInfo = (bandId: 'A' | 'B' | 'C'): ServiceBand | undefined => {
  return SERVICE_BANDS.find(band => band.id === bandId);
};