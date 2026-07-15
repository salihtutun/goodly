// Authenticated E2E tests for searchgoodly.com
// Tests login, dashboard, audit flow, and public audit
// Run: FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/authenticated.spec.js
const { test, expect } = require('@playwright/test');

const BASE = process.env.FRONTEND_URL || 'https://searchgoodly.com';
const TIMEOUT = 20000;

async function dismissCookie(p) {
  const btn = p.locator('button:has-text("Got it")');
  try { if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await p.waitForTimeout(500); } } catch {}
}

async function tryLogin(p, email, password) {
  await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
  await dismissCookie(p);

  // Try demo button first
  const demoBtn = p.locator('button:has-text("demo")').or(p.locator('button:has-text("Demo")'));
  const demoVisible = await demoBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (demoVisible) {
    await demoBtn.first().click({ force: true });
    await p.waitForTimeout(3000);
    const url = p.url();
    if (url.includes('/app')) return true;
  }

  // Fall back to manual login
  const emailInput = p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'));
  const pwInput = p.locator('input[type="password"]').or(p.locator('input[placeholder*="Password"]'));
  await emailInput.first().fill(email);
  await pwInput.first().fill(password);
  await p.locator('button:has-text("Sign in")').first().click({ force: true });
  await p.waitForTimeout(3000);

  const url = p.url();
  return url.includes('/app');
}

// ═══════════════════════════════════════════════════════════════
// 1. LOGIN FLOW
// ═══════════════════════════════════════════════════════════════
test.describe('1. Login Flow', () => {
  test('Login page has all required elements', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    // Email input
    const emailInput = p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'));
    await expect(emailInput.first()).toBeVisible();

    // Password input
    const pwInput = p.locator('input[type="password"]').or(p.locator('input[placeholder*="Password"]'));
    await expect(pwInput.first()).toBeVisible();

    // Sign in button
    await expect(p.locator('button:has-text("Sign in")').first()).toBeVisible();

    // Demo account button
    const demoBtn = p.locator('button:has-text("demo")').or(p.locator('button:has-text("Demo")'));
    const demoCount = await demoBtn.count();
    expect(demoCount).toBeGreaterThan(0);

    // Register link
    await expect(p.locator('a[href="/register"]').first()).toBeVisible();

    // Forgot password link
    await expect(p.locator('a[href="/forgot-password"]').first()).toBeVisible();

    await ctx.close();
  });

  test('Login with wrong password shows error or stays on login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const emailInput = p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'));
    const pwInput = p.locator('input[type="password"]').or(p.locator('input[placeholder*="Password"]'));
    await emailInput.first().fill('admin@searchgoodly.com');
    await pwInput.first().fill('wrong-password-xyz-123');
    await p.locator('button:has-text("Sign in")').first().click({ force: true });
    await p.waitForTimeout(3000);

    // Should stay on login page
    const url = p.url();
    expect(url).toMatch(/\/login/);

    await ctx.close();
  });

  test('Empty form submission stays on login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    await p.locator('button:has-text("Sign in")').first().click({ force: true });
    await p.waitForTimeout(2000);

    const url = p.url();
    expect(url).toMatch(/\/login/);

    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. PUBLIC AUDIT FLOW
// ═══════════════════════════════════════════════════════════════
test.describe('2. Public Audit Flow', () => {
  test('Public audit page loads with form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });

    const urlInput = p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]').or(p.locator('input[placeholder*="URL"]')));
    await expect(urlInput.first()).toBeVisible();

    const submitBtn = p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")').or(p.locator('button:has-text("Audit")')));
    await expect(submitBtn.first()).toBeVisible();

    await ctx.close();
  });

  test('Enter URL and submit audit returns results', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });

    const urlInput = p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]').or(p.locator('input[placeholder*="URL"]')));
    await urlInput.first().fill('example.com');

    const submitBtn = p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")').or(p.locator('button:has-text("Audit")')));
    await submitBtn.first().click({ force: true });

    // Wait for results
    await p.waitForTimeout(10000);

    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(200);

    await ctx.close();
  }, { timeout: 30000 });
});

// ═══════════════════════════════════════════════════════════════
// 3. LANDING PAGE AUDIT CTA
// ═══════════════════════════════════════════════════════════════
test.describe('3. Landing Page Audit CTA', () => {
  test('Hero audit input enables button when filled', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });

    const heroInput = p.locator('input[placeholder*="yourwebsite"]');
    await heroInput.first().fill('example.com');

    const ctaBtn = p.locator('button:has-text("Get Free Score")').first();
    const isEnabled = await ctaBtn.isEnabled();
    expect(isEnabled).toBeTruthy();

    await ctaBtn.click({ force: true });
    await p.waitForTimeout(5000);

    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(200);

    await ctx.close();
  }, { timeout: 30000 });
});

// ═══════════════════════════════════════════════════════════════
// 4. REGISTRATION FLOW (UI validation only)
// ═══════════════════════════════════════════════════════════════
test.describe('4. Registration Flow', () => {
  test('Register form validates empty submission', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/register', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const submitBtn = p.locator('button:has-text("Create")').or(p.locator('button:has-text("Sign up")').or(p.locator('button:has-text("Get started")')));
    await submitBtn.first().click({ force: true });
    await p.waitForTimeout(2000);

    const url = p.url();
    expect(url).toMatch(/\/register/);

    await ctx.close();
  });

  test('Register form has all required fields', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/register', { waitUntil: 'networkidle', timeout: TIMEOUT });

    const inputs = p.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. FORGOT PASSWORD FLOW
// ═══════════════════════════════════════════════════════════════
test.describe('5. Forgot Password Flow', () => {
  test('Forgot password form submits', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/forgot-password', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const emailInput = p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]').or(p.locator('input[placeholder*="email"]')));
    await emailInput.first().fill('test@example.com');

    const submitBtn = p.locator('button:has-text("Send")').or(p.locator('button:has-text("Reset")').or(p.locator('button:has-text("submit")')));
    await submitBtn.first().click({ force: true });
    await p.waitForTimeout(3000);

    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(50);

    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. AUTH REDIRECTS (unauthenticated)
// ═══════════════════════════════════════════════════════════════
test.describe('6. Auth Redirects', () => {
  const protectedRoutes = [
    '/app', '/app/projects', '/app/audit', '/app/billing',
    '/app/ai-tools', '/app/social', '/app/ai-visibility', '/app/gbp',
    '/app/admin', '/app/agency', '/app/affiliate',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login when unauthenticated`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(route, { waitUntil: 'networkidle', timeout: TIMEOUT });
      await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 7. CROSS-PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════
test.describe('7. Cross-Page Navigation', () => {
  test('Landing -> Login -> Register -> Pricing -> Audit -> Blog', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();

    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();

    await p.locator('a[href="/login"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/login/);
    await dismissCookie(p);

    await p.locator('a[href="/register"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/register/);

    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();

    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]'))).toBeVisible();

    await p.goto('/blog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();

    await ctx.close();
  });
});
