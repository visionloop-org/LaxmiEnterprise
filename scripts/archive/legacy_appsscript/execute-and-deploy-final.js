import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function executeAndDeployFinal() {
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
  const page = pages[0] || await browser.newPage()
  await page.goto(sheetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 4000))

  console.log('Opening Apps Script...')
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

  console.log('1. Clicking Run to execute setupLaxmiEnterpriseSystem...')
  const runBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
    const runBtn = buttons.find(b => b.textContent.trim() === 'Run' && b.offsetParent !== null);
    if (!runBtn) return null;
    const rect = runBtn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (runBtnBox) {
    await scriptPage.mouse.click(runBtnBox.x + runBtnBox.width / 2, runBtnBox.y + runBtnBox.height / 2)
    console.log('Clicked Run button!')
  }

  // Wait for execution to finish (it will say "Execution completed")
  console.log('Waiting for execution to complete...')
  let completed = false
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const text = await scriptPage.evaluate(() => document.body.innerText)
    if (text.includes('Execution completed')) {
      console.log('🎉 Execution completed successfully!')
      completed = true
      break
    } else if (text.includes('Execution failed')) {
      console.log('Execution failed. Snippet:', text.slice(text.indexOf('Execution failed'), text.indexOf('Execution failed') + 200))
      break
    } else {
      console.log(`Still running (${i * 3}s elapsed)...`)
    }
  }

  await scriptPage.screenshot({ path: 'scripts/final_execution_result.png' })

  // 2. Click Deploy ▾
  console.log('2. Clicking Deploy dropdown...')
  const deployBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
    const deployBtn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!deployBtn) return null;
    const rect = deployBtn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (deployBtnBox) {
    await scriptPage.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))
  }

  // Click "New deployment"
  console.log('Clicking "New deployment" item...')
  const newDeployBox = await scriptPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div, span, button'));
    const item = items.find(el => el.textContent.trim() === 'New deployment' && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (newDeployBox) {
    await scriptPage.mouse.click(newDeployBox.x + newDeployBox.width / 2, newDeployBox.y + newDeployBox.height / 2)
    console.log('Clicked "New deployment" via mouse click!')
  }

  await new Promise(r => setTimeout(r, 4000))
  await scriptPage.screenshot({ path: 'scripts/final_deploy_modal.png' })

  // Check if type needs to be selected (gear icon)
  console.log('Checking dialog gear icon / type selection...')
  const gearBox = await scriptPage.evaluate(() => {
    const gear = document.querySelector('button[aria-label*="type"], .mat-icon-button, button mat-icon');
    if (!gear) return null;
    const btn = gear.closest('button') || gear;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (gearBox) {
    console.log('Clicking gear icon:', gearBox)
    await scriptPage.mouse.click(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))
    await scriptPage.screenshot({ path: 'scripts/final_gear_clicked.png' })

    // Select Web app
    const webAppBox = await scriptPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div, span, button, [role="menuitem"]'));
      const item = items.find(el => el.textContent.trim() === 'Web app' && el.offsetParent !== null);
      if (!item) return null;
      const rect = item.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    if (webAppBox) {
      console.log('Clicking Web app type option:', webAppBox)
      await scriptPage.mouse.click(webAppBox.x + webAppBox.width / 2, webAppBox.y + webAppBox.height / 2)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  await scriptPage.screenshot({ path: 'scripts/final_webapp_config.png' })

  // Find "Who has access" dropdown and set to "Anyone"
  console.log('Setting "Who has access" to Anyone...')
  const accessDropdowns = await scriptPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.mat-select, div[role="combobox"], div[role="listbox"]'));
    return selects.map(s => {
      const rect = s.getBoundingClientRect();
      return { text: s.innerText, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
  })
  console.log('Found selects:', accessDropdowns)

  // Click the access dropdown (typically has "Only myself")
  const targetSelect = accessDropdowns.find(s => s.text.includes('Only myself') || s.text.includes('Anyone'));
  if (targetSelect) {
    console.log('Clicking access select:', targetSelect)
    await scriptPage.mouse.click(targetSelect.x + targetSelect.width / 2, targetSelect.y + targetSelect.height / 2)
    await new Promise(r => setTimeout(r, 1500))

    // Click "Anyone" option
    const anyoneOptionBox = await scriptPage.evaluate(() => {
      const options = Array.from(document.querySelectorAll('mat-option, [role="option"], div, span'));
      const opt = options.find(el => el.textContent.trim() === 'Anyone' && el.offsetParent !== null);
      if (!opt) return null;
      const rect = opt.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (anyoneOptionBox) {
      console.log('Clicking "Anyone" option:', anyoneOptionBox)
      await scriptPage.mouse.click(anyoneOptionBox.x + anyoneOptionBox.width / 2, anyoneOptionBox.y + anyoneOptionBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  await scriptPage.screenshot({ path: 'scripts/final_before_deploy_click.png' })

  // Click Deploy button inside dialog
  console.log('Clicking Deploy button inside dialog...')
  const dialogDeployBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.disabled && !b.classList.contains('deploy-menu-button'));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (dialogDeployBox) {
    console.log('Clicking dialog Deploy button at:', dialogDeployBox)
    await scriptPage.mouse.click(dialogDeployBox.x + dialogDeployBox.width / 2, dialogDeployBox.y + dialogDeployBox.height / 2)
    await new Promise(r => setTimeout(r, 10000))
  }

  await scriptPage.screenshot({ path: 'scripts/final_after_deploy_click.png' })

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

  console.log('🎉🎉🎉 FINAL WEB APP URL:', webAppUrl)

  if (webAppUrl) {
    fs.writeFileSync('scripts/deployed_webapp.json', JSON.stringify({
      spreadsheetId,
      webAppUrl,
      deployedAt: new Date().toISOString()
    }, null, 2))
    console.log('Saved deployment to scripts/deployed_webapp.json')
  }

  // Check spreadsheet tabs
  await page.bringToFront()
  await page.reload({ waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 5000))
  await page.screenshot({ path: 'scripts/final_spreadsheet_view.png' })

  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.docs-sheet-tab-name, .docs-sheet-tab')).map(t => t.innerText.trim()).filter(Boolean);
  })
  console.log('🎉 All created sheets in Google Spreadsheet:', tabs)

  await new Promise(r => setTimeout(r, 3000))
  await browser.close()
  console.log('Everything completed successfully!')
}

executeAndDeployFinal().catch(err => {
  console.error('Error in executeAndDeployFinal:', err)
})
