import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Search, BookOpen, ChevronRight } from "lucide-react";

const articles = [
  {
    id: "getting-started",
    title: "Getting Started with Goodly",
    category: "Basics",
    summary: "Learn how to set up your account, run your first audit, and understand your SEO score.",
    content: `Welcome to Goodly! This guide will walk you through everything you need to get started.

## 1. Create Your Account
Sign up at searchgoodly.com/register with your email and password, or use Google Sign-In for faster access. You'll start on the Free plan with 5 audits per month included.

## 2. Run Your First Audit
Navigate to SEO Audit in the sidebar and paste your website URL. Goodly will analyze 50+ technical, on-page, and content factors and give you a score from 0-100.

## 3. Understand Your Score
- **90-100**: Excellent — your site is well-optimized
- **70-89**: Good — a few improvements needed
- **50-69**: Fair — significant optimization opportunities
- **Below 50**: Needs work — critical issues found

## 4. Fix Issues
Each issue comes with a priority level (Critical, High, Medium, Low) and step-by-step instructions. Start with Critical issues for the biggest impact.

## 5. Track Progress
Run audits weekly to track your score over time. The improvement tracker shows your before/after comparison.`,
  },
  {
    id: "seo-audit-explained",
    title: "How the SEO Audit Works",
    category: "SEO",
    summary: "Deep dive into the 50+ checks Goodly performs and what each one means for your rankings.",
    content: `Goodly's SEO audit engine checks over 50 factors across four categories:

## Technical SEO
- **SSL/HTTPS**: Is your site secure?
- **Mobile responsiveness**: Does it work on phones?
- **Page speed**: How fast does it load?
- **Robots.txt**: Is it properly configured?
- **Sitemap**: Do you have an XML sitemap?
- **Canonical URLs**: Are duplicate pages handled?

## On-Page SEO
- **Title tags**: Length, keywords, uniqueness
- **Meta descriptions**: Compelling and keyword-rich
- **Heading structure**: H1, H2, H3 hierarchy
- **Image alt text**: Accessibility and SEO
- **URL structure**: Clean, readable URLs
- **Internal linking**: How pages connect

## Content Quality
- **Word count**: Is content substantial enough?
- **Keyword density**: Natural keyword usage
- **Readability**: Is it easy to read?
- **Freshness**: When was it last updated?

## Off-Page Factors
- **Backlink profile**: Who links to you?
- **Social signals**: Social media presence
- **Domain authority**: Overall site strength`,
  },
  {
    id: "ai-visibility",
    title: "Understanding AI Visibility",
    category: "AI",
    summary: "How AI platforms like ChatGPT and Gemini see your business — and how to improve it.",
    content: `AI visibility is the new SEO. When people ask ChatGPT or Gemini "best plumber near me" or "top marketing agency," does your business appear?

## How It Works
Goodly queries AI platforms with industry-specific prompts to check if your business is mentioned, recommended, or visible in AI-generated responses.

## Why It Matters
- 40% of searches now happen outside traditional search engines
- AI platforms are becoming the default for recommendations
- Early adopters of AI visibility gain a significant advantage

## How to Improve
1. **Claim your Google Business Profile** — AI platforms pull from GBP
2. **Get listed on review sites** — Yelp, Trustpilot, G2
3. **Build your brand mentions** — PR, guest posts, podcasts
4. **Create authoritative content** — AI values depth and expertise
5. **Maintain consistent NAP** — Name, Address, Phone across the web`,
  },
  {
    id: "pricing-plans",
    title: "Pricing Plans Explained",
    category: "Billing",
    summary: "Compare Free, Starter, Pro, and Concierge plans to find the right fit for your business.",
    content: `Goodly offers four plans designed for businesses at every stage:

## Free ($0/month)
- 3 SEO audits total
- Basic AI visibility check
- Public tools access
- Best for: Trying out Goodly

## Starter ($49/month)
- 10 audits/month
- Weekly scheduled audits
- AI visibility tracking
- Social media analysis
- Email reports
- 7-day free trial
- Best for: Solo businesses and freelancers

## Pro ($149/month)
- 50 audits/month
- Everything in Starter
- Competitor analysis
- Google Business Profile audits
- Priority AI processing
- PDF export
- 7-day free trial
- Best for: Growing businesses and agencies

## Concierge ($1,000/month)
- Unlimited audits
- Everything in Pro
- Dedicated SEO strategist
- Custom reporting
- White-label reports
- API access
- Best for: Agencies and enterprises

All paid plans include a 7-day free trial. Cancel anytime.`,
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis Guide",
    category: "SEO",
    summary: "Learn how to use Goodly's competitor comparison to benchmark against your rivals.",
    content: `The Competitor Analysis tool lets you compare your website head-to-head against any competitor.

## How to Use
1. Go to Competitors in the sidebar
2. Enter your website URL
3. Enter up to 3 competitor URLs
4. Click "Compare"

## What You'll See
- **Score comparison**: Side-by-side SEO scores
- **Strengths & weaknesses**: Where you win and where you lose
- **Keyword gaps**: Keywords they rank for that you don't
- **Content gaps**: Topics they cover that you're missing
- **Technical gaps**: Infrastructure advantages

## How to Act on Results
1. Fix your lowest-scoring areas first
2. Create content for keyword gaps
3. Match or exceed competitor content depth
4. Set up weekly monitoring to track progress`,
  },
  {
    id: "scheduled-audits",
    title: "Setting Up Scheduled Audits",
    category: "Features",
    summary: "Automate your SEO monitoring with weekly scheduled audits and rank change alerts.",
    content: `Scheduled audits keep you on top of your SEO without manual effort.

## How to Set Up
1. Go to any project
2. Click "Schedule Weekly Audit"
3. Choose your day and time
4. Goodly will automatically run audits and email you reports

## Rank Change Alerts
When your SEO score changes by 5+ points, you'll receive:
- **Email alert** with before/after scores
- **In-app notification** in the notification center
- **Improvement tracking** on your dashboard

## What's Tracked
- Overall SEO score
- Technical health
- Content quality
- Keyword rankings
- AI visibility score
- Social media presence`,
  },
  {
    id: "free-tools",
    title: "Free SEO Tools Guide",
    category: "Tools",
    summary: "Overview of all 8 free SEO tools and when to use each one.",
    content: `Goodly offers 8 free SEO tools — no account required for most:

## 1. Meta Tag Checker
Check title tags, meta descriptions, OG tags, and canonical URLs. Best for: Quick on-page SEO audit.

## 2. Page Speed Test
Measure load time and get a speed score. Best for: Identifying performance bottlenecks.

## 3. Mobile-Friendly Test
Check viewport, responsive design, and mobile usability. Best for: Mobile SEO optimization.

## 4. Keyword Density Analyzer
Analyze word count and top keywords. Best for: Content optimization.

## 5. SSL Checker
Verify HTTPS status and SSL certificate validity. Best for: Security audit.

## 6. Schema Validator
Check JSON-LD structured data and Open Graph tags. Best for: Rich snippet optimization.

## 7. Robots.txt Checker
Analyze robots.txt directives and meta robots tags. Best for: Crawl optimization.

## 8. Heading Structure Analyzer
Check H1-H6 hierarchy and heading quality. Best for: Content structure audit.

All tools are available at /tools — no login required.`,
  },
  {
    id: "google-business-profile",
    title: "Google Business Profile Audits",
    category: "Local SEO",
    summary: "How to optimize your Google Business Profile for local search visibility.",
    content: `Your Google Business Profile (GBP) is critical for local SEO. Goodly audits your profile for:

## What We Check
- **Profile completeness**: Photos, hours, services, description
- **Review management**: Review count, rating, response rate
- **Post frequency**: How often you post updates
- **Category accuracy**: Are you in the right categories?
- **NAP consistency**: Name, Address, Phone across the web

## Why It Matters
- 46% of all Google searches have local intent
- Businesses with complete profiles are 2.7x more likely to be considered reputable
- Profiles with photos get 42% more direction requests

## Quick Wins
1. Add 10+ high-quality photos
2. Respond to every review (positive and negative)
3. Post weekly updates
4. Verify your hours are accurate
5. Add all relevant service categories`,
  },
  {
    id: "referral-program",
    title: "Referral Program",
    category: "Billing",
    summary: "Share Goodly with other businesses — rewards are rolling out soon.",
    content: `Share Goodly with other business owners you know.

## How It Works
1. Go to Refer & Earn in the sidebar
2. Copy your referral link
3. Share it with other business owners — they get a free audit with no signup

## Rewards
Automated referral credits and a tracking dashboard are rolling out soon.
Early sharers will be credited for qualifying referrals once tracking launches.

You can also invite friends by email from the Refer & Earn page today.`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Common Issues",
    category: "Support",
    summary: "Solutions for common problems: audit failures, login issues, and billing questions.",
    content: `## Audit Fails to Complete
- Check that your website is accessible (not behind a firewall)
- Ensure the URL starts with https://
- Try again — some sites have temporary blocks
- Contact support if it fails 3+ times

## Can't Log In
- Check your email for the verification link
- Use "Forgot Password" to reset
- Try Google Sign-In if you used it to register
- Clear browser cache and cookies

## Billing Issues
- Update your payment method in Billing → Customer Portal
- Check that your card hasn't expired
- Contact support for plan changes or refunds

## Score Seems Wrong
- Scores are relative to industry benchmarks
- Run a competitor comparison to see context
- Check that your site is publicly accessible
- Some checks require JavaScript rendering

## Still Stuck?
Use the support widget (bottom-right corner) or email hello@searchgoodly.com.`,
  },
];

const categories = ["All", ...new Set(articles.map((a) => a.category))];

export default function KnowledgeBase() {
  usePageMeta({ title: "Help Center — Goodly", description: "Guides, tutorials, and answers to common questions about Goodly SEO tools." });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(null);

  const filtered = articles.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || a.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A201A", marginBottom: 8 }}>
          Help Center
        </h1>
        <p style={{ fontSize: 16, color: "#6B7280" }}>
          Everything you need to get the most out of Goodly
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24, maxWidth: 500, margin: "0 auto 32px" }}>
        <Search
          size={18}
          style={{ position: "absolute", left: 14, top: 14, color: "#9CA3AF" }}
        />
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px 12px 42px",
            borderRadius: 12,
            border: "1px solid #E5E0D8",
            fontSize: 15,
            background: "#FDFBF7",
            color: "#1A201A",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: category === cat ? "2px solid #2D3E32" : "1px solid #E5E0D8",
              background: category === cat ? "#2D3E32" : "#FDFBF7",
              color: category === cat ? "#FDFBF7" : "#374151",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: category === cat ? 600 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
            No articles found. Try a different search.
          </div>
        ) : (
          filtered.map((article) => (
            <div
              key={article.id}
              style={{
                padding: 20,
                background: "#FDFBF7",
                borderRadius: 12,
                border: "1px solid #E5E0D8",
                cursor: "pointer",
              }}
              onClick={() => setExpanded(expanded === article.id ? null : article.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <BookOpen size={16} style={{ color: "#2D3E32" }} />
                    <span style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {article.category}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1A201A", margin: "4px 0" }}>
                    {article.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>{article.summary}</p>
                </div>
                <ChevronRight
                  size={20}
                  style={{
                    color: "#9CA3AF",
                    transform: expanded === article.id ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
              </div>

              {expanded === article.id && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 20,
                    background: "#F9FAFB",
                    borderRadius: 8,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {article.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still need help */}
      <div style={{ textAlign: "center", marginTop: 48, padding: 32, background: "#FDFBF7", borderRadius: 16, border: "1px solid #E5E0D8" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1A201A", marginBottom: 8 }}>
          Still need help?
        </h3>
        <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 16 }}>
          Our support team is here for you. We typically respond within 2 hours.
        </p>
        <Link
          to="mailto:hello@searchgoodly.com"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#2D3E32",
            color: "#FDFBF7",
            borderRadius: 10,
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
