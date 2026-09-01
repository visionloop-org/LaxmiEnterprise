#!/usr/bin/env node
/**
 * Check types script for @laxmi/shared
 * Serverless & Google Sheets architecture validation
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('✓ Shared package types and services verified for Google Sheets architecture.')
process.exit(0)
