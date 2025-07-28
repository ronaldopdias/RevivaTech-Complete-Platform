import { DeviceCategory, DeviceModel } from '@/lib/services/types';

// Gaming device categories
export const gamingCategories: DeviceCategory[] = [
  {
    id: 'gaming-console',
    name: 'Gaming Console',
    description: 'PlayStation, Xbox, Nintendo Switch, and other gaming consoles',
    icon: 'gamepad',
    brands: ['Sony', 'Microsoft', 'Nintendo', 'Steam'],
    popularModels: ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'Steam Deck'],
  },
  {
    id: 'handheld-gaming',
    name: 'Handheld Gaming',
    description: 'Portable gaming devices and handhelds',
    icon: 'gamepad',
    brands: ['Nintendo', 'Steam', 'ASUS', 'Logitech'],
    popularModels: ['Nintendo Switch', 'Steam Deck', 'ROG Ally', 'Logitech G Cloud'],
  },
];

// PlayStation models
export const playstationModels: DeviceModel[] = [
  {
    id: 'playstation-5',
    categoryId: 'gaming-console',
    brand: 'Sony',
    name: 'PlayStation 5',
    year: 2020,
    imageUrl: '/images/devices/playstation-5.jpg',
    specifications: {
      processor: 'AMD Zen 2 (8-core, 3.5GHz)',
      memory: '16GB GDDR6',
      storage: '825GB SSD',
      graphics: 'AMD RDNA 2 (10.28 TF)',
      ports: ['USB-A 3.1', '2x USB-A 2.0', 'HDMI 2.1', 'Ethernet'],
      dimensions: { width: 390, height: 104, depth: 260, weight: 4.5 },
    },
    commonIssues: ['Disc drive issues', 'Overheating', 'HDMI port problems', 'Controller drift'],
    averageRepairCost: 180,
  },
  {
    id: 'playstation-5-slim',
    categoryId: 'gaming-console',
    brand: 'Sony',
    name: 'PlayStation 5 Slim',
    year: 2023,
    imageUrl: '/images/devices/playstation-5-slim.jpg',
    specifications: {
      processor: 'AMD Zen 2 (8-core, 3.5GHz)',
      memory: '16GB GDDR6',
      storage: '1TB SSD',
      graphics: 'AMD RDNA 2 (10.28 TF)',
      ports: ['USB-A 3.1', '2x USB-A 2.0', 'HDMI 2.1', 'Ethernet'],
      dimensions: { width: 358, height: 96, depth: 216, weight: 3.2 },
    },
    commonIssues: ['Disc drive issues', 'Overheating', 'HDMI port problems', 'Controller drift'],
    averageRepairCost: 180,
  },
  {
    id: 'playstation-4-pro',
    categoryId: 'gaming-console',
    brand: 'Sony',
    name: 'PlayStation 4 Pro',
    year: 2016,
    imageUrl: '/images/devices/playstation-4-pro.jpg',
    specifications: {
      processor: 'AMD Jaguar (8-core, 2.1GHz)',
      memory: '8GB GDDR5',
      storage: '1TB HDD',
      graphics: 'AMD Radeon (4.2 TF)',
      ports: ['2x USB 3.1', 'HDMI 2.0', 'Ethernet', 'Optical'],
      dimensions: { width: 295, height: 55, depth: 327, weight: 3.3 },
    },
    commonIssues: ['Overheating', 'HDD failure', 'Blue light of death', 'Controller drift'],
    averageRepairCost: 120,
  },
  {
    id: 'playstation-4',
    categoryId: 'gaming-console',
    brand: 'Sony',
    name: 'PlayStation 4',
    year: 2013,
    imageUrl: '/images/devices/playstation-4.jpg',
    specifications: {
      processor: 'AMD Jaguar (8-core, 1.6GHz)',
      memory: '8GB GDDR5',
      storage: '500GB - 1TB HDD',
      graphics: 'AMD Radeon (1.84 TF)',
      ports: ['2x USB 3.0', 'HDMI 1.4', 'Ethernet', 'Optical'],
      dimensions: { width: 275, height: 53, depth: 305, weight: 2.8 },
    },
    commonIssues: ['Overheating', 'HDD failure', 'Blue light of death', 'Power supply issues'],
    averageRepairCost: 100,
  },
];

// Xbox models
export const xboxModels: DeviceModel[] = [
  {
    id: 'xbox-series-x',
    categoryId: 'gaming-console',
    brand: 'Microsoft',
    name: 'Xbox Series X',
    year: 2020,
    imageUrl: '/images/devices/xbox-series-x.jpg',
    specifications: {
      processor: 'AMD Zen 2 (8-core, 3.8GHz)',
      memory: '16GB GDDR6',
      storage: '1TB SSD',
      graphics: 'AMD RDNA 2 (12 TF)',
      ports: ['3x USB 3.1', 'HDMI 2.1', 'Ethernet', 'Storage expansion'],
      dimensions: { width: 151, height: 301, depth: 151, weight: 4.45 },
    },
    commonIssues: ['Disc drive issues', 'Overheating', 'HDMI problems', 'Controller drift'],
    averageRepairCost: 160,
  },
  {
    id: 'xbox-series-s',
    categoryId: 'gaming-console',
    brand: 'Microsoft',
    name: 'Xbox Series S',
    year: 2020,
    imageUrl: '/images/devices/xbox-series-s.jpg',
    specifications: {
      processor: 'AMD Zen 2 (8-core, 3.6GHz)',
      memory: '10GB GDDR6',
      storage: '512GB SSD',
      graphics: 'AMD RDNA 2 (4 TF)',
      ports: ['3x USB 3.1', 'HDMI 2.1', 'Ethernet', 'Storage expansion'],
      dimensions: { width: 151, height: 275, depth: 63.5, weight: 1.93 },
    },
    commonIssues: ['Overheating', 'HDMI problems', 'Controller drift', 'Storage issues'],
    averageRepairCost: 130,
  },
  {
    id: 'xbox-one-x',
    categoryId: 'gaming-console',
    brand: 'Microsoft',
    name: 'Xbox One X',
    year: 2017,
    imageUrl: '/images/devices/xbox-one-x.jpg',
    specifications: {
      processor: 'AMD Jaguar (8-core, 2.3GHz)',
      memory: '12GB GDDR5',
      storage: '1TB HDD',
      graphics: 'AMD Radeon (6 TF)',
      ports: ['3x USB 3.0', 'HDMI 2.0', 'Ethernet', 'IR blaster'],
      dimensions: { width: 300, height: 60, depth: 240, weight: 3.81 },
    },
    commonIssues: ['Overheating', 'HDD failure', 'Power supply issues', 'HDMI problems'],
    averageRepairCost: 110,
  },
];

// Nintendo models
export const nintendoModels: DeviceModel[] = [
  {
    id: 'nintendo-switch-oled',
    categoryId: 'handheld-gaming',
    brand: 'Nintendo',
    name: 'Nintendo Switch OLED',
    year: 2021,
    imageUrl: '/images/devices/nintendo-switch-oled.jpg',
    specifications: {
      screen: { size: '7"', resolution: '1280x720', type: 'OLED' },
      processor: 'NVIDIA Tegra X1',
      memory: '4GB RAM',
      storage: '64GB eMMC',
      ports: ['USB-C', 'microSD', 'Game card slot'],
      dimensions: { width: 242, height: 102, depth: 13.9, weight: 420 },
    },
    commonIssues: ['Joy-Con drift', 'Screen burn-in', 'Charging port issues', 'Fan noise'],
    averageRepairCost: 120,
  },
  {
    id: 'nintendo-switch',
    categoryId: 'handheld-gaming',
    brand: 'Nintendo',
    name: 'Nintendo Switch',
    year: 2017,
    imageUrl: '/images/devices/nintendo-switch.jpg',
    specifications: {
      screen: { size: '6.2"', resolution: '1280x720', type: 'LCD' },
      processor: 'NVIDIA Tegra X1',
      memory: '4GB RAM',
      storage: '32GB eMMC',
      ports: ['USB-C', 'microSD', 'Game card slot'],
      dimensions: { width: 239, height: 102, depth: 13.9, weight: 398 },
    },
    commonIssues: ['Joy-Con drift', 'Screen scratches', 'Charging port issues', 'Kickstand problems'],
    averageRepairCost: 100,
  },
  {
    id: 'nintendo-switch-lite',
    categoryId: 'handheld-gaming',
    brand: 'Nintendo',
    name: 'Nintendo Switch Lite',
    year: 2019,
    imageUrl: '/images/devices/nintendo-switch-lite.jpg',
    specifications: {
      screen: { size: '5.5"', resolution: '1280x720', type: 'LCD' },
      processor: 'NVIDIA Tegra X1',
      memory: '4GB RAM',
      storage: '32GB eMMC',
      ports: ['USB-C', 'microSD', 'Game card slot', '3.5mm audio'],
      dimensions: { width: 208, height: 91.1, depth: 13.9, weight: 275 },
    },
    commonIssues: ['Analog stick drift', 'Screen scratches', 'Charging port issues', 'Button sticking'],
    averageRepairCost: 80,
  },
];

// Steam Deck models
export const steamModels: DeviceModel[] = [
  {
    id: 'steam-deck-oled',
    categoryId: 'handheld-gaming',
    brand: 'Steam',
    name: 'Steam Deck OLED',
    year: 2023,
    imageUrl: '/images/devices/steam-deck-oled.jpg',
    specifications: {
      screen: { size: '7.4"', resolution: '1280x800', type: 'OLED HDR' },
      processor: 'AMD Zen 2 (4-core, 2.4-3.5GHz)',
      memory: '16GB LPDDR5',
      storage: '512GB - 1TB SSD',
      graphics: 'AMD RDNA 2 (8 CUs)',
      ports: ['USB-C', 'microSD', '3.5mm audio'],
      dimensions: { width: 298, height: 117, depth: 49, weight: 640 },
    },
    commonIssues: ['Stick drift', 'Screen burn-in', 'Charging issues', 'Fan noise'],
    averageRepairCost: 200,
  },
  {
    id: 'steam-deck',
    categoryId: 'handheld-gaming',
    brand: 'Steam',
    name: 'Steam Deck',
    year: 2022,
    imageUrl: '/images/devices/steam-deck.jpg',
    specifications: {
      screen: { size: '7"', resolution: '1280x800', type: 'LCD' },
      processor: 'AMD Zen 2 (4-core, 2.4-3.5GHz)',
      memory: '16GB LPDDR5',
      storage: '64GB - 512GB SSD',
      graphics: 'AMD RDNA 2 (8 CUs)',
      ports: ['USB-C', 'microSD', '3.5mm audio'],
      dimensions: { width: 298, height: 117, depth: 49, weight: 669 },
    },
    commonIssues: ['Stick drift', 'Screen issues', 'Charging problems', 'SSD failure'],
    averageRepairCost: 180,
  },
];

// ROG Ally models
export const rogModels: DeviceModel[] = [
  {
    id: 'asus-rog-ally',
    categoryId: 'handheld-gaming',
    brand: 'ASUS',
    name: 'ROG Ally',
    year: 2023,
    imageUrl: '/images/devices/asus-rog-ally.jpg',
    specifications: {
      screen: { size: '7"', resolution: '1920x1080', type: 'LCD 120Hz' },
      processor: 'AMD Ryzen Z1 Extreme',
      memory: '16GB LPDDR5',
      storage: '512GB SSD',
      graphics: 'AMD RDNA 3 (12 CUs)',
      ports: ['USB-C', 'microSD', '3.5mm audio', 'ROG XG Mobile'],
      dimensions: { width: 280, height: 111, depth: 21.2, weight: 608 },
    },
    commonIssues: ['Stick drift', 'Screen issues', 'Charging problems', 'Windows updates'],
    averageRepairCost: 220,
  },
];

// Combine all gaming devices
export const allGamingDevices: DeviceModel[] = [
  ...playstationModels,
  ...xboxModels,
  ...nintendoModels,
  ...steamModels,
  ...rogModels,
];

export default {
  categories: gamingCategories,
  devices: allGamingDevices,
  playstation: playstationModels,
  xbox: xboxModels,
  nintendo: nintendoModels,
  steam: steamModels,
  rog: rogModels,
};