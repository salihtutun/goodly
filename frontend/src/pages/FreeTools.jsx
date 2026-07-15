import { Link } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import JsonLd, { webAppSchema } from "@/components/app/JsonLd";
import { ArrowRight, Search, Gauge, Smartphone, FileText, Shield, Code, BarChart3, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const TOOLS = [
  { icon: Sparkles, title: "AI Content Studio", desc: "Generate blog posts, emails, social captions, and website copy in seconds. Free, no signup.", path: "/content-studio", color: "#E07A5F", featured: true },
  { icon: Search, title: "Meta Tag Checker", desc: "See exactly what Google sees — title, description, OG tags, and more.", path: "/tools/meta-tag-checker", color: "#81B29A" },
  { icon: Gauge, title: "Page Speed Test", desc: "Check how fast your site loads and why it matters for rankings.", path: "/tools/page-speed", color: "#E07A5F" },
  { icon: Smartphone, title: "Mobile-Friendly Test", desc: "See if your site works on phones. 60%+ of searches are mobile.", path: "/tools/mobile-friendly", color: "#2D3E32" },
  { icon: FileText, title: "Keyword Density", desc: "Analyze word count, top keywords, and content quality.", path: "/tools/keyword-density", color: "#81B29A" },
  { icon: Shield, title: "SSL Checker", desc: "Verify your HTTPS security. Google penalizes non-secure sites.", path: "/tools/ssl-checker", color: "#E07A5F" },
  { icon: Code, title: "Schema Validator", desc: "Check JSON-LD, Open Graph, and canonical tags for rich results.", path: "/tools/schema-validator", color: "#2D3E32" },
];

export default function FreeTools() {
  usePageMeta({
    title: "Free SEO Tools — Meta Tags, Speed, Mobile, SSL & More | Goodly",
    description: "Free SEO tools for small businesses. Check meta tags, page speed, mobile-friendliness, SSL, schema, and keyword density. No signup required."
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <JsonLd data={webAppSchema("Free SEO Tools", "Free SEO tools for small businesses. Check meta tags, page speed, mobile-friendliness, SSL, schema, and keyword density. No signup required.", "/tools")} />
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/register" className="text-sm bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5 py-2.5">Get full audit →</Link>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-[#1A201A]">Free SEO Tools</h1>
          <p className="mt-4 text-[#5C685C] text-lg max-w-2xl mx-auto">
            Check your website's SEO health with our free tools. No signup. No credit card. Just paste your URL and get instant results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group bg-white border border-[#E5E0D8] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${tool.color}15` }}>
                <tool.icon size={24} className="text-[#1A201A]" style={{ color: tool.color }} strokeWidth={1.75} />
              </div>
              <h2 className="font-display font-bold text-lg text-[#1A201A] group-hover:text-[#2D3E32] transition-colors">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-[#5C685C] leading-relaxed">{tool.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm text-[#81B29A] font-medium">
                Try it free <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-10 text-center text-white">
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3">Want the full picture?</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Get a complete SEO audit with 50+ checks, AI action plan, revenue impact estimates, and competitor analysis.
          </p>
          <Link to="/register" className="inline-block bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-8 py-3.5 font-medium text-lg">
            Get free full audit <ArrowRight size={18} className="inline ml-1" />
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
