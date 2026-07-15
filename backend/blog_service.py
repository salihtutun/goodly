"""Blog CMS service for Goodly.

Stores blog posts in MongoDB with support for:
- CRUD operations
- Published/draft status
- Slug-based URLs
- Categories and tags
- Author attribution
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List

logger = logging.getLogger("blog_service")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://searchgoodly.com")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_post(db, *, title: str, slug: str, excerpt: str, content: str,
                       author: str = "Goodly Team", category: str = "SEO",
                       tags: Optional[List[str]] = None,
                       image_url: Optional[str] = None,
                       published: bool = True) -> dict:
    """Create a new blog post."""
    # Check slug uniqueness
    existing = await db.blog_posts.find_one({"slug": slug})
    if existing:
        raise ValueError(f"Slug '{slug}' already exists")

    post = {
        "id": str(uuid.uuid4()),
        "title": title,
        "slug": slug,
        "excerpt": excerpt,
        "content": content,
        "author": author,
        "category": category,
        "tags": tags or [],
        "image_url": image_url,
        "published": published,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    await db.blog_posts.insert_one(post)
    return post


async def get_post(db, slug: str) -> Optional[dict]:
    """Get a single blog post by slug."""
    return await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})


async def get_post_by_id(db, post_id: str) -> Optional[dict]:
    """Get a single blog post by ID (includes drafts)."""
    return await db.blog_posts.find_one({"id": post_id}, {"_id": 0})


async def list_posts(db, *, category: Optional[str] = None,
                     tag: Optional[str] = None,
                     published_only: bool = True,
                     limit: int = 20, offset: int = 0) -> dict:
    """List blog posts with optional filtering."""
    query = {}
    if published_only:
        query["published"] = True
    if category:
        query["category"] = category
    if tag:
        query["tags"] = tag

    total = await db.blog_posts.count_documents(query)
    cursor = db.blog_posts.find(query, {"_id": 0, "content": 0}).sort("created_at", -1).skip(offset).limit(limit)
    posts = await cursor.to_list(limit)

    return {"posts": posts, "total": total, "limit": limit, "offset": offset}


async def update_post(db, post_id: str, **updates) -> Optional[dict]:
    """Update a blog post."""
    updates["updated_at"] = _now_iso()
    result = await db.blog_posts.update_one(
        {"id": post_id},
        {"$set": updates},
    )
    if result.matched_count == 0:
        return None
    return await db.blog_posts.find_one({"id": post_id}, {"_id": 0})


async def delete_post(db, post_id: str) -> bool:
    """Delete a blog post."""
    result = await db.blog_posts.delete_one({"id": post_id})
    return result.deleted_count > 0


async def get_categories(db) -> List[str]:
    """Get all unique categories."""
    pipeline = [
        {"$match": {"published": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    rows = await db.blog_posts.aggregate(pipeline).to_list(20)
    return [{"name": r["_id"], "count": r["count"]} for r in rows]


async def seed_default_posts(db) -> int:
    """Seed the blog with default posts. Skips posts whose slugs already exist. Returns number of posts created."""
    existing_slugs = set()
    async for doc in db.blog_posts.find({}, {"slug": 1}):
        existing_slugs.add(doc["slug"])

    audit_url = f"{FRONTEND_URL}/audit"

    defaults = [
        {
            "title": "How to Get Found on Google Maps: A Small Business Guide",
            "slug": "google-maps-small-business-guide",
            "excerpt": "76% of local searches result in a visit within 24 hours. Here's how to make sure your business shows up when customers are looking.",
            "content": f"""## Why Google Maps Matters for Small Business

When someone searches "best pizza near me" or "plumber in Austin," Google Maps is often the first thing they see. The "local 3-pack" — the top 3 business listings that appear with a map — gets the majority of clicks.

### The Numbers

- 76% of people who search for something nearby visit a business within 24 hours
- 28% of those searches result in a purchase
- 46% of all Google searches are looking for local information

### 5 Steps to Get Found on Google Maps

**1. Claim and verify your Google Business Profile.** This is step one. Go to google.com/business and claim your listing. Google will mail you a postcard with a verification code.

**2. Fill out every field.** Businesses with complete profiles are 2.7x more likely to be considered reputable. Add your hours, phone number, website, services, and photos.

**3. Get reviews — and respond to them.** Businesses with 40+ reviews earn 3x more clicks. Ask happy customers to leave a review. Always respond — even to negative ones.

**4. Add photos regularly.** Listings with photos get 42% more requests for directions and 35% more clicks to websites. Add new photos at least once a month.

**5. Keep your information consistent.** Your business name, address, and phone number (NAP) should be identical everywhere — your website, Google, Yelp, Facebook, and any directories.

### How Goodly Helps

Our Google Business Profile audit scans your listing for missing information, checks your review response rate, and compares you to competitors in your area. Run a free audit at {audit_url}.""",
            "author": "Goodly Team",
            "category": "Local SEO",
            "tags": ["google maps", "local seo", "small business", "gbp"],
            "image_url": "https://images.unsplash.com/photo-1559827291-b9c5e0e5b9f5?w=800",
            "published": True,
        },
        {
            "title": "Why Your Website Isn't Showing Up on Google (And How to Fix It)",
            "slug": "website-not-showing-on-google",
            "excerpt": "You have a website. You know customers are searching. But you're nowhere to be found. Here are the 6 most common reasons — and exactly how to fix each one.",
            "content": f"""## The Frustration Is Real

You built a website. You're proud of it. But when you search for your business on Google, you're on page 5 — or worse, nowhere at all. Here's why.

### 6 Reasons Your Website Is Invisible

**1. Your meta tags are missing or wrong.** The title tag and meta description are what Google shows in search results. If they're missing, Google guesses — and usually guesses wrong. Every page needs a unique, keyword-rich title (50-60 characters) and description (150-160 characters).

**2. Your site isn't mobile-friendly.** Google uses mobile-first indexing. If your site doesn't work well on phones, you won't rank. Test yours at search.google.com/test/mobile-friendly.

**3. Your pages load too slowly.** Google's target is under 2.5 seconds. The average small business website takes 5+ seconds. Every second of delay costs you rankings and customers.

**4. You have thin or duplicate content.** Pages with fewer than 300 words of original content struggle to rank. Google wants to see that you're a real authority on your topic.

**5. You're missing basic technical SEO.** No SSL certificate, no sitemap, broken links, missing robots.txt — these are table stakes. Without them, Google can't properly crawl and index your site.

**6. You haven't built any authority.** Backlinks from other reputable websites are still one of Google's top ranking factors. If nobody links to you, Google assumes you're not important.

### The Fix

Run a free audit at {audit_url}. We'll scan your site for all 6 of these issues (and 50+ more) and give you a plain-English list of exactly what to fix — in priority order.""",
            "author": "Goodly Team",
            "category": "SEO Basics",
            "tags": ["seo", "google ranking", "website optimization", "beginners"],
            "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
            "published": True,
        },
        {
            "title": "Local SEO in 2026: What Small Businesses Need to Know",
            "slug": "local-seo-2026",
            "excerpt": "AI search, voice queries, and zero-click results are changing how customers find local businesses. Here's what's new and what still works.",
            "content": f"""## Local SEO Is Changing Fast

The way customers find local businesses has changed dramatically. AI assistants like ChatGPT and Siri now influence 1 in 4 local searches. Voice search is growing 40% year over year. And Google's "zero-click" results mean customers often get answers without ever visiting a website.

### What's New in 2026

**AI search is real.** When someone asks ChatGPT "who's the best plumber in Austin," the AI looks at reviews, website content, and business listings to decide who to recommend. If your business isn't mentioned online, AI won't find you.

**Voice search is mainstream.** "Hey Siri, find a coffee shop near me" — these queries are longer, more conversational, and often have high purchase intent. Optimize for natural language questions.

**Google's local pack is more competitive.** The 3-pack now includes more information — review sentiment, popular times, services offered. Standing out requires a complete, active profile.

### What Still Works

**Reviews are still king.** The number and quality of your reviews is the #1 local ranking factor. Aim for 30+ reviews with an average of 4.0+ stars.

**NAP consistency matters.** Your Name, Address, and Phone number must be identical everywhere. Even small differences (like "St." vs "Street") can hurt your rankings.

**Content still wins.** Businesses that blog get 55% more website visitors and 67% more leads. Write about what your customers are searching for.

### How to Stay Ahead

1. Claim and optimize your Google Business Profile
2. Get reviews consistently — ask every happy customer
3. Create content that answers customer questions
4. Make sure your website is fast and mobile-friendly
5. Monitor your AI visibility — are you showing up in ChatGPT?

Run a free audit at {audit_url} to see where you stand.""",
            "author": "Goodly Team",
            "category": "Local SEO",
            "tags": ["local seo", "2026 trends", "ai search", "voice search"],
            "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
            "published": True,
        },
        {
            "title": "What's the ROI of SEO? A Small Business Calculator",
            "slug": "seo-roi-calculator",
            "excerpt": "Is SEO worth it for a small business? We break down the real numbers — what you can expect to spend, how long it takes, and what the return looks like.",
            "content": f"""## The Question Every Business Owner Asks

"I'm spending money on my website. Is SEO actually going to bring me more customers?"

The short answer: yes. But let's look at the real numbers.

### The Math of SEO

Let's say you're a plumber in a mid-sized city. Here's what the numbers look like:

- **Monthly searches for "plumber [your city]":** 1,000-3,000
- **Click-through rate for position #1:** 28.5%
- **Click-through rate for position #10:** 2.5%
- **Average conversion rate (home services):** 3.5%
- **Average customer value (plumber):** $600

**If you're on page 1, position 1:**
- 2,000 searches × 28.5% CTR = 570 clicks/month
- 570 clicks × 3.5% conversion = 20 new customers/month
- 20 customers × $600 = **$12,000/month in new revenue**

**If you're on page 1, position 10:**
- 2,000 searches × 2.5% CTR = 50 clicks/month
- 50 clicks × 3.5% conversion = 1.75 new customers/month
- 1.75 customers × $600 = **$1,050/month in new revenue**

The difference between position #1 and #10? **$10,950/month.**

### How Long Does It Take?

- **Month 1-2:** Fix technical issues, optimize on-page SEO. You'll see small improvements.
- **Month 3-4:** Content starts ranking. Traffic increases 20-40%.
- **Month 6-12:** Authority builds. You're competing for top positions.

Most businesses see meaningful results within 3-6 months.

### What Does It Cost?

- **DIY with Goodly Free:** $0/month. Run audits, follow the action plan.
- **Goodly Starter:** $49/month. Weekly re-audits, keyword tracking, PDF reports.
- **Goodly Pro:** $149/month. Daily tracking, competitor analysis, all features.
- **Goodly Concierge:** $1,000/month. We do everything for you.

Even at the Concierge level, if SEO brings you just 2 new customers per month at $600 each, you're already profitable.

### The Bottom Line

SEO has the highest ROI of any marketing channel for local businesses. It's not instant — but once you're ranking, the leads keep coming without ongoing ad spend.

Run a free audit at {audit_url} to see your starting point and estimated revenue opportunity.""",
            "author": "Goodly Team",
            "category": "SEO Basics",
            "tags": ["seo roi", "small business", "calculator", "marketing"],
            "image_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
            "published": True,
        },
        {
            "title": "Instagram for Small Business: Complete Guide to Getting Customers",
            "slug": "instagram-for-small-business-guide",
            "excerpt": "Instagram isn't just for influencers. Learn how local businesses are using Instagram to fill their appointment books and sell out inventory.",
            "content": f"""## Instagram Is a Customer Engine

With 2 billion monthly active users, Instagram is the #1 platform for visual businesses. Restaurants, salons, retail shops, and home services are all finding customers here.

### Why Instagram Works for Local Business

- 90% of Instagram users follow at least one business
- 50% of users are more interested in a brand after seeing it on Instagram
- 70% of shoppers turn to Instagram for product discovery

### 5 Steps to Turn Followers Into Customers

**1. Optimize your bio.** Your bio is the only place you can put a clickable link. Use it wisely. Include: what you do, where you are, and a link to your website or booking page.

**2. Post consistently.** Aim for 3-5 posts per week. Mix product photos, behind-the-scenes content, customer testimonials, and educational content.

**3. Use local hashtags.** Don't just use #smallbusiness — use #AustinEats, #PortlandSalon, #DenverPlumber. Local hashtags help you get discovered by people in your area.

**4. Engage with your community.** Reply to comments, like posts from local accounts, and engage with your followers' content. Instagram rewards engagement.

**5. Use Stories and Reels.** Reels get 2x more reach than regular posts. Stories keep you top-of-mind. Post 2-3 Stories per day and 1-2 Reels per week.

### How Goodly Helps

Our social media audit scans your Instagram profile, analyzes your hashtag strategy, and gives you AI-powered suggestions for better captions and engagement. Run a free audit at {audit_url}.""",
            "author": "Goodly Team",
            "category": "Social Media",
            "tags": ["instagram", "social media", "small business", "marketing"],
            "image_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
            "published": True,
        },
        {
            "title": "Mobile-Friendly Websites: Why Google Cares and How to Fix Yours",
            "slug": "mobile-friendly-website-guide",
            "excerpt": "60% of searches are on mobile. If your site isn't mobile-friendly, Google won't rank it. Here's how to check and fix yours in an afternoon.",
            "content": f"""## Mobile Is Everything

Google switched to mobile-first indexing in 2020. That means Google primarily uses the mobile version of your site for ranking. If your site doesn't work on phones, you're invisible.

### The Numbers

- 63% of Google searches happen on mobile devices
- 53% of mobile users leave a site that takes more than 3 seconds to load
- Mobile-friendly sites see 32% higher conversion rates

### 5 Common Mobile Problems

**1. Text too small to read.** Users shouldn't have to pinch-zoom to read your content. Use at least 16px for body text.

**2. Clickable elements too close together.** Buttons and links should be at least 48px apart. Nothing frustrates mobile users more than tapping the wrong thing.

**3. Content wider than screen.** Horizontal scrolling on mobile is a major red flag. Use responsive design that adapts to any screen size.

**4. Slow load times.** Compress images, minimize code, and use a fast hosting provider. Every second of delay costs you 7% of conversions.

**5. Pop-ups that block the screen.** Google penalizes intrusive interstitials on mobile. If your pop-up covers the content, you'll lose rankings.

### How to Check

Run a free audit at {audit_url}. We'll test your site on mobile and tell you exactly what to fix.""",
            "author": "Goodly Team",
            "category": "SEO Basics",
            "tags": ["mobile", "responsive", "website speed", "google ranking"],
            "image_url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
            "published": True,
        },
        {
            "title": "Google Business Profile: The Complete Setup Guide for 2026",
            "slug": "google-business-profile-setup-2026",
            "excerpt": "Your Google Business Profile is your most powerful free marketing tool. Here's how to set it up, optimize every field, and start getting more calls.",
            "content": f"""## Your Free 24/7 Salesperson

Your Google Business Profile (formerly Google My Business) is the listing that appears when someone searches for your business or services in your area. It's free, it works 24/7, and it's often the first thing customers see.

### Step-by-Step Setup

**1. Claim your profile.** Go to google.com/business and search for your business. If it exists, claim it. If not, create it. Google will mail a verification postcard.

**2. Fill out every single field.** Business name, category, address, phone, website, hours, services, service area, attributes (wheelchair accessible, women-led, etc.). Complete profiles get 7x more clicks.

**3. Add photos — lots of them.** Businesses with 100+ photos get 520% more calls. Add your logo, cover photo, interior, exterior, team, and product/service photos.

**4. Write a compelling description.** Your 750-character "from the business" description should explain what you do, who you serve, and why you're the best choice.

**5. Post weekly updates.** Google Posts appear in your listing and in search results. Share offers, events, new products, and blog posts.

**6. Get and respond to reviews.** This is the #1 ranking factor. Ask every happy customer. Respond to every review — positive and negative.

### Common Mistakes

- Using a P.O. box instead of a physical address
- Choosing the wrong business category
- Letting your hours become outdated
- Ignoring customer questions in the Q&A section
- Not posting regularly

Run a free audit at {audit_url} to see how your profile scores.""",
            "author": "Goodly Team",
            "category": "Local SEO",
            "tags": ["google business profile", "gbp", "local seo", "setup guide"],
            "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
            "published": True,
        },
        {
            "title": "How to Get More Google Reviews (Without Being Pushy)",
            "slug": "get-more-google-reviews",
            "excerpt": "Reviews are the #1 local SEO ranking factor. Here's how to get more of them — ethically, consistently, and without annoying your customers.",
            "content": f"""## Reviews Drive Rankings and Revenue

Businesses with 40+ Google reviews get 3x more clicks and rank significantly higher in local search. But asking for reviews feels awkward. Here's how to do it right.

### Why Reviews Matter

- #1 local SEO ranking factor
- 93% of consumers read reviews before buying
- Businesses with 4.5+ stars get 28% more clicks
- Each star increase = 5-9% revenue increase

### 5 Ways to Get More Reviews

**1. Ask at the right moment.** The best time to ask is right after a positive interaction — when the customer is happiest. For restaurants, that's after a great meal. For service businesses, that's after a job well done.

**2. Make it easy.** Create a Google review link (find it in your Google Business Profile dashboard) and send it via text or email. One click and they're reviewing.

**3. Train your team.** Every employee who interacts with customers should know how to ask for reviews. Role-play it. Make it part of your process.

**4. Follow up.** Send a thank-you email after a purchase or service. Include your review link and a simple ask: "Loved your experience? Leave us a review — it helps other customers find us."

**5. Respond to every review.** Thank people for positive reviews. Address negative reviews professionally. This shows you care and encourages others to leave reviews too.

### What NOT to Do

- Don't offer incentives (Google prohibits this)
- Don't ask for only 5-star reviews
- Don't create fake reviews
- Don't pressure customers

Run a free audit at {audit_url} to see your current review score and get personalized recommendations.""",
            "author": "Goodly Team",
            "category": "Local SEO",
            "tags": ["reviews", "google reviews", "reputation", "local seo"],
            "image_url": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800",
            "published": True,
        },
        {
            "title": "AI Search Optimization: Will ChatGPT Recommend Your Business?",
            "slug": "ai-search-optimization-small-business",
            "excerpt": "1 in 4 local searches now happen through AI assistants. If ChatGPT and Siri don't know about your business, you're invisible to a growing audience.",
            "content": f"""## The Rise of AI Search

When someone asks ChatGPT "what's the best Italian restaurant in Brooklyn" or Siri "find a plumber near me," the AI looks at your online presence and decides whether to recommend you. This is AI visibility — and it's becoming as important as Google rankings.

### How AI Chooses Who to Recommend

AI assistants look at:
- Your website content (is it clear what you do?)
- Your Google Business Profile (is it complete?)
- Your reviews (how many, how good?)
- Your online mentions (are you talked about?)
- Your structured data (can AI understand your site?)

### 5 Steps to Improve AI Visibility

**1. Make your website crystal clear.** AI needs to understand exactly what you do, where you are, and who you serve. Use clear language, not marketing fluff.

**2. Complete your Google Business Profile.** This is the #1 data source for AI assistants. Every field filled out, photos added, reviews responded to.

**3. Get mentioned online.** Local news sites, industry directories, chamber of commerce listings, and partner websites all help AI discover and trust your business.

**4. Add structured data.** JSON-LD schema markup helps AI understand your business type, location, hours, services, and reviews.

**5. Monitor your AI presence.** Search for your business on ChatGPT, Perplexity, and other AI tools. See what they say. If they don't mention you, you have work to do.

### The Opportunity

AI search is still new. Most small businesses haven't optimized for it. The businesses that act now will have a massive advantage as AI search continues to grow.

Run a free audit at {audit_url} to check your AI visibility score.""",
            "author": "Goodly Team",
            "category": "AI",
            "tags": ["ai search", "chatgpt", "ai visibility", "future of seo"],
            "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
            "published": True,
        },
        {
            "title": "Content Marketing for Small Business: What to Write and Why",
            "slug": "content-marketing-small-business",
            "excerpt": "Businesses that blog get 55% more visitors and 67% more leads. Here's what to write about, how often to publish, and how to make it work for your business.",
            "content": f"""## Content Marketing Works

You don't need a massive budget or a dedicated marketing team. You just need to answer the questions your customers are already asking.

### Why Content Marketing

- Businesses that blog get 55% more website visitors
- Content marketing generates 3x more leads than paid search
- 70% of consumers prefer learning about a company through articles rather than ads
- Content keeps working — a blog post from 2 years ago can still bring in customers today

### What to Write About

**1. Answer customer questions.** What do customers ask you every day? "How much does X cost?" "How long does Y take?" "What should I look for in Z?" Write posts answering these questions.

**2. Show your work.** Before/after photos, case studies, project walkthroughs. Customers love seeing real results.

**3. Local guides.** "Best coffee shops in [neighborhood]," "Top 5 things to do in [city]," "Complete guide to [local event]." These rank well and attract local customers.

**4. How-to content.** Teach people something related to your industry. A plumber writing "How to prevent frozen pipes" positions themselves as the expert.

**5. Industry insights.** Share your take on trends, new regulations, or common misconceptions in your field.

### How Often to Publish

- **Minimum:** 1 post per month
- **Good:** 1 post per week
- **Great:** 2-3 posts per week

Consistency matters more than frequency. One great post per month beats four mediocre ones.

### How Goodly Helps

Our AI Content Studio generates SEO-optimized blog posts, social captions, and email copy in seconds. Tell us about your business and get publishable content instantly. Try it free at {FRONTEND_URL}/content-studio.""",
            "author": "Goodly Team",
            "category": "Content Marketing",
            "tags": ["content marketing", "blogging", "small business", "writing"],
            "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800",
            "published": True,
        },
        {
            "title": "Restaurant SEO: How to Get Found When People Search 'Best Food Near Me'",
            "slug": "restaurant-seo-guide",
            "excerpt": "92% of people pick a restaurant from page one of Google. Here's how to optimize your restaurant's online presence and fill every table.",
            "content": f"""## Your Restaurant Deserves Page One

When someone's hungry and searches "best Italian near me" or "restaurants open now," they pick from the top 3 results. If your restaurant isn't there, you don't exist to them.

### The Restaurant SEO Checklist

**1. Claim and optimize your Google Business Profile.** Add your menu, hours, photos, and attributes (outdoor seating, delivery, reservations). Restaurants with complete profiles get 7x more clicks.

**2. Get more reviews.** Restaurants with 40+ reviews rank significantly higher. Ask happy customers — most are willing. Respond to every review, good and bad.

**3. Post mouth-watering photos.** Businesses with 100+ photos get 520% more calls. Post new food photos weekly. Use descriptive filenames (not IMG_4829.jpg).

**4. Optimize your menu pages.** Each menu item should have its own page with descriptions, prices, and photos. This helps you rank for specific dish searches.

**5. Use local keywords.** "Best pizza in [city]," "Italian restaurant [neighborhood]," "brunch near me" — these are the searches that bring customers through your door.

### How Goodly Helps

Run a free audit at {audit_url}. We'll scan your restaurant website for 50+ signals and tell you exactly what to fix to start showing up on page one.""",
            "author": "Goodly Team",
            "category": "Industry Guides",
            "tags": ["restaurant seo", "local seo", "google business profile", "restaurant marketing"],
            "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
            "published": True,
        },
        {
            "title": "Plumber Marketing: How to Be the First Call When a Pipe Bursts",
            "slug": "plumber-marketing-guide",
            "excerpt": "Emergency calls go to whoever ranks #1. Here's how to optimize your plumbing business for Google, Google Maps, and local search.",
            "content": f"""## Be the Plumber People Find in an Emergency

When someone's basement is flooding at 2 AM, they Google "emergency plumber near me" and call whoever shows up first. If that's not you, you're losing thousands in emergency calls every month.

### The Plumber SEO Playbook

**1. Optimize for emergency keywords.** "Emergency plumber [city]," "24 hour plumber near me," "water heater repair [city]" — these are high-intent searches from people ready to pay.

**2. Complete your Google Business Profile.** Add your service area (every neighborhood you serve), emergency hours, and before/after photos of your work. Plumbers with complete profiles get 5x more calls.

**3. Get reviews from every job.** Home service businesses with 50+ reviews dominate local search. Text customers a review link right after you finish the job.

**4. Create service pages.** Dedicated pages for water heater repair, drain cleaning, sewer line replacement, and emergency services help you rank for specific searches.

**5. Track your rankings.** Monitor "plumber near me," "emergency plumber [city]," and your top 5 service keywords. Know when you move up or down.

Run a free audit at {audit_url} to see where your plumbing business stands.""",
            "author": "Goodly Team",
            "category": "Industry Guides",
            "tags": ["plumber seo", "home services", "local seo", "emergency services"],
            "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
            "published": True,
        },
        {
            "title": "Salon Marketing: How to Fill Your Chair With Clients From Instagram and Google",
            "slug": "salon-marketing-guide",
            "excerpt": "New clients search Google and Instagram before they book. Here's how to make sure your salon is the first thing they see.",
            "content": f"""## Your Salon Should Be the First Result

When someone searches "best hair salon Denver" or scrolls Instagram for style inspiration, your salon should be front and center. Here's how to make that happen.

### The Salon Marketing Playbook

**1. Optimize your Google Business Profile.** Add your services, price list, and 20+ photos of your best work. Salons with complete profiles get 40% more bookings.

**2. Master Instagram.** Post 3-5 times per week. Mix client transformations, behind-the-scenes content, product recommendations, and stylist spotlights. Use local hashtags like #DenverHair and #AustinSalon.

**3. Get more Google reviews.** Salons with 30+ reviews get 3x more calls. Ask every happy client. Make it part of your checkout process.

**4. Create service pages.** Dedicated pages for balayage, extensions, color correction, and bridal services help you rank for specific searches.

**5. Use Instagram Stories and Reels.** Reels get 2x more reach than regular posts. Share quick transformations, product demos, and client testimonials.

Run a free audit at {audit_url} to see how your salon ranks online.""",
            "author": "Goodly Team",
            "category": "Industry Guides",
            "tags": ["salon marketing", "instagram", "local seo", "beauty industry"],
            "image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
            "published": True,
        },
        {
            "title": "Dental SEO: How to Get More New Patients From Google",
            "slug": "dental-seo-guide",
            "excerpt": "77% of patients search online before booking. If your dental practice isn't on page one, you're losing patients every day.",
            "content": f"""## New Patients Are Searching for You Right Now

Every month, hundreds of people in your area search for a dentist. If your practice isn't on page one, they're booking with your competitors.

### The Dental SEO Playbook

**1. Complete your Google Business Profile.** Add your insurance list, services, office photos, and hours. Dental practices with complete profiles get 3x more new patient inquiries.

**2. Get more patient reviews.** Practices with 50+ reviews dominate local search. Send a follow-up text or email after every appointment with a direct review link.

**3. Create procedure pages.** Dedicated pages for cleanings, crowns, implants, Invisalign, and emergency dentistry help you rank for specific searches.

**4. Add before/after photos.** With proper alt text and patient consent, these images help you rank in Google Image search and build trust.

**5. Optimize for "near me" searches.** "Dentist near me," "emergency dentist [city]," "pediatric dentist [neighborhood]" — these are your money keywords.

Run a free audit at {audit_url} to see how your dental practice ranks.""",
            "author": "Goodly Team",
            "category": "Industry Guides",
            "tags": ["dental seo", "healthcare marketing", "local seo", "patient acquisition"],
            "image_url": "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800",
            "published": True,
        },
        {
            "title": "Retail Store Marketing: How to Turn Online Searches Into Foot Traffic",
            "slug": "retail-store-marketing-guide",
            "excerpt": "76% of local searches result in a store visit within 24 hours. Here's how to make sure your retail shop is the one they find.",
            "content": f"""## Turn Online Searches Into In-Store Visits

When someone searches "gift shop near me" or "boutique [city]," the top 3 results get the foot traffic. Here's how to be one of them.

### The Retail Marketing Playbook

**1. Optimize your Google Business Profile.** Add your hours, product categories, and 20+ photos of your store and products. Retail shops with photos get 42% more direction requests.

**2. Get customer reviews with photos.** Reviews with product photos are gold. Ask customers to share photos of their purchases in their reviews.

**3. Post weekly updates.** Google Posts appear in your listing and search results. Share new arrivals, sales, events, and seasonal collections.

**4. Optimize for Google Shopping.** Add product schema markup to your website. This helps your products appear in Google Shopping results with prices, availability, and reviews.

**5. Create local content.** "Best gifts in [city]," "Top 5 boutiques in [neighborhood]," "Holiday shopping guide [city]" — these attract local shoppers.

Run a free audit at {audit_url} to see how your retail store ranks online.""",
            "author": "Goodly Team",
            "category": "Industry Guides",
            "tags": ["retail marketing", "local seo", "google shopping", "foot traffic"],
            "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
            "published": True,
        },
    ]

    count = 0
    for post in defaults:
        if post["slug"] in existing_slugs:
            continue
        post["id"] = str(uuid.uuid4())
        post["created_at"] = _now_iso()
        post["updated_at"] = _now_iso()
        await db.blog_posts.insert_one(post)
        count += 1

    logger.info("Seeded %d default blog posts", count)
    return count
