#!/usr/bin/env node

// Simple wrapper to run the TypeScript import script
// This avoids module resolution issues with ts-node

const { spawn } = require('child_process');
const path = require('path');

// Compile the TypeScript file
const tsc = spawn('npx', [
  'tsc', 
  'scripts/import-feed.ts', 
  '--outDir', 'temp-dist', 
  '--module', 'commonjs', 
  '--esModuleInterop', 'true', 
  '--skipLibCheck'
], { stdio: 'inherit' });

tsc.on('close', (code) => {
  if (code !== 0) {
    console.error('Compilation failed');
    process.exit(code);
  }
  
  // Rename to .cjs to avoid ES module issues
  const fs = require('fs');
  try {
    fs.renameSync(
      path.join('temp-dist', 'scripts', 'import-feed.js'),
      path.join('temp-dist', 'import-feed.cjs')
    );
  } catch (err) {
    console.error('Failed to rename file:', err);
    process.exit(1);
  }
  
  // Run the compiled file
  const node = spawn('node', ['temp-dist/import-feed.cjs'], { stdio: 'inherit' });
  
  node.on('close', (exitCode) => {
    // Clean up
    const rimraf = require('rimraf');
    rimraf.sync('temp-dist');
    process.exit(exitCode);
  });
});