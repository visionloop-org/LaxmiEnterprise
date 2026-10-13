/**
 * Migration Script: Google Sheets to Google Drive CSV
 *
 * This script helps migrate existing Google Sheets data to CSV files in Google Drive.
 * It reads data from the existing Google Sheets Web App and exports it as CSV files.
 *
 * Usage:
 *   node scripts/migrate-sheets-to-drive.js <sheets-webapp-url>
 *
 * Example:
 *   node scripts/migrate-sheets-to-drive.js https://script.google.com/macros/s/.../exec
 */

import { parseCSV, serializeToCSV } from '../packages/shared/utils/csvUtils.js'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Domain structure matching DRIVE_DOMAINS in driveCsvService.js
const DOMAINS = {
  hr_master: {
    name: '01_Laxmi_HR_Master',
    tables: ['employees', 'contractors', 'rates_config', 'users_roles']
  },
  attendance_fleet: {
    name: '02_Laxmi_Attendance_Fleet',
    tables: ['vehicles', 'attendance_sessions', 'attendance_records', 'vehicle_assignments', 'vehicle_trips', 'extra_labour_requests', 'vehicle_maintenance']
  },
  payroll_accounting: {
    name: '03_Laxmi_Payroll_Accounting',
    tables: ['daily_payroll', 'contractor_settlements', 'monthly_summary', 'audit_logs']
  }
}

/**
 * Fetch all data from Google Sheets Web App
 */
async function fetchFromSheets(webappUrl) {
  console.log('Fetching data from Google Sheets...')
  console.log(`URL: ${webappUrl}`)

  try {
    const response = await fetch(`${webappUrl}?action=getAll`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data && data.status === 'success' && data.data) {
      console.log(`✓ Successfully fetched ${Object.keys(data.data).length} tables from Sheets`)
      return data.data
    }

    throw new Error(data.message || 'Invalid format returned by Google Sheets')
  } catch (err) {
    console.error('✗ Error fetching from Sheets:', err.message)
    throw err
  }
}

/**
 * Convert sheets data to CSV files
 */
function convertToCSV(sheetsData, outputDir) {
  console.log('\nConverting to CSV files...')

  // Create output directory
  mkdirSync(outputDir, { recursive: true })

  const domainStats = {}

  for (const [domainKey, domain] of Object.entries(DOMAINS)) {
    const domainDir = join(outputDir, domain.name)
    mkdirSync(domainDir, { recursive: true })

    domainStats[domainKey] = { total: 0, tables: [] }

    for (const table of domain.tables) {
      const records = sheetsData[table] || []

      if (records.length > 0) {
        const csvContent = serializeToCSV(records)
        const filePath = join(domainDir, `${table}.csv`)
        writeFileSync(filePath, csvContent, 'utf-8')

        domainStats[domainKey].total += records.length
        domainStats[domainKey].tables.push({ name: table, count: records.length })

        console.log(`  ✓ ${domain.name}/${table}.csv (${records.length} records)`)
      } else {
        console.log(`  - ${domain.name}/${table}.csv (empty, skipped)`)
      }
    }
  }

  return domainStats
}

/**
 * Print migration summary
 */
function printSummary(domainStats) {
  console.log('\n=== Migration Summary ===')

  let totalRecords = 0
  for (const [domainKey, stats] of Object.entries(domainStats)) {
    const domain = DOMAINS[domainKey]
    console.log(`\n${domain.icon} ${domain.name}:`)
    console.log(`  Total records: ${stats.total}`)
    console.log(`  Tables:`)
    stats.tables.forEach(table => {
      console.log(`    - ${table.name}: ${table.count} records`)
    })
    totalRecords += stats.total
  }

  console.log(`\n📊 Total records migrated: ${totalRecords}`)
}

/**
 * Create upload instructions
 */
function createUploadInstructions(outputDir) {
  const instructions = `
# Google Drive CSV Upload Instructions

## Overview
This directory contains CSV files exported from your Google Sheets.
Upload these files to your Google Drive folder structure.

## Folder Structure
Create the following folder structure in your Google Drive:

Vision Loop - Laxmi Enterprise/
├── 01_Laxmi_HR_Master/
│   ├── employees.csv
│   ├── contractors.csv
│   ├── rates_config.csv
│   └── users_roles.csv
├── 02_Laxmi_Attendance_Fleet/
│   ├── vehicles.csv
│   ├── attendance_sessions.csv
│   ├── attendance_records.csv
│   ├── vehicle_assignments.csv
│   ├── vehicle_trips.csv
│   ├── extra_labour_requests.csv
│   └── vehicle_maintenance.csv
└── 03_Laxmi_Payroll_Accounting/
    ├── daily_payroll.csv
    ├── contractor_settlements.csv
    ├── monthly_summary.csv
    └── audit_logs.csv

## Upload Steps
1. Go to https://drive.google.com
2. Create a folder named "Vision Loop - Laxmi Enterprise"
3. Create the three domain subfolders inside it
4. Upload the CSV files from each domain folder to the corresponding Drive folder
5. Once uploaded, configure your app with the Drive folder IDs

## Alternative: Use the App's Setup
After signing in with Google in the app, click "Create Drive Folders" in the Drive Sync modal.
This will automatically create the folder structure. You can then manually upload the CSV files
or use the app's sync functionality to initialize the tables with default data.
`

  writeFileSync(join(outputDir, 'UPLOAD_INSTRUCTIONS.md'), instructions, 'utf-8')
  console.log(`\n✓ Created UPLOAD_INSTRUCTIONS.md in ${outputDir}`)
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node scripts/migrate-sheets-to-drive.js <sheets-webapp-url>')
    console.error('Example: node scripts/migrate-sheets-to-drive.js https://script.google.com/macros/s/.../exec')
    process.exit(1)
  }

  const webappUrl = args[0]
  const outputDir = join(__dirname, '..', 'migrated-csv-data')

  console.log('=== Google Sheets to Drive CSV Migration ===\n')

  try {
    // Step 1: Fetch from Sheets
    const sheetsData = await fetchFromSheets(webappUrl)

    // Step 2: Convert to CSV
    const domainStats = convertToCSV(sheetsData, outputDir)

    // Step 3: Print summary
    printSummary(domainStats)

    // Step 4: Create upload instructions
    createUploadInstructions(outputDir)

    console.log(`\n✓ Migration complete! CSV files saved to: ${outputDir}`)
    console.log('\nNext steps:')
    console.log('1. Review the CSV files in the output directory')
    console.log('2. Follow the instructions in UPLOAD_INSTRUCTIONS.md')
    console.log('3. Upload the files to your Google Drive')
    console.log('4. Configure your app with the Drive folder IDs')

  } catch (err) {
    console.error('\n✗ Migration failed:', err.message)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
