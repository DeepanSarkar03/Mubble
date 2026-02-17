// This script creates dummy .d.ts files to skip TypeScript errors for packages with native dependencies
const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '..', 'packages');
const packages = ['storage', 'audio-pipeline'];

packages.forEach(pkg => {
  const distDir = path.join(packagesDir, pkg, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create dummy index.js
  fs.writeFileSync(
    path.join(distDir, 'index.js'),
    `// Dummy build output - native module skipped\nmodule.exports = {};`
  );
  
  // Create dummy index.d.ts
  fs.writeFileSync(
    path.join(distDir, 'index.d.ts'),
    `// Dummy type definitions - native module skipped\nexport {};`
  );
  
  console.log(`Created dummy build for ${pkg}`);
});

console.log('Done! You can now run the app without native modules.');
