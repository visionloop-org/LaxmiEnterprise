import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function inspectInputs() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: tempProfileDir,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport: null
  })

  const pages = await browser.pages()
  const page = pages[0] || await browser.newPage()

  await page.goto('https://accounts.google.com/ServiceLogin?service=wise&continue=https://docs.google.com/spreadsheets/', {
    waitUntil: 'networkidle2'
  })

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(inp => ({
      id: inp.id,
      name: inp.name,
      type: inp.type,
      outerHTML: inp.outerHTML.slice(0, 150)
    }))
  })

  console.log('Detected inputs:', JSON.stringify(inputs, null, 2))
  await browser.close()
}

inspectInputs().catch(console.error)
