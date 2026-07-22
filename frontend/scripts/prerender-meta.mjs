#!/usr/bin/env node
/**
 * Post-build meta prerender.
 *
 * The app is a client-rendered SPA, so every route used to serve the exact
 * same index.html (QA issue #10 — "identical SPA shells"). Google renders JS
 * and picks up usePageMeta, but social scrapers and non-Google crawlers only
 * read the raw HTML.
 *
 * This script writes dist/<route>/index.html per public route with unique
 * <title>, meta description, canonical, and og/twitter tags baked in.
 * Vercel serves matching static files before applying the SPA rewrite, so
 * each route gets its own shell while the client app behaves exactly as
 * before (usePageMeta overwrites these same tags at runtime).
 *
 * Run automatically via `npm run build` (see package.json).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Vite is configured with outDir "build" (see vite.config.js)
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "build");
const BASE = "https://searchgoodly.com";

// Keep descriptions in sync with each page's usePageMeta call.
const ROUTES = {
  "/audit": {
    title: "Free SEO Audit — Instant Website Score | Goodly",
    description: "Get a free SEO score for your website in 10 seconds. See exactly what's blocking you from ranking on Google — no signup required.",
  },
  "/pricing": {
    title: "Pricing — Plans from $49/mo | Goodly",
    description: "Simple pricing for small business SEO. Starter $49/mo, Pro $149/mo, Concierge $1000/mo. Free audit included on every plan.",
  },
  "/tools": {
    title: "Free SEO Tools for Small Businesses | Goodly",
    description: "Free meta tag checker, page speed test, mobile-friendly test, keyword density, SSL checker, and schema validator. No signup required.",
  },
  "/blog": {
    title: "SEO Guides for Small Businesses | Goodly Blog",
    description: "Plain-English SEO guides for restaurants, plumbers, salons, dentists, and local businesses. Learn how to get found on Google.",
  },
  "/login": {
    title: "Log In | Goodly",
    description: "Log in to your Goodly account to run SEO audits, track rankings, and grow your visibility.",
  },
  "/register": {
    title: "Create Your Free Account | Goodly",
    description: "Create a free Goodly account and get your first SEO audit, keyword ideas, and a visibility action plan in minutes.",
  },
  "/help": {
    title: "Help Center & Knowledge Base | Goodly",
    description: "How-to guides and answers for Goodly's SEO audit, rank tracking, AI tools, and billing.",
  },
  "/competitors": {
    title: "See How You Stack Up Against Competitors | Goodly",
    description: "Compare your website's SEO against local competitors head-to-head. Find the gaps costing you customers.",
  },
  "/restaurants": {
    title: "SEO for Restaurants — Get Found by Hungry Customers | Goodly",
    description: "When someone searches 'best restaurant near me,' they pick from the top 3 results. Goodly gets your restaurant there.",
  },
  "/plumbers": {
    title: "SEO for Plumbers — Be Found in Emergencies | Goodly",
    description: "Emergency calls go to whoever ranks #1 on Google. Goodly shows plumbers exactly how to get there — no technical skills needed.",
  },
  "/salons": {
    title: "SEO for Salons — Book More Clients from Google | Goodly",
    description: "New clients search Google before they book. Goodly makes sure they find your salon first.",
  },
  "/dentists": {
    title: "SEO for Dentists — Attract New Patients | Goodly",
    description: "Hundreds of people in your area search for a dentist every month. Goodly makes sure they find your practice first.",
  },
  "/retail": {
    title: "SEO for Retail Stores — Turn Searches into Visits | Goodly",
    description: "People search Google before they shop. Goodly makes sure they find your store — and walk through your door.",
  },
  "/lawyers": {
    title: "SEO for Law Firms — Win More Clients | Goodly",
    description: "77% of people search online before hiring a lawyer. If your firm isn't on page one, you're invisible. Goodly fixes that.",
  },
  "/home-services": {
    title: "SEO for Home Services — Get More Calls | Goodly",
    description: "Emergency calls go to whoever ranks #1. Goodly shows home service businesses exactly how to get there.",
  },
  "/real-estate": {
    title: "SEO for Real Estate Agents — Reach Buyers First | Goodly",
    description: "44% of home buyers start their search online. Goodly makes sure they find your listings and your site first.",
  },
  "/automotive": {
    title: "SEO for Auto Shops — Be the First Call | Goodly",
    description: "Be the shop people call when their car won't start. Goodly gets your auto business to the top of local search.",
  },
  "/vs/ahrefs": {
    title: "Goodly vs Ahrefs — SEO Without the Complexity",
    description: "Ahrefs is built for SEO pros. Goodly is built for small business owners: plain-English audits, action plans, and done-for-you fixes.",
  },
  "/vs/semrush": {
    title: "Goodly vs Semrush — Simple SEO for Small Businesses",
    description: "Semrush has 50+ tools you'll never use. Goodly gives small businesses the handful that matter, with AI that does the work.",
  },
  "/vs/moz": {
    title: "Goodly vs Moz — Actionable SEO for Local Businesses",
    description: "Moz reports metrics. Goodly turns your SEO into a prioritized to-do list with revenue impact estimates.",
  },
  "/vs/ubersuggest": {
    title: "Goodly vs Ubersuggest — Built for Local Visibility",
    description: "Ubersuggest is a keyword tool. Goodly is a visibility platform: audits, local SEO, AI recommendations, and rank tracking.",
  },
  "/terms": {
    title: "Terms of Service | Goodly",
    description: "Goodly's terms of service.",
  },
  "/privacy": {
    title: "Privacy Policy | Goodly",
    description: "How Goodly collects, uses, and protects your data.",
  },
  "/changelog": {
    title: "Changelog — What's New | Goodly",
    description: "Product updates and improvements to Goodly's SEO platform.",
  },
  "/status": {
    title: "System Status | Goodly",
    description: "Live operational status of Goodly's audit engine, API, and dashboard.",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Blog posts are dynamic — fetch the live list at build time so every
// article gets its own shell (title + excerpt + Article JSON-LD).
// Build proceeds without them if the API is unreachable (e.g. first deploy).
async function fetchBlogRoutes() {
  try {
    const res = await fetch("https://api.searchgoodly.com/api/blog/posts", {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { posts = [] } = await res.json();
    const routes = {};
    for (const p of posts) {
      if (!p.slug || !p.title) continue;
      routes[`/blog/${p.slug}`] = {
        title: `${p.title} | Goodly Blog`,
        description: (p.excerpt || p.title).slice(0, 160),
        // Article schema helps these pages qualify for rich results
        jsonld: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.title,
          description: (p.excerpt || "").slice(0, 200),
          url: `${BASE}/blog/${p.slug}`,
          publisher: { "@type": "Organization", name: "Goodly", url: BASE },
        },
      };
    }
    return routes;
  } catch (e) {
    console.warn(`prerender-meta: blog fetch skipped (${e.message})`);
    return {};
  }
}

const blogRoutes = await fetchBlogRoutes();
const template = readFileSync(join(DIST, "index.html"), "utf8");
let count = 0;

for (const [route, meta] of Object.entries({ ...ROUTES, ...blogRoutes })) {
  const url = `${BASE}${route}`;
  let html = template
    // <title> — index.html always has one
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    // meta description + og/twitter tags + canonical
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta (?:name|property)="twitter:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
    .replace(/(<meta (?:name|property)="twitter:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`);

  // Inject page-specific JSON-LD (used for blog Article schema)
  if (meta.jsonld) {
    html = html.replace(
      "</head>",
      `<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script></head>`,
    );
  }

  const outDir = join(DIST, ...route.split("/").filter(Boolean));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  count++;
}

console.log(`prerender-meta: wrote ${count} route shells with unique meta`);
