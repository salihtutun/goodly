"""E2E tests for Goodly — critical user journeys.

Run: npx playwright test
Requires: FRONTEND_URL env var (defaults to http://localhost:3000)
"""
const { test, expect } = require('@playwright/test');

const TEST_EMAIL = `e2e-${Date.now()}@goodly-test.com`;
const TEST_PASSWORD = 'E2ETestPass123!';

test.describe('Auth Flow', () => {
  test('register → login → dashboard → logout', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('[data-testid="register-name-input"]', 'E2E User');
    await page.fill('[data-testid="register-email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="register-password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="register-submit-btn"]');
    await expect(page).toHaveURL(/\/app/);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-btn"]');
    await expect(page).toHaveURL('/login');

    // Login
    await page.fill('[data-testid="login-email-input"]', TEST_EMAIL);
    await page.fill('[data-testid="login-password-input"]', TEST_PASSWORD);
    await page.click('[data-testid="login-submit-btn"]');
    await expect(page).toHaveURL(/\/app/);
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', 'admin@goodly.app');
    await page.fill('[data-testid="login-password-input"]', 'wrong-password');
    await page.click('[data-testid="login-submit-btn"]');
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('forgot password flow', async ({ page }) => {
    await page.goto('/login');
    await page.click('[data-testid="forgot-password-link"]');
    await expect(page).toHaveURL('/forgot-password');
    await page.fill('[data-testid="forgot-email-input"]', 'admin@goodly.app');
    await page.click('[data-testid="forgot-submit-btn"]');
    await expect(page.locator('[data-testid="forgot-success"]')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user cannot access projects', async ({ page }) => {
    await page.goto('/app/projects');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user cannot access billing', async ({ page }) => {
    await page.goto('/app/billing');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Public Pages', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="hero-cta-primary"]')).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms');
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy');
  });

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('sidebar navigation works', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', 'admin@goodly.app');
    await page.fill('[data-testid="login-password-input"]', 'admin-secret-123');
    await page.click('[data-testid="login-submit-btn"');
    await expect(page).toHaveURL(/\/app/);

    // Navigate to projects
    await page.click('[data-testid="nav-projects"]');
    await expect(page).toHaveURL('/app/projects');

    // Navigate to audit
    await page.click('[data-testid="nav-audit"]');
    await expect(page).toHaveURL('/app/audit');

    // Navigate to AI tools
    await page.click('[data-testid="nav-ai-tools"]');
    await expect(page).toHaveURL('/app/ai-tools');
  });
});
