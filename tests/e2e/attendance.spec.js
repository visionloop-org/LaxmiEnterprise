import { test, expect } from '@playwright/test';

test.describe('Attendance Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to supervisor app
    await page.goto('http://localhost:5173');
  });

  test('supervisor can mark attendance - on time', async ({ page }) => {
    // Login with demo credentials
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    // Wait for app to load
    await page.waitForSelector('.employee-table', { timeout: 10000 });
    
    // Find first employee and mark as on time
    const firstEmployee = page.locator('.employee-row').first();
    const employeeName = await firstEmployee.locator('.employee-name').textContent();
    
    await firstEmployee.locator('button:has-text("On Time")').click();
    
    // Verify attendance was marked
    await expect(firstEmployee.locator('.attendance-status')).toHaveText('On Time');
    
    console.log(`Marked ${employeeName} as On Time`);
  });

  test('supervisor can mark attendance - arrived with time', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.employee-table', { timeout: 10000 });
    
    // Find first employee and mark as arrived
    const firstEmployee = page.locator('.employee-row').first();
    await firstEmployee.locator('button:has-text("Arrived")').click();
    
    // Select arrival time in modal
    await page.selectOption('select[name="arrivalTime"]', '08:30');
    await page.fill('textarea[name="remarks"]', 'Traffic delay');
    await page.click('button:has-text("Confirm")');
    
    // Verify attendance was marked
    await expect(firstEmployee.locator('.attendance-status')).toHaveText('Arrived');
  });

  test('supervisor can mark attendance - absent', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.employee-table', { timeout: 10000 });
    
    // Find first employee and mark as absent
    const firstEmployee = page.locator('.employee-row').first();
    await firstEmployee.locator('button:has-text("Absent")').click();
    
    // Verify attendance was marked
    await expect(firstEmployee.locator('.attendance-status')).toHaveText('Absent');
  });

  test('supervisor can filter employees by category', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.employee-table', { timeout: 10000 });
    
    // Filter by Drivers category
    await page.click('button:has-text("Drivers")');
    
    // Verify only drivers are shown
    const employees = page.locator('.employee-row');
    const count = await employees.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify category filter is active
    await expect(page.locator('button:has-text("Drivers").active')).toBeVisible();
  });

  test('supervisor can search employees by name', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.employee-table', { timeout: 10000 });
    
    // Search for specific employee
    await page.fill('input[placeholder="Search employees..."]', 'Ramesh');
    
    // Verify search results
    const employees = page.locator('.employee-row');
    const count = await employees.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify search term is in results
    const firstEmployee = await employees.first().locator('.employee-name').textContent();
    expect(firstEmployee.toLowerCase()).toContain('ramesh');
  });

  test('supervisor can finalize attendance', async ({ page }) => {
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.employee-table', { timeout: 10000 });
    
    // Mark some employees as present
    const employees = page.locator('.employee-row');
    const firstEmployee = employees.first();
    await firstEmployee.locator('button:has-text("On Time")').click();
    
    // Finalize attendance
    await page.click('button:has-text("Finalize Attendance")');
    
    // Verify confirmation dialog
    await expect(page.locator('.confirm-modal')).toBeVisible();
    await page.click('button:has-text("Confirm")');
    
    // Verify attendance is locked
    await expect(page.locator('button:has-text("Finalize Attendance")')).toBeDisabled();
  });
});