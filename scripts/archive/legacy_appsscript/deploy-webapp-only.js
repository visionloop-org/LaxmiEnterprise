import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function deployWebappOnly() {
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

  console.log('Opening Apps Script editor...')
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

  console.log('Editor loaded! Checking Deploy button...')
  // Close execution log if open
  await scriptPage.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close"], .execution-log-close, button mat-icon[data-mat-icon-name="close"]');
    if (closeBtn) closeBtn.click();
  })
  await new Promise(r => setTimeout(r, 1000))

  // Find Deploy button
  const deployBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  console.log('Clicking Deploy button:', deployBtnBox)
  await scriptPage.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
  await new Promise(r => setTimeout(r, 2000))
  await scriptPage.screenshot({ path: 'scripts/webapp_deploy_menu.png' })

  // Find and click "New deployment"
  console.log('Finding "New deployment" option...')
  const newDeployBox = await scriptPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div, span, button'));
    const item = items.find(el => el.textContent.trim() === 'New deployment' && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  console.log('Clicking "New deployment":', newDeployBox)
  if (newDeployBox) {
    await scriptPage.mouse.click(newDeployBox.x + newDeployBox.width / 2, newDeployBox.y + newDeployBox.height / 2)
  }
  await new Promise(r => setTimeout(r, 4000))
  await scriptPage.screenshot({ path: 'scripts/webapp_deploy_modal.png' })

  // Click gear icon to select type
  console.log('Looking for gear icon to select type...')
  const gearBox = await scriptPage.evaluate(() => {
    const gears = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const gear = gears.find(b => (b.getAttribute('aria-label') || '').includes('type') || b.querySelector('mat-icon'));
    if (!gear) return null;
    const rect = gear.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  console.log('Gear icon box:', gearBox)
  if (gearBox) {
    await scriptPage.mouse.click(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2)
    await new Promise(r => setTimeout(r, 2000))
    await scriptPage.screenshot({ path: 'scripts/webapp_gear_menu.png' })

    // Select "Web app"
    const webAppBox = await scriptPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div, span, button, [role="menuitem"]'));
      const item = items.find(el => el.textContent.trim() === 'Web app' && el.offsetParent !== null);
      if (!item) return null;
      const rect = item.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    console.log('Clicking Web app type:', webAppBox)
    if (webAppBox) {
      await scriptPage.mouse.click(webAppBox.x + webAppBox.width / 2, webAppBox.y + webAppBox.height / 2)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  await scriptPage.screenshot({ path: 'scripts/webapp_form_ready.png' })

  // Look for "Who has access" dropdown
  console.log('Looking for "Who has access" dropdown...')
  const accessBox = await scriptPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.mat-select, div[role="combobox"]'));
    const target = selects.find(s => s.offsetParent !== null && (s.innerText.includes('Only myself') || s.innerText.includes('Anyone')));
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  console.log('Access dropdown box:', accessBox)
  if (accessBox) {
    await scriptPage.mouse.click(accessBox.x + accessBox.width / 2, accessBox.y + accessBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))

    const anyoneBox = await scriptPage.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('mat-option, [role="option"], div, span'));
      const opt = opts.find(o => o.textContent.trim() === 'Anyone' && o.offsetParent !== null);
      if (!opt) return null;
      const rect = opt.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    console.log('Selecting Anyone:', anyoneBox)
    if (anyoneBox) {
      await scriptPage.mouse.click(anyoneBox.x + anyoneBox.width / 2, anyoneBox.y + anyoneBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  await scriptPage.screenshot({ path: 'scripts/webapp_before_deploy.png' })

  // Find modal Deploy button (blue button inside the modal dialog)
  console.log('Looking for modal Deploy button...')
  const modalDeployBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.disabled && b.getBoundingClientRect().y > 200);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  console.log('Modal Deploy button box:', modalDeployBox)
  if (modalDeployBox) {
    await scriptPage.mouse.click(modalDeployBox.x + modalDeployBox.width / 2, modalDeployBox.y + modalDeployBox.height / 2)
    console.log('Clicked modal Deploy button! Waiting for deployment URL...')
    await new Promise(r => setTimeout(r, 15000))
  }

  await scriptPage.screenshot({ path: 'scripts/webapp_after_deploy.png' })

  // Extract Web App URL
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
  console.log('Web app deployment process finished!')
}

deployWebappOnly().catch(err => {
  console.error('Fatal error in deployWebappOnly:', err)
})
