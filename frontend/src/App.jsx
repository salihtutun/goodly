import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PageLoader } from "@/components/app/Common";
import OnboardingTour from "@/components/app/OnboardingTour";
import ErrorBoundary from "@/components/app/ErrorBoundary";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Audit from "@/pages/Audit";
import AuditDetail from "@/pages/AuditDetail";
import AiTools from "@/pages/AiTools";
import Social from "@/pages/Social";
import AiVisibility from "@/pages/AiVisibility";
import GbpAudit from "@/pages/GbpAudit";
import Billing from "@/pages/Billing";
import BillingSuccess from "@/pages/BillingSuccess";
import ConciergeOnboarding from "@/pages/ConciergeOnboarding";
import OnboardingWizard from "@/pages/OnboardingWizard";
import PublicAudit from "@/pages/PublicAudit";
import Referral from "@/pages/Referral";
import NotFound from "@/pages/NotFound";
import ErrorPage from "@/pages/ErrorPage";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

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
            <Route path="/audit" element={<PublicAudit />} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<Protected><Dashboard /></Protected>} />
            <Route path="/app/projects" element={<Protected><Projects /></Protected>} />
            <Route path="/app/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
            <Route path="/app/audit" element={<Protected><Audit /></Protected>} />
            <Route path="/app/audits/:id" element={<Protected><AuditDetail /></Protected>} />
            <Route path="/app/ai-tools" element={<Protected><AiTools /></Protected>} />
            <Route path="/app/social" element={<Protected><Social /></Protected>} />
            <Route path="/app/ai-visibility" element={<Protected><AiVisibility /></Protected>} />
            <Route path="/app/gbp" element={<Protected><GbpAudit /></Protected>} />
            <Route path="/app/billing" element={<Protected><Billing /></Protected>} />
            <Route path="/app/billing/success" element={<Protected><BillingSuccess /></Protected>} />
            <Route path="/app/concierge/onboarding" element={<Protected><ConciergeOnboarding /></Protected>} />
            <Route path="/app/onboarding" element={<Protected><OnboardingWizard /></Protected>} />
            <Route path="/app/referral" element={<Protected><Referral /></Protected>} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}
