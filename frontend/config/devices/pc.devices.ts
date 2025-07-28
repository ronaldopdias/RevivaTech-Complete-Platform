import { DeviceCategory, DeviceModel } from '@/lib/services/types';

// PC device categories
export const pcCategories: DeviceCategory[] = [
  {
    id: 'laptop-pc',
    name: 'Laptop',
    description: 'Windows laptops and ultrabooks from all manufacturers',
    icon: 'laptop',
    brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Razer', 'Microsoft'],
    popularModels: ['Dell XPS 13', 'HP Spectre x360', 'ThinkPad X1 Carbon', 'ASUS ZenBook'],
  },
  {
    id: 'desktop-pc',
    name: 'Desktop PC',
    description: 'Windows desktop computers and workstations',
    icon: 'desktop',
    brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Custom Build'],
    popularModels: ['Dell OptiPlex', 'HP EliteDesk', 'Custom Gaming PC'],
  },
  {
    id: 'gaming-laptop',
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptops',
    icon: 'laptop',
    brands: ['ASUS ROG', 'MSI', 'Razer', 'Alienware', 'HP Omen', 'Lenovo Legion'],
    popularModels: ['ASUS ROG Strix', 'MSI Stealth', 'Razer Blade', 'Alienware m15'],
  },
  {
    id: 'ultrabook',
    name: 'Ultrabook',
    description: 'Thin and light premium laptops',
    icon: 'laptop',
    brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Microsoft'],
    popularModels: ['Dell XPS 13', 'HP Spectre', 'ThinkPad X1', 'Surface Laptop'],
  },
];

// Dell laptop models
export const dellModels: DeviceModel[] = [
  {
    id: 'dell-xps-13-plus-2023',
    categoryId: 'ultrabook',
    brand: 'Dell',
    name: 'XPS 13 Plus',
    year: 2023,
    imageUrl: '/images/devices/dell-xps-13-plus-2023.jpg',
    specifications: {
      screen: { size: '13.4"', resolution: '1920x1200 or 3840x2400', type: 'InfinityEdge' },
      processor: 'Intel Core i5-1340P / i7-1360P',
      memory: '8GB - 32GB LPDDR5',
      storage: '256GB - 2TB PCIe SSD',
      graphics: 'Intel Iris Xe',
      ports: ['2x Thunderbolt 4', '1x USB-C 3.2'],
      dimensions: { width: 295.3, height: 199.04, depth: 15.28, weight: 1.24 },
    },
    commonIssues: ['Screen flickering', 'Thermal throttling', 'Battery drain', 'Keyboard backlight issues'],
    averageRepairCost: 320,
  },
  {
    id: 'dell-xps-15-2023',
    categoryId: 'laptop-pc',
    brand: 'Dell',
    name: 'XPS 15',
    year: 2023,
    imageUrl: '/images/devices/dell-xps-15-2023.jpg',
    specifications: {
      screen: { size: '15.6"', resolution: '1920x1200 or 3840x2400', type: 'InfinityEdge OLED' },
      processor: 'Intel Core i7-13700H / i9-13900H',
      memory: '16GB - 64GB DDR5',
      storage: '512GB - 4TB PCIe SSD',
      graphics: 'NVIDIA RTX 4050/4060/4070',
      ports: ['2x Thunderbolt 4', '1x USB-C 3.2', '1x USB-A 3.2', 'HDMI 2.1', 'SD card'],
      dimensions: { width: 344.72, height: 230.14, depth: 18, weight: 1.86 },
    },
    commonIssues: ['GPU overheating', 'OLED burn-in', 'Coil whine', 'Power adapter issues'],
    averageRepairCost: 420,
  },
  {
    id: 'dell-inspiron-15-3000',
    categoryId: 'laptop-pc',
    brand: 'Dell',
    name: 'Inspiron 15 3000',
    year: 2022,
    imageUrl: '/images/devices/dell-inspiron-15-3000.jpg',
    specifications: {
      screen: { size: '15.6"', resolution: '1366x768 or 1920x1080', type: 'Anti-glare LED' },
      processor: 'Intel Core i3/i5/i7 11th Gen',
      memory: '4GB - 16GB DDR4',
      storage: '128GB - 1TB SSD',
      graphics: 'Intel UHD Graphics',
      ports: ['1x USB 2.0', '2x USB 3.2', '1x HDMI', '1x SD card', '3.5mm audio'],
      dimensions: { width: 358.5, height: 236.5, depth: 19.9, weight: 1.83 },
    },
    commonIssues: ['Slow performance', 'Hard drive failure', 'Screen hinge problems', 'Power jack issues'],
    averageRepairCost: 180,
  },
];

// HP laptop models
export const hpModels: DeviceModel[] = [
  {
    id: 'hp-spectre-x360-16-2023',
    categoryId: 'ultrabook',
    brand: 'HP',
    name: 'Spectre x360 16"',
    year: 2023,
    imageUrl: '/images/devices/hp-spectre-x360-16-2023.jpg',
    specifications: {
      screen: { size: '16"', resolution: '3072x1920', type: 'OLED touch' },
      processor: 'Intel Core i7-13700H',
      memory: '16GB - 32GB LPDDR5',
      storage: '512GB - 2TB PCIe SSD',
      graphics: 'Intel Arc A370M',
      ports: ['2x Thunderbolt 4', '1x USB-A 3.2', '1x HDMI 2.1', '3.5mm audio'],
      dimensions: { width: 356.1, height: 251.9, depth: 19.5, weight: 2.15 },
    },
    commonIssues: ['Hinge wear', 'OLED screen issues', 'Fan noise', 'Stylus connectivity'],
    averageRepairCost: 380,
  },
  {
    id: 'hp-pavilion-15-2022',
    categoryId: 'laptop-pc',
    brand: 'HP',
    name: 'Pavilion 15',
    year: 2022,
    imageUrl: '/images/devices/hp-pavilion-15-2022.jpg',
    specifications: {
      screen: { size: '15.6"', resolution: '1920x1080', type: 'IPS micro-edge' },
      processor: 'Intel Core i5-1235U / AMD Ryzen 5 5625U',
      memory: '8GB - 16GB DDR4',
      storage: '256GB - 1TB SSD',
      graphics: 'Intel Iris Xe / AMD Radeon',
      ports: ['2x USB-A 3.2', '1x USB-C 3.2', '1x HDMI', '1x SD card', '3.5mm audio'],
      dimensions: { width: 360.17, height: 234, depth: 17.9, weight: 1.75 },
    },
    commonIssues: ['Keyboard backlight failure', 'WiFi connectivity', 'Battery drain', 'Screen flickering'],
    averageRepairCost: 220,
  },
];

// Lenovo ThinkPad models
export const lenovoModels: DeviceModel[] = [
  {
    id: 'thinkpad-x1-carbon-gen-11',
    categoryId: 'ultrabook',
    brand: 'Lenovo',
    name: 'ThinkPad X1 Carbon Gen 11',
    year: 2023,
    imageUrl: '/images/devices/thinkpad-x1-carbon-gen-11.jpg',
    specifications: {
      screen: { size: '14"', resolution: '1920x1200 or 2880x1800', type: 'OLED/IPS' },
      processor: 'Intel Core i5-1335U / i7-1365U',
      memory: '16GB - 32GB LPDDR5',
      storage: '256GB - 2TB PCIe SSD',
      graphics: 'Intel Iris Xe',
      ports: ['2x Thunderbolt 4', '2x USB-A 3.2', '1x HDMI 2.0', '3.5mm audio'],
      dimensions: { width: 315.6, height: 222.5, depth: 15.36, weight: 1.12 },
    },
    commonIssues: ['TrackPoint drift', 'Keyboard key sticking', 'Screen backlight bleeding', 'USB-C port failure'],
    averageRepairCost: 350,
  },
  {
    id: 'thinkpad-t14-gen-4',
    categoryId: 'laptop-pc',
    brand: 'Lenovo',
    name: 'ThinkPad T14 Gen 4',
    year: 2023,
    imageUrl: '/images/devices/thinkpad-t14-gen-4.jpg',
    specifications: {
      screen: { size: '14"', resolution: '1920x1200', type: 'IPS' },
      processor: 'Intel Core i5-1335U / i7-1365U / AMD Ryzen 5 PRO 7540U',
      memory: '8GB - 32GB DDR5',
      storage: '256GB - 1TB PCIe SSD',
      graphics: 'Intel Iris Xe / AMD Radeon 740M',
      ports: ['2x USB-C', '2x USB-A 3.2', '1x HDMI 2.1', 'Ethernet', '3.5mm audio'],
      dimensions: { width: 329, height: 227, depth: 17.9, weight: 1.21 },
    },
    commonIssues: ['Docking station compatibility', 'Fingerprint reader issues', 'Fan noise', 'Screen hinge problems'],
    averageRepairCost: 280,
  },
];

// ASUS laptop models
export const asusModels: DeviceModel[] = [
  {
    id: 'asus-rog-strix-g15-2023',
    categoryId: 'gaming-laptop',
    brand: 'ASUS',
    name: 'ROG Strix G15',
    year: 2023,
    imageUrl: '/images/devices/asus-rog-strix-g15-2023.jpg',
    specifications: {
      screen: { size: '15.6"', resolution: '1920x1080', type: '144Hz IPS' },
      processor: 'AMD Ryzen 7 7735HS / Ryzen 9 7940HS',
      memory: '16GB - 32GB DDR5',
      storage: '512GB - 1TB PCIe SSD',
      graphics: 'NVIDIA RTX 4050/4060/4070',
      ports: ['1x USB-C 3.2', '3x USB-A 3.2', '1x HDMI 2.1', 'Ethernet', '3.5mm audio'],
      dimensions: { width: 354.9, height: 259.9, depth: 22.69, weight: 2.3 },
    },
    commonIssues: ['Overheating', 'RGB lighting failure', 'Power adapter issues', 'Fan noise'],
    averageRepairCost: 380,
  },
  {
    id: 'asus-zenbook-14-oled-2023',
    categoryId: 'ultrabook',
    brand: 'ASUS',
    name: 'ZenBook 14 OLED',
    year: 2023,
    imageUrl: '/images/devices/asus-zenbook-14-oled-2023.jpg',
    specifications: {
      screen: { size: '14"', resolution: '2880x1800', type: 'OLED' },
      processor: 'Intel Core i5-13500H / i7-13700H',
      memory: '16GB - 32GB LPDDR5',
      storage: '512GB - 1TB PCIe SSD',
      graphics: 'Intel Iris Xe',
      ports: ['2x Thunderbolt 4', '1x USB-A 3.2', '1x HDMI 2.1', '3.5mm audio'],
      dimensions: { width: 313.6, height: 220.5, depth: 16.9, weight: 1.39 },
    },
    commonIssues: ['OLED burn-in', 'Trackpad issues', 'Power button problems', 'WiFi connectivity'],
    averageRepairCost: 320,
  },
];

// MSI gaming laptops
export const msiModels: DeviceModel[] = [
  {
    id: 'msi-stealth-17-studio-2023',
    categoryId: 'gaming-laptop',
    brand: 'MSI',
    name: 'Stealth 17 Studio',
    year: 2023,
    imageUrl: '/images/devices/msi-stealth-17-studio-2023.jpg',
    specifications: {
      screen: { size: '17"', resolution: '2560x1600', type: '240Hz IPS' },
      processor: 'Intel Core i7-13700H',
      memory: '32GB DDR5',
      storage: '1TB PCIe SSD',
      graphics: 'NVIDIA RTX 4070',
      ports: ['1x Thunderbolt 4', '3x USB-A 3.2', '1x HDMI 2.1', 'Ethernet', '3.5mm audio'],
      dimensions: { width: 382, height: 259, depth: 19.95, weight: 2.25 },
    },
    commonIssues: ['Thermal throttling', 'Keyboard lighting issues', 'Screen bleeding', 'Coil whine'],
    averageRepairCost: 450,
  },
];

// Microsoft Surface models
export const surfaceModels: DeviceModel[] = [
  {
    id: 'surface-laptop-5-2022',
    categoryId: 'ultrabook',
    brand: 'Microsoft',
    name: 'Surface Laptop 5',
    year: 2022,
    imageUrl: '/images/devices/surface-laptop-5-2022.jpg',
    specifications: {
      screen: { size: '13.5" / 15"', resolution: '2256x1504 / 2496x1664', type: 'PixelSense touchscreen' },
      processor: 'Intel Core i5-1235U / i7-1255U',
      memory: '8GB - 32GB LPDDR5',
      storage: '256GB - 1TB SSD',
      graphics: 'Intel Iris Xe',
      ports: ['1x USB-A 3.1', '1x USB-C', '3.5mm audio', 'Surface Connect'],
      dimensions: { width: 308, height: 223, depth: 14.7, weight: 1.29 },
    },
    commonIssues: ['Screen adhesive failure', 'Type Cover connectivity', 'Surface Pen issues', 'Charging problems'],
    averageRepairCost: 350,
  },
];

// Desktop PC models
export const desktopModels: DeviceModel[] = [
  {
    id: 'dell-optiplex-7000-tower',
    categoryId: 'desktop-pc',
    brand: 'Dell',
    name: 'OptiPlex 7000 Tower',
    year: 2023,
    imageUrl: '/images/devices/dell-optiplex-7000-tower.jpg',
    specifications: {
      processor: 'Intel Core i5-13500 / i7-13700',
      memory: '8GB - 64GB DDR5',
      storage: '256GB - 2TB SSD',
      graphics: 'Intel UHD 770 / optional discrete GPU',
      ports: ['Multiple USB-A/C', 'HDMI', 'DisplayPort', 'Ethernet'],
    },
    commonIssues: ['Power supply failure', 'RAM issues', 'Hard drive failure', 'Graphics card problems'],
    averageRepairCost: 200,
  },
  {
    id: 'custom-gaming-pc-2023',
    categoryId: 'desktop-pc',
    brand: 'Custom Build',
    name: 'Custom Gaming PC',
    year: 2023,
    imageUrl: '/images/devices/custom-gaming-pc-2023.jpg',
    specifications: {
      processor: 'Intel Core i5/i7/i9 13th Gen / AMD Ryzen 5/7/9 7000 series',
      memory: '16GB - 128GB DDR5',
      storage: '1TB - 4TB NVMe SSD',
      graphics: 'NVIDIA RTX 4060/4070/4080/4090 / AMD RX 7700/7800/7900 XT',
      ports: ['Multiple USB ports', 'HDMI', 'DisplayPort', 'Ethernet'],
    },
    commonIssues: ['Graphics card overheating', 'PSU failure', 'RAM compatibility', 'Motherboard issues'],
    averageRepairCost: 250,
  },
];

// Combine all PC devices
export const allPcDevices: DeviceModel[] = [
  ...dellModels,
  ...hpModels,
  ...lenovoModels,
  ...asusModels,
  ...msiModels,
  ...surfaceModels,
  ...desktopModels,
];

export default {
  categories: pcCategories,
  devices: allPcDevices,
  dell: dellModels,
  hp: hpModels,
  lenovo: lenovoModels,
  asus: asusModels,
  msi: msiModels,
  surface: surfaceModels,
  desktop: desktopModels,
};