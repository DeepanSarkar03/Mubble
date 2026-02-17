const fs = require('fs');
const path = require('path');

// Configuration
const sourceDir = path.join(__dirname, '..', 'apps', 'desktop', 'release');
const targetDir = path.join(__dirname, '..', 'Download Here');

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Release directory not found:', sourceDir);
  console.log('\nPlease build the app first:');
  console.log('  pnpm run build');
  console.log('  cd apps/desktop');
  console.log('  pnpm run dist:win    # For Windows');
  console.log('  pnpm run dist:mac    # For macOS');
  process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Find installer files
const files = fs.readdirSync(sourceDir).filter(file => {
  return file.endsWith('.exe') || file.endsWith('.dmg');
});

if (files.length === 0) {
  console.log('❌ No installer files found in:', sourceDir);
  console.log('\nPlease run the build command first:');
  console.log('  cd apps/desktop');
  console.log('  pnpm run dist:win    # For Windows installer');
  console.log('  pnpm run dist:mac    # For macOS installer');
  process.exit(1);
}

// Copy files
console.log('📦 Copying installers...\n');
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  fs.copyFileSync(sourcePath, targetPath);
  const stats = fs.statSync(targetPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✓ ${file} (${sizeMB} MB)`);
});

console.log(`\n✅ Installers ready in: ${targetDir}`);
console.log('\n📥 Users can now download the installer from the "Download Here" folder');
