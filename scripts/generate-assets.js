const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'assets', 'logo.png');
const iconPath = path.join(root, 'assets', 'icon.png');
const adaptiveIconPath = path.join(root, 'assets', 'adaptive-icon.png');
const splashPath = path.join(root, 'assets', 'splash.png');

console.log('Generating crisp app icons and splash from official logo...');

// 1. Generate assets/icon.png (1024x1024) with #ffffff background and centered logo
execSync(
  `magick -size 1024x1024 xc:"#ffffff" \\( "${logoPath}" -resize 760x760 \\) -gravity center -composite "${iconPath}"`
);

// 2. Generate assets/adaptive-icon.png (1024x1024) foreground with transparency
execSync(
  `magick -size 1024x1024 xc:none \\( "${logoPath}" -resize 650x650 \\) -gravity center -composite "${adaptiveIconPath}"`
);

// 3. Generate assets/splash.png (1284x2778) for high-res splash
execSync(
  `magick -size 1284x2778 xc:"#ffffff" \\( "${logoPath}" -resize 550x550 \\) -gravity center -geometry +0-120 -composite "${splashPath}"`
);

// 4. Generate Android Mipmap Icons
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');

mipmaps.forEach(({ dir, size, fgSize }) => {
  const targetDir = path.join(resDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // ic_launcher.webp & ic_launcher_round.webp (Square with rounded background or circular)
  const fullIconPath = path.join(targetDir, 'ic_launcher.webp');
  const roundIconPath = path.join(targetDir, 'ic_launcher_round.webp');
  const fgIconPath = path.join(targetDir, 'ic_launcher_foreground.webp');

  const logoSize = Math.round(size * 0.74);
  const fgLogoSize = Math.round(fgSize * 0.65);

  // Full icon on #ffffff
  execSync(
    `magick -size ${size}x${size} xc:"#ffffff" \\( "${logoPath}" -resize ${logoSize}x${logoSize} \\) -gravity center -composite "${fullIconPath}"`
  );

  // Round icon on #ffffff with circular mask
  execSync(
    `magick -size ${size}x${size} xc:"#ffffff" \\( "${logoPath}" -resize ${logoSize}x${logoSize} \\) -gravity center -composite \\( -size ${size}x${size} xc:none -fill white -draw "circle ${size/2},${size/2} ${size/2},1" \\) -alpha set -compose DstIn -composite "${roundIconPath}"`
  );

  // Foreground icon (transparent) for adaptive icon
  execSync(
    `magick -size ${fgSize}x${fgSize} xc:none \\( "${logoPath}" -resize ${fgLogoSize}x${fgLogoSize} \\) -gravity center -composite "${fgIconPath}"`
  );
});

// 5. Generate Android Splashscreen Drawables
const splashDrawables = [
  { dir: 'drawable-mdpi', size: 288 },
  { dir: 'drawable-hdpi', size: 432 },
  { dir: 'drawable-xhdpi', size: 576 },
  { dir: 'drawable-xxhdpi', size: 864 },
  { dir: 'drawable-xxxhdpi', size: 1152 },
];

splashDrawables.forEach(({ dir, size }) => {
  const targetDir = path.join(resDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const splashLogoFile = path.join(targetDir, 'splashscreen_logo.png');
  const targetLogoSize = Math.round(size * 0.6);
  execSync(
    `magick -size ${size}x${size} xc:"#ffffff" \\( "${logoPath}" -resize ${targetLogoSize}x${targetLogoSize} \\) -gravity center -composite "${splashLogoFile}"`
  );
});

console.log('✅ Generated all Android launcher icons and adaptive foregrounds successfully.');
