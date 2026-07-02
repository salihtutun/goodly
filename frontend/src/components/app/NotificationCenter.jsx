import { useState, useEffect, useRef } from "react";
import { Bell, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // Notifications endpoint may not exist yet — use mock data
      setNotifications(getMockNotifications());
      setUnread(2);
    }
  };

  const markRead = async (id) => {
    try { await api.post(`/notifications/${id}/read`); } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    try { await api.post("/notifications/read-all"); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case "rank_up": return <TrendingUp size={16} className="text-green-500" />;
      case "rank_down": return <TrendingDown size={16} className="text-red-500" />;
      case "alert": return <AlertTriangle size={16} className="text-amber-500" />;
      case "achievement": return <CheckCircle2 size={16} className="text-[#81B29A]" />;
      default: return <Bell size={16} className="text-[#5C685C]" />;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-[#F3F0E9] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#5C685C]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#E07A5F] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E0D8] overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E0D8]">
            <div className="font-display font-bold text-sm text-[#1A201A]">Notifications</div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#81B29A] hover:text-[#5C9A7A] font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#9CA89C]">
                <Bell size={32} className="mx-auto mb-3 text-[#D4CFC4]" />
                No notifications yet. We'll alert you when something changes.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-5 py-3.5 border-b border-[#E5E0D8]/50 hover:bg-[#FDFBF7] transition-colors flex items-start gap-3 ${
                    !n.read ? "bg-[#F3F0E9]/50" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1A201A] font-medium leading-snug">{n.title}</div>
                    <div className="text-xs text-[#5C685C] mt-0.5">{n.body}</div>
                    <div className="text-[10px] text-[#9CA89C] mt-1.5">{n.time}</div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#E07A5F] mt-1.5 shrink-0" />}
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t border-[#E5E0D8]">
            <Link
              to="/app"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-[#81B29A] hover:text-[#5C9A7A] font-medium py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockNotifications() {
  return [
    {
      id: "1",
      type: "rank_up",
      title: "Keyword moved up!",
      body: "'best pizza NYC' moved from #8 to #4 on Google.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      type: "alert",
      title: "3 critical issues found",
      body: "Your latest audit found missing meta tags and slow page speed.",
      time: "1 day ago",
      read: false,
    },
    {
      id: "3",
      type: "achievement",
      title: "Score Improver badge earned!",
      body: "Your SEO score improved by 15+ points. Great work!",
      time: "3 days ago",
      read: true,
    },
    {
      id: "4",
      type: "rank_down",
      title: "Keyword dropped",
      body: "'emergency plumber' dropped from #3 to #7. Check your audit.",
      time: "5 days ago",
      read: true,
    },
  ];
}
