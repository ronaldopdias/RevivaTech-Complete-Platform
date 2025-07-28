import { DeviceDatabase } from '@/lib/database/types';

export const deviceDatabaseConfig: DeviceDatabase = {
  version: '2.0',
  lastUpdated: '2024-01-15',
  
  brands: [
    {
      id: 'apple',
      name: 'Apple',
      slug: 'apple',
      logo: '/images/brands/apple.svg',
      category: 'premium',
      repairComplexity: 'high',
      partAvailability: 'excellent',
      averageRepairCost: 150,
      popularityScore: 95
    },
    {
      id: 'samsung',
      name: 'Samsung',
      slug: 'samsung',
      logo: '/images/brands/samsung.svg',
      category: 'mainstream',
      repairComplexity: 'medium',
      partAvailability: 'excellent',
      averageRepairCost: 120,
      popularityScore: 90
    },
    {
      id: 'google',
      name: 'Google',
      slug: 'google',
      logo: '/images/brands/google.svg',
      category: 'mainstream',
      repairComplexity: 'medium',
      partAvailability: 'good',
      averageRepairCost: 110,
      popularityScore: 75
    },
    {
      id: 'oneplus',
      name: 'OnePlus',
      slug: 'oneplus',
      logo: '/images/brands/oneplus.svg',
      category: 'premium',
      repairComplexity: 'medium',
      partAvailability: 'good',
      averageRepairCost: 100,
      popularityScore: 65
    },
    {
      id: 'huawei',
      name: 'Huawei',
      slug: 'huawei',
      logo: '/images/brands/huawei.svg',
      category: 'mainstream',
      repairComplexity: 'medium',
      partAvailability: 'fair',
      averageRepairCost: 90,
      popularityScore: 60
    },
    {
      id: 'xiaomi',
      name: 'Xiaomi',
      slug: 'xiaomi',
      logo: '/images/brands/xiaomi.svg',
      category: 'budget',
      repairComplexity: 'low',
      partAvailability: 'good',
      averageRepairCost: 80,
      popularityScore: 70
    },
    {
      id: 'dell',
      name: 'Dell',
      slug: 'dell',
      logo: '/images/brands/dell.svg',
      category: 'business',
      repairComplexity: 'medium',
      partAvailability: 'excellent',
      averageRepairCost: 130,
      popularityScore: 85
    },
    {
      id: 'hp',
      name: 'HP',
      slug: 'hp',
      logo: '/images/brands/hp.svg',
      category: 'mainstream',
      repairComplexity: 'medium',
      partAvailability: 'excellent',
      averageRepairCost: 120,
      popularityScore: 80
    },
    {
      id: 'lenovo',
      name: 'Lenovo',
      slug: 'lenovo',
      logo: '/images/brands/lenovo.svg',
      category: 'business',
      repairComplexity: 'medium',
      partAvailability: 'excellent',
      averageRepairCost: 125,
      popularityScore: 82
    },
    {
      id: 'asus',
      name: 'ASUS',
      slug: 'asus',
      logo: '/images/brands/asus.svg',
      category: 'gaming',
      repairComplexity: 'high',
      partAvailability: 'good',
      averageRepairCost: 135,
      popularityScore: 75
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      slug: 'microsoft',
      logo: '/images/brands/microsoft.svg',
      category: 'premium',
      repairComplexity: 'high',
      partAvailability: 'good',
      averageRepairCost: 160,
      popularityScore: 70
    },
    {
      id: 'sony',
      name: 'Sony',
      slug: 'sony',
      logo: '/images/brands/sony.svg',
      category: 'gaming',
      repairComplexity: 'medium',
      partAvailability: 'good',
      averageRepairCost: 110,
      popularityScore: 85
    },
    {
      id: 'nintendo',
      name: 'Nintendo',
      slug: 'nintendo',
      logo: '/images/brands/nintendo.svg',
      category: 'gaming',
      repairComplexity: 'medium',
      partAvailability: 'fair',
      averageRepairCost: 95,
      popularityScore: 88
    }
  ],
  
  categories: [
    {
      id: 'smartphone',
      name: 'Smartphones',
      slug: 'smartphone',
      icon: 'smartphone',
      description: 'Mobile phones and smartphones',
      commonIssues: ['screen-damage', 'battery-drain', 'charging-port', 'camera-issues'],
      averageRepairTime: 120,
      popularityScore: 95
    },
    {
      id: 'laptop',
      name: 'Laptops',
      slug: 'laptop',
      icon: 'laptop',
      description: 'Portable computers and notebooks',
      commonIssues: ['screen-damage', 'keyboard-issues', 'battery-issues', 'overheating'],
      averageRepairTime: 240,
      popularityScore: 90
    },
    {
      id: 'tablet',
      name: 'Tablets',
      slug: 'tablet',
      icon: 'tablet',
      description: 'Tablet computers and e-readers',
      commonIssues: ['screen-damage', 'battery-drain', 'charging-port', 'button-issues'],
      averageRepairTime: 180,
      popularityScore: 75
    },
    {
      id: 'desktop',
      name: 'Desktops',
      slug: 'desktop',
      icon: 'monitor',
      description: 'Desktop computers and all-in-ones',
      commonIssues: ['hardware-failure', 'performance-issues', 'virus-malware', 'component-upgrade'],
      averageRepairTime: 300,
      popularityScore: 65
    },
    {
      id: 'gaming-console',
      name: 'Gaming Consoles',
      slug: 'gaming-console',
      icon: 'gamepad',
      description: 'Gaming consoles and handheld devices',
      commonIssues: ['overheating', 'disc-reader', 'controller-issues', 'hdmi-port'],
      averageRepairTime: 200,
      popularityScore: 80
    },
    {
      id: 'wearable',
      name: 'Wearables',
      slug: 'wearable',
      icon: 'watch',
      description: 'Smartwatches and fitness trackers',
      commonIssues: ['screen-damage', 'battery-drain', 'charging-issues', 'water-damage'],
      averageRepairTime: 90,
      popularityScore: 50
    }
  ],
  
  devices: [
    // Apple iPhones (2017-2025) - Complete lineup
    
    // iPhone 16 Series (2024)
    {
      id: 'iphone-16-pro-max',
      name: 'iPhone 16 Pro Max',
      displayName: 'iPhone 16 Pro Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2024,
      slug: 'iphone-16-pro-max',
      image: '/images/devices/iphone-16-pro-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-16-pro-max.jpg',
      specifications: {
        screenSize: 6.9,
        screenType: 'OLED Super Retina XDR',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        processor: 'A18 Pro'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Camera issues', 'Battery drain', 'Charging port'],
        difficulty: 'hard',
        avgRepairTime: 75,
        partAvailability: 'high'
      },
      popularityScore: 98,
      active: true
    },
    {
      id: 'iphone-16-pro',
      name: 'iPhone 16 Pro',
      displayName: 'iPhone 16 Pro',
      brand: 'apple',
      category: 'smartphone',
      year: 2024,
      slug: 'iphone-16-pro',
      image: '/images/devices/iphone-16-pro.jpg',
      thumbnail: '/images/devices/thumbs/iphone-16-pro.jpg',
      specifications: {
        screenSize: 6.3,
        screenType: 'OLED Super Retina XDR',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        processor: 'A18 Pro'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Camera issues', 'Battery drain'],
        difficulty: 'hard',
        avgRepairTime: 70,
        partAvailability: 'high'
      },
      popularityScore: 96,
      active: true
    },
    {
      id: 'iphone-16-plus',
      name: 'iPhone 16 Plus',
      displayName: 'iPhone 16 Plus',
      brand: 'apple',
      category: 'smartphone',
      year: 2024,
      slug: 'iphone-16-plus',
      image: '/images/devices/iphone-16-plus.jpg',
      thumbnail: '/images/devices/thumbs/iphone-16-plus.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED Super Retina XDR',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'],
        processor: 'A18'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Battery issues', 'Speaker problems'],
        difficulty: 'medium',
        avgRepairTime: 60,
        partAvailability: 'high'
      },
      popularityScore: 88,
      active: true
    },
    {
      id: 'iphone-16',
      name: 'iPhone 16',
      displayName: 'iPhone 16',
      brand: 'apple',
      category: 'smartphone',
      year: 2024,
      slug: 'iphone-16',
      image: '/images/devices/iphone-16.jpg',
      thumbnail: '/images/devices/thumbs/iphone-16.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED Super Retina XDR',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'],
        processor: 'A18'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Battery issues', 'Home button'],
        difficulty: 'medium',
        avgRepairTime: 55,
        partAvailability: 'high'
      },
      popularityScore: 92,
      active: true
    },
    
    // iPhone 15 Series (2023)
    {
      id: 'iphone-15-pro-max',
      name: 'iPhone 15 Pro Max',
      displayName: 'iPhone 15 Pro Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2023,
      slug: 'iphone-15-pro-max',
      image: '/images/devices/iphone-15-pro-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-15-pro-max.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        dimensions: { width: 76.7, height: 159.9, depth: 8.25 },
        weight: 221
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 180,
      popularityScore: 95,
      supportedUntil: '2030-09-01',
      releaseDate: '2023-09-22'
    },
    {
      id: 'iphone-15-pro',
      name: 'iPhone 15 Pro',
      displayName: 'iPhone 15 Pro',
      brand: 'apple',
      category: 'smartphone',
      year: 2023,
      slug: 'iphone-15-pro',
      image: '/images/devices/iphone-15-pro.jpg',
      thumbnail: '/images/devices/thumbs/iphone-15-pro.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        dimensions: { width: 70.6, height: 146.6, depth: 8.25 },
        weight: 187
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 170,
      popularityScore: 90,
      supportedUntil: '2030-09-01',
      releaseDate: '2023-09-22'
    },
    {
      id: 'iphone-15',
      name: 'iPhone 15',
      displayName: 'iPhone 15',
      brand: 'apple',
      category: 'smartphone',
      year: 2023,
      slug: 'iphone-15',
      image: '/images/devices/iphone-15.jpg',
      thumbnail: '/images/devices/thumbs/iphone-15.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
        dimensions: { width: 70.6, height: 146.6, depth: 7.80 },
        weight: 171
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 150,
      popularityScore: 85,
      supportedUntil: '2030-09-01',
      releaseDate: '2023-09-22'
    },
    {
      id: 'iphone-15-plus',
      name: 'iPhone 15 Plus',
      displayName: 'iPhone 15 Plus',
      brand: 'apple',
      category: 'smartphone',
      year: 2023,
      slug: 'iphone-15-plus',
      image: '/images/devices/iphone-15-plus.jpg',
      thumbnail: '/images/devices/thumbs/iphone-15-plus.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
        dimensions: { width: 77.8, height: 160.9, depth: 7.80 },
        weight: 201
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 160,
      popularityScore: 80,
      supportedUntil: '2030-09-01',
      releaseDate: '2023-09-22'
    },
    
    // iPhone 14 Series (2022)
    {
      id: 'iphone-14-pro-max',
      name: 'iPhone 14 Pro Max',
      displayName: 'iPhone 14 Pro Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2022,
      slug: 'iphone-14-pro-max',
      image: '/images/devices/iphone-14-pro-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-14-pro-max.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED ProMotion',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
        dimensions: { width: 77.6, height: 160.7, depth: 7.85 },
        weight: 240
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 280,
      popularityScore: 92,
      supportedUntil: '2029-09-01',
      releaseDate: '2022-09-16'
    },
    {
      id: 'iphone-14-pro',
      name: 'iPhone 14 Pro',
      displayName: 'iPhone 14 Pro',
      brand: 'apple',
      category: 'smartphone',
      year: 2022,
      slug: 'iphone-14-pro',
      image: '/images/devices/iphone-14-pro.jpg',
      thumbnail: '/images/devices/thumbs/iphone-14-pro.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED ProMotion',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
        dimensions: { width: 71.5, height: 147.5, depth: 7.85 },
        weight: 206
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 250,
      popularityScore: 89,
      supportedUntil: '2029-09-01',
      releaseDate: '2022-09-16'
    },
    {
      id: 'iphone-14-plus',
      name: 'iPhone 14 Plus',
      displayName: 'iPhone 14 Plus',
      brand: 'apple',
      category: 'smartphone',
      year: 2022,
      slug: 'iphone-14-plus',
      image: '/images/devices/iphone-14-plus.jpg',
      thumbnail: '/images/devices/thumbs/iphone-14-plus.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Blue', 'Purple', 'Midnight', 'Starlight', 'Red'],
        dimensions: { width: 78.1, height: 160.8, depth: 7.80 },
        weight: 203
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 220,
      popularityScore: 82,
      supportedUntil: '2029-09-01',
      releaseDate: '2022-09-16'
    },
    {
      id: 'iphone-14',
      name: 'iPhone 14',
      displayName: 'iPhone 14',
      brand: 'apple',
      category: 'smartphone',
      year: 2022,
      slug: 'iphone-14',
      image: '/images/devices/iphone-14.jpg',
      thumbnail: '/images/devices/thumbs/iphone-14.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Blue', 'Purple', 'Midnight', 'Starlight', 'Red'],
        dimensions: { width: 71.5, height: 146.7, depth: 7.80 },
        weight: 172
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 190,
      popularityScore: 85,
      supportedUntil: '2029-09-01',
      releaseDate: '2022-09-16'
    },
    
    // iPhone 13 Series (2021)
    {
      id: 'iphone-13-pro-max',
      name: 'iPhone 13 Pro Max',
      displayName: 'iPhone 13 Pro Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2021,
      slug: 'iphone-13-pro-max',
      image: '/images/devices/iphone-13-pro-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-13-pro-max.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED ProMotion',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'],
        dimensions: { width: 78.1, height: 160.8, depth: 7.65 },
        weight: 238
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 260,
      popularityScore: 88,
      supportedUntil: '2028-09-01',
      releaseDate: '2021-09-24'
    },
    {
      id: 'iphone-13-pro',
      name: 'iPhone 13 Pro',
      displayName: 'iPhone 13 Pro',
      brand: 'apple',
      category: 'smartphone',
      year: 2021,
      slug: 'iphone-13-pro',
      image: '/images/devices/iphone-13-pro.jpg',
      thumbnail: '/images/devices/thumbs/iphone-13-pro.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED ProMotion',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'],
        dimensions: { width: 71.5, height: 146.7, depth: 7.65 },
        weight: 203
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 230,
      popularityScore: 86,
      supportedUntil: '2028-09-01',
      releaseDate: '2021-09-24'
    },
    {
      id: 'iphone-13-mini',
      name: 'iPhone 13 mini',
      displayName: 'iPhone 13 mini',
      brand: 'apple',
      category: 'smartphone',
      year: 2021,
      slug: 'iphone-13-mini',
      image: '/images/devices/iphone-13-mini.jpg',
      thumbnail: '/images/devices/thumbs/iphone-13-mini.jpg',
      specifications: {
        screenSize: 5.4,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Pink', 'Blue', 'Midnight', 'Starlight', 'Red'],
        dimensions: { width: 64.2, height: 131.5, depth: 7.65 },
        weight: 141
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 170,
      popularityScore: 75,
      supportedUntil: '2028-09-01',
      releaseDate: '2021-09-24'
    },
    {
      id: 'iphone-13',
      name: 'iPhone 13',
      displayName: 'iPhone 13',
      brand: 'apple',
      category: 'smartphone',
      year: 2021,
      slug: 'iphone-13',
      image: '/images/devices/iphone-13.jpg',
      thumbnail: '/images/devices/thumbs/iphone-13.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Pink', 'Blue', 'Midnight', 'Starlight', 'Red'],
        dimensions: { width: 71.5, height: 146.7, depth: 7.65 },
        weight: 173
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 180,
      popularityScore: 83,
      supportedUntil: '2028-09-01',
      releaseDate: '2021-09-24'
    },
    
    // iPhone 12 Series (2020)
    {
      id: 'iphone-12-pro-max',
      name: 'iPhone 12 Pro Max',
      displayName: 'iPhone 12 Pro Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2020,
      slug: 'iphone-12-pro-max',
      image: '/images/devices/iphone-12-pro-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-12-pro-max.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'OLED Super Retina XDR',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Graphite', 'Silver', 'Gold', 'Pacific Blue'],
        dimensions: { width: 78.1, height: 160.8, depth: 7.4 },
        weight: 228
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 220,
      popularityScore: 85,
      supportedUntil: '2027-10-01',
      releaseDate: '2020-10-23'
    },
    {
      id: 'iphone-12-pro',
      name: 'iPhone 12 Pro',
      displayName: 'iPhone 12 Pro',
      brand: 'apple',
      category: 'smartphone',
      year: 2020,
      slug: 'iphone-12-pro',
      image: '/images/devices/iphone-12-pro.jpg',
      thumbnail: '/images/devices/thumbs/iphone-12-pro.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED Super Retina XDR',
        storage: ['128GB', '256GB', '512GB'],
        colors: ['Graphite', 'Silver', 'Gold', 'Pacific Blue'],
        dimensions: { width: 71.5, height: 146.7, depth: 7.4 },
        weight: 189
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 200,
      popularityScore: 82,
      supportedUntil: '2027-10-01',
      releaseDate: '2020-10-23'
    },
    {
      id: 'iphone-12-mini',
      name: 'iPhone 12 mini',
      displayName: 'iPhone 12 mini',
      brand: 'apple',
      category: 'smartphone',
      year: 2020,
      slug: 'iphone-12-mini',
      image: '/images/devices/iphone-12-mini.jpg',
      thumbnail: '/images/devices/thumbs/iphone-12-mini.jpg',
      specifications: {
        screenSize: 5.4,
        screenType: 'OLED Super Retina XDR',
        storage: ['64GB', '128GB', '256GB'],
        colors: ['Black', 'White', 'Red', 'Green', 'Blue', 'Purple'],
        dimensions: { width: 64.2, height: 131.5, depth: 7.4 },
        weight: 135
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 160,
      popularityScore: 70,
      supportedUntil: '2027-10-01',
      releaseDate: '2020-10-23'
    },
    {
      id: 'iphone-12',
      name: 'iPhone 12',
      displayName: 'iPhone 12',
      brand: 'apple',
      category: 'smartphone',
      year: 2020,
      slug: 'iphone-12',
      image: '/images/devices/iphone-12.jpg',
      thumbnail: '/images/devices/thumbs/iphone-12.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'OLED Super Retina XDR',
        storage: ['64GB', '128GB', '256GB'],
        colors: ['Black', 'White', 'Red', 'Green', 'Blue', 'Purple'],
        dimensions: { width: 71.5, height: 146.7, depth: 7.4 },
        weight: 164
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 170,
      popularityScore: 80,
      supportedUntil: '2027-10-01',
      releaseDate: '2020-10-23'
    },
    
    // iPhone 11 Series (2019)
    {
      id: 'iphone-11-pro-max',
      name: 'iPhone 11 Pro Max',
      displayName: 'iPhone 11 Pro Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2019,
      slug: 'iphone-11-pro-max',
      image: '/images/devices/iphone-11-pro-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-11-pro-max.jpg',
      specifications: {
        screenSize: 6.5,
        screenType: 'OLED Super Retina XDR',
        storage: ['64GB', '256GB', '512GB'],
        colors: ['Space Gray', 'Silver', 'Gold', 'Midnight Green'],
        dimensions: { width: 77.8, height: 158.0, depth: 8.1 },
        weight: 226
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 200,
      popularityScore: 78,
      supportedUntil: '2026-09-01',
      releaseDate: '2019-09-20'
    },
    {
      id: 'iphone-11-pro',
      name: 'iPhone 11 Pro',
      displayName: 'iPhone 11 Pro',
      brand: 'apple',
      category: 'smartphone',
      year: 2019,
      slug: 'iphone-11-pro',
      image: '/images/devices/iphone-11-pro.jpg',
      thumbnail: '/images/devices/thumbs/iphone-11-pro.jpg',
      specifications: {
        screenSize: 5.8,
        screenType: 'OLED Super Retina XDR',
        storage: ['64GB', '256GB', '512GB'],
        colors: ['Space Gray', 'Silver', 'Gold', 'Midnight Green'],
        dimensions: { width: 71.4, height: 144.0, depth: 8.1 },
        weight: 188
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 180,
      popularityScore: 75,
      supportedUntil: '2026-09-01',
      releaseDate: '2019-09-20'
    },
    {
      id: 'iphone-11',
      name: 'iPhone 11',
      displayName: 'iPhone 11',
      brand: 'apple',
      category: 'smartphone',
      year: 2019,
      slug: 'iphone-11',
      image: '/images/devices/iphone-11.jpg',
      thumbnail: '/images/devices/thumbs/iphone-11.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'LCD Liquid Retina',
        storage: ['64GB', '128GB', '256GB'],
        colors: ['Black', 'Green', 'Yellow', 'Purple', 'White', 'Red'],
        dimensions: { width: 75.7, height: 150.9, depth: 8.3 },
        weight: 194
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 160,
      popularityScore: 85,
      supportedUntil: '2026-09-01',
      releaseDate: '2019-09-20'
    },
    
    // iPhone X Series (2017-2018)
    {
      id: 'iphone-xs-max',
      name: 'iPhone XS Max',
      displayName: 'iPhone XS Max',
      brand: 'apple',
      category: 'smartphone',
      year: 2018,
      slug: 'iphone-xs-max',
      image: '/images/devices/iphone-xs-max.jpg',
      thumbnail: '/images/devices/thumbs/iphone-xs-max.jpg',
      specifications: {
        screenSize: 6.5,
        screenType: 'OLED Super Retina',
        storage: ['64GB', '256GB', '512GB'],
        colors: ['Space Gray', 'Silver', 'Gold'],
        dimensions: { width: 77.4, height: 157.5, depth: 7.7 },
        weight: 208
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 180,
      popularityScore: 72,
      supportedUntil: '2025-09-01',
      releaseDate: '2018-09-21'
    },
    {
      id: 'iphone-xs',
      name: 'iPhone XS',
      displayName: 'iPhone XS',
      brand: 'apple',
      category: 'smartphone',
      year: 2018,
      slug: 'iphone-xs',
      image: '/images/devices/iphone-xs.jpg',
      thumbnail: '/images/devices/thumbs/iphone-xs.jpg',
      specifications: {
        screenSize: 5.8,
        screenType: 'OLED Super Retina',
        storage: ['64GB', '256GB', '512GB'],
        colors: ['Space Gray', 'Silver', 'Gold'],
        dimensions: { width: 70.9, height: 143.6, depth: 7.7 },
        weight: 177
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 160,
      popularityScore: 70,
      supportedUntil: '2025-09-01',
      releaseDate: '2018-09-21'
    },
    {
      id: 'iphone-xr',
      name: 'iPhone XR',
      displayName: 'iPhone XR',
      brand: 'apple',
      category: 'smartphone',
      year: 2018,
      slug: 'iphone-xr',
      image: '/images/devices/iphone-xr.jpg',
      thumbnail: '/images/devices/thumbs/iphone-xr.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'LCD Liquid Retina',
        storage: ['64GB', '128GB', '256GB'],
        colors: ['Black', 'White', 'Red', 'Yellow', 'Blue', 'Coral'],
        dimensions: { width: 75.7, height: 150.9, depth: 8.3 },
        weight: 194
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 140,
      popularityScore: 80,
      supportedUntil: '2025-09-01',
      releaseDate: '2018-10-26'
    },
    {
      id: 'iphone-x',
      name: 'iPhone X',
      displayName: 'iPhone X',
      brand: 'apple',
      category: 'smartphone',
      year: 2017,
      slug: 'iphone-x',
      image: '/images/devices/iphone-x.jpg',
      thumbnail: '/images/devices/thumbs/iphone-x.jpg',
      specifications: {
        screenSize: 5.8,
        screenType: 'OLED Super Retina',
        storage: ['64GB', '256GB'],
        colors: ['Space Gray', 'Silver'],
        dimensions: { width: 70.9, height: 143.6, depth: 7.7 },
        weight: 174
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 150,
      popularityScore: 75,
      supportedUntil: '2024-11-01',
      releaseDate: '2017-11-03'
    },
    
    // iPhone 8 Series (2017)
    {
      id: 'iphone-8-plus',
      name: 'iPhone 8 Plus',
      displayName: 'iPhone 8 Plus',
      brand: 'apple',
      category: 'smartphone',
      year: 2017,
      slug: 'iphone-8-plus',
      image: '/images/devices/iphone-8-plus.jpg',
      thumbnail: '/images/devices/thumbs/iphone-8-plus.jpg',
      specifications: {
        screenSize: 5.5,
        screenType: 'LCD Retina HD',
        storage: ['64GB', '128GB', '256GB'],
        colors: ['Space Gray', 'Gold', 'Silver', 'Red'],
        dimensions: { width: 78.1, height: 158.4, depth: 7.5 },
        weight: 202
      },
      repairability: {
        score: 8,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port', 'home-button'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 130,
      popularityScore: 72,
      supportedUntil: '2024-09-01',
      releaseDate: '2017-09-22'
    },
    {
      id: 'iphone-8',
      name: 'iPhone 8',
      displayName: 'iPhone 8',
      brand: 'apple',
      category: 'smartphone',
      year: 2017,
      slug: 'iphone-8',
      image: '/images/devices/iphone-8.jpg',
      thumbnail: '/images/devices/thumbs/iphone-8.jpg',
      specifications: {
        screenSize: 4.7,
        screenType: 'LCD Retina HD',
        storage: ['64GB', '128GB', '256GB'],
        colors: ['Space Gray', 'Gold', 'Silver', 'Red'],
        dimensions: { width: 67.3, height: 138.4, depth: 7.3 },
        weight: 148
      },
      repairability: {
        score: 8,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port', 'home-button'],
        specialTools: ['pentalobe-screwdriver', 'suction-cup', 'spudger']
      },
      averageRepairCost: 120,
      popularityScore: 78,
      supportedUntil: '2024-09-01',
      releaseDate: '2017-09-22'
    },
    
    // Gaming Consoles
    {
      id: 'playstation-5',
      name: 'PlayStation 5',
      displayName: 'Sony PlayStation 5',
      brand: 'sony',
      category: 'gaming-console',
      year: 2020,
      slug: 'playstation-5',
      image: '/images/devices/playstation-5.jpg',
      thumbnail: '/images/devices/thumbs/playstation-5.jpg',
      specifications: {
        processor: 'AMD Zen 2',
        graphics: 'AMD RDNA 2',
        storage: ['825GB SSD', '1TB SSD'],
        colors: ['White', 'Black'],
        dimensions: { width: 104, height: 390, depth: 260 },
        weight: 4200
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['fan', 'thermal-paste', 'power-supply', 'optical-drive'],
        specialTools: ['torx-screwdriver', 'thermal-paste', 'multimeter']
      },
      averageRepairCost: 120,
      popularityScore: 95,
      supportedUntil: '2030-01-01',
      releaseDate: '2020-11-12'
    },
    {
      id: 'playstation-4-pro',
      name: 'PlayStation 4 Pro',
      displayName: 'Sony PlayStation 4 Pro',
      brand: 'sony',
      category: 'gaming-console',
      year: 2016,
      slug: 'playstation-4-pro',
      image: '/images/devices/playstation-4-pro.jpg',
      thumbnail: '/images/devices/thumbs/playstation-4-pro.jpg',
      specifications: {
        processor: 'AMD Jaguar',
        graphics: 'AMD Radeon',
        storage: ['1TB HDD'],
        colors: ['Black', 'White'],
        dimensions: { width: 55, height: 327, depth: 295 },
        weight: 3300
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['fan', 'thermal-paste', 'hard-drive', 'optical-drive'],
        specialTools: ['phillips-screwdriver', 'thermal-paste', 'multimeter']
      },
      averageRepairCost: 90,
      popularityScore: 85,
      supportedUntil: '2026-01-01',
      releaseDate: '2016-11-10'
    },
    {
      id: 'xbox-series-x',
      name: 'Xbox Series X',
      displayName: 'Microsoft Xbox Series X',
      brand: 'microsoft',
      category: 'gaming-console',
      year: 2020,
      slug: 'xbox-series-x',
      image: '/images/devices/xbox-series-x.jpg',
      thumbnail: '/images/devices/thumbs/xbox-series-x.jpg',
      specifications: {
        processor: 'AMD Zen 2',
        graphics: 'AMD RDNA 2',
        storage: ['1TB SSD'],
        colors: ['Black'],
        dimensions: { width: 151, height: 301, depth: 151 },
        weight: 4450
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['fan', 'thermal-paste', 'power-supply', 'optical-drive'],
        specialTools: ['torx-screwdriver', 'thermal-paste', 'multimeter']
      },
      averageRepairCost: 110,
      popularityScore: 88,
      supportedUntil: '2030-01-01',
      releaseDate: '2020-11-10'
    },
    {
      id: 'nintendo-switch-oled',
      name: 'Nintendo Switch OLED',
      displayName: 'Nintendo Switch OLED Model',
      brand: 'nintendo',
      category: 'gaming-console',
      year: 2021,
      slug: 'nintendo-switch-oled',
      image: '/images/devices/nintendo-switch-oled.jpg',
      thumbnail: '/images/devices/thumbs/nintendo-switch-oled.jpg',
      specifications: {
        screenSize: 7.0,
        screenType: 'OLED',
        storage: ['64GB', '128GB', '256GB', '512GB'],
        colors: ['White', 'Neon Blue/Red'],
        dimensions: { width: 102, height: 242, depth: 13.9 },
        weight: 420
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'joy-con', 'battery', 'charging-port'],
        specialTools: ['tri-wing-screwdriver', 'spudger', 'ribbon-cable-tool']
      },
      averageRepairCost: 100,
      popularityScore: 90,
      supportedUntil: '2028-01-01',
      releaseDate: '2021-10-08'
    },
    {
      id: 'nintendo-switch',
      name: 'Nintendo Switch',
      displayName: 'Nintendo Switch',
      brand: 'nintendo',
      category: 'gaming-console',
      year: 2017,
      slug: 'nintendo-switch',
      image: '/images/devices/nintendo-switch.jpg',
      thumbnail: '/images/devices/thumbs/nintendo-switch.jpg',
      specifications: {
        screenSize: 6.2,
        screenType: 'LCD',
        storage: ['32GB', '64GB', '128GB', '256GB'],
        colors: ['Gray', 'Neon Blue/Red'],
        dimensions: { width: 102, height: 239, depth: 13.9 },
        weight: 398
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'joy-con', 'battery', 'charging-port'],
        specialTools: ['tri-wing-screwdriver', 'spudger', 'ribbon-cable-tool']
      },
      averageRepairCost: 85,
      popularityScore: 92,
      supportedUntil: '2025-01-01',
      releaseDate: '2017-03-03'
    },
    
    // MacBooks (2019-2024)
    {
      id: 'macbook-pro-16-m3-max',
      name: 'MacBook Pro 16-inch M3 Max',
      displayName: 'MacBook Pro 16" M3 Max (2023)',
      brand: 'apple',
      category: 'laptop',
      year: 2023,
      slug: 'macbook-pro-16-m3-max',
      image: '/images/devices/macbook-pro-16-m3.jpg',
      thumbnail: '/images/devices/thumbs/macbook-pro-16-m3.jpg',
      specifications: {
        screenSize: 16.2,
        screenType: 'Liquid Retina XDR',
        processor: 'M3 Max',
        memory: ['36GB', '48GB', '64GB', '128GB'],
        storage: ['1TB', '2TB', '4TB', '8TB'],
        colors: ['Space Black', 'Silver'],
        dimensions: { width: 355.7, height: 248.1, depth: 16.8 },
        weight: 2160
      },
      repairability: {
        score: 4,
        complexity: 'very-high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 450,
      popularityScore: 85,
      supportedUntil: '2030-10-01',
      releaseDate: '2023-10-30'
    },
    {
      id: 'macbook-pro-14-m3-pro',
      name: 'MacBook Pro 14-inch M3 Pro',
      displayName: 'MacBook Pro 14" M3 Pro (2023)',
      brand: 'apple',
      category: 'laptop',
      year: 2023,
      slug: 'macbook-pro-14-m3-pro',
      image: '/images/devices/macbook-pro-14-m3.jpg',
      thumbnail: '/images/devices/thumbs/macbook-pro-14-m3.jpg',
      specifications: {
        screenSize: 14.2,
        screenType: 'Liquid Retina XDR',
        processor: 'M3 Pro',
        memory: ['18GB', '36GB'],
        storage: ['512GB', '1TB', '2TB', '4TB'],
        colors: ['Space Black', 'Silver'],
        dimensions: { width: 312.6, height: 221.2, depth: 15.5 },
        weight: 1570
      },
      repairability: {
        score: 4,
        complexity: 'very-high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 400,
      popularityScore: 80,
      supportedUntil: '2030-10-01',
      releaseDate: '2023-10-30'
    },
    {
      id: 'macbook-air-15-m2',
      name: 'MacBook Air 15-inch M2',
      displayName: 'MacBook Air 15" M2 (2023)',
      brand: 'apple',
      category: 'laptop',
      year: 2023,
      slug: 'macbook-air-15-m2',
      image: '/images/devices/macbook-air-15-m2.jpg',
      thumbnail: '/images/devices/thumbs/macbook-air-15-m2.jpg',
      specifications: {
        screenSize: 15.3,
        screenType: 'Liquid Retina',
        processor: 'M2',
        memory: ['8GB', '16GB', '24GB'],
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Midnight', 'Starlight', 'Silver', 'Space Gray'],
        dimensions: { width: 340.4, height: 237.6, depth: 11.5 },
        weight: 1510
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 350,
      popularityScore: 75,
      supportedUntil: '2030-06-01',
      releaseDate: '2023-06-13'
    },
    
    // Additional MacBooks (2024-2022)
    {
      id: 'macbook-pro-16-m3-2024',
      name: 'MacBook Pro 16-inch M3',
      displayName: 'MacBook Pro 16" M3 (2024)',
      brand: 'apple',
      category: 'laptop',
      year: 2024,
      slug: 'macbook-pro-16-m3-2024',
      image: '/images/devices/macbook-pro-16-m3-2024.jpg',
      thumbnail: '/images/devices/thumbs/macbook-pro-16-m3-2024.jpg',
      specifications: {
        screenSize: 16.2,
        screenType: 'Liquid Retina XDR',
        processor: 'M3 Pro/Max',
        memory: ['18GB', '36GB', '48GB', '128GB'],
        storage: ['512GB', '1TB', '2TB', '4TB', '8TB'],
        colors: ['Space Black', 'Silver'],
        dimensions: { width: 355.7, height: 248.1, depth: 16.8 },
        weight: 2140
      },
      repairability: {
        score: 4,
        complexity: 'very-high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 420,
      popularityScore: 88,
      supportedUntil: '2031-10-01',
      releaseDate: '2024-03-08'
    },
    {
      id: 'macbook-pro-14-m3-2024',
      name: 'MacBook Pro 14-inch M3',
      displayName: 'MacBook Pro 14" M3 (2024)',
      brand: 'apple',
      category: 'laptop',
      year: 2024,
      slug: 'macbook-pro-14-m3-2024',
      image: '/images/devices/macbook-pro-14-m3-2024.jpg',
      thumbnail: '/images/devices/thumbs/macbook-pro-14-m3-2024.jpg',
      specifications: {
        screenSize: 14.2,
        screenType: 'Liquid Retina XDR',
        processor: 'M3/M3 Pro',
        memory: ['8GB', '16GB', '18GB', '36GB'],
        storage: ['512GB', '1TB', '2TB', '4TB'],
        colors: ['Space Gray', 'Silver'],
        dimensions: { width: 312.6, height: 221.2, depth: 15.5 },
        weight: 1550
      },
      repairability: {
        score: 4,
        complexity: 'very-high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 380,
      popularityScore: 85,
      supportedUntil: '2031-03-01',
      releaseDate: '2024-03-08'
    },
    {
      id: 'macbook-air-m3-2024',
      name: 'MacBook Air M3',
      displayName: 'MacBook Air 13" M3 (2024)',
      brand: 'apple',
      category: 'laptop',
      year: 2024,
      slug: 'macbook-air-m3-2024',
      image: '/images/devices/macbook-air-m3-2024.jpg',
      thumbnail: '/images/devices/thumbs/macbook-air-m3-2024.jpg',
      specifications: {
        screenSize: 13.6,
        screenType: 'Liquid Retina',
        processor: 'M3',
        memory: ['8GB', '16GB', '24GB'],
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Midnight', 'Starlight', 'Silver', 'Space Gray'],
        dimensions: { width: 304.1, height: 215.0, depth: 11.3 },
        weight: 1240
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 320,
      popularityScore: 90,
      supportedUntil: '2031-03-01',
      releaseDate: '2024-03-04'
    },
    {
      id: 'macbook-air-m2-2022',
      name: 'MacBook Air M2',
      displayName: 'MacBook Air 13" M2 (2022)',
      brand: 'apple',
      category: 'laptop',
      year: 2022,
      slug: 'macbook-air-m2-2022',
      image: '/images/devices/macbook-air-m2-2022.jpg',
      thumbnail: '/images/devices/thumbs/macbook-air-m2-2022.jpg',
      specifications: {
        screenSize: 13.6,
        screenType: 'Liquid Retina',
        processor: 'M2',
        memory: ['8GB', '16GB', '24GB'],
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Midnight', 'Starlight', 'Silver', 'Space Gray'],
        dimensions: { width: 304.1, height: 215.0, depth: 11.3 },
        weight: 1240
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpad'],
        specialTools: ['pentalobe-screwdriver', 'torx-screwdriver', 'spudger']
      },
      averageRepairCost: 300,
      popularityScore: 92,
      supportedUntil: '2029-07-01',
      releaseDate: '2022-07-15'
    },

    // Dell XPS Series
    {
      id: 'dell-xps-15-9530-2023',
      name: 'Dell XPS 15 9530',
      displayName: 'Dell XPS 15 (9530, 2023)',
      brand: 'dell',
      category: 'laptop',
      year: 2023,
      slug: 'dell-xps-15-9530-2023',
      image: '/images/devices/dell-xps-15-9530.jpg',
      thumbnail: '/images/devices/thumbs/dell-xps-15-9530.jpg',
      specifications: {
        screenSize: 15.6,
        screenType: 'InfinityEdge OLED/IPS',
        processor: 'Intel Core i7/i9 13th Gen',
        memory: ['16GB', '32GB', '64GB'],
        storage: ['512GB', '1TB', '2TB', '4TB'],
        colors: ['Platinum Silver', 'Graphite'],
        dimensions: { width: 344.7, height: 230.1, depth: 18.0 },
        weight: 2050
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'motherboard'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'anti-static-wrist-strap']
      },
      averageRepairCost: 280,
      popularityScore: 82,
      supportedUntil: '2028-01-01',
      releaseDate: '2023-05-09'
    },
    {
      id: 'dell-xps-13-9315-2022',
      name: 'Dell XPS 13 9315',
      displayName: 'Dell XPS 13 (9315, 2022)',
      brand: 'dell',
      category: 'laptop',
      year: 2022,
      slug: 'dell-xps-13-9315-2022',
      image: '/images/devices/dell-xps-13-9315.jpg',
      thumbnail: '/images/devices/thumbs/dell-xps-13-9315.jpg',
      specifications: {
        screenSize: 13.4,
        screenType: 'InfinityEdge IPS',
        processor: 'Intel Core i5/i7 12th Gen',
        memory: ['8GB', '16GB', '32GB'],
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Platinum Silver', 'Umber'],
        dimensions: { width: 295.7, height: 199.04, depth: 15.8 },
        weight: 1170
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'fan'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'torx-screwdriver']
      },
      averageRepairCost: 250,
      popularityScore: 85,
      supportedUntil: '2027-06-01',
      releaseDate: '2022-09-20'
    },
    {
      id: 'dell-xps-17-9730-2023',
      name: 'Dell XPS 17 9730',
      displayName: 'Dell XPS 17 (9730, 2023)',
      brand: 'dell',
      category: 'laptop',
      year: 2023,
      slug: 'dell-xps-17-9730-2023',
      image: '/images/devices/dell-xps-17-9730.jpg',
      thumbnail: '/images/devices/thumbs/dell-xps-17-9730.jpg',
      specifications: {
        screenSize: 17.0,
        screenType: 'InfinityEdge UHD+',
        processor: 'Intel Core i7/i9 13th Gen',
        memory: ['16GB', '32GB', '64GB'],
        storage: ['512GB', '1TB', '2TB', '4TB'],
        colors: ['Platinum Silver'],
        dimensions: { width: 374.45, height: 248.05, depth: 19.5 },
        weight: 2510
      },
      repairability: {
        score: 5,
        complexity: 'very-high',
        commonParts: ['screen', 'battery', 'keyboard', 'cooling-system'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'thermal-paste']
      },
      averageRepairCost: 350,
      popularityScore: 75,
      supportedUntil: '2028-05-01',
      releaseDate: '2023-05-09'
    },

    // HP Spectre Series
    {
      id: 'hp-spectre-x360-14-2024',
      name: 'HP Spectre x360 14',
      displayName: 'HP Spectre x360 14" (2024)',
      brand: 'hp',
      category: 'laptop',
      year: 2024,
      slug: 'hp-spectre-x360-14-2024',
      image: '/images/devices/hp-spectre-x360-14-2024.jpg',
      thumbnail: '/images/devices/thumbs/hp-spectre-x360-14-2024.jpg',
      specifications: {
        screenSize: 14.0,
        screenType: 'OLED Touch 2.8K',
        processor: 'Intel Core Ultra 7',
        memory: ['16GB', '32GB'],
        storage: ['512GB', '1TB', '2TB'],
        colors: ['Nightfall Black', 'Sahara Silver'],
        dimensions: { width: 313.5, height: 220.4, depth: 17.0 },
        weight: 1380
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'hinge', 'keyboard'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'hinge-tool']
      },
      averageRepairCost: 320,
      popularityScore: 78,
      supportedUntil: '2029-03-01',
      releaseDate: '2024-03-15'
    },
    {
      id: 'hp-spectre-x360-16-2023',
      name: 'HP Spectre x360 16',
      displayName: 'HP Spectre x360 16" (2023)',
      brand: 'hp',
      category: 'laptop',
      year: 2023,
      slug: 'hp-spectre-x360-16-2023',
      image: '/images/devices/hp-spectre-x360-16-2023.jpg',
      thumbnail: '/images/devices/thumbs/hp-spectre-x360-16-2023.jpg',
      specifications: {
        screenSize: 16.0,
        screenType: 'OLED Touch 4K',
        processor: 'Intel Core i7 13th Gen',
        memory: ['16GB', '32GB'],
        storage: ['512GB', '1TB', '2TB'],
        colors: ['Nightfall Black', 'Nocturne Blue'],
        dimensions: { width: 357.0, height: 251.0, depth: 19.5 },
        weight: 2170
      },
      repairability: {
        score: 5,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'hinge', 'motherboard'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'hinge-tool']
      },
      averageRepairCost: 380,
      popularityScore: 75,
      supportedUntil: '2028-10-01',
      releaseDate: '2023-10-04'
    },
    {
      id: 'hp-envy-x360-15-2023',
      name: 'HP ENVY x360 15',
      displayName: 'HP ENVY x360 15" (2023)',
      brand: 'hp',
      category: 'laptop',
      year: 2023,
      slug: 'hp-envy-x360-15-2023',
      image: '/images/devices/hp-envy-x360-15-2023.jpg',
      thumbnail: '/images/devices/thumbs/hp-envy-x360-15-2023.jpg',
      specifications: {
        screenSize: 15.6,
        screenType: 'FHD Touch IPS',
        processor: 'AMD Ryzen 7 7730U',
        memory: ['8GB', '16GB', '32GB'],
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Natural Silver', 'Nightfall Black'],
        dimensions: { width: 358.0, height: 230.0, depth: 19.9 },
        weight: 1860
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'keyboard', 'fan'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger']
      },
      averageRepairCost: 220,
      popularityScore: 80,
      supportedUntil: '2028-08-01',
      releaseDate: '2023-08-15'
    },

    // Lenovo ThinkPad Series
    {
      id: 'lenovo-thinkpad-x1-carbon-gen-12',
      name: 'ThinkPad X1 Carbon Gen 12',
      displayName: 'Lenovo ThinkPad X1 Carbon Gen 12 (2024)',
      brand: 'lenovo',
      category: 'laptop',
      year: 2024,
      slug: 'lenovo-thinkpad-x1-carbon-gen-12',
      image: '/images/devices/thinkpad-x1-carbon-gen-12.jpg',
      thumbnail: '/images/devices/thumbs/thinkpad-x1-carbon-gen-12.jpg',
      specifications: {
        screenSize: 14.0,
        screenType: 'IPS/OLED Touch',
        processor: 'Intel Core Ultra 7',
        memory: ['16GB', '32GB', '64GB'],
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Deep Black'],
        dimensions: { width: 315.6, height: 222.5, depth: 15.36 },
        weight: 1120
      },
      repairability: {
        score: 8,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'keyboard', 'trackpoint'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'keyboard-removal-tool']
      },
      averageRepairCost: 280,
      popularityScore: 85,
      supportedUntil: '2031-02-01',
      releaseDate: '2024-02-25'
    },
    {
      id: 'lenovo-thinkpad-p1-gen-7',
      name: 'ThinkPad P1 Gen 7',
      displayName: 'Lenovo ThinkPad P1 Gen 7 (2024)',
      brand: 'lenovo',
      category: 'laptop',
      year: 2024,
      slug: 'lenovo-thinkpad-p1-gen-7',
      image: '/images/devices/thinkpad-p1-gen-7.jpg',
      thumbnail: '/images/devices/thumbs/thinkpad-p1-gen-7.jpg',
      specifications: {
        screenSize: 16.0,
        screenType: 'OLED 4K Touch',
        processor: 'Intel Core i7/i9 14th Gen',
        memory: ['16GB', '32GB', '64GB'],
        storage: ['512GB', '1TB', '2TB', '4TB'],
        colors: ['Deep Black'],
        dimensions: { width: 363.0, height: 248.9, depth: 17.7 },
        weight: 1810
      },
      repairability: {
        score: 7,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'cooling-system'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'thermal-paste']
      },
      averageRepairCost: 420,
      popularityScore: 78,
      supportedUntil: '2031-06-01',
      releaseDate: '2024-06-18'
    },
    {
      id: 'lenovo-thinkpad-t14-gen-4',
      name: 'ThinkPad T14 Gen 4',
      displayName: 'Lenovo ThinkPad T14 Gen 4 (2023)',
      brand: 'lenovo',
      category: 'laptop',
      year: 2023,
      slug: 'lenovo-thinkpad-t14-gen-4',
      image: '/images/devices/thinkpad-t14-gen-4.jpg',
      thumbnail: '/images/devices/thumbs/thinkpad-t14-gen-4.jpg',
      specifications: {
        screenSize: 14.0,
        screenType: 'IPS FHD/WUXGA',
        processor: 'Intel Core i5/i7 13th Gen',
        memory: ['8GB', '16GB', '32GB'],
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Deep Black'],
        dimensions: { width: 329.0, height: 227.0, depth: 17.9 },
        weight: 1210
      },
      repairability: {
        score: 9,
        complexity: 'low',
        commonParts: ['screen', 'battery', 'keyboard', 'memory'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger']
      },
      averageRepairCost: 200,
      popularityScore: 88,
      supportedUntil: '2030-05-01',
      releaseDate: '2023-05-30'
    },
    {
      id: 'lenovo-thinkpad-l13-yoga-gen-4',
      name: 'ThinkPad L13 Yoga Gen 4',
      displayName: 'Lenovo ThinkPad L13 Yoga Gen 4 (2023)',
      brand: 'lenovo',
      category: 'laptop',
      year: 2023,
      slug: 'lenovo-thinkpad-l13-yoga-gen-4',
      image: '/images/devices/thinkpad-l13-yoga-gen-4.jpg',
      thumbnail: '/images/devices/thumbs/thinkpad-l13-yoga-gen-4.jpg',
      specifications: {
        screenSize: 13.3,
        screenType: 'FHD Touch IPS',
        processor: 'Intel Core i5/i7 13th Gen',
        memory: ['8GB', '16GB', '32GB'],
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Deep Black'],
        dimensions: { width: 310.0, height: 217.9, depth: 17.8 },
        weight: 1380
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'hinge', 'keyboard'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'hinge-tool']
      },
      averageRepairCost: 250,
      popularityScore: 75,
      supportedUntil: '2030-08-01',
      releaseDate: '2023-08-22'
    },

    // ASUS ROG Series (Gaming Laptops)
    {
      id: 'asus-rog-zephyrus-g16-2024',
      name: 'ASUS ROG Zephyrus G16',
      displayName: 'ASUS ROG Zephyrus G16 (2024)',
      brand: 'asus',
      category: 'laptop',
      year: 2024,
      slug: 'asus-rog-zephyrus-g16-2024',
      image: '/images/devices/asus-rog-zephyrus-g16-2024.jpg',
      thumbnail: '/images/devices/thumbs/asus-rog-zephyrus-g16-2024.jpg',
      specifications: {
        screenSize: 16.0,
        screenType: 'OLED 2.5K 240Hz',
        processor: 'Intel Core Ultra 9/AMD Ryzen 9',
        memory: ['16GB', '32GB'],
        storage: ['1TB', '2TB'],
        colors: ['Eclipse Gray', 'Platinum White'],
        dimensions: { width: 354.0, height: 246.0, depth: 15.9 },
        weight: 1850
      },
      repairability: {
        score: 5,
        complexity: 'very-high',
        commonParts: ['screen', 'battery', 'keyboard', 'cooling-system'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'thermal-paste']
      },
      averageRepairCost: 450,
      popularityScore: 80,
      supportedUntil: '2031-01-01',
      releaseDate: '2024-01-15'
    },
    {
      id: 'asus-rog-strix-g15-2023',
      name: 'ASUS ROG Strix G15',
      displayName: 'ASUS ROG Strix G15 (2023)',
      brand: 'asus',
      category: 'laptop',
      year: 2023,
      slug: 'asus-rog-strix-g15-2023',
      image: '/images/devices/asus-rog-strix-g15-2023.jpg',
      thumbnail: '/images/devices/thumbs/asus-rog-strix-g15-2023.jpg',
      specifications: {
        screenSize: 15.6,
        screenType: 'FHD 144Hz IPS',
        processor: 'AMD Ryzen 7/9 7000 Series',
        memory: ['8GB', '16GB', '32GB'],
        storage: ['512GB', '1TB'],
        colors: ['Eclipse Gray', 'Volt Green'],
        dimensions: { width: 354.9, height: 259.9, depth: 22.8 },
        weight: 2300
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'keyboard', 'fan'],
        specialTools: ['phillips-screwdriver', 'plastic-spudger', 'thermal-paste']
      },
      averageRepairCost: 320,
      popularityScore: 78,
      supportedUntil: '2030-07-01',
      releaseDate: '2023-07-10'
    },

    // Samsung Galaxy Phones (2020-2024)
    {
      id: 'samsung-galaxy-s24-ultra',
      name: 'Samsung Galaxy S24 Ultra',
      displayName: 'Samsung Galaxy S24 Ultra',
      brand: 'samsung',
      category: 'smartphone',
      year: 2024,
      slug: 'samsung-galaxy-s24-ultra',
      image: '/images/devices/galaxy-s24-ultra.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s24-ultra.jpg',
      specifications: {
        screenSize: 6.8,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
        dimensions: { width: 79.0, height: 162.3, depth: 8.6 },
        weight: 232
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 200,
      popularityScore: 90,
      supportedUntil: '2031-01-01',
      releaseDate: '2024-01-17'
    },
    {
      id: 'samsung-galaxy-s24-plus',
      name: 'Samsung Galaxy S24+',
      displayName: 'Samsung Galaxy S24+',
      brand: 'samsung',
      category: 'smartphone',
      year: 2024,
      slug: 'samsung-galaxy-s24-plus',
      image: '/images/devices/galaxy-s24-plus.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s24-plus.jpg',
      specifications: {
        screenSize: 6.7,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['256GB', '512GB'],
        colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
        dimensions: { width: 75.9, height: 158.5, depth: 7.7 },
        weight: 196
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 180,
      popularityScore: 85,
      supportedUntil: '2031-01-01',
      releaseDate: '2024-01-17'
    },
    {
      id: 'samsung-galaxy-s24',
      name: 'Samsung Galaxy S24',
      displayName: 'Samsung Galaxy S24',
      brand: 'samsung',
      category: 'smartphone',
      year: 2024,
      slug: 'samsung-galaxy-s24',
      image: '/images/devices/galaxy-s24.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s24.jpg',
      specifications: {
        screenSize: 6.2,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['128GB', '256GB'],
        colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
        dimensions: { width: 70.6, height: 147.0, depth: 7.6 },
        weight: 167
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 160,
      popularityScore: 80,
      supportedUntil: '2031-01-01',
      releaseDate: '2024-01-17'
    },
    
    // Samsung Galaxy S23 Series (2023)
    {
      id: 'samsung-galaxy-s23-ultra',
      name: 'Samsung Galaxy S23 Ultra',
      displayName: 'Samsung Galaxy S23 Ultra',
      brand: 'samsung',
      category: 'smartphone',
      year: 2023,
      slug: 'samsung-galaxy-s23-ultra',
      image: '/images/devices/galaxy-s23-ultra.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s23-ultra.jpg',
      specifications: {
        screenSize: 6.8,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Phantom Black', 'Green', 'Cream', 'Lavender'],
        dimensions: { width: 78.1, height: 163.4, depth: 8.9 },
        weight: 234
      },
      repairability: {
        score: 6,
        complexity: 'high',
        commonParts: ['screen', 'battery', 'camera', 'charging-port', 's-pen'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 190,
      popularityScore: 88,
      supportedUntil: '2030-02-01',
      releaseDate: '2023-02-17'
    },
    {
      id: 'samsung-galaxy-s23-plus',
      name: 'Samsung Galaxy S23+',
      displayName: 'Samsung Galaxy S23+',
      brand: 'samsung',
      category: 'smartphone',
      year: 2023,
      slug: 'samsung-galaxy-s23-plus',
      image: '/images/devices/galaxy-s23-plus.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s23-plus.jpg',
      specifications: {
        screenSize: 6.6,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['256GB', '512GB'],
        colors: ['Phantom Black', 'Green', 'Cream', 'Lavender'],
        dimensions: { width: 76.2, height: 157.8, depth: 7.6 },
        weight: 196
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 170,
      popularityScore: 82,
      supportedUntil: '2030-02-01',
      releaseDate: '2023-02-17'
    },
    {
      id: 'samsung-galaxy-s23',
      name: 'Samsung Galaxy S23',
      displayName: 'Samsung Galaxy S23',
      brand: 'samsung',
      category: 'smartphone',
      year: 2023,
      slug: 'samsung-galaxy-s23',
      image: '/images/devices/galaxy-s23.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s23.jpg',
      specifications: {
        screenSize: 6.1,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['128GB', '256GB'],
        colors: ['Phantom Black', 'Green', 'Cream', 'Lavender'],
        dimensions: { width: 70.9, height: 146.3, depth: 7.6 },
        weight: 168
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 150,
      popularityScore: 79,
      supportedUntil: '2030-02-01',
      releaseDate: '2023-02-17'
    },
    {
      id: 'samsung-galaxy-s23-fe',
      name: 'Samsung Galaxy S23 FE',
      displayName: 'Samsung Galaxy S23 FE',
      brand: 'samsung',
      category: 'smartphone',
      year: 2023,
      slug: 'samsung-galaxy-s23-fe',
      image: '/images/devices/galaxy-s23-fe.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-s23-fe.jpg',
      specifications: {
        screenSize: 6.4,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['128GB', '256GB'],
        colors: ['Mint', 'Cream', 'Graphite', 'Purple', 'Indigo', 'Tangerine'],
        dimensions: { width: 76.5, height: 158.0, depth: 8.2 },
        weight: 209
      },
      repairability: {
        score: 7,
        complexity: 'medium',
        commonParts: ['screen', 'battery', 'camera', 'charging-port'],
        specialTools: ['heat-gun', 'suction-cup', 'spudger']
      },
      averageRepairCost: 140,
      popularityScore: 75,
      supportedUntil: '2030-10-01',
      releaseDate: '2023-10-04'
    },

    // === TABLETS SECTION ===
    
    // Apple iPad Series (2018-2025)
    
    // iPad Pro 12.9-inch (M4, 2024)
    {
      id: 'ipad-pro-12-9-m4-2024',
      name: 'iPad Pro 12.9-inch (M4)',
      displayName: 'iPad Pro 12.9" (M4, 2024)',
      brand: 'apple',
      category: 'tablet',
      year: 2024,
      slug: 'ipad-pro-12-9-m4-2024',
      image: '/images/devices/ipad-pro-12-9-m4.jpg',
      thumbnail: '/images/devices/thumbs/ipad-pro-12-9-m4.jpg',
      specifications: {
        screenSize: 12.9,
        screenType: 'Liquid Retina XDR mini-LED',
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Silver', 'Space Gray'],
        processor: 'Apple M4',
        connectivity: ['Wi-Fi', 'Wi-Fi + Cellular']
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Battery drain', 'Camera issues'],
        difficulty: 'very-hard',
        avgRepairTime: 90,
        partAvailability: 'high'
      },
      popularityScore: 92,
      active: true
    },

    // iPad Pro 11-inch (M4, 2024)
    {
      id: 'ipad-pro-11-m4-2024',
      name: 'iPad Pro 11-inch (M4)',
      displayName: 'iPad Pro 11" (M4, 2024)',
      brand: 'apple',
      category: 'tablet',
      year: 2024,
      slug: 'ipad-pro-11-m4-2024',
      image: '/images/devices/ipad-pro-11-m4.jpg',
      thumbnail: '/images/devices/thumbs/ipad-pro-11-m4.jpg',
      specifications: {
        screenSize: 11.0,
        screenType: 'Liquid Retina OLED',
        storage: ['256GB', '512GB', '1TB', '2TB'],
        colors: ['Silver', 'Space Gray'],
        processor: 'Apple M4'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Battery issues'],
        difficulty: 'very-hard',
        avgRepairTime: 85,
        partAvailability: 'high'
      },
      popularityScore: 89,
      active: true
    },

    // iPad Air 13-inch (M2, 2024)
    {
      id: 'ipad-air-13-m2-2024',
      name: 'iPad Air 13-inch (M2)',
      displayName: 'iPad Air 13" (M2, 2024)',
      brand: 'apple',
      category: 'tablet',
      year: 2024,
      slug: 'ipad-air-13-m2-2024',
      image: '/images/devices/ipad-air-13-m2.jpg',
      thumbnail: '/images/devices/thumbs/ipad-air-13-m2.jpg',
      specifications: {
        screenSize: 13.0,
        screenType: 'Liquid Retina',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Blue', 'Purple', 'Starlight', 'Space Gray'],
        processor: 'Apple M2'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Volume buttons'],
        difficulty: 'hard',
        avgRepairTime: 75,
        partAvailability: 'high'
      },
      popularityScore: 85,
      active: true
    },

    // iPad Air 11-inch (M2, 2024)
    {
      id: 'ipad-air-11-m2-2024',
      name: 'iPad Air 11-inch (M2)',
      displayName: 'iPad Air 11" (M2, 2024)',
      brand: 'apple',
      category: 'tablet',
      year: 2024,
      slug: 'ipad-air-11-m2-2024',
      image: '/images/devices/ipad-air-11-m2.jpg',
      thumbnail: '/images/devices/thumbs/ipad-air-11-m2.jpg',
      specifications: {
        screenSize: 11.0,
        screenType: 'Liquid Retina',
        storage: ['128GB', '256GB', '512GB', '1TB'],
        colors: ['Blue', 'Purple', 'Starlight', 'Space Gray'],
        processor: 'Apple M2'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Battery drain'],
        difficulty: 'hard',
        avgRepairTime: 70,
        partAvailability: 'high'
      },
      popularityScore: 88,
      active: true
    },

    // iPad (10th generation, 2022)
    {
      id: 'ipad-10th-gen-2022',
      name: 'iPad (10th generation)',
      displayName: 'iPad (10th gen, 2022)',
      brand: 'apple',
      category: 'tablet',
      year: 2022,
      slug: 'ipad-10th-gen-2022',
      image: '/images/devices/ipad-10th-gen.jpg',
      thumbnail: '/images/devices/thumbs/ipad-10th-gen.jpg',
      specifications: {
        screenSize: 10.9,
        screenType: 'Liquid Retina',
        storage: ['64GB', '256GB'],
        colors: ['Silver', 'Blue', 'Pink', 'Yellow'],
        processor: 'Apple A14 Bionic'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Home button'],
        difficulty: 'medium',
        avgRepairTime: 60,
        partAvailability: 'high'
      },
      popularityScore: 82,
      active: true
    },

    // iPad mini (6th generation, 2021)
    {
      id: 'ipad-mini-6th-gen-2021',
      name: 'iPad mini (6th generation)',
      displayName: 'iPad mini (6th gen, 2021)',
      brand: 'apple',
      category: 'tablet',
      year: 2021,
      slug: 'ipad-mini-6th-gen-2021',
      image: '/images/devices/ipad-mini-6th-gen.jpg',
      thumbnail: '/images/devices/thumbs/ipad-mini-6th-gen.jpg',
      specifications: {
        screenSize: 8.3,
        screenType: 'Liquid Retina',
        storage: ['64GB', '256GB'],
        colors: ['Space Gray', 'Pink', 'Purple', 'Starlight'],
        processor: 'Apple A15 Bionic'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Volume buttons'],
        difficulty: 'medium',
        avgRepairTime: 50,
        partAvailability: 'good'
      },
      popularityScore: 78,
      active: true
    },

    // Samsung Galaxy Tab Series
    
    // Samsung Galaxy Tab S9 Ultra (2023)
    {
      id: 'samsung-galaxy-tab-s9-ultra',
      name: 'Samsung Galaxy Tab S9 Ultra',
      displayName: 'Galaxy Tab S9 Ultra',
      brand: 'samsung',
      category: 'tablet',
      year: 2023,
      slug: 'samsung-galaxy-tab-s9-ultra',
      image: '/images/devices/galaxy-tab-s9-ultra.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-tab-s9-ultra.jpg',
      specifications: {
        screenSize: 14.6,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Graphite', 'Beige', 'Cream'],
        processor: 'Snapdragon 8 Gen 2'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'S Pen issues'],
        difficulty: 'hard',
        avgRepairTime: 85,
        partAvailability: 'good'
      },
      popularityScore: 85,
      active: true
    },

    // Samsung Galaxy Tab S9+ (2023)
    {
      id: 'samsung-galaxy-tab-s9-plus',
      name: 'Samsung Galaxy Tab S9+',
      displayName: 'Galaxy Tab S9+',
      brand: 'samsung',
      category: 'tablet',
      year: 2023,
      slug: 'samsung-galaxy-tab-s9-plus',
      image: '/images/devices/galaxy-tab-s9-plus.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-tab-s9-plus.jpg',
      specifications: {
        screenSize: 12.4,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['256GB', '512GB'],
        colors: ['Graphite', 'Beige', 'Cream'],
        processor: 'Snapdragon 8 Gen 2'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Battery drain', 'Charging port'],
        difficulty: 'hard',
        avgRepairTime: 75,
        partAvailability: 'good'
      },
      popularityScore: 80,
      active: true
    },

    // Samsung Galaxy Tab S9 (2023)
    {
      id: 'samsung-galaxy-tab-s9',
      name: 'Samsung Galaxy Tab S9',
      displayName: 'Galaxy Tab S9',
      brand: 'samsung',
      category: 'tablet',
      year: 2023,
      slug: 'samsung-galaxy-tab-s9',
      image: '/images/devices/galaxy-tab-s9.jpg',
      thumbnail: '/images/devices/thumbs/galaxy-tab-s9.jpg',
      specifications: {
        screenSize: 11.0,
        screenType: 'Dynamic AMOLED 2X',
        storage: ['128GB', '256GB'],
        colors: ['Graphite', 'Beige', 'Cream'],
        processor: 'Snapdragon 8 Gen 2'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Power button'],
        difficulty: 'medium',
        avgRepairTime: 65,
        partAvailability: 'good'
      },
      popularityScore: 78,
      active: true
    },

    // Microsoft Surface Series
    
    // Microsoft Surface Pro 11 (2024)
    {
      id: 'microsoft-surface-pro-11',
      name: 'Microsoft Surface Pro 11',
      displayName: 'Surface Pro 11',
      brand: 'microsoft',
      category: 'tablet',
      year: 2024,
      slug: 'microsoft-surface-pro-11',
      image: '/images/devices/surface-pro-11.jpg',
      thumbnail: '/images/devices/thumbs/surface-pro-11.jpg',
      specifications: {
        screenSize: 13.0,
        screenType: 'PixelSense Flow',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Platinum', 'Graphite', 'Sapphire', 'Dune'],
        processor: 'Snapdragon X Elite'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Kickstand issues', 'Type Cover connector'],
        difficulty: 'very-hard',
        avgRepairTime: 120,
        partAvailability: 'fair'
      },
      popularityScore: 72,
      active: true
    },

    // Microsoft Surface Pro 10 (2024)
    {
      id: 'microsoft-surface-pro-10',
      name: 'Microsoft Surface Pro 10',
      displayName: 'Surface Pro 10',
      brand: 'microsoft',
      category: 'tablet',
      year: 2024,
      slug: 'microsoft-surface-pro-10',
      image: '/images/devices/surface-pro-10.jpg',
      thumbnail: '/images/devices/thumbs/surface-pro-10.jpg',
      specifications: {
        screenSize: 13.0,
        screenType: 'PixelSense Flow',
        storage: ['256GB', '512GB', '1TB'],
        colors: ['Platinum', 'Black'],
        processor: 'Intel Core Ultra 5/7'
      },
      repairData: {
        commonIssues: ['Screen damage', 'Charging port', 'Kickstand'],
        difficulty: 'very-hard',
        avgRepairTime: 110,
        partAvailability: 'fair'
      },
      popularityScore: 75,
      active: true
    },

    // Microsoft Surface Laptop Studio 2 (2023)
    {
      id: 'microsoft-surface-laptop-studio-2',
      name: 'Microsoft Surface Laptop Studio 2',
      displayName: 'Surface Laptop Studio 2',
      brand: 'microsoft',
      category: 'tablet',
      year: 2023,
      slug: 'microsoft-surface-laptop-studio-2',
      image: '/images/devices/surface-laptop-studio-2.jpg',
      thumbnail: '/images/devices/thumbs/surface-laptop-studio-2.jpg',
      specifications: {
        screenSize: 14.4,
        screenType: 'PixelSense Flow',
        storage: ['512GB', '1TB', '2TB'],
        colors: ['Platinum'],
        processor: 'Intel Core i7 13th Gen'
      },
      repairData: {
        commonIssues: ['Hinge mechanism', 'Screen damage', 'Thermal issues'],
        difficulty: 'very-hard',
        avgRepairTime: 150,
        partAvailability: 'poor'
      },
      popularityScore: 68,
      active: true
    }
  ],
  
  commonIssues: [
    {
      id: 'screen-damage',
      name: 'Screen Damage',
      slug: 'screen-damage',
      category: 'display',
      description: 'Cracked, shattered, or unresponsive screen',
      symptoms: ['Visible cracks', 'Black spots', 'Unresponsive touch', 'Flickering display'],
      severity: 'high',
      urgency: 'medium',
      averageRepairTime: 60,
      successRate: 95,
      costMultiplier: 1.0,
      commonCauses: ['Drops', 'Impact', 'Pressure', 'Manufacturing defect'],
      preventionTips: ['Use screen protector', 'Use protective case', 'Avoid pressure', 'Handle with care']
    },
    {
      id: 'battery-issues',
      name: 'Battery Issues',
      slug: 'battery-issues',
      category: 'power',
      description: 'Battery not holding charge or draining quickly',
      symptoms: ['Quick discharge', 'Won\'t charge', 'Overheating', 'Swollen battery'],
      severity: 'medium',
      urgency: 'medium',
      averageRepairTime: 45,
      successRate: 98,
      costMultiplier: 0.8,
      commonCauses: ['Age', 'Overcharging', 'Heat exposure', 'Manufacturing defect'],
      preventionTips: ['Avoid overcharging', 'Keep device cool', 'Use original charger', 'Regular maintenance']
    },
    {
      id: 'charging-port',
      name: 'Charging Port Issues',
      slug: 'charging-port',
      category: 'connectivity',
      description: 'Device not charging or connection issues',
      symptoms: ['Won\'t charge', 'Loose connection', 'Intermittent charging', 'No connection'],
      severity: 'medium',
      urgency: 'high',
      averageRepairTime: 30,
      successRate: 90,
      costMultiplier: 0.6,
      commonCauses: ['Debris', 'Wear', 'Liquid damage', 'Poor cable quality'],
      preventionTips: ['Keep port clean', 'Use quality cables', 'Avoid moisture', 'Gentle insertion']
    },
    {
      id: 'camera-issues',
      name: 'Camera Problems',
      slug: 'camera-issues',
      category: 'multimedia',
      description: 'Camera not working or producing poor quality images',
      symptoms: ['Black screen', 'Blurry images', 'Focus issues', 'Camera app crashes'],
      severity: 'low',
      urgency: 'low',
      averageRepairTime: 40,
      successRate: 85,
      costMultiplier: 0.9,
      commonCauses: ['Impact damage', 'Moisture', 'Software issues', 'Lens damage'],
      preventionTips: ['Use lens protection', 'Keep clean', 'Avoid moisture', 'Handle carefully']
    },
    {
      id: 'liquid-damage',
      name: 'Liquid Damage',
      slug: 'liquid-damage',
      category: 'physical',
      description: 'Device exposed to water or other liquids',
      symptoms: ['Not turning on', 'Erratic behavior', 'Corrosion', 'Screen issues'],
      severity: 'high',
      urgency: 'urgent',
      averageRepairTime: 120,
      successRate: 70,
      costMultiplier: 1.5,
      commonCauses: ['Water exposure', 'Spills', 'Rain', 'Humidity'],
      preventionTips: ['Use waterproof case', 'Keep away from liquids', 'Quick response', 'Professional help']
    }
  ],
  
  repairPricing: {
    basePricing: {
      'screen-damage': {
        smartphone: { min: 49, max: 199 },
        laptop: { min: 99, max: 399 },
        tablet: { min: 79, max: 299 }
      },
      'battery-issues': {
        smartphone: { min: 29, max: 79 },
        laptop: { min: 89, max: 199 },
        tablet: { min: 49, max: 99 }
      },
      'charging-port': {
        smartphone: { min: 39, max: 89 },
        laptop: { min: 49, max: 129 },
        tablet: { min: 39, max: 79 }
      },
      'camera-issues': {
        smartphone: { min: 39, max: 129 },
        laptop: { min: 59, max: 159 },
        tablet: { min: 49, max: 99 }
      },
      'liquid-damage': {
        smartphone: { min: 79, max: 199 },
        laptop: { min: 149, max: 399 },
        tablet: { min: 99, max: 249 }
      }
    },
    
    modifiers: {
      brand: {
        apple: 1.2,
        samsung: 1.1,
        google: 1.0,
        oneplus: 0.9,
        huawei: 0.8,
        xiaomi: 0.7
      },
      
      deviceAge: {
        'under-1': 1.3,
        '1-2': 1.2,
        '2-3': 1.0,
        '3-5': 0.9,
        'over-5': 0.8
      },
      
      urgency: {
        standard: 1.0,
        priority: 1.25,
        emergency: 1.5
      },
      
      parts: {
        original: 1.3,
        aftermarket: 1.0
      }
    }
  },
  
  searchIndex: {
    fields: ['name', 'displayName', 'brand', 'category', 'year'],
    weights: {
      name: 5,
      displayName: 4,
      brand: 3,
      category: 2,
      year: 1
    },
    fuzzyThreshold: 0.6
  },
  
  filters: {
    brand: {
      type: 'multiselect',
      options: 'brands',
      label: 'Brand'
    },
    category: {
      type: 'multiselect',
      options: 'categories',
      label: 'Device Type'
    },
    year: {
      type: 'range',
      min: 2016,
      max: 2024,
      label: 'Release Year'
    },
    repairComplexity: {
      type: 'select',
      options: ['low', 'medium', 'high', 'very-high'],
      label: 'Repair Complexity'
    }
  }
};

export default deviceDatabaseConfig;