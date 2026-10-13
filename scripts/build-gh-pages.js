import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')

console.log('🚀 Assembling Laxmi Enterprise for GitHub Pages & PWA...')

// 1. Build apps/supervisor if not already built
const supervisorDist = path.resolve(rootDir, 'apps/supervisor/dist')
if (!fs.existsSync(supervisorDist)) {
  console.log('📦 Building Supervisor App...')
  try {
    execSync('npm run build --workspace=apps/supervisor', { stdio: 'inherit', cwd: rootDir })
  } catch (err) {
    console.error('❌ Failed to build Supervisor app:', err.message)
    process.exit(1)
  }
}

// 2. Build apps/admin if not already built
const adminDist = path.resolve(rootDir, 'apps/admin/dist')
if (!fs.existsSync(adminDist)) {
  console.log('📦 Building Admin App...')
  try {
    execSync('npm run build --workspace=apps/admin', { stdio: 'inherit', cwd: rootDir })
  } catch (err) {
    console.error('❌ Failed to build Admin app:', err.message)
    process.exit(1)
  }
}

// 3. Prepare unified dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true })
}
fs.mkdirSync(distDir, { recursive: true })

// Copy supervisor build to dist/supervisor
fs.cpSync(supervisorDist, path.resolve(distDir, 'supervisor'), { recursive: true })

// Copy admin build to dist/admin
fs.cpSync(adminDist, path.resolve(distDir, 'admin'), { recursive: true })

// Copy PWA icon assets to root dist
const supervisorPublic = path.resolve(rootDir, 'apps/supervisor/public')
const iconFiles = [
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png',
  'icon-maskable.svg',
  'apple-touch-icon.png'
]

for (const icon of iconFiles) {
  const src = path.resolve(supervisorPublic, icon)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.resolve(distDir, icon))
  }
}

// 4. Generate root manifest.json for unified hub
const rootManifest = {
  id: 'laxmi-enterprise-hub-pwa',
  name: 'Laxmi Enterprise — Workforce & Fleet Portal',
  short_name: 'Laxmi Enterprise',
  description: 'Unified Workforce Attendance, Fleet Allocation & Administrative Payroll System',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#0b0f19',
  theme_color: '#0f172a',
  lang: 'en-IN',
  dir: 'ltr',
  categories: ['business', 'productivity', 'utilities'],
  icons: [
    {
      src: './favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any'
    },
    {
      src: './icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: './icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: './icon-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ],
  shortcuts: [
    {
      name: 'Supervisor Attendance',
      short_name: 'Supervisor',
      description: 'Open live tablet workforce attendance roster',
      url: './supervisor/',
      icons: [{ src: './favicon.svg', sizes: 'any' }]
    },
    {
      name: 'Admin & Payroll Portal',
      short_name: 'Admin',
      description: 'Open admin portal, payroll & contractor settlements',
      url: './admin/',
      icons: [{ src: './favicon.svg', sizes: 'any' }]
    }
  ]
}
fs.writeFileSync(path.resolve(distDir, 'manifest.json'), JSON.stringify(rootManifest, null, 2), 'utf8')

// 5. Generate root sw.js
const rootSw = `/**
 * Laxmi Enterprise Unified Portal — Service Worker
 * Version: 1.0.0
 */
const CACHE_NAME = 'laxmi-hub-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k.startsWith('laxmi-hub-')).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((fetchRes) => {
        if (fetchRes && fetchRes.status === 200) {
          const clone = fetchRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return fetchRes;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
`
fs.writeFileSync(path.resolve(distDir, 'sw.js'), rootSw, 'utf8')

// 6. Copy default landing page to dist/index.html with PWA meta & Install Button
const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laxmi Enterprise — Workforce &amp; Fleet Portal</title>
  
  <!-- PWA & Mobile Web App Meta -->
  <meta name="theme-color" content="#0f172a">
  <meta name="description" content="Laxmi Enterprise Unified Workforce Attendance, Fleet Capacity &amp; Administrative Payroll System">
  <link rel="manifest" href="./manifest.json">
  <link rel="icon" type="image/svg+xml" href="./favicon.svg">
  <link rel="apple-touch-icon" href="./apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Laxmi Enterprise">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: #131b2e;
      --card-border: #1e293b;
      --primary: #3b82f6;
      --accent: #10b981;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
    }
    .container {
      max-width: 900px;
      width: 100%;
      text-align: center;
    }
    .top-badges {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: #34d399;
    }
    .install-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(59, 130, 246, 0.18);
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: #93c5fd;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .install-btn:hover {
      background: #2563eb;
      color: #ffffff;
      transform: translateY(-1px);
    }
    .app-installed-badge {
      display: none;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: #6ee7b7;
    }
    h1 {
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      font-size: 1.15rem;
      color: var(--muted);
      max-width: 600px;
      margin: 0 auto 40px auto;
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
      text-align: left;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 28px;
      text-decoration: none;
      color: inherit;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: var(--primary);
      box-shadow: 0 20px 40px -15px rgba(59, 130, 246, 0.2);
    }
    .card.admin:hover {
      border-color: #8b5cf6;
      box-shadow: 0 20px 40px -15px rgba(139, 92, 246, 0.2);
    }
    .card-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin-bottom: 20px;
    }
    .card.admin .card-icon {
      background: rgba(139, 92, 246, 0.12);
      border-color: rgba(139, 92, 246, 0.25);
    }
    .card h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text);
    }
    .card p {
      font-size: 0.95rem;
      color: var(--muted);
      line-height: 1.45;
      margin-bottom: 24px;
    }
    .card-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #60a5fa;
    }
    .card.admin .card-btn {
      color: #a78bfa;
    }
    .features {
      background: rgba(19, 27, 46, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 16px;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feature-item span {
      color: #34d399;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-badges">
      <div class="badge">⚡ Serverless &amp; Google Sheets Powered</div>
      <button type="button" id="installBtn" class="install-btn">📲 Install App on Device</button>
      <div id="installedBadge" class="app-installed-badge">✓ App Installed</div>
    </div>

    <h1>Laxmi Enterprise</h1>
    <p class="subtitle">Unified Workforce Attendance, Fleet Capacity &amp; Administrative Payroll System</p>
    
    <div class="grid">
      <!-- Supervisor App Card -->
      <a href="./supervisor/" class="card">
        <div>
          <div class="card-icon">📱</div>
          <h2>Supervisor Attendance</h2>
          <p>Touch-friendly tablet interface for live attendance marking, arrival times, vehicle fleet allocation &amp; PDF reports.</p>
        </div>
        <div class="card-btn">Open Supervisor View &rarr;</div>
      </a>

      <!-- Admin App Card -->
      <a href="./admin/" class="card admin">
        <div>
          <div class="card-icon">🏢</div>
          <h2>Admin &amp; Payroll Portal</h2>
          <p>Complete payroll calculations, overtime rates, employee approvals, fleet master management &amp; Google Sheets sync.</p>
        </div>
        <div class="card-btn">Open Admin Portal &rarr;</div>
      </a>
    </div>

    <div class="features">
      <div class="feature-item"><span>✓</span> 100% Client-Side</div>
      <div class="feature-item"><span>✓</span> Installable PWA</div>
      <div class="feature-item"><span>✓</span> Google Sheets Data Store</div>
      <div class="feature-item"><span>✓</span> Offline Cache &amp; Instant Sync</div>
      <div class="feature-item"><span>✓</span> GitHub Pages Hosted</div>
    </div>
  </div>

  <script>
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('✅ Hub PWA ServiceWorker registered:', reg.scope))
          .catch((err) => console.warn('⚠️ Hub PWA ServiceWorker registration failed:', err));
      });
    }

    // PWA Install Prompt Handler
    let deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');
    const installedBadge = document.getElementById('installedBadge');

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      if (installBtn) installBtn.style.display = 'none';
      if (installedBadge) installedBadge.style.display = 'inline-flex';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
        installBtn.style.background = '#2563eb';
        installBtn.style.color = '#ffffff';
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      if (installBtn) installBtn.style.display = 'none';
      if (installedBadge) installedBadge.style.display = 'inline-flex';
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            if (installBtn) installBtn.style.display = 'none';
            if (installedBadge) installedBadge.style.display = 'inline-flex';
          }
          deferredPrompt = null;
        } else {
          alert('To install Laxmi Enterprise on your device:\\n\\n• Chrome/Edge: Click the Install icon in the address bar (⊕)\\n• Android: Tap Menu (⋮) -> Add to Home screen\\n• iOS Safari: Tap Share (⎋) -> Add to Home Screen (⊞)');
        }
      });
    }
  </script>
</body>
</html>
`

fs.writeFileSync(path.resolve(distDir, 'index.html'), landingHtml, 'utf8')

// Also create .nojekyll so GitHub Pages serves all assets and folders properly
fs.writeFileSync(path.resolve(distDir, '.nojekyll'), '', 'utf8')

console.log('✅ GitHub Pages assembly completed with PWA in ./dist!')
