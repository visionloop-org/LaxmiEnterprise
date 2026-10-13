import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function loginGithub() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  console.log('Launching Chrome to log in to GitHub...')
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
  await page.goto('https://github.com/login', { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: 'scripts/gh_login_1.png' })

  console.log('Entering username and password...')
  await page.type('#login_field', 'visionloop-org', { delay: 60 })
  await page.type('#password', 'VisionLoop@2026!Secure', { delay: 60 })
  await page.screenshot({ path: 'scripts/gh_login_2.png' })

  console.log('Submitting login form...')
  await page.click('input[type="submit"]')
  await new Promise(r => setTimeout(r, 6000))
  console.log('After submit URL:', page.url())
  await page.screenshot({ path: 'scripts/gh_login_3.png' })

  await browser.close()
}

loginGithub().catch(console.error)
