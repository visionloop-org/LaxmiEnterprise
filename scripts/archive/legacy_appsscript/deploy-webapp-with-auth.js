import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function deployWebappWithAuth() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const projectUrl = 'https://script.google.com/u/0/home/projects/1OG48kjlgZg7urhWL6rzdS4-wOuzqnFPF3VElTWBPSN8fazK89OA70Ry3/edit'

  console.log('1. Opening Apps Script project directly...')
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
  await page.goto(projectUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 6000))

  // Step 2: Click Deploy dropdown
  console.log('2. Clicking Deploy dropdown...')
  const deployBtnBox = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  await page.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  // Step 3: Click New deployment
  console.log('3. Clicking New deployment...')
  const newDeployBox = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div, span, button'));
    const item = items.find(el => el.textContent.trim() === 'New deployment' && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (newDeployBox) {
    await page.mouse.click(newDeployBox.x + newDeployBox.width / 2, newDeployBox.y + newDeployBox.height / 2)
  }
  await new Promise(r => setTimeout(r, 4000))

  // Step 4: Ensure Web app type is selected via gear icon if needed
  const hasWebApp = await page.evaluate(() => document.body.innerText.includes('Web app') && document.body.innerText.includes('Who has access'));
  if (!hasWebApp) {
    console.log('Selecting Web app via gear icon...')
    const gearBox = await page.evaluate(() => {
      const gears = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const gear = gears.find(b => (b.getAttribute('aria-label') || '').includes('type') || b.querySelector('mat-icon'));
      if (!gear) return null;
      const rect = gear.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    if (gearBox) {
      await page.mouse.click(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))

      const optBox = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div, span, button, [role="menuitem"]'));
        const item = items.find(el => el.textContent.trim() === 'Web app' && el.offsetParent !== null);
        if (!item) return null;
        const rect = item.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
      if (optBox) {
        await page.mouse.click(optBox.x + optBox.width / 2, optBox.y + optBox.height / 2)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }

  // Step 5: Ensure access is set to Anyone
  console.log('5. Ensuring access is set to Anyone...')
  const accessBox = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.mat-select, div[role="combobox"]'));
    const target = selects.find(s => s.offsetParent !== null && (s.innerText.includes('Only myself') || s.innerText.includes('Anyone')));
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (accessBox) {
    await page.mouse.click(accessBox.x + accessBox.width / 2, accessBox.y + accessBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))

    const anyoneBox = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('mat-option, [role="option"], div, span'));
      const opt = opts.find(o => o.textContent.trim() === 'Anyone' && o.offsetParent !== null);
      if (!opt) return null;
      const rect = opt.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    if (anyoneBox) {
      await page.mouse.click(anyoneBox.x + anyoneBox.width / 2, anyoneBox.y + anyoneBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  // Step 6: Click Deploy button
  console.log('6. Clicking Deploy button in modal...')
  const deployModalBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.disabled && b.getBoundingClientRect().y > 200);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (deployModalBtn) {
    await page.mouse.click(deployModalBtn.x + deployModalBtn.width / 2, deployModalBtn.y + deployModalBtn.height / 2)
    console.log('Clicked Deploy! Waiting for dialog state...')
  }

  await new Promise(r => setTimeout(r, 4000))

  // Step 7: Check if "Authorize access" button appeared
  console.log('7. Checking for "Authorize access" button...')
  const authAccessBox = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().includes('Authorize access') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (authAccessBox) {
    console.log('Found Authorize access button! Setting up OAuth listener...')
    const oauthPromise = browser.waitForTarget(t => t.url().includes('accounts.google.com') && (t.url().includes('oauth') || t.url().includes('consent') || t.url().includes('warning')), { timeout: 20000 })

    await page.mouse.click(authAccessBox.x + authAccessBox.width / 2, authAccessBox.y + authAccessBox.height / 2)
    console.log('Clicked Authorize access!')

    const oauthTarget = await oauthPromise
    console.log('OAuth popup detected! URL:', oauthTarget.url())
    const oauthPage = await oauthTarget.page()
    await oauthPage.bringToFront()
    await new Promise(r => setTimeout(r, 4000))

    // Choose account if needed
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

    // Check for "Advanced"
    const hasAdvanced = await oauthPage.evaluate(() => document.body.innerText.toLowerCase().includes('advanced'));
    if (hasAdvanced) {
      console.log('Clicking Advanced...')
      const advBox = await oauthPage.evaluate(() => {
        const els = Array.from(document.querySelectorAll('a, button, div[role="button"]'));
        const adv = els.find(l => l.textContent.trim().toLowerCase() === 'advanced' && l.offsetParent !== null);
        if (!adv) return null;
        const rect = adv.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })

      if (advBox) {
        await oauthPage.mouse.click(advBox.x + advBox.width / 2, advBox.y + advBox.height / 2)
        await new Promise(r => setTimeout(r, 2000))
      }

      // Click "Go to project (unsafe)"
      console.log('Clicking unsafe link...')
      const unsafeBox = await oauthPage.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const unsafe = links.find(l => (l.textContent.includes('unsafe') || l.textContent.includes('Go to')) && l.offsetParent !== null);
        if (!unsafe) return null;
        const rect = unsafe.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })

      if (unsafeBox) {
        await oauthPage.mouse.click(unsafeBox.x + unsafeBox.width / 2, unsafeBox.y + unsafeBox.height / 2)
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    // Select all checkbox
    console.log('Clicking Select all checkbox...')
    const selectAllBox = await oauthPage.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, label, span, input'));
      const item = els.find(el => el.textContent.trim() === 'Select all' && el.offsetParent !== null);
      if (!item) return null;
      const rect = item.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (selectAllBox) {
      await oauthPage.mouse.click(selectAllBox.x + 10, selectAllBox.y + selectAllBox.height / 2)
      await new Promise(r => setTimeout(r, 1500))
    } else {
      const checkbox = await oauthPage.$('input[type="checkbox"]')
      if (checkbox) await checkbox.click()
    }

    // Scroll to bottom and click Continue
    console.log('Scrolling to bottom and clicking Continue...')
    await oauthPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 1500))

    const continueBox = await oauthPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const btn = buttons.find(b => (b.textContent.trim() === 'Continue' || b.textContent.trim() === 'Allow') && b.offsetParent !== null);
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })

    if (continueBox) {
      await oauthPage.mouse.click(continueBox.x + continueBox.width / 2, continueBox.y + continueBox.height / 2)
      console.log('Clicked Continue! Waiting for popup to close and deployment to complete...')
      await new Promise(r => setTimeout(r, 8000))
    }
  }

  // Step 8: Back to main page: poll for Web App URL
  await page.bringToFront()
  console.log('8. Polling for Web App URL on main editor page...')
  let finalUrl = null
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const res = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/);
      if (match) return { done: true, url: match[0] };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const inp of inputs) {
        if ((inp.value || '').includes('script.google.com/macros/s/')) {
          return { done: true, url: inp.value };
        }
      }
      return { done: false, textSnippet: text.slice(0, 300) };
    })

    if (res.done) {
      finalUrl = res.url
      console.log('🎉🎉🎉 SUCCESSFUL DEPLOYMENT! URL:', finalUrl)
      break
    }
    console.log(`Polling deployment (${(i + 1) * 3}s)...`)
  }

  await page.screenshot({ path: 'scripts/final_live_deployed.png' })

  if (finalUrl) {
    const deploymentData = {
      spreadsheetId: '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI/edit',
      projectId: '1OG48kjlgZg7urhWL6rzdS4-wOuzqnFPF3VElTWBPSN8fazK89OA70Ry3',
      webAppUrl: finalUrl,
      deployedAt: new Date().toISOString()
    }
    fs.writeFileSync('scripts/deployed_webapp.json', JSON.stringify(deploymentData, null, 2))
    console.log('Deployment record saved to scripts/deployed_webapp.json!')

    // Close modal by clicking Done
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const doneBtn = buttons.find(b => b.textContent.trim() === 'Done' && b.offsetParent !== null);
      if (doneBtn) doneBtn.click();
    })
  }

  await new Promise(r => setTimeout(r, 3000))
  await browser.close()
  console.log('Automation complete!')
}

deployWebappWithAuth().catch(console.error)
