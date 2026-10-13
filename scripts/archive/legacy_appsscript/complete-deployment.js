import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function completeDeployment() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const spreadsheetId = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

  console.log('1. Opening spreadsheet...')
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

  console.log('2. Opening Apps Script editor...')
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

  // Find Deploy button at top right
  console.log('3. Clicking Deploy dropdown...')
  const deployBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  await scriptPage.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
  await new Promise(r => setTimeout(r, 2000))

  // Click "New deployment"
  console.log('4. Clicking "New deployment"...')
  const newDeployBox = await scriptPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div, span, button'));
    const item = items.find(el => el.textContent.trim() === 'New deployment' && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (newDeployBox) {
    await scriptPage.mouse.click(newDeployBox.x + newDeployBox.width / 2, newDeployBox.y + newDeployBox.height / 2)
  }
  await new Promise(r => setTimeout(r, 4000))

  // Check if Web app is selected, else click gear and select Web app
  const isWebAppSelected = await scriptPage.evaluate(() => {
    return document.body.innerText.includes('Web app') && document.body.innerText.includes('Who has access');
  })

  if (!isWebAppSelected) {
    console.log('Selecting Web app type via gear icon...')
    const gearBox = await scriptPage.evaluate(() => {
      const gears = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const gear = gears.find(b => (b.getAttribute('aria-label') || '').includes('type') || b.querySelector('mat-icon'));
      if (!gear) return null;
      const rect = gear.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (gearBox) {
      await scriptPage.mouse.click(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))

      const webAppOptBox = await scriptPage.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div, span, button, [role="menuitem"]'));
        const item = items.find(el => el.textContent.trim() === 'Web app' && el.offsetParent !== null);
        if (!item) return null;
        const rect = item.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })

      if (webAppOptBox) {
        await scriptPage.mouse.click(webAppOptBox.x + webAppOptBox.width / 2, webAppOptBox.y + webAppOptBox.height / 2)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }

  // Ensure "Who has access" is set to "Anyone"
  console.log('5. Configuring "Who has access" -> Anyone...')
  const accessBox = await scriptPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.mat-select, div[role="combobox"]'));
    const target = selects.find(s => s.offsetParent !== null && (s.innerText.includes('Only myself') || s.innerText.includes('Anyone')));
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

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

    if (anyoneBox) {
      await scriptPage.mouse.click(anyoneBox.x + anyoneBox.width / 2, anyoneBox.y + anyoneBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  // Click modal Deploy button
  console.log('6. Clicking Deploy button in modal...')
  const modalDeployBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.disabled && b.getBoundingClientRect().y > 200);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (modalDeployBox) {
    await scriptPage.mouse.click(modalDeployBox.x + modalDeployBox.width / 2, modalDeployBox.y + modalDeployBox.height / 2)
    console.log('Deploy button clicked! Now waiting for deployment to finish...')
  }

  // 7. Polling for deployment completion (up to 90 seconds)
  let finalUrl = null
  for (let sec = 0; sec < 45; sec++) {
    await new Promise(r => setTimeout(r, 2000))
    const state = await scriptPage.evaluate(() => {
      const text = document.body.innerText;
      const urlMatch = text.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/);
      if (urlMatch) return { done: true, url: urlMatch[0] };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        if ((input.value || '').includes('script.google.com/macros/s/')) {
          return { done: true, url: input.value };
        }
      }

      if (text.includes('Updating the deployment')) {
        return { done: false, status: 'updating' };
      }
      return { done: false, status: 'waiting' };
    })

    if (state.done) {
      finalUrl = state.url
      console.log(`🎉 Deployment finished after ${sec * 2}s! URL: ${finalUrl}`)
      break
    } else {
      console.log(`Deployment status: ${state.status} (${sec * 2}s)...`)
    }
  }

  await scriptPage.screenshot({ path: 'scripts/complete_deployment_result.png' })

  if (finalUrl) {
    fs.writeFileSync('scripts/deployed_webapp.json', JSON.stringify({
      spreadsheetId,
      webAppUrl: finalUrl,
      deployedAt: new Date().toISOString()
    }, null, 2))
    console.log('🎉 Saved final deployment details to scripts/deployed_webapp.json')

    // Click Done button to close dialog
    await scriptPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const doneBtn = buttons.find(b => b.textContent.trim() === 'Done' && b.offsetParent !== null);
      if (doneBtn) doneBtn.click();
    })
  }

  await new Promise(r => setTimeout(r, 3000))
  await browser.close()
  console.log('Process complete.')
}

completeDeployment().catch(console.error)
