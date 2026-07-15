import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after scrolling past the hero
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300">
      <Link
        to="/audit"
        className="flex items-center gap-2 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6 py-3.5 shadow-lg shadow-[#2D3E32]/25 text-sm font-medium transition-all hover:scale-105"
      >
        <Sparkles size={16} className="text-[#81B29A]" />
        Run a free SEO audit
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
