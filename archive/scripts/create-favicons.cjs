#!/usr/bin/env node
/**
 * Create favicon files from SVG source
 */

const fs = require('fs');
const path = require('path');

async function createFavicons() {
  const sharp = (await import('sharp')).default;

  // SVG source for favicon
  const svgBuffer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#121212"/>
    <text x="50" y="68" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="#FDFCFB">R</text>
    <rect x="20" y="80" width="60" height="4" fill="#36453B"/>
  </svg>`);

  console.log('Creating favicons...\n');

  // Create favicon.ico (32x32 and 16x16)
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile('public/favicon-32.png');

    await sharp(svgBuffer)
      .resize(16, 16)
      .toFile('public/favicon-16.png');

    // Create ICO file (simple PNG-based ICO)
    const png32 = fs.readFileSync('public/favicon-32.png');
    const png16 = fs.readFileSync('public/favicon-16.png');

    // ICO file structure
    const ICONDIR = {
      reserved: 0,
      type: 1, // 1 = ICO
      count: 2
    };

    const ICONDIRENTRY = [
      { width: 32, height: 32, colors: 0, reserved: 0, planes: 1, bpp: 32, size: png32.length, offset: 6 + 16 * 2 },
      { width: 16, height: 16, colors: 0, reserved: 0, planes: 1, bpp: 32, size: png16.length, offset: 6 + 16 * 2 + png32.length }
    ];

    const ico = Buffer.allocUnsafe(6 + 16 * 2 + png32.length + png16.length);

    let offset = 0;
    ico.writeUInt16LE(ICONDIR.reserved, offset); offset += 2;
    ico.writeUInt16LE(ICONDIR.type, offset); offset += 2;
    ico.writeUInt16LE(ICONDIR.count, offset); offset += 2;

    for (let i = 0; i < ICONDIRENTRY.length; i++) {
      const entry = ICONDIRENTRY[i];
      ico.writeUInt8(entry.width, offset); offset += 1;
      ico.writeUInt8(entry.height, offset); offset += 1;
      ico.writeUInt8(entry.colors, offset); offset += 1;
      ico.writeUInt8(entry.reserved, offset); offset += 1;
      ico.writeUInt16LE(entry.planes, offset); offset += 2;
      ico.writeUInt16LE(entry.bpp, offset); offset += 2;
      ico.writeUInt32LE(entry.size, offset); offset += 4;
      ico.writeUInt32LE(entry.offset, offset); offset += 4;
    }

    png32.copy(ico, offset); offset += png32.length;
    png16.copy(ico, offset);

    fs.writeFileSync('public/favicon.ico', ico);
    console.log('✓ Created public/favicon.ico');

    // Clean up temp files
    fs.unlinkSync('public/favicon-32.png');
    fs.unlinkSync('public/favicon-16.png');

  } catch (error) {
    console.error('Error creating favicon.ico:', error.message);
  }

  // Create apple-touch-icon.png (180x180)
  try {
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');

    const size = fs.statSync('public/apple-touch-icon.png').size;
    console.log(`✓ Created public/apple-touch-icon.png (${(size / 1024).toFixed(1)}KB)`);

  } catch (error) {
    console.error('Error creating apple-touch-icon.png:', error.message);
  }

  console.log('\n✅ Favicons created!');
}

createFavicons().catch(console.error);
