import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function checkAndDeploy() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const spreadsheetId = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

  console.log('Opening spreadsheet to check sheets created:', sheetUrl)
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
  await page.goto(sheetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 6000))

  await page.screenshot({ path: 'scripts/spreadsheet_current_tabs.png' })

  // Read all sheet tab names from the bottom bar
  const sheetTabs = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.docs-sheet-tab-name, .docs-sheet-tab'));
    return tabs.map(t => t.innerText.trim()).filter(Boolean);
  })
  console.log('Detected sheet tabs in Google Sheets:', sheetTabs)

  // Now open Apps Script to deploy as Web App
  console.log('Opening Apps Script to deploy as Web App...')
  const extMenu = await page.$('#docs-extensions-menu')
  const box = await extMenu.boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  const newTargetPromise = browser.waitForTarget(t => t.url().includes('script.google.com'), { timeout: 20000 })

  const appsScriptBox = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.goog-menuitem, .goog-menuitem-content, div'));
    const item = items.find(el => el.textContent.trim().startsWith('Apps Script') && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  await page.mouse.click(appsScriptBox.x + appsScriptBox.width / 2, appsScriptBox.y + appsScriptBox.height / 2)
  const newTarget = await newTargetPromise
  const scriptPage = await newTarget.page()
  await scriptPage.bringToFront()
  await new Promise(r => setTimeout(r, 8000))

  await scriptPage.screenshot({ path: 'scripts/deploy_step1_editor.png' })

  // Check execution log state
  const logText = await scriptPage.evaluate(() => {
    const logContainer = document.querySelector('.execution-log, .log-container, [role="region"]');
    return logContainer ? logContainer.innerText : 'No log container found';
  })
  console.log('Execution log:', logText)

  // If Run button is present and not running, let's make sure setup has completed
  // Click Deploy ▾ button
  console.log('Locating Deploy button...')
  const deployMenuClicked = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
    const deployBtn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (deployBtn) {
      deployBtn.click();
      return true;
    }
    return false;
  })

  console.log('Clicked Deploy button:', deployMenuClicked)
  await new Promise(r => setTimeout(r, 2000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step2_menu.png' })

  // Click "New deployment"
  console.log('Clicking "New deployment"...')
  await scriptPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.goog-menuitem, div[role="menuitem"], span, div'));
    const item = items.find(el => el.textContent.trim().includes('New deployment') && el.offsetParent !== null);
    if (item) item.click();
  })

  await new Promise(r => setTimeout(r, 4000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step3_dialog.png' })

  // In the New deployment dialog, click the gear icon to select type -> Web app
  console.log('Selecting type -> Web app if needed...')
  await scriptPage.evaluate(() => {
    const gear = document.querySelector('button[aria-label="Select type"], .quantumWizButtonEl[aria-label*="type"], mat-icon');
    if (gear) gear.click();
  })
  await new Promise(r => setTimeout(r, 2000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step4_select_type.png' })

  // Click "Web app"
  await scriptPage.evaluate(() => {
    const options = Array.from(document.querySelectorAll('div, span, button'));
    const webAppOpt = options.find(el => el.textContent.trim() === 'Web app' && el.offsetParent !== null);
    if (webAppOpt) webAppOpt.click();
  })
  await new Promise(r => setTimeout(r, 2000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step5_webapp_selected.png' })

  // Set "Who has access" -> Anyone
  console.log('Configuring "Who has access" to Anyone...')
  await scriptPage.evaluate(() => {
    const dropdowns = Array.from(document.querySelectorAll('.mat-select, div[role="listbox"], div[role="combobox"], select'));
    // Find dropdown for access
    dropdowns.forEach(d => {
      if (d.innerText.includes('Only myself') || d.innerText.includes('Anyone')) {
        d.click();
      }
    });
  })
  await new Promise(r => setTimeout(r, 2000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step6_access_dropdown.png' })

  await scriptPage.evaluate(() => {
    const options = Array.from(document.querySelectorAll('mat-option, [role="option"], div, span'));
    const anyoneOpt = options.find(el => el.textContent.trim() === 'Anyone' && el.offsetParent !== null);
    if (anyoneOpt) anyoneOpt.click();
  })
  await new Promise(r => setTimeout(r, 2000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step7_access_set.png' })

  // Click Deploy button inside dialog
  console.log('Clicking Deploy inside dialog...')
  await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('mat-dialog-actions button, button'));
    const deployBtn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.hasAttribute('disabled'));
    if (deployBtn) deployBtn.click();
  })

  await new Promise(r => setTimeout(r, 8000))
  await scriptPage.screenshot({ path: 'scripts/deploy_step8_completed.png' })

  // Extract Web App URL!
  const webAppUrl = await scriptPage.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], a'));
    for (const el of inputs) {
      const val = el.value || el.href || '';
      if (val.includes('script.google.com/macros/s/')) {
        return val;
      }
    }
    const text = document.body.innerText;
    const match = text.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/);
    return match ? match[0] : null;
  })

  console.log('🎉🎉🎉 EXTRACTED WEB APP URL:', webAppUrl)

  if (webAppUrl) {
    fs.writeFileSync('scripts/deployed_webapp.json', JSON.stringify({
      spreadsheetId,
      webAppUrl,
      deployedAt: new Date().toISOString()
    }, null, 2))
    console.log('Saved deployment to scripts/deployed_webapp.json')
  }

  await new Promise(r => setTimeout(r, 4000))
  await browser.close()
  console.log('Check and deploy finished!')
}

checkAndDeploy().catch(err => {
  console.error('Error in checkAndDeploy:', err)
})
