import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/app/Common";
import { LayoutDashboard, FolderKanban, Gauge, Sparkles, LogOut, User, CreditCard, ClipboardList } from "lucide-react";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard", end: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban, testId: "nav-projects" },
  { to: "/app/audit", label: "SEO Audit", icon: Gauge, testId: "nav-audit" },
  { to: "/app/ai-tools", label: "AI Studio", icon: Sparkles, testId: "nav-ai" },
  { to: "/app/concierge/onboarding", label: "Concierge brief", icon: ClipboardList, testId: "nav-concierge" },
  { to: "/app/billing", label: "Billing", icon: CreditCard, testId: "nav-billing" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-[#FDFBF7]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 h-screen">
        <div className="p-6 border-b border-[#E5E0D8]">
          <Link to="/app"><Logo /></Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, testId, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testId}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? "bg-[#2D3E32] text-[#FDFBF7]"
                    : "text-[#5C685C] hover:bg-[#F3F0E9] hover:text-[#1A201A]"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E5E0D8] space-y-2">
          <div className="px-3 py-2 flex items-center gap-2.5 rounded-xl bg-[#F3F0E9]">
            <div className="h-8 w-8 rounded-full bg-[#81B29A] flex items-center justify-center text-[#FDFBF7] font-medium text-sm">
              {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#1A201A] truncate flex items-center gap-2">
                {user?.name}
                {user?.plan && user.plan !== "free" && (
                  <span className="text-[10px] uppercase tracking-wider bg-[#E07A5F] text-[#FDFBF7] px-1.5 py-0.5 rounded-full" data-testid="user-plan-badge">
                    {user.plan}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#5C685C] truncate">{user?.email}</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5C685C] hover:text-[#E07A5F] transition-colors rounded-xl"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#FDFBF7] border-b border-[#E5E0D8] flex items-center justify-between px-4 z-40">
        <Link to="/app"><Logo size="sm" /></Link>
        <button onClick={handleLogout} className="text-sm text-[#5C685C] flex items-center gap-1.5" data-testid="logout-btn-mobile">
          <User size={16}/> {user?.name?.split(" ")[0]}
        </button>
      </div>

      <main className="flex-1 min-w-0 md:p-10 p-5 pt-20 md:pt-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FDFBF7] border-t border-[#E5E0D8] flex z-40">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 py-3 flex flex-col items-center gap-1 text-[11px] ${
                isActive ? "text-[#2D3E32]" : "text-[#5C685C]"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
