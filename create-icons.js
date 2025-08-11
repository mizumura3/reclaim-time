// Script to create icon files for the extension
const fs = require('fs');
const path = require('path');

// Simple SVG icon (clock with prohibition sign)
const svgIcon = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
  
  <!-- Clock face -->
  <circle cx="64" cy="64" r="45" fill="white" opacity="0.9"/>
  
  <!-- Clock hands -->
  <line x1="64" y1="64" x2="64" y2="35" stroke="#333" stroke-width="4" stroke-linecap="round"/>
  <line x1="64" y1="64" x2="80" y2="64" stroke="#333" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Center dot -->
  <circle cx="64" cy="64" r="4" fill="#333"/>
  
  <!-- Hour marks -->
  <circle cx="64" cy="24" r="2" fill="#666"/>
  <circle cx="104" cy="64" r="2" fill="#666"/>
  <circle cx="64" cy="104" r="2" fill="#666"/>
  <circle cx="24" cy="64" r="2" fill="#666"/>
</svg>
`;

// Create assets/icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save SVG file
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon.trim());

console.log('SVG icon created successfully!');
console.log('To convert to PNG, you can use an online converter or image editing software.');
console.log('Required sizes: 16x16, 48x48, 128x128');
console.log('\nFor now, creating placeholder PNG files...');

// Create simple placeholder for PNG files (these should be replaced with actual PNGs)
const createPlaceholderPNG = (size) => {
  // This is a very simple 1x1 transparent PNG
  // In production, you should use proper image conversion tools
  const buffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
};

// Create placeholder PNG files
[16, 48, 128].forEach(size => {
  createPlaceholderPNG(size);
  console.log(`Created placeholder icon${size}.png`);
});

console.log('\nNote: The PNG files are placeholders. Please convert the SVG to proper PNG files for the extension to display icons correctly.');