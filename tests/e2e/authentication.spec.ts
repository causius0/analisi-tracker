import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /create account|register/i })).toBeVisible();
  });

  test('should allow user to register', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="confirmPassword"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should allow password reset', async ({ page }) => {
    await page.click('text=Forgot password');
    await expect(page).toHaveURL(/.*forgot-password/);
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/.*dashboard/);

    // Logout
    await page.click('[aria-label="user menu"]');
    await page.click('text=Logout');

    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should remember me functionality', async ({ page }) => {
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.check('[name="remember"]');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/.*dashboard/);

    // Close and reopen browser
    await page.context().close();

    // Should still be logged in
    await page.goto('/');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
