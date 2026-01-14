#!/usr/bin/env node

/**
 * PWA Icon Generator for Second Brain AI
 * 
 * This script generates PNG icons from the SVG source.
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requirements:
 * - Node.js 18+
 * - sharp (optional, for high-quality PNG conversion)
 * 
 * If sharp is not installed, the script will provide alternative instructions.
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'src', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Check if sharp is available
async function tryGenerateWithSharp() {
  try {
    const sharp = require('sharp');
    
    console.log('✅ sharp знайдено, генерую PNG іконки...\n');
    
    const sizes = [192, 512];
    const variants = [
      { suffix: '', svg: 'icon.svg' },
      { suffix: '-maskable', svg: 'icon-maskable.svg' }
    ];
    
    for (const size of sizes) {
      for (const variant of variants) {
        const svgPath = path.join(ICONS_DIR, variant.svg);
        const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}${variant.suffix}.png`);
        
        if (!fs.existsSync(svgPath)) {
          console.log(`⚠️  SVG не знайдено: ${variant.svg}`);
          continue;
        }
        
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);
        
        console.log(`✅ Створено: icon-${size}x${size}${variant.suffix}.png`);
      }
    }
    
    console.log('\n🎉 Всі іконки успішно згенеровані!');
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return false;
    }
    throw error;
  }
}

// Generate simple fallback icons using canvas-like approach
function generateFallbackInstructions() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🧠 Second Brain AI - PWA Icon Generator           ║
╚════════════════════════════════════════════════════════════╝

Sharp не встановлено. Є кілька варіантів для створення іконок:

📌 Варіант 1: Встановити sharp (рекомендовано)
   npm install sharp --save-dev
   node scripts/generate-icons.js

📌 Варіант 2: Використати браузерний генератор
   1. Запустіть сервер: npm start
   2. Відкрийте: http://localhost:3000/icons/generate-icons.html
   3. Завантажте всі 4 іконки
   4. Збережіть в src/public/icons/

📌 Варіант 3: Використати онлайн конвертер
   1. Відкрийте icon.svg та icon-maskable.svg в браузері
   2. Використайте https://cloudconvert.com/svg-to-png
   3. Конвертуйте кожен SVG в 192x192 та 512x512 PNG
   4. Перейменуйте файли:
      - icon-192x192.png
      - icon-192x192-maskable.png  
      - icon-512x512.png
      - icon-512x512-maskable.png
   5. Збережіть в src/public/icons/

📌 Варіант 4: Швидкий старт (emoji-based icons)
   Для швидкого тестування PWA, можна тимчасово використати
   простіші іконки. Запустіть:
   
   node scripts/generate-icons.js --simple
`);
}

// Generate simple emoji-based PNG icons
async function generateSimpleIcons() {
  console.log('Генерую прості іконки на основі emoji 🧠...\n');
  
  // Create a simple script that can be run in browser
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Simple Icon Generator</title>
</head>
<body>
  <script>
    const sizes = [192, 512];
    const results = [];
    
    sizes.forEach(size => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Background
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#0a0e14');
      grad.addColorStop(1, '#1a1f2e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * 0.125);
      ctx.fill();
      
      // Emoji
      ctx.font = size * 0.5 + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧠', size/2, size/2);
      
      results.push({
        size: size,
        url: canvas.toDataURL('image/png')
      });
    });
    
    document.body.innerHTML = '<h1>Icons Generated</h1>' + 
      results.map(r => '<p>' + r.size + 'x' + r.size + ':</p><img src="' + r.url + '" /><br/><a download="icon-' + r.size + 'x' + r.size + '.png" href="' + r.url + '">Download</a>').join('');
  </script>
</body>
</html>`;

  // For now, let's create placeholder files with proper structure
  // The actual icons should be generated via browser or sharp
  
  console.log(`
Для генерації простих іконок:
1. Скопіюйте вміст нижче в новий HTML файл
2. Відкрийте його в браузері
3. Завантажте згенеровані іконки

Або використайте браузерний генератор: 
http://localhost:3000/icons/generate-icons.html
`);
}

// Main execution
async function main() {
  console.log('🧠 Second Brain AI - Генератор PWA іконок\n');
  
  if (process.argv.includes('--simple')) {
    await generateSimpleIcons();
    return;
  }
  
  const sharpSuccess = await tryGenerateWithSharp();
  
  if (!sharpSuccess) {
    generateFallbackInstructions();
  }
}

main().catch(console.error);
