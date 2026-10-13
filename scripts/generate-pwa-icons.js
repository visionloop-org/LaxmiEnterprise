import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#0b0f19"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#34d399" stop-opacity="0.1"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Outer Rounded Container -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="8"/>
  
  <!-- Ambient Glow Circle -->
  <circle cx="256" cy="240" r="160" fill="url(#glowGrad)" opacity="0.3"/>

  <!-- Iconic Monogram: Stylized 'L' + Checkmark & Fleet Wings -->
  <g filter="url(#glow)">
    <!-- Main Bold 'L' Backbone -->
    <path d="M152 110 C152 98 162 88 174 88 H204 C216 88 226 98 226 110 V314 H350 C362 314 372 324 372 336 V366 C372 378 362 388 350 388 H174 C162 388 152 378 152 366 Z" fill="url(#accentGrad)"/>
    
    <!-- Dynamic Attendance Check & Dispatch Arrow -->
    <path d="M236 210 L288 262 L394 156" fill="none" stroke="#34d399" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
    
    <!-- Fleet Transport Indicator Dots -->
    <circle cx="394" cy="156" r="14" fill="#38bdf8"/>
    <circle cx="174" cy="110" r="12" fill="#60a5fa"/>
    <circle cx="350" cy="366" r="12" fill="#10b981"/>
  </g>
</svg>`

const maskableSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#0b0f19"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Full Bleed Square for Safe Area Masking -->
  <rect x="0" y="0" width="512" height="512" fill="url(#bgGrad)"/>
  
  <!-- Safe Zone Scale (80% scale centered) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <g filter="url(#glow)">
      <!-- Main Bold 'L' Backbone -->
      <path d="M152 110 C152 98 162 88 174 88 H204 C216 88 226 98 226 110 V314 H350 C362 314 372 324 372 336 V366 C372 378 362 388 350 388 H174 C162 388 152 378 152 366 Z" fill="url(#accentGrad)"/>
      
      <!-- Dynamic Attendance Check & Dispatch Arrow -->
      <path d="M236 210 L288 262 L394 156" fill="none" stroke="#34d399" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
      
      <circle cx="394" cy="156" r="14" fill="#38bdf8"/>
      <circle cx="174" cy="110" r="12" fill="#60a5fa"/>
      <circle cx="350" cy="366" r="12" fill="#10b981"/>
    </g>
  </g>
</svg>`

const createHtml = (svg) => `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>${svg}</body>
</html>`

const findChromePath = () => {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ]
  return candidates.find(p => fs.existsSync(p))
}

async function generateIcons() {
  const chromePath = findChromePath()
  if (!chromePath) {
    console.error('❌ Chrome/Edge executable not found for rendering PNG icons.')
    process.exit(1)
  }

  console.log(`🎨 Using browser at: ${chromePath}`)
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const targets = [
    path.resolve(rootDir, 'apps/supervisor/public'),
    path.resolve(rootDir, 'apps/admin/public')
  ]

  const page = await browser.newPage()

  for (const dir of targets) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Save SVGs
    fs.writeFileSync(path.resolve(dir, 'favicon.svg'), svgContent, 'utf8')
    fs.writeFileSync(path.resolve(dir, 'icon-maskable.svg'), maskableSvgContent, 'utf8')

    // 1. Render 512x512 standard PNG
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 })
    await page.setContent(createHtml(svgContent), { waitUntil: 'domcontentloaded' })
    await page.screenshot({
      path: path.resolve(dir, 'icon-512.png'),
      omitBackground: true
    })

    // 2. Render 192x192 standard PNG
    await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 })
    await page.setContent(createHtml(svgContent), { waitUntil: 'domcontentloaded' })
    await page.screenshot({
      path: path.resolve(dir, 'icon-192.png'),
      omitBackground: true
    })

    // 3. Render 180x180 Apple Touch Icon
    await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 })
    await page.setContent(createHtml(svgContent), { waitUntil: 'domcontentloaded' })
    await page.screenshot({
      path: path.resolve(dir, 'apple-touch-icon.png'),
      omitBackground: false
    })

    // 4. Render 512x512 Maskable PNG
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 })
    await page.setContent(createHtml(maskableSvgContent), { waitUntil: 'domcontentloaded' })
    await page.screenshot({
      path: path.resolve(dir, 'icon-maskable.png'),
      omitBackground: false
    })

    console.log(`✅ Generated PWA icons in ${dir}`)
  }

  await page.close()
  await browser.close()
  console.log('✨ All PWA icon assets generated successfully!')
}

generateIcons().catch(err => {
  console.error('❌ Failed to generate PWA icons:', err)
  process.exit(1)
})
