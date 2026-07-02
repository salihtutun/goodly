import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import { ArrowRight, ArrowLeft, Calendar, Clock } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const POSTS = {
  "seo-mistakes-small-businesses-make": {
    title: "10 SEO Mistakes Small Businesses Make (And How to Fix Them)",
    date: "June 28, 2025",
    readTime: "6 min read",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    content: `Most small business websites are nearly invisible to Google. Not because they're bad businesses — but because of simple, fixable mistakes.

Here are the 10 most common SEO mistakes we see, and exactly how to fix each one.

**1. Missing Meta Descriptions**

Your meta description is the text that appears under your link on Google. Without one, Google pulls random text from your page — often not the message you want.

Fix: Add a 120-160 character description that tells people what your page is about and why they should click.

**2. No H1 Heading**

Every page needs exactly one H1 heading. It tells Google what the page is about. Many small business sites either have no H1 or multiple H1s.

Fix: Add one clear, descriptive H1 to each page.

**3. Images Without Alt Text**

Google can't "see" images. Alt text tells Google what's in the image — and helps with accessibility.

Fix: Add short, descriptive alt text to every image on your site.

**4. Slow Page Speed**

If your page takes more than 3 seconds to load, over 50% of mobile visitors leave. Google penalizes slow sites.

Fix: Compress images, enable browser caching, and consider a CDN.

**5. Not Mobile-Friendly**

Over 60% of searches happen on mobile. If your site isn't mobile-friendly, you're losing customers.

Fix: Add a viewport meta tag and test your site on mobile devices.

**6. No HTTPS**

Google marks non-HTTPS sites as "Not Secure." This hurts both rankings and trust.

Fix: Install an SSL certificate and force HTTPS.

**7. Thin Content**

Pages with fewer than 300 words are considered "thin content" by Google. They rarely rank well.

Fix: Expand your pages with helpful, original content. Aim for 600+ words.

**8. No Google Business Profile**

For local businesses, Google Business Profile is essential. Without it, you won't appear in local search results or Google Maps.

Fix: Create and optimize your Google Business Profile listing.

**9. Ignoring Social Media**

Social signals don't directly affect rankings, but social profiles often rank for your brand name. Active profiles build trust.

Fix: Audit your Instagram, Facebook, and other social profiles.

**10. Not Tracking Results**

You can't improve what you don't measure. Without tracking, you're guessing.

Fix: Run regular SEO audits and track your keyword rankings over time.

---

**The good news?** All of these are fixable. Most take less than an hour. Run a free audit on Goodly to see exactly which issues your site has — and get a step-by-step plan to fix them.`,
  },
  "how-to-rank-number-one-google": {
    title: "How to Rank #1 on Google in 2025: The Complete Guide",
    date: "June 25, 2025",
    readTime: "8 min read",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    content: `Ranking #1 on Google isn't about tricks or hacks. It's about giving Google exactly what it wants: the best answer to the searcher's question.

Here's what actually works in 2025.

**1. Start with On-Page SEO**

Before anything else, make sure your pages are technically sound. This means:
- Proper title tags (50-60 characters)
- Compelling meta descriptions (120-160 characters)
- One clear H1 per page
- Alt text on all images
- Fast page speed (under 2 seconds)
- Mobile-friendly design
- HTTPS security

**2. Create Great Content**

Google's algorithm is smarter than ever. It can tell the difference between thin, AI-generated content and genuinely helpful information.

Write content that:
- Answers real questions your customers have
- Is at least 600 words (longer for competitive topics)
- Includes relevant keywords naturally
- Is updated regularly

**3. Build Quality Backlinks**

Backlinks are still one of the strongest ranking signals. But quality matters more than quantity.

Focus on:
- Getting listed in relevant local directories
- Earning links from industry publications
- Creating content worth linking to
- Avoiding spammy link schemes

**4. Optimize for Local Search**

If you're a local business, local SEO is your superpower:
- Claim and optimize your Google Business Profile
- Get reviews from happy customers
- Ensure your NAP (name, address, phone) is consistent everywhere
- Use local keywords ("best pizza in Portland")

**5. Track Your Progress**

Use tools to monitor:
- Your keyword rankings over time
- Your competitors' rankings
- New issues that appear on your site
- Traffic and conversion changes

The businesses that win are the ones that keep improving. Run regular audits, fix issues as they appear, and watch your rankings climb.`,
  },
  "instagram-for-small-business": {
    title: "Instagram for Small Business: Complete Guide to Getting Customers",
    date: "June 22, 2025",
    readTime: "7 min read",
    category: "Social Media",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    content: `Instagram isn't just for influencers and big brands. Local businesses are using it to fill appointment books, sell out inventory, and build loyal communities.

Here's how to make Instagram work for your small business.

**1. Optimize Your Bio**

Your bio is the first thing people see. Make it count:
- Clear description of what you do
- Location (so local customers can find you)
- A link to your website or booking page
- A call-to-action ("Book now," "Shop our collection")

**2. Post Consistently**

You don't need to post every day. But you do need to be consistent:
- 3-5 posts per week is plenty
- Use Stories daily to stay top-of-mind
- Reels get the most reach — use them

**3. Use the Right Hashtags**

Hashtags help new people discover you:
- Use 5-10 relevant hashtags per post
- Mix popular and niche hashtags
- Create a branded hashtag for your business
- Research what your competitors use

**4. Show Behind the Scenes**

People love seeing the real you:
- Show your workspace or kitchen
- Introduce your team
- Share customer stories
- Post before/after transformations

**5. Engage With Your Community**

Instagram rewards engagement:
- Reply to every comment
- Respond to DMs quickly
- Engage with other local businesses
- Share user-generated content

**6. Track What Works**

Use Instagram Insights to see:
- Which posts get the most engagement
- When your audience is most active
- What content drives profile visits
- Which hashtags bring the most reach

Instagram is a powerful tool for small businesses. Start with these basics, stay consistent, and watch your community grow.`,
  },
  "google-business-profile-guide": {
    title: "What Is Google Business Profile and Why Every Local Business Needs One",
    date: "June 20, 2025",
    readTime: "5 min read",
    category: "Local SEO",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    content: `When someone searches "best pizza near me" or "emergency plumber," Google shows a map with 3 businesses. That's the "local 3-pack" — and 76% of people who do a local search visit a business within 24 hours.

If your business isn't in that 3-pack, you're invisible to most local customers.

**What Is Google Business Profile?**

It's a free listing that appears when people search for your business or businesses like yours on Google Search and Maps. It includes:
- Your business name, address, and phone number
- Hours of operation
- Photos of your business
- Customer reviews
- Posts and updates
- Q&A section

**Why It Matters**

- 76% of local searches result in a visit within 24 hours
- 28% of local searches result in a purchase
- Businesses with complete profiles are 2.7x more likely to be considered reputable
- Businesses with photos get 42% more direction requests

**How to Optimize Your Profile**

1. Claim and verify your listing
2. Fill out every section completely
3. Add high-quality photos (at least 10)
4. Respond to all reviews — good and bad
5. Post updates regularly (offers, events, news)
6. Keep your hours accurate (especially holidays)
7. Use the Q&A section to answer common questions

**Common Mistakes**

- Inconsistent NAP (name, address, phone) across the web
- Not responding to negative reviews
- Using the wrong business category
- Letting the profile go stale
- Not adding photos

A well-optimized Google Business Profile is the easiest way to get more local customers. It's free, it takes an afternoon to set up, and it pays dividends for years.`,
  },
  "ai-visibility-small-business": {
    title: "Is Your Business Visible to ChatGPT and Siri? Why AI Visibility Matters",
    date: "June 18, 2025",
    readTime: "6 min read",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    content: `When someone asks ChatGPT "what's the best Italian restaurant in Austin?" or Siri "find a plumber near me," does your business get mentioned?

If not, you're missing a growing channel. 1 in 4 local searches now happen through AI assistants.

**How AI Search Works**

AI assistants don't "search" the web the same way Google does. They:
- Pull from their training data (which may be months old)
- Reference structured data and business listings
- Consider reviews, ratings, and online presence
- Synthesize information from multiple sources

**How to Get Mentioned by AI**

1. **Have a strong Google Business Profile** — AI assistants often pull from Google's database
2. **Get listed in major directories** — Yelp, TripAdvisor, industry-specific directories
3. **Build a strong review profile** — AI considers ratings and review volume
4. **Use structured data on your website** — Schema.org markup helps AI understand your business
5. **Maintain consistent information everywhere** — AI cross-references multiple sources
6. **Create content that answers questions** — AI pulls from helpful, authoritative content

**Check Your AI Visibility**

Run an AI visibility audit to see:
- Whether ChatGPT mentions your business
- What information AI has about you
- How you compare to competitors in AI results
- What you can do to improve

AI search is only going to grow. The businesses that optimize for it now will have a head start.`,
  },
  "page-speed-seo-ranking": {
    title: "Why Page Speed Is a Ranking Factor (And How to Fix Yours)",
    date: "June 15, 2025",
    readTime: "5 min read",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    content: `Google has confirmed that page speed is a ranking factor. But it's not just about rankings — slow pages cost you customers.

**The Numbers**

- 53% of mobile visitors leave a page that takes more than 3 seconds to load
- A 1-second delay reduces conversions by 7%
- A 2-second delay increases bounce rate by 103%
- Google's recommended load time: under 2.5 seconds

**What Slows Down Your Site**

1. **Large images** — The #1 cause of slow pages. Uncompressed photos can be 5-10MB each.
2. **Too many scripts** — Every plugin, tracker, and widget adds load time.
3. **No caching** — Without caching, your server rebuilds every page for every visitor.
4. **Slow hosting** — Cheap shared hosting can't handle traffic spikes.
5. **No CDN** — Without a content delivery network, visitors far from your server wait longer.

**How to Fix It**

1. **Compress your images** — Use WebP format, resize to actual display size
2. **Enable browser caching** — Set cache headers so returning visitors load instantly
3. **Minify CSS and JavaScript** — Remove unnecessary characters from code
4. **Use a CDN** — Cloudflare has a generous free tier
5. **Upgrade your hosting** — If you're on $5/month shared hosting, it's time to move up

**Test Your Speed**

Use our free page speed checker at /tools/page-speed to see how fast your site loads and get specific recommendations.`,
  },
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = POSTS[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-[#1A201A] mb-2">Post not found</h1>
          <Link to="/blog" className="text-[#81B29A] hover:underline">← Back to blog</Link>
        </div>
      </div>
    );
  }

  usePageMeta({ title: post.title, description: post.content.substring(0, 160) });

  // Parse markdown-style content to HTML
  const renderContent = (text) => {
    return text
      .split("\n\n")
      .map((block, i) => {
        if (block.startsWith("**") && block.includes("**")) {
          // Bold heading
          const cleaned = block.replace(/\*\*/g, "");
          return `<h2 class="font-display font-bold text-xl text-[#1A201A] mt-8 mb-3">${cleaned}</h2>`;
        }
        if (block.startsWith("- ")) {
          const items = block.split("\n").filter(l => l.startsWith("- "));
          return `<ul class="space-y-2 my-4">${items.map(item => `<li class="flex items-start gap-2 text-[#5C685C]"><span class="text-[#81B29A] mt-1">•</span> ${item.replace("- ", "")}</li>`).join("")}</ul>`;
        }
        if (block.startsWith("1. ")) {
          const items = block.split("\n").filter(l => /^\d+\./.test(l));
          return `<ol class="space-y-3 my-4 list-decimal list-inside text-[#5C685C]">${items.map(item => `<li class="pl-1"><span class="font-medium text-[#1A201A]">${item.replace(/^\d+\.\s*/, "")}</span></li>`).join("")}</ol>`;
        }
        if (block === "---") return '<hr class="my-8 border-[#E5E0D8]" />';
        return `<p class="text-[#5C685C] leading-relaxed mb-4">${block}</p>`;
      })
      .join("");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/register" className="text-sm bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5 py-2.5">Get free audit →</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-[#81B29A] hover:text-[#5C9A7A] mb-6">
          <ArrowLeft size={14} /> Back to blog
        </Link>

        <div className="flex items-center gap-3 text-xs text-[#9CA89C] mb-4">
          <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
          <span className="bg-[#F3F0E9] text-[#5C685C] px-2 py-0.5 rounded-full">{post.category}</span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#1A201A] leading-tight mb-6">
          {post.title}
        </h1>

        <img
          src={post.image}
          alt={post.title}
          className="w-full rounded-2xl mb-8 aspect-[2/1] object-cover"
        />

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
          <h3 className="font-display font-bold text-xl mb-2">See how your site scores</h3>
          <p className="text-white/80 mb-5 text-sm">Get a free SEO audit in 30 seconds. No signup needed.</p>
          <Link to="/register" className="inline-block bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-6 py-3 font-medium">
            Get free audit <ArrowRight size={16} className="inline ml-1" />
          </Link>
        </div>
      </article>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#5C685C]">
          © {new Date().getFullYear()} Goodly. Helping small businesses get found.
        </div>
      </footer>
    </div>
  );
}
