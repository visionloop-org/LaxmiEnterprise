# Google Drive API Setup Guide

This guide will help you set up Google Drive API with OAuth 2.0 for the Laxmi Enterprise application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Laxmi Enterprise Drive")
5. Click "Create"

## Step 2: Enable Google Drive API

1. In the Cloud Console, make sure your new project is selected
2. Go to **APIs & Services** > **Library**
3. Search for "Google Drive API"
4. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose "External" (for production) or "Internal" (for testing within your organization)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Laxmi Enterprise
   - **User support email**: your email
   - **Developer contact**: your email
5. Click "Save and Continue"
6. Skip the "Scopes" section (add default scopes later if needed)
7. Click "Save and Continue"
8. Add test users (for External type) - add your Gmail address
9. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Choose application type: **Web application**
4. Fill in the details:
   - **Name**: Laxmi Enterprise Web App
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local supervisor app)
     - `http://localhost:5174` (for local admin app)
     - `https://visionloop-org.github.io` (for GitHub Pages production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173`
     - `http://localhost:5174`
     - `https://visionloop-org.github.io`
5. Click "Create"
6. Copy the **Client ID** (it looks like: `123456789-abcxyz.apps.googleusercontent.com`)

## Step 5: Configure Your Application

### For Local Development

1. Copy the Client ID from Step 4
2. Open `apps/supervisor/.env` (create it if it doesn't exist)
3. Add: `VITE_GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
4. Open `apps/admin/.env` (create it if it doesn't exist)
5. Add: `VITE_GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

### For Production (GitHub Pages)

Since GitHub Pages doesn't support environment variables, you'll need to:

1. Hardcode the Client ID in your app's code, OR
2. Use a build-time replacement, OR
3. Use URL query parameters: `?clientId=your-client-id.apps.googleusercontent.com`

## Step 6: Load Google API Client

Add the Google API client script to your HTML files:

### For Supervisor App (`apps/supervisor/index.html`)

```html
<script src="https://apis.google.com/js/api.js"></script>
<script src="https://accounts.google.com/gsi/client"></script>
```

### For Admin App (`apps/admin/index.html`)

```html
<script src="https://apis.google.com/js/api.js"></script>
<script src="https://accounts.google.com/gsi/client"></script>
```

## Step 7: Initialize Drive CSV Service

In your app's initialization code (e.g., in `App.jsx` or a dedicated setup component):

```javascript
import { driveCsvService } from '@laxmi/shared'

// Initialize Google API client
await driveCsvService.initializeGoogleAPI()

// Check if user is already signed in
if (driveCsvService.isAuthenticated()) {
  console.log('Already signed in with Google')
} else {
  // Show sign-in button or modal
}
```

## Step 8: Use Drive Sync Modal

The `DriveSyncModal` component provides a UI for:

1. Setting up OAuth configuration
2. Signing in with Google
3. Creating Drive folder structure
4. Syncing data to/from Drive

Example usage:

```javascript
import { DriveSyncModal } from '@laxmi/shared'
import { useState } from 'react'

function App() {
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsDriveModalOpen(true)}>
        📁 Drive Sync
      </button>
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        driveService={driveCsvService}
      />
    </>
  )
}
```

## Migration from Google Sheets

If you're migrating from the existing Google Sheets setup:

1. Use the migration script to export your Sheets data to CSV:
   ```bash
   node scripts/migrate-sheets-to-drive.js <your-sheets-webapp-url>
   ```

2. This will create a `migrated-csv-data/` directory with all your data organized by domain

3. Follow the upload instructions in `migrated-csv-data/UPLOAD_INSTRUCTIONS.md`

4. Alternatively, use the Drive Sync modal to create the folder structure, then manually upload the CSV files

## Important Notes

### Free Tier Benefits

- Google Drive API is **completely free** to use
- No monthly costs or quotas like Google Sheets API
- Unlimited storage within your Google Drive quota (15GB free, expandable)

### Security

- Use the same OAuth client ID for both supervisor and admin apps
- Keep your Client Secret (if using backend) secure - never commit it to git
- For public apps, use the "External" OAuth consent screen

### Rate Limits

- Google Drive API has rate limits, but they're generous for typical usage
- The app implements exponential backoff for retries
- Local caching reduces API calls

### Offline Support

- The app uses localStorage for offline access
- Changes are queued and synced when connection restores
- Auto-sync runs every 20 seconds when online

## Troubleshooting

### "Google API client not loaded"

- Ensure the Google API scripts are loaded in your HTML
- Check browser console for script loading errors
- Verify network connectivity

### "Invalid Client ID"

- Double-check the Client ID from Google Cloud Console
- Ensure the authorized origins match your app's URL
- For local development, use `http://localhost:5173` and `http://localhost:5174`

### "Access blocked: OAuth consent"

- If using External consent screen, add your email as a test user
- For production, complete the verification process in Google Cloud Console

### "API key not authorized"

- This shouldn't happen with OAuth 2.0 (no API key needed)
- If you see this, you might be mixing API key authentication with OAuth

## Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about)
- [Google Identity Services Documentation](https://developers.google.com/identity)
- [OAuth 2.0 for Client-Side Web Applications](https://developers.google.com/identity/protocols/oauth2)
