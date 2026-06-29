import { Leaf } from "lucide-react";

export function Logo({ size = "md", showWord = true }) {
  const s = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div className="flex items-center gap-2.5" data-testid="brand-logo">
      <div className={`${s} rounded-2xl bg-[#2D3E32] flex items-center justify-center`}>
        <Leaf className="text-[#FDFBF7]" strokeWidth={2} size={size === "lg" ? 22 : 18} />
      </div>
      {showWord && (
        <span className="font-display font-bold text-[#1A201A] text-xl tracking-tight">
          good<span className="text-[#E07A5F]">ly</span>
        </span>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]" data-testid="page-loader">
      <Leaf className="loader-leaf text-[#81B29A]" size={42} />
    </div>
  );
}

export function ScoreRing({ score, label, size = 100, testId }) {
  const safe = Math.max(0, Math.min(100, score ?? 0));
  const color = safe >= 75 ? "#81B29A" : safe >= 50 ? "#E6A57E" : "#E07A5F";
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (safe / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2" data-testid={testId}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#E5E0D8" strokeWidth="8" fill="none" />
          <circle
            cx={size/2} cy={size/2} r={radius}
            stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-2xl text-[#1A201A]">{safe}</span>
        </div>
      </div>
      {label && <span className="text-xs text-[#5C685C] text-center font-medium">{label}</span>}
    </div>
  );
}

export function Eyebrow({ children, className = "" }) {
  return <div className={`label-eyebrow ${className}`}>{children}</div>;
}
