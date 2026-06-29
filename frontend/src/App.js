import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/app/Common";
import OnboardingTour from "@/components/app/OnboardingTour";
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
import Billing from "@/pages/Billing";
import BillingSuccess from "@/pages/BillingSuccess";
import ConciergeOnboarding from "@/pages/ConciergeOnboarding";

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
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/app" element={<Protected><Dashboard /></Protected>} />
            <Route path="/app/projects" element={<Protected><Projects /></Protected>} />
            <Route path="/app/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
            <Route path="/app/audit" element={<Protected><Audit /></Protected>} />
            <Route path="/app/audits/:id" element={<Protected><AuditDetail /></Protected>} />
            <Route path="/app/ai-tools" element={<Protected><AiTools /></Protected>} />
            <Route path="/app/social" element={<Protected><Social /></Protected>} />
            <Route path="/app/ai-visibility" element={<Protected><AiVisibility /></Protected>} />
            <Route path="/app/billing" element={<Protected><Billing /></Protected>} />
            <Route path="/app/billing/success" element={<Protected><BillingSuccess /></Protected>} />
            <Route path="/app/concierge/onboarding" element={<Protected><ConciergeOnboarding /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
