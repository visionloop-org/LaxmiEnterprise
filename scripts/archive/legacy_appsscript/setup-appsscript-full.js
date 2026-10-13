import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function setupAppsScriptFull() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const spreadsheetId = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  const codeContent = fs.readFileSync('google-sheets/Code.gs', 'utf8')

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
  if (!extMenu) throw new Error('#docs-extensions-menu not found')
  const box = await extMenu.boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  console.log('Waiting for Apps Script menu item...')
  const newTargetPromise = browser.waitForTarget(t => t.url().includes('script.google.com'), { timeout: 20000 })

  // Find Apps Script menu item coordinates
  const appsScriptBox = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.goog-menuitem, .goog-menuitem-content, div'));
    const item = items.find(el => el.textContent.trim().startsWith('Apps Script') && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (!appsScriptBox) {
    throw new Error('Could not find Apps Script item in Extensions menu')
  }

  console.log('Clicking Apps Script item at:', appsScriptBox)
  await page.mouse.click(appsScriptBox.x + appsScriptBox.width / 2, appsScriptBox.y + appsScriptBox.height / 2)

  console.log('Waiting for Apps Script editor tab...')
  const newTarget = await newTargetPromise
  console.log('Apps Script tab opened! URL:', newTarget.url())

  const scriptPage = await newTarget.page()
  await scriptPage.bringToFront()
  await new Promise(r => setTimeout(r, 8000))

  console.log('Apps Script Page Title:', await scriptPage.title())
  await scriptPage.screenshot({ path: 'scripts/appsscript_loaded.png' })

  // Wait for Monaco Editor
  console.log('Locating code editor...')
  await scriptPage.waitForSelector('.monaco-editor, textarea', { timeout: 20000 })
  await new Promise(r => setTimeout(r, 2000))

  // Select all existing code and replace with Code.gs
  console.log('Focusing editor and replacing code...')
  await scriptPage.click('.monaco-editor')
  await scriptPage.keyboard.down('Control')
  await scriptPage.keyboard.press('KeyA')
  await scriptPage.keyboard.up('Control')
  await scriptPage.keyboard.press('Backspace')

  // Set clipboard / type or evaluate script to paste code
  console.log('Setting code content directly in Monaco editor...')
  const replaced = await scriptPage.evaluate((newCode) => {
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      if (editors && editors.length > 0) {
        editors[0].setValue(newCode);
        return true;
      }
    }
    return false;
  }, codeContent)

  console.log('Replaced code via monaco API:', replaced)

  if (!replaced) {
    console.log('Monaco API not directly accessible on window, pasting via clipboard/keyboard...')
    await scriptPage.evaluate((code) => {
      navigator.clipboard.writeText(code);
    }, codeContent);
    await scriptPage.click('.monaco-editor')
    await scriptPage.keyboard.down('Control')
    await scriptPage.keyboard.press('KeyV')
    await scriptPage.keyboard.up('Control')
  }

  await new Promise(r => setTimeout(r, 3000))
  await scriptPage.screenshot({ path: 'scripts/code_pasted.png' })

  // Save the script (Ctrl + S)
  console.log('Saving script (Ctrl + S)...')
  await scriptPage.keyboard.down('Control')
  await scriptPage.keyboard.press('KeyS')
  await scriptPage.keyboard.up('Control')
  await new Promise(r => setTimeout(r, 4000))

  await scriptPage.screenshot({ path: 'scripts/script_saved.png' })
  console.log('Script saved!')

  // Keep open for execution
  await new Promise(r => setTimeout(r, 5000))
  await browser.close()
  console.log('Finished setup step 1.')
}

setupAppsScriptFull().catch(err => {
  console.error('Error in setupAppsScriptFull:', err)
})
