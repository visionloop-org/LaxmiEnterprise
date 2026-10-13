import puppeteer from 'puppeteer-core'
import path from 'path'
import os from 'os'
import fs from 'fs'

const HOME_WIKI_CONTENT = `# Welcome to the Laxmi Enterprise Wiki! 🚀

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
*Maintained by Vision Loop Core Engineering Team &bull; © 2026 Vision Loop*
`

async function setupGithubWiki() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const tempProfileDir = path.join(os.tmpdir(), 'laxmi-chrome-automation')

  console.log('1. Launching Chrome with logged-in session...')
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

  console.log('2. Navigating to repository wiki page...')
  await page.goto('https://github.com/visionloop-org/LaxmiEnterprise/wiki', { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))
  await page.screenshot({ path: 'scripts/wiki_step1_landing.png' })

  // Check if "Create the first page" button exists
  console.log('3. Looking for "Create the first page" button...')
  const createBtnBox = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('a, button'));
    const btn = buttons.find(b => b.textContent.trim().includes('Create the first page') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, href: btn.href };
  })

  if (createBtnBox) {
    console.log('Found Create the first page button! Clicking:', createBtnBox)
    await page.mouse.click(createBtnBox.x + createBtnBox.width / 2, createBtnBox.y + createBtnBox.height / 2)
  } else {
    console.log('Navigating directly to https://github.com/visionloop-org/LaxmiEnterprise/wiki/_new ...')
    await page.goto('https://github.com/visionloop-org/LaxmiEnterprise/wiki/_new', { waitUntil: 'networkidle2', timeout: 30000 })
  }

  await new Promise(r => setTimeout(r, 4000))
  await page.screenshot({ path: 'scripts/wiki_step2_editor.png' })

  // Fill in content
  console.log('4. Pasting Home wiki content...')
  await page.evaluate((content) => {
    const textarea = document.querySelector('textarea#gollum-editor-body') || document.querySelector('textarea');
    if (textarea) {
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, HOME_WIKI_CONTENT)

  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: 'scripts/wiki_step3_content_pasted.png' })

  // Click Save Page
  console.log('5. Clicking "Save Page" button...')
  const saveBtnBox = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
    const btn = buttons.find(b => (b.textContent.trim() === 'Save Page' || b.value === 'Save Page') && b.offsetParent !== null);
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })

  if (saveBtnBox) {
    console.log('Clicking Save Page button:', saveBtnBox)
    await page.mouse.click(saveBtnBox.x + saveBtnBox.width / 2, saveBtnBox.y + saveBtnBox.height / 2)
    await new Promise(r => setTimeout(r, 6000))
  }

  await page.screenshot({ path: 'scripts/wiki_step4_saved.png' })
  console.log('Final page URL:', page.url())

  await browser.close()
  console.log('Initial wiki page creation process completed!')
}

setupGithubWiki().catch(console.error)
