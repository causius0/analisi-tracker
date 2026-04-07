#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates app icons for all required sizes from a single source image
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Favicon sizes
const FAVICON_SIZES = [16, 32, 48];

// Apple Touch Icon size
const APPLE_ICON_SIZE = 180;

// Path configuration
const CLIENT_PUBLIC_DIR = path.join(__dirname, '../client/public');
const ICONS_DIR = path.join(CLIENT_PUBLIC_DIR, 'icons');
const SCREENSHOTS_DIR = path.join(CLIENT_PUBLIC_DIR, 'screenshots');

/**
 * Create a simple SVG icon as base
 * This creates a medical-themed icon with a chart/graph design
 */
function generateSVGIcon(size) {
  const colors = {
    primary: '#0d9488',
    secondary: '#f59e0b',
    background: '#ffffff'
  };

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="${colors.background}" rx="${size * 0.15}"/>

      <!-- Medical cross (simplified) -->
      <g transform="translate(${size * 0.1}, ${size * 0.1})">
        <!-- Chart bars -->
        <rect x="${size * 0.25}" y="${size * 0.45}" width="${size * 0.08}" height="${size * 0.35}" fill="${colors.primary}" rx="${size * 0.02}"/>
        <rect x="${size * 0.38}" y="${size * 0.35}" width="${size * 0.08}" height="${size * 0.45}" fill="${colors.primary}" rx="${size * 0.02}"/>
        <rect x="${size * 0.51}" y="${size * 0.25}" width="${size * 0.08}" height="${size * 0.55}" fill="${colors.primary}" rx="${size * 0.02}"/>
        <rect x="${size * 0.64}" y="${size * 0.15}" width="${size * 0.08}" height="${size * 0.65}" fill="${colors.primary}" rx="${size * 0.02}"/>

        <!-- Trend line -->
        <polyline
          points="${size * 0.29},${size * 0.5} ${size * 0.42},${size * 0.4} ${size * 0.55},${size * 0.3} ${size * 0.68},${size * 0.2}"
          fill="none"
          stroke="${colors.secondary}"
          stroke-width="${size * 0.03}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data points -->
        <circle cx="${size * 0.29}" cy="${size * 0.5}" r="${size * 0.025}" fill="${colors.secondary}"/>
        <circle cx="${size * 0.42}" cy="${size * 0.4}" r="${size * 0.025}" fill="${colors.secondary}"/>
        <circle cx="${size * 0.55}" cy="${size * 0.3}" r="${size * 0.025}" fill="${colors.secondary}"/>
        <circle cx="${size * 0.68}" cy="${size * 0.2}" r="${size * 0.025}" fill="${colors.secondary}"/>
      </g>
    </svg>
  `;
}

/**
 * Generate favicon.ico with multiple sizes
 * Note: This creates a simple placeholder. For production, use a real image
 */
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Create directories
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Generate PNG icons
  console.log('📱 Generating PNG icons...');
  for (const size of ICON_SIZES) {
    const svg = generateSVGIcon(size);
    const filename = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

    // Save as SVG first (can be converted to PNG using external tools)
    const svgFilename = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgFilename, svg);

    console.log(`  ✅ Generated icon-${size}x${size}.svg`);
    console.log(`  ⚠️  Convert ${svgFilename} to PNG using: convert icon-${size}x${size}.svg icon-${size}x${size}.png`);
  }

  // Generate favicon SVG
  console.log('\n🔖 Generating favicons...');
  for (const size of FAVICON_SIZES) {
    const svg = generateSVGIcon(size);
    const filename = path.join(CLIENT_PUBLIC_DIR, `favicon-${size}x${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`  ✅ Generated favicon-${size}x${size}.svg`);
  }

  // Generate Apple Touch Icon
  console.log('\n🍎 Generating Apple Touch Icon...');
  const appleIconSVG = generateSVGIcon(APPLE_ICON_SIZE);
  const appleIconPath = path.join(CLIENT_PUBLIC_DIR, 'apple-touch-icon.svg');
  fs.writeFileSync(appleIconPath, appleIconSVG);
  console.log(`  ✅ Generated apple-touch-icon.svg`);

  // Generate favicon.ico (SVG format)
  const faviconSVG = generateSVGIcon(32);
  fs.writeFileSync(path.join(CLIENT_PUBLIC_DIR, 'favicon.ico'), faviconSVG);
  console.log(`  ✅ Generated favicon.ico`);

  console.log('\n✨ Icon generation complete!\n');
  console.log('📋 Next steps:');
  console.log('1. Install ImageMagick: brew install imagemagick (Mac)');
  console.log('2. Convert SVG to PNG: cd client/public/icons && for f in *.svg; do convert "$f" "${f%.svg}.png"; done');
  console.log('3. Or use an online tool: https://realfavicongenerator.net/');
  console.log('\n💡 For best results, use a professional icon designer');
}

/**
 * Generate placeholder screenshots for app store
 */
function generateScreenshotPlaceholder() {
  console.log('\n📸 Creating screenshot placeholders...');

  const screenshotHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screenshot Placeholder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .phone-frame {
      background: white;
      border-radius: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 390px;
      height: 844px;
      overflow: hidden;
    }
    .status-bar {
      background: #0d9488;
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 600;
    }
    .content {
      padding: 20px;
    }
    h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 10px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="phone-frame">
    <div class="status-bar">
      <span>9:41</span>
      <span>Analisi Tracker</span>
      <span>🔋</span>
    </div>
    <div class="content">
      <h1>Your Lab Results</h1>
      <p>Track your health with advanced analytics and insights</p>
    </div>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'dashboard-mobile.html'),
    screenshotHTML
  );

  console.log('  ✅ Created screenshot placeholder (HTML)');
  console.log('  ⚠️  Take actual screenshots using:');
  console.log('     - Chrome DevTools device emulation');
  console.log('     - Real device screenshot');
  console.log('     - BrowserStack or similar service');
}

// Run generation
generateIcons()
  .then(() => {
    generateScreenshotPlaceholder();
    console.log('\n🎉 All done!\n');
  })
  .catch((error) => {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  });

export { generateIcons, generateSVGIcon };
