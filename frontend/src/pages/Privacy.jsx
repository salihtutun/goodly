import { Link } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Privacy() {
  usePageMeta({ title: "Privacy Policy", description: "Goodly Privacy Policy — how we collect, use, and protect your data." });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link to="/"><Logo /></Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-4xl text-[#1A201A] tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-[#5C685C]">Last updated: June 2026</p>

        <section className="mt-10 space-y-8 text-[#1A201A] leading-relaxed">
          <div>
            <h2 className="font-display font-bold text-xl mb-3">1. Information We Collect</h2>
            <p className="text-[#5C685C]">We collect information you provide directly: email address, name, business details (website URLs, business names, categories, locations), and payment information (processed securely by Stripe — we never store full credit card numbers). We also collect usage data: pages visited, features used, and audit history.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">2. How We Use Your Information</h2>
            <p className="text-[#5C685C]">We use your information to: provide and improve the Service, process payments, send audit digests and product updates (with opt-out), and respond to support requests. We do not sell your personal information to third parties.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">3. Data Storage and Security</h2>
            <p className="text-[#5C685C]">Your data is stored on MongoDB databases with encryption at rest. We use industry-standard security practices including JWT authentication, rate limiting, and HTTPS encryption. However, no method of electronic storage is 100% secure.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">4. AI Processing</h2>
            <p className="text-[#5C685C]">Some features use Claude (Anthropic) to generate recommendations. When you use AI features, your inputs (business names, descriptions, URLs) are sent to Anthropic's API for processing. Anthropic does not train on customer data. See Anthropic's privacy policy for details.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">5. Cookies</h2>
            <p className="text-[#5C685C]">We use essential cookies for authentication (JWT tokens stored in HttpOnly cookies). We do not use tracking cookies or third-party advertising cookies. You can disable cookies in your browser, but the Service may not function properly.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">6. Third-Party Services</h2>
            <p className="text-[#5C685C]">We use the following third-party services: Stripe (payments), Resend (email), Anthropic (AI), and MongoDB (database). Each has its own privacy policy. We encourage you to review them.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">7. Your Rights</h2>
            <p className="text-[#5C685C]">You may request access to, correction of, or deletion of your personal data at any time by contacting us. You may export your audit data from the dashboard. You may delete your account by contacting support.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">8. Contact</h2>
            <p className="text-[#5C685C]">For privacy-related inquiries, contact us at <a href="mailto:privacy@goodly.app" className="text-[#2D3E32] underline">privacy@goodly.app</a>.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
