import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function checkGithubSession() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const userProfile = 'C:\\Users\\pc\\AppData\\Local\\Google\\Chrome\\User Data'

  console.log('Testing GitHub session with Chrome User Data...')
  try {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      userDataDir: userProfile,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--profile-directory=Default'
      ]
    })

    const page = await browser.newPage()
    await page.goto('https://github.com/visionloop-org/LaxmiEnterprise/wiki', { waitUntil: 'networkidle2', timeout: 20000 })
    const title = await page.title()
    const url = page.url()
    const text = await page.evaluate(() => document.body.innerText.slice(0, 500))
    console.log('PAGE TITLE:', title)
    console.log('PAGE URL:', url)
    console.log('PAGE SNIPPET:', text)
    await page.screenshot({ path: 'scripts/github_wiki_check.png' })
    await browser.close()
  } catch (err) {
    console.error('Error opening with user profile:', err.message)
  }
}

checkGithubSession().catch(console.error)
