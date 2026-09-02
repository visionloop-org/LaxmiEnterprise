import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')

console.log('🚀 Building Laxmi Enterprise for GitHub Pages...')

// 1. Build apps/supervisor
console.log('📦 Building Supervisor App...')
try {
  execSync('npm run build --workspace=apps/supervisor', { stdio: 'inherit', cwd: rootDir })
} catch (err) {
  console.error('❌ Failed to build Supervisor app:', err.message)
  process.exit(1)
}

// 2. Build apps/admin
console.log('📦 Building Admin App...')
try {
  execSync('npm run build --workspace=apps/admin', { stdio: 'inherit', cwd: rootDir })
} catch (err) {
  console.error('❌ Failed to build Admin app:', err.message)
  process.exit(1)
}

// 3. Prepare unified dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true })
}
fs.mkdirSync(distDir, { recursive: true })

// Copy supervisor build to dist/supervisor
fs.cpSync(path.resolve(rootDir, 'apps/supervisor/dist'), path.resolve(distDir, 'supervisor'), { recursive: true })

// Copy admin build to dist/admin
fs.cpSync(path.resolve(rootDir, 'apps/admin/dist'), path.resolve(distDir, 'admin'), { recursive: true })

// Copy default landing page to dist/index.html
const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laxmi Enterprise — Workforce & Fleet Portal</title>
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
      margin-bottom: 20px;
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
    <div class="badge">⚡ Serverless &amp; Google Sheets Powered</div>
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
      <div class="feature-item"><span>✓</span> Google Sheets Data Store</div>
      <div class="feature-item"><span>✓</span> Offline Cache &amp; Instant Sync</div>
      <div class="feature-item"><span>✓</span> GitHub Pages Hosted</div>
    </div>
  </div>
</body>
</html>
`

fs.writeFileSync(path.resolve(distDir, 'index.html'), landingHtml, 'utf8')

// Also create .nojekyll so GitHub Pages serves all assets and folders properly
fs.writeFileSync(path.resolve(distDir, '.nojekyll'), '', 'utf8')

console.log('✅ GitHub Pages build completed in ./dist!')
