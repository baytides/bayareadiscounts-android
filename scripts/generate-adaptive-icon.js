#!/usr/bin/env node
/**
 * Generate Android Adaptive Icon Foreground
 *
 * Android adaptive icons mask the foreground image, clipping approximately
 * 17% from each edge. This script creates a foreground image with the logo
 * properly scaled and centered within the safe zone.
 *
 * Safe zone: center 66% of the image (72% scale factor with centering)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_ICON = path.join(__dirname, '../assets/images/favicons/web-app-manifest-512x512.png');
const OUTPUT_FOREGROUND = path.join(__dirname, '../assets/images/favicons/adaptive-icon-foreground.png');

// Android adaptive icon safe zone is approximately 66% of the total area
// To be safe, we scale the logo to 66% and center it
const OUTPUT_SIZE = 512;
const SAFE_ZONE_RATIO = 0.66;
const LOGO_SIZE = Math.round(OUTPUT_SIZE * SAFE_ZONE_RATIO); // ~338px

async function generateAdaptiveIcon() {
  try {
    console.log('🎨 Generating Android adaptive icon foreground...\n');

    // Read the original icon and resize it to fit the safe zone
    const resizedLogo = await sharp(INPUT_ICON)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    // Calculate padding to center the logo
    const padding = Math.round((OUTPUT_SIZE - LOGO_SIZE) / 2);

    // Create a new 512x512 transparent canvas and composite the resized logo in the center
    await sharp({
      create: {
        width: OUTPUT_SIZE,
        height: OUTPUT_SIZE,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
    .composite([{
      input: resizedLogo,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(OUTPUT_FOREGROUND);

    console.log(`✅ Generated adaptive icon foreground: ${OUTPUT_FOREGROUND}`);
    console.log(`   Original size: 512x512`);
    console.log(`   Logo scaled to: ${LOGO_SIZE}x${LOGO_SIZE} (${Math.round(SAFE_ZONE_RATIO * 100)}%)`);
    console.log(`   Padding: ${padding}px on each side`);
    console.log('\n📝 Update app.json to use this file for adaptiveIcon.foregroundImage');

  } catch (error) {
    console.error('❌ Error generating adaptive icon:', error.message);
    process.exit(1);
  }
}

generateAdaptiveIcon();
