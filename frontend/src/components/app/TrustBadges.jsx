import { useEffect, useState } from "react";
import { ShieldCheck, Users, Star, TrendingUp } from "lucide-react";

export default function TrustBadges() {
  const [counts, setCounts] = useState({ audits: 0, businesses: 0, rating: 0, improvement: 0 });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const target = { audits: 1247, businesses: 843, rating: 4.9, improvement: 34 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        audits: Math.floor(target.audits * progress),
        businesses: Math.floor(target.businesses * progress),
        rating: Math.round(target.rating * progress * 10) / 10,
        improvement: Math.floor(target.improvement * progress),
      });
      if (step >= steps) {
        setCounts(target);
        setAnimated(true);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-white border-y border-[#E5E0D8] py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-[#81B29A]/15 flex items-center justify-center">
                <TrendingUp size={22} className="text-[#81B29A]" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-[#1A201A]">
              {counts.audits.toLocaleString()}+
            </div>
            <div className="text-sm text-[#5C685C]">Free audits run</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-[#E07A5F]/15 flex items-center justify-center">
                <Users size={22} className="text-[#E07A5F]" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-[#1A201A]">
              {counts.businesses.toLocaleString()}+
            </div>
            <div className="text-sm text-[#5C685C]">Businesses helped</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-[#2D3E32]/15 flex items-center justify-center">
                <Star size={22} className="text-[#2D3E32]" strokeWidth={1.75} fill="#2D3E32" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-[#1A201A]">
              {counts.rating}
            </div>
            <div className="text-sm text-[#5C685C]">Average rating</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-[#81B29A]/15 flex items-center justify-center">
                <ShieldCheck size={22} className="text-[#81B29A]" strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-[#1A201A]">
              +{counts.improvement}
            </div>
            <div className="text-sm text-[#5C685C]">Avg. score improvement</div>
          </div>
        </div>
      </div>
    </section>
  );
}
