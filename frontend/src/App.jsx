import "@/App.css";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PageLoader } from "@/components/app/Common";
import OnboardingTour from "@/components/app/OnboardingTour";
import ErrorBoundary from "@/components/app/ErrorBoundary";
import SupportWidget from "@/components/app/SupportWidget";
import CookieConsent from "@/components/app/CookieConsent";
import ExitPopup from "@/components/app/ExitPopup";
import FloatingCTA from "@/components/app/FloatingCTA";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";

// Eager-loaded (critical path — landing, login, 404)
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// Lazy-loaded (below the fold)
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Projects = lazy(() => import("@/pages/Projects"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Audit = lazy(() => import("@/pages/Audit"));
const AuditDetail = lazy(() => import("@/pages/AuditDetail"));
const AiTools = lazy(() => import("@/pages/AiTools"));
const Social = lazy(() => import("@/pages/Social"));
const AiVisibility = lazy(() => import("@/pages/AiVisibility"));
const GbpAudit = lazy(() => import("@/pages/GbpAudit"));
const Billing = lazy(() => import("@/pages/Billing"));
const BillingSuccess = lazy(() => import("@/pages/BillingSuccess"));
const ConciergeOnboarding = lazy(() => import("@/pages/ConciergeOnboarding"));
const OnboardingWizard = lazy(() => import("@/pages/OnboardingWizard"));
const PublicAudit = lazy(() => import("@/pages/PublicAudit"));
const Referral = lazy(() => import("@/pages/Referral"));
const ErrorPage = lazy(() => import("@/pages/ErrorPage"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
// Free tools (lead magnets)
const MetaTagChecker = lazy(() => import("@/pages/tools/MetaTagChecker"));
const PageSpeedChecker = lazy(() => import("@/pages/tools/PageSpeedChecker"));
const MobileFriendlyChecker = lazy(() => import("@/pages/tools/MobileFriendlyChecker"));
const KeywordDensityChecker = lazy(() => import("@/pages/tools/KeywordDensityChecker"));
const SSLChecker = lazy(() => import("@/pages/tools/SSLChecker"));
const SchemaValidator = lazy(() => import("@/pages/tools/SchemaValidator"));
const RobotsChecker = lazy(() => import("@/pages/tools/RobotsChecker"));
const HeadingChecker = lazy(() => import("@/pages/tools/HeadingChecker"));
// Free Tools Hub
const FreeTools = lazy(() => import("@/pages/FreeTools"));
// Blog
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
// Competitor Comparison
const CompetitorComparison = lazy(() => import("@/pages/CompetitorComparison"));
// Admin Dashboard
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
// Analytics Dashboard
const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
// Agency Pages
const AgencyDashboard = lazy(() => import("@/pages/AgencyDashboard"));
const AgencyClientDetail = lazy(() => import("@/pages/AgencyClientDetail"));
// Status Page
const StatusPage = lazy(() => import("@/pages/StatusPage"));
// Changelog
const Changelog = lazy(() => import("@/pages/Changelog"));
// Knowledge Base
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
// Affiliate Program
const AffiliateProgram = lazy(() => import("@/pages/AffiliateProgram"));
// Pricing
const Pricing = lazy(() => import("@/pages/Pricing"));
// Blog Admin
const BlogAdmin = lazy(() => import("@/pages/BlogAdmin"));
// Shared Audit
const SharedAudit = lazy(() => import("@/pages/SharedAudit"));
// Industry Pages
const IndustryPage = lazy(() => import("@/pages/IndustryPage"));
// Competitor Landing
const CompetitorLanding = lazy(() => import("@/pages/CompetitorLanding"));
// Comparison Pages
const ComparisonPage = lazy(() => import("@/pages/ComparisonPage"));
// ROI Calculator
const RoiCalculator = lazy(() => import("@/pages/RoiCalculator"));
// Testimonials
const TestimonialsPage = lazy(() => import("@/pages/TestimonialsPage"));
// Referral
const ReferralPage = lazy(() => import("@/pages/ReferralPage"));
// Checklist
const ChecklistPage = lazy(() => import("@/pages/ChecklistPage"));
// AI Content Studio
const ContentStudio = lazy(() => import("@/pages/ContentStudio"));
const ContentStudioLanding = lazy(() => import("@/pages/ContentStudioLanding"));

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}<OnboardingTour /></>;
}

// Admin-only route gate — backend enforces authorization too; this just
// keeps non-admins from landing on broken dashboards.
function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/app" replace />;
  return children;
}

// Agency dashboard is for paid plans that can manage client accounts.
const AGENCY_PLANS = new Set(["starter", "pro", "concierge"]);

function AgencyOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && !AGENCY_PLANS.has(user.plan)) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function AnalyticsTracker() {
  useAnalytics();
  return null;
}

export default function App() {
  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#FDFBF7", color: "#1A201A", border: "1px solid #E5E0D8" },
        }}
      />
      <HelmetProvider>
      <BrowserRouter>
        <AnalyticsTracker />
        <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/audit" element={<Lazy><PublicAudit /></Lazy>} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Lazy><Register /></Lazy></PublicOnly>} />
            <Route path="/verify-email" element={<Lazy><VerifyEmail /></Lazy>} />
            <Route path="/forgot-password" element={<PublicOnly><Lazy><ForgotPassword /></Lazy></PublicOnly>} />
            <Route path="/reset-password" element={<Lazy><ResetPassword /></Lazy>} />
            <Route path="/app" element={<Protected><Lazy><Dashboard /></Lazy></Protected>} />
            <Route path="/app/projects" element={<Protected><Lazy><Projects /></Lazy></Protected>} />
            <Route path="/app/projects/:id" element={<Protected><Lazy><ProjectDetail /></Lazy></Protected>} />
            <Route path="/app/audit" element={<Protected><Lazy><Audit /></Lazy></Protected>} />
            <Route path="/app/audits/:id" element={<Protected><Lazy><AuditDetail /></Lazy></Protected>} />
            <Route path="/app/ai-tools" element={<Protected><Lazy><AiTools /></Lazy></Protected>} />
            <Route path="/app/social" element={<Protected><Lazy><Social /></Lazy></Protected>} />
            <Route path="/app/ai-visibility" element={<Protected><Lazy><AiVisibility /></Lazy></Protected>} />
            <Route path="/app/gbp" element={<Protected><Lazy><GbpAudit /></Lazy></Protected>} />
            <Route path="/app/billing" element={<Protected><Lazy><Billing /></Lazy></Protected>} />
            <Route path="/app/billing/success" element={<Protected><Lazy><BillingSuccess /></Lazy></Protected>} />
            <Route path="/app/concierge/onboarding" element={<Protected><Lazy><ConciergeOnboarding /></Lazy></Protected>} />
            <Route path="/app/onboarding" element={<Protected><Lazy><OnboardingWizard /></Lazy></Protected>} />
            <Route path="/app/referral" element={<Protected><Lazy><Referral /></Lazy></Protected>} />
            <Route path="/error" element={<Lazy><ErrorPage /></Lazy>} />
            <Route path="/terms" element={<Lazy><Terms /></Lazy>} />
            <Route path="/privacy" element={<Lazy><Privacy /></Lazy>} />
            {/* Free SEO tools — lead magnets */}
            <Route path="/tools/meta-tag-checker" element={<Lazy><MetaTagChecker /></Lazy>} />
            <Route path="/tools/page-speed" element={<Lazy><PageSpeedChecker /></Lazy>} />
            <Route path="/tools/mobile-friendly" element={<Lazy><MobileFriendlyChecker /></Lazy>} />
            <Route path="/tools/keyword-density" element={<Lazy><KeywordDensityChecker /></Lazy>} />
            <Route path="/tools/ssl-checker" element={<Lazy><SSLChecker /></Lazy>} />
            <Route path="/tools/schema-validator" element={<Lazy><SchemaValidator /></Lazy>} />
            <Route path="/tools/robots-checker" element={<Lazy><RobotsChecker /></Lazy>} />
            <Route path="/tools/heading-checker" element={<Lazy><HeadingChecker /></Lazy>} />
            {/* Free Tools Hub */}
            <Route path="/tools" element={<Lazy><FreeTools /></Lazy>} />
            {/* Blog */}
            <Route path="/blog" element={<Lazy><Blog /></Lazy>} />
            <Route path="/blog/:slug" element={<Lazy><BlogPost /></Lazy>} />
            {/* Competitor Comparison */}
            <Route path="/app/competitors" element={<Protected><Lazy><CompetitorComparison /></Lazy></Protected>} />
            {/* Admin Dashboard */}
            <Route path="/app/admin" element={<AdminOnly><Lazy><AdminDashboard /></Lazy></AdminOnly>} />
            {/* Analytics Dashboard */}
            <Route path="/app/admin/analytics" element={<AdminOnly><Lazy><AnalyticsDashboard /></Lazy></AdminOnly>} />
            {/* Agency Pages */}
            <Route path="/app/agency" element={<AgencyOnly><Lazy><AgencyDashboard /></Lazy></AgencyOnly>} />
            <Route path="/app/agency/clients/:clientId" element={<AgencyOnly><Lazy><AgencyClientDetail /></Lazy></AgencyOnly>} />
            {/* Public Status Page */}
            <Route path="/status" element={<Lazy><StatusPage /></Lazy>} />
            {/* Changelog */}
            <Route path="/changelog" element={<Lazy><Changelog /></Lazy>} />
            {/* Knowledge Base */}
            <Route path="/help" element={<Lazy><KnowledgeBase /></Lazy>} />
            {/* Affiliate Program */}
            <Route path="/app/affiliate" element={<Protected><Lazy><AffiliateProgram /></Lazy></Protected>} />
            {/* Pricing Page */}
            <Route path="/pricing" element={<Lazy><Pricing /></Lazy>} />
            {/* Blog Admin */}
            <Route path="/app/admin/blog" element={<AdminOnly><Lazy><BlogAdmin /></Lazy></AdminOnly>} />
            {/* Concierge CRM route removed until its backend endpoints exist */}
            {/* Shared Audit (public) */}
            <Route path="/shared/:token" element={<Lazy><SharedAudit /></Lazy>} />
            {/* Industry Landing Pages */}
            <Route path="/restaurants" element={<Lazy><IndustryPage industry="restaurant" /></Lazy>} />
            <Route path="/plumbers" element={<Lazy><IndustryPage industry="plumber" /></Lazy>} />
            <Route path="/salons" element={<Lazy><IndustryPage industry="salon" /></Lazy>} />
            <Route path="/dentists" element={<Lazy><IndustryPage industry="dentist" /></Lazy>} />
            <Route path="/retail" element={<Lazy><IndustryPage industry="retail" /></Lazy>} />
            <Route path="/lawyers" element={<Lazy><IndustryPage industry="lawyer" /></Lazy>} />
            <Route path="/home-services" element={<Lazy><IndustryPage industry="homeservices" /></Lazy>} />
            <Route path="/real-estate" element={<Lazy><IndustryPage industry="realestate" /></Lazy>} />
            <Route path="/automotive" element={<Lazy><IndustryPage industry="automotive" /></Lazy>} />
            {/* Competitor Analysis Landing */}
            <Route path="/competitors" element={<Lazy><CompetitorLanding /></Lazy>} />
            {/* Comparison Pages */}
            <Route path="/vs/ahrefs" element={<Lazy><ComparisonPage tool="ahrefs" /></Lazy>} />
            <Route path="/vs/semrush" element={<Lazy><ComparisonPage tool="semrush" /></Lazy>} />
            <Route path="/vs/moz" element={<Lazy><ComparisonPage tool="moz" /></Lazy>} />
            <Route path="/vs/ubersuggest" element={<Lazy><ComparisonPage tool="ubersuggest" /></Lazy>} />
            <Route path="/vs/seranking" element={<Lazy><ComparisonPage tool="seranking" /></Lazy>} />
            <Route path="/vs/agency" element={<Lazy><ComparisonPage tool="agency" /></Lazy>} />
            <Route path="/vs/localfalcon" element={<Lazy><ComparisonPage tool="localfalcon" /></Lazy>} />
            <Route path="/vs/brightlocal" element={<Lazy><ComparisonPage tool="brightlocal" /></Lazy>} />
            {/* ROI Calculator */}
            <Route path="/roi-calculator" element={<Lazy><RoiCalculator /></Lazy>} />
            {/* Testimonials */}
            <Route path="/stories" element={<Lazy><TestimonialsPage /></Lazy>} />
            {/* Referral */}
            <Route path="/refer" element={<Lazy><ReferralPage /></Lazy>} />
            {/* Checklist */}
            <Route path="/checklist" element={<Lazy><ChecklistPage /></Lazy>} />
            {/* AI Content Studio */}
            <Route path="/app/content-studio" element={<Protected><Lazy><ContentStudio /></Lazy></Protected>} />
            <Route path="/content-studio" element={<Lazy><ContentStudioLanding /></Lazy>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
          <SupportWidget />
          <CookieConsent />
          <ExitPopup />
          <FloatingCTA />
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      </HelmetProvider>
    </div>
  );
}
