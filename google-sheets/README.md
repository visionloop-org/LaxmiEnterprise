# Laxmi Enterprise — Google Sheets Setup Guide

This web application operates as a **100% serverless frontend** that stores and retrieves all data directly from **Google Sheets**.

---

## 1-Minute Setup Instructions

### Step 1: Create or Open a Google Spreadsheet
1. Go to [sheets.new](https://sheets.new) in your browser.
2. Name your spreadsheet: `Laxmi Enterprise Database`.

### Step 2: Add the Apps Script API Backend
1. In your Google Sheet, click on **Extensions** > **Apps Script**.
2. Delete any code in `Code.gs` and copy-paste the entire contents of [`google-sheets/Code.gs`](./Code.gs).
3. Click **Save** (Ctrl+S or the Disk icon).

### Step 3: Run Master Setup (One-Time)
1. In the Apps Script toolbar, select the function **`setupLaxmiEnterpriseSystem`** in the dropdown.
2. Click **Run**.
3. If prompted with *"Authorization required"*, click **Review permissions** -> Select your Google Account -> Click **Advanced** -> Click **Go to Laxmi Enterprise API (unsafe)** -> Click **Allow**.
4. Check your Google Sheet & Google Drive:
   - All 9 formatted, color-coded sheets are automatically created!
   - Structured folders in Google Drive (`01_Live_Database`, `02_Daily_Attendance_Backups`, `03_Monthly_Payroll_Reports`, `04_Supervisor_PDF_Exports`, `05_Contractor_Settlements`) are generated automatically!
   - See [SHEET_STRUCTURE.md](./SHEET_STRUCTURE.md) for full column breakdowns.

### Step 4: Deploy as a Web App
1. In Apps Script, click the blue **Deploy** button at top right > **New deployment**.
2. Select type: **Web app** (gear icon > Web app).
3. Set the following options:
   - **Description**: `Laxmi Enterprise Web API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(Note: This allows your frontend web app to read and write without complex OAuth)*
4. Click **Deploy**.
5. Copy the generated **Web app URL** (it looks like: `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 5: Connect in Laxmi Enterprise Admin Portal
1. Open the Laxmi Enterprise web application.
2. Log in as Admin (`admin` / `admin`).
3. Click the **📊 Google Sheets Sync** button in the header.
4. Paste your **Web app URL** and click **Test & Save Connection**.
5. Click **Sync Now** to pull or push data!

---

## GitHub Pages Deployment

To host this website for free on GitHub Pages:
1. Push your repository to GitHub.
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Build and deployment**, select **GitHub Actions** (or deploy the `dist/` directory from branch `gh-pages` / `main`).
4. Your website is live worldwide at `https://<username>.github.io/<repository-name>/`!
