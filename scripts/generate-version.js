#!/usr/bin/env node

/**
 * Version Generation Script
 *
 * Generates a version.json file containing:
 * - App version from package.json
 * - Build timestamp
 * - Git commit hash (if available)
 *
 * This file is used by the client to detect when a new version is deployed
 * and prompt users to refresh their browser.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json to get version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get git commit hash (short version)
let gitCommit = 'unknown';
try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (error) {
  console.warn('⚠️  Could not get git commit hash:', error.message);
}

// Build version object
const versionInfo = {
  version: packageJson.version,
  buildTime: new Date().toISOString(),
  gitCommit: gitCommit,
};

// Write to public/version.json
const outputPath = path.join(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2), 'utf8');

console.log('✅ Version file generated successfully!');
console.log(`   Version: ${versionInfo.version}`);
console.log(`   Build Time: ${versionInfo.buildTime}`);
console.log(`   Git Commit: ${versionInfo.gitCommit}`);
console.log(`   Output: ${outputPath}`);
