import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function testGithubLogin() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  console.log('Launching Chrome to test GitHub login...')
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
  await new Promise(r => setTimeout(r, 4000))

  const url = page.url()
  console.log('Current URL:', url)
  await page.screenshot({ path: 'scripts/github_landing.png' })

  if (url.includes('login')) {
    console.log('On login page! Entering credentials...')
    await page.type('#login_field', 'visionloop-org', { delay: 50 })
    await page.type('#password', 'VisionLoop@2026!Secure', { delay: 50 })
    await page.screenshot({ path: 'scripts/github_creds_entered.png' })
    await page.click('input[type="submit"]')
    await new Promise(r => setTimeout(r, 6000))
    console.log('After submit URL:', page.url())
    await page.screenshot({ path: 'scripts/github_after_submit.png' })
  }

  // Check if we are now at wiki or can create first page
  if (page.url().includes('wiki')) {
    console.log('Successfully reached wiki page!')
    await page.screenshot({ path: 'scripts/github_wiki_active.png' })
  }

  await browser.close()
  console.log('Finished testGithubLogin.')
}

testGithubLogin().catch(console.error)
