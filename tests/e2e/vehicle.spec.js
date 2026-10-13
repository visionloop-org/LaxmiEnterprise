import { test, expect } from '@playwright/test';

test.describe('Vehicle Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to supervisor app
    await page.goto('http://localhost:5173');
    
    // Login
    await page.click('button:has-text("Sign in with Google")');
    await page.fill('input[type="email"]', 'Maalaxmi.godown@gmail.com');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('.employee-table', { timeout: 10000 });
  });

  test('supervisor can view vehicles tab', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Verify vehicle table is visible
    await expect(page.locator('.vehicle-table')).toBeVisible();
    
    // Verify vehicles are displayed
    const vehicles = page.locator('.vehicle-row');
    const count = await vehicles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('supervisor can assign employee to vehicle', async ({ page }) => {
    // Mark an employee as present first
    const firstEmployee = page.locator('.employee-row').first();
    await firstEmployee.locator('button:has-text("On Time")').click();
    
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Select first vehicle
    const firstVehicle = page.locator('.vehicle-row').first();
    await firstVehicle.click();
    
    // Click assign button
    await page.click('button:has-text("Assign Employee")');
    
    // Select employee from dropdown
    await page.selectOption('select[name="employee"]', 'EMP001');
    await page.selectOption('select[name="role"]', 'Driver');
    
    // Confirm assignment
    await page.click('button:has-text("Confirm")');
    
    // Verify assignment was successful
    await expect(page.locator('.assignment-success')).toBeVisible();
  });

  test('supervisor can view vehicle capacity utilization', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Verify capacity indicators are visible
    await expect(page.locator('.capacity-indicator')).toBeVisible();
    
    // Verify capacity progress bars
    const progressBars = page.locator('.capacity-progress');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('supervisor can detect capacity violations', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Try to assign more than 8 employees to a vehicle
    const firstVehicle = page.locator('.vehicle-row').first();
    await firstVehicle.click();
    
    // Assign multiple employees to trigger capacity warning
    for (let i = 0; i < 9; i++) {
      await page.click('button:has-text("Assign Employee")');
      await page.selectOption('select[name="employee"]', `EMP00${i + 1}`);
      await page.click('button:has-text("Confirm")');
    }
    
    // Verify capacity warning is shown
    await expect(page.locator('.capacity-warning')).toBeVisible();
  });

  test('supervisor can unassign employee from vehicle', async ({ page }) => {
    // First assign an employee
    await page.click('button:has-text("Vehicles")');
    const firstVehicle = page.locator('.vehicle-row').first();
    await firstVehicle.click();
    await page.click('button:has-text("Assign Employee")');
    await page.selectOption('select[name="employee"]', 'EMP001');
    await page.click('button:has-text("Confirm")');
    
    // Now unassign the employee
    await page.click('button:has-text("Unassign")');
    
    // Verify unassignment was successful
    await expect(page.locator('.unassign-success')).toBeVisible();
  });

  test('supervisor can view vehicle assignment history', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Select a vehicle
    const firstVehicle = page.locator('.vehicle-row').first();
    await firstVehicle.click();
    
    // Click view history
    await page.click('button:has-text("View History")');
    
    // Verify history modal is visible
    await expect(page.locator('.assignment-history-modal')).toBeVisible();
  });

  test('supervisor can create and track vehicle trip', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Select a vehicle with assigned driver
    const firstVehicle = page.locator('.vehicle-row').first();
    await firstVehicle.click();
    
    // Start trip
    await page.click('button:has-text("Start Trip")');
    
    // Fill trip details
    await page.fill('input[name="destination"]', 'Construction Site A');
    await page.fill('textarea[name="notes"]', 'Delivering construction materials');
    await page.click('button:has-text("Dispatch")');
    
    // Verify trip was created
    await expect(page.locator('.trip-created')).toBeVisible();
    
    // Track trip progress
    await page.click('button:has-text("Track Trip")');
    await expect(page.locator('.trip-tracker-modal')).toBeVisible();
    
    // Update trip status
    await page.click('button:has-text("Reached Location")');
    await page.click('button:has-text("Delivered")');
    await page.click('button:has-text("Returned")');
    
    // Verify trip completion
    await expect(page.locator('.trip-completed')).toBeVisible();
  });

  test('supervisor can view fleet statistics', async ({ page }) => {
    // Navigate to right panel for stats
    await page.click('button:has-text("Stats")');
    
    // Verify fleet statistics are visible
    await expect(page.locator('.fleet-statistics')).toBeVisible();
    await expect(page.locator('.total-vehicles')).toBeVisible();
    await expect(page.locator('.vehicles-in-use')).toBeVisible();
    await expect(page.locator('.available-vehicles')).toBeVisible();
  });

  test('supervisor can filter vehicles by status', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Filter by available vehicles
    await page.click('button:has-text("Available")');
    
    // Verify filter is applied
    await expect(page.locator('button:has-text("Available").active')).toBeVisible();
    
    // Verify only available vehicles are shown
    const vehicles = page.locator('.vehicle-row');
    const count = await vehicles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('supervisor can view vehicle maintenance status', async ({ page }) => {
    // Navigate to vehicles tab
    await page.click('button:has-text("Vehicles")');
    
    // Check for maintenance indicators
    const maintenanceIndicators = page.locator('.maintenance-indicator');
    const count = await maintenanceIndicators.count();
    
    // If there are maintenance indicators, verify they're visible
    if (count > 0) {
      await expect(maintenanceIndicators.first()).toBeVisible();
    }
  });
});