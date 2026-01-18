#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'public');
const dest = path.join(__dirname, '..', 'dist', 'public');

function copyRecursive(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  const stats = fs.statSync(source);
  
  if (stats.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    
    for (const file of fs.readdirSync(source)) {
      copyRecursive(
        path.join(source, file),
        path.join(target, file)
      );
    }
  } else {
    fs.copyFileSync(source, target);
  }
}

if (fs.existsSync(src)) {
  copyRecursive(src, dest);
  console.log('Copied src/public -> dist/public');
} else {
  console.log('src/public not found, skipping copy');
}
