import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function checkManageDeployments() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  const spreadsheetId = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

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

  // Find Deploy button
  const deployBtnBox = await scriptPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const btn = buttons.find(b => b.textContent.trim().startsWith('Deploy') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  await scriptPage.mouse.click(deployBtnBox.x + deployBtnBox.width / 2, deployBtnBox.y + deployBtnBox.height / 2)
  await new Promise(r => setTimeout(r, 1500))

  // Click "Manage deployments"
  const manageDeployBox = await scriptPage.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div, span, button'));
    const item = items.find(el => el.textContent.trim() === 'Manage deployments' && el.offsetParent !== null);
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (manageDeployBox) {
    await scriptPage.mouse.click(manageDeployBox.x + manageDeployBox.width / 2, manageDeployBox.y + manageDeployBox.height / 2)
  }
  await new Promise(r => setTimeout(r, 5000))
  await scriptPage.screenshot({ path: 'scripts/manage_now.png' })

  // Print all modal text
  const modalText = await scriptPage.evaluate(() => document.body.innerText)
  console.log('--- MODAL TEXT ---')
  console.log(modalText.slice(modalText.indexOf('Manage deployments'), modalText.indexOf('Manage deployments') + 800))

  // Check inputs and links
  const details = await scriptPage.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, a')).map(el => ({ tag: el.tagName, val: el.value || el.href || el.innerText }));
    return inputs.filter(i => i.val && i.val.length > 5);
  })
  console.log('--- DETAILS ---', details)

  await browser.close()
}

checkManageDeployments().catch(console.error)
