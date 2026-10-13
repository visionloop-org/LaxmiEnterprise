import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')
  
  console.log('Testing browser launch with puppeteer-core...')
  console.log('Chrome path:', chromePath)
  console.log('Temp profile dir:', tempProfileDir)

  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true })
  }

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

  console.log('Navigating to Google account chooser...')
  await page.goto('https://accounts.google.com/ServiceLogin?service=wise&continue=https://docs.google.com/spreadsheets/', {
    waitUntil: 'networkidle2'
  })

  console.log('Current page title:', await page.title())
  console.log('Current URL:', page.url())

  // Keep open for 5 seconds
  await new Promise(r => setTimeout(r, 5000))
  await browser.close()
  console.log('Done test.')
}

run().catch(console.error)
