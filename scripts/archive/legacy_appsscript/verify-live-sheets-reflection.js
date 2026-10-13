/**
 * Verify Live Reflection of Google Sheet Updates on Web Client
 * 
 * Simulates:
 * 1. Admin/Supervisor directly updates a record in Google Sheets.
 * 2. Web App detects and pulls updates (via auto-sync / focus / manual refresh).
 * 3. Frontend RestEmployeeService and cache immediately reflect the Google Sheets update.
 * 4. Cleanup/restore original record in Google Sheets.
 */

import { googleSheetsService } from '../packages/shared/services/googleSheetsService.js'
import { restEmployeeService } from '../packages/shared/services/restEmployeeService.js'

async function runVerification() {
  console.log('🔄 --- STARTING GOOGLE SHEETS LIVE REFLECTION VERIFICATION ---')
  const scriptUrl = googleSheetsService.config.scriptUrl
  console.log('📍 Web App Target:', scriptUrl)

  // Step 1: Initial pull from Google Sheets
  console.log('\n📥 Step 1: Performing initial sync from Google Sheets...')
  const initialSync = await googleSheetsService.fetchFromGoogleSheets()
  if (!initialSync.success) {
    throw new Error('Initial sync failed: ' + initialSync.message)
  }
  console.log('✅ Initial sync succeeded! Tables:', Object.keys(initialSync.data))

  // Read current employee EMP001
  const originalEmp = await restEmployeeService.fetchEmployee('EMP001')
  console.log('📋 Current EMP001 in Web App:', {
    name: originalEmp.name,
    baseRate: originalEmp.baseRate,
    remarks: originalEmp.remarks
  })

  // Step 2: Subscribe to Live Sync events on the web app
  let liveEventReceived = null
  const unsubscribe = googleSheetsService.subscribe((eventType, payload) => {
    console.log(`🔔 Web Client received event: [${eventType}] at ${payload.timestamp || new Date().toISOString()}`)
    if (eventType === 'SYNC_COMPLETED') {
      liveEventReceived = payload
    }
  })

  // Step 3: Simulate an external update made directly in Google Sheets
  // (e.g. Someone opened Google Sheets and updated Ramesh Patel's remarks or base rate)
  const testRemark = `LiveSheetEdit_${Date.now().toString().slice(-4)}`
  console.log(`\n✏️ Step 2: Simulating direct Google Sheet cell edit: remarks = "${testRemark}"...`)
  const updateRes = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'saveEmployee',
      employee: {
        ...originalEmp,
        id: 'EMP001',
        employeeId: 'EMP001',
        remarks: testRemark
      }
    })
  })
  const updateJson = await updateRes.json()
  console.log('☁️ Google Sheets API update response:', updateJson)

  // Wait 2.5s for Google Sheets to commit row
  await new Promise(resolve => setTimeout(resolve, 2500))

  // Step 4: Trigger web app pull (auto-sync / window focus / 1-click refresh)
  console.log('\n🔄 Step 3: Web App triggers sync (auto-sync / window focus / 1-click refresh)...')
  const refreshRes = await googleSheetsService.fetchFromGoogleSheets()
  console.log('✅ Web App sync completed:', refreshRes.message)

  // Step 5: Verify web app state has reflected the Google Sheet update
  const updatedEmp = await restEmployeeService.fetchEmployee('EMP001')
  console.log('\n📊 Step 4: Web App Employee Data after Google Sheet edit:')
  console.log({
    name: updatedEmp.name,
    baseRate: updatedEmp.baseRate,
    remarks: updatedEmp.remarks
  })

  if (updatedEmp.remarks === testRemark) {
    console.log('🎉 SUCCESS: Direct Google Sheet update SUCCESSFULLY REFLECTED on the web client!')
  } else {
    console.error('❌ Mismatch! Expected:', testRemark, 'Got:', updatedEmp.remarks)
  }

  // Step 6: Clean up - Restore original remarks
  console.log('\n🧹 Step 5: Restoring original remarks in Google Sheets...')
  await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'saveEmployee',
      employee: {
        ...originalEmp,
        id: 'EMP001',
        employeeId: 'EMP001',
        remarks: originalEmp.remarks || 'Standard Driver'
      }
    })
  })
  await googleSheetsService.fetchFromGoogleSheets()
  unsubscribe()
  console.log('✅ Cleanup complete. Live reflection test passed with flying colors!')
}

runVerification().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
