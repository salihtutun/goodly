import "@/App.css";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PageLoader } from "@/components/app/Common";
import OnboardingTour from "@/components/app/OnboardingTour";
import ErrorBoundary from "@/components/app/ErrorBoundary";
import SupportWidget from "@/components/app/SupportWidget";
import { Toaster } from "sonner";

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

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}<OnboardingTour /></>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/app" replace />;
  return children;
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
      <BrowserRouter>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <SupportWidget />
    </div>
  );
}
