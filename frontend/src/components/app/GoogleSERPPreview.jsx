import { Globe } from "lucide-react";

/**
 * GoogleSERPPreview — renders a realistic Google search result card.
 * Shows small business owners exactly how their site appears in Google.
 *
 * Props:
 *   title       — page title (blue link text)
 *   url         — display URL (green)
 *   description — meta description (black body text)
 *   favicon     — optional favicon URL
 *   className   — optional wrapper class
 */
export default function GoogleSERPPreview({
  title = "Your Page Title",
  url = "yourbusiness.com",
  description = "Your meta description appears here. This is what potential customers read before clicking.",
  favicon,
  className = "",
}) {
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const domain = displayUrl.split("/")[0];

  return (
    <div className={`bg-white border border-[#E5E0D8] rounded-xl p-5 ${className}`}>
      {/* Google-style header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F3F0E9]">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </span>
        </div>
        <span className="text-xs text-[#9CA89C] ml-auto">Search result preview</span>
      </div>

      {/* Result card */}
      <div className="max-w-[600px]">
        {/* Favicon + URL line */}
        <div className="flex items-center gap-1.5 mb-1">
          {favicon ? (
            <img src={favicon} alt="" className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <Globe size={14} className="text-[#9CA89C]" />
          )}
          <span className="text-xs text-[#202124]">{domain}</span>
          <span className="text-xs text-[#9CA89C]"> › </span>
          <span className="text-xs text-[#5F6368] truncate">{displayUrl.replace(domain + "/", "") || displayUrl}</span>
        </div>

        {/* Title — blue, clickable-looking */}
        <h3 className="text-xl text-[#1A0DAB] hover:underline cursor-pointer font-normal leading-tight mb-1">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#4D5156] leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
}
