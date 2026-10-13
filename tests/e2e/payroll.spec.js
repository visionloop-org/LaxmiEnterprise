import { test, expect } from '@playwright/test';

test.describe('Payroll Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin app
    await page.goto('http://localhost:5174');
  });

  test('admin can login and view dashboard', async ({ page }) => {
    // Login with admin credentials
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    // Wait for dashboard to load
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Verify dashboard elements are visible
    await expect(page.locator('.stats-overview')).toBeVisible();
    await expect(page.locator('.employee-management-table')).toBeVisible();
  });

  test('admin can view employee management table', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Navigate to employee management
    await page.click('button:has-text("Employees")');
    
    // Verify employee table is visible
    await expect(page.locator('.employee-table')).toBeVisible();
    
    // Verify table has data
    const rows = page.locator('.employee-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('admin can filter employees by date range', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Set date range
    await page.click('button:has-text("Last 7 Days")');
    
    // Verify date filter is applied
    await expect(page.locator('.date-filter:has-text("Last 7 Days")')).toBeVisible();
  });

  test('admin can search employees', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Search for employee
    await page.fill('input[placeholder="Search employees..."]', 'Ramesh');
    
    // Verify search results
    const employees = page.locator('.employee-row');
    const count = await employees.count();
    expect(count).toBeGreaterThan(0);
  });

  test('admin can view payroll calculations', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Navigate to payroll section
    await page.click('button:has-text("Payroll")');
    
    // Verify payroll calculations are visible
    await expect(page.locator('.payroll-calculations')).toBeVisible();
    await expect(page.locator('.total-payout')).toBeVisible();
  });

  test('admin can export payroll CSV', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Navigate to payroll section
    await page.click('button:has-text("Payroll")');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;
    
    // Verify download happened
    expect(download.suggestedFilename()).toContain('payroll');
  });

  test('admin can view contractor settlements', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Navigate to contractor settlements
    await page.click('button:has-text("Contractors")');
    
    // Verify contractor panel is visible
    await expect(page.locator('.contractor-payroll-panel')).toBeVisible();
  });

  test('admin can access Google Sheets sync', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Gauravjaiswal0304@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
    
    // Open Google Sheets sync modal
    await page.click('button:has-text("Sync")');
    
    // Verify sync modal is visible
    await expect(page.locator('.google-sheets-sync-modal')).toBeVisible();
  });
});