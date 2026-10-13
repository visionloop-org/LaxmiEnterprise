import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function doCleanDeploy() {
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

  // Step 2: Rename Untitled project if present
  console.log('2. Checking project title...')
  const titleBox = await page.evaluate(() => {
    const title = Array.from(document.querySelectorAll('div, span')).find(el => el.textContent.trim() === 'Untitled project' && el.offsetParent !== null);
    if (!title) return null;
    const rect = title.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (titleBox) {
    console.log('Renaming project to "Laxmi Enterprise Backend"...')
    await page.mouse.click(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2)
    await new Promise(r => setTimeout(r, 1500))

    // Clear input and type
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')
    await page.keyboard.type('Laxmi Enterprise Backend')
    await new Promise(r => setTimeout(r, 500))

    // Click Rename button
    const renameBtnBox = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Rename' && b.offsetParent !== null);
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
    if (renameBtnBox) {
      await page.mouse.click(renameBtnBox.x + renameBtnBox.width / 2, renameBtnBox.y + renameBtnBox.height / 2)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // Step 3: Click Deploy dropdown
  console.log('3. Clicking Deploy dropdown...')
  const deployBtnBox = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  await page.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  // Step 4: Click New deployment
  console.log('4. Clicking New deployment...')
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

  // Step 5: Select Web app via gear if not selected
  const hasWebApp = await page.evaluate(() => document.body.innerText.includes('Web app'));
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

  // Step 6: Set "Who has access" to "Anyone"
  console.log('6. Ensuring access is set to Anyone...')
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

  // Step 7: Click Deploy button
  console.log('7. Clicking Deploy button...')
  const deployModalBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Deploy' && b.offsetParent !== null && !b.disabled && b.getBoundingClientRect().y > 200);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (deployModalBtn) {
    await page.mouse.click(deployModalBtn.x + deployModalBtn.width / 2, deployModalBtn.y + deployModalBtn.height / 2)
    console.log('Clicked Deploy! Polling for completion...')
  }

  // Step 8: Poll for deployment completion
  let finalUrl = null
  for (let i = 0; i < 30; i++) {
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

      const hasDoneBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'Done' && b.offsetParent !== null);
      return { done: false, hasDoneBtn, textSnippet: text.slice(0, 300) };
    })

    console.log(`Poll ${i + 1}: done=${res.done}, hasDoneBtn=${res.hasDoneBtn}`)
    if (res.done) {
      finalUrl = res.url
      console.log('🎉🎉🎉 SUCCESSFUL DEPLOYMENT! URL:', finalUrl)
      break
    }
    await page.screenshot({ path: `scripts/deploy_poll_${i + 1}.png` })
  }

  if (finalUrl) {
    fs.writeFileSync('scripts/deployed_webapp.json', JSON.stringify({
      spreadsheetId: '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI',
      projectId: '1OG48kjlgZg7urhWL6rzdS4-wOuzqnFPF3VElTWBPSN8fazK89OA70Ry3',
      webAppUrl: finalUrl,
      deployedAt: new Date().toISOString()
    }, null, 2))
    console.log('Deployment record saved to scripts/deployed_webapp.json')
  }

  await browser.close()
}

doCleanDeploy().catch(console.error)
