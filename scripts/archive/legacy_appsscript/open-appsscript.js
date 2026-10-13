import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function openAppsScript() {
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

  console.log('Finding Extensions menu...')
  // Click Extensions menu by text or ID
  const clicked = await page.evaluate(() => {
    const menuItems = Array.from(document.querySelectorAll('.goog-control, .menu-button, div[role="menuitem"], div'));
    const extMenu = menuItems.find(el => el.textContent.trim() === 'Extensions' && el.offsetParent !== null);
    if (extMenu) {
      extMenu.click();
      return true;
    }
    const byId = document.getElementById('docs-extensions-menu');
    if (byId) {
      byId.click();
      return true;
    }
    return false;
  })

  console.log('Clicked Extensions menu:', clicked)
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: 'scripts/extensions_menu_open.png' })

  // Listen for the new target (new tab for Apps Script)
  const newTargetPromise = browser.waitForTarget(target => target.url().includes('script.google.com'), { timeout: 15000 })

  console.log('Clicking Apps Script in dropdown...')
  const clickedAppsScript = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.goog-menuitem, .goog-menuitem-content, span, div'));
    const item = items.find(el => el.textContent.trim() === 'Apps Script' && el.offsetParent !== null);
    if (item) {
      item.click();
      return true;
    }
    return false;
  })

  console.log('Clicked Apps Script:', clickedAppsScript)

  try {
    const newTarget = await newTargetPromise
    console.log('New target detected:', newTarget.url())
    const scriptPage = await newTarget.page()
    await scriptPage.bringToFront()
    await new Promise(r => setTimeout(r, 6000))
    console.log('Apps Script Title:', await scriptPage.title())
    console.log('Apps Script URL:', scriptPage.url())
    await scriptPage.screenshot({ path: 'scripts/appsscript_tab_ready.png' })
  } catch (e) {
    console.log('Could not catch new target automatically:', e.message)
    await page.screenshot({ path: 'scripts/appsscript_click_failed.png' })
  }

  await new Promise(r => setTimeout(r, 6000))
  await browser.close()
  console.log('Done open Apps Script step.')
}

openAppsScript().catch(console.error)
