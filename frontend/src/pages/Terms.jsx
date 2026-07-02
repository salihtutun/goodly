import { Link } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Terms() {
  usePageMeta({ title: "Terms of Service", description: "Goodly Terms of Service — our commitment to you and your responsibilities as a user." });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link to="/"><Logo /></Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-4xl text-[#1A201A] tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-[#5C685C]">Last updated: June 2026</p>

        <section className="mt-10 space-y-8 text-[#1A201A] leading-relaxed">
          <div>
            <h2 className="font-display font-bold text-xl mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#5C685C]">By accessing or using Goodly ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">2. Description of Service</h2>
            <p className="text-[#5C685C]">Goodly provides SEO audits, social media presence analysis, AI visibility assessments, and related visibility tools for businesses. The Service includes both free self-serve tools and paid concierge services.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">3. User Accounts</h2>
            <p className="text-[#5C685C]">You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">4. Payment Terms</h2>
            <p className="text-[#5C685C]">Paid plans are billed monthly via Stripe. You may cancel at any time from your Billing page. Refunds are handled on a case-by-case basis. The Concierge plan includes a 90-day page-one ranking goal; if not met, month 4 is free.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">5. Acceptable Use</h2>
            <p className="text-[#5C685C]">You agree not to misuse the Service, including but not limited to: attempting to gain unauthorized access, using the Service for illegal purposes, or interfering with the Service's operation. We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">6. Intellectual Property</h2>
            <p className="text-[#5C685C]">The Service and its original content, features, and functionality are owned by Goodly and are protected by international copyright, trademark, and other intellectual property laws. Audit results and AI-generated recommendations belong to you.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">7. Limitation of Liability</h2>
            <p className="text-[#5C685C]">Goodly provides the Service on an "as is" basis. We do not guarantee specific SEO rankings, traffic increases, or business outcomes. Our AI-generated recommendations are best-effort guidance and should be reviewed by a human before implementation.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl mb-3">8. Contact</h2>
            <p className="text-[#5C685C]">For questions about these Terms, contact us at <a href="mailto:legal@goodly.app" className="text-[#2D3E32] underline">legal@goodly.app</a>.</p>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#E5E0D8] py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-center gap-6 text-sm text-[#5C685C]">
          <Link to="/privacy" className="hover:text-[#1A201A]">Privacy Policy</Link>
          <span>·</span>
          <Link to="/" className="hover:text-[#1A201A]">Home</Link>
          <span>·</span>
          <a href="mailto:hello@goodly.app" className="hover:text-[#1A201A]">Contact</a>
        </div>
      </footer>
    </div>
  );
}
