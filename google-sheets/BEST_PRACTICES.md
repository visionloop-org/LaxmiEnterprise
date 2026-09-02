# Best Practices for Using Google Sheets as a Database & GitHub Pages

Operating a **100% serverless web application** using **Google Sheets** as the primary database provides extreme convenience, zero server costs, and instant accessibility. However, Google Sheets has specific architectural traits and quotas.

Below are the essential best practices to follow to ensure high performance, security, and data integrity:

---

## 1. Concurrency & Locking (Preventing Race Conditions)

### ⚠️ The Risk:
When multiple supervisors or admins mark attendance or edit records at the exact same second, simultaneous writes could overwrite each other.

### ✅ Best Practice:
- **Use `LockService` in Apps Script**: Always wrap write operations in `LockService.getScriptLock()` with a timeout (e.g. `lock.tryLock(20000)`). If the lock cannot be acquired, return a `LOCK_TIMEOUT` error with an HTTP 429 status code instead of failing silently.
- **Exponential Backoff & Jitter**: The client service implements exponential backoff retry logic (`fetchWithRetry` with delays 600ms → 1400ms → 3000ms + random jitter) to gracefully retry when Google Apps Script is busy.
- **Optimistic UI with Local Storage**: The frontend updates immediately on screen (`0ms` latency) and submits the sync payload in the background.

---

## 2. Formula Injection Defense (CWE-1236)

### ⚠️ The Risk:
If a user enters an employee name, vehicle note, or contractor starting with `=`, `+`, `-`, or `@` (e.g., `=IMPORTXML(...)` or `=IMAGE(...)`), Google Sheets might execute it as an executable spreadsheet formula.

### ✅ Best Practice:
- **Prepend Single Quote `'` to Untrusted Input**: In `Code.gs`, any user-supplied text starting with `=`, `+`, `-`, or `@` is passed through `sanitizeCellValue(val)` before being written into any cell. Google Sheets treats the cell strictly as plain text, neutralizing formula execution.

---

## 3. Serverless Google Authentication & Role Governance

### ⚠️ The Risk:
Managing username/password pairs inside spreadsheets creates security hazards and credential leak risks.

### ✅ Best Practice:
- **Google Identity Services (GIS)**: Use client-side Sign-in with Google. The browser receives a signed OpenID Connect JWT ID Token directly from Google.
- **Spreadsheet Role Governance (`Users_Roles`)**: Map verified Gmail addresses directly in the `Users_Roles` worksheet.
- **Instant Revocation**: To revoke access for an employee or supervisor, simply set their `Status` in the `Users_Roles` sheet to `Inactive` or delete the row. They are immediately blocked on their next login attempt.

---

## 4. Managing Quotas & Rate Limits

### ⚠️ Google Apps Script Quotas (Free vs Workspace):
- **URL Fetch & Script Invocations**: 20,000 requests/day (Free Gmail) vs 50,000+/day (Google Workspace).
- **Simultaneous Executions**: ~30 concurrent calls max.

### ✅ Best Practices:
1. **Batch Writes**: Never send one network request per worker. When updating multiple workers or wages, use **`bulkSaveEmployees`** or **`bulkUploadAll`**.
2. **Debounce Inputs**: Debounce search, wage rate typing, and filter changes so requests aren't fired on every keystroke.
3. **Cache Reads (`localStorage` / React Query)**: Store the employee list and vehicle fleet in the browser with a 5-minute cache time (`staleTime: 5m`). Only refetch when necessary or on manual sync.

---

## 5. Spreadsheet Size & Performance Management

### ⚠️ The Limit:
Google Sheets allows up to **10 million cells**. However, sheets with >50,000 rows can experience slower query response times (~2–3 seconds).

### ✅ Best Practices:
1. **Monthly Archiving**: At the end of each month, export completed `Attendance_Records` to the Google Drive folder `03_Monthly_Payroll_Reports/` and clear finalized historical rows from the active sheet.
2. **Keep the Master Lean**: Keep only the current active month in `Attendance_Records` and current shift in `Attendance_Sessions`.
3. **Avoid Heavy Cell Formulas in Transaction Sheets**: Do calculations (e.g. `(Base / 8) * 1.5 * ExtraHours`) inside the frontend or Apps Script before inserting values, rather than placing thousands of `=SUM(...)` or `=VLOOKUP(...)` formulas across columns.

---

## 6. Automated Daily Google Drive Backups

### ⚠️ The Risk:
Accidental deletion or manual row edits directly in the Google Sheets interface.

### ✅ Best Practice:
- **Set a Time-driven Trigger in Apps Script**:
  1. Open your Apps Script editor.
  2. Click the **Triggers (Clock icon)** on the left sidebar.
  3. Click **+ Add Trigger**.
  4. Choose function: **`backupSpreadsheetToDrive`**.
  5. Select event source: **Time-driven** -> **Day timer** -> **6pm to 7pm**.
  6. Click **Save**.
  - Now, your system will automatically create a dated snapshot inside `02_Daily_Attendance_Backups/` every single day!

---

## 7. GitHub Pages Deployment & Clean Architecture

1. **Relative Paths**: Always ensure Vite `base: './'` is configured so scripts and stylesheets load properly on `https://<username>.github.io/<repo>/`.
2. **Pre-Push Compilation Gate**: Ensure [`.husky/pre-push`](../.husky/pre-push) runs before any code push to compile both apps and verify unit test suites.
3. **PWA / Mobile Bookmark**: Supervisors can tap **"Add to Home Screen"** on their Android/iPad tablets to launch the app full-screen like a native app.

---

## Summary Checklist

| Area | Recommended Action |
|---|---|
| 🔒 **Concurrency** | Use `LockService` in `Code.gs` and exponential backoff retry in client. |
| 🛡️ **Formula Injection** | Sanitize user strings with `sanitizeCellValue` prepending `'`. |
| 🔑 **Authentication** | Use Google Identity Services (GIS) tied to `Users_Roles` sheet. |
| ⚡ **Performance** | Cache data in `localStorage`; batch wage/attendance updates. |
| 📦 **Capacity** | Archive monthly records to Google Drive to keep sheet < 20,000 rows. |
| 💾 **Backups** | Configure a daily 6:00 PM Apps Script time-driven backup trigger. |
