import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import JsonLd, { webAppSchema } from "@/components/app/JsonLd";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ArrowRight, Sparkles, PenLine, Mail, Camera, HelpCircle, Globe, MessageSquare, CheckCircle2, Star, Wrench, Calendar, RefreshCw, Image, Zap, Target, Lightbulb, Code } from "lucide-react";

const FEATURES = [
  { icon: Wrench, title: "Fix My Website", desc: "Paste your audit results and get ready-to-copy fixes for every issue. Meta tags, headings, schema, content — all fixed with exact code to paste.", color: "#E07A5F", new: true },
  { icon: Calendar, title: "Content Strategy", desc: "Complete 90-day content plan with topic clusters, blog topics, social posts, emails, and local SEO actions. Everything connected to business goals.", color: "#81B29A", new: true },
  { icon: RefreshCw, title: "Content Repurposing", desc: "One piece of content → Instagram, Facebook, LinkedIn, TikTok, email, and Twitter. Platform-optimized, ready to post.", color: "#4A5F4F", new: true },
  { icon: Image, title: "AI Image Prompts", desc: "Ready-to-use prompts for Midjourney, DALL-E 3, and Canva AI. Professional images for your blog, social media, emails, and website.", color: "#E6A57E", new: true },
  { icon: PenLine, title: "Blog Posts", desc: "Full SEO-optimized articles with titles, meta descriptions, and internal linking ideas. Ready to publish in your CMS.", color: "#81B29A" },
  { icon: MessageSquare, title: "Review Responses", desc: "Professional replies to any customer review — positive, negative, or neutral. On-brand, on-tone, ready to post.", color: "#E07A5F" },
  { icon: HelpCircle, title: "FAQ Pages", desc: "Complete FAQ content with 8-12 real customer questions and JSON-LD schema markup for Google rich results.", color: "#2D3E32" },
  { icon: Globe, title: "Website Copy", desc: "Homepage, about, services, contact, and landing pages. Complete copy with headlines, body text, and CTAs.", color: "#4A5F4F" },
  { icon: Mail, title: "Email Copy", desc: "Welcome emails, promos, follow-ups, newsletters, and abandoned cart recovery. Subject lines, preheaders, and CTAs included.", color: "#E6A57E" },
  { icon: Camera, title: "Social Captions", desc: "Instagram, Facebook, LinkedIn, and TikTok captions with hashtags, hooks, and visual ideas. Platform-optimized.", color: "#81B29A" },
];

const TESTIMONIALS = [
  { text: "I used to spend 3 hours writing one blog post. Now I get a complete article in 30 seconds. My website traffic doubled in 2 months.", name: "Maria K.", business: "Flower Shop Owner", rating: 5 },
  { text: "The Fix My Site tool found 12 issues on my website and gave me the exact code to fix every single one. I pasted it in and my Google ranking jumped from page 4 to page 1 in 3 weeks.", name: "David R.", business: "Plumbing Company Owner", rating: 5 },
  { text: "I'm not a writer. The website copy generator gave me a homepage that actually sounds like me — but better. Bookings went up 40%.", name: "Sarah L.", business: "Salon Owner", rating: 5 },
];

export default function ContentStudioLanding() {
  usePageMeta({
    title: "Free AI Content Studio — Fix Your Website, Strategy, Blog Posts & Images",
    description: "10 AI tools for small businesses. Fix your website, plan content strategy, repurpose across platforms, generate AI image prompts, write blog posts, emails, and social captions. Free, no signup needed."
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <JsonLd data={webAppSchema("Free AI Content Studio", "10 AI tools for small businesses. Fix your website, plan content strategy, repurpose across platforms, generate AI image prompts, write blog posts, emails, and social captions. Free, no signup needed.", "/content-studio")} />
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
            <Link to="/tools" className="hover:text-[#1A201A]">Free Tools</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#1A201A] hover:text-[#4A5F4F]">Sign in</Link>
            <Button onClick={() => window.location.href = "/register"} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5">Start free</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <Eyebrow className="mb-4 justify-center">AI Content Studio</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            Content that works,<br />written in seconds.
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            Fix your website, plan your content strategy, repurpose across platforms, generate AI image prompts, and create blog posts, emails, and social captions — all in one place. No writing skills needed. No expensive copywriters. Just tell us about your business and get publishable content in seconds.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => window.location.href = "/register"} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-6 text-base">
              <Sparkles size={18} className="mr-2" /> Start writing free <ArrowRight size={16} className="ml-2" />
            </Button>
            <Link to="/audit" className="text-sm text-[#5C685C] hover:text-[#1A201A] flex items-center gap-1">Or try a free SEO audit first →</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-[#1A201A]">10 AI tools. One content studio.</h2>
            <p className="mt-3 text-[#5C685C]">Everything a small business needs to market itself online. Zero writing skills required.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className={`bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative ${f.new ? "ring-1 ring-[#E07A5F]/30" : ""}`}>
                {f.new && <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold">NEW</span>}
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${f.color}15` }}>
                  <f.icon size={24} style={{ color: f.color }} strokeWidth={1.75} />
                </div>
                <h3 className="font-display font-bold text-lg text-[#1A201A] mb-2">{f.title}</h3>
                <p className="text-sm text-[#5C685C] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-[#F3F0E9]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-[#1A201A]">How it works</h2>
            <p className="mt-3 text-[#5C685C]">Three steps. Thirty seconds. Publishable content.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Tell us about your business", desc: "Your name, what you do, and what kind of content you need. That's it." },
              { step: "2", title: "AI writes your content", desc: "Google Gemini generates professional, SEO-optimized content in seconds. Blog posts, emails, captions — whatever you need." },
              { step: "3", title: "Copy, paste, publish", desc: "Every output is ready to use. Copy the HTML into your CMS, paste the caption into Instagram, send the email to your list." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-[#2D3E32] text-[#FDFBF7] flex items-center justify-center text-xl font-display font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-display font-bold text-lg text-[#1A201A] mb-2">{s.title}</h3>
                <p className="text-sm text-[#5C685C] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Samples — See It In Action */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-[#1A201A]">See what you'll get</h2>
            <p className="mt-3 text-[#5C685C]">Real examples from real small businesses. This is what the AI generates in seconds.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Fix My Site Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#E07A5F]/20 flex items-center justify-center"><Wrench size={16} className="text-[#E07A5F]" /></div>
                <span className="text-xs font-medium text-[#E07A5F] uppercase tracking-wide">Fix My Site</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold ml-auto">NEW</span>
              </div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4 mb-3">
                <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-2">Issue Found</div>
                <p className="text-sm text-[#E07A5F] font-medium">Missing meta description on homepage</p>
              </div>
              <div className="bg-[#2D3E32]/5 border border-[#2D3E32]/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#2D3E32]">AI-Generated Fix</span>
                  <CheckCircle2 size={12} className="text-[#81B29A]" />
                </div>
                <pre className="text-xs text-[#1A201A] font-mono bg-[#1A201A]/5 rounded-lg p-3 overflow-x-auto">{`<meta name="description" content="Greenhouse Lane Co. is Portland's family-owned garden center. Shop native plants, organic seeds, and get expert gardening advice. Serving Portland since 2008." />`}</pre>
                <div className="mt-2 text-xs text-[#9CA89C] flex items-center gap-1"><ArrowRight size={10} /> Paste in: &lt;head&gt; section, after &lt;title&gt;</div>
              </div>
            </div>

            {/* Content Strategy Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#81B29A]/20 flex items-center justify-center"><Calendar size={16} className="text-[#81B29A]" /></div>
                <span className="text-xs font-medium text-[#81B29A] uppercase tracking-wide">Content Strategy</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold ml-auto">NEW</span>
              </div>
              <div className="space-y-3">
                <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3">
                  <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Topic Clusters</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Local SEO Basics", "Customer Stories", "Seasonal Tips", "Behind the Scenes"].map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32]">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3">
                  <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Week 1 Priority</div>
                  <p className="text-sm text-[#1A201A]">Blog: "5 Signs Your Restaurant's Website Is Costing You Customers" — target keyword: restaurant website tips</p>
                </div>
                <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-xl p-3 text-white text-xs">
                  <Zap size={12} className="inline mr-1" /> 90-day plan with 12 blog posts, 48 social posts, 12 emails, and 12 local SEO actions
                </div>
              </div>
            </div>

            {/* Repurpose Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#4A5F4F]/20 flex items-center justify-center"><RefreshCw size={16} className="text-[#4A5F4F]" /></div>
                <span className="text-xs font-medium text-[#4A5F4F] uppercase tracking-wide">Repurpose</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold ml-auto">NEW</span>
              </div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3 mb-3">
                <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Input: Blog Post</div>
                <p className="text-xs text-[#5C685C] italic">"5 Ways to Prepare Your Garden for Spring — from soil testing to seed starting..."</p>
              </div>
              <div className="space-y-2">
                {[
                  { platform: "Instagram", text: "🌱 Spring garden prep starts NOW! Here are 5 things you can do this weekend to get your garden ready... #gardeningtips #springgarden" },
                  { platform: "LinkedIn", text: "As a professional landscaper, here's my spring preparation checklist that saves clients 40+ hours..." },
                  { platform: "Email", text: "Subject: Your garden called — it's ready for spring 🌸 | Preview: 5 weekend projects that'll transform..." },
                ].map((item, j) => (
                  <div key={j} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-lg p-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2D3E32] text-white font-medium uppercase">{item.platform}</span>
                    <p className="text-xs text-[#5C685C] mt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Prompts Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#E6A57E]/20 flex items-center justify-center"><Image size={16} className="text-[#E6A57E]" /></div>
                <span className="text-xs font-medium text-[#E6A57E] uppercase tracking-wide">Image Prompts</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold ml-auto">NEW</span>
              </div>
              <div className="space-y-3">
                <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3">
                  <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Midjourney</div>
                  <pre className="text-xs text-[#E07A5F] font-mono leading-relaxed whitespace-pre-wrap">A warm, inviting greenhouse interior with rows of native plants, morning sunlight streaming through glass panels, a gardener in overalls tending to seedlings, shallow depth of field, golden hour lighting, photorealistic --ar 16:9 --style raw --v 6</pre>
                </div>
                <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3">
                  <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">DALL-E 3</div>
                  <pre className="text-xs text-[#81B29A] font-mono leading-relaxed whitespace-pre-wrap">A bright greenhouse filled with diverse native plants in terracotta pots. Morning light creates warm rays through glass ceiling. A gardener wearing earth-toned clothing waters seedlings. Professional, warm atmosphere.</pre>
                </div>
                <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3">
                  <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Canva AI</div>
                  <pre className="text-xs text-[#5C685C] font-mono leading-relaxed whitespace-pre-wrap">Greenhouse interior with plants and natural light, warm and inviting, professional look</pre>
                </div>
              </div>
            </div>

            {/* Blog Post Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#81B29A]/20 flex items-center justify-center"><PenLine size={16} className="text-[#81B29A]" /></div>
                <span className="text-xs font-medium text-[#81B29A] uppercase tracking-wide">Blog Post</span>
              </div>
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-2">5 Signs Your Restaurant's Website Is Costing You Customers</h3>
              <p className="text-sm text-[#5C685C] leading-relaxed mb-3">Your website is your digital storefront. If it's slow, confusing, or missing key information, you're losing diners before they even see your menu. Here are the 5 most common mistakes — and how to fix them in an afternoon.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {["restaurant marketing", "website tips", "small business SEO"].map(tag => (
                  <span key={tag} className="text-xs bg-[#F3F0E9] text-[#5C685C] px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <div className="text-xs text-[#9CA89C]">~800 words · 4 min read · SEO-optimized · Ready to publish</div>
            </div>

            {/* Review Response Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#E07A5F]/20 flex items-center justify-center"><MessageSquare size={16} className="text-[#E07A5F]" /></div>
                <span className="text-xs font-medium text-[#E07A5F] uppercase tracking-wide">Review Response</span>
              </div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">{Array.from({length:5},(_,j)=>(<Star key={j} size={12} className="text-amber-400 fill-amber-400"/>))}</div>
                  <span className="text-xs text-[#9CA89C]">Sarah M. · 2 days ago</span>
                </div>
                <p className="text-sm text-[#5C685C] italic">"The food was amazing but we waited 45 minutes for a table even with a reservation. Not sure I'll come back."</p>
              </div>
              <div className="bg-[#2D3E32]/5 border border-[#2D3E32]/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#2D3E32]">Your Response (AI-generated)</span>
                  <CheckCircle2 size={12} className="text-[#81B29A]" />
                </div>
                <p className="text-sm text-[#1A201A] leading-relaxed">"Hi Sarah, thank you for the honest feedback — and we're so glad you loved the food! You're right, a 45-minute wait with a reservation is not acceptable. We've identified the issue (a scheduling gap on busy Friday nights) and are fixing it immediately. We'd love to make it right — please email me directly at manager@restaurant.com for a complimentary dinner on us. We hope you'll give us another chance."</p>
              </div>
            </div>

            {/* Social Caption Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#E6A57E]/20 flex items-center justify-center"><Camera size={16} className="text-[#E6A57E]" /></div>
                <span className="text-xs font-medium text-[#E6A57E] uppercase tracking-wide">Instagram Caption</span>
              </div>
              <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-4">
                <p className="text-sm text-[#1A201A] leading-relaxed mb-3">🌸 Spring special just dropped! Our lavender honey latte is back — made with local honey, house-made lavender syrup, and oat milk. Available for a limited time at all 3 locations. Tag someone who needs this in their life ☕✨</p>
                <div className="flex flex-wrap gap-1.5">
                  {["#locallatte", "#springspecials", "#coffeeshopvibes", "#smallbusinesslove", "#lavenderlatte", "#supportlocal"].map(h => (
                    <span key={h} className="text-xs text-[#81B29A]">{h}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#E5E0D8] text-xs text-[#9CA89C]">📸 Visual idea: Overhead shot of latte with latte art, flowers in background, natural window light</div>
              </div>
            </div>

            {/* Email Sample */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[#4A5F4F]/20 flex items-center justify-center"><Mail size={16} className="text-[#4A5F4F]" /></div>
                <span className="text-xs font-medium text-[#4A5F4F] uppercase tracking-wide">Welcome Email</span>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 space-y-2">
                <div className="text-xs text-[#9CA89C]">Subject: <span className="text-[#1A201A] font-medium">Welcome to the [Salon Name] family 💇‍♀️</span></div>
                <div className="text-xs text-[#9CA89C]">Preheader: <span className="text-[#1A201A]">Your first appointment is just the beginning...</span></div>
                <div className="border-t border-[#E5E0D8] pt-2">
                  <p className="text-sm text-[#1A201A] leading-relaxed">Hi [First Name],</p>
                  <p className="text-sm text-[#1A201A] leading-relaxed mt-1">Welcome! We're so excited to have you. As a new client, here's what you can expect: personalized consultations, a warm drink on arrival, and 15% off your first service.</p>
                  <div className="mt-2 bg-[#2D3E32] text-white text-center text-sm font-medium py-2 px-4 rounded-lg">Book Your First Appointment →</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <p className="text-sm text-[#5C685C]">These are real AI outputs. No human editing. Generated in under 30 seconds each.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-[#1A201A]">What small business owners say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
                <div className="flex gap-1 mb-3">{Array.from({ length: t.rating }, (_, j) => (<Star key={j} size={14} className="text-amber-400 fill-amber-400" />))}</div>
                <p className="text-sm text-[#5C685C] leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#81B29A]/20 flex items-center justify-center text-[#2D3E32] font-bold text-xs">{t.name[0]}</div>
                  <div><div className="text-sm font-medium text-[#1A201A]">{t.name}</div><div className="text-xs text-[#9CA89C]">{t.business}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-[#2D3E32]">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#FDFBF7]">Ready to stop staring at a blank page?</h2>
          <p className="mt-4 text-lg text-[#FDFBF7]/70">Create a free account and start generating content in seconds. No credit card needed.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => window.location.href = "/register"} className="bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-8 py-6 text-base">
              <Sparkles size={18} className="mr-2" /> Create free account <ArrowRight size={16} className="ml-2" />
            </Button>
            <Link to="/audit" className="text-[#FDFBF7]/60 hover:text-[#FDFBF7] text-sm">Try a free SEO audit →</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center text-sm text-[#5C685C]">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
            <Link to="/tools" className="hover:text-[#1A201A]">Free Tools</Link>
          </div>
          <div>© {new Date().getFullYear()} Goodly.</div>
        </div>
      </footer>
    </div>
  );
}
