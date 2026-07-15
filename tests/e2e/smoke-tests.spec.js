const { test, expect } = require('@playwright/test');

// ── All public pages to smoke-test ──────────────────────────────
const PUBLIC_PAGES = [
  { path: '/', name: 'Landing', heading: 'Get found on Google' },
  { path: '/login', name: 'Login', heading: 'Welcome back' },
  { path: '/register', name: 'Register', heading: 'Create your account' },
  { path: '/pricing', name: 'Pricing', heading: 'Plans for every stage' },
  { path: '/audit', name: 'Public Audit', heading: 'How healthy is your website' },
  { path: '/blog', name: 'Blog', heading: 'Goodly Blog' },
  { path: '/terms', name: 'Terms', heading: 'Terms of Service' },
  { path: '/privacy', name: 'Privacy', heading: 'Privacy Policy' },
  { path: '/forgot-password', name: 'Forgot Password', heading: 'Forgot' },
  { path: '/changelog', name: 'Changelog', heading: 'Changelog' },
  { path: '/status', name: 'Status', heading: 'System Status' },
  { path: '/help', name: 'Knowledge Base', heading: 'Help Center' },
  { path: '/stories', name: 'Testimonials', heading: 'success story' },
  { path: '/roi-calculator', name: 'ROI Calculator', heading: 'ROI' },
  { path: '/competitors', name: 'Competitor Landing', heading: 'competitor' },
  { path: '/checklist', name: 'Checklist', heading: 'Checklist' },
  { path: '/refer', name: 'Referral', heading: 'refer' },
  { path: '/content-studio', name: 'Content Studio', heading: 'Content' },
  { path: '/tools', name: 'Free Tools', heading: 'Free SEO Tools' },
  { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker', heading: 'Meta Tag' },
  { path: '/tools/page-speed', name: 'Page Speed', heading: 'Page Speed' },
  { path: '/tools/mobile-friendly', name: 'Mobile Friendly', heading: 'Mobile' },
  { path: '/tools/keyword-density', name: 'Keyword Density', heading: 'Keyword' },
  { path: '/tools/ssl-checker', name: 'SSL Checker', heading: 'SSL' },
  { path: '/tools/schema-validator', name: 'Schema Validator', heading: 'Schema' },
  { path: '/tools/robots-checker', name: 'Robots Checker', heading: 'Robots' },
  { path: '/tools/heading-checker', name: 'Heading Checker', heading: 'Heading' },
  // Industry pages
  { path: '/restaurants', name: 'Restaurants', heading: 'restaurant' },
  { path: '/plumbers', name: 'Plumbers', heading: 'plumber' },
  { path: '/dentists', name: 'Dentists', heading: 'dentist' },
  { path: '/salons', name: 'Salons', heading: 'salon' },
  { path: '/retail', name: 'Retail', heading: 'retail' },
  { path: '/lawyers', name: 'Lawyers', heading: 'lawyer' },
  { path: '/home-services', name: 'Home Services', heading: 'home' },
  { path: '/real-estate', name: 'Real Estate', heading: 'real estate' },
  { path: '/automotive', name: 'Automotive', heading: 'automotive' },
  // Comparison pages
  { path: '/vs/ahrefs', name: 'vs Ahrefs', heading: 'Ahrefs' },
  { path: '/vs/semrush', name: 'vs Semrush', heading: 'Semrush' },
  { path: '/vs/moz', name: 'vs Moz', heading: 'Moz' },
  { path: '/vs/ubersuggest', name: 'vs Ubersuggest', heading: 'Ubersuggest' },
  { path: '/vs/seranking', name: 'vs SERanking', heading: 'SERanking' },
  { path: '/vs/agency', name: 'vs Agency', heading: 'Agency' },
  { path: '/vs/localfalcon', name: 'vs LocalFalcon', heading: 'LocalFalcon' },
  { path: '/vs/brightlocal', name: 'vs BrightLocal', heading: 'BrightLocal' },
];

// ── Smoke test: every public page loads with 200 and has content ──
test.describe('Public Page Smoke Tests', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page.name} (${page.path}) loads with content`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      const response = await p.goto(page.path, { waitUntil: 'networkidle', timeout: 15000 });
      expect(response.status()).toBe(200);
      // Check that the page has some visible text content
      const bodyText = await p.textContent('body');
      expect(bodyText.length).toBeGreaterThan(100);
      await context.close();
    });
  }
});

// ── No console errors on any public page ──
test.describe('No Console Errors', () => {
  for (const page of PUBLIC_PAGES.slice(0, 20)) { // First 20 pages to keep runtime reasonable
    test(`${page.name} (${page.path}) has no console errors`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      const errors = [];
      p.on('pageerror', err => errors.push(err.message));
      await p.goto(page.path, { waitUntil: 'networkidle', timeout: 15000 });
      // Small delay for any async errors
      await p.waitForTimeout(1000);
      expect(errors).toEqual([]);
      await context.close();
    });
  }
});

// ── Landing page links ──
test.describe('Landing Page Links', () => {
  test('all navigation links work', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: 15000 });

    // Check key links are present and clickable
    const links = [
      { selector: 'a[href="/login"]', name: 'Sign in' },
      { selector: 'a[href="/pricing"]', name: 'Pricing' },
      { selector: 'a[href="/audit"]', name: 'Free Audit' },
    ];

    for (const link of links) {
      const el = p.locator(link.selector).first();
      await expect(el).toBeVisible({ timeout: 5000 });
    }

    // Click Sign in and verify navigation
    await p.click('a[href="/login"]');
    await expect(p).toHaveURL(/\/login/);

    await context.close();
  });

  test('footer links are present', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/', { waitUntil: 'networkidle', timeout: 15000 });

    const footerLinks = [
      '/pricing', '/audit', '/register',
      '/tools/meta-tag-checker', '/blog',
      '/terms', '/privacy',
    ];

    for (const href of footerLinks) {
      const link = p.locator(`footer a[href="${href}"]`).or(p.locator(`a[href="${href}"]`));
      const count = await link.count();
      expect(count, `Link ${href} should exist`).toBeGreaterThan(0);
    }

    await context.close();
  });
});

// ── Login page functionality ──
test.describe('Login Page', () => {
  test('form elements are present', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: 15000 });

    await expect(p.locator('[data-testid="login-email-input"]')).toBeVisible();
    await expect(p.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(p.locator('[data-testid="login-submit-btn"]')).toBeVisible();
    await expect(p.locator('[data-testid="goto-register-link"]')).toBeVisible();

    await context.close();
  });

  test('empty form shows validation', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: 15000 });
    await p.click('[data-testid="login-submit-btn"]');
    // Should show some error or stay on page
    await expect(p).toHaveURL(/\/login/);
    await context.close();
  });

  test('links to register and forgot password', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/login', { waitUntil: 'networkidle', timeout: 15000 });

    // Dismiss cookie banner if present
    const cookieBtn = p.locator('button:has-text("Got it")');
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await p.waitForTimeout(500);
    }

    // Click the register link (text is "Create account →")
    await p.locator('a[href="/register"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/register/);

    await p.goto('/login', { waitUntil: 'networkidle', timeout: 15000 });
    // Dismiss cookie banner again
    const cookieBtn2 = p.locator('button:has-text("Got it")');
    if (await cookieBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn2.click();
      await p.waitForTimeout(500);
    }
    // Click forgot password link
    await p.locator('a[href="/forgot-password"]').first().click({ force: true });
    await expect(p).toHaveURL(/\/forgot-password/);

    await context.close();
  });
});

// ── Register page ──
test.describe('Register Page', () => {
  test('form elements are present', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/register', { waitUntil: 'networkidle', timeout: 15000 });

    await expect(p.locator('[data-testid="register-name-input"]')).toBeVisible();
    await expect(p.locator('[data-testid="register-email-input"]')).toBeVisible();
    await expect(p.locator('[data-testid="register-password-input"]')).toBeVisible();
    await expect(p.locator('[data-testid="register-submit-btn"]')).toBeVisible();
    await expect(p.locator('[data-testid="goto-login-link"]')).toBeVisible();

    await context.close();
  });
});

// ── Pricing page ──
test.describe('Pricing Page', () => {
  test('all plan cards are visible', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: 15000 });

    // Check plan names are visible using more specific selectors
    // The plan cards have column headers in the comparison table
    await expect(p.locator('text=Get started').first()).toBeVisible();
    await expect(p.locator('text=Most popular').first()).toBeVisible();
    await expect(p.locator('text=Growing business').first()).toBeVisible();
    await expect(p.locator('text=Done for you').first()).toBeVisible();

    await context.close();
  });

  test('monthly/annual toggle works', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/pricing', { waitUntil: 'networkidle', timeout: 15000 });

    await p.click('text=Annual');
    await p.waitForTimeout(500);
    // Should show annual pricing
    const bodyText = await p.textContent('body');
    expect(bodyText).toContain('annually');

    await context.close();
  });
});

// ── Public audit page ──
test.describe('Public Audit Page', () => {
  test('audit form is present', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/audit', { waitUntil: 'networkidle', timeout: 15000 });

    await expect(p.locator('input[placeholder*="your"]').or(p.locator('input[type="text"]'))).toBeVisible();
    await expect(p.locator('button:has-text("score")').or(p.locator('button:has-text("Get")'))).toBeVisible();

    await context.close();
  });
});

// ── Blog page ──
test.describe('Blog Page', () => {
  test('blog posts are listed', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/blog', { waitUntil: 'networkidle', timeout: 15000 });

    // Should have multiple blog post links
    const postLinks = p.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    expect(count).toBeGreaterThan(2);

    await context.close();
  });

  test('can navigate to a blog post', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/blog', { waitUntil: 'networkidle', timeout: 15000 });

    const firstPost = p.locator('a[href*="/blog/"]').first();
    await firstPost.click();
    await p.waitForLoadState('networkidle');
    // Should be on a blog post page
    await expect(p).toHaveURL(/\/blog\//);

    await context.close();
  });
});

// ── Free tools pages ──
test.describe('Free Tools', () => {
  const tools = [
    { path: '/tools/meta-tag-checker', name: 'Meta Tag Checker' },
    { path: '/tools/page-speed', name: 'Page Speed' },
    { path: '/tools/mobile-friendly', name: 'Mobile Friendly' },
    { path: '/tools/keyword-density', name: 'Keyword Density' },
    { path: '/tools/ssl-checker', name: 'SSL Checker' },
    { path: '/tools/schema-validator', name: 'Schema Validator' },
    { path: '/tools/robots-checker', name: 'Robots Checker' },
    { path: '/tools/heading-checker', name: 'Heading Checker' },
  ];

  for (const tool of tools) {
    test(`${tool.name} has input form`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      await p.goto(tool.path, { waitUntil: 'networkidle', timeout: 15000 });

      // Each tool should have an input field
      const inputs = p.locator('input[type="text"], input:not([type]), textarea');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);

      await context.close();
    });
  }
});

// ── Industry pages ──
test.describe('Industry Pages', () => {
  const industries = [
    '/restaurants', '/plumbers', '/dentists', '/salons',
    '/retail', '/lawyers', '/home-services', '/real-estate', '/automotive',
  ];

  for (const path of industries) {
    test(`${path} has CTA`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      await p.goto(path, { waitUntil: 'networkidle', timeout: 15000 });

      // Should have a CTA link to register
      const ctaLink = p.locator('a[href="/register"]');
      const count = await ctaLink.count();
      expect(count).toBeGreaterThan(0);

      await context.close();
    });
  }
});

// ── Comparison pages ──
test.describe('Comparison Pages', () => {
  const comparisons = [
    '/vs/ahrefs', '/vs/semrush', '/vs/moz', '/vs/ubersuggest',
    '/vs/seranking', '/vs/agency', '/vs/localfalcon', '/vs/brightlocal',
  ];

  for (const path of comparisons) {
    test(`${path} loads`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      const response = await p.goto(path, { waitUntil: 'networkidle', timeout: 15000 });
      expect(response.status()).toBe(200);
      const bodyText = await p.textContent('body');
      expect(bodyText.length).toBeGreaterThan(200);
      await context.close();
    });
  }
});

// ── 404 page ──
test.describe('404 Page', () => {
  test('unknown route shows 404', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/this-page-does-not-exist-xyz-123', { waitUntil: 'networkidle', timeout: 15000 });
    // Should show 404 content
    const bodyText = await p.textContent('body');
    expect(bodyText).toContain('404');
    await context.close();
  });
});

// ── Static assets ──
test.describe('Static Assets', () => {
  const assets = [
    '/favicon.svg',
    '/favicon.ico',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/logo192.png',
    '/logo512.png',
    '/og-image.png',
  ];

  for (const asset of assets) {
    test(`${asset} returns 200`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      const response = await p.goto(asset, { waitUntil: 'networkidle', timeout: 10000 });
      expect(response.status()).toBe(200);
      await context.close();
    });
  }
});

// ── Auth redirects ──
test.describe('Auth Redirects', () => {
  const protectedRoutes = [
    '/app', '/app/projects', '/app/audit', '/app/billing',
    '/app/ai-tools', '/app/social', '/app/ai-visibility', '/app/gbp',
    '/app/admin', '/app/agency', '/app/affiliate',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login when unauthenticated`, async ({ browser }) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      await p.goto(route, { waitUntil: 'networkidle', timeout: 15000 });
      // Should redirect to login
      await expect(p).toHaveURL(/\/login/, { timeout: 10000 });
      await context.close();
    });
  }
});

// ── Error page ──
test.describe('Error Page', () => {
  test('/error page loads', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/error', { waitUntil: 'networkidle', timeout: 15000 });
    const bodyText = await p.textContent('body');
    expect(bodyText).toContain('sideways');
    await context.close();
  });
});

// ── Verify email page ──
test.describe('Verify Email Page', () => {
  test('/verify-email page loads', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/verify-email', { waitUntil: 'networkidle', timeout: 15000 });
    const bodyText = await p.textContent('body');
    expect(bodyText.toLowerCase()).toContain('verif');
    await context.close();
  });
});

// ── Reset password page ──
test.describe('Reset Password Page', () => {
  test('/reset-password page loads', async ({ browser }) => {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto('/reset-password?token=test123', { waitUntil: 'networkidle', timeout: 15000 });
    const bodyText = await p.textContent('body');
    expect(bodyText.length).toBeGreaterThan(100);
    await context.close();
  });
});
