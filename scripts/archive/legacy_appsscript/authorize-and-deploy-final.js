import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function authorizeAndDeployFinal() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const spreadsheetId = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

  console.log('1. Launching Chrome and opening spreadsheet...')
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

  console.log('3. Clicking Run...')
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

  await new Promise(r => setTimeout(r, 3000))

  // Check for "Review permissions" modal
  console.log('4. Checking for "Review permissions" button...')
  const reviewBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().includes('Review permissions') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (reviewBtnBox) {
    console.log('Found Review permissions button! Setting up OAuth target listener...')
    const oauthPromise = browser.waitForTarget(t => t.url().includes('accounts.google.com') && (t.url().includes('oauth') || t.url().includes('consent') || t.url().includes('warning')), { timeout: 20000 })

    await scriptPage.mouse.click(reviewBtnBox.x + reviewBtnBox.width / 2, reviewBtnBox.y + reviewBtnBox.height / 2)
    console.log('Clicked Review permissions!')

    const oauthTarget = await oauthPromise
    console.log('OAuth popup detected! URL:', oauthTarget.url())
    const oauthPage = await oauthTarget.page()
    await oauthPage.bringToFront()
    await new Promise(r => setTimeout(r, 4000))

    // Step A: Select account if account chooser is displayed
    const isAccountChooser = await oauthPage.evaluate(() => document.body.innerText.includes('Choose an account'));
    if (isAccountChooser) {
      console.log('Selecting account visionloop.in@gmail.com...')
      const accBox = await oauthPage.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div, li, span'));
        const acc = els.find(el => el.textContent.includes('visionloop.in@gmail.com') && el.offsetParent !== null);
        if (!acc) return null;
        const rect = acc.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })

      if (accBox) {
        await oauthPage.mouse.click(accBox.x + accBox.width / 2, accBox.y + accBox.height / 2)
      }
      await new Promise(r => setTimeout(r, 4000))
    }

    // Step B: Click "Advanced" if warning is displayed
    const hasAdvanced = await oauthPage.evaluate(() => document.body.innerText.toLowerCase().includes('advanced'));
    if (hasAdvanced) {
      console.log('Looking for "Advanced" link...')
      const advBox = await oauthPage.evaluate(() => {
        const els = Array.from(document.querySelectorAll('a, button, div[role="button"]'));
        const adv = els.find(l => l.textContent.trim().toLowerCase() === 'advanced' && l.offsetParent !== null);
        if (!adv) return null;
        const rect = adv.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })

      if (advBox) {
        console.log('Clicking Advanced...')
        await oauthPage.mouse.click(advBox.x + advBox.width / 2, advBox.y + advBox.height / 2)
        await new Promise(r => setTimeout(r, 2000))
      }

      // Step C: Click "Go to Untitled project (unsafe)"
      console.log('Looking for "Go to project (unsafe)" link...')
      const unsafeBox = await oauthPage.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const unsafe = links.find(l => (l.textContent.includes('unsafe') || l.textContent.includes('Go to')) && l.offsetParent !== null);
        if (!unsafe) return null;
        const rect = unsafe.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })

      if (unsafeBox) {
        console.log('Clicking unsafe link...')
        await oauthPage.mouse.click(unsafeBox.x + unsafeBox.width / 2, unsafeBox.y + unsafeBox.height / 2)
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    // Step D: In the consent screen: Check "Select all" and click "Continue"
    console.log('On consent screen! Clicking "Select all" checkbox...')
    await oauthPage.screenshot({ path: 'scripts/consent_before_click.png' })

    const selectAllBox = await oauthPage.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, label, span, input'));
      const item = els.find(el => el.textContent.trim() === 'Select all' && el.offsetParent !== null);
      if (!item) return null;
      const rect = item.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (selectAllBox) {
      console.log('Clicking Select all checkbox at:', selectAllBox)
      await oauthPage.mouse.click(selectAllBox.x + 10, selectAllBox.y + selectAllBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    } else {
      console.log('Clicking first checkbox directly...')
      const checkbox = await oauthPage.$('input[type="checkbox"]')
      if (checkbox) await checkbox.click()
    }

    await oauthPage.screenshot({ path: 'scripts/consent_after_checkbox.png' })

    // Scroll to bottom of OAuth page to make Continue button visible
    console.log('Scrolling to bottom of consent page...')
    await oauthPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 1500))

    // Click "Continue" button
    console.log('Looking for "Continue" button...')
    const continueBox = await oauthPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const btn = buttons.find(b => (b.textContent.trim() === 'Continue' || b.textContent.trim() === 'Allow') && b.offsetParent !== null);
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (continueBox) {
      console.log('Clicking Continue button at:', continueBox)
      await oauthPage.mouse.click(continueBox.x + continueBox.width / 2, continueBox.y + continueBox.height / 2)
      console.log('🎉 Continue clicked! Waiting for OAuth popup to close...')
      await new Promise(r => setTimeout(r, 6000))
    }
  }

  // 5. Back to scriptPage: Now wait for execution of setupLaxmiEnterpriseSystem to complete!
  await scriptPage.bringToFront()
  console.log('5. Monitoring execution of setupLaxmiEnterpriseSystem...')
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const text = await scriptPage.evaluate(() => document.body.innerText)
    if (text.includes('Execution completed')) {
      console.log('🎉 Execution completed successfully!')
      break
    } else if (text.includes('Execution failed')) {
      console.log('Execution error:', text.slice(text.indexOf('Execution failed'), text.indexOf('Execution failed') + 300))
      break
    } else {
      console.log(`Execution in progress (${i * 3}s elapsed)...`)
    }
  }

  await scriptPage.screenshot({ path: 'scripts/final_completed_run.png' })

  // 6. Deploy as Web App
  console.log('6. Opening Deploy dropdown...')
  const deployMenuBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (deployMenuBox) {
    await scriptPage.mouse.click(deployMenuBox.x + deployMenuBox.width / 2, deployMenuBox.y + deployMenuBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))
  }

  // Click "New deployment"
  console.log('Clicking "New deployment"...')
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
  await scriptPage.screenshot({ path: 'scripts/deploy_modal_open.png' })

  // Click gear icon inside modal if Web app is not preselected
  const gearBox = await scriptPage.evaluate(() => {
    const gears = Array.from(document.querySelectorAll('button[aria-label*="type"], .mat-icon-button'));
    const gear = gears.find(g => g.offsetParent !== null);
    if (!gear) return null;
    const rect = gear.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (gearBox) {
    console.log('Clicking gear icon...')
    await scriptPage.mouse.click(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))

    const webAppBox = await scriptPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div, span, button, [role="menuitem"]'));
      const item = items.find(el => el.textContent.trim() === 'Web app' && el.offsetParent !== null);
      if (!item) return null;
      const rect = item.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    if (webAppBox) {
      console.log('Selecting Web app...')
      await scriptPage.mouse.click(webAppBox.x + webAppBox.width / 2, webAppBox.y + webAppBox.height / 2)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // Find "Who has access" dropdown and select Anyone
  const accessDropdown = await scriptPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.mat-select, div[role="combobox"]'));
    const target = selects.find(s => (s.innerText.includes('Only myself') || s.innerText.includes('Anyone')) && s.offsetParent !== null);
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (accessDropdown) {
    console.log('Clicking access dropdown...')
    await scriptPage.mouse.click(accessDropdown.x + accessDropdown.width / 2, accessDropdown.y + accessDropdown.height / 2)
    await new Promise(r => setTimeout(r, 1500))

    const anyoneBox = await scriptPage.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('mat-option, [role="option"], div, span'));
      const opt = opts.find(o => o.textContent.trim() === 'Anyone' && o.offsetParent !== null);
      if (!opt) return null;
      const rect = opt.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (anyoneBox) {
      console.log('Selecting Anyone...')
      await scriptPage.mouse.click(anyoneBox.x + anyoneBox.width / 2, anyoneBox.y + anyoneBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  // Click Deploy button inside dialog
  const deployModalBtn = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('mat-dialog-actions button, button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.disabled && !b.classList.contains('deploy-menu-button'));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (deployModalBtn) {
    console.log('Clicking Deploy inside dialog...')
    await scriptPage.mouse.click(deployModalBtn.x + deployModalBtn.width / 2, deployModalBtn.y + deployModalBtn.height / 2)
    console.log('Deploy button clicked! Waiting for deployment URL...')
    await new Promise(r => setTimeout(r, 12000))
  }

  await scriptPage.screenshot({ path: 'scripts/final_deploy_success.png' })

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

  // 7. Verify sheet tabs
  console.log('7. Verifying sheet tabs in spreadsheet...')
  await sheetPage.bringToFront()
  await sheetPage.reload({ waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 5000))
  await sheetPage.screenshot({ path: 'scripts/final_verified_sheets.png' })

  const tabs = await sheetPage.evaluate(() => {
    return Array.from(document.querySelectorAll('.docs-sheet-tab-name, .docs-sheet-tab')).map(t => t.innerText.trim()).filter(Boolean);
  })
  console.log('🎉 ALL CREATED SHEETS IN GOOGLE SPREADSHEET:', tabs)

  await new Promise(r => setTimeout(r, 4000))
  await browser.close()
  console.log('Finished everything successfully!')
}

authorizeAndDeployFinal().catch(err => {
  console.error('Fatal error:', err)
})
