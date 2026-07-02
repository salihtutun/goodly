import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Home, Search, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function NotFound() {
  usePageMeta({ title: "Page Not Found — Goodly", description: "The page you're looking for doesn't exist." });

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <div className="h-24 w-24 rounded-full bg-[#F3F0E9] flex items-center justify-center">
            <Leaf size={48} className="text-[#81B29A]" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="font-display font-bold text-6xl text-[#1A201A] tracking-tight">404</h1>
        <p className="mt-4 text-xl text-[#5C685C]">
          This page has gone to seed.
        </p>
        <p className="mt-2 text-[#5C685C]">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
            <Link to="/"><Home size={16} className="mr-2" />Go to homepage</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9]">
            <Link to="/audit"><Search size={16} className="mr-2" />Run a free audit</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9]">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
