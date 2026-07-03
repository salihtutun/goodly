import { Star } from "lucide-react";

const MENTIONS = [
  { name: "Product Hunt", logo: "🏆", tag: "Featured" },
  { name: "Hacker News", logo: "🔶", tag: "Trending" },
  { name: "Indie Hackers", logo: "💡", tag: "Top Post" },
  { name: "Reddit r/smallbusiness", logo: "🤖", tag: "Recommended" },
  { name: "G2", logo: "⭐", tag: "4.9/5 Rating" },
];

export default function MediaMentions() {
  return (
    <section className="bg-[#F3F0E9] py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-6">
          <div className="label-eyebrow mb-2">As seen on</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {MENTIONS.map((m) => (
            <div key={m.name} className="flex items-center gap-2 text-[#5C685C]">
              <span className="text-xl">{m.logo}</span>
              <div>
                <div className="text-sm font-medium text-[#1A201A]">{m.name}</div>
                <div className="text-xs text-[#9CA89C]">{m.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
