import { Button } from "@/components/ui/button";
import { Share2, Twitter, Link2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { FRONTEND_URL } from "@/lib/env";
import { toast } from "sonner";

export default function ShareAudit({ score, url }) {
  const [copied, setCopied] = useState(false);

  const shareText = `My website ${url} scored ${score}/100 on Goodly's free SEO audit. See how your site ranks: ${FRONTEND_URL}/audit`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/audit`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 bg-white border border-[#E5E0D8] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-[#E07A5F]/15 flex items-center justify-center">
          <Share2 size={20} className="text-[#E07A5F]" />
        </div>
        <div>
          <div className="font-display font-bold text-[#1A201A]">Share your score</div>
          <div className="text-sm text-[#5C685C]">Help other small businesses get found.</div>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Twitter size={16} /> Share on X
        </a>
        <Button
          onClick={copyLink}
          variant="outline"
          className="border-[#E5E0D8] text-[#1A201A] hover:bg-[#F3F0E9] rounded-full px-5"
        >
          {copied ? <CheckCircle2 size={16} className="text-[#81B29A]" /> : <Link2 size={16} />}
          <span className="ml-1.5">{copied ? "Copied!" : "Copy link"}</span>
        </Button>
      </div>
    </div>
  );
}
