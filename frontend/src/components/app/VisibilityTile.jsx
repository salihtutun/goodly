import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { ScoreRing } from "@/components/app/Common";
import { Globe, Instagram, Music2, Youtube, Bot, ArrowRight } from "lucide-react";

const ICONS = {
  google: Globe,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  ai_assistants: Bot,
};

const LABELS = {
  google: "Google",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  ai_assistants: "AI Assistants",
};

const ROUTES = {
  google: "/app/audit",
  instagram: "/app/social",
  tiktok: "/app/social",
  youtube: "/app/social",
  ai_assistants: "/app/ai-visibility",
};

export default function VisibilityTile() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard/visibility")
      .then(({ data }) => setData(data))
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (error) return <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 text-center"><p className="text-sm text-[#5C685C]">Visibility data unavailable.</p></div>;
  if (!data) return null;

  const order = ["google", "instagram", "tiktok", "youtube", "ai_assistants"];
  const informed = Math.round((data.informed_fraction || 0) * 100);

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6" data-testid="visibility-tile">
      <div className="flex items-start gap-6 flex-wrap">
        <div className="flex flex-col items-center">
          <ScoreRing score={data.overall_score ?? 0} size={130}/>
          <div className="mt-3 text-xs text-[#5C685C]">
            {data.overall_score == null ? "No data yet" : `Visibility score`}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="label-eyebrow">Your north-star</div>
          <h3 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">Unified Visibility Score</h3>
          <p className="mt-2 text-sm text-[#5C685C]">
            How findable your business is across every channel that matters.
            {informed > 0 && informed < 100 && (
              <span className="ml-1">Currently <strong className="text-[#1A201A]">{informed}% informed</strong> — run more audits to lock in your real number.</span>
            )}
            {informed === 0 && (
              <span className="ml-1">Run your first audit to start seeing data.</span>
            )}
          </p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {order.map((k) => {
              const Icon = ICONS[k];
              const item = data.breakdown[k];
              const has = item.has_data;
              return (
                <button key={k}
                  onClick={() => navigate(ROUTES[k])}
                  data-testid={`visibility-tile-${k}`}
                  className={`text-left p-3 rounded-xl border transition-all hover:-translate-y-0.5 ${
                    has ? "bg-[#F3F0E9] border-[#E5E0D8]" : "bg-white border-dashed border-[#E5E0D8] hover:border-[#81B29A]"
                  }`}>
                  <div className="flex items-center justify-between">
                    <Icon size={16} className="text-[#5C685C]"/>
                    <ArrowRight size={12} className="text-[#5C685C] opacity-0 hover:opacity-100"/>
                  </div>
                  <div className="mt-2 font-display font-bold text-xl text-[#1A201A]">
                    {has ? item.score : "—"}
                  </div>
                  <div className="text-[11px] text-[#5C685C] mt-0.5">{LABELS[k]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
