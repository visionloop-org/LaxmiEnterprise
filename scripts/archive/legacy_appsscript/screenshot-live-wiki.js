import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function screenshotLiveWiki() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

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

  await page.goto('https://github.com/visionloop-org/LaxmiEnterprise/wiki', { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))
  await page.screenshot({ path: 'scripts/final_github_wiki_live.png' })
  console.log('Wiki screenshot captured!')
  await browser.close()
}

screenshotLiveWiki().catch(console.error)
