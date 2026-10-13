import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function createSpreadsheet() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  console.log('Launching Chrome with authenticated Vision Loop session...')
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: tempProfileDir,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ],
    defaultViewport: null
  })

  const pages = await browser.pages()
  const page = pages[0] || await browser.newPage()

  console.log('Navigating to create new Google Spreadsheet...')
  await page.goto('https://docs.google.com/spreadsheets/create', {
    waitUntil: 'networkidle2',
    timeout: 30000
  })

  await new Promise(r => setTimeout(r, 4000))
  const sheetUrl = page.url()
  console.log('Spreadsheet URL created:', sheetUrl)
  await page.screenshot({ path: 'scripts/sheet_created.png' })

  // Extract Spreadsheet ID from URL
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) {
    throw new Error('Could not extract spreadsheet ID from ' + sheetUrl)
  }
  const spreadsheetId = match[1]
  console.log('🎉 SPREADSHEET ID:', spreadsheetId)

  // Rename title
  try {
    const titleInput = '.docs-title-input'
    await page.waitForSelector(titleInput, { timeout: 8000 })
    await page.click(titleInput)
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.type('Laxmi Enterprise Database')
    await page.keyboard.press('Enter')
    console.log('Renamed spreadsheet to Laxmi Enterprise Database')
    await page.screenshot({ path: 'scripts/sheet_renamed.png' })
  } catch (e) {
    console.log('Could not rename via title input:', e.message)
  }

  // Navigate to container-bound Apps Script
  const appsScriptUrl = `https://script.google.com/macros/d/${spreadsheetId}/edit`
  console.log('Navigating directly to Apps Script editor:', appsScriptUrl)

  const scriptPage = await browser.newPage()
  await scriptPage.goto(appsScriptUrl, {
    waitUntil: 'networkidle2',
    timeout: 30000
  })

  await new Promise(r => setTimeout(r, 6000))
  console.log('Apps Script page title:', await scriptPage.title())
  console.log('Apps Script page URL:', scriptPage.url())
  await scriptPage.screenshot({ path: 'scripts/appsscript_editor.png' })

  // Save metadata
  fs.writeFileSync('scripts/created_spreadsheet.json', JSON.stringify({
    spreadsheetId,
    spreadsheetUrl: sheetUrl,
    appsScriptUrl: scriptPage.url(),
    createdAt: new Date().toISOString()
  }, null, 2))

  console.log('Saved spreadsheet metadata to scripts/created_spreadsheet.json')

  // Keep browser open for next step
  await new Promise(r => setTimeout(r, 10000))
  await browser.close()
  console.log('Finished create step.')
}

createSpreadsheet().catch(err => {
  console.error('Error creating spreadsheet:', err)
})
