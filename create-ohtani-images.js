// Script to create placeholder Ohtani images
const fs = require('fs');
const path = require('path');

// Create SVG placeholder images of Ohtani
const createOhtaniSVG = (variant) => {
  const colors = {
    1: { bg: '#1e3a8a', uniform: '#ffffff', accent: '#ef4444' }, // Blue uniform
    2: { bg: '#dc2626', uniform: '#ffffff', accent: '#1e3a8a' }, // Red uniform  
    3: { bg: '#059669', uniform: '#ffffff', accent: '#f59e0b' }  // Green uniform
  };
  
  const color = colors[variant] || colors[1];
  
  return `
<svg width="400" height="500" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${variant}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="face${variant}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#1f2937;stop-opacity:0.1" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="500" fill="url(#bg${variant})"/>
  
  <!-- Baseball diamond pattern -->
  <path d="M200 50 L350 200 L200 350 L50 200 Z" fill="none" stroke="${color.accent}" stroke-width="2" opacity="0.3"/>
  
  <!-- Player silhouette -->
  <g transform="translate(200, 250)">
    <!-- Head -->
    <circle cx="0" cy="-80" r="40" fill="#4a5568" opacity="0.8"/>
    
    <!-- Body -->
    <rect x="-35" y="-40" width="70" height="120" rx="10" fill="${color.uniform}" opacity="0.9"/>
    
    <!-- Jersey number -->
    <text x="0" y="0" text-anchor="middle" fill="${color.bg}" font-family="Arial Black" font-size="36" font-weight="bold">17</text>
    
    <!-- Arms -->
    <ellipse cx="-50" cy="-20" rx="15" ry="50" fill="${color.uniform}" opacity="0.9" transform="rotate(-20)"/>
    <ellipse cx="50" cy="-20" rx="15" ry="50" fill="${color.uniform}" opacity="0.9" transform="rotate(20)"/>
    
    <!-- Baseball bat -->
    <rect x="60" y="-60" width="6" height="80" fill="#8b4513" opacity="0.9" transform="rotate(45)"/>
    
    <!-- Baseball -->
    <circle cx="80" cy="-40" r="8" fill="white" opacity="0.9"/>
    <path d="M75 -40 Q80 -35 85 -40" stroke="red" stroke-width="1" fill="none"/>
    <path d="M75 -40 Q80 -45 85 -40" stroke="red" stroke-width="1" fill="none"/>
    
    <!-- Legs -->
    <rect x="-25" y="80" width="20" height="60" rx="10" fill="${color.bg}" opacity="0.8"/>
    <rect x="5" y="80" width="20" height="60" rx="10" fill="${color.bg}" opacity="0.8"/>
  </g>
  
  <!-- Baseball elements -->
  <circle cx="50" cy="100" r="15" fill="white" opacity="0.6"/>
  <path d="M40 100 Q50 90 60 100" stroke="red" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M40 100 Q50 110 60 100" stroke="red" stroke-width="2" fill="none" opacity="0.6"/>
  
  <circle cx="350" cy="400" r="12" fill="white" opacity="0.6"/>
  <path d="M342 400 Q350 392 358 400" stroke="red" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M342 400 Q350 408 358 400" stroke="red" stroke-width="1.5" fill="none" opacity="0.6"/>
  
  <!-- Inspirational elements -->
  <text x="200" y="450" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold" opacity="0.8">SHOHEI OHTANI</text>
  <text x="200" y="475" text-anchor="middle" fill="${color.accent}" font-family="Arial" font-size="14" font-weight="bold">二刀流</text>
</svg>`;
};

// Create assets/ohtani directory
const ohtaniDir = path.join(__dirname, 'assets', 'ohtani');
if (!fs.existsSync(ohtaniDir)) {
  fs.mkdirSync(ohtaniDir, { recursive: true });
}

// Create 3 different Ohtani SVG images
for (let i = 1; i <= 3; i++) {
  const svgContent = createOhtaniSVG(i);
  fs.writeFileSync(path.join(ohtaniDir, `ohtani-${i}.svg`), svgContent.trim());
  console.log(`Created ohtani-${i}.svg`);
}

// Create a simple conversion note
const conversionNote = `
# 大谷翔平画像について

現在、SVGプレースホルダーが作成されています。

## 実際の画像を使用する場合：

1. 大谷翔平の公式写真またはライセンスフリー画像を取得
2. 以下のファイルを置き換え：
   - ohtani-1.jpg (ドジャース戦での活躍)
   - ohtani-2.jpg (エンゼルス時代の写真) 
   - ohtani-3.jpg (WBC時の写真)

## 推奨サイズ：
- 幅: 400px
- 高さ: 500px
- フォーマット: JPG または PNG

## 注意：
著作権を遵守し、適切なライセンスの画像のみを使用してください。
`;

fs.writeFileSync(path.join(ohtaniDir, 'README.md'), conversionNote.trim());

console.log('\n大谷翔平のSVGプレースホルダー画像を作成しました！');
console.log('実際の写真に置き換える場合は、assets/ohtani/README.md をご確認ください。');