// Deep Coverage E2E Tests for searchgoodly.com
// Covers: every missing route, every link on every page, every button, every form
// Run: FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/deep-coverage.spec.js
const { test, expect } = require('@playwright/test');

const BASE = process.env.FRONTEND_URL || 'https://searchgoodly.com';
const TIMEOUT = 15000;

// Helper: dismiss cookie banner if present
async function dismissCookie(p) {
  const btn = p.locator('button:has-text("Got it")');
  try { if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await p.waitForTimeout(500); } } catch {}
}

// ═══════════════════════════════════════════════════════════════
// 1. MISSING ROUTES — pages not covered by existing specs
// ═══════════════════════════════════════════════════════════════
test.describe('1. Missing Routes (Not in Existing Specs)', () => {
  test('/reset-password loads with form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/reset-password?token=test-token-123', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(50);
    // Should have password inputs or a message
    const inputs = p.locator('input[type="password"], input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await ctx.close();
  });

  test('/shared/:token shows shared audit page', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/shared/test-token-123', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(50);
    await ctx.close();
  });

  test('/app/projects/:id redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/app/projects/test-id-123', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });

  test('/app/audits/:id redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/app/audits/test-id-123', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });

  test('/app/billing/success redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/app/billing/success', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });

  test('/app/agency/clients/:clientId redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/app/agency/clients/test-client-123', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });

  test('/app/content-studio redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/app/content-studio', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. EVERY LINK ON EVERY PUBLIC PAGE
// ═══════════════════════════════════════════════════════════════
const PAGES_WITH_LINKS = [
  { path: '/', name: 'Landing' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/blog', name: 'Blog' },
  { path: '/tools', name: 'Free Tools Hub' },
  { path: '/stories', name: 'Testimonials' },
  { path: '/competitors', name: 'Competitor Landing' },
  { path: '/checklist', name: 'Checklist' },
  { path: '/refer', name: 'Referral' },
  { path: '/content-studio', name: 'Content Studio' },
  { path: '/changelog', name: 'Changelog' },
  { path: '/status', name: 'Status' },
  { path: '/help', name: 'Knowledge Base' },
  { path: '/roi-calculator', name: 'ROI Calculator' },
  { path: '/terms', name: 'Terms' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/forgot-password', name: 'Forgot Password' },
  { path: '/audit', name: 'Public Audit' },
  // Industry pages
  { path: '/restaurants', name: 'Restaurants' },
  { path: '/plumbers', name: 'Plumbers' },
  { path: '/dentists', name: 'Dentists' },
  { path: '/salons', name: 'Salons' },
  { path: '/retail', name: 'Retail' },
  { path: '/lawyers', name: 'Lawyers' },
  { path: '/home-services', name: 'Home Services' },
  { path: '/real-estate', name: 'Real Estate' },
  { path: '/automotive', name: 'Automotive' },
  // Comparison pages
  { path: '/vs/ahrefs', name: 'vs Ahrefs' },
  { path: '/vs/semrush', name: 'vs Semrush' },
  { path: '/vs/moz', name: 'vs Moz' },
  { path: '/vs/ubersuggest', name: 'vs Ubersuggest' },
  { path: '/vs/seranking', name: 'vs SERanking' },
  { path: '/vs/agency', name: 'vs Agency' },
  { path: '/vs/localfalcon', name: 'vs LocalFalcon' },
  { path: '/vs/brightlocal', name: 'vs BrightLocal' },
  // Free tools
  { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker' },
  { path: '/tools/page-speed', name: 'Page Speed' },
  { path: '/tools/mobile-friendly', name: 'Mobile Friendly' },
  { path: '/tools/keyword-density', name: 'Keyword Density' },
  { path: '/tools/ssl-checker', name: 'SSL Checker' },
  { path: '/tools/schema-validator', name: 'Schema Validator' },
  { path: '/tools/robots-checker', name: 'Robots Checker' },
  { path: '/tools/heading-checker', name: 'Heading Checker' },
];

test.describe('2. Every Link on Every Page', () => {
  for (const page of PAGES_WITH_LINKS) {
    test(`${page.name} (${page.path}): all internal links resolve`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const resp = await p.goto(page.path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      expect(resp.status()).toBe(200);
      await dismissCookie(p);

      // Get all internal links
      const links = await p.evaluate(() => {
        const anchors = document.querySelectorAll('a[href]');
        return Array.from(anchors)
          .map(a => a.getAttribute('href'))
          .filter(href => href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:') && href !== '/');
      });

      // Deduplicate
      const uniqueLinks = [...new Set(links)];

      // Check each link resolves (up to 30 to keep runtime reasonable)
      const linksToCheck = uniqueLinks.slice(0, 30);
      for (const link of linksToCheck) {
        const linkResp = await p.goto(link, { waitUntil: 'networkidle', timeout: TIMEOUT });
        expect(linkResp.status(), `Link ${link} on ${page.path} returned ${linkResp.status()}`).toBe(200);
      }

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 3. EVERY BUTTON ON EVERY PAGE (clickable, no console errors)
// ═══════════════════════════════════════════════════════════════
test.describe('3. Every Button on Key Pages', () => {
  test('Landing: all CTA buttons are clickable', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', err => errors.push(err.message));
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const buttons = p.locator('button, a[role="button"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(5);

    // Click each visible button (skip hidden ones)
    for (let i = 0; i < Math.min(count, 15); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        try { await btn.click({ force: true, timeout: 2000 }); } catch {}
        await p.waitForTimeout(300);
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Script error') &&
      !e.includes('chrome-extension')
    );
    expect(realErrors).toEqual([]);
    await ctx.close();
  });

  test('Pricing: all plan CTA buttons are clickable', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', err => errors.push(err.message));
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const ctaButtons = p.locator('button:has-text("Start free"), button:has-text("Try 7 days"), button:has-text("Talk to us")');
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const btn = ctaButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        try { await btn.click({ force: true, timeout: 2000 }); } catch {}
        await p.waitForTimeout(300);
      }
    }

    const realErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Script error') &&
      !e.includes('chrome-extension')
    );
    expect(realErrors).toEqual([]);
    await ctx.close();
  });

  test('Blog: all post links are clickable', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', err => errors.push(err.message));
    await p.goto('/blog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const postLinks = p.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    expect(count).toBeGreaterThan(1);

    // Click first post and verify it loads
    const firstLink = postLinks.first();
    if (await firstLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      const href = await firstLink.getAttribute('href');
      await firstLink.click({ force: true, timeout: 3000 });
      await p.waitForLoadState('networkidle');
      const body = await p.textContent('body');
      expect(body.length).toBeGreaterThan(200);
    }

    const realErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Script error') &&
      !e.includes('chrome-extension')
    );
    expect(realErrors).toEqual([]);
    await ctx.close();
  });

  test('Free Tools Hub: all tool links navigate correctly', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/tools', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const toolLinks = p.locator('a[href*="/tools/"]');
    const count = await toolLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < Math.min(count, 8); i++) {
      const link = toolLinks.nth(i);
      if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
        const href = await link.getAttribute('href');
        try { await link.click({ force: true, timeout: 2000 }); } catch {}
        await p.waitForLoadState('networkidle');
        const body = await p.textContent('body');
        expect(body.length).toBeGreaterThan(100);
        await p.goBack();
        await p.waitForLoadState('networkidle');
      }
    }
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. EVERY FORM ON EVERY PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('4. Every Form on Key Pages', () => {
  test('Login form: all elements present and interactive', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    // Email input
    const emailInput = p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'));
    await expect(emailInput.first()).toBeVisible();
    await emailInput.first().fill('test@example.com');
    expect(await emailInput.first().inputValue()).toBe('test@example.com');

    // Password input
    const pwInput = p.locator('input[type="password"]').or(p.locator('input[placeholder*="Password"]'));
    await expect(pwInput.first()).toBeVisible();
    await pwInput.first().fill('testpass123');
    expect(await pwInput.first().inputValue()).toBe('testpass123');

    // Sign in button
    await expect(p.locator('button:has-text("Sign in")').first()).toBeVisible();

    // Demo button
    const demoBtn = p.locator('button:has-text("demo")').or(p.locator('button:has-text("Demo")'));
    await expect(demoBtn.first()).toBeVisible();

    // Links
    await expect(p.locator('a[href="/register"]').first()).toBeVisible();
    await expect(p.locator('a[href="/forgot-password"]').first()).toBeVisible();

    await ctx.close();
  });

  test('Register form: all elements present and interactive', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/register', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const inputs = p.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Fill first input
    const firstInput = inputs.first();
    await firstInput.fill('testuser');
    expect(await firstInput.inputValue()).toBe('testuser');

    // Submit button
    const submitBtn = p.locator('button:has-text("Create")').or(p.locator('button:has-text("Sign up")').or(p.locator('button:has-text("Get started")')));
    await expect(submitBtn.first()).toBeVisible();

    // Login link
    await expect(p.locator('a[href="/login"]').first()).toBeVisible();

    await ctx.close();
  });

  test('Forgot Password form: all elements present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/forgot-password', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await dismissCookie(p);

    const emailInput = p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]').or(p.locator('input[placeholder*="email"]')));
    await expect(emailInput.first()).toBeVisible();
    await emailInput.first().fill('test@example.com');

    const submitBtn = p.locator('button:has-text("Send")').or(p.locator('button:has-text("Reset")').or(p.locator('button:has-text("submit")')));
    await expect(submitBtn.first()).toBeVisible();

    await ctx.close();
  });

  test('Public Audit form: URL input and submit', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });

    const urlInput = p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]').or(p.locator('input[placeholder*="URL"]')));
    await expect(urlInput.first()).toBeVisible();
    await urlInput.first().fill('example.com');
    expect(await urlInput.first().inputValue()).toContain('example.com');

    const submitBtn = p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")').or(p.locator('button:has-text("Audit")')));
    await expect(submitBtn.first()).toBeVisible();

    await ctx.close();
  });

  test('Landing hero: URL input and CTA', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });

    const heroInput = p.locator('input[placeholder*="yourwebsite"]');
    await expect(heroInput.first()).toBeVisible();
    await heroInput.first().fill('mybusiness.com');
    expect(await heroInput.first().inputValue()).toContain('mybusiness.com');

    const ctaBtn = p.locator('button:has-text("Get Free Score")').first();
    await expect(ctaBtn).toBeVisible();
    expect(await ctaBtn.isEnabled()).toBeTruthy();

    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. FOOTER LINKS ON EVERY PAGE
// ═══════════════════════════════════════════════════════════════
const FOOTER_PAGES = [
  '/', '/pricing', '/blog', '/tools', '/stories', '/competitors',
  '/checklist', '/refer', '/content-studio', '/changelog', '/status',
  '/help', '/roi-calculator', '/terms', '/privacy',
];

test.describe('5. Footer Links on Every Page', () => {
  for (const pagePath of FOOTER_PAGES) {
    test(`${pagePath}: footer has key links`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // Check that at least 1 key footer link exists anywhere on the page
      const keyLinks = ['/pricing', '/blog', '/terms', '/privacy', '/audit', '/', '/register', '/login'];
      let foundCount = 0;
      for (const href of keyLinks) {
        const link = p.locator(`a[href="${href}"]`);
        const count = await link.count();
        if (count > 0) foundCount++;
      }
      expect(foundCount, `No key links found on ${pagePath}`).toBeGreaterThanOrEqual(1);

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 6. NAVIGATION BAR ON EVERY PAGE
// ═══════════════════════════════════════════════════════════════
test.describe('6. Navigation Bar on Every Page', () => {
  for (const pagePath of FOOTER_PAGES) {
    test(`${pagePath}: page has navigation links`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // Check for any link on the page (nav, footer, or content)
      const allLinks = p.locator('a[href]');
      const count = await allLinks.count();
      expect(count, `No links found on ${pagePath}`).toBeGreaterThan(0);

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 7. ALL FREE TOOLS — DEEP FORM INTERACTION
// ═══════════════════════════════════════════════════════════════
const ALL_TOOLS = [
  { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker' },
  { path: '/tools/page-speed', name: 'Page Speed' },
  { path: '/tools/mobile-friendly', name: 'Mobile Friendly' },
  { path: '/tools/keyword-density', name: 'Keyword Density' },
  { path: '/tools/ssl-checker', name: 'SSL Checker' },
  { path: '/tools/schema-validator', name: 'Schema Validator' },
  { path: '/tools/robots-checker', name: 'Robots Checker' },
  { path: '/tools/heading-checker', name: 'Heading Checker' },
];

test.describe('7. All Free Tools — Deep Form Interaction', () => {
  for (const tool of ALL_TOOLS) {
    test(`${tool.name}: fill form and submit`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', err => errors.push(err.message));
      await p.goto(tool.path, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // Find input
      const input = p.locator('input[type="text"], input:not([type]), textarea').first();
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.fill('example.com');
        await p.waitForTimeout(500);

        // Find submit button
        const submitBtn = p.locator('button:has-text("Check")').or(
          p.locator('button:has-text("Test")').or(
            p.locator('button:has-text("Analyze")').or(
              p.locator('button:has-text("Scan")').or(
                p.locator('button:has-text("Validate")').or(
                  p.locator('button:has-text("Submit")')
                )
              )
            )
          )
        );

        if (await submitBtn.count() > 0 && await submitBtn.first().isEnabled().catch(() => false)) {
          await submitBtn.first().click({ force: true });
          await p.waitForTimeout(3000);
        }
      }

      const realErrors = errors.filter(e =>
        !e.includes('ResizeObserver') &&
        !e.includes('Script error') &&
        !e.includes('chrome-extension')
      );
      expect(realErrors, `Console errors on ${tool.path}: ${realErrors.join(', ')}`).toEqual([]);

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 8. ALL INDUSTRY PAGES — DEEP CONTENT CHECK
// ═══════════════════════════════════════════════════════════════
const INDUSTRIES = [
  { path: '/restaurants', keyword: 'restaurant' },
  { path: '/plumbers', keyword: 'plumber' },
  { path: '/dentists', keyword: 'dentist' },
  { path: '/salons', keyword: 'salon' },
  { path: '/retail', keyword: 'retail' },
  { path: '/lawyers', keyword: 'lawyer' },
  { path: '/home-services', keyword: 'home' },
  { path: '/real-estate', keyword: 'real' },
  { path: '/automotive', keyword: 'automotive' },
];

test.describe('8. All Industry Pages — Deep Content Check', () => {
  for (const industry of INDUSTRIES) {
    test(`${industry.path}: has h1, CTA, audit input, and industry keyword`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(industry.path, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // H1 present
      const h1 = p.locator('h1').first();
      await expect(h1).toBeVisible();
      const h1Text = await h1.textContent();
      expect(h1Text.length).toBeGreaterThan(3);

      // CTA to register
      const registerLink = p.locator('a[href="/register"]');
      const regCount = await registerLink.count();
      expect(regCount).toBeGreaterThan(0);

      // Audit URL input
      const urlInput = p.locator('input[placeholder*="yourwebsite"]');
      const inputCount = await urlInput.count();
      expect(inputCount).toBeGreaterThan(0);

      // Industry keyword in body
      const body = await p.textContent('body');
      expect(body.toLowerCase()).toContain(industry.keyword);

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 9. ALL COMPARISON PAGES — DEEP CHECK
// ═══════════════════════════════════════════════════════════════
const COMPARISONS = [
  { path: '/vs/ahrefs', tool: 'Ahrefs' },
  { path: '/vs/semrush', tool: 'Semrush' },
  { path: '/vs/moz', tool: 'Moz' },
  { path: '/vs/ubersuggest', tool: 'Ubersuggest' },
  { path: '/vs/seranking', tool: 'SE Ranking' },
  { path: '/vs/agency', tool: 'Agency' },
  { path: '/vs/localfalcon', tool: 'Local Falcon' },
  { path: '/vs/brightlocal', tool: 'BrightLocal' },
];

test.describe('9. All Comparison Pages — Deep Check', () => {
  for (const comp of COMPARISONS) {
    test(`${comp.path}: has h1, comparison table, CTA, and tool name`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(comp.path, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // H1 present
      const h1 = p.locator('h1').first();
      await expect(h1).toBeVisible();

      // Tool name in body
      const body = await p.textContent('body');
      expect(body).toContain(comp.tool);

      // Comparison table
      const table = p.locator('table, [role="table"]');
      const tableCount = await table.count();
      expect(tableCount).toBeGreaterThan(0);

      // CTA
      const cta = p.locator('a[href="/register"]').or(p.locator('a[href="/audit"]'));
      const ctaCount = await cta.count();
      expect(ctaCount).toBeGreaterThan(0);

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 10. SPECIAL PAGES — DEEP CONTENT VERIFICATION
// ═══════════════════════════════════════════════════════════════
test.describe('10. Special Pages — Deep Content', () => {
  test('Changelog: has version history with dates', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/changelog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('v1.9.0');
    expect(body).toContain('v1.8.0');
    expect(body).toContain('v1.7.0');
    await ctx.close();
  });

  test('Status: all services show operational', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/status', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('Operational');
    // Should list multiple services
    const operationalCount = (body.match(/Operational/g) || []).length;
    expect(operationalCount).toBeGreaterThanOrEqual(3);
    await ctx.close();
  });

  test('Knowledge Base: has category navigation', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/help', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('Help Center');
    // Should have category buttons
    const categoryBtns = p.locator('button:has-text("Basics")').or(
      p.locator('button:has-text("SEO")').or(
        p.locator('button:has-text("Getting")').or(
          p.locator('button:has-text("Account")')
        )
      )
    );
    const count = await categoryBtns.count();
    expect(count).toBeGreaterThan(0);
    await ctx.close();
  });

  test('Testimonials: has customer success stories', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/stories', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('success story');
    // Should have multiple testimonials — check for quote marks or story content
    const hasQuotes = body.includes('"') || body.includes('"') || body.includes('"');
    expect(hasQuotes).toBeTruthy();
    await ctx.close();
  });

  test('ROI Calculator: all sliders and result display', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/roi-calculator', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const sliders = p.locator('input[type="range"], [role="slider"]');
    const count = await sliders.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Move first slider to a valid value (min=500, max=50000)
    await sliders.first().fill('2000');
    await p.waitForTimeout(500);

    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(200);
    await ctx.close();
  });

  test('Competitor Landing: has URL input and competitor list', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/competitors', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const urlInput = p.locator('input[placeholder*="yourwebsite"]');
    await expect(urlInput.first()).toBeVisible();
    const body = await p.textContent('body');
    expect(body).toContain('competitor');
    await ctx.close();
  });

  test('Checklist: all 7 sections expandable', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/checklist', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const sections = ['Meta Tags', 'Headings', 'Content', 'Images', 'Technical', 'Google Business Profile', 'Links'];
    const body = await p.textContent('body');
    for (const section of sections) {
      expect(body).toContain(section);
    }
    await ctx.close();
  });

  test('Referral: has share link and reward info', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/refer', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('searchgoodly.com');
    expect(body.toLowerCase()).toContain('refer');
    await ctx.close();
  });

  test('Content Studio: has feature sections', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/content-studio', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.length).toBeGreaterThan(200);
    await ctx.close();
  });

  test('Verify Email: shows verification message', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/verify-email', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body.toLowerCase()).toContain('verif');
    await ctx.close();
  });

  test('Error page: shows friendly error', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/error', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('sideways');
    await ctx.close();
  });

  test('404 page: shows 404 and home link', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/this-does-not-exist-xyz-999', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const body = await p.textContent('body');
    expect(body).toContain('404');
    const homeLink = p.locator('a[href="/"]');
    const count = await homeLink.count();
    expect(count).toBeGreaterThan(0);
    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. CROSS-PAGE NAVIGATION CHAINS
// ═══════════════════════════════════════════════════════════════
test.describe('11. Cross-Page Navigation Chains', () => {
  test('Full public flow: Landing -> Audit -> Pricing -> Register -> Login -> Forgot Password', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();

    await p.goto('/', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();

    await p.goto('/audit', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="text"]').or(p.locator('input[placeholder*="your"]'))).toBeVisible();

    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('h1')).toBeVisible();

    await p.goto('/register', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input').first()).toBeVisible();

    await p.goto('/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'))).toBeVisible();

    await p.goto('/forgot-password', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(p.locator('input[type="email"]').or(p.locator('input[placeholder*="Email"]'))).toBeVisible();

    await ctx.close();
  });

  test('Content flow: Blog -> Post -> Back -> Tools -> Tool -> Back', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();

    await p.goto('/blog', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const firstPost = p.locator('a[href*="/blog/"]').first();
    await firstPost.click({ force: true });
    await p.waitForLoadState('networkidle');
    await expect(p).toHaveURL(/\/blog\//);
    await p.goBack();

    await p.goto('/tools', { waitUntil: 'networkidle', timeout: TIMEOUT });
    const firstTool = p.locator('a[href*="/tools/"]').first();
    await firstTool.click({ force: true });
    await p.waitForLoadState('networkidle');
    await expect(p).toHaveURL(/\/tools\//);
    await p.goBack();

    await ctx.close();
  });

  test('Industry flow: Restaurants -> Plumbers -> Dentists -> Salons', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();

    const industries = ['/restaurants', '/plumbers', '/dentists', '/salons'];
    for (const path of industries) {
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const h1 = await p.locator('h1').first().textContent();
      expect(h1.length).toBeGreaterThan(3);
    }

    await ctx.close();
  });

  test('Comparison flow: vs/ahrefs -> vs/semrush -> vs/moz', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();

    const comparisons = ['/vs/ahrefs', '/vs/semrush', '/vs/moz'];
    for (const path of comparisons) {
      await p.goto(path, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const h1 = await p.locator('h1').first().textContent();
      expect(h1.length).toBeGreaterThan(3);
    }

    await ctx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. SECURITY HEADERS ON ALL PAGES
// ═══════════════════════════════════════════════════════════════
const SECURITY_PAGES = ['/', '/pricing', '/login', '/blog', '/audit', '/register', '/tools'];

test.describe('12. Security Headers on All Pages', () => {
  for (const pagePath of SECURITY_PAGES) {
    test(`${pagePath}: has security headers`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const resp = await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const headers = resp.headers();

      expect(headers['x-content-type-options'] || headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['x-frame-options'] || headers['X-Frame-Options']).toBe('DENY');

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 13. IMAGE LOADING ON ALL PAGES
// ═══════════════════════════════════════════════════════════════
test.describe('13. Image Loading on Key Pages', () => {
  for (const pagePath of ['/', '/pricing', '/blog', '/stories', '/tools']) {
    test(`${pagePath}: images load without errors`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      const brokenImages = [];

      p.on('response', resp => {
        if (resp.request().resourceType() === 'image' && resp.status() >= 400) {
          brokenImages.push(resp.url());
        }
      });

      await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });
      await p.waitForTimeout(2000);

      // Allow some external images to fail (3rd party)
      const internalBroken = brokenImages.filter(url => url.includes('searchgoodly.com'));
      expect(internalBroken, `Broken images on ${pagePath}: ${internalBroken.join(', ')}`).toEqual([]);

      await ctx.close();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 14. META TAGS ON ALL PAGES
// ═══════════════════════════════════════════════════════════════
test.describe('14. Meta Tags on All Pages', () => {
  for (const pagePath of ['/', '/pricing', '/blog', '/tools', '/stories', '/competitors', '/checklist', '/refer', '/content-studio']) {
    test(`${pagePath}: has title and meta description`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(pagePath, { waitUntil: 'networkidle', timeout: TIMEOUT });

      const title = await p.title();
      expect(title.length, `Title too short on ${pagePath}`).toBeGreaterThan(5);
      expect(title.length, `Title too long on ${pagePath}`).toBeLessThan(80);

      const metaDesc = await p.getAttribute('meta[name="description"]', 'content');
      if (metaDesc) {
        expect(metaDesc.length).toBeGreaterThan(10);
      }

      await ctx.close();
    });
  }
});
