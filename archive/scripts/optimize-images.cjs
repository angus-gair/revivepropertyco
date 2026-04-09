#!/usr/bin/env node
/**
 * Image Optimization Script
 * Compresses images and creates WebP versions for better performance
 */

const fs = require('fs');
const path = require('path');

// Dynamic import of sharp
async function optimizeImages() {
  const sharp = (await import('sharp')).default;

  const images = [
    { input: 'public/angus.png', quality: 80, maxSize: 200 },
    { input: 'public/family.png', quality: 80, maxSize: 200 },
    { input: 'public/og-image.jpg', quality: 85, maxSize: 100 },
  ];

  console.log('Optimizing images...\n');

  for (const img of images) {
    const inputPath = path.join(__dirname, img.input);
    const inputName = path.basename(img.input, path.extname(img.input));

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${img.input} - not found`);
      continue;
    }

    try {
      // Get original size
      const originalSize = fs.statSync(inputPath).size / 1024;
      console.log(`Processing ${inputName}...`);

      // Optimize original (overwrite with compressed version)
      await sharp(inputPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: img.quality, mozjpeg: true })
        .toFile(inputPath + '.tmp');

      fs.renameSync(inputPath + '.tmp', inputPath.replace(/\.(png|jpg)$/, '.jpg'));

      const newSize = fs.statSync(inputPath.replace(/\.(png|jpg)$/, '.jpg')) / 1024;
      const savings = ((originalSize - newSize) / originalSize * 100).toFixed(0);

      console.log(`  ✓ Optimized: ${originalSize.toFixed(0)}KB → ${newSize.toFixed(0)}KB (${savings}% reduction)`);

      // Create WebP version
      const webpPath = path.join(path.dirname(inputPath), inputName + '.webp');
      await sharp(inputPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: img.quality - 5 })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size / 1024;
      console.log(`  ✓ WebP: ${webpSize.toFixed(0)}KB`);

    } catch (error) {
      console.error(`  ✗ Error processing ${img.input}:`, error.message);
    }
  }

  console.log('\n✅ Image optimization complete!');
}

optimizeImages().catch(console.error);
