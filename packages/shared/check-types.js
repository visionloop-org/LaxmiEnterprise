#!/usr/bin/env node
/**
 * Check if generated types are up to date with the OpenAPI spec
 * This script should be run in CI to ensure types are regenerated when the API changes
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking if generated types are up to date...');

try {
  // Generate types to a temporary file
  const tempFile = path.join(__dirname, 'api.ts.tmp');
  execSync(`npx openapi-typescript ../../ServerSide/openapi.json -o ${tempFile}`, { stdio: 'inherit' });

  // Read both files
  const currentTypes = fs.readFileSync(path.join(__dirname, 'types', 'api.ts'), 'utf8');
  const newTypes = fs.readFileSync(tempFile, 'utf8');

  // Clean up temp file
  fs.unlinkSync(tempFile);

  // Compare
  if (currentTypes === newTypes) {
    console.log('✓ Generated types are up to date');
    process.exit(0);
  } else {
    console.log('✗ Generated types are out of date');
    console.log('Please run: npm run generate:types');
    console.log('Then commit the updated types/api.ts file');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking types:', error.message);
  process.exit(1);
}
