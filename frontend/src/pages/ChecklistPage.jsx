import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import { ArrowRight, CheckCircle2, Download, FileText, Star } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const CHECKLIST_ITEMS = [
  { category: "Meta Tags", items: ["Write a unique title tag (50-60 chars) for every page", "Add a compelling meta description (120-160 chars) to every page", "Include your main keyword in the title tag", "Make sure every page has Open Graph tags for social sharing"] },
  { category: "Headings", items: ["Every page should have exactly one H1 heading", "Use H2s for subsections — they help Google understand your content structure", "Include keywords naturally in your headings", "Don't skip heading levels (H1 → H2 → H3, not H1 → H3)"] },
  { category: "Content", items: ["Every important page should have at least 300 words", "Answer the questions your customers actually ask", "Include your city and service area on key pages", "Add a clear call-to-action on every page"] },
  { category: "Images", items: ["Add descriptive alt text to every image", "Compress images before uploading (use TinyPNG — it's free)", "Use descriptive filenames (not IMG_4829.jpg)", "Add image dimensions to prevent layout shifts"] },
  { category: "Technical", items: ["Make sure your site loads in under 3 seconds", "Test your site on mobile — over 60% of searches are on phones", "Install an SSL certificate (HTTPS is a ranking factor)", "Submit your sitemap to Google Search Console"] },
  { category: "Google Business Profile", items: ["Claim and verify your Google Business Profile", "Fill out every field — hours, services, photos, description", "Add at least 10 photos of your business", "Ask every happy customer for a review"] },
  { category: "Links & Navigation", items: ["Fix any broken links on your site", "Make sure your navigation is clear and simple", "Link to your most important pages from your homepage", "Add internal links between related pages"] },
];

export default function ChecklistPage() {
  usePageMeta({
    title: "Free SEO Checklist — 15 Things to Fix on Your Website Today",
    description: "Download our free SEO checklist. 15 things every small business website needs. Fix them all in under 2 hours. No technical skills required."
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#1A201A] hover:text-[#4A5F4F]">Sign in</Link>
            <Link to="/register" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5 py-2 text-sm font-medium">Start free</Link>
          </div>
        </div>
      </header>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <Eyebrow className="mb-4 justify-center">Free Download</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            The Small Business SEO Checklist
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            28 things to fix on your website. Most take under 10 minutes each. No technical skills needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#checklist" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              View checklist <ArrowRight size={16} />
            </a>
            <Link to="/audit" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              Run free audit instead
            </Link>
          </div>
        </div>
      </section>

      <section id="checklist" className="pb-16 lg:pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          {CHECKLIST_ITEMS.map((section, i) => (
            <div key={i} className="mb-8">
              <h2 className="font-display font-bold text-xl text-[#1A201A] mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-[#81B29A]/15 flex items-center justify-center text-sm text-[#81B29A]">{i + 1}</span>
                {section.category}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 bg-white border border-[#E5E0D8] rounded-xl p-4">
                    <CheckCircle2 size={18} className="text-[#81B29A] shrink-0 mt-0.5" />
                    <span className="text-[#1A201A] text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 bg-[#2D3E32] rounded-2xl p-8 text-center">
            <Star size={28} className="text-[#81B29A] mx-auto mb-3" />
            <h2 className="font-display font-bold text-2xl text-[#FDFBF7] mb-2">Done with the checklist?</h2>
            <p className="text-[#FDFBF7]/70 mb-6">Run a free audit to see how much your score improved.</p>
            <Link to="/audit" className="inline-flex items-center gap-2 bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-8 py-3.5 font-medium">
              Run free audit <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center text-sm text-[#5C685C]">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
          </div>
          <div>© {new Date().getFullYear()} Goodly.</div>
        </div>
      </footer>
    </div>
  );
}
