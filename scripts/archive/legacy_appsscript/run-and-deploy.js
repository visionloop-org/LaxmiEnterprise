import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function runAndDeploy() {
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

  console.log('Clicking Extensions menu...')
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

  console.log('Waiting for Apps Script editor tab...')
  const newTarget = await newTargetPromise
  const scriptPage = await newTarget.page()
  await scriptPage.bringToFront()
  await new Promise(r => setTimeout(r, 8000))

  console.log('Apps Script Page Title:', await scriptPage.title())
  await scriptPage.screenshot({ path: 'scripts/run_step1_editor.png' })

  // Click "▷ Run" button
  console.log('Finding and clicking Run button...')
  const runClicked = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, .goog-button, div[role="button"], span'));
    const runBtn = buttons.find(b => b.textContent.trim() === 'Run' && b.offsetParent !== null);
    if (runBtn) {
      runBtn.click();
      return true;
    }
    return false;
  })

  console.log('Run button clicked:', runClicked)
  await new Promise(r => setTimeout(r, 4000))
  await scriptPage.screenshot({ path: 'scripts/run_step2_after_run.png' })

  // Check for Authorization Required dialog
  console.log('Checking for authorization modal...')
  const hasAuthModal = await scriptPage.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Authorization required') || text.includes('Review permissions');
  })
  console.log('Has authorization modal:', hasAuthModal)

  if (hasAuthModal) {
    console.log('Clicking Review permissions...')
    // Catch OAuth popup window
    const oauthTargetPromise = browser.waitForTarget(t => t.url().includes('accounts.google.com/signin/oauth') || t.url().includes('oauth2'), { timeout: 15000 })

    await scriptPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const reviewBtn = buttons.find(b => b.textContent.trim().includes('Review permissions'));
      if (reviewBtn) reviewBtn.click();
    })

    console.log('Waiting for OAuth popup...')
    const oauthTarget = await oauthTargetPromise
    const oauthPage = await oauthTarget.page()
    await oauthPage.bringToFront()
    await new Promise(r => setTimeout(r, 4000))
    await oauthPage.screenshot({ path: 'scripts/run_step3_oauth_popup.png' })

    // Select account visionloop.in@gmail.com
    console.log('Selecting account in OAuth popup...')
    await oauthPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div, li, span'));
      const acc = items.find(el => el.textContent.includes('visionloop.in@gmail.com') && el.offsetParent !== null);
      if (acc) acc.click();
    })
    await new Promise(r => setTimeout(r, 4000))
    await oauthPage.screenshot({ path: 'scripts/run_step4_after_account.png' })

    // Click "Advanced"
    console.log('Checking for Advanced link...')
    await oauthPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button, div[role="button"]'));
      const adv = links.find(l => l.textContent.trim().toLowerCase() === 'advanced');
      if (adv) adv.click();
    })
    await new Promise(r => setTimeout(r, 2000))
    await oauthPage.screenshot({ path: 'scripts/run_step5_advanced_expanded.png' })

    // Click "Go to Untitled project (unsafe)"
    console.log('Clicking Go to project unsafe...')
    await oauthPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const unsafe = links.find(l => l.textContent.includes('unsafe') || l.textContent.includes('Go to'));
      if (unsafe) unsafe.click();
    })
    await new Promise(r => setTimeout(r, 3000))
    await oauthPage.screenshot({ path: 'scripts/run_step6_consent_screen.png' })

    // Click "Allow"
    console.log('Clicking Allow...')
    await oauthPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const allow = buttons.find(b => b.textContent.trim() === 'Allow' || b.id === 'submit_approve_access');
      if (allow) allow.click();
    })
    await new Promise(r => setTimeout(r, 5000))
  }

  // Back to script page - execution should be running or finished
  await scriptPage.bringToFront()
  console.log('Waiting for execution to complete...')
  await new Promise(r => setTimeout(r, 10000))
  await scriptPage.screenshot({ path: 'scripts/run_step7_execution_done.png' })

  // Take screenshot of spreadsheet to see created sheets!
  await page.bringToFront()
  await new Promise(r => setTimeout(r, 4000))
  await page.screenshot({ path: 'scripts/spreadsheet_after_setup.png' })

  await new Promise(r => setTimeout(r, 5000))
  await browser.close()
  console.log('Execution finished!')
}

runAndDeploy().catch(err => {
  console.error('Error in runAndDeploy:', err)
})
