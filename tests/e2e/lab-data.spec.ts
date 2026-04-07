import { test, expect } from '@playwright/test';

test.describe('Lab Data Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should display lab results list', async ({ page }) => {
    await page.goto('/lab-results');

    await expect(page.getByRole('heading', { name: /lab results/i })).toBeVisible();
    await expect(page.locator('[data-testid="lab-result-item"]').first()).toBeVisible();
  });

  test('should add new lab result', async ({ page }) => {
    await page.goto('/lab-results');
    await page.click('text=Add Lab Result');

    await page.fill('[name="testName"]', 'Complete Blood Count');
    await page.fill('[name="date"]', '2024-01-15');
    await page.fill('[name="hemoglobin"]', '14.5');
    await page.fill('[name="hematocrit"]', '42');
    await page.fill('[name="wbc"]', '7.5');
    await page.fill('[name="platelets"]', '250');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/lab result added successfully/i)).toBeVisible();
    await expect(page.getByText('Complete Blood Count')).toBeVisible();
  });

  test('should edit existing lab result', async ({ page }) => {
    await page.goto('/lab-results');
    await page.locator('[data-testid="lab-result-item"]').first().click();
    await page.click('text=Edit');

    await page.fill('[name="hemoglobin"]', '15.5');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/lab result updated successfully/i)).toBeVisible();
  });

  test('should delete lab result with confirmation', async ({ page }) => {
    await page.goto('/lab-results');
    await page.locator('[data-testid="lab-result-item"]').first().click();
    await page.click('text=Delete');

    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await page.click('button:has-text("Confirm")');

    await expect(page.getByText(/lab result deleted/i)).toBeVisible();
  });

  test('should filter lab results by date range', async ({ page }) => {
    await page.goto('/lab-results');
    await page.click('[data-testid="date-filter"]');

    await page.fill('[name="startDate"]', '2024-01-01');
    await page.fill('[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("Apply")');

    await expect(page.locator('[data-testid="lab-result-item"]')).toHaveCount(
      page.locator('[data-testid="lab-result-item"]').count()
    );
  });

  test('should search lab results by test name', async ({ page }) => {
    await page.goto('/lab-results');
    await page.fill('[placeholder="Search..."]', 'Blood');

    await expect(page.getByText('Complete Blood Count')).toBeVisible();
  });

  test('should export lab results as PDF', async ({ page }) => {
    await page.goto('/lab-results');
    await page.click('text=Export');
    await page.click('text=Export as PDF');

    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/.*\.pdf/);
  });

  test('should export lab results as CSV', async ({ page }) => {
    await page.goto('/lab-results');
    await page.click('text=Export');
    await page.click('text=Export as CSV');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/.*\.csv/);
  });

  test('should display lab result trends chart', async ({ page }) => {
    await page.goto('/lab-results');
    await page.locator('[data-testid="lab-result-item"]').first().click();

    await expect(page.locator('[data-testid="trends-chart"]')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/lab-results');
    await page.click('text=Add Lab Result');

    // Try to submit without filling fields
    await page.click('button[type="submit"]');

    await expect(page.getByText(/test name is required/i)).toBeVisible();
    await expect(page.getByText(/date is required/i)).toBeVisible();
  });

  test('should validate numeric fields', async ({ page }) => {
    await page.goto('/lab-results');
    await page.click('text=Add Lab Result');

    await page.fill('[name="testName"]', 'Test');
    await page.fill('[name="date"]', '2024-01-15');
    await page.fill('[name="hemoglobin"]', 'invalid');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/please enter a valid number/i)).toBeVisible();
  });
});

test.describe('Patient Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should display patient selector', async ({ page }) => {
    await expect(page.locator('[data-testid="patient-selector"]')).toBeVisible();
  });

  test('should switch between patients', async ({ page }) => {
    await page.click('[data-testid="patient-selector"]');
    await page.click('text=Jane Smith');

    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.locator('[data-testid="current-patient"]')).toHaveText('Jane Smith');
  });

  test('should add new patient', async ({ page }) => {
    await page.click('[data-testid="patient-selector"]');
    await page.click('text=Add New Patient');

    await page.fill('[name="name"]', 'New Patient');
    await page.fill('[name="dateOfBirth"]', '1990-01-01');
    await page.selectOption('[name="gender"]', 'male');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/patient added successfully/i)).toBeVisible();
    await expect(page.getByText('New Patient')).toBeVisible();
  });

  test('should show isolated data for each patient', async ({ page }) => {
    // Select first patient
    await page.click('[data-testid="patient-selector"]');
    await page.click('text=John Doe');
    await page.waitForTimeout(1000);

    const johnResults = await page.locator('[data-testid="lab-result-item"]').count();

    // Switch to second patient
    await page.click('[data-testid="patient-selector"]');
    await page.click('text=Jane Smith');
    await page.waitForTimeout(1000);

    const janeResults = await page.locator('[data-testid="lab-result-item"]').count();

    // Results should be different
    expect(johnResults).not.toBe(janeResults);
  });
});
