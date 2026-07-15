import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import {
  Sparkles, FileText, MessageSquare, HelpCircle, Globe,
  Copy, CheckCircle2, Loader2, ArrowRight, Star, Clock,
  ChevronDown, ChevronUp, ExternalLink, BookOpen, PenLine,
  Mail, Camera, Hash, Send, Wrench, Calendar, RefreshCw,
  Image, Zap, Target, Lightbulb, Code, Download,
} from "lucide-react";

const TABS = [
  { id: "fix", label: "Fix My Site", icon: Wrench, desc: "Audit → ready-to-paste fixes in one click", new: true },
  { id: "strategy", label: "Strategy", icon: Calendar, desc: "90-day content plan with topic clusters", new: true },
  { id: "blog", label: "Blog Post", icon: PenLine, desc: "Full SEO-optimized article ready to publish" },
  { id: "review", label: "Review Response", icon: MessageSquare, desc: "Professional reply to any customer review" },
  { id: "faq", label: "FAQ Page", icon: HelpCircle, desc: "FAQ content + Google rich result schema" },
  { id: "website", label: "Website Copy", icon: Globe, desc: "Homepage, about, services, or landing page" },
  { id: "email", label: "Email Copy", icon: Mail, desc: "Welcome, promo, follow-up, or newsletter emails" },
  { id: "social", label: "Social Captions", icon: Camera, desc: "Instagram, Facebook, LinkedIn, or TikTok captions" },
  { id: "repurpose", label: "Repurpose", icon: RefreshCw, desc: "One piece → Instagram, email, LinkedIn, TikTok", new: true },
  { id: "images", label: "Image Prompts", icon: Image, desc: "Midjourney, DALL-E, and Canva AI prompts", new: true },
];

const PAGE_TYPES = [
  { value: "homepage", label: "Homepage" },
  { value: "about", label: "About Page" },
  { value: "services", label: "Services Page" },
  { value: "contact", label: "Contact Page" },
  { value: "landing", label: "Landing Page" },
];

const TONES = [
  "friendly and helpful",
  "professional and warm",
  "bold and confident",
  "casual and approachable",
  "luxury and refined",
];

const PLATFORMS = ["instagram", "facebook", "linkedin", "tiktok", "email", "twitter"];

export default function ContentStudio() {
  usePageMeta({
    title: "AI Content Studio — Fix My Site, Strategy, Blog Posts, Images & More",
    description: "Free AI content generator for small businesses. Fix your website, create content strategies, generate blog posts, repurpose content, and create AI image prompts. Powered by Google Gemini."
  });

  const { user, refresh } = useAuth();
  const brandVoice = user?.brand_voice;

  const [tab, setTab] = useState("fix");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  // Existing form states
  const [blogForm, setBlogForm] = useState({ business_name: "", topic: "", keywords: "", tone: "friendly and helpful", target_audience: "small business customers" });
  const [reviewForm, setReviewForm] = useState({ business_name: "", reviewer_name: "", rating: 3, review_text: "", tone: "professional and warm" });
  const [faqForm, setFaqForm] = useState({ business_name: "", category: "", location: "", services: "" });
  const [copyForm, setCopyForm] = useState({ business_name: "", description: "", page_type: "homepage", keywords: "", location: "", tone: "warm and professional" });
  const [emailForm, setEmailForm] = useState({ business_name: "", email_type: "promo", topic: "", tone: "warm and professional", target_audience: "customers" });
  const [socialForm, setSocialForm] = useState({ business_name: "", platform: "instagram", topic: "", tone: "friendly and engaging", goal: "engagement" });

  // New form states
  const [fixForm, setFixForm] = useState({ business_name: "", website_url: "", audit_issues: "", industry: "", location: "" });
  const [strategyForm, setStrategyForm] = useState({ business_name: "", industry: "", location: "", target_audience: "local customers", goals: "more customers and better Google ranking", competitors: "", existing_content: "" });
  const [repurposeForm, setRepurposeForm] = useState({ business_name: "", source_content: "", source_type: "blog_post", tone: "friendly and professional", selected_platforms: ["instagram", "facebook", "linkedin", "tiktok", "email"] });
  const [imageForm, setImageForm] = useState({ business_name: "", content_type: "blog_header", content_description: "", brand_colors: "", style: "professional and warm", platform: "website", count: 3 });

  // Auto-fill forms from saved brand voice
  useEffect(() => {
    if (!brandVoice) return;
    const bv = brandVoice;
    setBlogForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, tone: bv.tone || prev.tone, target_audience: bv.target_audience || prev.target_audience }));
    setCopyForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, location: bv.location || prev.location, tone: bv.tone || prev.tone }));
    setEmailForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, tone: bv.tone || prev.tone, target_audience: bv.target_audience || prev.target_audience }));
    setSocialForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, tone: bv.tone || prev.tone }));
    setFixForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, industry: bv.industry || prev.industry, location: bv.location || prev.location }));
    setStrategyForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, industry: bv.industry || prev.industry, location: bv.location || prev.location, target_audience: bv.target_audience || prev.target_audience }));
    setRepurposeForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, tone: bv.tone || prev.tone }));
    setImageForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name }));
    setFaqForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, location: bv.location || prev.location }));
    setReviewForm(prev => ({ ...prev, business_name: bv.business_name || prev.business_name, tone: bv.tone || prev.tone }));
  }, [brandVoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save brand voice for future use
  const saveBrandVoice = async () => {
    try {
      const bv = {
        tone: blogForm.tone || copyForm.tone || "friendly and professional",
        target_audience: blogForm.target_audience || strategyForm.target_audience || "local customers",
        business_name: blogForm.business_name || fixForm.business_name || "",
        industry: strategyForm.industry || fixForm.industry || "",
        location: strategyForm.location || fixForm.location || faqForm.location || "",
      };
      await api.put("/auth/brand-voice", bv);
      await refresh();
      toast.success("Brand voice saved! All future content will use these preferences.");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  // Read URL params for pre-filling from audit detail
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const urlParam = searchParams.get("url");
    const issuesParam = searchParams.get("issues");
    if (tabParam === "fix") {
      setTab("fix");
      if (urlParam) setFixForm(prev => ({ ...prev, website_url: urlParam }));
      if (issuesParam) setFixForm(prev => ({ ...prev, audit_issues: issuesParam }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const exportCalendarCSV = () => {
    if (!result?.content_calendar) return;
    const rows = [["Week", "Theme", "Blog Title", "Blog Keyword", "Social Platform", "Social Type", "Social Topic", "Email Type", "Email Subject", "Local SEO Action"]];
    result.content_calendar.forEach((week) => {
      const maxRows = Math.max(
        1,
        week.social_posts?.length || 0,
        week.email ? 1 : 0
      );
      for (let i = 0; i < maxRows; i++) {
        const sp = week.social_posts?.[i] || {};
        const email = i === 0 ? week.email : null;
        rows.push([
          week.week || "",
          week.theme || "",
          i === 0 ? (week.blog_post?.title || "") : "",
          i === 0 ? (week.blog_post?.target_keyword || "") : "",
          sp.platform || "",
          sp.content_type || "",
          sp.topic || "",
          email?.type || "",
          email?.subject_line || "",
          i === 0 ? (week.local_seo_action || "") : "",
        ]);
      }
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-calendar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar exported as CSV!");
  };

  const togglePlatform = (p) => {
    setRepurposeForm(prev => ({
      ...prev,
      selected_platforms: prev.selected_platforms.includes(p)
        ? prev.selected_platforms.filter(x => x !== p)
        : [...prev.selected_platforms, p]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      let endpoint, payload;
      if (tab === "fix") {
        endpoint = "/ai/fix-my-site";
        let issues = [];
        try { issues = JSON.parse(fixForm.audit_issues); } catch { issues = fixForm.audit_issues.split("\n").filter(Boolean).map(line => ({ title: line, description: line, severity: "medium", category: "general" })); }
        payload = { ...fixForm, audit_issues: issues };
      } else if (tab === "strategy") { endpoint = "/ai/content-strategy"; payload = strategyForm; }
      else if (tab === "blog") { endpoint = "/ai/blog-post"; payload = blogForm; }
      else if (tab === "review") { endpoint = "/ai/review-response"; payload = reviewForm; }
      else if (tab === "faq") { endpoint = "/ai/faq"; payload = faqForm; }
      else if (tab === "website") { endpoint = "/ai/website-copy"; payload = copyForm; }
      else if (tab === "email") { endpoint = "/ai/email"; payload = emailForm; }
      else if (tab === "social") { endpoint = "/ai/social-captions"; payload = socialForm; }
      else if (tab === "repurpose") { endpoint = "/ai/repurpose"; payload = { ...repurposeForm, target_platforms: repurposeForm.selected_platforms }; }
      else { endpoint = "/ai/image-prompts"; payload = imageForm; }
      const { data } = await api.post(endpoint, payload);
      setResult(data);
      toast.success("Content generated!");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const renderStars = () => Array.from({ length: 5 }, (_, i) => (
    <button key={i} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
      className={`text-2xl transition-colors ${i < reviewForm.rating ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}>★</button>
  ));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto" data-testid="content-studio-root">
        <Eyebrow>AI Content Studio</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">Content that works,<br />written in seconds.</h1>
        <p className="mt-3 text-[#5C685C] text-lg">Fix your website, plan your content strategy, generate blog posts, repurpose across platforms, and create AI image prompts — all in one place.</p>

        <div className="mt-10 flex gap-2 p-1.5 bg-[#F3F0E9] rounded-2xl overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap relative ${tab === t.id ? "bg-white text-[#1A201A] shadow-sm" : "text-[#5C685C] hover:text-[#1A201A]"}`}>
              <t.icon size={16} />{t.label}
              {t.new && <span className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold">NEW</span>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
          {/* Fix My Site */}
          {tab === "fix" && (
            <div className="space-y-5">
              <div className="bg-[#E07A5F]/5 border border-[#E07A5F]/20 rounded-xl p-4 text-sm text-[#5C685C]">
                <Zap size={16} className="inline text-[#E07A5F] mr-1" />
                Paste your audit results and get ready-to-copy fixes for every issue. Meta tags, headings, schema, content — all fixed.
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={fixForm.business_name} onChange={(e) => setFixForm({ ...fixForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Website URL *</Label><Input required value={fixForm.website_url} onChange={(e) => setFixForm({ ...fixForm, website_url: e.target.value })} placeholder="https://greenhouselane.com" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Audit issues (paste from your audit, one per line, or JSON array)</Label><Textarea required rows={6} value={fixForm.audit_issues} onChange={(e) => setFixForm({ ...fixForm, audit_issues: e.target.value })} placeholder={`Missing meta description on homepage\nH1 tag is empty\nNo schema markup found\nPage speed score: 34/100 (slow)\nImages missing alt text`} className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl font-mono text-sm" /></div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Industry</Label><Input value={fixForm.industry} onChange={(e) => setFixForm({ ...fixForm, industry: e.target.value })} placeholder="landscaping, bakery, plumbing" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Location (for local SEO)</Label><Input value={fixForm.location} onChange={(e) => setFixForm({ ...fixForm, location: e.target.value })} placeholder="Portland, OR" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
            </div>
          )}

          {/* Content Strategy */}
          {tab === "strategy" && (
            <div className="space-y-5">
              <div className="bg-[#81B29A]/5 border border-[#81B29A]/20 rounded-xl p-4 text-sm text-[#5C685C]">
                <Target size={16} className="inline text-[#81B29A] mr-1" />
                Get a complete 90-day content plan with blog topics, social posts, emails, and local SEO actions — all connected by topic clusters.
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={strategyForm.business_name} onChange={(e) => setStrategyForm({ ...strategyForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Industry *</Label><Input required value={strategyForm.industry} onChange={(e) => setStrategyForm({ ...strategyForm, industry: e.target.value })} placeholder="landscaping, bakery, salon" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Location</Label><Input value={strategyForm.location} onChange={(e) => setStrategyForm({ ...strategyForm, location: e.target.value })} placeholder="Portland, OR" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Target audience</Label><Input value={strategyForm.target_audience} onChange={(e) => setStrategyForm({ ...strategyForm, target_audience: e.target.value })} placeholder="local customers" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Goals</Label><Input value={strategyForm.goals} onChange={(e) => setStrategyForm({ ...strategyForm, goals: e.target.value })} placeholder="more customers, better ranking" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Competitors (optional)</Label><Input value={strategyForm.competitors} onChange={(e) => setStrategyForm({ ...strategyForm, competitors: e.target.value })} placeholder="competitor1.com, competitor2.com" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
            </div>
          )}

          {/* Blog Post */}
          {tab === "blog" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={blogForm.business_name} onChange={(e) => setBlogForm({ ...blogForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Blog topic *</Label><Input required value={blogForm.topic} onChange={(e) => setBlogForm({ ...blogForm, topic: e.target.value })} placeholder="5 Ways to Prepare Your Garden for Spring" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Target keywords (comma-separated)</Label><Input value={blogForm.keywords} onChange={(e) => setBlogForm({ ...blogForm, keywords: e.target.value })} placeholder="spring garden prep, planting tips" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Tone</Label><select value={blogForm.tone} onChange={(e) => setBlogForm({ ...blogForm, tone: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]">{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Target audience</Label><Input value={blogForm.target_audience} onChange={(e) => setBlogForm({ ...blogForm, target_audience: e.target.value })} placeholder="homeowners, gardeners" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
            </div>
          )}

          {/* Review Response */}
          {tab === "review" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Your business name *</Label><Input required value={reviewForm.business_name} onChange={(e) => setReviewForm({ ...reviewForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Reviewer name *</Label><Input required value={reviewForm.reviewer_name} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })} placeholder="Sarah M." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Rating</Label><div className="flex gap-1">{renderStars()}</div></div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Review text *</Label><Textarea required rows={4} value={reviewForm.review_text} onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })} placeholder="Paste the customer's review here..." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Response tone</Label><select value={reviewForm.tone} onChange={(e) => setReviewForm({ ...reviewForm, tone: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="professional and warm">Professional and warm</option><option value="grateful and enthusiastic">Grateful and enthusiastic</option><option value="apologetic and solution-focused">Apologetic and solution-focused</option><option value="appreciative and inviting">Appreciative and inviting</option></select></div>
            </div>
          )}

          {/* FAQ */}
          {tab === "faq" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={faqForm.business_name} onChange={(e) => setFaqForm({ ...faqForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Category / industry *</Label><Input required value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} placeholder="landscaping, bakery, plumbing" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Location (optional)</Label><Input value={faqForm.location} onChange={(e) => setFaqForm({ ...faqForm, location: e.target.value })} placeholder="Portland, OR" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Services offered (optional)</Label><Input value={faqForm.services} onChange={(e) => setFaqForm({ ...faqForm, services: e.target.value })} placeholder="garden design, maintenance" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
            </div>
          )}

          {/* Website Copy */}
          {tab === "website" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={copyForm.business_name} onChange={(e) => setCopyForm({ ...copyForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Page type</Label><select value={copyForm.page_type} onChange={(e) => setCopyForm({ ...copyForm, page_type: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]">{PAGE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">What does your business do? *</Label><Textarea required rows={3} value={copyForm.description} onChange={(e) => setCopyForm({ ...copyForm, description: e.target.value })} placeholder="We're a family-owned garden center in Portland..." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div className="grid sm:grid-cols-3 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Keywords</Label><Input value={copyForm.keywords} onChange={(e) => setCopyForm({ ...copyForm, keywords: e.target.value })} placeholder="garden center, native plants" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Location</Label><Input value={copyForm.location} onChange={(e) => setCopyForm({ ...copyForm, location: e.target.value })} placeholder="Portland, OR" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Tone</Label><select value={copyForm.tone} onChange={(e) => setCopyForm({ ...copyForm, tone: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]">{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
            </div>
          )}

          {/* Email */}
          {tab === "email" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={emailForm.business_name} onChange={(e) => setEmailForm({ ...emailForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Email type</Label><select value={emailForm.email_type} onChange={(e) => setEmailForm({ ...emailForm, email_type: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="welcome">Welcome email</option><option value="promo">Promotional offer</option><option value="follow_up">Follow-up</option><option value="newsletter">Newsletter</option><option value="abandoned_cart">Abandoned cart recovery</option></select></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Topic / offer (optional)</Label><Input value={emailForm.topic} onChange={(e) => setEmailForm({ ...emailForm, topic: e.target.value })} placeholder="Spring plant sale — 20% off all native plants" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Tone</Label><select value={emailForm.tone} onChange={(e) => setEmailForm({ ...emailForm, tone: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]">{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Target audience</Label><Input value={emailForm.target_audience} onChange={(e) => setEmailForm({ ...emailForm, target_audience: e.target.value })} placeholder="existing customers" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              </div>
            </div>
          )}

          {/* Social Captions */}
          {tab === "social" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={socialForm.business_name} onChange={(e) => setSocialForm({ ...socialForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Platform</Label><select value={socialForm.platform} onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="tiktok">TikTok</option></select></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">What are you posting about? *</Label><Textarea required rows={2} value={socialForm.topic} onChange={(e) => setSocialForm({ ...socialForm, topic: e.target.value })} placeholder="Behind the scenes of our greenhouse spring setup 🌱" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Tone</Label><select value={socialForm.tone} onChange={(e) => setSocialForm({ ...socialForm, tone: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]">{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Goal</Label><select value={socialForm.goal} onChange={(e) => setSocialForm({ ...socialForm, goal: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="engagement">Engagement (likes, comments)</option><option value="traffic">Website traffic</option><option value="sales">Sales / bookings</option><option value="awareness">Brand awareness</option></select></div>
              </div>
            </div>
          )}

          {/* Repurpose */}
          {tab === "repurpose" && (
            <div className="space-y-5">
              <div className="bg-[#81B29A]/5 border border-[#81B29A]/20 rounded-xl p-4 text-sm text-[#5C685C]">
                <RefreshCw size={16} className="inline text-[#81B29A] mr-1" />
                Take one piece of content and turn it into platform-specific versions for Instagram, Facebook, LinkedIn, TikTok, email, and Twitter.
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={repurposeForm.business_name} onChange={(e) => setRepurposeForm({ ...repurposeForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Source type</Label><select value={repurposeForm.source_type} onChange={(e) => setRepurposeForm({ ...repurposeForm, source_type: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="blog_post">Blog post</option><option value="video_script">Video script</option><option value="podcast_transcript">Podcast transcript</option><option value="customer_review">Customer review</option><option value="case_study">Case study</option></select></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Tone</Label><select value={repurposeForm.tone} onChange={(e) => setRepurposeForm({ ...repurposeForm, tone: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]">{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Content to repurpose *</Label><Textarea required rows={6} value={repurposeForm.source_content} onChange={(e) => setRepurposeForm({ ...repurposeForm, source_content: e.target.value })} placeholder="Paste your blog post, video script, or any content here..." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-2 block">Target platforms</Label><div className="flex flex-wrap gap-2">{PLATFORMS.map((p) => (<button key={p} type="button" onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${repurposeForm.selected_platforms.includes(p) ? "bg-[#2D3E32] text-white" : "bg-[#F3F0E9] text-[#5C685C] hover:bg-[#E5E0D8]"}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>))}</div></div>
            </div>
          )}

          {/* Image Prompts */}
          {tab === "images" && (
            <div className="space-y-5">
              <div className="bg-[#E07A5F]/5 border border-[#E07A5F]/20 rounded-xl p-4 text-sm text-[#5C685C]">
                <Image size={16} className="inline text-[#E07A5F] mr-1" />
                Get ready-to-use prompts for Midjourney, DALL-E 3, and Canva AI. Just describe what you need and get professional image prompts in seconds.
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Business name *</Label><Input required value={imageForm.business_name} onChange={(e) => setImageForm({ ...imageForm, business_name: e.target.value })} placeholder="Greenhouse Lane Co." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Image type</Label><select value={imageForm.content_type} onChange={(e) => setImageForm({ ...imageForm, content_type: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="blog_header">Blog header</option><option value="social_post">Social media post</option><option value="email_hero">Email hero image</option><option value="product">Product photo</option><option value="team">Team photo</option><option value="storefront">Storefront / location</option><option value="abstract">Abstract / background</option></select></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">What should the image show? *</Label><Textarea required rows={3} value={imageForm.content_description} onChange={(e) => setImageForm({ ...imageForm, content_description: e.target.value })} placeholder="A warm, inviting greenhouse interior with rows of native plants, morning sunlight streaming through glass panels, a gardener tending to seedlings..." className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
              <div className="grid sm:grid-cols-3 gap-5">
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Brand colors</Label><Input value={imageForm.brand_colors} onChange={(e) => setImageForm({ ...imageForm, brand_colors: e.target.value })} placeholder="forest green #2D3E32, terracotta #E07A5F" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl" /></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Style</Label><select value={imageForm.style} onChange={(e) => setImageForm({ ...imageForm, style: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="professional and warm">Professional & warm</option><option value="modern and clean">Modern & clean</option><option value="rustic and cozy">Rustic & cozy</option><option value="bold and vibrant">Bold & vibrant</option><option value="minimal and elegant">Minimal & elegant</option></select></div>
                <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Platform</Label><select value={imageForm.platform} onChange={(e) => setImageForm({ ...imageForm, platform: e.target.value })} className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#1A201A]"><option value="website">Website (16:9)</option><option value="instagram">Instagram (1:1)</option><option value="facebook">Facebook (1.91:1)</option><option value="linkedin">LinkedIn (1.91:1)</option><option value="blog">Blog header (1200x630)</option><option value="email">Email (600-800px)</option></select></div>
              </div>
              <div><Label className="text-sm font-medium text-[#1A201A] mb-1.5 block">Number of prompts</Label><div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => (<button key={n} type="button" onClick={() => setImageForm({ ...imageForm, count: n })} className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${imageForm.count === n ? "bg-[#2D3E32] text-white" : "bg-[#F3F0E9] text-[#5C685C] hover:bg-[#E5E0D8]"}`}>{n}</button>))}</div></div>
            </div>
          )}

          <Button type="submit" disabled={busy} className="mt-6 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-6 text-base">
            {busy ? (<><Loader2 size={18} className="mr-2 animate-spin" /> Generating...</>) : (<><Sparkles size={18} className="mr-2" /> Generate {TABS.find(t => t.id === tab)?.label}</>)}
          </Button>

          {/* Save Brand Voice — one click, reuse everywhere */}
          <button type="button" onClick={saveBrandVoice} className="ml-3 mt-6 px-5 py-3 text-sm font-medium text-[#5C685C] border border-[#E5E0D8] rounded-full hover:bg-[#F3F0E9] hover:text-[#1A201A] transition-colors">
            <Star size={14} className="inline mr-1.5" />
            {brandVoice ? "Update Brand Voice" : "Save Brand Voice"}
          </button>
          {brandVoice && (
            <span className="ml-2 text-xs text-[#81B29A]">✓ Saved — auto-fills all forms</span>
          )}
        </form>

        {/* Results — Fix My Site */}
        {result && tab === "fix" && result.priority_fixes && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <h2 className="font-display font-bold text-xl text-[#1A201A] mb-2">Your Website Fixes</h2>
            <p className="text-sm text-[#5C685C] mb-6">{result.summary}</p>
            {result.estimated_ranking_impact && (
              <div className="bg-[#81B29A]/10 border border-[#81B29A]/20 rounded-xl p-4 mb-6 text-sm text-[#2D3E32] flex items-start gap-2">
                <Target size={16} className="text-[#81B29A] mt-0.5 shrink-0" />
                <span><strong>Estimated impact:</strong> {result.estimated_ranking_impact}</span>
              </div>
            )}
            <div className="space-y-4">
              {result.priority_fixes?.map((fix, i) => (
                <div key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fix.impact === "high" ? "bg-[#E07A5F]/10 text-[#E07A5F]" : fix.impact === "medium" ? "bg-amber-100 text-amber-700" : "bg-[#81B29A]/10 text-[#2D3E32]"}`}>{fix.impact?.toUpperCase()} IMPACT</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F0E9] text-[#5C685C]">{fix.fix_type}</span>
                  </div>
                  <div className="font-medium text-[#1A201A] mb-1">{fix.issue}</div>
                  <div className="text-sm text-[#5C685C] mb-3">{fix.what_to_do}</div>
                  {fix.code_to_paste && (
                    <div className="relative">
                      <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Code to paste</div>
                      <pre className="bg-[#1A201A] text-[#81B29A] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed">{fix.code_to_paste}</pre>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fix.code_to_paste, `fix-${i}`)} className="absolute top-6 right-2 text-[#81B29A] hover:text-white rounded-full">{copied === `fix-${i}` ? <CheckCircle2 size={14} /> : <Copy size={14} />}</Button>
                    </div>
                  )}
                  {fix.where_to_paste && <div className="mt-2 text-xs text-[#9CA89C] flex items-center gap-1"><ArrowRight size={12} /> Paste in: {fix.where_to_paste}</div>}
                </div>
              ))}
            </div>
            {result.complete_head_section && (
              <div className="mt-6 bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3"><h3 className="font-display font-bold text-[#1A201A]">Complete &lt;head&gt; Section</h3><Button variant="outline" size="sm" onClick={() => copyToClipboard(result.complete_head_section, "head-section")} className="rounded-full border-[#E5E0D8] text-[#5C685C]">{copied === "head-section" ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}Copy all</Button></div>
                <pre className="bg-[#1A201A] text-[#81B29A] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed">{result.complete_head_section}</pre>
              </div>
            )}
            {result.complete_schema_markup && (
              <div className="mt-4 bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3"><h3 className="font-display font-bold text-[#1A201A]">Schema Markup (JSON-LD)</h3><Button variant="outline" size="sm" onClick={() => copyToClipboard(result.complete_schema_markup, "schema")} className="rounded-full border-[#E5E0D8] text-[#5C685C]">{copied === "schema" ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}Copy</Button></div>
                <pre className="bg-[#1A201A] text-[#81B29A] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed">{result.complete_schema_markup}</pre>
              </div>
            )}
            {result.quick_wins?.length > 0 && (
              <div className="mt-6 bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-5">
                <h3 className="font-display font-bold text-[#1A201A] mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-amber-500" /> Quick Wins (under 5 minutes)</h3>
                <ul className="space-y-2">{result.quick_wins.map((win, i) => (<li key={i} className="text-sm text-[#5C685C] flex items-start gap-2"><CheckCircle2 size={14} className="text-[#81B29A] mt-0.5 shrink-0" />{win}</li>))}</ul>
              </div>
            )}
          </div>
        )}

        {/* Results — Content Strategy */}
        {result && tab === "strategy" && result.content_calendar && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-xl text-[#1A201A]">Your 90-Day Content Strategy</h2>
              <Button variant="outline" size="sm" onClick={exportCalendarCSV} className="rounded-full border-[#E5E0D8] text-[#5C685C] hover:text-[#1A201A] flex items-center gap-1.5">
                <Download size={14} /> Export CSV
              </Button>
            </div>
            <p className="text-sm text-[#5C685C] mb-6 whitespace-pre-line">{result.strategy_overview}</p>

            {result.brand_voice && (
              <div className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-5 mb-6">
                <h3 className="font-display font-bold text-[#1A201A] mb-3">Brand Voice</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-2">Tone</div>
                    <div className="flex flex-wrap gap-1.5">{result.brand_voice.tone?.map((t, i) => (<span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32]">{t}</span>))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-2">Do's & Don'ts</div>
                    <div className="text-xs space-y-1">{result.brand_voice.do?.map((d, i) => (<div key={i} className="text-[#2D3E32]">✓ {d}</div>))}{result.brand_voice.dont?.map((d, i) => (<div key={i} className="text-[#E07A5F]">✗ {d}</div>))}</div>
                  </div>
                </div>
              </div>
            )}

            {result.topic_clusters && (
              <div className="mb-6">
                <h3 className="font-display font-bold text-[#1A201A] mb-3">Topic Clusters</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.topic_clusters.map((cluster, i) => (
                    <div key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4">
                      <div className="font-medium text-[#1A201A]">{cluster.cluster_name}</div>
                      <div className="text-xs text-[#5C685C] mt-1">{cluster.pillar_topic}</div>
                      <div className="flex flex-wrap gap-1 mt-2">{cluster.target_keywords?.map((kw, j) => (<span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32]">{kw}</span>))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.quick_start_plan && (
              <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-xl p-5 text-white mb-6">
                <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Zap size={16} /> Start Today</h3>
                <div className="space-y-3 text-sm">
                  <div><span className="text-white/60">Priority:</span> {result.quick_start_plan.week_1_priority}</div>
                  <div><span className="text-white/60">First blog:</span> {result.quick_start_plan.first_blog_post}</div>
                  <div><span className="text-white/60">First post:</span> "{result.quick_start_plan.first_social_post}"</div>
                  <div><span className="text-white/60">First email:</span> {result.quick_start_plan.first_email}</div>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <h3 className="font-display font-bold text-[#1A201A] sticky top-0 bg-white py-2">12-Week Calendar</h3>
              {result.content_calendar?.map((week, i) => (
                <details key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl group">
                  <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-[#1A201A] font-medium">
                    <span>Week {week.week}: {week.theme}</span>
                    <ChevronDown size={16} className="text-[#9CA89C] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-4 space-y-3 text-sm">
                    {week.blog_post && (
                      <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                        <div className="text-xs text-[#9CA89C] uppercase tracking-wide">Blog Post</div>
                        <div className="font-medium text-[#1A201A]">{week.blog_post.title}</div>
                        <div className="text-[#5C685C] text-xs mt-1">Keyword: {week.blog_post.target_keyword}</div>
                      </div>
                    )}
                    {week.social_posts?.map((sp, j) => (
                      <div key={j} className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                        <div className="text-xs text-[#9CA89C] uppercase tracking-wide">{sp.platform} • {sp.content_type}</div>
                        <div className="text-[#1A201A] text-xs mt-1">{sp.topic}</div>
                      </div>
                    ))}
                    {week.email && (
                      <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                        <div className="text-xs text-[#9CA89C] uppercase tracking-wide">Email • {week.email.type}</div>
                        <div className="text-[#1A201A] text-xs mt-1">{week.email.subject_line}</div>
                      </div>
                    )}
                    {week.local_seo_action && (
                      <div className="text-xs text-[#81B29A] flex items-center gap-1"><MapPin size={12} />{week.local_seo_action}</div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            {result.success_metrics && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                {Object.entries(result.success_metrics).map(([key, val]) => (
                  <div key={key} className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-4 text-center">
                    <div className="text-xs text-[#9CA89C] uppercase tracking-wide">{key.replace("_", " ")}</div>
                    <div className="text-sm text-[#1A201A] mt-1">{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results — Blog */}
        {result && tab === "blog" && result.title && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6"><h2 className="font-display font-bold text-xl text-[#1A201A]">Your Blog Post</h2><Button variant="outline" size="sm" onClick={() => copyToClipboard(result.body, "blog-body")} className="rounded-full border-[#E5E0D8] text-[#5C685C] hover:text-[#1A201A]">{copied === "blog-body" ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}Copy HTML</Button></div>
            <div className="space-y-4">
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">SEO Title ({result.title?.length || 0} chars)</div><div className="font-display font-bold text-lg text-[#1A201A]">{result.title}</div></div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Meta Description</div><div className="text-sm text-[#5C685C]">{result.meta_description}</div></div>
              <div className="flex gap-4 text-sm text-[#5C685C]"><span className="flex items-center gap-1"><Clock size={14} />{result.read_time_minutes} min read</span><span className="flex items-center gap-1"><BookOpen size={14} />{result.target_keywords_used?.length || 0} keywords</span></div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-6"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-3">Blog Body (HTML)</div><div className="prose max-w-none text-sm text-[#374151] leading-relaxed" dangerouslySetInnerHTML={{ __html: result.body }} /></div>
            </div>
          </div>
        )}

        {/* Results — Review */}
        {result && tab === "review" && result.response && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6"><h2 className="font-display font-bold text-xl text-[#1A201A]">Your Response</h2><Button variant="outline" size="sm" onClick={() => copyToClipboard(result.response, "review-response")} className="rounded-full border-[#E5E0D8] text-[#5C685C] hover:text-[#1A201A]">{copied === "review-response" ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}Copy</Button></div>
            <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5"><div className="flex items-center gap-2 mb-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D3E32] font-medium">{result.tone_used}</span></div><p className="text-[#374151] leading-relaxed">{result.response}</p></div>
          </div>
        )}

        {/* Results — FAQ */}
        {result && tab === "faq" && result.questions && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6"><h2 className="font-display font-bold text-xl text-[#1A201A]">Your FAQ Page</h2><Button variant="outline" size="sm" onClick={() => copyToClipboard(result.json_ld_schema, "faq-schema")} className="rounded-full border-[#E5E0D8] text-[#5C685C] hover:text-[#1A201A]">{copied === "faq-schema" ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Code2 size={14} className="mr-1" />}Copy Schema</Button></div>
            <div className="space-y-4">
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Page Title</div><div className="font-display font-bold text-lg text-[#1A201A]">{result.page_title}</div></div>
              <p className="text-sm text-[#5C685C] italic">{result.introduction}</p>
              <div className="space-y-3">{result.questions?.map((q, i) => (<details key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl group"><summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-[#1A201A] font-medium">{q.question}<ChevronDown size={16} className="text-[#9CA89C] group-open:rotate-180 transition-transform" /></summary><div className="px-5 pb-4 text-sm text-[#5C685C] leading-relaxed">{q.answer}</div></details>))}</div>
            </div>
          </div>
        )}

        {/* Results — Website Copy */}
        {result && tab === "website" && result.sections && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <h2 className="font-display font-bold text-xl text-[#1A201A] mb-6">Your {PAGE_TYPES.find(p => p.value === copyForm.page_type)?.label} Copy</h2>
            <div className="space-y-4">
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Page Title</div><div className="font-display font-bold text-lg text-[#1A201A]">{result.page_title}</div></div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Meta Description</div><div className="text-sm text-[#5C685C]">{result.meta_description}</div></div>
              {result.sections?.map((section, i) => (<div key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5"><div className="flex items-center gap-2 mb-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#E07A5F]/10 text-[#E07A5F] font-medium">{section.section_name}</span>{section.cta_text && <span className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32] font-medium">CTA: {section.cta_text}</span>}</div>{section.headline && <h3 className="font-display font-bold text-lg text-[#1A201A] mb-2">{section.headline}</h3>}<div className="text-sm text-[#374151] leading-relaxed" dangerouslySetInnerHTML={{ __html: section.body }} /></div>))}
            </div>
          </div>
        )}

        {/* Results — Email */}
        {result && tab === "email" && result.subject_line && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6"><h2 className="font-display font-bold text-xl text-[#1A201A]">Your Email</h2><Button variant="outline" size="sm" onClick={() => copyToClipboard(result.body, "email-body")} className="rounded-full border-[#E5E0D8] text-[#5C685C] hover:text-[#1A201A]">{copied === "email-body" ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}Copy HTML</Button></div>
            <div className="space-y-4">
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Subject Line</div><div className="font-display font-bold text-lg text-[#1A201A]">{result.subject_line}</div></div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Preheader</div><div className="text-sm text-[#5C685C]">{result.preheader}</div></div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-2">Email Body</div><p className="text-sm text-[#5C685C] mb-3">{result.greeting}</p><div className="text-sm text-[#374151] leading-relaxed" dangerouslySetInnerHTML={{ __html: result.body }} /><p className="text-sm text-[#5C685C] mt-3">{result.sign_off}</p>{result.ps_line && <p className="text-sm text-[#9CA89C] mt-2 italic">P.S. {result.ps_line}</p>}</div>
              <div className="flex items-center gap-3"><span className="text-xs px-3 py-1.5 rounded-full bg-[#2D3E32] text-[#FDFBF7] font-medium">{result.cta_text}</span><span className="text-xs text-[#9CA89C]">{result.cta_link_text}</span></div>
            </div>
          </div>
        )}

        {/* Results — Social Captions */}
        {result && tab === "social" && result.captions && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <h2 className="font-display font-bold text-xl text-[#1A201A] mb-6">Your Social Captions</h2>
            <div className="space-y-4">
              {result.captions?.map((cap, i) => (
                <div key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3"><span className="text-xs px-2 py-0.5 rounded-full bg-[#E07A5F]/10 text-[#E07A5F] font-medium">Option {i + 1}</span><span className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32] font-medium">{cap.best_for}</span></div>
                  <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line mb-3">{cap.text}</p>
                  <div className="flex gap-1.5 flex-wrap">{cap.hashtags?.map((tag) => (<span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32]">{tag}</span>))}</div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cap.text + "\n\n" + (cap.hashtags || []).join(" "), `social-${i}`)} className="mt-3 text-[#5C685C] hover:text-[#1A201A] rounded-full">{copied === `social-${i}` ? <CheckCircle2 size={14} className="mr-1 text-green-500" /> : <Copy size={14} className="mr-1" />}Copy caption</Button>
                </div>
              ))}
              {result.visual_ideas?.length > 0 && (<div className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-4"><div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-2">Visual Ideas</div><ul className="space-y-1">{result.visual_ideas.map((idea, i) => (<li key={i} className="text-sm text-[#5C685C] flex items-start gap-2"><Camera size={14} className="text-[#81B29A] mt-0.5 shrink-0" />{idea}</li>))}</ul></div>)}
              {result.best_posting_time && (<div className="text-sm text-[#5C685C] flex items-center gap-2"><Clock size={14} className="text-[#81B29A]" />Best time to post: {result.best_posting_time}</div>)}
            </div>
          </div>
        )}

        {/* Results — Repurpose */}
        {result && tab === "repurpose" && result.repurposed && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <h2 className="font-display font-bold text-xl text-[#1A201A] mb-2">Repurposed Content</h2>
            <p className="text-sm text-[#5C685C] mb-2">{result.source_summary}</p>
            {result.best_platform && <p className="text-sm text-[#81B29A] mb-6 flex items-center gap-1"><Star size={14} /> Best on: {result.best_platform}</p>}
            <div className="space-y-4">
              {Object.entries(result.repurposed).map(([platform, content]) => (
                <div key={platform} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2D3E32] text-white font-medium uppercase">{platform}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(
                      platform === "instagram" ? content.feed_caption : platform === "email" ? content.body_summary : content.post_text || content.caption || content.tweet_text || "",
                      `repurpose-${platform}`
                    )} className="text-[#5C685C] hover:text-[#1A201A] rounded-full text-xs">{copied === `repurpose-${platform}` ? <CheckCircle2 size={12} className="mr-1 text-green-500" /> : <Copy size={12} className="mr-1" />}Copy</Button>
                  </div>
                  {platform === "instagram" && (
                    <div className="space-y-2">
                      <p className="text-sm text-[#374151] whitespace-pre-line">{content.feed_caption}</p>
                      <div className="flex gap-1 flex-wrap">{content.hashtags?.map((tag, i) => (<span key={i} className="text-xs text-[#81B29A]">{tag}</span>))}</div>
                      {content.reel_hook && <div className="text-xs text-[#9CA89C] mt-2"><strong>Reel hook:</strong> {content.reel_hook}</div>}
                      {content.visual_idea && <div className="text-xs text-[#9CA89C]"><strong>Visual:</strong> {content.visual_idea}</div>}
                    </div>
                  )}
                  {platform === "facebook" && (
                    <div className="space-y-2">
                      <p className="text-sm text-[#374151]">{content.post_text}</p>
                      {content.best_time && <div className="text-xs text-[#9CA89C]">Best time: {content.best_time}</div>}
                    </div>
                  )}
                  {platform === "linkedin" && (
                    <div className="space-y-2">
                      {content.hook && <div className="text-xs font-medium text-[#E07A5F]">Hook: {content.hook}</div>}
                      <p className="text-sm text-[#374151] whitespace-pre-line">{content.post_text}</p>
                      <div className="flex gap-1 flex-wrap">{content.hashtags?.map((tag, i) => (<span key={i} className="text-xs text-[#81B29A]">{tag}</span>))}</div>
                    </div>
                  )}
                  {platform === "tiktok" && (
                    <div className="space-y-2">
                      {content.hook && <div className="text-xs font-medium text-[#E07A5F]">Hook: {content.hook}</div>}
                      <p className="text-sm text-[#374151]">{content.caption}</p>
                      {content.trend_angle && <div className="text-xs text-[#9CA89C]">Trend angle: {content.trend_angle}</div>}
                    </div>
                  )}
                  {platform === "email" && (
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-[#1A201A]">Subject: {content.subject_line}</div>
                      <div className="text-xs text-[#9CA89C]">Preview: {content.preview_text}</div>
                      <p className="text-sm text-[#374151]">{content.body_summary}</p>
                      {content.cta && <span className="text-xs px-2 py-0.5 rounded-full bg-[#2D3E32] text-white">{content.cta}</span>}
                    </div>
                  )}
                  {platform === "twitter" && (
                    <div className="space-y-2">
                      <p className="text-sm text-[#374151]">{content.tweet_text}</p>
                      {content.thread_idea && <div className="text-xs text-[#9CA89C]"><strong>Thread idea:</strong> {content.thread_idea}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {result.one_liner && (
              <div className="mt-4 bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-4">
                <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">One-liner (works everywhere)</div>
                <p className="text-sm text-[#1A201A] font-medium">{result.one_liner}</p>
              </div>
            )}
          </div>
        )}

        {/* Results — Image Prompts */}
        {result && tab === "images" && result.prompts && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6 lg:p-8">
            <h2 className="font-display font-bold text-xl text-[#1A201A] mb-2">Your Image Prompts</h2>
            <p className="text-sm text-[#5C685C] mb-6">{result.visual_direction}</p>
            <div className="space-y-6">
              {result.prompts?.map((prompt, i) => (
                <div key={i} className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#E07A5F]/10 text-[#E07A5F] font-medium">Prompt {prompt.prompt_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#81B29A]/10 text-[#2D3E32] font-medium">{prompt.best_for}</span>
                  </div>
                  <p className="text-sm text-[#5C685C] mb-4">{prompt.description}</p>

                  <div className="space-y-3">
                    <div className="relative">
                      <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Midjourney</div>
                      <pre className="bg-[#1A201A] text-[#E07A5F] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{prompt.midjourney_prompt}</pre>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prompt.midjourney_prompt, `mj-${i}`)} className="absolute top-6 right-2 text-[#E07A5F] hover:text-white rounded-full">{copied === `mj-${i}` ? <CheckCircle2 size={14} /> : <Copy size={14} />}</Button>
                    </div>

                    <div className="relative">
                      <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">DALL-E 3</div>
                      <pre className="bg-[#1A201A] text-[#81B29A] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{prompt.dalle_prompt}</pre>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prompt.dalle_prompt, `dalle-${i}`)} className="absolute top-6 right-2 text-[#81B29A] hover:text-white rounded-full">{copied === `dalle-${i}` ? <CheckCircle2 size={14} /> : <Copy size={14} />}</Button>
                    </div>

                    <div className="relative">
                      <div className="text-xs text-[#9CA89C] uppercase tracking-wide mb-1">Canva AI</div>
                      <pre className="bg-[#1A201A] text-[#F3F0E9] rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{prompt.canva_prompt}</pre>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prompt.canva_prompt, `canva-${i}`)} className="absolute top-6 right-2 text-[#F3F0E9] hover:text-white rounded-full">{copied === `canva-${i}` ? <CheckCircle2 size={14} /> : <Copy size={14} />}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {result.design_tips?.length > 0 && (
              <div className="mt-6 bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-5">
                <h3 className="font-display font-bold text-[#1A201A] mb-3">Design Tips</h3>
                <ul className="space-y-2">{result.design_tips.map((tip, i) => (<li key={i} className="text-sm text-[#5C685C] flex items-start gap-2"><Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />{tip}</li>))}</ul>
              </div>
            )}
            {result.free_alternatives?.length > 0 && (
              <div className="mt-4 bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-5">
                <h3 className="font-display font-bold text-[#1A201A] mb-3">Free Alternatives</h3>
                <ul className="space-y-1">{result.free_alternatives.map((alt, i) => (<li key={i} className="text-sm text-[#5C685C] flex items-start gap-2"><ExternalLink size={14} className="text-[#81B29A] mt-0.5 shrink-0" />{alt}</li>))}</ul>
              </div>
            )}
            {result.brand_consistency_tips && (
              <div className="mt-4 text-sm text-[#5C685C] bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-4">
                <strong className="text-[#1A201A]">Brand consistency:</strong> {result.brand_consistency_tips}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !busy && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`text-left p-5 rounded-2xl border transition-all hover:-translate-y-0.5 relative ${tab === t.id ? "bg-[#2D3E32] border-[#2D3E32] text-white" : "bg-white border-[#E5E0D8] hover:border-[#81B29A]"}`}>
                <t.icon size={24} className={tab === t.id ? "text-[#81B29A]" : "text-[#5C685C]"} />
                <div className={`mt-3 font-display font-bold ${tab === t.id ? "text-white" : "text-[#1A201A]"}`}>{t.label}</div>
                <div className={`mt-1 text-sm ${tab === t.id ? "text-white/70" : "text-[#5C685C]"}`}>{t.desc}</div>
                {t.new && <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-bold">NEW</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Code2(props) {
  return (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>);
}

function MapPin(props) {
  return (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);
}
