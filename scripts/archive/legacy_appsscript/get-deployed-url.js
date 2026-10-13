import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function getDeployedUrl() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const spreadsheetId = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

  console.log('Opening spreadsheet:', sheetUrl)
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
  const sheetPage = pages[0] || await browser.newPage()
  await sheetPage.goto(sheetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 4000))

  console.log('Opening Apps Script...')
  const extMenu = await sheetPage.$('#docs-extensions-menu')
  const box = await extMenu.boundingBox()
  await sheetPage.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  const newTargetPromise = browser.waitForTarget(t => t.url().includes('script.google.com'), { timeout: 20000 })

  const appsScriptBox = await sheetPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.goog-menuitem, .goog-menuitem-content, div'));
    const item = items.find(el => el.textContent.trim().startsWith('Apps Script') && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  await sheetPage.mouse.click(appsScriptBox.x + appsScriptBox.width / 2, appsScriptBox.y + appsScriptBox.height / 2)
  const newTarget = await newTargetPromise
  const scriptPage = await newTarget.page()
  await scriptPage.bringToFront()
  await new Promise(r => setTimeout(r, 8000))

  // Find Deploy button
  const deployBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  console.log('Clicking Deploy dropdown:', deployBtnBox)
  await scriptPage.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  // Click "Manage deployments"
  console.log('Clicking "Manage deployments"...')
  const manageDeployBox = await scriptPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div, span, button'));
    const item = items.find(el => el.textContent.trim() === 'Manage deployments' && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (manageDeployBox) {
    await scriptPage.mouse.click(manageDeployBox.x + manageDeployBox.width / 2, manageDeployBox.y + manageDeployBox.height / 2)
  }
  await new Promise(r => setTimeout(r, 4000))
  await scriptPage.screenshot({ path: 'scripts/manage_deployments.png' })

  // Extract all text and input values from manage deployments dialog
  const webAppUrl = await scriptPage.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, a'));
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
    console.log('SUCCESS! Saved deployment URL to scripts/deployed_webapp.json')
  }

  await new Promise(r => setTimeout(r, 3000))
  await browser.close()
  console.log('Finished get deployed URL step.')
}

getDeployedUrl().catch(console.error)
