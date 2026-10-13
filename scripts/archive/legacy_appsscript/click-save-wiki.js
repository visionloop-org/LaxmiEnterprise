import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'

async function clickSaveWiki() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  console.log('Launching Chrome to complete wiki save...')
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

  console.log('Navigating to wiki _new or edit...')
  await page.goto('https://github.com/visionloop-org/LaxmiEnterprise/wiki/_new', { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))

  const HOME_CONTENT = `# Welcome to the Laxmi Enterprise Wiki! 🚀

> **Laxmi Enterprise Attendance & Fleet Management System**  
> An enterprise-grade, offline-first, 100% serverless workforce attendance and vehicle fleet dispatch platform built for rapid daily industrial operations.

---

## 📌 Executive Summary

Laxmi Enterprise operates on a high-speed daily cadence coordinating **over 100 industrial employees, chalan men, and drivers**, multi-tier transport vehicle fleets, and third-party labour agency contractors across morning and evening shifts.

This system replaces manual register clipboards and complex server architectures with an ultra-lean, free-forever **React 19 + Vite 8 + Google Sheets Database + GitHub Pages** stack.

---

## 🌐 Live Production Infrastructure

| Component | Status | Production Link / ID |
| :--- | :---: | :--- |
| **Admin Portal** | 🟢 Live | [Live Admin Dashboard](https://visionloop-org.github.io/LaxmiEnterprise/admin/) |
| **Supervisor Tablet App** | 🟢 Live | [Live Field App](https://visionloop-org.github.io/LaxmiEnterprise/) |
| **Google Cloud Database** | 🟢 Online | [Open Laxmi Enterprise Database](https://docs.google.com/spreadsheets/d/1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI/edit) |
| **Live REST Web App API** | 🟢 Active | \`https://script.google.com/macros/s/AKfycbwVjlUPjX59Oy5G7nruqE_5iR5iKy0mevyHZuA0r_twa3UCx0Jc2QkYtMaWBjIwRNx4/exec\` |
| **Drive Automated Backups** | 🟢 Active | Folder ID: \`17ZL1U_N_AE-F1iP0t31e9-DGZGDNMSFp\` |
| **Database Owner** | 🟢 Secure | \`visionloop.in@gmail.com\` |

---

## 🎯 Current Project Status (v4.1 Modular Serverless)

| Milestone / Capability | Status | Description |
| :--- | :---: | :--- |
| **15 Specialized Data Sheets** | ✅ Complete | Full schema for Employees, Vehicles, Contractors, Rates, Sessions, Records, Payroll, Settlements, and Audits. |
| **Offline-First Data Engine** | ✅ Complete | Zero-latency local operations via \`localStorage\` with automatic 2-way cloud synchronization. |
| **Mobile Tablet Interface** | ✅ Complete | High-contrast touch buttons, single-tap status cycling, and photo verification. |
| **Dynamic Fleet Dispatch** | ✅ Complete | Real-time seat allocation, passenger count vs vehicle capacity conflict warnings, and trip logs. |
| **Admin Oversight Suite** | ✅ Complete | Shift lockdown controls, contractor billing calculations, bulk wage adjustments, and audit trails. |
| **Multi-Tier Google Identity** | ✅ Complete | Free-forever Google Account authentication with role-based view enforcement. |
| **Pre-Push Compilation Gates** | ✅ Complete | Husky hooks enforcing zero compilation errors, zero lint violations, and full test suite passing. |

---

## 🗺️ Project Roadmap

\`\`\`mermaid
gantt
    title Laxmi Enterprise Engineering Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 - Architecture
    Initial Monorepo & UI Proto        :done, p1, 2026-08-01, 2026-08-10
    Offline-First State Engine         :done, p2, 2026-08-11, 2026-08-20
    section Phase 2 - Cloud Database
    Google Sheets 15-Table Architecture :done, p3, 2026-08-21, 2026-09-02
    Apps Script REST Web App API       :done, p4, 2026-09-01, 2026-09-03
    section Phase 3 - Governance & Hardening
    Component Modularization (<150 loc) :done, p5, 2026-09-02, 2026-09-03
    GitHub Wiki & Documentation        :active, p6, 2026-09-03, 2026-09-04
    section Phase 4 - Advanced Features
    Biometric Fingerprint Scanner Sync :future, p7, 2026-09-15, 2026-10-01
    Automated WhatsApp PDF Shift Digest:future, p8, 2026-10-02, 2026-10-20
\`\`\`

---

## 📚 Wiki Documentation Index

1. **[[Project Roadmap]]** — Comprehensive milestones, timeline, and release deliverables.
2. **[[Architecture and Tech Stack]]** — Technical design, monorepo packages, state flow, and styling.
3. **[[Google Sheets Database]]** — Database schemas, 15 tables, Apps Script REST API, and backup structures.
4. **[[Supervisor Tablet App]]** — Daily workflow guide for field supervisors and attendance tracking.
5. **[[Admin Management Portal]]** — Workforce adjustments, contractor payroll, and fleet management.
6. **[[Deployment and CI-CD]]** — GitHub Pages deployment, GitHub Actions pipeline, and testing gates.

---
*Maintained by Vision Loop Core Engineering Team • © 2026 Vision Loop*
`

  await page.evaluate((content) => {
    const titleInput = document.querySelector('input[name="page"]') || document.querySelector('#gollum-editor-page-title') || document.querySelector('input[type="text"]');
    if (titleInput) {
      titleInput.value = 'Home';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const textarea = document.querySelector('textarea#gollum-editor-body') || document.querySelector('textarea');
    if (textarea) {
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, HOME_CONTENT)

  await new Promise(r => setTimeout(r, 2000))

  // Find the save button and scroll it into view
  const result = await page.evaluate(() => {
    const btn = document.querySelector('#gollum-editor-submit') || 
                document.querySelector('button[type="submit"]') ||
                Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
    if (!btn) return { found: false };
    btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    const rect = btn.getBoundingClientRect();
    return { found: true, id: btn.id, text: btn.textContent.trim(), rect };
  })

  console.log('Save button detection result:', result)
  await page.screenshot({ path: 'scripts/wiki_before_save_click.png' })

  if (result.found) {
    console.log('Clicking button via DOM click and mouse click...')
    await page.evaluate(() => {
      const btn = document.querySelector('#gollum-editor-submit') || 
                  document.querySelector('button[type="submit"]') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
      if (btn) btn.click();
    })
    await new Promise(r => setTimeout(r, 6000))
  }

  console.log('Current URL after save attempt:', page.url())
  await page.screenshot({ path: 'scripts/wiki_after_save_click.png' })

  await browser.close()
}

clickSaveWiki().catch(console.error)
