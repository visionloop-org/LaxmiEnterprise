import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function triggerAppsScript() {
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

  console.log('Testing physical mouse click on Extensions menu...')
  const extMenu = await page.$('#docs-extensions-menu')
  if (extMenu) {
    const box = await extMenu.boundingBox()
    console.log('Extensions menu box:', box)
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      console.log('Clicked Extensions menu at coordinates!')
      await new Promise(r => setTimeout(r, 2000))
      await page.screenshot({ path: 'scripts/extensions_dropdown_opened.png' })
    }
  }

  // Check if any popup menu is visible
  const menuVisible = await page.evaluate(() => {
    const menus = Array.from(document.querySelectorAll('.goog-menu, .apps-menu'));
    return menus.filter(m => m.offsetParent !== null).map(m => m.innerText);
  })
  console.log('Visible menus:', menuVisible)

  await new Promise(r => setTimeout(r, 3000))
  await browser.close()
}

triggerAppsScript().catch(console.error)
