import { Link } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const POSTS = [
  {
    slug: "seo-mistakes-small-businesses-make",
    title: "10 SEO Mistakes Small Businesses Make (And How to Fix Them)",
    excerpt: "Most small business websites are invisible to Google. Here are the 10 most common mistakes — and exactly how to fix each one in under an hour.",
    date: "June 28, 2025",
    readTime: "6 min read",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
  },
  {
    slug: "how-to-rank-number-one-google",
    title: "How to Rank #1 on Google in 2025: The Complete Guide",
    excerpt: "Google's algorithm changes constantly. Here's what actually works in 2025 — from on-page SEO to backlinks to AI visibility.",
    date: "June 25, 2025",
    readTime: "8 min read",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
  },
  {
    slug: "instagram-for-small-business",
    title: "Instagram for Small Business: Complete Guide to Getting Customers",
    excerpt: "Instagram isn't just for influencers. Learn how local businesses are using Instagram to fill their appointment books and sell out inventory.",
    date: "June 22, 2025",
    readTime: "7 min read",
    category: "Social Media",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
  },
  {
    slug: "google-business-profile-guide",
    title: "What Is Google Business Profile and Why Every Local Business Needs One",
    excerpt: "76% of local searches result in a visit within 24 hours. If your Google Business Profile isn't optimized, you're losing customers every day.",
    date: "June 20, 2025",
    readTime: "5 min read",
    category: "Local SEO",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
  },
  {
    slug: "ai-visibility-small-business",
    title: "Is Your Business Visible to ChatGPT and Siri? Why AI Visibility Matters",
    excerpt: "1 in 4 local searches now happen through AI assistants. If ChatGPT doesn't know about your business, you're invisible to a growing audience.",
    date: "June 18, 2025",
    readTime: "6 min read",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
  },
  {
    slug: "page-speed-seo-ranking",
    title: "Why Page Speed Is a Ranking Factor (And How to Fix Yours)",
    excerpt: "Google penalizes slow sites. A 1-second delay can cost you 7% of conversions. Here's how to check your speed and fix common issues.",
    date: "June 15, 2025",
    readTime: "5 min read",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
  },
];

export default function Blog() {
  usePageMeta({
    title: "Blog — SEO Tips for Small Businesses | Goodly",
    description: "Practical SEO tips, guides, and strategies for small businesses. Learn how to get found on Google, Instagram, and AI assistants."
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-4">
            <Link to="/tools/meta-tag-checker" className="text-sm text-[#5C685C] hover:text-[#1A201A] hidden sm:inline">Free Tools</Link>
            <Link to="/register" className="text-sm bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5 py-2.5">Get free audit →</Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-[#1A201A]">Goodly Blog</h1>
          <p className="mt-4 text-[#5C685C] text-lg max-w-2xl mx-auto">
            Practical SEO tips for small businesses. No jargon. Just stuff that works.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-[#9CA89C] mb-3">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  <span className="bg-[#F3F0E9] text-[#5C685C] px-2 py-0.5 rounded-full">{post.category}</span>
                </div>
                <h2 className="font-display font-bold text-lg text-[#1A201A] group-hover:text-[#2D3E32] transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-[#5C685C] leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-[#81B29A] font-medium">
                  Read more <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-10 text-center text-white">
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3">Ready to get found?</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">Get a free SEO audit in 30 seconds. See exactly what's holding your business back.</p>
          <Link to="/register" className="inline-block bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-8 py-3.5 font-medium text-lg">
            Get free audit <ArrowRight size={18} className="inline ml-1" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#5C685C]">
          © {new Date().getFullYear()} Goodly. Helping small businesses get found.
        </div>
      </footer>
    </div>
  );
}
