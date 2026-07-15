import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, MousePointerClick, Eye, BarChart3, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { Eyebrow } from "@/components/app/Common";

export default function SearchPerformance({ projectUrl, projectName }) {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(28);

  useEffect(() => {
    if (!projectUrl) return;
    fetchData();
  }, [projectUrl, days]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, trendRes] = await Promise.all([
        api.get("/gsc/analytics", { params: { site_url: projectUrl, days, limit: 20 } }),
        api.get("/gsc/trend", { params: { site_url: projectUrl, days: Math.min(days, 90) } }),
      ]);
      setData(analyticsRes.data);
      setTrend(trendRes.data);
    } catch (e) {
      if (e?.response?.status === 501) {
        setError("Google Search Console integration is not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON to enable.");
      } else {
        setError("Could not load search data. Make sure your site is verified in Google Search Console.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-[#81B29A]" />
          <h2 className="font-display font-bold text-lg text-[#1A201A]">Search Performance</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-[#F3F0E9] rounded w-1/3" />
          <div className="h-40 bg-[#F3F0E9] rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-[#81B29A]" />
          <h2 className="font-display font-bold text-lg text-[#1A201A]">Search Performance</h2>
        </div>
        <div className="bg-[#F3F0E9] rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-[#E6A57E] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#1A201A]">Not available</div>
            <div className="text-xs text-[#5C685C] mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.summary) return null;

  const { summary, rows } = data;
  const trendData = trend?.daily || [];

  // Calculate trend direction
  const trendUp = trendData.length >= 2 &&
    trendData[trendData.length - 1].clicks > trendData[0].clicks;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-[#81B29A]" />
          <h2 className="font-display font-bold text-lg text-[#1A201A]">Search Performance</h2>
          <span className="text-xs text-[#9CA89C] bg-[#F3F0E9] px-2 py-0.5 rounded-full">Google Search Console</span>
        </div>
        <div className="flex items-center gap-2">
          {[7, 28, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                days === d ? "bg-[#2D3E32] text-white" : "text-[#5C685C] hover:bg-[#F3F0E9]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          icon={MousePointerClick}
          label="Total clicks"
          value={summary.total_clicks?.toLocaleString()}
          accent="#2D3E32"
        />
        <SummaryCard
          icon={Eye}
          label="Impressions"
          value={summary.total_impressions?.toLocaleString()}
          accent="#81B29A"
        />
        <SummaryCard
          icon={BarChart3}
          label="Avg. CTR"
          value={`${summary.avg_ctr}%`}
          accent="#E07A5F"
        />
        <SummaryCard
          icon={trendUp ? TrendingUp : TrendingDown}
          label="Avg. position"
          value={summary.avg_position?.toFixed(1)}
          accent={trendUp ? "#81B29A" : "#E6A57E"}
        />
      </div>

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-medium text-[#5C685C] mb-2">Clicks over time</div>
          <div className="flex items-end gap-1 h-24">
            {trendData.slice(-30).map((point, i) => {
              const maxClicks = Math.max(...trendData.map(d => d.clicks), 1);
              const heightPct = Math.max(4, (point.clicks / maxClicks) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center min-w-0" title={`${point.date}: ${point.clicks} clicks`}>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-sm bg-[#81B29A]/60 hover:bg-[#81B29A] transition-colors"
                      style={{ height: `${heightPct}%`, minHeight: 2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-[#9CA89C] mt-1">
            <span>{trendData[0]?.date}</span>
            <span>{trendData[trendData.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Top queries */}
      {rows.length > 0 && (
        <div>
          <div className="text-xs font-medium text-[#5C685C] mb-2">Top search queries</div>
          <div className="space-y-1">
            {rows.slice(0, 10).map((row, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-[#FDFBF7] text-sm">
                <span className="text-[10px] text-[#9CA89C] w-4">{i + 1}</span>
                <span className="flex-1 text-[#1A201A] truncate">{row.query || row.page}</span>
                <span className="text-xs text-[#5C685C] w-16 text-right">{row.clicks} clicks</span>
                <span className="text-xs text-[#9CA89C] w-16 text-right">{row.impressions} imp</span>
                <span className="text-xs font-medium w-12 text-right" style={{ color: row.position <= 3 ? "#81B29A" : row.position <= 10 ? "#E6A57E" : "#9CA89C" }}>
                  #{row.position}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#E5E0D8] text-xs text-[#9CA89C] flex items-center gap-1">
        Data from Google Search Console · Last {days} days
        <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="text-[#81B29A] hover:underline inline-flex items-center gap-0.5 ml-1">
          Open GSC <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-[10px] text-[#9CA89C] uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display font-bold text-xl text-[#1A201A]">{value ?? "—"}</div>
    </div>
  );
}
