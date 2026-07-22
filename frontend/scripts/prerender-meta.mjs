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
  "/cabinets": {
    title: "SEO for Cabinet Makers — Get Found When Homeowners Remodel | Goodly",
    description: "Homeowners searching for kitchen cabinets call the first shops they find. Goodly shows cabinet makers exactly how to be one of them.",
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
  "/vs/agency": {
    title: "Goodly vs Hiring an SEO Agency — 10x Cheaper | Goodly",
    description: "Agencies charge $1,500+/month with opaque reports. Goodly gives you the same diagnosis, fixes, and monitoring from $49/month.",
  },
  "/vs/brightlocal": {
    title: "Goodly vs BrightLocal — Beyond Local Rank Tracking",
    description: "BrightLocal tracks local rankings. Goodly tracks them and fixes what's holding you back — AI rewrites, schema, content plans.",
  },
  "/vs/localfalcon": {
    title: "Goodly vs Local Falcon — More Than a Map Scanner",
    description: "Local Falcon shows where you rank on the map. Goodly shows why — and generates the fixes to climb.",
  },
  "/vs/seranking": {
    title: "Goodly vs SE Ranking — Built for Owners, Not Agencies",
    description: "SE Ranking is an agency toolkit. Goodly is for the business owner: plain-English audits, done-for-you fixes, revenue impact.",
  },
  "/tools/meta-tag-checker": {
    title: "Free Meta Tag Checker — Test Any Page | Goodly",
    description: "Check any page's title, description, and OpenGraph tags in seconds. See exactly what Google and social networks read. Free, no signup.",
  },
  "/tools/page-speed": {
    title: "Free Page Speed Test | Goodly",
    description: "Test how fast your website loads on mobile and desktop. Slow pages lose customers — find out where you stand in 10 seconds.",
  },
  "/tools/mobile-friendly": {
    title: "Free Mobile-Friendly Test | Goodly",
    description: "Over 60% of searches happen on phones. Check if your website passes Google's mobile-friendly standards. Free, instant.",
  },
  "/tools/keyword-density": {
    title: "Free Keyword Density Checker | Goodly",
    description: "Analyze how often your target keywords appear on any page — and whether you're under- or over-optimizing.",
  },
  "/tools/ssl-checker": {
    title: "Free SSL Checker — Is Your Site Secure? | Goodly",
    description: "Google flags sites without valid HTTPS. Check your SSL certificate status and expiry in seconds.",
  },
  "/tools/schema-validator": {
    title: "Free Schema Markup Validator | Goodly",
    description: "Validate your JSON-LD structured data and see if you qualify for rich results on Google. Free, instant.",
  },
  "/tools/robots-checker": {
    title: "Free Robots.txt Checker | Goodly",
    description: "One wrong line in robots.txt can hide your whole site from Google. Check yours in seconds.",
  },
  "/tools/heading-checker": {
    title: "Free Heading Structure Checker | Goodly",
    description: "Check any page's H1-H6 hierarchy. Broken heading structure confuses Google and screen readers alike.",
  },
  "/checklist": {
    title: "Free SEO Checklist for Small Businesses | Goodly",
    description: "The complete step-by-step SEO checklist for small businesses — from Google Business Profile to schema markup.",
  },
  "/content-studio": {
    title: "Content Studio — AI Writing for Small Businesses | Goodly",
    description: "Generate blog posts, social captions, and emails written for your business and your customers. Try it free.",
  },
  "/refer": {
    title: "Refer a Business, Earn Rewards | Goodly",
    description: "Know a business that deserves to be found? Refer them to Goodly and you both get rewarded.",
  },
  "/roi-calculator": {
    title: "SEO ROI Calculator — What Is Ranking Worth? | Goodly",
    description: "Calculate what page-one rankings would be worth to your business in clicks, customers, and revenue.",
  },
  "/stories": {
    title: "Customer Stories | Goodly",
    description: "How small businesses use Goodly to get found on Google and grow — real stories, real numbers.",
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
// article gets its own shell (title + excerpt + Article JSON-LD) with the
// full article body prerendered into #root, so crawlers that don't execute
// JS index the actual text. React replaces the static body on hydration.
// Build proceeds without them if the API is unreachable (e.g. first deploy).
const API = "https://api.searchgoodly.com/api";

async function fetchBlogRoutes() {
  try {
    // The list endpoint defaults to limit=20 — page through everything so
    // no article is missing from the sitemap or shell output.
    const posts = [];
    for (let offset = 0; ; offset += 100) {
      const res = await fetch(`${API}/blog/posts?limit=100&offset=${offset}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batch = (await res.json()).posts || [];
      posts.push(...batch);
      if (batch.length < 100) break;
    }
    const { marked } = await import("marked");

    // Fetch full article bodies (the list endpoint omits content)
    const full = await Promise.all(
      posts.map(async (p) => {
        try {
          const r = await fetch(`${API}/blog/posts/${p.slug}`, { signal: AbortSignal.timeout(15000) });
          return r.ok ? await r.json() : p;
        } catch {
          return p; // shell still gets meta, just no body
        }
      }),
    );

    const routes = {};
    for (const p of full) {
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
          datePublished: p.created_at || undefined,
          dateModified: p.updated_at || p.created_at || undefined,
          publisher: { "@type": "Organization", name: "Goodly", url: BASE },
        },
        // Markdown → HTML, injected into #root so the text is in the raw
        // document. Hidden visually to avoid a flash before React mounts.
        bodyHtml: p.content
          ? `<article style="position:absolute;left:-9999px" aria-hidden="true"><h1>${esc(p.title)}</h1>${marked.parse(p.content)}</article>`
          : "",
        lastmod: (p.updated_at || p.created_at || "").slice(0, 10),
      };
    }
    return routes;
  } catch (e) {
    console.warn(`prerender-meta: blog fetch skipped (${e.message})`);
    return {};
  }
}

// Build-time sitemap: static routes + live blog posts with lastmod, so new
// articles are picked up by crawlers automatically on every deploy
// (replaces the hand-maintained public/sitemap.xml copy in the output).
function writeSitemap(blogRoutes) {
  const today = new Date().toISOString().slice(0, 10);
  const priority = (r) => (r === "/" ? "1.0" : r === "/audit" || r === "/pricing" ? "0.9" : r.startsWith("/blog/") ? "0.7" : "0.8");
  const urls = ["/", ...Object.keys(ROUTES), ...Object.keys(blogRoutes)].map((r) => {
    const lastmod = blogRoutes[r]?.lastmod || today;
    return `  <url>\n    <loc>${BASE}${r === "/" ? "" : r}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority(r)}</priority>\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  writeFileSync(join(DIST, "sitemap.xml"), xml);
  console.log(`prerender-meta: sitemap.xml with ${urls.length} URLs`);
}

// BlogPost.jsx ships FALLBACK_POSTS rendered client-side even when the API
// has no such post — they were in the old hand-maintained sitemap and still
// resolve, so keep meta shells + sitemap entries for any not in the API.
function fallbackBlogRoutes(apiRoutes) {
  try {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "src", "pages", "BlogPost.jsx"),
      "utf8",
    );
    const routes = {};
    for (const m of src.matchAll(/"([a-z0-9-]+)":\s*\{\s*\n?\s*title:\s*"([^"]+)"/g)) {
      const route = `/blog/${m[1]}`;
      if (!apiRoutes[route]) {
        routes[route] = { title: `${m[2]} | Goodly Blog`, description: m[2] };
      }
    }
    return routes;
  } catch (e) {
    console.warn(`prerender-meta: fallback posts skipped (${e.message})`);
    return {};
  }
}

// ---------------------------------------------------------------------------
// Static hero for "/" — the SPA paints nothing until React boots, which put
// mobile LCP at ~5.6s. Baking a copy of the nav + hero into the root shell
// makes first paint come straight from HTML; React re-renders the identical
// markup on mount so the swap is invisible.
//
// Rules for this snippet:
// - Only use Tailwind classes that already appear in src/**.jsx — Tailwind
//   doesn't scan this file, so any new class would be missing from the CSS.
// - Keep markup in sync with Landing.jsx's header + hero section.
// - Visible by default (so it paints even before/without JS); the inline
//   script right after it hides it synchronously on any other path, because
//   vercel.json rewrites every unknown path to this same shell and app
//   routes must not flash the landing hero.
const STATIC_HERO = `
<div id="static-shell">
  <div class="min-h-screen bg-[#FDFBF7]">
    <header class="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="h-9 w-9 rounded-2xl bg-[#2D3E32] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FDFBF7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <span class="font-display font-bold text-[#1A201A] text-xl tracking-tight">good<span class="text-[#D4643F]">ly</span></span>
        </div>
        <nav class="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
          <a href="#how" class="hover:text-[#1A201A] transition-colors">How it works</a>
          <a href="#features" class="hover:text-[#1A201A] transition-colors">What you get</a>
          <a href="/pricing" class="hover:text-[#1A201A] transition-colors">Pricing</a>
          <a href="/content-studio" class="hover:text-[#1A201A] transition-colors">Content Studio</a>
          <a href="#stories" class="hover:text-[#1A201A] transition-colors">Stories</a>
        </nav>
        <div class="flex items-center gap-3">
          <a href="/login" class="text-sm text-[#1A201A] hover:text-[#4A5F4F]">Sign in</a>
          <a href="/register" class="inline-flex items-center justify-center text-sm font-medium bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5 py-2.5">Start free</a>
        </div>
      </div>
    </header>
    <main>
      <section class="relative overflow-hidden">
        <div class="organic-blob bg-[#81B29A]" style="width:500px;height:500px;top:-80px;right:-120px"></div>
        <div class="organic-blob bg-[#E07A5F]" style="width:380px;height:380px;bottom:-120px;left:-100px"></div>
        <div class="relative max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <div class="max-w-3xl mx-auto text-center">
            <div class="label-eyebrow mb-6 justify-center">For small businesses that want more customers</div>
            <h1 class="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Get found on Google.<br/>
              <span class="text-[#D4643F]">Without learning SEO.</span>
            </h1>
            <p class="mt-6 text-lg text-[#5C685C] max-w-xl mx-auto leading-relaxed">
              See exactly why customers can't find your business online — and what to fix.
              One free audit. No jargon. No credit card.
            </p>
            <div class="mt-10">
              <div class="w-full max-w-xl mx-auto">
                <div class="flex items-center gap-0">
                  <div class="relative flex-1">
                    <input type="text" placeholder="yourwebsite.com" class="w-full pl-12 pr-4 py-7 text-lg rounded-l-2xl rounded-r-none border border-[#D4CFC4] bg-white shadow-sm" style="height:3.5rem"/>
                  </div>
                  <button type="button" class="inline-flex items-center justify-center rounded-r-2xl rounded-l-none px-8 text-lg bg-[#C4502F] text-white font-semibold shadow-sm" style="height:3.5rem">Get Free Score</button>
                </div>
                <p class="mt-3 text-xs text-[#6B776B] text-center">Free instant audit. No signup required.</p>
              </div>
            </div>
            <div class="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-[#5C685C]">
              <div class="flex items-center gap-2">Free forever plan</div>
              <div class="flex items-center gap-2">Results in 30 seconds</div>
              <div class="flex items-center gap-2">No credit card required</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</div>
<script>if(location.pathname!=="/")document.getElementById("static-shell").setAttribute("hidden","")</script>`;

const apiBlogRoutes = await fetchBlogRoutes();
const blogRoutes = { ...fallbackBlogRoutes(apiBlogRoutes), ...apiBlogRoutes };
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

  // Inject the prerendered article body into #root — crawlers see the full
  // text; React replaces it on mount.
  if (meta.bodyHtml) {
    html = html.replace('<div id="root"></div>', `<div id="root">${meta.bodyHtml}</div>`);
  }

  const outDir = join(DIST, ...route.split("/").filter(Boolean));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  count++;
}

// Root shell last (the per-route loop above reads `template` from the
// original file, so writing this after the loop can't leak into sub-shells).
writeFileSync(
  join(DIST, "index.html"),
  template.replace('<div id="root"></div>', `<div id="root">${STATIC_HERO}</div>`),
);
console.log("prerender-meta: static hero baked into root shell");

writeSitemap(blogRoutes);
console.log(`prerender-meta: wrote ${count} route shells with unique meta`);
