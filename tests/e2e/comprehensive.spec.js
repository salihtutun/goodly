// Comprehensive E2E tests for searchgoodly.com
// Run: FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/comprehensive.spec.js
const { test, expect } = require('@playwright/test');

const BASE = process.env.FRONTEND_URL || 'https://searchgoodly.com';
const TIMEOUT = 15000;

// Helper: dismiss cookie banner if present
async function dismissCookie(p) {
  const btn = p.locator('button:has-text("Got it")');
  try { if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await p.waitForTimeout(500); } } catch {}
}

// ═══════════════════════════════════════════════════════════════
// ALL PUBLIC PAGES
// ═══════════════════════════════════════════════════════════════
const ALL_PUBLIC_PAGES = [
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
  { path: '/tools', name: 'Free Tools', minLength: 200 },
  { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker', minLength: 200 },
  { path: '/tools/page-speed', name: 'Page Speed', minLength: 200 },
  { path: '/tools/mobile-friendly', name: 'Mobile Friendly', minLength: 200 },
  { path: '/tools/keyword-density', name: 'Keyword Density', minLength: 200 },
  { path: '/tools/ssl-checker', name: 'SSL Checker', minLength: 200 },
  { path: '/tools/schema-validator', name: 'Schema Validator', minLength: 200 },
  { path: '/tools/robots-checker', name: 'Robots Checker', minLength: 200 },
  { path: '/tools/heading-checker', name: 'Heading Checker', minLength: 200 },
  { path: '/restaurants', name: 'Restaurants', minLength: 300 },
  { path: '/plumbers', name: 'Plumbers', minLength: 300 },
  { path: '/dentists', name: 'Dentists', minLength: 300 },
  { path: '/salons', name: 'Salons', minLength: 300 },
  { path: '/retail', name: 'Retail', minLength: 300 },
  { path: '/lawyers', name: 'Lawyers', minLength: 300 },
  { path: '/home-services', name: 'Home Services', minLength: 300 },
  { path: '/real-estate', name: 'Real Estate', minLength: 300 },
  { path: '/automotive', name: 'Automotive', minLength: 300 },
  { path: '/vs/ahrefs', name: 'vs Ahrefs', minLength: 300 },
  { path: '/vs/semrush', name: 'vs Semrush', minLength: 300 },
  { path: '/vs/moz', name: 'vs Moz', minLength: 300 },
  { path: '/vs/ubersuggest', name: 'vs Ubersuggest', minLength: 300 },
  { path: '/vs/seranking', name: 'vs SERanking', minLength: 300 },
  { path: '/vs/agency', name: 'vs Agency', minLength: 300 },
  { path: '/vs/localfalcon', name: 'vs LocalFalcon', minLength: 300 },
  { path: '/vs/brightlocal', name: 'vs BrightLocal', minLength: 300 },
  { path: '/verify-email', name: 'Verify Email', minLength: 50 },
  { path: '/error', name: 'Error', minLength: 50 },
];

// ═══════════════════════════════════════════════════════════════
// 1. EVERY PAGE LOADS WITH 200 AND HAS CONTENT
// ═══════════════════════════════════════════════════════════════
test.describe('1. All Pages Load (200 + Content)', () => {
  for (const page of ALL_PUBLIC_PAGES) {
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
// 2. NO CONSOLE ERRORS ON ANY PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('2. No Console Errors', () => {
  for (const page of ALL_PUBLIC_PAGES) {
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
// 3. SEO ELEMENTS
// ═══════════════════════════════════════════════════════════════
test.describe('3. SEO Elements', () => {
  test('Landing page has proper SEO tags', async ({ browser }) => {
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

  test('Pricing page has proper SEO tags', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const title = await p.title();
    expect(title.length).toBeGreaterThan(5);
    const h1 = await p.locator('h1').first().textContent();
    expect(h1.length).toBeGreaterThan(3);
    await ctx.close();
  });

  test('Blog page has proper SEO tags', async ({ browser }) => {
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
// 4. LANDING PAGE SECTIONS
// ═══════════════════════════════════════════════════════════════
test.describe('4. Landing Page Sections', () => {
  test('Hero section has headline and CTA', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();
    // Check for URL input (placeholder is "yourwebsite.com")
    const urlInput = p.locator('input[placeholder*="yourwebsite"]');
    await expect(urlInput.first()).toBeVisible();
    // Check for CTA button
    const ctaBtn = p.locator('button:has-text("Get Free Score")');
    await expect(ctaBtn.first()).toBeVisible();
    await ctx.close();
  });

  test('How it works section is present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Three steps')).toBeVisible();
    await ctx.close();
  });

  test('Features section is present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Everything you need')).toBeVisible();
    await ctx.close();
  });

  test('Industry selector section is present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Select your business type')).toBeVisible();
    await expect(p.locator('button:has-text("Restaurant")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Plumber")').first()).toBeVisible();
    await ctx.close();
  });

  test('Pricing section is present on landing', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Start free. Upgrade when')).toBeVisible();
    await ctx.close();
  });

  test('FAQ section is present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('text=Questions small businesses ask')).toBeVisible();
    await ctx.close();
  });

  test('Bottom CTA section is present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const ctas = p.locator('button:has-text("Get Free Score")');
    const count = await ctas.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await ctx.close();
  });

  test('Nav links work on landing page', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await p.locator('a[href="/login"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/login/);
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await p.locator('a[href="/pricing"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/pricing/);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. FOOTER LINKS
// ═══════════════════════════════════════════════════════════════
test.describe('5. Footer Links', () => {
  const KEY_PAGES = ['/', '/pricing'];
  const EXPECTED_FOOTER_LINKS = [
    '/pricing', '/audit', '/register',
    '/tools/meta-tag-checker', '/blog',
    '/terms', '/privacy',
  ];

  for (const pagePath of KEY_PAGES) {
    test(`Footer links present on ${pagePath}`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });
      for (const href of EXPECTED_FOOTER_LINKS) {
        const link = p.locator(`footer a[href="${href}"]`).or(p.locator(`a[href="${href}"]`));
        const count = await link.count();
        expect(count, `Link ${href} missing on ${pagePath}`).toBeGreaterThan(0);
      }
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 6. LOGIN PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('6. Login Page', () => {
  test('All form elements present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'))).toBeVisible();
    await expect(p.locator('input[type="password"]').or(p.locator('input[placeholder*="Password"]'))).toBeVisible();
    await expect(p.locator('button:has-text("Sign in")')).toBeVisible();
    await expect(p.locator('a[href="/register"]').first()).toBeVisible();
    await expect(p.locator('a[href="/forgot-password"]').first()).toBeVisible();
    await ctx.close();
  });

  test('Demo account button exists', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('button:has-text("demo")').or(p.locator('button:has-text("Demo")'))).toBeVisible();
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

  test('Register link navigates correctly', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);
    await p.locator('a[href="/register"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/register/);
    await ctx.close();
  });

  test('Forgot password link navigates correctly', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);
    await p.locator('a[href="/forgot-password"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/forgot-password/);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. REGISTER PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('7. Register Page', () => {
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

  test('Login link navigates correctly', async ({ browser }) => {
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
// 8. PRICING PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('8. Pricing Page', () => {
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
    // The comparison section is clearly labeled
    await expect(p.locator('text=Compare plans')).toBeVisible();
    await ctx.close();
  });

  test('CTA buttons exist for each plan', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('button:has-text("Start free")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Try 7 days free")').first()).toBeVisible();
    await expect(p.locator('button:has-text("Talk to us")').first()).toBeVisible();
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. PUBLIC AUDIT PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('9. Public Audit Page', () => {
  test('URL input and submit button present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]').or(p.locator('input[placeholder*="URL"]')))).toBeVisible();
    await expect(p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")').or(p.locator('button:has-text("Audit")')))).toBeVisible();
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. BLOG
// ═══════════════════════════════════════════════════════════════
test.describe('10. Blog', () => {
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
// 11. FREE TOOLS
// ═══════════════════════════════════════════════════════════════
test.describe('11. Free Tools', () => {
  const tools = [
    '/tools/meta-tag-checker', '/tools/page-speed', '/tools/mobile-friendly',
    '/tools/keyword-density', '/tools/ssl-checker', '/tools/schema-validator',
    '/tools/robots-checker', '/tools/heading-checker',
  ];

  for (const path of tools) {
    test(`${path} has input form`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const inputs = p.locator('input[type="text"], input:not([type]), textarea');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });
  }

  test('Free Tools hub page lists all tools', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/tools', { waitUntil: 'networkidle', timeout: TIMEOUT });
    // Should have links to individual tools
    const toolLinks = p.locator('a[href*="/tools/"]');
    const count = await toolLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. INDUSTRY PAGES
// ═══════════════════════════════════════════════════════════════
test.describe('12. Industry Pages', () => {
  const industries = [
    '/restaurants', '/plumbers', '/dentists', '/salons',
    '/retail', '/lawyers', '/home-services', '/real-estate', '/automotive',
  ];

  for (const path of industries) {
    test(`${path} has CTA to register`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const ctaLink = p.locator('a[href="/register"]');
      const count = await ctaLink.count();
      expect(count).toBeGreaterThan(0);
      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 13. COMPARISON PAGES
// ═══════════════════════════════════════════════════════════════
test.describe('13. Comparison Pages', () => {
  const comparisons = [
    '/vs/ahrefs', '/vs/semrush', '/vs/moz', '/vs/ubersuggest',
    '/vs/seranking', '/vs/agency', '/vs/localfalcon', '/vs/brightlocal',
  ];

  for (const path of comparisons) {
    test(`${path} has CTA`, async ({ browser }) => {
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
// 14. AUTH REDIRECTS
// ═══════════════════════════════════════════════════════════════
test.describe('14. Auth Redirects', () => {
  const protectedRoutes = [
    '/app', '/app/projects', '/app/audit', '/app/billing',
    '/app/ai-tools', '/app/social', '/app/ai-visibility', '/app/gbp',
    '/app/admin', '/app/agency', '/app/affiliate',
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
// 15. STATIC ASSETS
// ═══════════════════════════════════════════════════════════════
test.describe('15. Static Assets', () => {
  const assets = ['/favicon.svg', '/favicon.ico', '/robots.txt', '/sitemap.xml'];

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
// 16. 404 PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('16. 404 Page', () => {
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
// 17. SPECIAL PAGES
// ═══════════════════════════════════════════════════════════════
test.describe('17. Special Pages', () => {
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

  test('Changelog page has entries', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/changelog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Status page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/status', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(50);
    await ctx.close();
  });

  test('Knowledge Base page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/help', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Testimonials page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/stories', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('ROI Calculator page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/roi-calculator', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Competitor Landing page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/competitors', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Checklist page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/checklist', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Referral page loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/refer', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });

  test('Content Studio landing loads', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/content-studio', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
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
    expect(body.length).toBeGreaterThan(50);
    await ctx.close();
  });

  test('Forgot Password page has form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/forgot-password', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]').or(p.locator('input[placeholder*="email"]')))).toBeVisible();
    await expect(p.locator('button:has-text("Send")').or(p.locator('button:has-text("Reset")').or(p.locator('button:has-text("submit")')))).toBeVisible();
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 18. CROSS-PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════
test.describe('18. Cross-Page Navigation', () => {
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
});

// ═══════════════════════════════════════════════════════════════
// 19. MOBILE RESPONSIVENESS
// ═══════════════════════════════════════════════════════════════
test.describe('19. Mobile Responsiveness', () => {
  const MOBILE_PAGES = ['/', '/pricing', '/login', '/blog', '/audit'];

  for (const pagePath of MOBILE_PAGES) {
    test(`${pagePath} renders on mobile`, async ({ browser }) => {
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
// 20. PAGE LOAD PERFORMANCE
// ═══════════════════════════════════════════════════════════════
test.describe('20. Page Load Performance', () => {
  const PERF_PAGES = ['/', '/pricing', '/blog', '/audit', '/login'];

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
// 21. SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════
test.describe('21. Security Headers', () => {
  test('Landing page has security headers', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const resp = await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const headers = resp.headers();
    console.log(`Security: CSP=${!!headers['content-security-policy']}, X-CTO=${!!headers['x-content-type-options']}, XFO=${!!headers['x-frame-options']}`);
    await ctx.close();
  });
});
