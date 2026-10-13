import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function automate() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  console.log('Launching Chrome with clean session...')
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

  console.log('Navigating to Google Sign In...')
  await page.goto('https://accounts.google.com/ServiceLogin?service=wise&continue=https://docs.google.com/spreadsheets/', {
    waitUntil: 'networkidle2'
  })

  console.log('Entering email...')
  const emailSelector = '#identifierId'
  await page.waitForSelector(emailSelector, { timeout: 10000 })
  await page.type(emailSelector, 'visionloop.in@gmail.com', { delay: 60 })

  await page.screenshot({ path: 'scripts/step2_email_entered.png' })

  console.log('Clicking Next...')
  // Click Next button or press Enter
  await page.keyboard.press('Enter')

  // Wait for password field or navigation
  console.log('Waiting for response...')
  await new Promise(r => setTimeout(r, 4000))
  await page.screenshot({ path: 'scripts/step3_after_next.png' })

  console.log('Page title after next:', await page.title())
  console.log('Page url after next:', page.url())

  // Check if password input is present
  try {
    const passwordSelector = 'input[type="password"]:not([aria-hidden="true"])'
    await page.waitForSelector(passwordSelector, { timeout: 8000 })
    console.log('Password input found! Entering password...')
    await page.type(passwordSelector, 'VisionLoop@2026!Secure', { delay: 60 })
    await page.screenshot({ path: 'scripts/step4_password_entered.png' })

    console.log('Submitting password...')
    await page.keyboard.press('Enter')

    await new Promise(r => setTimeout(r, 6000))
    await page.screenshot({ path: 'scripts/step5_after_password.png' })
    console.log('Page title after password:', await page.title())
    console.log('Page url after password:', page.url())
  } catch (err) {
    console.log('Password selector timed out or not available:', err.message)
    await page.screenshot({ path: 'scripts/step3_error_state.png' })
    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('Page snippet:', bodyText.slice(0, 400))
  }

  // Keep open for a bit
  await new Promise(r => setTimeout(r, 10000))
  await browser.close()
  console.log('Finished automation run.')
}

automate().catch(err => {
  console.error('Automation error:', err)
})
