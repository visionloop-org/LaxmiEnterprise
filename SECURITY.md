# 🔒 Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | :----------------: |
| Latest (master) | ✅ |
| Tagged releases (v5.x) | ✅ |
| Older versions (<= v4.x) | ❌ |

---

## 🚨 Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability in Laxmi Enterprise, please report it responsibly:

### 📧 Email (Preferred)
Send details to: **visionloop.in@gmail.com**

Subject line: `[SECURITY] LaxmiEnterprise - <Brief Description>`

### 📋 What to Include in Your Report

Please include:
1. **Description** — Clear description of the vulnerability
2. **Impact** — What data or functionality could be affected
3. **Reproduction Steps** — Step-by-step guide to reproduce
4. **Environment** — Browser, OS, app version
5. **Suggested Fix** — (Optional) Your recommendation

---

## ⏱️ Response Timeline

| Stage | Timeline |
| :--- | :--- |
| Acknowledgment | Within 48 hours |
| Initial Assessment | Within 5 business days |
| Fix or Mitigation | Within 14 days (critical), 30 days (others) |
| Public Disclosure | Coordinated with reporter |

---

## 🏗️ Security Architecture

### Data Security & Multi-Spreadsheet Drive Isolation
- **100% Serverless Architecture** — Eliminates traditional server, OS, and container vulnerability surfaces.
- **Drive Permission Segmentation**: Sensitive financial and payroll data (`03_Laxmi_Payroll_Accounting`) can be restricted exclusively to management/finance accounts in Google Drive permissions, separating it from operational shift records (`02_Laxmi_Attendance_Fleet`).
- **Role-Based Access Control (RBAC)**: Managed in `01_Laxmi_HR_Master` -> `Users_Roles` worksheet:
  - **Admin**: `Gauravjaiswal0304@gmail.com`
  - **Supervisor**: `Maalaxmi.godown@gmail.com`
- **Formula Injection Defense (CWE-1236)**: All user-supplied strings beginning with `=`, `+`, `-`, or `@` are automatically prepended with a single quote (`'`) via `sanitizeCellValue()` before insertion into any spreadsheet cell.
- **No Passwords Stored**: Authentication is delegated to Google Identity Services (GIS) OpenID Connect JWT tokens with Google's multi-factor authentication (2FA).

### Frontend & Client Security
- **Client-Centric Heavy Computation**: Mathematical calculations and conflict assertions run locally via `ClientComputationService`, preventing tampered server roundtrips.
- **Content Security Policy**: Enforced via Vite build configurations.
- **Strict Mode & Safe Rendering**: No `eval()`, no `dangerouslySetInnerHTML`.
- **HTTPS Enforced**: GitHub Pages and Google Apps Script enforce HTTPS end-to-end.
- **PWA Service Worker Scope**: Restricted strictly to `/LaxmiEnterprise/` scope.

### Secrets Management
- Production Google Sheets Web App URLs stored as **GitHub Actions Secrets**.
- `.env` files are **gitignored** and never committed to version control.

---

## 🙏 Responsible Disclosure

We follow a **coordinated disclosure policy**. We ask that:
- You give us reasonable time to fix the issue before public disclosure
- You don't access or modify data that isn't yours
- You don't perform DoS attacks

In return, we will:
- Respond promptly and keep you informed
- Credit you in the release notes (if desired)
- Not take legal action against good-faith researchers

---

## 📚 Security Resources

- [Google Apps Script Security](https://developers.google.com/apps-script/guides/support/security)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Vite Security Guidelines](https://vite.dev/guide/env-and-mode.html)

