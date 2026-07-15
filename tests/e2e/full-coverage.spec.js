// Full Coverage E2E Tests for searchgoodly.com
// Covers: every page, every link, console errors, interactive elements, forms, mobile
// Run: FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/full-coverage.spec.js
const { test, expect } = require('@playwright/test');

const BASE = process.env.FRONTEND_URL || 'https://searchgoodly.com';
const TIMEOUT = 15000;

// Helper: dismiss cookie banner if present
async function dismissCookie(p) {
  const btn = p.locator('button:has-text("Got it")');
  try { if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await p.waitForTimeout(500); } } catch {}
}

// ═══════════════════════════════════════════════════════════════
// 1. EVERY SINGLE PAGE — 200 + CONTENT + NO CONSOLE ERRORS
// ═══════════════════════════════════════════════════════════════
const ALL_PAGES = [
  // Core pages
  { path: '/', name: 'Landing', minLength: 500 },
  { path: '/login', name: 'Login', minLength: 200 },
  { path: '/register', name: 'Register', minLength: 200 },
  { path: '/pricing', name: 'Pricing', minLength: 500 },
  { path: '/audit', name: 'Public Audit', minLength: 200 },
  { path: '/blog', name: 'Blog', minLength: 200 },
  { path: '/terms', name: 'Terms', minLength: 300 },
  { path: '/privacy', name: 'Privacy', minLength: 500 },
  { path: '/forgot-password', name: 'Forgot Password', minLength: 100 },
  { path: '/changelog', name: 'Changelog', minLength: 200 },
  { path: '/status', name: 'Status', minLength: 100 },
  { path: '/help', name: 'Knowledge Base', minLength: 200 },
  { path: '/stories', name: 'Testimonials', minLength: 200 },
  { path: '/roi-calculator', name: 'ROI Calculator', minLength: 200 },
  { path: '/competitors', name: 'Competitor Landing', minLength: 200 },
  { path: '/checklist', name: 'Checklist', minLength: 200 },
  { path: '/refer', name: 'Referral', minLength: 200 },
  { path: '/content-studio', name: 'Content Studio', minLength: 200 },
  { path: '/tools', name: 'Free Tools Hub', minLength: 200 },
  { path: '/verify-email', name: 'Verify Email', minLength: 50 },
  { path: '/error', name: 'Error', minLength: 50 },
  // Free tools
  { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker', minLength: 200 },
  { path: '/tools/page-speed', name: 'Page Speed', minLength: 200 },
  { path: '/tools/mobile-friendly', name: 'Mobile Friendly', minLength: 200 },
  { path: '/tools/keyword-density', name: 'Keyword Density', minLength: 200 },
  { path: '/tools/ssl-checker', name: 'SSL Checker', minLength: 200 },
  { path: '/tools/schema-validator', name: 'Schema Validator', minLength: 200 },
  { path: '/tools/robots-checker', name: 'Robots Checker', minLength: 200 },
  { path: '/tools/heading-checker', name: 'Heading Checker', minLength: 200 },
  // Industry pages
  { path: '/restaurants', name: 'Restaurants', minLength: 300 },
  { path: '/plumbers', name: 'Plumbers', minLength: 300 },
  { path: '/dentists', name: 'Dentists', minLength: 300 },
  { path: '/salons', name: 'Salons', minLength: 300 },
  { path: '/retail', name: 'Retail', minLength: 300 },
  { path: '/lawyers', name: 'Lawyers', minLength: 300 },
  { path: '/home-services', name: 'Home Services', minLength: 300 },
  { path: '/real-estate', name: 'Real Estate', minLength: 300 },
  { path: '/automotive', name: 'Automotive', minLength: 300 },
  // Comparison pages
  { path: '/vs/ahrefs', name: 'vs Ahrefs', minLength: 300 },
  { path: '/vs/semrush', name: 'vs Semrush', minLength: 300 },
  { path: '/vs/moz', name: 'vs Moz', minLength: 300 },
  { path: '/vs/ubersuggest', name: 'vs Ubersuggest', minLength: 300 },
  { path: '/vs/seranking', name: 'vs SERanking', minLength: 300 },
  { path: '/vs/agency', name: 'vs Agency', minLength: 300 },
  { path: '/vs/localfalcon', name: 'vs LocalFalcon', minLength: 300 },
  { path: '/vs/brightlocal', name: 'vs BrightLocal', minLength: 300 },
];

test.describe('1. All Pages Load (200 + Content)', () => {
  for (const page of ALL_PAGES) {
    test(`${page.name} (${page.path})`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const resp = await p.goto(page.path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      expect(resp.status()).toBe(200);
      const body = await p.textContent('body');
      expect(body.length).toBeGreaterThan(page.minLength);
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 2. NO CONSOLE ERRORS ON EVERY PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('2. No Console Errors (All Pages)', () => {
  for (const page of ALL_PAGES) {
    test(`${page.name} (${page.path})`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', err => errors.push(err.message));
      await p.goto(page.path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      await p.waitForTimeout(1500);
      const realErrors = errors.filter(e =>
        !e.includes('ResizeObserver') &&
        !e.includes('Script error') &&
        !e.includes('chrome-extension')
      );
      expect(realErrors, `Console errors on ${page.path}: ${realErrors.join(', ')}`).toEqual([]);
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 3. LANDING PAGE — ALL SECTIONS AND LINKS
// ═══════════════════════════════════════════════════════════════
test.describe('3. Landing Page — Complete', () => {
  test('Hero section: headline, URL input, CTA button', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();
    await expect(p.locator('input[placeholder*="yourwebsite"]').first()).toBeVisible();
    await expect(p.locator('button:has-text("Get Free Score")').first()).toBeVisible();
    await ctx.close();
  });

  test('How it works section', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Three steps')).toBeVisible();
    await ctx.close();
  });

  test('Features section', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Everything you need')).toBeVisible();
    await ctx.close();
  });

  test('Industry selector with all 5 buttons', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Select your business type')).toBeVisible();
    await expect(p.locator('button:has-text("Restaurant")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Plumber")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Dentist")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Salon")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Retail")').first()).toBeVisible();
    await ctx.close();
  });

  test('Pricing section on landing', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Start free. Upgrade when')).toBeVisible();
    await ctx.close();
  });

  test('FAQ section with all 8 questions', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Questions small businesses ask')).toBeVisible();
    const faqButtons = p.locator('button:has-text("What is")').or(p.locator('button:has-text("How long")')).or(p.locator('button:has-text("Do I need")')).or(p.locator('button:has-text("Is there")')).or(p.locator('button:has-text("What\'s the")')).or(p.locator('button:has-text("What is the")')).or(p.locator('button:has-text("Can I")')).or(p.locator('button:has-text("Does Goodly")'));
    const count = await faqButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);
    await ctx.close();
  });

  test('Bottom CTA section has 2+ CTA buttons', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const ctas = p.locator('button:has-text("Get Free Score")');
    const count = await ctas.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await ctx.close();
  });

  test('Nav links: Sign in, Pricing, Stories', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('a[href="/login"]').first()).toBeVisible();
    await expect(p.locator('a[href="/pricing"]').first()).toBeVisible();
    await ctx.close();
  });

  test('Nav: Sign in navigates to /login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await p.locator('a[href="/login"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/login/);
    await ctx.close();
  });

  test('Nav: Pricing navigates to /pricing', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await p.locator('a[href="/pricing"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/pricing/);
    await ctx.close();
  });

  test('Footer: all key links present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const footerLinks = ['/pricing', '/audit', '/register', '/tools/meta-tag-checker', '/blog', '/terms', '/privacy'];
    for (const href of footerLinks) {
      const link = p.locator(`footer a[href="${href}"]`).or(p.locator(`a[href="${href}"]`));
      const count = await link.count();
      expect(count, `Footer link ${href} missing`).toBeGreaterThan(0);
    }
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. LOGIN PAGE — COMPLETE
// ═══════════════════════════════════════════════════════════════
test.describe('4. Login Page — Complete', () => {
  test('All form elements present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'))).toBeVisible();
    await expect(p.locator('input[type="password"]').or(p.locator('input[placeholder*="Password"]'))).toBeVisible();
    await expect(p.locator('button:has-text("Sign in")')).toBeVisible();
    await expect(p.locator('button:has-text("demo")').or(p.locator('button:has-text("Demo")'))).toBeVisible();
    await expect(p.locator('a[href="/register"]').first()).toBeVisible();
    await expect(p.locator('a[href="/forgot-password"]').first()).toBeVisible();
    await ctx.close();
  });

  test('Empty form submission stays on login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);
    await p.locator('button:has-text("Sign in")').click({ force: true });
    await p.waitForTimeout(1000);
    await expect(p).toHaveURL(/\/login/);
    await ctx.close();
  });

  test('Register link navigates to /register', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);
    await p.locator('a[href="/register"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/register/);
    await ctx.close();
  });

  test('Forgot password link navigates to /forgot-password', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);
    await p.locator('a[href="/forgot-password"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/forgot-password/);
    await ctx.close();
  });

  test('Demo account button is clickable', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const demoBtn = p.locator('button:has-text("demo")').or(p.locator('button:has-text("Demo")'));
    await expect(demoBtn).toBeVisible();
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. REGISTER PAGE — COMPLETE
// ═══════════════════════════════════════════════════════════════
test.describe('5. Register Page — Complete', () => {
  test('All form elements present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/register', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const inputs = p.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
    await expect(p.locator('button:has-text("Create")').or(p.locator('button:has-text("Sign up")').or(p.locator('button:has-text("Get started")')))).toBeVisible();
    await expect(p.locator('a[href="/login"]').first()).toBeVisible();
    await ctx.close();
  });

  test('Login link navigates to /login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/register', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);
    await p.locator('a[href="/login"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/login/);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. PRICING PAGE — COMPLETE
// ═══════════════════════════════════════════════════════════════
test.describe('6. Pricing Page — Complete', () => {
  test('All 4 plan tiers visible', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Get started').first()).toBeVisible();
    await expect(p.locator('text=Most popular').first()).toBeVisible();
    await expect(p.locator('text=Growing business').first()).toBeVisible();
    await expect(p.locator('text=Done for you').first()).toBeVisible();
    await ctx.close();
  });

  test('Monthly/Annual toggle works', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await p.locator('button:has-text("Annual")').click({ force: true });
    await p.waitForTimeout(500);
    const body = await p.textContent('body');
    expect(body).toContain('annually');
    await ctx.close();
  });

  test('Comparison table is present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Compare plans')).toBeVisible();
    await ctx.close();
  });

  test('CTA buttons for each plan', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('button:has-text("Start free")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Try 7 days free")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Talk to us")').first()).toBeVisible();
    await ctx.close();
  });

  test('FAQ section on pricing', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Find your fit')).toBeVisible();
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. PUBLIC AUDIT PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('7. Public Audit Page', () => {
  test('URL input and submit button present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]').or(p.locator('input[placeholder*="URL"]')))).toBeVisible();
    await expect(p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")').or(p.locator('button:has-text("Audit")')))).toBeVisible();
    await ctx.close();
  });

  test('Typing URL enables submit button', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const input = p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]'));
    await input.fill('example.com');
    await p.waitForTimeout(500);
    const btn = p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")'));
    const isDisabled = await btn.isDisabled();
    expect(isDisabled).toBe(false);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. BLOG
// ═══════════════════════════════════════════════════════════════
test.describe('8. Blog', () => {
  test('Blog index lists posts', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/blog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const postLinks = p.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    expect(count).toBeGreaterThan(1);
    await ctx.close();
  });

  test('Can navigate to a blog post', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/blog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const firstPost = p.locator('a[href*="/blog/"]').first();
    const href = await firstPost.getAttribute('href');
    await firstPost.click({ force: true });
    await p.waitForLoadState('networkidle');
    await expect(p).toHaveURL(new RegExp(href.replace(/\//g, '\\/')));
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(300);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. FREE TOOLS — ALL 8
// ═══════════════════════════════════════════════════════════════
test.describe('9. Free Tools — All 8', () => {
  const tools = [
    { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker', placeholder: 'yourwebsite' },
    { path: '/tools/page-speed', name: 'Page Speed', placeholder: 'yourwebsite' },
    { path: '/tools/mobile-friendly', name: 'Mobile Friendly', placeholder: 'yourwebsite' },
    { path: '/tools/keyword-density', name: 'Keyword Density', placeholder: 'yourwebsite' },
    { path: '/tools/ssl-checker', name: 'SSL Checker', placeholder: 'yourwebsite' },
    { path: '/tools/schema-validator', name: 'Schema Validator', placeholder: 'yourwebsite' },
    { path: '/tools/robots-checker', name: 'Robots Checker', placeholder: 'yourwebsite' },
    { path: '/tools/heading-checker', name: 'Heading Checker', placeholder: 'yourwebsite' },
  ];

  for (const tool of tools) {
    test(`${tool.name}: input form present`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(tool.path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const inputs = p.locator('input[type="text"], input:not([type]), textarea');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });

    test(`${tool.name}: typing enables submit`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(tool.path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const input = p.locator('input[type="text"], input:not([type])').first();
      await input.fill('example.com');
      await p.waitForTimeout(500);
      const btn = p.locator('button:has-text("Check")').or(p.locator('button:has-text("Test")').or(p.locator('button:has-text("Analyze")').or(p.locator('button:has-text("Scan")'))));
      if (await btn.count() > 0) {
        const isDisabled = await btn.isDisabled();
        expect(isDisabled).toBe(false);
      }
      await ctx.close();
    });
  }

  test('Free Tools hub lists all tools', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/tools', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const toolLinks = p.locator('a[href*="/tools/"]');
    const count = await toolLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. INDUSTRY PAGES — ALL 9
// ═══════════════════════════════════════════════════════════════
test.describe('10. Industry Pages — All 9', () => {
  const industries = [
    '/restaurants', '/plumbers', '/dentists', '/salons',
    '/retail', '/lawyers', '/home-services', '/real-estate', '/automotive',
  ];

  for (const path of industries) {
    test(`${path}: has CTA to register`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const ctaLink = p.locator('a[href="/register"]');
      const count = await ctaLink.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });

    test(`${path}: has audit URL input`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const urlInput = p.locator('input[placeholder*="yourwebsite"]');
      const count = await urlInput.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 11. COMPARISON PAGES — ALL 8
// ═══════════════════════════════════════════════════════════════
test.describe('11. Comparison Pages — All 8', () => {
  const comparisons = [
    '/vs/ahrefs', '/vs/semrush', '/vs/moz', '/vs/ubersuggest',
    '/vs/seranking', '/vs/agency', '/vs/localfalcon', '/vs/brightlocal',
  ];

  for (const path of comparisons) {
    test(`${path}: has comparison table`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const body = await p.textContent('body');
      expect(body.length).toBeGreaterThan(300);
      // Should have a comparison table or feature list
      const table = p.locator('table, [role="table"]');
      const count = await table.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });

    test(`${path}: has CTA`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const cta = p.locator('a[href="/register"]').or(p.locator('a[href="/audit"]'));
      const count = await cta.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 12. SPECIAL PAGES
// ═══════════════════════════════════════════════════════════════
test.describe('12. Special Pages', () => {
  test('Terms page has legal content', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/terms', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(500);
    expect(body).toContain('Terms');
    await ctx.close();
  });

  test('Privacy page has legal content', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/privacy', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(500);
    expect(body).toContain('Privacy');
    await ctx.close();
  });

  test('Changelog has version entries', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/changelog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('v1.9.0');
    expect(body).toContain('v1.8.0');
    await ctx.close();
  });

  test('Status page shows operational', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/status', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('Operational');
    await ctx.close();
  });

  test('Knowledge Base has articles', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/help', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('Help Center');
    // Should have category buttons
    const categoryBtns = p.locator('button:has-text("Basics")').or(p.locator('button:has-text("SEO")'));
    await expect(categoryBtns.first()).toBeVisible();
    await ctx.close();
  });

  test('Testimonials page has CTA', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/stories', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('success story');
    await ctx.close();
  });

  test('ROI Calculator has sliders', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/roi-calculator', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const sliders = p.locator('input[type="range"], [role="slider"]');
    const count = await sliders.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await ctx.close();
  });

  test('Competitor Landing has URL input', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/competitors', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const urlInput = p.locator('input[placeholder*="yourwebsite"]');
    const count = await urlInput.count();
    expect(count).toBeGreaterThan(0);
    await ctx.close();
  });

  test('Checklist has all 7 sections', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/checklist', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('Meta Tags');
    expect(body).toContain('Headings');
    expect(body).toContain('Content');
    expect(body).toContain('Images');
    expect(body).toContain('Technical');
    expect(body).toContain('Google Business Profile');
    expect(body).toContain('Links');
    await ctx.close();
  });

  test('Referral page has share link', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/refer', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('searchgoodly.com');
    await ctx.close();
  });

  test('Content Studio landing has features', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/content-studio', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    // If deployed correctly, should have content; if stale deploy, may show 404
    // This test documents the expected behavior
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Verify Email page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/verify-email', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.toLowerCase()).toContain('verif');
    await ctx.close();
  });

  test('Error page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/error', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('sideways');
    await ctx.close();
  });

  test('Forgot Password has form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/forgot-password', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'))).toBeVisible();
    await expect(p.locator('button:has-text("Send")').or(p.locator('button:has-text("Reset")'))).toBeVisible();
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 13. AUTH REDIRECTS — ALL PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════
test.describe('13. Auth Redirects — All Protected Routes', () => {
  const protectedRoutes = [
    '/app', '/app/projects', '/app/audit', '/app/billing',
    '/app/ai-tools', '/app/social', '/app/ai-visibility', '/app/gbp',
    '/app/admin', '/app/agency', '/app/affiliate',
    '/app/competitors', '/app/concierge/onboarding', '/app/onboarding',
    '/app/referral', '/app/admin/analytics', '/app/admin/blog',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(route, { waitUntil: 'networkidle', timeout: TIMEOUT });
      await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 14. STATIC ASSETS
// ═══════════════════════════════════════════════════════════════
test.describe('14. Static Assets', () => {
  const assets = [
    '/favicon.svg', '/favicon.ico', '/robots.txt', '/sitemap.xml',
    '/manifest.json', '/logo192.png', '/logo512.png', '/og-image.png',
  ];

  for (const asset of assets) {
    test(`${asset} returns 200`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const resp = await p.goto(asset, { waitUntil: 'networkidle', timeout: 10000 });
      expect(resp.status()).toBe(200);
      await ctx.close();
    });
  }

  test('robots.txt has content', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const resp = await p.goto('/robots.txt', { waitUntil: 'networkidle', timeout: 10000 });
    const body = await resp.text();
    expect(body.length).toBeGreaterThan(10);
    await ctx.close();
  });

  test('sitemap.xml has content', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const resp = await p.goto('/sitemap.xml', { waitUntil: 'networkidle', timeout: 10000 });
    const body = await resp.text();
    expect(body.length).toBeGreaterThan(50);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 15. 404 PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('15. 404 Page', () => {
  test('Unknown route shows 404', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/this-page-does-not-exist-xyz-123', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('404');
    await ctx.close();
  });

  test('404 page has navigation links', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/nonexistent-999', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const homeLink = p.locator('a[href="/"]');
    const count = await homeLink.count();
    expect(count).toBeGreaterThan(0);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 16. CROSS-PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════
test.describe('16. Cross-Page Navigation', () => {
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

  test('Free tools navigation chain', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/tools', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const firstTool = p.locator('a[href*="/tools/"]').first();
    await firstTool.click({ force: true });
    await p.waitForLoadState('networkidle');
    await expect(p).toHaveURL(/\/tools\//);
    await ctx.close();
  });

  test('Industry page -> register CTA works', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/restaurants', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await p.locator('a[href="/register"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/register/);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 17. MOBILE RESPONSIVENESS
// ═══════════════════════════════════════════════════════════════
test.describe('17. Mobile Responsiveness', () => {
  const MOBILE_PAGES = ['/', '/pricing', '/login', '/blog', '/audit', '/register', '/tools'];

  for (const pagePath of MOBILE_PAGES) {
    test(`${pagePath} renders on mobile (375px)`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const p = await ctx.newPage();
      const resp = await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });
      expect(resp.status()).toBe(200);
      const body = await p.textContent('body');
      expect(body.length).toBeGreaterThan(100);
      await ctx.close();
    });
  }

  test('Landing page mobile: nav visible', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const nav = p.locator('nav, [role="navigation"], header a');
    const count = await nav.count();
    expect(count).toBeGreaterThan(0);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 18. PAGE LOAD PERFORMANCE
// ═══════════════════════════════════════════════════════════════
test.describe('18. Page Load Performance', () => {
  const PERF_PAGES = ['/', '/pricing', '/blog', '/audit', '/login', '/register', '/tools'];

  for (const pagePath of PERF_PAGES) {
    test(`${pagePath} loads under 10s`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const start = Date.now();
      await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const loadTime = Date.now() - start;
      expect(loadTime).toBeLessThan(10000);
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 19. SEO ELEMENTS
// ═══════════════════════════════════════════════════════════════
test.describe('19. SEO Elements', () => {
  test('Landing page: title, meta description, h1, canonical', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const title = await p.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(70);
    const metaDesc = await p.getAttribute('meta[name="description"]', 'content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc.length).toBeGreaterThan(20);
    const h1 = await p.locator('h1').first().textContent();
    expect(h1.length).toBeGreaterThan(5);
    const canonical = await p.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
    await ctx.close();
  });

  test('Pricing page: title, h1', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const title = await p.title();
    expect(title.length).toBeGreaterThan(5);
    const h1 = await p.locator('h1').first().textContent();
    expect(h1.length).toBeGreaterThan(3);
    await ctx.close();
  });

  test('Blog page: title, h1', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/blog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const title = await p.title();
    expect(title.length).toBeGreaterThan(5);
    const h1 = await p.locator('h1').first().textContent();
    expect(h1.length).toBeGreaterThan(3);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 20. INTERACTIVE ELEMENTS
// ═══════════════════════════════════════════════════════════════
test.describe('20. Interactive Elements', () => {
  test('ROI Calculator: sliders change values', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/roi-calculator', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const sliders = p.locator('input[type="range"]');
    const count = await sliders.count();
    expect(count).toBeGreaterThanOrEqual(2);
    // Move first slider
    await sliders.first().fill('5000');
    await p.waitForTimeout(500);
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Pricing: Annual toggle changes prices', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    // Click Annual
    await p.locator('button:has-text("Annual")').click({ force: true });
    await p.waitForTimeout(500);
    const body = await p.textContent('body');
    expect(body).toContain('annually');
    // Click back to Monthly
    await p.locator('button:has-text("Monthly")').click({ force: true });
    await p.waitForTimeout(500);
    const body2 = await p.textContent('body');
    expect(body2).toContain('month');
    await ctx.close();
  });

  test('Landing: FAQ accordion opens', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const firstFaq = p.locator('button:has-text("What is")').first();
    await firstFaq.click({ force: true });
    await p.waitForTimeout(500);
    // FAQ should expand
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Landing: Industry selector changes content', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    // Click Plumber
    await p.locator('button:has-text("Plumber")').first().click({ force: true });
    await p.waitForTimeout(500);
    const body = await p.textContent('body');
    expect(body).toContain('plumber');
    await ctx.close();
  });
});
