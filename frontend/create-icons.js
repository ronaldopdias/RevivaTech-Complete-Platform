const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for RevivaTech
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#ADD8E6" rx="${size * 0.1}"/>
  <circle cx="${size * 0.5}" cy="${size * 0.35}" r="${size * 0.15}" fill="white"/>
  <rect x="${size * 0.3}" y="${size * 0.55}" width="${size * 0.4}" height="${size * 0.25}" fill="white" rx="${size * 0.02}"/>
  <rect x="${size * 0.35}" y="${size * 0.6}" width="${size * 0.3}" height="${size * 0.02}" fill="#4A9FCC"/>
  <rect x="${size * 0.35}" y="${size * 0.65}" width="${size * 0.25}" height="${size * 0.02}" fill="#4A9FCC"/>
  <rect x="${size * 0.35}" y="${size * 0.7}" width="${size * 0.2}" height="${size * 0.02}" fill="#4A9FCC"/>
  <text x="${size * 0.5}" y="${size * 0.9}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold">R</text>
</svg>
`;

// Create SVG files for different sizes
const sizes = [144, 192, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created ${svgPath}`);
});

console.log('SVG icons created successfully!');
console.log('Note: For production, convert these SVG files to PNG using an image converter.');